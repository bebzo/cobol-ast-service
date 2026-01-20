import { chromium } from 'playwright';

async function checkTabs() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Checking Tests sub-tabs...\n');

  try {
    // Login
    console.log('1. Logging in...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'embebangon@gmail.com');
    await page.fill('input[type="password"]', 'EManu1231975@@');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('   ✓ Logged in');

    // Click Tests tab
    console.log('\n2. Clicking Tests tab...');
    const testsTab = await page.$('button:has-text("Tests")');
    if (testsTab) {
      await testsTab.click();
      await page.waitForTimeout(2000);
      console.log('   ✓ Clicked Tests');

      // Check for sub-tabs
      console.log('\n3. Checking Tests sub-tabs...');
      const subTabs = await page.$$eval('button', buttons =>
        buttons
          .filter(b => {
            const text = b.textContent?.trim() || '';
            return text === 'unit tests' || text === 'shadow testing' || text === 'production readiness';
          })
          .map(b => ({
            text: b.textContent?.trim(),
            class: b.className?.substring(0, 100)
          }))
      );
      console.log('   Sub-tabs found:', subTabs.map(t => t.text).join(', ') || 'NONE');

      if (subTabs.length === 3) {
        console.log('\n✓ SUCCESS: All 3 sub-tabs are displayed!');
      } else {
        console.log(`\n✗ PARTIAL: Found ${subTabs.length}/3 sub-tabs`);
      }
    }

    console.log('\n=== RESULT ===');
    await browser.close();
    return { success: true };

  } catch (err) {
    console.error('Error:', err.message);
    await browser.close();
    return { success: false, error: err.message };
  }
}

checkTabs().then(result => {
  console.log(JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('Fatal Error:', err.message);
  process.exit(1);
});
