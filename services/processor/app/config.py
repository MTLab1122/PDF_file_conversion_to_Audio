from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "PDF-to-Audio Processing Service"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/pdf_to_audio?schema=public"

    # Redis & Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # Security & Internal Auth
    INTERNAL_API_KEY: str = "antigravity-internal-secret-token"

    # Storage
    STORAGE_ROOT: str = str(Path(__file__).resolve().parent.parent.parent.parent / "storage")
    STORAGE_PROVIDER: str = "local" # local or s3
    S3_ENDPOINT: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_BUCKET_NAME: str = "pdf-to-audio-documents"
    S3_REGION: str = "us-east-1"

    # TTS Settings
    TTS_PROVIDER: str = "edge" # edge, azure, mock
    AZURE_SPEECH_KEY: Optional[str] = None
    AZURE_SPEECH_REGION: Optional[str] = None

    # Processing Limits
    MAX_UPLOAD_SIZE_MB: int = 50
    MAX_PAGES_LIMIT: int = 500
    MAX_CONCURRENT_JOBS_PER_USER: int = 3
    DEFAULT_CHUNK_SIZE_CHARS: int = 1000
    OCR_RESOLUTION_DPI: int = 300

    # OCR Settings
    TESSERACT_PATH: Optional[str] = None
    OCR_DEFAULT_LANGUAGES: str = "eng,spa,fra,deu"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

