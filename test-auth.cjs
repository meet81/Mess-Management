const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Test Registration
    console.log("Navigating to Register...");
    await page.goto('http://localhost:5174/register');

    await page.fill('input[name="name"]', 'System Tester');
    await page.fill('input[name="email"]', 'sys-tester@mess.com');
    await page.fill('input[name="password"]', 'Tester@123');
    await page.selectOption('select', 'Student');

    // Capture dialogs to know if it succeeds
    page.on('dialog', dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        dialog.accept();
    });

    console.log("Submitting Registration...");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Test Login
    console.log("Navigating to Login...");
    await page.goto('http://localhost:5174/login');

    await page.fill('input[name="email"]', 'sys-tester@mess.com');
    await page.fill('input[name="password"]', 'Tester@123');

    console.log("Submitting Login...");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Check where we are
    console.log(`Current URL: ${page.url()}`);

    // Check for errors on page
    const errorMsg = await page.locator('.text-red-700').textContent().catch(() => null);
    if (errorMsg) {
        console.log(`Found Error: ${errorMsg}`);
    } else {
        console.log("No error message on screen.");
    }

    await browser.close();
})();
