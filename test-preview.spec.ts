import { test, expect } from '@playwright/test';

const PREVIEW_URL = 'https://kdhjy3pxgzvy.space.minimax.io';

test.describe('CodeSwitch Preview Tests', () => {
  
  test('Homepage loads correctly', async ({ page }) => {
    await page.goto(PREVIEW_URL);
    await page.waitForLoadState('networkidle');
    
    // Check title or main elements
    const title = await page.title();
    console.log('Page title:', title);
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/preview-home.png', fullPage: true });
    
    // Check for key elements
    const hasCodeSwitch = await page.locator('text=CodeSwitch').first().isVisible().catch(() => false);
    console.log('Has CodeSwitch branding:', hasCodeSwitch);
  });

  test('Dashboard page structure', async ({ page }) => {
    await page.goto(PREVIEW_URL + '/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'screenshots/preview-dashboard.png', fullPage: true });
    
    // Check for Tools menu (should contain AI Insights)
    const toolsButton = page.locator('text=Tools').first();
    const hasTools = await toolsButton.isVisible().catch(() => false);
    console.log('Has Tools menu:', hasTools);
    
    if (hasTools) {
      await toolsButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/preview-tools-menu.png' });
      
      // Check for AI Insights option
      const hasAIInsights = await page.locator('text=AI Insights').isVisible().catch(() => false);
      console.log('Has AI Insights in menu:', hasAIInsights);
    }
  });

  test('Login page exists', async ({ page }) => {
    await page.goto(PREVIEW_URL + '/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/preview-login.png' });
    console.log('Login page loaded');
  });
});
