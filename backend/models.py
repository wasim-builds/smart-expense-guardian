from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
import datetime
from .database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    merchant = Column(String, index=True)
    description = Column(String)
    amount = Column(Float)
    category = Column(String, index=True)
    is_fraud = Column(Boolean, default=False)
    anomaly_score = Column(Float, nullable=True)
