from sqlalchemy.orm import Session
from typing import List, Optional
from backend.domain import models, schemas
from datetime import datetime, timezone

def get_transactions(db: Session, user_id: int, account_name: Optional[str] = None, search: Optional[str] = None, category: Optional[str] = None) -> List[models.Transaction]:
    query = db.query(models.Transaction).filter(models.Transaction.user_id == user_id).order_by(models.Transaction.date.desc())
    if search:
        query = query.filter(models.Transaction.merchant.ilike(f"%{search}%"))
    if category:
        query = query.filter(models.Transaction.category == category)
    if account_name:
        query = query.filter(models.Transaction.account_name == account_name)
    return query.all()

def create_transaction(db: Session, user_id: int, tx: schemas.TransactionCreate, category: str, is_fraud: bool, anomaly_score: float) -> models.Transaction:
    db_tx = models.Transaction(
        merchant=tx.merchant,
        description=tx.description,
        amount=tx.amount,
        account_name=tx.account_name,
        category=category,
        is_fraud=is_fraud,
        anomaly_score=anomaly_score,
        user_id=user_id,
        date=datetime.fromisoformat(tx.date.replace('Z', '+00:00')) if tx.date else datetime.now(timezone.utc)
    )
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx

def get_all_transactions(db: Session, user_id: int, account_name: Optional[str] = None) -> List[models.Transaction]:
    query = db.query(models.Transaction).filter(models.Transaction.user_id == user_id).order_by(models.Transaction.date.desc())
    if account_name:
        query = query.filter(models.Transaction.account_name == account_name)
    return query.all()

def get_accounts(db: Session, user_id: int) -> List[str]:
    accounts = db.query(models.Transaction.account_name).filter(models.Transaction.user_id == user_id).distinct().all()
    account_list = [a[0] for a in accounts if a[0]]
    if "Main Account" not in account_list:
        account_list.insert(0, "Main Account")
    return account_list

def get_categories(db: Session, user_id: int, account_name: Optional[str] = None) -> List[str]:
    query = db.query(models.Transaction.category).filter(models.Transaction.user_id == user_id).distinct()
    if account_name:
        query = query.filter(models.Transaction.account_name == account_name)
    categories = query.all()
    return [c[0] for c in categories if c[0]]

def delete_transaction(db: Session, user_id: int, transaction_id: int) -> bool:
    tx = db.query(models.Transaction).filter(models.Transaction.id == transaction_id, models.Transaction.user_id == user_id).first()
    if tx:
        db.delete(tx)
        db.commit()
        return True
    return False
