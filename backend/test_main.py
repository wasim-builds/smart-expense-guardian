import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import app, load_models
from backend.database import Base, get_db
from backend import models

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

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    # Load ML models
    load_models()
    yield
    Base.metadata.drop_all(bind=engine)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "message": "Smart Expense Guardian API is running"}

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
