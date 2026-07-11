import os
import csv
import io
import joblib
import pandas as pd
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from . import models, schemas
from .database import engine, get_db

# Create DB Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Expense Guardian API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon demo purposes
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
        current_hour = datetime.now(timezone.utc).hour

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
        date=datetime.fromisoformat(tx.date.replace('Z', '+00:00')) if tx.date else datetime.now(timezone.utc)
    )

    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx


@app.get("/transactions", response_model=List[schemas.TransactionResponse])
def get_transactions(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Search merchant or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    is_fraud: Optional[bool] = Query(None, description="Filter by fraud status"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Transaction)

    # Search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            models.Transaction.merchant.ilike(search_term) |
            models.Transaction.description.ilike(search_term)
        )

    # Category filter
    if category:
        query = query.filter(models.Transaction.category == category)

    # Fraud filter
    if is_fraud is not None:
        query = query.filter(models.Transaction.is_fraud == is_fraud)

    # Date range filter
    if date_from:
        query = query.filter(models.Transaction.date >= datetime.fromisoformat(date_from))
    if date_to:
        # Add a day to include the end date fully
        end_date = datetime.fromisoformat(date_to).replace(hour=23, minute=59, second=59)
        query = query.filter(models.Transaction.date <= end_date)

    transactions = query.order_by(models.Transaction.date.desc()).offset(skip).limit(limit).all()
    return transactions


@app.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    tx = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(tx)
    db.commit()
    return {"message": "Transaction deleted", "id": transaction_id}


@app.get("/analytics/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    """Returns aggregated analytics: category breakdown, top merchants, totals."""
    transactions = db.query(models.Transaction).all()

    if not transactions:
        return {
            "total_spend": 0,
            "total_transactions": 0,
            "total_fraud": 0,
            "category_breakdown": [],
            "top_merchants": [],
            "monthly_spend": [],
        }

    total_spend = sum(tx.amount for tx in transactions)
    total_fraud = sum(1 for tx in transactions if tx.is_fraud)

    # Category breakdown
    category_map = {}
    for tx in transactions:
        cat = tx.category or "Unknown"
        category_map[cat] = category_map.get(cat, 0) + tx.amount
    category_breakdown = [
        {"category": k, "amount": round(v, 2)}
        for k, v in sorted(category_map.items(), key=lambda x: x[1], reverse=True)
    ]

    # Top merchants
    merchant_map = {}
    for tx in transactions:
        merchant_map[tx.merchant] = merchant_map.get(tx.merchant, 0) + tx.amount
    top_merchants = [
        {"merchant": k, "amount": round(v, 2)}
        for k, v in sorted(merchant_map.items(), key=lambda x: x[1], reverse=True)[:7]
    ]

    # Monthly spend (last 6 months)
    monthly_map = {}
    for tx in transactions:
        month_key = tx.date.strftime("%Y-%m") if tx.date else "Unknown"
        monthly_map[month_key] = monthly_map.get(month_key, 0) + tx.amount
    monthly_spend = [
        {"month": k, "amount": round(v, 2)}
        for k, v in sorted(monthly_map.items())[-6:]
    ]

    return {
        "total_spend": round(total_spend, 2),
        "total_transactions": len(transactions),
        "total_fraud": total_fraud,
        "category_breakdown": category_breakdown,
        "top_merchants": top_merchants,
        "monthly_spend": monthly_spend,
    }


@app.get("/analytics/categories")
def get_categories(db: Session = Depends(get_db)):
    """Returns a list of unique categories for filtering."""
    categories = db.query(models.Transaction.category).distinct().all()
    return [c[0] for c in categories if c[0]]


@app.get("/transactions/export")
def export_transactions(db: Session = Depends(get_db)):
    """Export all transactions as a downloadable CSV file."""
    transactions = db.query(models.Transaction).order_by(models.Transaction.date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Date", "Merchant", "Description", "Amount", "Category", "Is Fraud", "Anomaly Score"])

    for tx in transactions:
        writer.writerow([
            tx.id,
            tx.date.strftime("%Y-%m-%d %H:%M:%S") if tx.date else "",
            tx.merchant,
            tx.description,
            tx.amount,
            tx.category,
            tx.is_fraud,
            tx.anomaly_score,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions_export.csv"}
    )


from pydantic import BaseModel
class ChatRequest(BaseModel):
    message: str

@app.get("/analytics/subscriptions")
def get_subscriptions(db: Session = Depends(get_db)):
    """Detect recurring subscriptions based on identical amounts from the same merchant."""
    transactions = db.query(models.Transaction).all()
    
    # Group by merchant and amount
    # (A real app would check date frequencies, this is a simplified hackathon logic)
    merchant_amounts = {}
    for tx in transactions:
        key = (tx.merchant, tx.amount)
        if key not in merchant_amounts:
            merchant_amounts[key] = []
        merchant_amounts[key].append(tx)
        
    subscriptions = []
    total_fixed_costs = 0
    
    for (merchant, amount), txs in merchant_amounts.items():
        if len(txs) >= 2: # At least 2 payments of the exact same amount
            subscriptions.append({
                "merchant": merchant,
                "amount": amount,
                "frequency": "Monthly",
                "last_paid": txs[-1].date.strftime("%b %d, %Y") if txs[-1].date else "Unknown",
                "tx_id": txs[-1].id
            })
            total_fixed_costs += amount
            
    # Sort by amount descending
    subscriptions.sort(key=lambda x: x["amount"], reverse=True)
    
    return {
        "subscriptions": subscriptions,
        "total_fixed_costs": total_fixed_costs
    }

@app.post("/ai/chat")
def ai_advisor_chat(request: ChatRequest, db: Session = Depends(get_db)):
    """Simple rule-based AI advisor logic."""
    msg = request.message.lower()
    
    transactions = db.query(models.Transaction).all()
    total_spend = sum(tx.amount for tx in transactions)
    
    response = "I'm your Financial Guardian AI. I can analyze your spending!"
    
    if "save" in msg or "advice" in msg or "tips" in msg:
        # Find top spending category
        cat_map = {}
        for tx in transactions:
            cat = tx.category or "Unknown"
            cat_map[cat] = cat_map.get(cat, 0) + tx.amount
        
        if cat_map:
            top_cat = max(cat_map, key=cat_map.get)
            response = f"I noticed you spend the most on {top_cat} (${cat_map[top_cat]:.2f}). Try cutting back there to save money!"
        else:
            response = "Try reducing your discretionary spending to save more this month."
            
    elif "total" in msg or "how much" in msg or "spend" in msg:
        response = f"You've spent a total of ${total_spend:.2f} across {len(transactions)} transactions."
        
    elif "fraud" in msg or "safe" in msg or "secure" in msg:
        fraud_count = sum(1 for tx in transactions if tx.is_fraud)
        if fraud_count > 0:
            response = f"I've detected {fraud_count} anomalous transactions. Please review your ledger immediately."
        else:
            response = "Your account is secure. No fraudulent activity detected by our neural networks."
    else:
        response = "I'm analyzing your ledger... Can you be more specific? Ask about 'how to save', 'total spend', or 'fraud alerts'."
        
    return {"reply": response}

@app.get("/")
def read_root():
    return {"status": "healthy", "message": "Smart Expense Guardian API is running"}
