import sys
sys.path.append('backend')
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

with open('test.csv', 'rb') as f:
    response = client.post("/transactions/upload", files={"file": ("test.csv", f, "text/csv")}, data={"account_name": "Main Account"})
    print(response.status_code)
    print(response.text)
