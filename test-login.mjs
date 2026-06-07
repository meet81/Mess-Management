import { test } from '@playwright/test';
test('login flow', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  const errorMsg = await page.locator('.text-red-700').textContent();
  console.log('Error Message:', errorMsg);
});
