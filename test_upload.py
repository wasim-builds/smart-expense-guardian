import requests
import json

# 1. Login to get token
login_data = {
    "username": "test@example.com",
    "password": "password123"
}
# First register
requests.post("http://localhost:8000/auth/register", json={"email": "test@example.com", "password": "password123"})

# Login
res = requests.post("http://localhost:8000/auth/login", data=login_data)
token = res.json()["access_token"]
print("Token:", token)

# 2. Upload CSV
headers = {
    "Authorization": f"Bearer {token}"
}
with open("test_large.csv", "rb") as f:
    files = {"file": ("test_large.csv", f.read(), "text/csv")}

data = {
    "account_name": "Main Account"
}

upload_res = requests.post("http://localhost:8000/transactions/upload", headers=headers, files=files, data=data)
print("Upload status:", upload_res.status_code)
import time
job_id = upload_res.json()["job_id"]
print("Polling status for job:", job_id)

for i in range(5):
    time.sleep(2)
    status_res = requests.get(f"http://localhost:8000/transactions/upload/status/{job_id}", headers=headers)
    print("Status:", status_res.json())
