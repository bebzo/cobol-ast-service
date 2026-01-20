const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  const networkErrors = [];
  
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      console.log(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
      console.log(`[NETWORK ERROR] ${response.status()} ${response.statusText()}: ${response.url()}`);
    }
  });

  try {
    console.log('=== Login Test with Detailed Diagnostics ===\n');
    
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('   ✓ Login page loaded\n');

    // Check if Supabase is configured
    console.log('2. Checking Supabase configuration...');
    const supabaseConfigured = await page.evaluate(() => {
      return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    });
    console.log(`   Supabase configured: ${supabaseConfigured ? 'Yes' : 'No'}\n`);

    // Fill in credentials
    console.log('3. Filling login form...');
    await page.fill('input[type="email"]', 'embebengon@gmail.com');
    await page.fill('input[type="password"]', 'EManu1231975@@');
    console.log('   ✓ Credentials entered\n');

    // Click sign in
    console.log('4. Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for any async operations
    await page.waitForTimeout(8000);
    
    console.log('\n5. Checking results...');
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    // Check for error messages on the page
    const pageContent = await page.content();
    const hasError = pageContent.includes('Invalid') || pageContent.includes('error') || pageContent.includes('failed');
    console.log(`   Page contains error text: ${hasError}\n`);

    // Summary
    console.log('=== Test Summary ===');
    console.log(`Network errors: ${networkErrors.length}`);
    console.log(`Console errors: ${consoleMessages.filter(m => m.type === 'error').length}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('\n✓ LOGIN SUCCESSFUL - Redirected to dashboard');
    } else if (networkErrors.length > 0) {
      console.log('\n⚠ Authentication failed - Network error detected');
      console.log('This could indicate:');
      console.log('  - Invalid credentials');
      console.log('  - Email not confirmed');
      console.log('  - Account disabled');
      console.log('  - Supabase auth settings blocking sign-in');
    } else if (consoleMessages.some(m => m.text.includes('Failed to initialize'))) {
      console.log('\n⚠ Supabase client initialization failed');
    } else {
      console.log('\n⚠ Login status unclear - needs investigation');
    }

  } catch (error) {
    console.error('\nTest failed:', error.message);
  } finally {
    await browser.close();
  }
})();
