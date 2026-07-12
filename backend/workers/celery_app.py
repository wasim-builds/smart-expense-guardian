from celery import Celery
from backend.core.config import settings

celery_app = Celery(
    "seg_worker",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["backend.workers.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
