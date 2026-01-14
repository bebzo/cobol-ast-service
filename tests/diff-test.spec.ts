import { test, expect } from '@playwright/test';

test('Diff Panel functionality', async ({ page }) => {
  await page.goto('https://cobol-ast-service.vercel.app');
  
  // Wait for page load
  await page.waitForLoadState('networkidle');
  
  // Screenshot initial state
  await page.screenshot({ path: '/workspace/test-results/01-initial.png' });
  
  // Look for Diff tab
  const diffTab = page.locator('text=Diff').first();
  const hasDiffTab = await diffTab.count() > 0;
  console.log('Diff tab found:', hasDiffTab);
  
  if (hasDiffTab) {
    await diffTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/workspace/test-results/02-diff-tab.png' });
  }
  
  // Check for DiffPanel elements
  const panels = await page.locator('[class*="diff"], [class*="Diff"]').count();
  console.log('Diff panels found:', panels);
  
  // List all visible buttons/tabs
  const buttons = await page.locator('button').allTextContents();
  console.log('Buttons:', buttons);
  
  await page.screenshot({ path: '/workspace/test-results/03-final.png', fullPage: true });
});
