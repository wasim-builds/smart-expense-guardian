from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from backend.database import SessionLocal, get_db
from backend.repository import transaction_repo

router = APIRouter()

@router.get("/")
def get_accounts(db: Session = Depends(get_db)):
    return transaction_repo.get_accounts(db)
