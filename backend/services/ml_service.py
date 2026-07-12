import os
import joblib
import pandas as pd
from backend.domain import schemas
from backend.repository import transaction_repo

# Load ML Models globally in service
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "models")
try:
    category_model = joblib.load(os.path.join(MODEL_DIR, 'category_model.pkl'))
    fraud_model = joblib.load(os.path.join(MODEL_DIR, 'fraud_model.pkl'))
    print("ML Service: Models loaded successfully.")
except Exception as e:
    print(f"ML Service: Warning: Could not load models: {e}")
    category_model = None
    fraud_model = None

def analyze_transaction(tx: schemas.TransactionCreate):
    category = "misc"
    is_anomaly = False
    anomaly_score = 0.0

    if category_model and fraud_model:
        try:
            # Categorize
            category = category_model.predict([f"{tx.merchant} {tx.description}"])[0]
            
            # Fraud Detection
            df_fraud = pd.DataFrame([{"amount": tx.amount}])
            pred = fraud_model.predict(df_fraud)[0]
            scores = fraud_model.decision_function(df_fraud)
            
            is_anomaly = bool(pred == -1)
            anomaly_score = float(scores[0])
        except Exception as e:
            print(f"Prediction error: {e}")
            
    return category, is_anomaly, anomaly_score
