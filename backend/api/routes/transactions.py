from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import io
import csv
import pandas as pd

from backend.database import SessionLocal, get_db
from backend.domain import schemas
from backend.repository import transaction_repo
from backend.services.ml_service import analyze_transaction
from backend.workers.tasks import process_csv_batch
from backend.workers.celery_app import celery_app
from backend.api.deps import get_current_user
from backend.domain.models import User
from celery.result import AsyncResult

router = APIRouter()

@router.post("/", response_model=schemas.TransactionResponse)
def add_transaction(tx: schemas.TransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    category, is_anomaly, anomaly_score = analyze_transaction(tx)
    return transaction_repo.create_transaction(db, current_user.id, tx, category, is_anomaly, anomaly_score)

@router.get("/", response_model=List[schemas.TransactionResponse])
def read_transactions(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    category: Optional[str] = None,
    account_name: Optional[str] = Query(None, description="Filter by account"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txs = transaction_repo.get_transactions(db, current_user.id, account_name=account_name, search=search, category=category)
    return txs[skip : skip + limit]

@router.post("/upload")
async def upload_transactions(file: UploadFile = File(...), account_name: str = Form("Main Account"), current_user: User = Depends(get_current_user)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    content_bytes = await file.read()
    content_str = content_bytes.decode('utf-8')
    
    # Offload processing to Celery background worker
    task = process_csv_batch.delay(content_str, account_name, current_user.id)
    
    return {"message": "Upload accepted. Processing in background.", "job_id": task.id}

@router.get("/upload/status/{job_id}")
def get_upload_status(job_id: str, current_user: User = Depends(get_current_user)):
    task_result = AsyncResult(job_id, app=celery_app)
    result = {
        "job_id": job_id,
        "status": task_result.status,
    }
    if task_result.status == 'PROGRESS':
        result["progress"] = task_result.info
    elif task_result.status == 'SUCCESS':
        result["result"] = task_result.info.get('result')
    elif task_result.status == 'FAILURE':
        result["error"] = str(task_result.info)
    
    return result

@router.get("/export")
def export_transactions(account_name: Optional[str] = Query(None, description="Filter by account"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transactions = transaction_repo.get_all_transactions(db, current_user.id, account_name)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Date", "Account", "Merchant", "Description", "Amount", "Category", "Is Fraud", "Anomaly Score"])
    for tx in transactions:
        writer.writerow([
            tx.id,
            tx.date.isoformat() if tx.date else "",
            tx.account_name,
            tx.merchant,
            tx.description,
            tx.amount,
            tx.category,
            tx.is_fraud,
            tx.anomaly_score
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions_export.csv"}
    )
