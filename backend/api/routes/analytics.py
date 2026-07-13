from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from backend.database import SessionLocal, get_db
from backend.repository import transaction_repo
from backend.api.deps import get_current_user
from backend.domain.models import User, Transaction

router = APIRouter()

@router.get("/summary")
def get_analytics_summary(account_name: Optional[str] = Query(None, description="Filter by account"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Base query for user and account
    base_query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if account_name:
        base_query = base_query.filter(Transaction.account_name == account_name)

    total_spend = base_query.with_entities(func.coalesce(func.sum(Transaction.amount), 0)).scalar()
    total_transactions = base_query.count()
    total_fraud = base_query.filter(Transaction.is_fraud == True).count()

    # Category breakdown query
    cat_query = db.query(Transaction.category, func.sum(Transaction.amount)).filter(Transaction.user_id == current_user.id)
    if account_name:
        cat_query = cat_query.filter(Transaction.account_name == account_name)
    category_totals = cat_query.group_by(Transaction.category).order_by(func.sum(Transaction.amount).desc()).all()

    # Merchant breakdown query
    merch_query = db.query(Transaction.merchant, func.sum(Transaction.amount)).filter(Transaction.user_id == current_user.id)
    if account_name:
        merch_query = merch_query.filter(Transaction.account_name == account_name)
    merchant_totals = merch_query.group_by(Transaction.merchant).order_by(func.sum(Transaction.amount).desc()).limit(5).all()

    return {
        "total_spend": float(total_spend),
        "total_transactions": total_transactions,
        "total_fraud": total_fraud,
        "category_breakdown": [{"category": k, "amount": float(v)} for k, v in category_totals if k],
        "top_merchants": [{"merchant": k, "amount": float(v)} for k, v in merchant_totals if k]
    }

@router.get("/categories")
def get_categories(account_name: Optional[str] = Query(None, description="Filter by account"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return transaction_repo.get_categories(db, current_user.id, account_name)

@router.get("/subscriptions")
def get_subscriptions(account_name: Optional[str] = Query(None, description="Filter by account"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(
        Transaction.merchant, 
        Transaction.amount, 
        func.max(Transaction.date).label('last_paid'),
        func.max(Transaction.id).label('tx_id')
    ).filter(Transaction.user_id == current_user.id)
    
    if account_name:
        query = query.filter(Transaction.account_name == account_name)

    recurring = query.group_by(Transaction.merchant, Transaction.amount)\
        .having(func.count(Transaction.id) >= 2)\
        .order_by(Transaction.amount.desc()).all()

    total_fixed_costs = sum(float(r[1]) for r in recurring)
    subscriptions = []
    
    for r in recurring:
        subscriptions.append({
            "merchant": r[0],
            "amount": float(r[1]),
            "frequency": "Monthly",
            "last_paid": r[2].strftime("%b %d, %Y") if r[2] else "Unknown",
            "tx_id": r[3]
        })

    return {
        "subscriptions": subscriptions,
        "total_fixed_costs": total_fixed_costs
    }
