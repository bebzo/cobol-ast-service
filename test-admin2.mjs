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
    
    // Take screenshot to see what's on the page
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    console.log('📸 Login page screenshot saved');
    
    // Get all input elements
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input elements`);
    
    // Try to fill email - use different selector
    const emailInput = await page.locator('input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]').first();
    await emailInput.fill('embebangon@gmail.com');
    console.log('✅ Email filled');
    
    // Fill password
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.fill('EManu1231975@@');
    console.log('✅ Password filled');
    
    // Click submit button
    const submitBtn = await page.locator('button[type="submit"], button:has-text("Se connecter"), button:has-text("Connexion"), button:has-text("Login")').first();
    await submitBtn.click();
    console.log('✅ Submit clicked');
    
    // Wait for navigation
    await page.waitForTimeout(5000);
    console.log('Current URL:', page.url());
    
    // Check for Admin button
    const adminButton = await page.locator('button:has-text("Admin")').first();
    const isVisible = await adminButton.isVisible().catch(() => false);
    
    if (isVisible) {
      console.log('✅ Admin button is VISIBLE!');
      await page.screenshot({ path: 'admin-visible.png', fullPage: false });
      
      // Click to open panel
      await adminButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'admin-panel.png', fullPage: false });
      console.log('✅ Admin panel screenshot saved');
    } else {
      console.log('❌ Admin button not found yet');
      await page.screenshot({ path: 'dashboard-state.png', fullPage: false });
    }
    
  } catch (e) {
    console.log('❌ Error:', e.message);
    await page.screenshot({ path: 'error.png', fullPage: false });
  }
  
  await browser.close();
}

testAdminButton();
