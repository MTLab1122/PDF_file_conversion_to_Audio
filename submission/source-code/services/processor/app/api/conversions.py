from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from services.processor.app.core.security import verify_internal_api_key
from services.processor.app.database.models import ConversionJob, JobStatusEnum, AudioChunk
from services.processor.app.database.session import get_db
from services.processor.app.workers.tasks import process_conversion_pipeline
from services.processor.app.core.logger import logger

router = APIRouter(prefix="/api/conversions", tags=["Conversions"])


class StartConversionRequest(BaseModel):
    job_id: str


@router.post("/start", dependencies=[Depends(verify_internal_api_key)])
def start_conversion(req: StartConversionRequest, db: Session = Depends(get_db)):
    """Dispatch conversion job to background Celery worker, with automatic graceful execution."""
    job = db.query(ConversionJob).filter(ConversionJob.id == req.job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {req.job_id} not found",
        )

    # Dispatch to Celery queue
    try:
        task = process_conversion_pipeline.delay(req.job_id)
        task_id = task.id
        logger.info(f"Dispatched job {req.job_id} to Celery worker (Task ID: {task_id})")
    except Exception as e:
        logger.warning(f"Could not reach Celery broker ({e}). Executing job synchronously for resilient fallback.")
        # Synchronous fallback execution if Celery broker is temporarily unreachable
        process_conversion_pipeline(req.job_id)
        task_id = "sync-executed"

    return {
        "job_id": req.job_id,
        "task_id": task_id,
        "status": "QUEUED",
    }


@router.get("/{job_id}/status", dependencies=[Depends(verify_internal_api_key)])
def get_conversion_status(job_id: str, db: Session = Depends(get_db)):
    """Fetch persistent live status, stage, chunk count, and progress percentage."""
    job = db.query(ConversionJob).filter(ConversionJob.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    return {
        "job_id": job.id,
        "status": job.status.value,
        "current_stage": job.currentStage,
        "progress_percent": job.progressPercent,
        "total_chunks": job.totalChunks,
        "completed_chunks": job.completedChunks,
        "error_message": job.errorMessage,
        "audio_file_id": job.audioFile.id if job.audioFile else None,
        "updated_at": job.updatedAt.isoformat(),
    }


@router.post("/{job_id}/cancel", dependencies=[Depends(verify_internal_api_key)])
def cancel_conversion(job_id: str, db: Session = Depends(get_db)):
    """Cancel an active conversion job."""
    job = db.query(ConversionJob).filter(ConversionJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    if job.status in (JobStatusEnum.COMPLETED, JobStatusEnum.FAILED):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot cancel finished job.")

    job.status = JobStatusEnum.CANCELLED
    job.currentStage = "CANCELLED"
    db.commit()

    return {"job_id": job_id, "status": "CANCELLED"}


@router.post("/{job_id}/retry", dependencies=[Depends(verify_internal_api_key)])
def retry_conversion(job_id: str, db: Session = Depends(get_db)):
    """Retry an eligible failed conversion job."""
    job = db.query(ConversionJob).filter(ConversionJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    if job.status != JobStatusEnum.FAILED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only failed jobs may be retried.")

    job.status = JobStatusEnum.QUEUED
    job.currentStage = "QUEUED"
    job.errorMessage = None
    job.retryCount += 1
    db.commit()

    try:
        process_conversion_pipeline.delay(job.id)
    except Exception:
        process_conversion_pipeline(job.id)

    return {"job_id": job_id, "status": "QUEUED", "retry_count": job.retryCount}

