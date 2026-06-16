import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: console_logs.append(f"[EXCEPTION] {err.message}"))
        
        # Navigate to local server
        print("Navigating to http://localhost:8080...")
        await page.goto("http://localhost:8080/")
        await page.wait_for_timeout(2000)
        
        # Step 1: Click on Tour Comparison tab
        print("Clicking on Tour Comparison tab...")
        await page.click("text=투어 비교")
        await page.wait_for_timeout(1000)
        
        # Step 2: Select a tour
        # Find the first tour name
        tour_name_element = await page.query_selector("#panel-tour .hc-card-name")
        if not tour_name_element:
            print("FAILURE: No tours found in panel-tour!")
            await browser.close()
            return
            
        tour_name = (await tour_name_element.inner_text()).strip()
        print(f"First tour name in list: {tour_name}")
        
        # Click select button for the first tour
        select_btn = await page.query_selector("#panel-tour .btn-select")
        if not select_btn:
            print("FAILURE: No select button found for tour!")
            await browser.close()
            return
            
        is_already_selected = "선택됨" in (await select_btn.inner_text())
        print(f"Is already selected: {is_already_selected}")
        
        # Let's ensure it is selected
        if not is_already_selected:
            print("Clicking select button to select the tour...")
            await select_btn.click()
            await page.wait_for_timeout(2000)
        else:
            print("Tour is already selected, proceeding to check expenses.")
            
        # Step 3: Go to Expense Tracker tab and check if tour is listed
        print("Clicking on Expense Tracker tab...")
        await page.click("text=지출 정리")
        await page.wait_for_timeout(1000)
        
        expense_grid_content = await page.inner_text("#expensePreGrid")
        if tour_name in expense_grid_content:
            print(f"SUCCESS: Tour '{tour_name}' is automatically listed under Pre-trip expenses!")
        else:
            print(f"FAILURE: Tour '{tour_name}' was NOT found in Pre-trip expenses. DOM content: {expense_grid_content}")
            
        # Step 4: Reload page and verify persistence of selection and expense
        print("Reloading the page...")
        await page.reload()
        await page.wait_for_timeout(2000)
        
        # Check Expense tab again
        print("Checking Expense Tracker tab after reload...")
        await page.click("text=지출 정리")
        await page.wait_for_timeout(1000)
        
        expense_grid_content = await page.inner_text("#expensePreGrid")
        if tour_name in expense_grid_content:
            print(f"SUCCESS: Tour '{tour_name}' persisted in Pre-trip expenses after reload!")
        else:
            print(f"FAILURE: Tour '{tour_name}' did NOT persist in Pre-trip expenses after reload.")
            
        # Step 5: Deselect tour and verify it is removed from expenses
        print("Going back to Tour Comparison tab to deselect...")
        await page.click("text=투어 비교")
        await page.wait_for_timeout(1000)
        
        select_btn = await page.query_selector("#panel-tour .btn-select")
        is_selected = "선택됨" in (await select_btn.inner_text())
        if is_selected:
            print("Deselecting the tour...")
            await select_btn.click()
            await page.wait_for_timeout(2000)
            
            # Check Expense Tracker again
            print("Checking Expense Tracker tab after deselection...")
            await page.click("text=지출 정리")
            await page.wait_for_timeout(1000)
            
            expense_grid_content = await page.inner_text("#expensePreGrid")
            if tour_name not in expense_grid_content:
                print("SUCCESS: Tour was successfully removed from expenses upon deselection!")
            else:
                print("FAILURE: Tour is still present in expenses after deselection!")
        else:
            print("Tour was already deselected somehow.")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
