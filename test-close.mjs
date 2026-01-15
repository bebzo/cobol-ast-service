import { chromium } from 'playwright';

const APP_URL = 'https://cobol-ast-service-5s1pyrbvx-emmanuel-beb-a-ngons-projects.vercel.app';

async function testClose() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Login
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.locator('input[type="email"]').fill('embebangon@gmail.com');
    await page.locator('input[type="password"]').fill('EManu1231975@@');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);
    
    // Open Admin
    await page.locator('button:has-text("Admin")').click();
    await page.waitForTimeout(1500);
    console.log('Admin panel opened');
    
    // Find X button inside the modal header (near Administration title)
    const closeButton = await page.locator('.bg-slate-900 button:has(svg)').first();
    await closeButton.click({ force: true });
    await page.waitForTimeout(500);
    
    // Check if closed
    const stillOpen = await page.locator('text=Administration').isVisible();
    console.log('Modal closed:', !stillOpen);
    
    if (stillOpen) {
      // Try clicking backdrop
      await page.click('.fixed.inset-0.bg-black\\/70', { position: { x: 10, y: 10 } });
      await page.waitForTimeout(500);
      console.log('Tried clicking backdrop');
    }
    
    await page.screenshot({ path: 'close-test.png' });
    
  } catch (e) {
    console.log('Error:', e.message);
  }
  
  await browser.close();
}

testClose();
