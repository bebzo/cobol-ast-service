import { test, expect } from '@playwright/test';

test('Diff Panel with demo code', async ({ page }) => {
  await page.goto('https://cobol-ast-service.vercel.app');
  await page.waitForLoadState('networkidle');
  
  // Click Load Demo
  const loadDemo = page.locator('text=Load Demo').first();
  await loadDemo.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/workspace/test-results/01-demo-loaded.png' });
  
  // Click Refactor with Gemini to generate Python
  const refactor = page.locator('text=Refactor with Gemini').first();
  if (await refactor.isVisible()) {
    await refactor.click();
    await page.waitForTimeout(15000); // Wait for transpilation
  }
  await page.screenshot({ path: '/workspace/test-results/02-after-refactor.png' });
  
  // Click Diff v6.1 tab
  const diffTab = page.locator('text=Diff v6.1').first();
  if (await diffTab.isVisible()) {
    await diffTab.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: '/workspace/test-results/03-diff-panel.png' });
  
  // Check if diff content is visible
  const diffContent = await page.locator('[class*="diff"], [class*="panel"]').count();
  console.log('Diff content elements:', diffContent);
  
  // Try clicking on COBOL lines
  const cobolLines = page.locator('.view-line').first();
  if (await cobolLines.count() > 0) {
    await cobolLines.click();
    await page.waitForTimeout(500);
    console.log('Clicked on COBOL line');
  }
  
  await page.screenshot({ path: '/workspace/test-results/04-after-click.png', fullPage: true });
});
