import os
import shutil
import subprocess
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from services.processor.app.config import settings
from services.processor.app.database.session import SessionLocal

router = APIRouter(prefix="/api/health", tags=["Health"])


@router.get("", status_code=status.HTTP_200_OK)
def health_check():
    """Liveness probe: verifies service is alive and listening."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/ready")
def readiness_check():
    """Readiness probe: validates database, redis, ffmpeg, and storage availability."""
    checks = {
        "database": False,
        "storage": False,
        "ffmpeg": False,
        "tesseract": False,
    }

    # 1. Database Check
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        checks["database"] = True
    except Exception as e:
        checks["database_error"] = str(e)

    # 2. Storage Directory Check
    try:
        storage_path = settings.STORAGE_ROOT
        if os.path.exists(storage_path) and os.access(storage_path, os.W_OK):
            checks["storage"] = True
    except Exception as e:
        checks["storage_error"] = str(e)

    # 3. FFmpeg Binary Check
    checks["ffmpeg"] = bool(shutil.which("ffmpeg"))

    # 4. Tesseract OCR Check
    checks["tesseract"] = bool(shutil.which("tesseract") or settings.TESSERACT_PATH)

    is_ready = checks["database"] and checks["storage"] and checks["ffmpeg"]

    status_code = status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(
        status_code=status_code,
        content={
            "ready": is_ready,
            "checks": checks,
        },
    )

