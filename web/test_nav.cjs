const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log("Navigating to login...");
    await page.goto("http://localhost:3000/login");

    console.log("Filling credentials...");
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');

    console.log("Waiting for navigation to finish...");
    await page.waitForTimeout(2000);
    console.log("Current URL after login:", page.url());

    console.log("Attempting to navigate to configuration...");
    await page.goto("http://localhost:3000/configuracao");
    await page.waitForTimeout(2000);
    console.log("Current URL after navigating to configuracao:", page.url());

    await browser.close();
})();
