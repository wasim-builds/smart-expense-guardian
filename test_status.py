import requests
import time

res = requests.post("http://localhost:8000/transactions/upload", files={"file": ("test.csv", open("test.csv", "rb"))}, data={"account_name": "Main Account"})
print(res.json())
job_id = res.json()["job_id"]

for i in range(5):
    status_res = requests.get(f"http://localhost:8000/transactions/upload/status/{job_id}")
    print(status_res.json())
    time.sleep(1)
