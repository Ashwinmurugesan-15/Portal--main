import openpyxl
import os
from config import DevelopmentConfig, ProductionConfig

env = os.getenv("APP_ENV", "development").lower()
if env == "production":
    app_config = ProductionConfig()
else:
    app_config = DevelopmentConfig()

EXCEL_FILE = app_config.EXCEL_FILE
SHEET_NAME = app_config.SHEET_NAME

def check_offers():
    try:
        wb = openpyxl.load_workbook(EXCEL_FILE)
        sheet = wb[SHEET_NAME]
        
        headers = [cell.value for cell in sheet[1]]
        try:
            offer_col_idx = headers.index('Offered CTC')
        except ValueError:
            print("Offered CTC column not found")
            return

        count = 0
        rows_with_offers = []
        for i, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), 2):
            offer_val = row[offer_col_idx]
            if offer_val:
                count += 1
                rows_with_offers.append((i, row[1], offer_val)) # Row num, Name, Offer
        
        print(f"Total records with offer: {count}")
        for r in rows_with_offers:
            print(f"Row {r[0]}: {r[1]} - {r[2]}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_offers()
