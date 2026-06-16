import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def parse():
    path = r"C:\Users\GRAVITY\.gemini\antigravity-ide\brain\a7e02b79-026d-44c5-98c2-417b63c1a6d7\scratch\firestore_data.json"
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    fields = data.get('fields', {})
    
    # 1. Flights
    flights_val = fields.get('flights', {})
    array_val = flights_val.get('arrayValue', {})
    flights = array_val.get('values', [])
    selected_flight = None
    for val in flights:
        m = val.get('mapValue', {}).get('fields', {})
        if m.get('selected', {}).get('booleanValue', False):
            selected_flight = m
            break
            
    # 2. Hotels
    hotels_val = fields.get('hotels', {})
    array_val = hotels_val.get('arrayValue', {})
    hotels = array_val.get('values', [])
    selected_hotels = []
    for val in hotels:
        m = val.get('mapValue', {}).get('fields', {})
        if m.get('selected', {}).get('booleanValue', False):
            selected_hotels.append(m)
            
    # 3. Tours
    tours_val = fields.get('tours', {})
    array_val = tours_val.get('arrayValue', {})
    tours = array_val.get('values', [])
    selected_tours = []
    for val in tours:
        m = val.get('mapValue', {}).get('fields', {})
        if m.get('selected', {}).get('booleanValue', False):
            selected_tours.append(m)

    print("=== CURRENT SELECTIONS ===")
    if selected_flight:
        airline = selected_flight.get('airline', {}).get('stringValue', '')
        price = int(selected_flight.get('price', {}).get('integerValue', '0'))
        depdate = selected_flight.get('depdate', {}).get('stringValue', 'N/A')
        rdate = selected_flight.get('rdate', {}).get('stringValue', 'N/A')
        nights = selected_flight.get('totalNights', {}).get('stringValue', '0')
        days = selected_flight.get('totalDays', {}).get('stringValue', '0')
        syd_days = selected_flight.get('sydneyDays', {}).get('stringValue', '0')
        perth_days = selected_flight.get('perthDays', {}).get('stringValue', '0')
        print(f"✈️ FLIGHT: {airline} ({price:,} KRW) | {depdate} ~ {rdate} ({nights}N / {days}D) | Syd {syd_days}d / Perth {perth_days}d")
    else:
        print("✈️ FLIGHT: None selected")
        
    if selected_hotels:
        print("\n🏨 HOTELS:")
        for h in selected_hotels:
            name = h.get('name', {}).get('stringValue', 'Unknown')
            price = int(h.get('price', {}).get('integerValue', '0'))
            city = h.get('city', {}).get('stringValue', 'sydney')
            checkin = h.get('checkin', {}).get('stringValue', 'N/A')
            checkout = h.get('checkout', {}).get('stringValue', 'N/A')
            city_label = "Sydney" if city == "sydney" else "Perth"
            print(f"  - {name} ({city_label}) | {price:,} KRW/night | {checkin} ~ {checkout}")
    else:
        print("\n🏨 HOTELS: None selected")
        
    if selected_tours:
        print("\n🎡 TOURS:")
        for t in selected_tours:
            name = t.get('name', {}).get('stringValue', 'Unknown')
            price = int(t.get('price', {}).get('integerValue', '0'))
            platform = t.get('platform', {}).get('stringValue', '')
            dur = t.get('dur', {}).get('stringValue', '')
            print(f"  - {name} ({platform}) | {price:,} KRW | Duration: {dur}")
    else:
        print("\n🎡 TOURS: None selected")

if __name__ == '__main__':
    parse()
