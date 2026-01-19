import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('📍 Going to login page...');
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Fill in email
  const emailInput = page.locator('input[type="email"], input[name="email"]');
  if (await emailInput.isVisible()) {
    console.log('Filling email...');
    await emailInput.fill('embebangon@gmail.com');
  }
  
  // Fill in password
  const pwdInput = page.locator('input[type="password"], input[name="password"]');
  if (await pwdInput.isVisible()) {
    console.log('Filling password...');
    await pwdInput.fill('EManu1231975@@');
  }
  
  // Click Sign In button
  const signInBtn = page.getByRole('button', { name: /sign in/i });
  if (await signInBtn.isVisible()) {
    console.log('Clicking Sign In...');
    await signInBtn.click();
    await page.waitForTimeout(5000);
  }
  
  // Check current URL
  const url = page.url();
  console.log('Current URL after login:', url);
  
  if (url.includes('/dashboard')) {
    console.log('\n✅ Successfully logged into dashboard!');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: '/workspace/test-dashboard-logged.png', fullPage: true });
    
    // Look for tabs
    console.log('\n🔍 Looking for tabs...');
    const tabButtons = await page.$$('button');
    for (const btn of tabButtons) {
      const text = await btn.textContent();
      if (text && (text.includes('Test') || text.includes('Python') || text.includes('Architecture'))) {
        console.log('  Found tab:', text.trim());
      }
    }
    
    // Click on Tests tab if found
    const testsTab = page.getByRole('tab', { name: /tests/i });
    if (await testsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('\n🧪 Clicking Tests tab...');
      await testsTab.click();
      await page.waitForTimeout(2000);
      
      // Check what's displayed
      const monaco = await page.$('.monaco-editor');
      const preBlock = await page.$('pre');
      const loadingText = await page.$('text=Loading');
      
      console.log('Monaco Editor visible:', !!monaco);
      console.log('Pre block visible:', !!preBlock);
      console.log('Loading text visible:', !!loadingText);
      
      await page.screenshot({ path: '/workspace/test-tests-tab.png', fullPage: true });
    }
  } else {
    console.log('Login may have failed. Taking screenshot...');
    await page.screenshot({ path: '/workspace/test-login-failed.png', fullPage: true });
  }
  
  await browser.close();
  console.log('\n✅ Test complete');
})();
