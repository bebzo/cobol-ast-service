const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🚀 Starting speed test...');
  const startTime = Date.now();
  
  // Go to local app
  await page.goto('http://localhost:3000');
  console.log(`✅ Page loaded in ${Date.now() - startTime}ms`);
  
  // Take screenshot to see current state
  await page.screenshot({ path: '/workspace/page-initial.png', fullPage: true });
  console.log('📸 Initial screenshot saved');
  
  // Click Load Demo button
  const demoStart = Date.now();
  await page.click('button:has-text("Load Demo")');
  console.log(`✅ Demo button clicked at ${Date.now() - startTime}ms`);
  
  // Wait for COBOL code to appear
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/workspace/page-after-demo.png', fullPage: true });
  console.log('📸 After demo screenshot saved');
  
  // Find all buttons and log their text
  const buttons = await page.locator('button').all();
  console.log(`\n📋 Found ${buttons.length} buttons:`);
  for (let i = 0; i < Math.min(buttons.length, 15); i++) {
    const text = await buttons[i].textContent();
    const visible = await buttons[i].isVisible();
    if (visible && text && text.trim()) {
      console.log(`   [${i}] "${text.trim().substring(0, 50)}"`);
    }
  }
  
  // Look for analyze/convert button (texte exact du bouton)
  const analyzeBtn = await page.locator('button:has-text("Refactor with Gemini")').first();
  if (await analyzeBtn.isVisible()) {
    console.log(`\n🎯 Found action button, clicking...`);
    const analyzeStart = Date.now();
    await analyzeBtn.click();
    
    // Wait for analysis
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/workspace/page-analyzing.png', fullPage: true });
    console.log(`📸 During analysis screenshot saved`);
    
    // Wait longer
    await page.waitForTimeout(30000);
    await page.screenshot({ path: '/workspace/page-result.png', fullPage: true });
    console.log(`📸 Result screenshot saved after ${Date.now() - analyzeStart}ms`);
  } else {
    console.log('\n⚠️ No analyze button found');
  }
  
  await browser.close();
  console.log(`\n✅ Total test time: ${Date.now() - startTime}ms`);
})();
