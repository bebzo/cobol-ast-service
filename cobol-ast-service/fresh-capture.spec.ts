import { test } from '@playwright/test';
const URL = 'https://kdhjy3pxgzvy.space.minimax.io';

test('Fresh capture', async ({ page }) => {
  await page.goto(URL);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/fresh-home.png', fullPage: true });
  
  // Try to click Load Demo
  const demo = page.locator('text=Load Demo').first();
  if (await demo.isVisible()) {
    await demo.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/fresh-demo.png', fullPage: true });
  }
});
