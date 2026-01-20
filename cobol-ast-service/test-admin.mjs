import { chromium } from 'playwright';

const APP_URL = 'https://cobol-ast-service-5s1pyrbvx-emmanuel-beb-a-ngons-projects.vercel.app';

async function testAdminButton() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🔍 Testing Admin button on:', APP_URL);
  
  try {
    // Go to login page
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('✅ Login page loaded');
    
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    
    // Find inputs
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    
    if (await emailInput.isVisible({ timeout: 5000 })) {
      console.log('✅ Found login form');
      await emailInput.fill('embebangon@gmail.com');
      await passwordInput.fill('EManu1231975@@');
      
      const submitBtn = await page.locator('button[type="submit"]').first();
      await submitBtn.click();
      console.log('✅ Login submitted');
      
      await page.waitForTimeout(5000);
      console.log('Current URL:', page.url());
      
      await page.screenshot({ path: 'after-login.png', fullPage: true });
      
      // Check for Admin button  
      const adminButton = await page.locator('button:has-text("Admin")').first();
      const historyButton = await page.locator('button:has-text("History")').first();
      
      console.log('History button visible:', await historyButton.isVisible().catch(() => false));
      console.log('Admin button visible:', await adminButton.isVisible().catch(() => false));
      
      if (await adminButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('✅ SUCCESS: Admin button is visible for super admin!');
        await adminButton.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'admin-panel.png', fullPage: true });
        console.log('✅ Admin Panel opened - see admin-panel.png');
      } else {
        console.log('⚠️ Admin button not visible');
        const buttons = await page.locator('button').allTextContents();
        console.log('All buttons:', buttons.filter(b => b.trim()).slice(0, 15));
      }
    } else {
      console.log('Login form not found - checking page...');
      await page.screenshot({ path: 'page-debug.png', fullPage: true });
    }
    
  } catch (e) {
    console.log('❌ Error:', e.message);
    await page.screenshot({ path: 'error.png', fullPage: true });
  }
  
  await browser.close();
}

testAdminButton();
