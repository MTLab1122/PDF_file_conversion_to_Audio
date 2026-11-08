from celery import Celery
from services.processor.app.config import settings

celery_app = Celery(
    "pdf_to_audio_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["services.processor.app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # High-reliability task execution
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_default_queue="conversions",
    task_routes={
        "services.processor.app.workers.tasks.process_conversion_pipeline": {"queue": "conversions"},
        "services.processor.app.workers.tasks.cleanup_expired_storage": {"queue": "maintenance"},
    },
    worker_prefetch_multiplier=1, # prevent a worker from hoarding tasks
    task_track_started=True,
    task_time_limit=1800, # 30 min max per conversion
    task_soft_time_limit=1500,
)

