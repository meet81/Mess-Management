const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    console.log("Navigating to Register...");
    await page.goto('http://localhost:5173/register');

    await page.type('input[name="name"]', 'System Tester');
    await page.type('input[name="email"]', 'sys-tester5@mess.com');
    await page.type('input[name="password"]', 'Tester@123');
    await page.select('select', 'Student');

    page.on('dialog', async dialog => {
        console.log(`Alert: ${dialog.message()}`);
        await dialog.accept();
    });

    console.log("Submitting Registration...");
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));

    let errorElement = await page.$('.text-red-700');
    if (errorElement) {
        let errorMsg = await page.evaluate(el => el.textContent, errorElement);
        console.log(`Registration Error UI: ${errorMsg}`);
    }

    console.log("Navigating to Login...");
    await page.goto('http://localhost:5173/login');

    await page.type('input[name="email"]', 'sys-tester5@mess.com');
    await page.type('input[name="password"]', 'Tester@123');

    console.log("Submitting Login...");
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));

    errorElement = await page.$('.text-red-700');
    if (errorElement) {
        let errorMsg = await page.evaluate(el => el.textContent, errorElement);
        console.log(`Login Error UI: ${errorMsg}`);
    } else {
        console.log(`Login Success! URL is now: ${page.url()}`);
    }

    await browser.close();
})();
