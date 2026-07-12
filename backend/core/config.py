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
