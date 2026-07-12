import io
import pandas as pd
from celery import Task
from backend.workers.celery_app import celery_app
from backend.database import SessionLocal
from backend.domain import schemas
from backend.repository import transaction_repo
from backend.services.ml_service import analyze_transaction

@celery_app.task(bind=True, name="process_csv_batch")
def process_csv_batch(self, csv_content: str, account_name: str):
    """
    Asynchronously process a CSV file of transactions, run ML inference,
    and save them to the database.
    """
    db = SessionLocal()
    try:
        df = pd.read_csv(io.StringIO(csv_content))
        cols = [c.lower() for c in df.columns]
        
        total_rows = len(df)
        processed = 0
        
        for _, row in df.iterrows():
            tx_dict = {
                "merchant": str(row.get('merchant', '')),
                "amount": float(row.get('amount', 0.0)),
                "description": str(row.get('description', '')),
                "date": str(row.get('date', '')) if 'date' in cols else None,
                "account_name": account_name
            }
            
            tx_create = schemas.TransactionCreate(**tx_dict)
            category, is_anomaly, anomaly_score = analyze_transaction(tx_create)
            transaction_repo.create_transaction(db, tx_create, category, is_anomaly, anomaly_score)
            
            processed += 1
            
            # Update task state for progress tracking every 10 rows or at the end
            if processed % 10 == 0 or processed == total_rows:
                self.update_state(state='PROGRESS', meta={'current': processed, 'total': total_rows})
                
        return {'current': processed, 'total': total_rows, 'status': 'Task completed!', 'result': processed}
    except Exception as e:
        self.update_state(state='FAILURE', meta={'exc_type': type(e).__name__, 'exc_message': str(e)})
        raise e
    finally:
        db.close()
