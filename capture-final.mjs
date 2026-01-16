import { chromium } from 'playwright';

const URL = 'https://ejsrr0247eon.space.minimax.io/dashboard';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'screenshots/final-ai-insights.png', fullPage: false });
    console.log('Screenshot captured successfully');
    
  } catch (e) {
    console.error('Error:', e.message);
  }
  
  await browser.close();
})();
