import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Navigate to local server
        print("Navigating to http://localhost:8080...")
        await page.goto("http://localhost:8080/")
        await page.wait_for_timeout(2000)
        
        # 1. Verify stacked dashboard container exists
        stacked_dashboard = await page.query_selector(".booking-summary-dashboard-stacked")
        if stacked_dashboard:
            print("SUCCESS: Found '.booking-summary-dashboard-stacked' container!")
        else:
            print("FAILURE: '.booking-summary-dashboard-stacked' was NOT found!")
            await browser.close()
            return
            
        # 2. Verify there are 3 distinct sections (Flight, Hotel, Tour)
        sections = await page.query_selector_all(".booking-section")
        print(f"Number of booking sections found: {len(sections)}")
        if len(sections) == 3:
            print("SUCCESS: Found exactly 3 distinct sections for Flights, Hotels, and Tours!")
        else:
            print(f"FAILURE: Expected 3 sections, found {len(sections)}!")
            await browser.close()
            return
            
        # 3. Verify flight section contains the image
        flight_image_wrap = await page.query_selector(".summary-flight-image")
        if flight_image_wrap:
            print("SUCCESS: Flight section contains the flight capture image wrap!")
            img = await page.query_selector(".summary-flight-image img")
            src = await img.get_attribute("src")
            print(f"Flight capture image loaded with source length: {len(src)}")
        else:
            print("FAILURE: Flight section does not contain the capture image!")
            
        # 4. Verify hotel section lists hotel cards
        hotel_grid = await sections[1].query_selector(".booking-items-grid")
        if hotel_grid:
            hotel_cards = await hotel_grid.query_selector_all(".summary-item-card.hotel")
            print(f"Number of selected hotel cards rendered: {len(hotel_cards)}")
            if len(hotel_cards) > 0:
                print("SUCCESS: Selected hotels are correctly listed as individual cards!")
                for idx, card in enumerate(hotel_cards):
                    name_el = await card.query_selector(".summary-item-card-name")
                    name = await name_el.inner_text()
                    print(f"  - Hotel {idx+1}: {name.strip()}")
            else:
                print("FAILURE: Hotel grid is present but contains no cards!")
        else:
            print("FAILURE: Hotel booking grid was NOT found!")
            
        # 5. Verify tour section shows empty placeholder or tour details
        tour_text = await sections[2].inner_text()
        if "선택된 투어가 없습니다" in tour_text or "본다이" in tour_text or "서핑" in tour_text or "직접예약" in tour_text:
            print("SUCCESS: Tour section displays either selected tour details or empty placeholder card!")
        else:
            print(f"FAILURE: Tour section does not contain expected text! Text is: {repr(tour_text)}")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
