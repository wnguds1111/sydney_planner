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
        
        # Print flight summary card HTML
        flight_card = await page.query_selector(".summary-card-content.flight")
        if flight_card:
            html = await flight_card.evaluate("el => el.outerHTML")
            print("--- FLIGHT CARD HTML ---")
            print(html[:2000]) # Print first 2000 characters
            print("------------------------")
        else:
            print("No selected flight card found!")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
