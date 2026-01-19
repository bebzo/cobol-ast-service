import { chromium } from 'playwright';

const URL = 'https://ejsrr0247eon.space.minimax.io/dashboard';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    
    // Click "Load Demo" button precisely
    const demoBtn = page.getByRole('button', { name: 'Load Demo (10K LOC)' });
    if (await demoBtn.isVisible()) {
      await demoBtn.click();
      console.log('Clicked Load Demo button');
      await page.waitForTimeout(4000);
    }
    
    // Screenshot navbar area
    await page.screenshot({ path: 'screenshots/ai-insights-active.png', fullPage: false });
    console.log('Screenshot captured');
    
  } catch (e) {
    console.error('Error:', e.message);
  }
  
  await browser.close();
})();
