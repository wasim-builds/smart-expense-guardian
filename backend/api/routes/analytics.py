from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import SessionLocal, get_db
from backend.repository import transaction_repo

router = APIRouter()

@router.get("/summary")
def get_analytics_summary(account_name: Optional[str] = Query(None, description="Filter by account"), db: Session = Depends(get_db)):
    transactions = transaction_repo.get_all_transactions(db, account_name)
    
    total_spend = sum(tx.amount for tx in transactions)
    total_fraud = sum(1 for tx in transactions if tx.is_fraud)
    
    category_totals = {}
    for tx in transactions:
        category_totals[tx.category] = category_totals.get(tx.category, 0) + tx.amount
        
    sorted_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "total_spend": total_spend,
        "total_transactions": len(transactions),
        "total_fraud": total_fraud,
        "category_breakdown": [{"category": k, "amount": v} for k, v in sorted_categories]
    }

@router.get("/categories")
def get_categories(account_name: Optional[str] = Query(None, description="Filter by account"), db: Session = Depends(get_db)):
    return transaction_repo.get_categories(db, account_name)

@router.get("/subscriptions")
def get_subscriptions(account_name: Optional[str] = Query(None, description="Filter by account"), db: Session = Depends(get_db)):
    transactions = transaction_repo.get_all_transactions(db, account_name)
    
    merchant_amounts = {}
    for tx in transactions:
        key = (tx.merchant, tx.amount)
        if key not in merchant_amounts:
            merchant_amounts[key] = []
        merchant_amounts[key].append(tx)
        
    subscriptions = []
    total_fixed_costs = 0
    
    for (merchant, amount), txs in merchant_amounts.items():
        if len(txs) >= 2:
            subscriptions.append({
                "merchant": merchant,
                "amount": amount,
                "frequency": "Monthly",
                "last_paid": txs[-1].date.strftime("%b %d, %Y") if txs[-1].date else "Unknown",
                "tx_id": txs[-1].id
            })
            total_fixed_costs += amount
            
    subscriptions.sort(key=lambda x: x["amount"], reverse=True)
    
    return {
        "subscriptions": subscriptions,
        "total_fixed_costs": total_fixed_costs
    }
