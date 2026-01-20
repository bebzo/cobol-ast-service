import { test, expect } from '@playwright/test';

test('Test mapping arrows display', async ({ page }) => {
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
  await page.screenshot({ path: '/workspace/test-results/arrows-01-before.png' });
  
  // Click on a COBOL line with PERFORM
  const performLine = page.locator('text=PERFORM').first();
  if (await performLine.count() > 0) {
    await performLine.click();
    await page.waitForTimeout(1000);
  }
  
  // Screenshot after click - should show arrows
  await page.screenshot({ path: '/workspace/test-results/arrows-02-after-click.png' });
  
  // Check for SVG arrows
  const svgArrows = await page.locator('svg path').count();
  console.log('SVG paths found:', svgArrows);
  
  // Check for arrow column
  const arrowColumn = await page.locator('[class*="w-16"]').count();
  console.log('Arrow columns found:', arrowColumn);
});
