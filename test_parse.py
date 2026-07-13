import io
import pandas as pd

csv_content = """trans_date_trans_time,cc_num,merchant,category,amt,first,last,gender,street,city,state,zip,lat,long,city_pop,job,dob,trans_num,unix_time,merch_lat,merch_long,is_fraud
2019-01-01 00:00:18,2703186189652095,"fraud_Rippin, Kub and Mann",misc_net,4.97,Jennifer,Banks,F,561 Perry Cove,Moravian Falls,NC,28654,36.0788,-81.1781,3495,"Psychologist, counselling",1988-03-09,0b242abb623afc578575680df30655b9,1325376018,36.011293,-82.048315,0"""

df = pd.read_csv(io.StringIO(csv_content))
df.columns = [str(c).strip().lower() for c in df.columns]
cols = df.columns

for _, row in df.iterrows():
    amount_val = row.get('amount')
    if pd.isna(amount_val) and 'amt' in cols:
        amount_val = row.get('amt')
    try:
        amount = float(amount_val)
    except:
        amount = 0.0

    print("Merchant:", str(row.get('merchant', '')))
    print("Amount:", amount)
    print("Date:", str(row.get('date', str(row.get('trans_date_trans_time', '')))))
