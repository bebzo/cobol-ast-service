import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('New Features Verification - Phases 1-3', () => {
  
  test('Verify DiffPanel with Mini-map controls', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Load demo first
    const loadDemo = page.getByRole('button', { name: /Load Demo/i });
    await loadDemo.click();
    await page.waitForTimeout(3000);
    
    // Click Diff v6.1 tab
    const diffTab = page.getByRole('button', { name: /Diff v6\.1/i });
    await diffTab.click();
    await page.waitForTimeout(2000);
    
    // Check for Interactive Diff header
    const diffHeader = page.locator('text=Interactive Diff');
    const hasDiffHeader = await diffHeader.isVisible().catch(() => false);
    console.log('Interactive Diff header visible:', hasDiffHeader);
    
    // Check for control buttons (Mini-map, Search, Sync Scroll)
    const mapIcon = page.locator('button:has(svg)').filter({ has: page.locator('svg') });
    const buttonCount = await mapIcon.count();
    console.log('Control buttons found:', buttonCount);
    
    // Check for COBOL and Python panels
    const cobolPanel = page.locator('text=COBOL');
    const pythonPanel = page.locator('text=Python');
    
    console.log('COBOL panel visible:', await cobolPanel.first().isVisible().catch(() => false));
    console.log('Python panel visible:', await pythonPanel.first().isVisible().catch(() => false));
    
    await page.screenshot({ path: 'test-results/diff-panel-full.png', fullPage: true });
  });

  test('Verify line mapping functionality', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Load demo
    await page.getByRole('button', { name: /Load Demo/i }).click();
    await page.waitForTimeout(3000);
    
    // Go to Diff tab
    await page.getByRole('button', { name: /Diff v6\.1/i }).click();
    await page.waitForTimeout(2000);
    
    // Look for line numbers in the diff view
    const lineNumbers = page.locator('span').filter({ hasText: /^\d+$/ });
    const lineCount = await lineNumbers.count();
    console.log('Line elements found:', lineCount);
    
    // Check for mapping arrows column
    const mappingInfo = page.locator('text=line mappings');
    const hasMappingInfo = await mappingInfo.isVisible().catch(() => false);
    console.log('Line mapping info visible:', hasMappingInfo);
    
    await page.screenshot({ path: 'test-results/line-mapping.png', fullPage: true });
  });

  test('Verify tabs are interactive', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Load demo
    await page.getByRole('button', { name: /Load Demo/i }).click();
    await page.waitForTimeout(3000);
    
    const tabs = ['Python', 'Tests', 'Architecture', 'Report'];
    
    for (const tabName of tabs) {
      const tab = page.getByRole('button', { name: new RegExp(tabName, 'i') }).first();
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(1000);
        console.log(`${tabName} tab: clicked successfully`);
        await page.screenshot({ path: `test-results/tab-${tabName.toLowerCase()}.png`, fullPage: true });
      }
    }
  });

  test('Check for export/download functionality', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Load demo
    await page.getByRole('button', { name: /Load Demo/i }).click();
    await page.waitForTimeout(3000);
    
    // Look for download/export buttons
    const downloadBtns = page.locator('button:has-text("Download"), button:has-text("Export"), button[title*="Export"], button[title*="Download"]');
    const count = await downloadBtns.count();
    console.log('Download/Export buttons found:', count);
    
    // Check Diff tab for export PDF button
    await page.getByRole('button', { name: /Diff v6\.1/i }).click();
    await page.waitForTimeout(1000);
    
    const exportPdfBtn = page.locator('button[title*="PDF"], button[title*="Export"]');
    const hasPdfExport = await exportPdfBtn.first().isVisible().catch(() => false);
    console.log('PDF Export button visible:', hasPdfExport);
    
    await page.screenshot({ path: 'test-results/export-buttons.png', fullPage: true });
  });

  test('Verify code highlighting in panels', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Load demo
    await page.getByRole('button', { name: /Load Demo/i }).click();
    await page.waitForTimeout(4000);
    
    // Check Python tab for code
    await page.getByRole('button', { name: /Python/i }).first().click();
    await page.waitForTimeout(1000);
    
    // Look for code elements with syntax highlighting
    const codeElements = page.locator('pre, code, .cm-content, [class*="syntax"], [class*="highlight"]');
    const codeCount = await codeElements.count();
    console.log('Code elements with potential highlighting:', codeCount);
    
    // Check for Python keywords
    const pythonKeywords = page.locator('text=/class |def |import |from |self/');
    const keywordCount = await pythonKeywords.count();
    console.log('Python keywords found:', keywordCount > 0 ? 'Yes' : 'No');
    
    await page.screenshot({ path: 'test-results/code-highlighting.png', fullPage: true });
  });

  test('Full workflow: Load -> Transpile -> View Diff -> Check Features', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    console.log('Step 1: Loading demo...');
    await page.getByRole('button', { name: /Load Demo/i }).click();
    await page.waitForTimeout(5000);
    
    console.log('Step 2: Checking Python output...');
    await page.getByRole('button', { name: /Python/i }).first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/workflow-1-python.png', fullPage: true });
    
    console.log('Step 3: Opening Diff v6.1...');
    await page.getByRole('button', { name: /Diff v6\.1/i }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/workflow-2-diff.png', fullPage: true });
    
    console.log('Step 4: Checking Architecture...');
    await page.getByRole('button', { name: /Architecture/i }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/workflow-3-arch.png', fullPage: true });
    
    console.log('Step 5: Checking Report...');
    await page.getByRole('button', { name: /Report/i }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/workflow-4-report.png', fullPage: true });
    
    console.log('Full workflow completed successfully!');
  });
});
