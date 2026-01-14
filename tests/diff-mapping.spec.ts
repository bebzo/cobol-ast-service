import { test, expect } from '@playwright/test';

test('Test bidirectional mapping', async ({ page }) => {
  await page.goto('https://cobol-ast-service.vercel.app');
  await page.waitForLoadState('networkidle');
  
  // Load Demo + Refactor
  await page.locator('text=Load Demo').first().click();
  await page.waitForTimeout(2000);
  await page.locator('text=Refactor with Gemini').first().click();
  await page.waitForSelector('text=Code Python validé', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);
  
  // Go to Diff v6.1
  await page.getByText('Diff v6.1', { exact: false }).click();
  await page.waitForTimeout(2000);
  
  // Screenshot before click
  await page.screenshot({ path: '/workspace/test-results/mapping-01-before.png' });
  
  // Find and click on a COBOL line (look for PERFORM or PARAGRAPH)
  const cobolPanel = page.locator('text=COBOL Original').locator('..').locator('..');
  console.log('COBOL panel found');
  
  // Try clicking on a specific COBOL line
  const cobolLine = page.locator('text=PERFORM').first();
  if (await cobolLine.count() > 0) {
    await cobolLine.click();
    console.log('Clicked on PERFORM');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/workspace/test-results/mapping-02-after-click.png' });
  }
  
  // Check for any highlighted elements (usually with bg-yellow or similar)
  const highlighted = await page.locator('[class*="highlight"], [class*="bg-yellow"], [class*="bg-amber"]').count();
  console.log('Highlighted elements:', highlighted);
  
  // Final screenshot
  await page.screenshot({ path: '/workspace/test-results/mapping-03-final.png', fullPage: true });
});
