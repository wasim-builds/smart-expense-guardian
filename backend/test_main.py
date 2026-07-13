import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import app
from backend.domain.models import Base
from backend.database import get_db
from backend.domain import models

# Use an in-memory SQLite DB for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

from backend.api.deps import get_current_user
from backend.domain.models import User

def override_get_current_user():
    return User(id=1, email="test@example.com", hashed_password="hashed")

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Smart Expense Guardian API V2 is running!"}

def test_create_transaction():
    tx_data = {
        "merchant": "Test Merchant",
        "description": "Coffee and snacks",
        "amount": 15.50
    }
    response = client.post("/transactions", json=tx_data)
    assert response.status_code == 200
    data = response.json()
    assert data["merchant"] == "Test Merchant"
    assert data["amount"] == 15.50
    assert "category" in data
    assert "is_fraud" in data
    assert "id" in data

def test_get_transactions():
    tx_data = {
        "merchant": "Test Merchant",
        "description": "Coffee and snacks",
        "amount": 15.50
    }
    client.post("/transactions", json=tx_data)
    
    response = client.get("/transactions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["merchant"] == "Test Merchant"
