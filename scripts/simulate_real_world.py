import time
import pandas as pd
from fastapi.testclient import TestClient
from backend.main import app

def run_simulation():
    print("Loading test samples from Kaggle dataset...")
    try:
        df = pd.read_csv("data/fraudTrain.csv")
    except Exception as e:
        print("Could not load data/fraudTrain.csv. Have you downloaded it?")
        return
        
    sample_df = df.sample(n=50, random_state=101)
    
    total_latency = 0
    correct_categories = 0
    fraud_alerts = 0
    
    print("\n--- Starting API Simulation ---")
    
    with TestClient(app) as client:
        for idx, row in sample_df.iterrows():
            merchant = str(row['merchant']).replace('fraud_', '')
            amount = float(row['amt'])
            actual_category = str(row['category'])
            actual_fraud = int(row['is_fraud'])
            
            payload = {
                "merchant": merchant,
                "amount": amount,
                "description": "Simulated POS Transaction",
                "date": "2024-10-01T12:00:00Z"
            }
            
            start_time = time.perf_counter()
            response = client.post("/transactions", json=payload)
            end_time = time.perf_counter()
            
            latency_ms = (end_time - start_time) * 1000
            total_latency += latency_ms
            
            if response.status_code == 200:
                data = response.json()
                predicted_category = data.get("category")
                is_fraud_alert = data.get("is_fraud")
                
                if predicted_category == actual_category:
                    correct_categories += 1
                    
                if is_fraud_alert:
                    fraud_alerts += 1
                    
                print(f"POST /transactions | {merchant} | ${amount:.2f} | Latency: {latency_ms:.2f}ms | Cat: {predicted_category} | Fraud Alert: {is_fraud_alert}")
            else:
                print(f"Error: {response.status_code} - {response.text}")
                
    print("\n--- Simulation Results ---")
    print(f"Total Transactions Processed: {len(sample_df)}")
    print(f"Average API Latency: {total_latency / len(sample_df):.2f} ms")
    print(f"Categorization Accuracy (against Kaggle labels): {(correct_categories / len(sample_df)) * 100:.1f}%")
    print(f"Fraud Alerts Triggered by ML: {fraud_alerts}")
    
    if (total_latency / len(sample_df)) < 50:
        print("\n✅ PRODUCTION READY: API latency is excellent (under 50ms per request).")
    else:
        print("\n⚠️ WARNING: API latency is high.")

if __name__ == "__main__":
    run_simulation()
