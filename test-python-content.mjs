import { chromium } from 'playwright';

const BASE_URL = 'https://ejsrr0247eon.space.minimax.io';

async function testPythonContent() {
  console.log('🔍 Checking Python code content...\n');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  try {
    // Load dashboard
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Click Load Demo
    const demoBtn = await page.locator('button:has-text("Load Demo")').first();
    await demoBtn.click();
    await page.waitForTimeout(3000);
    
    // Click Refactor
    const refactorBtn = await page.locator('button:has-text("Refactor")').first();
    await refactorBtn.click();
    
    // Wait for completion
    console.log('⏳ Waiting for analysis...');
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(2000);
      const complete = await page.locator('text=/100%|Complete|Terminée/i').first().isVisible().catch(() => false);
      if (complete) {
        console.log('✅ Analysis complete');
        break;
      }
    }
    
    await page.waitForTimeout(2000);
    
    // Click Python tab
    console.log('\n📋 Clicking Python tab...');
    const pythonTab = await page.locator('button:has-text("Python")').first();
    await pythonTab.click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'screenshots/python-content-check.png', fullPage: true });
    
    // Get Monaco editor content
    console.log('\n📝 Getting Monaco content...');
    const monacoContent = await page.locator('.monaco-editor .view-lines').textContent().catch(() => null);
    if (monacoContent) {
      console.log(`Monaco content length: ${monacoContent.length} chars`);
      console.log('First 1000 chars:');
      console.log('-'.repeat(50));
      console.log(monacoContent.substring(0, 1000));
      console.log('-'.repeat(50));
    } else {
      console.log('❌ No Monaco content found');
    }
    
    // Check for pre tag (fallback)
    const preContent = await page.locator('pre').first().textContent().catch(() => null);
    if (preContent && preContent.length > 10) {
      console.log(`\nPre tag content length: ${preContent.length} chars`);
      console.log('First 500 chars:');
      console.log(preContent.substring(0, 500));
    }
    
    // Get metrics values
    console.log('\n📊 Metrics:');
    const cobolLines = await page.locator('text=/COBOL/i').first().textContent().catch(() => 'N/A');
    const pythonLines = await page.locator('text=/Python/i').first().textContent().catch(() => 'N/A');
    console.log(`COBOL: ${cobolLines?.substring(0, 50)}`);
    console.log(`Python: ${pythonLines?.substring(0, 50)}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'screenshots/python-error.png' });
  } finally {
    await browser.close();
  }
}

testPythonContent();
