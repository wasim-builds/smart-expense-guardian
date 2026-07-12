from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
import datetime
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    transactions = relationship("Transaction", back_populates="owner")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    merchant = Column(String, index=True)
    description = Column(String)
    amount = Column(Float)
    account_name = Column(String, index=True, default="Main Account")
    category = Column(String, index=True)
    is_fraud = Column(Boolean, default=False)
    anomaly_score = Column(Float, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="transactions")
