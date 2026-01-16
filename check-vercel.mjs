import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  try {
    // Try dashboard
    await page.goto('https://codeswitch.vercel.app/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/vercel-dashboard.png' });
    console.log('Dashboard screenshot captured');
    
    // Check page content
    const content = await page.textContent('body');
    console.log('Page content preview:', content?.substring(0, 500));
    
  } catch (e) {
    console.error('Error:', e.message);
  }
  
  await browser.close();
})();
