import os
import joblib
import pandas as pd
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from . import models, schemas
from .database import engine, get_db

# Create DB Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Expense Guardian API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For hackathon demo purposes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model variables
category_model = None
fraud_model = None
merchant_freq = None

@app.on_event("startup")
def load_models():
    global category_model, fraud_model, merchant_freq
    try:
        # Resolve paths gracefully
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        category_model = joblib.load(os.path.join(base_dir, 'models', 'category_model.pkl'))
        fraud_model = joblib.load(os.path.join(base_dir, 'models', 'fraud_model.pkl'))
        try:
            merchant_freq = joblib.load(os.path.join(base_dir, 'models', 'merchant_freq.pkl'))
        except:
            merchant_freq = {}
        print("Models loaded successfully.")
    except Exception as e:
        print(f"Warning: Failed to load models on startup: {e}")

@app.post("/transactions", response_model=schemas.TransactionResponse)
def create_transaction(tx: schemas.TransactionCreate, db: Session = Depends(get_db)):
    # 1. Categorize
    category = "Unknown"
    if category_model:
        pred = category_model.predict([tx.description])
        category = pred[0]
        
    # 2. Check Fraud
    is_anomaly = False
    anomaly_score = 0.0
    if fraud_model:
        freq = merchant_freq.get(tx.merchant, 1) if merchant_freq else 1
        current_hour = datetime.utcnow().hour
        
        df = pd.DataFrame([{
            'amount': tx.amount,
            'hour': current_hour,
            'merchant_freq': freq
        }])
        
        is_anomaly = bool(fraud_model.predict(df)[0] == -1)
        anomaly_score = float(fraud_model.score_samples(df)[0])
        
    # 3. Save to Database
    db_tx = models.Transaction(
        merchant=tx.merchant,
        description=tx.description,
        amount=tx.amount,
        category=category,
        is_fraud=is_anomaly,
        anomaly_score=anomaly_score,
        date=datetime.fromisoformat(tx.date.replace('Z', '+00:00')) if tx.date else datetime.utcnow()
    )
    
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx

@app.get("/transactions", response_model=List[schemas.TransactionResponse])
def get_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).order_by(models.Transaction.date.desc()).offset(skip).limit(limit).all()
    return transactions

@app.get("/")
def read_root():
    return {"status": "healthy", "message": "Smart Expense Guardian API is running"}
