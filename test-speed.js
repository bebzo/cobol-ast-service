const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🚀 Starting speed test...');
  const startTime = Date.now();
  
  // Go to local app
  await page.goto('http://localhost:3000');
  console.log(`✅ Page loaded in ${Date.now() - startTime}ms`);
  
  // Click Load Demo button
  const demoStart = Date.now();
  await page.click('button:has-text("Load Demo")');
  console.log(`✅ Demo button clicked at ${Date.now() - startTime}ms`);
  
  // Wait for COBOL code to appear in editor
  await page.waitForSelector('text=IDENTIFICATION DIVISION', { timeout: 10000 });
  console.log(`✅ COBOL code loaded in ${Date.now() - demoStart}ms`);
  
  // Click Analyze button
  const analyzeStart = Date.now();
  await page.click('button:has-text("Analyze")');
  console.log(`⏳ Analyze clicked at ${Date.now() - startTime}ms`);
  
  // Wait for progress to start
  try {
    await page.waitForSelector('text=Validating', { timeout: 15000 });
    console.log(`✅ Analysis started after ${Date.now() - analyzeStart}ms`);
  } catch (e) {
    console.log(`⚠️ Timeout waiting for Validating - checking status...`);
    const status = await page.locator('[class*="status"], [class*="progress"]').first().textContent();
    console.log(`   Current status: ${status}`);
  }
  
  // Wait for completion (Python code appears) or timeout
  try {
    await page.waitForSelector('text=def run(self)', { timeout: 120000 });
    const totalTime = Date.now() - analyzeStart;
    console.log(`\n🎉 Analysis COMPLETE in ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);
  } catch (e) {
    console.log(`\n❌ Analysis TIMEOUT after 120s`);
    // Take screenshot
    await page.screenshot({ path: '/workspace/timeout-screenshot.png' });
    console.log('📸 Screenshot saved to /workspace/timeout-screenshot.png');
  }
  
  // Get final stats
  const pythonCode = await page.locator('pre, code').first().textContent().catch(() => '');
  if (pythonCode) {
    console.log(`📊 Python code length: ${pythonCode.length} chars`);
  }
  
  await browser.close();
  console.log(`\n✅ Total test time: ${Date.now() - startTime}ms`);
})();
