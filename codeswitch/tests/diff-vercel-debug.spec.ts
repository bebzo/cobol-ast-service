import { test, expect } from '@playwright/test';

test('Debug Diff on Vercel', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('Browser:', msg.text()));
  page.on('pageerror', err => console.log('Page Error:', err.message));
  
  await page.goto('https://cobol-ast-service.vercel.app');
  await page.waitForLoadState('networkidle');
  
  // Load Demo
  console.log('Loading demo...');
  await page.locator('text=Load Demo').first().click();
  await page.waitForTimeout(2000);
  
  // Refactor
  console.log('Refactoring...');
  await page.locator('text=Refactor with Gemini').first().click();
  
  // Wait for code generation
  await page.waitForTimeout(20000);
  await page.screenshot({ path: '/workspace/test-results/vercel-01-after-refactor.png' });
  
  // Check if Python tab has content
  const pythonTab = page.locator('text=Python').first();
  await pythonTab.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/workspace/test-results/vercel-02-python-tab.png' });
  
  // Now try Diff v6.1
  console.log('Clicking Diff v6.1...');
  const diffTab = page.getByText('Diff v6.1', { exact: false });
  await diffTab.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/workspace/test-results/vercel-03-diff-tab.png' });
  
  // Check for errors in the diff panel
  const diffContent = await page.locator('.min-h-\\[500px\\]').innerHTML().catch(() => 'NOT FOUND');
  console.log('Diff content length:', diffContent.length);
  
  // Check if "Interactive Diff" message is showing (means no content)
  const noContent = await page.locator('text=Analyse du code requise').count();
  console.log('Shows "Analyse requise" message:', noContent > 0);
  
  // Check for actual diff panels
  const cobolPanel = await page.locator('text=COBOL Original').count();
  const pythonPanel = await page.locator('text=Python Generated').count();
  console.log('COBOL panel:', cobolPanel, 'Python panel:', pythonPanel);
  
  await page.screenshot({ path: '/workspace/test-results/vercel-04-final.png', fullPage: true });
});
