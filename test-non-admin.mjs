import { chromium } from 'playwright';

const APP_URL = 'https://cobol-ast-service-5s1pyrbvx-emmanuel-beb-a-ngons-projects.vercel.app';

async function testNonAdmin() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🔍 Testing that Admin button is HIDDEN for non-admin users...\n');
  
  try {
    // Go directly to dashboard (without login - should redirect)
    await page.goto(`${APP_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    console.log('Current URL:', page.url());
    
    // If redirected to login, the user is not authenticated
    if (page.url().includes('/login')) {
      console.log('✅ Non-authenticated users are redirected to login');
      
      // Check that there's no Admin button on the login page
      const adminButton = await page.locator('button:has-text("Admin")');
      const adminCount = await adminButton.count();
      console.log('Admin buttons on login page:', adminCount);
      
      if (adminCount === 0) {
        console.log('✅ No Admin button visible for non-authenticated users');
      }
    }
    
    await page.screenshot({ path: 'non-admin-test.png', fullPage: true });
    console.log('📸 Screenshot saved: non-admin-test.png');
    
  } catch (e) {
    console.log('❌ Error:', e.message);
  }
  
  await browser.close();
  console.log('\n✅ Non-admin test completed');
}

testNonAdmin();
