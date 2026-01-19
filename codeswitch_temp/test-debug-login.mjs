import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  console.log('Going to login page...');
  await page.goto('https://cobol-ast-service.vercel.app/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  console.log('\nClicking Demo button...');
  const demoBtn = page.locator('button:has-text("Demo")');
  
  // Listen for navigation
  const navigationPromise = page.waitForNavigation({ timeout: 10000 }).catch(() => null);
  
  await demoBtn.click();
  
  // Wait for message to appear
  await page.waitForTimeout(2000);
  
  // Check for success message
  const messageEl = await page.locator('text=Accessing demo mode').isVisible().catch(() => false);
  console.log('Message visible:', messageEl);
  
  // Wait for redirect
  await page.waitForTimeout(3000);
  
  console.log('Final URL:', page.url());
  
  await browser.close();
}

test();
