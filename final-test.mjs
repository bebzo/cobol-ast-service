import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 2000 } });
  
  await page.goto('https://cobol-ast-service.vercel.app/landing', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  
  // Check sections
  const roiExists = await page.$('#roi');
  console.log('ROI section exists:', !!roiExists);
  
  // Scroll through and capture
  await page.screenshot({ path: 'screenshots/final-landing-top.png' });
  console.log('✅ Top section captured');
  
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/final-landing-middle.png' });
  console.log('✅ Middle section captured');
  
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/final-landing-bottom.png' });
  console.log('✅ Bottom section captured');
  
  await browser.close();
}

test().catch(console.error);
