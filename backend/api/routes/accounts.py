from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from backend.database import SessionLocal, get_db
from backend.repository import transaction_repo
from backend.api.deps import get_current_user
from backend.domain.models import User

router = APIRouter()

@router.get("")
def get_accounts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return transaction_repo.get_accounts(db, current_user.id)
