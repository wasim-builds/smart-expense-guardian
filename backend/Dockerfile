FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy source code and models
COPY backend/ ./backend/
COPY models/ ./models/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Make sure Python can find the backend package
ENV PYTHONPATH=/app

# Start Celery in the background, then run FastAPI in the foreground
CMD ["sh", "-c", "alembic upgrade head && celery -A backend.workers.celery_app:celery_app worker --loglevel=info & uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
