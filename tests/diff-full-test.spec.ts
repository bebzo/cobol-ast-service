import { test, expect } from '@playwright/test';

test('Diff Panel with COBOL code', async ({ page }) => {
  await page.goto('https://cobol-ast-service.vercel.app');
  await page.waitForLoadState('networkidle');
  
  // Load demo
  console.log('Loading demo...');
  await page.click('text=Load Demo');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/workspace/test-results/01-demo-loaded.png' });
  
  // Refactor with Gemini
  console.log('Refactoring with Gemini...');
  const refactorBtn = page.locator('text=Refactor with Gemini');
  if (await refactorBtn.count() > 0) {
    await refactorBtn.click();
    await page.waitForTimeout(10000); // Wait for API
  }
  await page.screenshot({ path: '/workspace/test-results/02-refactored.png' });
  
  // Click Diff v6.1 tab
  console.log('Clicking Diff v6.1 tab...');
  const diffTab = page.locator('text=Diff v6.1').first();
  if (await diffTab.count() > 0) {
    await diffTab.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: '/workspace/test-results/03-diff-panel.png' });
  
  // Test bidirectional click
  const cobolLines = await page.locator('[class*="cobol"] .view-line, .cobol-panel .view-line').count();
  console.log('COBOL lines found:', cobolLines);
  
  // Check for diff panel content
  const diffContent = await page.locator('[class*="diff"], [class*="Diff"]').count();
  console.log('Diff elements found:', diffContent);
  
  await page.screenshot({ path: '/workspace/test-results/04-final.png', fullPage: true });
});
