import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Test home page loads
  await page.goto('http://localhost:3000', { timeout: 10000 });
  const title = await page.title();
  console.log('Home page title:', title);
  
  // Go to dashboard - will redirect to login
  const response = await page.goto('http://localhost:3000/dashboard', { timeout: 10000 });
  const url = page.url();
  console.log('Dashboard redirects to:', url);
  
  await page.screenshot({ path: '/workspace/test-redirect.png' });
  
  await browser.close();
}

test().catch(e => console.error(e.message));
