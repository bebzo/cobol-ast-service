import { test, expect } from '@playwright/test';

test('Debug Diff Panel', async ({ page }) => {
  await page.goto('https://cobol-ast-service.vercel.app');
  await page.waitForLoadState('networkidle');
  
  // Load Demo
  await page.locator('text=Load Demo').first().click();
  await page.waitForTimeout(2000);
  
  // Refactor with Gemini
  await page.locator('text=Refactor with Gemini').first().click();
  
  // Wait for Python code to appear (check for green success banner)
  await page.waitForSelector('text=Code Python validé', { timeout: 30000 }).catch(() => console.log('No validation banner'));
  await page.waitForTimeout(3000);
  
  // Click specifically on "Diff v6.1" tab
  const diffV61Tab = page.getByText('Diff v6.1', { exact: false });
  console.log('Diff v6.1 tab visible:', await diffV61Tab.isVisible());
  await diffV61Tab.click();
  await page.waitForTimeout(2000);
  
  // Screenshot
  await page.screenshot({ path: '/workspace/test-results/debug-diff.png', fullPage: true });
  
  // Check what's in the diff panel area
  const diffPanelContent = await page.locator('.min-h-\\[500px\\]').innerHTML().catch(() => 'Not found');
  console.log('DiffPanel area HTML length:', diffPanelContent.length);
  
  // Check if DiffPanel is rendered (should have cobol and python editors)
  const hasDiffEditor = await page.locator('text=COBOL Source').count();
  console.log('Has COBOL Source label:', hasDiffEditor);
});
