const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  try {
    console.log('=== Testing Sign Up Flow ===\n');
    
    console.log('1. Loading login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('   ✓ Loaded\n');

    console.log('2. Checking current state...');
    const hasSignUpButton = await page.$('button:has-text("Sign Up")');
    console.log(`   Sign Up button found: ${!!hasSignUpButton}\n`);

    console.log('3. Clicking Sign Up toggle...');
    const signUpLink = await page.$('button:has-text("Sign Up"), button:has-text("Don\'t have an account")');
    if (signUpLink) {
      await signUpLink.click();
      await page.waitForTimeout(1000);
      console.log('   ✓ Clicked\n');
    }

    console.log('4. Form should now be in sign-up mode. Checking...');
    const submitButton = await page.$('button[type="submit"]');
    const buttonText = await submitButton?.textContent();
    console.log(`   Submit button text: "${buttonText}"\n`);

    console.log('5. Filling sign-up form...');
    await page.fill('input[type="email"]', 'embebengon@gmail.com');
    await page.fill('input[type="password"]', 'EManu1231975@@');
    console.log('   ✓ Filled\n');

    console.log('6. Submitting sign-up...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(8000);

    console.log('=== Results ===');
    const currentUrl = page.url();
    console.log(`Final URL: ${currentUrl}`);

    // Check for success/error messages
    const pageContent = await page.content();
    
    if (pageContent.includes('Check your email') || pageContent.includes('confirm')) {
      console.log('\n✓ Sign-up submitted - Email confirmation sent');
    } else if (consoleMessages.some(m => m.text.includes('400'))) {
      console.log('\n⚠ Sign-up failed with 400 error');
      console.log('   This usually means:');
      console.log('   - Email already registered');
      console.log('   - Password too weak');
      console.log('   - Supabase sign-ups disabled');
    } else if (currentUrl.includes('/dashboard')) {
      console.log('\n✓ Sign-up successful and logged in!');
    } else {
      console.log('\n⚠ Status unclear');
      console.log('   Console messages:');
      consoleMessages.forEach(m => {
        if (m.type === 'error' || m.type === 'warning') {
          console.log(`     - ${m.text.substring(0, 100)}`);
        }
      });
    }

  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
  }
})();
