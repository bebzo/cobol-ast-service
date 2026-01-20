import { test, expect } from '@playwright/test';

const PROD_URL = 'https://cobol-ast-service.vercel.app/dashboard';

test.describe('Debug Loading Issue', () => {
  test('Upload COBOL and check Python panel', async ({ page }) => {
    // Go to production dashboard
    await page.goto(PROD_URL);
    await page.waitForLoadState('networkidle');
    
    // Wait for page load
    await page.waitForTimeout(2000);
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'screenshots/debug-01-initial.png', fullPage: true });
    
    // Sample COBOL code for testing
    const testCobol = `       IDENTIFICATION DIVISION.
       PROGRAM-ID. TEST-PROGRAM.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-NUM PIC 9(5) VALUE 100.
       01 WS-RESULT PIC 9(5).
       PROCEDURE DIVISION.
           MULTIPLY WS-NUM BY 2 GIVING WS-RESULT.
           DISPLAY WS-RESULT.
           STOP RUN.`;
    
    // Find COBOL input area and fill it
    const cobolEditor = page.locator('.monaco-editor').first();
    if (await cobolEditor.isVisible()) {
      // Monaco editor - click and type
      await cobolEditor.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.type(testCobol, { delay: 5 });
    }
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/debug-02-cobol-loaded.png', fullPage: true });
    
    // Click the analyze/refactor button
    const analyzeBtn = page.locator('button:has-text("Refactor"), button:has-text("Analyser"), button:has-text("Gemini")').first();
    if (await analyzeBtn.isVisible()) {
      await analyzeBtn.click();
      console.log('Clicked analyze button');
    }
    
    // Wait for analysis (up to 30s)
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/debug-03-during-analysis.png', fullPage: true });
    
    // Wait more
    await page.waitForTimeout(15000);
    await page.screenshot({ path: 'screenshots/debug-04-after-analysis.png', fullPage: true });
    
    // Check Python tab
    const pythonTab = page.locator('button:has-text("Python")').first();
    if (await pythonTab.isVisible()) {
      await pythonTab.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'screenshots/debug-05-python-tab.png', fullPage: true });
    
    // Check for Loading text
    const loadingText = page.locator('text=Loading');
    const isLoadingVisible = await loadingText.isVisible();
    console.log(`Loading text visible: ${isLoadingVisible}`);
    
    // Check for Python code validated badge
    const validBadge = page.locator('text=Python code validated');
    const isBadgeVisible = await validBadge.isVisible();
    console.log(`Valid badge visible: ${isBadgeVisible}`);
    
    // Check console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console Error: ${msg.text()}`);
      }
    });
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/debug-06-final.png', fullPage: true });
  });
});
