import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  
  try {
    await page.goto('https://cobol-ast-service.vercel.app/dashboard', { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/final-vercel-live.png' });
    
    const aiBtn = await page.locator('text=AI Insights').count();
    const geminiTag = await page.locator('text=Gemini 3').count();
    console.log('AI Insights found:', aiBtn);
    console.log('Gemini 3 tag found:', geminiTag);
    
  } catch (e) {
    console.error('Error:', e.message);
  }
  await browser.close();
})();
