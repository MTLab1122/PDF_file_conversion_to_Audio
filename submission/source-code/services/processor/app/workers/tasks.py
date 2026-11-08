import asyncio
import os
import time
from datetime import datetime
from services.processor.app.audio.merger import AudioMerger
from services.processor.app.chunking.chunker import text_chunker
from services.processor.app.config import settings
from services.processor.app.core.exceptions import ProcessingBaseException
from services.processor.app.core.logger import logger
from services.processor.app.core.security import compute_file_sha256
from services.processor.app.database.models import (
    AudioChunk,
    AudioFile,
    AuditLog,
    ChunkStatusEnum,
    ConversionJob,
    Document,
    JobStatusEnum,
)
from services.processor.app.database.session import SessionLocal
from services.processor.app.extraction.extractor import PDFExtractor
from services.processor.app.extraction.pdf_safety import PDFSafetyValidator
from services.processor.app.ocr.ocr_engine import ocr_engine
from services.processor.app.preprocessing.cleaner import TextCleaner
from services.processor.app.storage.storage_manager import storage_manager
from services.processor.app.tts.factory import TTSProviderFactory
from services.processor.app.workers.celery_app import celery_app


def run_async(coro):
    """Run an async coroutine synchronously inside Celery task."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


@celery_app.task(
    bind=True,
    name="services.processor.app.workers.tasks.process_conversion_pipeline",
    max_retries=2,
    default_retry_delay=10,
)
def process_conversion_pipeline(self, job_id: str):
    """Orchestrates the complete end-to-end PDF-to-Audio conversion pipeline asynchronously."""
    db = SessionLocal()
    logger.info(f"Starting conversion pipeline task for Job {job_id}")

    try:
        job = db.query(ConversionJob).filter(ConversionJob.id == job_id).first()
        if not job:
            logger.error(f"Job {job_id} not found in database.")
            return {"status": "NOT_FOUND", "job_id": job_id}

        # Idempotency check: Don't process already completed or cancelled jobs
        if job.status in (JobStatusEnum.COMPLETED, JobStatusEnum.CANCELLED):
            logger.info(f"Job {job_id} already in terminal state ({job.status}), skipping.")
            return {"status": job.status.value, "job_id": job_id}

        document = db.query(Document).filter(Document.id == job.documentId).first()
        if not document:
            raise ProcessingBaseException(f"Associated document {job.documentId} not found.")

        # Stage 1: VALIDATING
        job.status = JobStatusEnum.VALIDATING
        job.currentStage = "VALIDATING"
        job.progressPercent = 5.0
        db.commit()

        page_count, is_encrypted = PDFSafetyValidator.validate_file(
            document.storagePath,
            max_size_mb=settings.MAX_UPLOAD_SIZE_MB,
            max_pages=settings.MAX_PAGES_LIMIT,
        )
        if document.pageCount is None:
            document.pageCount = page_count
            db.commit()

        # Stage 2: EXTRACTING
        job.status = JobStatusEnum.EXTRACTING
        job.currentStage = "EXTRACTING"
        job.progressPercent = 15.0
        db.commit()

        extracted_pages = PDFExtractor.extract_document(document.storagePath)

        # Stage 3: OCR (if required by any scanned pages)
        pages_needing_ocr = [p for p in extracted_pages if p.needs_ocr]
        if pages_needing_ocr:
            job.status = JobStatusEnum.OCR
            job.currentStage = "OCR"
            job.progressPercent = 25.0
            db.commit()

            document.isScanned = True
            document.ocrApplied = True
            db.commit()

            for p in pages_needing_ocr:
                try:
                    ocr_text = ocr_engine.ocr_page(
                        document.storagePath,
                        page_number=p.page_number,
                        language=job.language,
                    )
                    if ocr_text:
                        p.text = ocr_text
                        p.char_count = len(ocr_text)
                except Exception as e:
                    logger.warning(f"OCR failed for page {p.page_number} in job {job_id}: {e}")

        # Stage 4: PREPROCESSING
        job.status = JobStatusEnum.PREPROCESSING
        job.currentStage = "PREPROCESSING"
        job.progressPercent = 35.0
        db.commit()

        combined_raw_text = "\n\n".join(p.text for p in extracted_pages if p.text.strip())
        cleaned_text = TextCleaner.clean(combined_raw_text)

        if not cleaned_text:
            raise ProcessingBaseException("No usable text could be extracted or scanned from document.")

        # Stage 5: CHUNKING
        job.status = JobStatusEnum.CHUNKING
        job.currentStage = "CHUNKING"
        job.progressPercent = 40.0
        db.commit()

        chunks = text_chunker.chunk_document(cleaned_text)
        if not chunks:
            raise ProcessingBaseException("Text chunking produced zero manageable TTS chunks.")

        job.totalChunks = len(chunks)

        # Check existing chunks in DB (for retries)
        existing_chunks = {
            c.chunkIndex: c
            for c in db.query(AudioChunk).filter(AudioChunk.jobId == job_id).all()
        }

        chunk_records = []
        for c in chunks:
            if c.index in existing_chunks:
                record = existing_chunks[c.index]
                if record.status != ChunkStatusEnum.COMPLETED:
                    record.status = ChunkStatusEnum.PENDING
                    record.characterCount = c.character_count
                    record.textPreview = c.to_dict()["preview"]
            else:
                record = AudioChunk(
                    jobId=job.id,
                    chunkIndex=c.index,
                    characterCount=c.character_count,
                    textPreview=c.to_dict()["preview"],
                    status=ChunkStatusEnum.PENDING,
                )
                db.add(record)
            chunk_records.append(record)

        db.commit()

        # Stage 6: GENERATING_AUDIO
        job.status = JobStatusEnum.GENERATING_AUDIO
        job.currentStage = "GENERATING_AUDIO"
        job.progressPercent = 45.0
        db.commit()

        tts_provider = TTSProviderFactory.get_provider()
        completed_chunk_paths = []
        completed_count = 0

        for chunk_model, text_chunk in zip(chunk_records, chunks):
            # Check for external cancellation
            db.refresh(job)
            if job.status == JobStatusEnum.CANCELLED:
                logger.info(f"Job {job_id} cancelled during audio generation.")
                return {"status": "CANCELLED", "job_id": job_id}

            chunk_out_path = storage_manager.get_chunk_path(job.id, chunk_model.chunkIndex)

            # If already completed from previous run, reuse
            if chunk_model.status == ChunkStatusEnum.COMPLETED and os.path.exists(chunk_out_path):
                completed_chunk_paths.append(chunk_out_path)
                completed_count += 1
                continue

            chunk_model.status = ChunkStatusEnum.GENERATING
            db.commit()

            try:
                # Generate audio chunk
                run_async(
                    tts_provider.synthesize_chunk(
                        text=text_chunk.text,
                        voice_id=job.voiceId,
                        speech_speed=job.speechSpeed,
                        output_path=chunk_out_path,
                    )
                )

                chunk_model.status = ChunkStatusEnum.COMPLETED
                chunk_model.filePath = chunk_out_path
                completed_chunk_paths.append(chunk_out_path)
                completed_count += 1

            except Exception as e:
                chunk_model.status = ChunkStatusEnum.FAILED
                chunk_model.errorMessage = str(e)
                chunk_model.retryCount += 1
                db.commit()
                logger.error(f"Failed audio generation for chunk {chunk_model.chunkIndex}: {e}")
                raise e

            # Update real progress
            job.completedChunks = completed_count
            job.progressPercent = round(45.0 + (completed_count / job.totalChunks) * 45.0, 1)
            db.commit()

        # Stage 7: MERGING
        job.status = JobStatusEnum.MERGING
        job.currentStage = "MERGING"
        job.progressPercent = 92.0
        db.commit()

        final_filename = f"{job.id}.mp3"
        final_audio_path = storage_manager.get_final_audio_path(final_filename)

        duration, file_size, bitrate = AudioMerger.merge_chunks(
            chunk_file_paths=completed_chunk_paths,
            output_mp3_path=final_audio_path,
            title=document.originalName,
            artist="PDF-to-Audio Platform",
        )

        audio_hash = compute_file_sha256(final_audio_path)

        # Create or update AudioFile record
        existing_audio = db.query(AudioFile).filter(AudioFile.jobId == job.id).first()
        if existing_audio:
            existing_audio.fileSizeBytes = file_size
            existing_audio.durationSeconds = duration
            existing_audio.bitrateKbps = bitrate
            existing_audio.checksumSha256 = audio_hash
        else:
            audio_record = AudioFile(
                jobId=job.id,
                userId=job.userId,
                filename=final_filename,
                storagePath=final_audio_path,
                fileSizeBytes=file_size,
                durationSeconds=duration,
                bitrateKbps=bitrate,
                checksumSha256=audio_hash,
            )
            db.add(audio_record)

        # Clean temporary chunk files
        storage_manager.cleanup_job_chunks(job.id)

        # Stage 8: COMPLETED
        job.status = JobStatusEnum.COMPLETED
        job.currentStage = "COMPLETED"
        job.progressPercent = 100.0
        job.errorMessage = None
        db.commit()

        # Audit Log
        audit = AuditLog(
            userId=job.userId,
            action="CONVERSION_COMPLETED",
            resource="ConversionJob",
            resourceId=job.id,
            meta_data=f"Duration: {duration:.1f}s, Size: {file_size} bytes, Chunks: {job.totalChunks}",
        )
        db.add(audit)
        db.commit()

        logger.info(f"Job {job_id} completed successfully! ({duration:.1f}s MP3 generated)")
        return {
            "status": "COMPLETED",
            "job_id": job_id,
            "duration": duration,
            "size": file_size,
        }

    except Exception as e:
        logger.error(f"Pipeline failure for Job {job_id}: {str(e)}", exc_info=True)
        try:
            job = db.query(ConversionJob).filter(ConversionJob.id == job_id).first()
            if job:
                job.status = JobStatusEnum.FAILED
                job.currentStage = "FAILED"
                job.errorMessage = str(e)
                db.commit()

                audit = AuditLog(
                    userId=job.userId,
                    action="CONVERSION_FAILED",
                    resource="ConversionJob",
                    resourceId=job.id,
                    meta_data=f"Error: {str(e)}",
                )
                db.add(audit)
                db.commit()
        except Exception as db_err:
            logger.error(f"Failed to record failure state for job {job_id}: {db_err}")

        raise e

    finally:
        db.close()


@celery_app.task(name="services.processor.app.workers.tasks.cleanup_expired_storage")
def cleanup_expired_storage():
    """Periodic maintenance task to clean orphaned files or temporary chunk artifacts."""
    logger.info("Executing scheduled storage cleanup...")
    # Verify temporary directories
    chunks_base = storage_manager.chunks_dir
    now = time.time()
    for item in chunks_base.iterdir():
        if item.is_dir():
            # If older than 24 hours, prune
            if now - item.stat().st_mtime > 86400:
                storage_manager.cleanup_job_chunks(item.name)
    return {"status": "SUCCESS"}
