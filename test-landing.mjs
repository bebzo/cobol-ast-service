import { chromium } from 'playwright';

const LANDING_URL = 'https://cobol-ast-service.vercel.app/landing';

async function captureLanding() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ 
    viewport: { width: 1400, height: 900 },
    deviceScaleFactor: 2 
  });
  const page = await context.newPage();
  
  console.log('📸 Capturing new landing page...');
  
  // Wait for Vercel deployment
  await new Promise(r => setTimeout(r, 30000));
  
  await page.goto(LANDING_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000); // Wait for animations
  
  // 1. Hero section
  await page.screenshot({ path: 'screenshots/landing-01-hero.png' });
  console.log('✅ 1. Hero section');
  
  // 2. Demo section
  await page.evaluate(() => document.querySelector('#demo')?.scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/landing-02-demo.png' });
  console.log('✅ 2. Demo section');
  
  // 3. Features
  await page.evaluate(() => document.querySelector('#features')?.scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/landing-03-features.png' });
  console.log('✅ 3. Features');
  
  // 4. How it works
  await page.evaluate(() => document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/landing-04-how.png' });
  console.log('✅ 4. How it works');
  
  // 5. ROI Calculator
  await page.evaluate(() => document.querySelector('#roi')?.scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/landing-05-roi.png' });
  console.log('✅ 5. ROI Calculator');
  
  // 6. Full page
  await page.screenshot({ path: 'screenshots/landing-full.png', fullPage: true });
  console.log('✅ 6. Full page');
  
  await browser.close();
  console.log('\n🎉 Landing page screenshots captured!');
}

captureLanding().catch(console.error);
