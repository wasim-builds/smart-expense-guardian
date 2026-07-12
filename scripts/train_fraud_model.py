import pandas as pd
import os
import joblib
from sklearn.ensemble import IsolationForest

def train_fraud_model():
    data_path = os.path.join("data", "fraudTrain.csv")
    model_dir = "models"
    model_path = os.path.join(model_dir, "fraud_model.pkl")
    freq_path = os.path.join(model_dir, "merchant_freq.pkl")
    
    if not os.path.exists(data_path):
        print(f"Error: Dataset not found at {data_path}")
        print("Please download the Kaggle dataset and unzip 'fraudTrain.csv' into the 'data/' directory.")
        return

    print("Loading dataset...")
    df = pd.read_csv(data_path)
    
    # Sample down to 100,000 for faster training during the hackathon
    if len(df) > 100000:
        print(f"Sampling 100,000 rows from {len(df)} total rows for fast training...")
        df = df.sample(n=100000, random_state=42)
        
    print("Preprocessing features...")
    # Clean merchant strings
    df['merchant'] = df['merchant'].astype(str).str.replace('fraud_', '', regex=False)
    
    # Calculate merchant frequencies
    merchant_counts = df['merchant'].value_counts().to_dict()
    df['merchant_freq'] = df['merchant'].map(merchant_counts)
    
    # Extract hour from transaction time
    if 'trans_date_trans_time' in df.columns:
        df['hour'] = pd.to_datetime(df['trans_date_trans_time']).dt.hour
    else:
        df['hour'] = 12 # fallback if column missing
        
    # Rename amt to amount
    df['amount'] = df['amt']
    
    # Select features required by backend
    features = ['amount', 'hour', 'merchant_freq']
    X = df[features]
    
    # We want to train the Isolation Forest ONLY on normal (non-fraud) transactions
    # so it learns what is "normal"
    normal_tx = df['is_fraud'] == 0
    X_normal = X[normal_tx]
    
    print("Training Isolation Forest (Unsupervised)...")
    # contamination=0.01 means we expect roughly 1% of new data to be anomalies
    clf = IsolationForest(n_estimators=100, contamination=0.01, random_state=42, n_jobs=-1)
    clf.fit(X_normal)
    
    print("Evaluating model on full sample...")
    df['anomaly_pred'] = clf.predict(X)
    df['is_anomaly'] = df['anomaly_pred'] == -1
    
    # Cross-tabulate predictions vs actual labels
    print(pd.crosstab(df['is_fraud'], df['is_anomaly'], rownames=['Actual Fraud'], colnames=['Predicted Anomaly']))
    
    os.makedirs(model_dir, exist_ok=True)
    joblib.dump(clf, model_path)
    joblib.dump(merchant_counts, freq_path)
    print(f"Model saved successfully to {model_path}")
    print(f"Frequencies saved to {freq_path}")

if __name__ == "__main__":
    train_fraud_model()
