const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(error.message);
  });

  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Login page loaded');

    // Wait for page to fully render
    await page.waitForTimeout(2000);

    // Fill in the login form
    console.log('Filling in credentials...');
    await page.fill('input[type="email"]', 'embebengon@gmail.com');
    await page.fill('input[type="password"]', 'EManu1231975@@');
    
    // Click the sign in button
    console.log('Clicking sign in button...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or response
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log('Current URL after login attempt:', currentUrl);

    // Check for console errors
    if (consoleErrors.length > 0) {
      console.log('\n=== Console Errors ===');
      consoleErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
      });
    } else {
      console.log('\n✓ No console errors detected');
    }

    // Check if we're still on login page or redirected
    if (currentUrl.includes('/login')) {
      console.log('\n⚠ Still on login page - login may have failed');
    } else if (currentUrl.includes('/dashboard')) {
      console.log('\n✓ Successfully redirected to dashboard - login appears to have worked!');
    } else {
      console.log(`\n→ Redirected to: ${currentUrl}`);
    }

  } catch (error) {
    console.error('Test failed with error:', error.message);
  } finally {
    await browser.close();
  }
})();
