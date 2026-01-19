import { test, expect } from '@playwright/test';

test('verify subtabs in Tests tab', async ({ page }) => {
  await page.goto('http://localhost:3003');
  await page.waitForLoadState('networkidle');
  
  // Fill login
  await page.fill('input[type="email"]', 'admin@bank.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(3000);
  
  // Click Tests tab
  const testsTab = page.locator('button:has-text("Tests")');
  if (await testsTab.count() > 0) {
    await testsTab.first().click();
    await page.waitForTimeout(2000);
  }
  
  await page.screenshot({ path: 'tests-subtabs-final.png', fullPage: true });
});
