import { chromium } from 'playwright';

const BASE_URL = 'https://ejsrr0247eon.space.minimax.io';

async function testDemo() {
  console.log('🚀 Testing Demo 10K on production...\n');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  page.on('console', msg => {
    if (msg.text().includes('[SSE') || msg.text().includes('python_code')) {
      console.log('CONSOLE:', msg.text());
    }
  });
  
  try {
    console.log('1. Loading dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/prod-1-dashboard.png' });
    
    console.log('2. Loading Demo file...');
    const demoBtn = await page.locator('button:has-text("Load Demo"), button:has-text("10K")').first();
    if (await demoBtn.isVisible()) {
      await demoBtn.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ Demo loaded');
    } else {
      console.log('   ❌ Demo button not found');
      await page.screenshot({ path: 'screenshots/prod-no-demo.png' });
      await browser.close();
      return;
    }
    
    console.log('3. Starting analysis...');
    const startTime = Date.now();
    const refactorBtn = await page.locator('button:has-text("Refactor"), button:has-text("Gemini")').first();
    await refactorBtn.click();
    console.log('   ⏳ Waiting for completion...');
    
    // Wait for completion (max 2 min)
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(2000);
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      
      // Check for green badge or 100%
      const complete = await page.locator('.bg-green-500, .bg-green-600, text=/100%/').first().isVisible().catch(() => false);
      if (complete && elapsed > 10) {
        console.log(`   ✅ Complete in ${elapsed}s`);
        break;
      }
      if (i % 5 === 0) console.log(`   ⏳ ${elapsed}s...`);
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/prod-2-complete.png', fullPage: true });
    
    console.log('4. Checking Python metrics...');
    // Get metrics text
    const metricsText = await page.locator('text=/\\d+.*Python|Python.*\\d+/i').first().textContent().catch(() => 'N/A');
    console.log('   Metrics:', metricsText);
    
    // Check for 25000+ lines indicator
    const pythonLines = await page.locator('text=/25\\d{3}/').first().textContent().catch(() => null);
    if (pythonLines) {
      console.log(`   ✅ Python lines: ${pythonLines}`);
    }
    
    // Click Python tab
    const pythonTab = await page.locator('button:has-text("Python")').first();
    if (await pythonTab.isVisible()) {
      await pythonTab.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'screenshots/prod-3-python.png', fullPage: true });
    
    // Count Monaco lines
    const monacoLines = await page.locator('.monaco-editor .view-line').count();
    console.log(`   Monaco visible lines: ${monacoLines}`);
    
    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'screenshots/prod-error.png' });
  } finally {
    await browser.close();
  }
}

testDemo();
