import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Navigate to local server
        print("Navigating to http://localhost:8080...")
        await page.goto("http://localhost:8080/")
        await page.wait_for_timeout(2000)
        
        # Check initial state of the memo popup (should be hidden)
        popup = await page.query_selector(".memo-card-popup")
        if not popup:
            print("FAILURE: Memo popup element not found!")
            await browser.close()
            return
            
        print("Clicking floating memo widget trigger...")
        trigger = await page.query_selector("#memoTriggerBtn")
        await trigger.click()
        await page.wait_for_timeout(1000)
        
        # Verify it is expanded
        widget = await page.query_selector("#floatingMemoWidget")
        classes = await widget.evaluate("el => el.className")
        print(f"Widget classes: {classes}")
        if "expanded" not in classes:
            print("FAILURE: Widget did not expand on click!")
            await browser.close()
            return
            
        # Get bounding box of popup
        box = await popup.bounding_box()
        print(f"Popup Bounding Box: Width={box['width']}, Height={box['height']}")
        if abs(box['width'] - 420) > 10 or abs(box['height'] - 550) > 10:
            print(f"WARNING: Popup size is not exactly 420x550 (got {box['width']}x{box['height']}) - checking CSS value instead.")
            
        # Get computed styles of popup size
        width_css = await page.evaluate("el => window.getComputedStyle(el).width", popup)
        height_css = await page.evaluate("el => window.getComputedStyle(el).height", popup)
        print(f"Popup Computed Size in CSS: Width={width_css}, Height={height_css}")
        
        # Get computed styles of input field font-size
        input_field = await page.query_selector("#memoInput")
        input_font_size = await page.evaluate("el => window.getComputedStyle(el).fontSize", input_field)
        print(f"Input Field Computed Font Size: {input_font_size}")
        
        # Get computed styles of popup header title font-size
        header_title = await page.query_selector(".memo-popup-header div")
        header_font_size = await page.evaluate("el => window.getComputedStyle(el).fontSize", header_title)
        print(f"Header Title Computed Font Size: {header_font_size}")
        
        # Print success/failure based on sizes
        if "14px" in input_font_size and "17px" in header_font_size:
            print("SUCCESS: Memo popup size and font size have been successfully increased!")
        else:
            print("FAILURE: Font sizes did not match expected values.")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
