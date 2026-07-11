import pandas as pd
from faker import Faker
import random
import os

# Create data directory if it doesn't exist
os.makedirs('data', exist_ok=True)
os.makedirs('models', exist_ok=True)

fake = Faker()
Faker.seed(42)
random.seed(42)

NUM_TRANSACTIONS = 2000
CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Salary', 'Fraud']

# Base realistic merchants for each category to help the model learn
MERCHANTS = {
    'Food': ['Starbucks', 'McDonalds', 'Whole Foods', 'Uber Eats', 'Trader Joes', 'Dominos'],
    'Transport': ['Uber', 'Lyft', 'Shell', 'Chevron', 'Amtrak', 'MTA'],
    'Shopping': ['Amazon', 'Walmart', 'Target', 'Apple Store', 'Best Buy', 'Zara'],
    'Bills': ['Comcast', 'PG&E', 'Verizon', 'AT&T', 'State Farm', 'Water Co'],
    'Entertainment': ['Netflix', 'Spotify', 'AMC Theatres', 'Steam', 'Hulu', 'Disney+'],
    'Salary': ['Tech Corp Inc', 'Payroll Dept', 'Employer Deposit']
}

data = []

for i in range(NUM_TRANSACTIONS):
    # Determine if anomalous (3% chance)
    is_fraud = 1 if random.random() < 0.03 else 0
    
    transaction_id = fake.uuid4()
    date = fake.date_time_this_year().isoformat()
    
    if is_fraud:
        category = 'Fraud'
        merchant = fake.company() + " " + fake.company_suffix()
        description = f"POS Debit {merchant} - UNUSUAL ACTIVITY"
        amount = round(random.uniform(1000.0, 10000.0), 2)
    else:
        # Choose a normal category
        category = random.choice([c for c in CATEGORIES if c != 'Fraud'])
        merchant = random.choice(MERCHANTS[category])
        
        # Add some noise to the description
        description = f"Purchase at {merchant}"
        if random.random() > 0.5:
            description += f" #{fake.bothify(text='????-####')}"
            
        if category == 'Salary':
            amount = round(random.uniform(3000.0, 8000.0), 2)
        elif category == 'Bills':
            amount = round(random.uniform(50.0, 500.0), 2)
        else:
            amount = round(random.uniform(5.0, 150.0), 2)

    data.append({
        'transaction_id': transaction_id,
        'date': date,
        'merchant': merchant,
        'description': description,
        'amount': amount,
        'category': category,
        'is_fraud': is_fraud
    })

df = pd.DataFrame(data)
df.to_csv('data/transactions.csv', index=False)
print(f"Generated {NUM_TRANSACTIONS} transactions and saved to data/transactions.csv")
print(f"Anomalies (is_fraud=1): {df['is_fraud'].sum()} ({df['is_fraud'].mean()*100:.1f}%)")
