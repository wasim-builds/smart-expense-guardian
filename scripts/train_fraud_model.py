import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib

print("Loading data...")
df = pd.read_csv('data/transactions.csv')

# Feature engineering:
# We'll use amount, and we'll extract hour from date.
# We will also calculate a 'merchant_frequency' just to have more features.
df['date'] = pd.to_datetime(df['date'])
df['hour'] = df['date'].dt.hour
merchant_freq = df['merchant'].value_counts().to_dict()
df['merchant_freq'] = df['merchant'].map(merchant_freq)

X = df[['amount', 'hour', 'merchant_freq']]
y_true = df['is_fraud']

print("Training IsolationForest model...")
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('clf', IsolationForest(n_estimators=100, contamination=0.03, random_state=42))
])

pipeline.fit(X)

print("Evaluating model...")
# Isolation Forest returns -1 for outliers and 1 for inliers.
# Map to 1 for fraud, 0 for normal
preds = pipeline.predict(X)
y_pred = [1 if p == -1 else 0 for p in preds]

print(f"Total transactions: {len(X)}")
print(f"Actual anomalies: {y_true.sum()}")
print(f"Detected anomalies: {sum(y_pred)}")

print("Saving model to models/fraud_model.pkl...")
joblib.dump(pipeline, 'models/fraud_model.pkl')
# Also save the merchant frequencies dict so the API can use it
joblib.dump(merchant_freq, 'models/merchant_freq.pkl')
print("Done.")
