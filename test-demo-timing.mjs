import { chromium } from 'playwright';

const BASE_URL = 'https://ejsrr0247eon.space.minimax.io';
// const TEST_MODE = '?test=1';  // Only for localhost testing

async function testDemoTiming() {
  console.log('🚀 Testing Demo file timing...\n');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  try {
    // Load dashboard
    console.log('📋 1. Loading dashboard...');
    await page.goto(`${BASE_URL}/dashboard${TEST_MODE}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Click Load Demo button
    console.log('📋 2. Loading Demo file (10K LOC)...');
    const demoBtn = await page.locator('button:has-text("Load Demo"), button:has-text("Demo")').first();
    if (await demoBtn.isVisible()) {
      await demoBtn.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ Demo loaded');
    }
    
    // Start timing
    const startTime = Date.now();
    
    // Click Refactor button
    console.log('📋 3. Starting analysis...');
    const refactorBtn = await page.locator('button:has-text("Refactor"), button:has-text("Gemini")').first();
    if (await refactorBtn.isVisible()) {
      await refactorBtn.click();
      console.log('   ✅ Clicked refactor button');
      console.log('   ⏳ Timing analysis...');
      
      // Wait for completion with detailed progress
      let lastProgress = '';
      for (let i = 0; i < 90; i++) {  // Max 3 minutes
        await page.waitForTimeout(2000);
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        
        // Get progress text
        const progressText = await page.locator('text=/\\d+%/').textContent().catch(() => null);
        const statusText = await page.locator('[class*="status"], text=/Parsing|Transpiling|Complete/i').first().textContent().catch(() => null);
        
        if (progressText && progressText !== lastProgress) {
          lastProgress = progressText;
          console.log(`   ⏳ ${elapsed}s - ${progressText} ${statusText || ''}`);
        } else if (i % 5 === 0) {
          console.log(`   ⏳ ${elapsed}s - waiting...`);
        }
        
        // Check for 100% or completion
        const complete = await page.locator('text=/100%|Terminée|Complete/i').first().isVisible().catch(() => false);
        const greenBadge = await page.locator('.bg-green-500, .bg-green-600').first().isVisible().catch(() => false);
        
        if (complete || (greenBadge && elapsed > 5)) {
          const totalTime = Math.round((Date.now() - startTime) / 1000);
          console.log(`\n   ✅ Analysis complete in ${totalTime} seconds`);
          break;
        }
        
        // Check for error
        const error = await page.locator('text=/Error|Erreur|Timeout/i').first().isVisible().catch(() => false);
        if (error) {
          console.log(`\n   ❌ Error after ${elapsed}s`);
          break;
        }
      }
    }
    
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    await page.screenshot({ path: 'screenshots/demo-timing-result.png', fullPage: true });
    
    // Check Python output
    console.log('\n📋 4. Checking Python output...');
    const pythonTab = await page.locator('button:has-text("Python")').first();
    if (await pythonTab.isVisible()) {
      await pythonTab.click();
      await page.waitForTimeout(2000);
    }
    
    // Count Monaco lines
    const monacoLines = await page.locator('.monaco-editor .view-line').count();
    console.log(`   Monaco editor has ${monacoLines} visible lines`);
    
    // Get metrics
    const metrics = await page.locator('[class*="Transformation Metrics"], [class*="metrics"]').first().textContent().catch(() => null);
    if (metrics) {
      console.log(`   Metrics: ${metrics.substring(0, 200)}...`);
    }
    
    await page.screenshot({ path: 'screenshots/demo-python-output.png', fullPage: true });
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total time: ${totalTime} seconds`);
    console.log(`   Monaco lines: ${monacoLines}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'screenshots/demo-error.png' });
  } finally {
    await browser.close();
  }
}

testDemoTiming();
