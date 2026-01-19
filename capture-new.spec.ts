import { test } from '@playwright/test';
const URL = 'https://iypqk3ic6f0e.space.minimax.io';

test('Capture new UI', async ({ page }) => {
  await page.goto(URL);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshots/new-header.png' });
  console.log('Header captured');
});
