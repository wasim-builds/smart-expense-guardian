import pandas as pd
import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

def train_categorizer():
    data_path = os.path.join("data", "fraudTrain.csv")
    model_dir = "models"
    model_path = os.path.join(model_dir, "category_model.pkl")
    
    if not os.path.exists(data_path):
        print(f"Error: Dataset not found at {data_path}")
        print("Please download the Kaggle dataset and unzip 'fraudTrain.csv' into the 'data/' directory.")
        return

    print("Loading dataset...")
    # Load dataset. Kaggle dataset has ~1.3M rows, let's sample for speed during hackathon.
    df = pd.read_csv(data_path)
    
    # Sample down to 100,000 for faster training while retaining high accuracy
    if len(df) > 100000:
        print(f"Sampling 100,000 rows from {len(df)} total rows for fast training...")
        df = df.sample(n=100000, random_state=42)
    
    # Required columns: merchant, category
    if "merchant" not in df.columns or "category" not in df.columns:
        print("Error: Dataset must contain 'merchant' and 'category' columns.")
        return
        
    print("Preprocessing data...")
    # Clean merchant strings: Kaggle prefixes merchants with "fraud_"
    df['merchant'] = df['merchant'].astype(str).str.replace('fraud_', '', regex=False)
    
    X = df["merchant"]
    y = df["category"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Building NLP Pipeline (TF-IDF + Random Forest)...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000)),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1))
    ])
    
    print("Training model (this may take a minute)...")
    pipeline.fit(X_train, y_train)
    
    print("Evaluating model...")
    y_pred = pipeline.predict(X_test)
    print(classification_report(y_test, y_pred))
    
    os.makedirs(model_dir, exist_ok=True)
    joblib.dump(pipeline, model_path)
    print(f"Model saved successfully to {model_path}")

if __name__ == "__main__":
    train_categorizer()
