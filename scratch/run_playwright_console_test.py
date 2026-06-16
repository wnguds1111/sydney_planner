import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type.upper()}] {msg.text}"))
        page.on("pageerror", lambda err: console_logs.append(f"[EXCEPTION] {err.message}"))
        
        print("Navigating to http://localhost:8080...")
        await page.goto("http://localhost:8080/")
        await page.wait_for_timeout(2000)
        
        print("\n--- BROWSER CONSOLE LOGS ---")
        for log in console_logs:
            print(log)
        print("----------------------------\n")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
