#!/bin/bash
set -e

echo "=========================================="
echo " Deploying Smart Expense Guardian"
echo "=========================================="

echo "[1/4] Pulling latest code..."
git pull origin main || echo "Not a git repository or no remote configured, skipping pull..."

echo "[2/4] Ensuring .env file exists..."
if [ ! -f .env ]; then
    echo "Creating .env from defaults. PLEASE UPDATE SECRET_KEY LATER!"
    echo "DATABASE_URL=postgresql://seg_user:seg_password@db:5432/smart_expense" > .env
    echo "REDIS_URL=redis://redis:6379/0" >> .env
    echo "CELERY_BROKER_URL=amqp://seg_user:seg_password@rabbitmq:5672//" >> .env
    echo "CELERY_RESULT_BACKEND=redis://redis:6379/1" >> .env
    echo "SECRET_KEY=$(openssl rand -hex 32)" >> .env
    echo "CORS_ORIGINS=http://localhost" >> .env
    echo "NOTE: Update CORS_ORIGINS in .env if deploying to a custom domain!"
fi

echo "[3/4] Building Docker images..."
docker-compose build

echo "[4/4] Starting services in detached mode..."
docker-compose up -d

echo "=========================================="
echo " Deployment Successful! "
echo " API: http://localhost:8000"
echo " Frontend: http://localhost (port 80)"
echo "=========================================="
