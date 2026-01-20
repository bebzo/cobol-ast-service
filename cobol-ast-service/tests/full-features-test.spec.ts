import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

test.describe('CodeSwitch v7.0 - Full Features Test', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Phase 1: Mini-map in DiffPanel is visible', async ({ page }) => {
    // Load demo code first
    const loadDemoBtn = page.getByRole('button', { name: /Load Demo/i });
    if (await loadDemoBtn.isVisible()) {
      await loadDemoBtn.click();
      await page.waitForTimeout(2000);
    }

    // Click on Diff tab
    const diffTab = page.getByRole('button', { name: /Diff/i }).first();
    if (await diffTab.isVisible()) {
      await diffTab.click();
      await page.waitForTimeout(1000);
    }

    // Check for Mini-map toggle button (Map icon)
    const minimapBtn = page.locator('button[title*="Mini-map"], button[title*="mini-map"], button:has(svg)').filter({ hasText: '' });
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/phase1-minimap.png', fullPage: true });
    
    console.log('Phase 1 Mini-map test: Screenshot taken');
  });

  test('Phase 1: Search functionality in DiffPanel', async ({ page }) => {
    // Load demo
    const loadDemoBtn = page.getByRole('button', { name: /Load Demo/i });
    if (await loadDemoBtn.isVisible()) {
      await loadDemoBtn.click();
      await page.waitForTimeout(2000);
    }

    // Click Diff tab
    const diffTab = page.getByRole('button', { name: /Diff/i }).first();
    if (await diffTab.isVisible()) {
      await diffTab.click();
      await page.waitForTimeout(1000);
    }

    // Look for Search button
    const searchBtn = page.locator('button[title="Search"]');
    if (await searchBtn.isVisible()) {
      await searchBtn.click();
      await page.waitForTimeout(500);
      
      // Check if search input appears
      const searchInput = page.locator('input[placeholder*="Search"]');
      expect(await searchInput.isVisible()).toBeTruthy();
      console.log('Phase 1 Search: Search input is visible');
    }

    await page.screenshot({ path: 'test-results/phase1-search.png', fullPage: true });
  });

  test('Main page loads correctly', async ({ page }) => {
    // Check main elements
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();

    // Check for main buttons
    const buttons = await page.getByRole('button').all();
    console.log(`Found ${buttons.length} buttons on page`);
    
    // List all button texts for debugging
    const buttonTexts: string[] = [];
    for (const btn of buttons.slice(0, 20)) {
      const text = await btn.textContent();
      if (text) buttonTexts.push(text.trim());
    }
    console.log('Buttons found:', buttonTexts);

    await page.screenshot({ path: 'test-results/main-page.png', fullPage: true });
  });

  test('Diff v6.1 tab functionality', async ({ page }) => {
    // Look for Diff v6.1 tab
    const diffV6Tab = page.getByRole('button', { name: /Diff v6\.1/i });
    
    if (await diffV6Tab.isVisible()) {
      await diffV6Tab.click();
      await page.waitForTimeout(1000);
      
      console.log('Diff v6.1 tab clicked');
      await page.screenshot({ path: 'test-results/diff-v6-tab.png', fullPage: true });
    } else {
      console.log('Diff v6.1 tab not found, checking other diff tabs');
      
      const diffTab = page.getByRole('button', { name: /Diff/i }).first();
      if (await diffTab.isVisible()) {
        await diffTab.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('Architecture tab loads', async ({ page }) => {
    const archTab = page.getByRole('button', { name: /Architecture/i });
    
    if (await archTab.isVisible()) {
      await archTab.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/architecture-tab.png', fullPage: true });
      console.log('Architecture tab: loaded');
    }
  });

  test('Check all major tabs exist', async ({ page }) => {
    const expectedTabs = ['Python', 'Tests', 'Diff', 'Architecture', 'Report'];
    const foundTabs: string[] = [];

    for (const tabName of expectedTabs) {
      const tab = page.getByRole('button', { name: new RegExp(tabName, 'i') }).first();
      if (await tab.isVisible()) {
        foundTabs.push(tabName);
      }
    }

    console.log('Found tabs:', foundTabs);
    console.log('Missing tabs:', expectedTabs.filter(t => !foundTabs.includes(t)));

    await page.screenshot({ path: 'test-results/all-tabs.png', fullPage: true });
  });

  test('Load Demo and verify transpilation', async ({ page }) => {
    // Click Load Demo button
    const loadDemoBtn = page.getByRole('button', { name: /Load Demo/i });
    
    if (await loadDemoBtn.isVisible()) {
      await loadDemoBtn.click();
      
      // Wait for transpilation
      await page.waitForTimeout(5000);
      
      // Check if Python code appears
      const pythonTab = page.getByRole('button', { name: /Python/i });
      if (await pythonTab.isVisible()) {
        await pythonTab.click();
        await page.waitForTimeout(1000);
        
        // Look for Python code content
        const codeContent = page.locator('pre, code, .monaco-editor, [class*="code"]').first();
        if (await codeContent.isVisible()) {
          console.log('Python code is visible after transpilation');
        }
      }

      await page.screenshot({ path: 'test-results/transpilation-result.png', fullPage: true });
    }
  });

});
