import { test, expect } from '@playwright/test';

test('Tests tab displays content correctly', async ({ page }) => {
  // Go to dashboard
  // Use demo page (no auth required)
  await page.goto('http://localhost:3000/demo');
  await page.waitForLoadState('networkidle');
  
  console.log('Dashboard loaded');
  
  // Check if Tests tab button exists
  const testsTabButton = page.locator('button').filter({ hasText: /^Tests$/ }).first();
  const tabExists = await testsTabButton.count() > 0;
  console.log('Tests tab button exists:', tabExists);
  
  if (!tabExists) {
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/no-tests-tab.png' });
    throw new Error('Tests tab button not found');
  }
  
  // Click Tests tab
  await testsTabButton.click();
  await page.waitForTimeout(2000);
  
  // Check for Monaco editor or content
  const monacoEditor = page.locator('.monaco-editor');
  const monacoCount = await monacoEditor.count();
  console.log('Monaco editors found:', monacoCount);
  
  // Check for "Loading" text (problem indicator)
  const loadingText = page.locator('text=Loading');
  const loadingCount = await loadingText.count();
  console.log('Loading text instances:', loadingCount);
  
  // Check for actual test content
  const testContent = page.locator('text=Run analysis');
  const hasDefaultContent = await testContent.count() > 0;
  console.log('Has default "Run analysis" message:', hasDefaultContent);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/tests-tab-state.png' });
  
  // If Monaco is loading but not ready, we should see either:
  // 1. The Monaco editor with content
  // 2. The "Run analysis to generate unit tests" message
  // We should NOT see "Loading..." stuck
  
  if (loadingCount > 0 && monacoCount === 0) {
    console.log('WARNING: Monaco editor stuck on Loading');
  }
  
  // The test passes if we see either Monaco or the default message
  expect(monacoCount > 0 || hasDefaultContent).toBe(true);
});
