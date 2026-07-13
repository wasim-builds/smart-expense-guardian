from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://seg_user:seg_password@localhost:5432/smart_expense"
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "amqp://seg_user:seg_password@localhost:5672//"
    celery_result_backend: str = "redis://localhost:6379/1"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# SQLAlchemy 1.4+ requires postgresql:// instead of postgres://
# Render provides the DATABASE_URL with postgres://, so we must fix it.
if settings.database_url and settings.database_url.startswith("postgres://"):
    settings.database_url = settings.database_url.replace("postgres://", "postgresql://", 1)
