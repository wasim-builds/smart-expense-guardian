import requests
import json

# Login
login_data = {"username": "test@example.com", "password": "password123"}
res = requests.post("http://localhost:8000/auth/login", data=login_data)
token = res.json()["access_token"]

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "multipart/form-data" # NO BOUNDARY
}

files = {"file": ("test.csv", b"Date,Merchant,Amount\n2023-01-01,Test,10.0\n", "text/csv")}
data = {"account_name": "Main Account"}

# use data=data and files=files. Requests will override Content-Type if files is present, 
# BUT we explicitly set it. Wait, `requests` behaves differently than `axios`.
# Let's just create a raw HTTP request or use a quick node script.
