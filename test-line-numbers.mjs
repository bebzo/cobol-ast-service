import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function testLineNumbers() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Loading dashboard...');
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
  
  // Wait for page to be ready
  await page.waitForTimeout(3000);
  
  // Check for line counter metrics - look for COBOL/Python line counts
  const metricsText = await page.locator('text=/COBOL|Python|lines/i').first().textContent().catch(() => null);
  console.log('Metrics found:', metricsText ? 'Yes' : 'No');
  
  // Look for specific line count numbers
  const cobolCount = await page.locator('text=COBOL').first().isVisible().catch(() => false);
  const pythonCount = await page.locator('text=Python').first().isVisible().catch(() => false);
  
  console.log('COBOL label visible:', cobolCount);
  console.log('Python label visible:', pythonCount);
  
  // Screenshot
  await page.screenshot({ path: '/workspace/test-lines-local.png', fullPage: false });
  console.log('Screenshot: test-lines-local.png');
  
  await browser.close();
  return true;
}

testLineNumbers().catch(e => console.error(e.message));
