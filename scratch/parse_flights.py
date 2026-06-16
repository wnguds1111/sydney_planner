import json
import sys

# Set encoding to utf-8 for stdout to prevent encoding errors
sys.stdout.reconfigure(encoding='utf-8')

def parse():
    path = r"C:\Users\GRAVITY\.gemini\antigravity-ide\brain\a7e02b79-026d-44c5-98c2-417b63c1a6d7\scratch\firestore_data.json"
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    fields = data.get('fields', {})
    flights_val = fields.get('flights', {})
    array_val = flights_val.get('arrayValue', {})
    values = array_val.get('values', [])
    
    print(f"Total flights found in Firestore: {len(values)}")
    has_selected = False
    
    for idx, val in enumerate(values):
        m = val.get('mapValue', {}).get('fields', {})
        selected = m.get('selected', {}).get('booleanValue', False)
        airline = m.get('airline', {}).get('stringValue', 'Unknown')
        price = m.get('price', {}).get('integerValue', '0')
        depdate = m.get('depdate', {}).get('stringValue', 'N/A')
        rdate = m.get('rdate', {}).get('stringValue', 'N/A')
        syd_days = m.get('sydneyDays', {}).get('stringValue', '0')
        perth_days = m.get('perthDays', {}).get('stringValue', '0')
        nights = m.get('totalNights', {}).get('stringValue', '0')
        days = m.get('totalDays', {}).get('stringValue', '0')
        memo = m.get('memo', {}).get('stringValue', '')
        
        status = "[SELECTED]" if selected else "[ ]"
        if selected:
            has_selected = True
            
        print(f"{status} Flight {idx+1}:")
        print(f"  - Airline: {airline}")
        print(f"  - Price: {int(price):,} KRW")
        print(f"  - Dates: {depdate} to {rdate} ({nights} Nights / {days} Days)")
        print(f"  - Stay: Sydney {syd_days} days, Perth {perth_days} days")
        if memo:
            print(f"  - Memo: {memo}")
        print()
        
    if not has_selected:
        print("No flights are currently marked as selected in the database.")

if __name__ == '__main__':
    parse()
