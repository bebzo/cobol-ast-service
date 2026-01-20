import { chromium } from 'playwright';

const URL = 'https://iypqk3ic6f0e.space.minimax.io/dashboard';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Screenshot du dashboard pour voir le bouton AI Insights
    await page.screenshot({ path: 'screenshots/ai-insights-button.png', fullPage: false });
    console.log('Screenshot captured: screenshots/ai-insights-button.png');
    
  } catch (e) {
    console.error('Error:', e.message);
  }
  
  await browser.close();
})();
