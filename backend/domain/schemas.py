from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TransactionCreate(BaseModel):
    merchant: str
    description: str
    amount: float
    account_name: Optional[str] = "Main Account"
    date: Optional[str] = None

class TransactionResponse(BaseModel):
    id: int
    merchant: str
    description: str
    amount: float
    account_name: str
    category: str
    is_fraud: bool
    anomaly_score: Optional[float]
    date: datetime

    class Config:
        from_attributes = True
