import { chromium } from 'playwright';

const APP_URL = 'https://cobol-ast-service.vercel.app';

async function captureFeatures() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ 
    viewport: { width: 1400, height: 900 },
    deviceScaleFactor: 2 
  });
  const page = await context.newPage();
  
  console.log('📸 Capturing app screenshots...');
  
  // 1. Hero - Empty state
  await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/01-hero-empty.png' });
  console.log('✅ 1. Hero captured');
  
  // 2. Load demo code
  const demoBtn = page.locator('button:has-text("Load Demo")');
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/02-cobol-loaded.png' });
    console.log('✅ 2. COBOL loaded');
  }
  
  // 3. Start analysis
  const analyzeBtn = page.locator('button:has-text("Refactor")');
  if (await analyzeBtn.isVisible()) {
    await analyzeBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/03-analyzing.png' });
    console.log('✅ 3. Analyzing...');
    
    // Wait for completion (up to 90s)
    try {
      await page.waitForSelector('text=Complete', { timeout: 90000 });
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('⏳ Analysis still running, capturing current state');
    }
  }
  
  // 4. Results - Python code
  await page.screenshot({ path: 'screenshots/04-python-result.png', fullPage: false });
  console.log('✅ 4. Python result');
  
  // 5. Tests tab
  const testsTab = page.locator('button:has-text("Tests")').first();
  if (await testsTab.isVisible()) {
    await testsTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/05-tests.png' });
    console.log('✅ 5. Tests tab');
  }
  
  // 6. Report tab
  const reportTab = page.locator('button:has-text("Report")');
  if (await reportTab.isVisible()) {
    await reportTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/06-report.png' });
    console.log('✅ 6. Report tab');
  }
  
  // 7. Scroll to metrics
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/07-metrics.png' });
  console.log('✅ 7. Metrics panel');
  
  // 8. Scroll to Test Oracle
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/08-test-oracle.png' });
  console.log('✅ 8. Test Oracle');
  
  // 9. Equivalence Dashboard
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/09-equivalence.png' });
  console.log('✅ 9. Equivalence Dashboard');
  
  // 10. Chat panel
  const chatInput = page.locator('input[placeholder*="Ask"]');
  if (await chatInput.isVisible()) {
    await chatInput.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/10-chat.png' });
    console.log('✅ 10. Chat panel');
  }
  
  await browser.close();
  console.log('\n🎉 All screenshots captured in /workspace/screenshots/');
}

captureFeatures().catch(console.error);
