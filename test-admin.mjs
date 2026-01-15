import { chromium } from 'playwright';

const APP_URL = 'https://codeswitch-pro.vercel.app';

async function testAdminButton() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🔍 Testing Admin button visibility...\n');
  
  try {
    // Go to login page
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✅ Login page loaded');
    
    // Login as super admin
    await page.fill('input[type="email"]', 'embebangon@gmail.com');
    await page.fill('input[type="password"]', 'EManu1231975@@');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    console.log('✅ Logged in and redirected to dashboard');
    
    // Wait for page to fully load
    await page.waitForTimeout(2000);
    
    // Check for Admin button
    const adminButton = await page.locator('button:has-text("Admin")').first();
    const isVisible = await adminButton.isVisible();
    
    if (isVisible) {
      console.log('✅ Admin button is VISIBLE for super admin!');
      
      // Take screenshot
      await page.screenshot({ path: 'admin-button-visible.png', fullPage: false });
      console.log('📸 Screenshot saved: admin-button-visible.png');
      
      // Click Admin button to test panel
      await adminButton.click();
      await page.waitForTimeout(1000);
      
      // Check if panel opened
      const panelTitle = await page.locator('text=Super Admin Panel').first();
      const panelVisible = await panelTitle.isVisible();
      
      if (panelVisible) {
        console.log('✅ Admin Panel opened successfully!');
        await page.screenshot({ path: 'admin-panel-open.png', fullPage: false });
        console.log('📸 Screenshot saved: admin-panel-open.png');
      } else {
        console.log('⚠️ Admin Panel may not have opened');
      }
    } else {
      console.log('❌ Admin button NOT visible');
      await page.screenshot({ path: 'admin-button-missing.png', fullPage: false });
    }
    
  } catch (e) {
    console.log('❌ Error:', e.message);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: false });
  }
  
  await browser.close();
  console.log('\n✅ Test completed');
}

testAdminButton();
