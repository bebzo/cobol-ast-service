import { chromium } from 'playwright';

async function checkROI() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  await page.goto('https://cobol-ast-service.vercel.app/landing', { waitUntil: 'networkidle', timeout: 60000 });
  
  // Check if ROI section exists
  const roi = await page.$('#roi');
  console.log('ROI section found:', !!roi);
  
  if (roi) {
    await roi.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/landing-roi-section.png' });
    console.log('✅ ROI section screenshot captured');
  }
  
  // Check all sections
  const sections = await page.$$('section');
  console.log('Total sections:', sections.length);
  
  await browser.close();
}

checkROI().catch(console.error);
