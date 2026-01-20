import { chromium } from 'playwright';

async function checkEnv() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/api/health', { waitUntil: 'networkidle' });
  const content = await page.content();
  console.log('API Response:', content);
  
  await browser.close();
}

checkEnv().catch(console.error);
