import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function testLinesDisplay() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Loading dashboard...');
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  
  // Click "Load Demo" to load sample COBOL
  const demoBtn = page.locator('button:has-text("Load Demo"), button:has-text("Démo")');
  if (await demoBtn.count() > 0) {
    await demoBtn.first().click();
    await page.waitForTimeout(1000);
    console.log('✅ Demo loaded');
  }
  
  // Check if COBOL editor has content
  const cobolEditor = page.locator('.monaco-editor').first();
  await page.waitForTimeout(500);
  
  // Look for line counter metrics (after analysis would show)
  // For now check if the COBOL lines indicator exists
  const metricsPanel = await page.locator('text=/COBOL|Python|Lines/i').count();
  console.log('Metrics panels found:', metricsPanel);
  
  // Take screenshot
  await page.screenshot({ path: '/workspace/test-lines-local.png', fullPage: false });
  console.log('Screenshot: test-lines-local.png');
  
  await browser.close();
  return true;
}

testLinesDisplay().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
