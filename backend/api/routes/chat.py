from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from backend.database import SessionLocal, get_db
from backend.repository import transaction_repo
from backend.api.deps import get_current_user
from backend.domain.models import User

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/")
def ai_advisor_chat(request: ChatRequest, account_name: Optional[str] = Query(None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    msg = request.message.lower()
    
    transactions = transaction_repo.get_all_transactions(db, current_user.id, account_name)
    total_spend = sum(tx.amount for tx in transactions)
    
    response = "I'm your Financial Guardian AI. I can analyze your spending!"
    if "total" in msg or "spend" in msg:
        response = f"Your total recorded spend is ${total_spend:,.2f}."
    elif "fraud" in msg or "anomaly" in msg:
        fraud_txs = [tx for tx in transactions if tx.is_fraud]
        response = f"I have detected {len(fraud_txs)} potentially fraudulent transactions."
    
    return {"reply": response}
