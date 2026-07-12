from fastapi.testclient import TestClient
from backend.main import app

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
