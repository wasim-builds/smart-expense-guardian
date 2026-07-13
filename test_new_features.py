from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import app
from backend.domain.models import Base, User
from backend.database import get_db
from backend.api.deps import get_current_user

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

def override_get_current_user():
    return User(id=1, email="test@example.com", hashed_password="hashed")

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

def test_new_features():
    print("Testing /analytics/subscriptions")
    res = client.get("/analytics/subscriptions")
    print(res.status_code, res.json())
    assert res.status_code == 200

    print("Testing /ai/chat")
    res = client.post("/ai/chat", json={"message": "how much did I spend total?"})
    print(res.status_code, res.json())
    assert res.status_code == 200
    
    print("All backend tests passed!")

if __name__ == "__main__":
    test_new_features()
