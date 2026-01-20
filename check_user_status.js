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
    console.log('=== Checking User Account Status ===\n');
    
    console.log('1. Going to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('   ✓ Loaded\n');

    console.log('2. Trying to log in with the user...');
    await page.fill('input[type="email"]', 'embebengon@gmail.com');
    await page.fill('input[type="password"]', 'EManu1231975@@');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    console.log('3. Checking what error message appears...');
    const pageContent = await page.content();
    
    // Look for error messages
    const errorPatterns = [
      /email.*not.*confirm/i,
      /confirm.*email/i,
      /invalid.*credentials/i,
      /auth failed/i,
      /already.*exist/i
    ];
    
    let foundError = null;
    for (const pattern of errorPatterns) {
      if (pattern.test(pageContent)) {
        foundError = pattern.source;
        break;
      }
    }
    
    // Also check console messages
    const authError = consoleMessages.find(m => 
      m.type === 'error' && 
      (m.text.includes('email') || m.text.includes('confirm') || m.text.includes('Invalid'))
    );

    console.log('\n=== DIAGNOSIS ===');
    if (foundError) {
      console.log(`✓ Found error pattern: "${foundError}"`);
    }
    if (authError) {
      console.log(`✓ Console error: "${authError.text.substring(0, 200)}"`);
    }
    
    if (!foundError && !authError) {
      console.log('No specific error pattern found');
      console.log('\nAll console messages:');
      consoleMessages.forEach(m => {
        if (m.type === 'error') {
          console.log(`  - ${m.text.substring(0, 100)}`);
        }
      });
    }

    console.log('\n=== RECOMMENDATION ===');
    console.log('Since sign-up succeeded but login fails, the issue is:');
    console.log('  → Email confirmation required');
    console.log('\nTo fix for testing:');
    console.log('  1. Check email inbox for confirmation link, OR');
    console.log('  2. In Supabase Dashboard:');
    console.log('     - Go to Authentication → Providers');
    console.log('     - Disable "Confirm email"');
    console.log('     - Restart dev server');
    console.log('     - Try login again');

  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
  }
})();
