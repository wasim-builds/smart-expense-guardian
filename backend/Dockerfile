FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY backend/ ./backend/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Make sure Python can find the backend package
ENV PYTHONPATH=/app

# Command is overridden in docker-compose.yml depending on the service
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
