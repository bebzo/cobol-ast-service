import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  try {
    await page.goto('https://cobol-ast-service.vercel.app/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/vercel-correct-dashboard.png' });
    console.log('Screenshot captured');
    
    // Check for AI Insights button
    const aiInsightsBtn = await page.locator('text=AI Insights').count();
    console.log('AI Insights buttons found:', aiInsightsBtn);
    
  } catch (e) {
    console.error('Error:', e.message);
  }
  
  await browser.close();
})();
