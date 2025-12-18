import pandas as pd
import os
from config import DevelopmentConfig, ProductionConfig

env = os.getenv("APP_ENV", "development").lower()
if env == "production":
    app_config = ProductionConfig()
else:
    app_config = DevelopmentConfig()

file_path = app_config.EXCEL_FILE

if os.path.exists(file_path):
    try:
        df = pd.read_excel(file_path)
        if 'Offered CTC' in df.columns:
            # Check for non-null and non-empty values
            offers = df[df['Offered CTC'].notna() & (df['Offered CTC'] != '')]
            print(f"Total records: {len(df)}")
            print(f"Records with Offered CTC: {len(offers)}")
            if len(offers) > 0:
                print("Sample offers:")
                print(offers[['Name', 'Offered CTC']].head())
            else:
                print("No records have 'Offered CTC' set.")
        else:
            print("'Offered CTC' column not found in Excel file.")
    except Exception as e:
        print(f"Error reading Excel: {e}")
else:
    print("data.xlsx not found.")
