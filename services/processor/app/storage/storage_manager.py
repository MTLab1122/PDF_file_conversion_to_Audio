import os
import shutil
import uuid
from pathlib import Path
from typing import Optional
from services.processor.app.config import settings
from services.processor.app.core.exceptions import StorageAccessError
from services.processor.app.core.logger import logger


class StorageManager:
    """Manages file storage safely, preventing path traversal and handling file lifecycles."""

    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or settings.STORAGE_ROOT).resolve()
        self.uploads_dir = self.base_dir / "uploads"
        self.chunks_dir = self.base_dir / "chunks"
        self.audio_dir = self.base_dir / "audio"

        # Ensure directories exist
        for d in [self.uploads_dir, self.chunks_dir, self.audio_dir]:
            d.mkdir(parents=True, exist_ok=True)

    def _resolve_safe_path(self, target_dir: Path, filename: str) -> Path:
        """Resolve path and verify it stays strictly inside target directory."""
        # Clean path of directory navigation attempts
        safe_name = os.path.basename(filename)
        resolved = (target_dir / safe_name).resolve()
        if not str(resolved).startswith(str(target_dir)):
            raise StorageAccessError(f"Potential path traversal attempt detected for '{filename}'")
        return resolved

    def save_upload(self, file_bytes: bytes, original_filename: str) -> tuple[str, str, int]:
        """Save an uploaded PDF with a randomized unique filename.
        Returns (unique_filename, absolute_path, file_size_bytes).
        """
        ext = os.path.splitext(original_filename)[1].lower() or ".pdf"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        destination = self._resolve_safe_path(self.uploads_dir, unique_name)

        try:
            with open(destination, "wb") as f:
                f.write(file_bytes)
            size = destination.stat().st_size
            logger.info(f"Saved uploaded document: {unique_name} ({size} bytes)")
            return unique_name, str(destination), size
        except Exception as e:
            raise StorageAccessError(f"Failed to persist uploaded document: {e}")

    def get_upload_path(self, filename: str) -> str:
        """Get verified path for an uploaded document."""
        path = self._resolve_safe_path(self.uploads_dir, filename)
        if not path.exists():
            raise StorageAccessError(f"Uploaded file '{filename}' does not exist.")
        return str(path)

    def get_chunk_path(self, job_id: str, chunk_index: int) -> str:
        """Generate safe path for a temporary audio chunk."""
        job_chunk_dir = self.chunks_dir / job_id
        job_chunk_dir.mkdir(parents=True, exist_ok=True)
        chunk_file = f"chunk_{chunk_index:05d}.mp3"
        return str(job_chunk_dir / chunk_file)

    def get_final_audio_path(self, filename: str) -> str:
        """Generate path for final assembled audio file."""
        return str(self._resolve_safe_path(self.audio_dir, filename))

    def cleanup_job_chunks(self, job_id: str) -> None:
        """Safely delete all temporary chunk files for a given job."""
        job_chunk_dir = (self.chunks_dir / job_id).resolve()
        if job_chunk_dir.exists() and str(job_chunk_dir).startswith(str(self.chunks_dir)):
            try:
                shutil.rmtree(job_chunk_dir)
                logger.info(f"Cleaned up chunks directory for job {job_id}")
            except Exception as e:
                logger.warning(f"Error cleaning up chunks for job {job_id}: {e}")

    def delete_file(self, file_path: str) -> bool:
        """Safely delete an arbitrary managed file within storage boundaries."""
        try:
            path = Path(file_path).resolve()
            if str(path).startswith(str(self.base_dir)) and path.exists():
                path.unlink()
                return True
        except Exception as e:
            logger.warning(f"Failed to delete file '{file_path}': {e}")
        return False


storage_manager = StorageManager()

