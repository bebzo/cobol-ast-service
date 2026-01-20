const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  const networkErrors = [];
  const allResponses = [];
  
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  page.on('response', response => {
    allResponses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText()
    });
    
    if (response.status() >= 400) {
      networkErrors.push(response);
      console.log(`[NETWORK ${response.status()}] ${response.url()}`);
    }
  });

  try {
    console.log('=== Detailed Login Diagnostics ===\n');
    
    console.log('1. Loading login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('   ✓ Page loaded\n');

    console.log('2. Filling credentials...');
    await page.fill('input[type="email"]', 'embebengon@gmail.com');
    await page.fill('input[type="password"]', 'EManu1231975@@');
    console.log('   ✓ Filled\n');

    console.log('3. Submitting...');
    await page.click('button[type="submit"]');
    
    console.log('4. Waiting for response (8 seconds)...\n');
    await page.waitForTimeout(8000);

    // Check final state
    const currentUrl = page.url();
    const pageTitle = await page.title();
    
    console.log('=== Results ===');
    console.log(`Final URL: ${currentUrl}`);
    console.log(`Page title: ${pageTitle}\n`);

    // Analyze Supabase API calls
    console.log('=== Supabase API Calls ===');
    const supabaseCalls = allResponses.filter(r => r.url.includes('supabase') || r.url.includes('auth'));
    if (supabaseCalls.length > 0) {
      supabaseCalls.forEach(r => {
        console.log(`  ${r.status}: ${r.url.substring(0, 100)}...`);
      });
    } else {
      console.log('  No Supabase API calls detected');
    }
    console.log();

    // Console messages analysis
    console.log('=== Console Messages ===');
    const errors = consoleMessages.filter(m => m.type === 'error');
    const warnings = consoleMessages.filter(m => m.type === 'warning');
    
    if (errors.length > 0) {
      console.log('Errors:');
      errors.forEach(e => console.log(`  - ${e.text.substring(0, 150)}`));
    } else {
      console.log('No console errors');
    }
    console.log();

    // Final verdict
    console.log('=== Diagnosis ===');
    if (currentUrl.includes('/dashboard')) {
      console.log('✓ SUCCESS: Login worked, redirected to dashboard');
    } else if (currentUrl.includes('/login') && errors.some(e => e.text.includes('400'))) {
      console.log('⚠ FAILED: Authentication rejected (400 Bad Request)');
      console.log('   Possible causes:');
      console.log('   1. Email not confirmed');
      console.log('   2. Invalid credentials');
      console.log('   3. Auth disabled for this user');
      console.log('   4. Supabase project settings');
    } else if (errors.some(e => e.text.includes('environment variables'))) {
      console.log('⚠ FAILED: Supabase not configured');
      console.log('   Need to restart dev server with env vars');
    } else {
      console.log('⚠ UNKNOWN: Check details above');
    }

  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
  }
})();
