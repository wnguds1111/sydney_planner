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
        
        # Verify first tab text
        tab_buttons = await page.query_selector_all(".tabs-bar .tab-btn")
        first_tab_text = await tab_buttons[0].inner_text()
        print(f"First tab text: '{first_tab_text}'")
        if "예약 리스트" not in first_tab_text:
            print("FAILURE: First tab was not renamed to '예약 리스트'!")
            await browser.close()
            return
            
        # Verify bookingSummaryContainer content
        summary_container = await page.query_selector("#bookingSummaryContainer")
        if not summary_container:
            print("FAILURE: bookingSummaryContainer element not found!")
            await browser.close()
            return
            
        print("Retrieving text from booking summary dashboard...")
        summary_text = await summary_container.inner_text()
        print("--- DASHBOARD TEXT ---")
        print(summary_text)
        print("----------------------")
        
        # Check if selected flight price is there
        if "2,069,000" in summary_text:
            print("SUCCESS: Selected flight price '2,069,000' is displayed in the dashboard!")
        else:
            print("FAILURE: Selected flight price '2,069,000' was NOT found in the dashboard!")
            
        # Check if selected hotel names are there
        if "샹그릴라 시드니" in summary_text and "메리톤 스위트 피트 스트리트" in summary_text:
            print("SUCCESS: Selected hotels '샹그릴라 시드니' and '메리톤 스위트 피트 스트리트' are displayed in the dashboard!")
        else:
            print("FAILURE: Selected hotel names were NOT found in the dashboard!")
            
        # Check if tours shows empty since no tours are selected
        if "선택한 투어가 없습니다" in summary_text:
            print("SUCCESS: Tours section shows empty placeholder as expected!")
        else:
            print("FAILURE: Tours section empty placeholder was NOT found!")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
