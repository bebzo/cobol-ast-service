import { chromium } from 'playwright';

async function checkTabs() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Checking Security Report sub-tabs...\n');

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

    // Step 2: Check all main tabs first
    console.log('\n2. Checking all main tabs...');
    const mainTabs = await page.$$eval('button', buttons =>
      buttons
        .filter(b => {
          const text = b.textContent?.trim() || '';
          return text === 'Python' || text === 'Tests' || text === 'Diff' ||
                 text === 'Architecture' || text === 'Security Report' || text === 'Export';
        })
        .map(b => ({
          text: b.textContent?.trim(),
          class: b.className?.substring(0, 100)
        }))
    );
    console.log('   Main tabs found:', mainTabs.length);
    mainTabs.forEach((tab, i) => {
      console.log(`   ${i + 1}. "${tab.text}"`);
    });

    // Step 3: Click on "Security Report" tab
    console.log('\n3. Clicking "Security Report" tab...');
    const securityReportBtn = await page.$('button:has-text("Security Report")');
    if (securityReportBtn) {
      await securityReportBtn.click();
      await page.waitForTimeout(3000);
      console.log('   ✓ Clicked Security Report');

      // Step 4: Check for sub-tabs under Security Report
      console.log('\n4. Checking for sub-tabs (issues, improvements, security, next)...');

      // Look for these specific sub-tab buttons
      const subTabNames = ['issues', 'improvements', 'security', 'next'];
      const foundSubTabs = [];

      for (const subTab of subTabNames) {
        const btn = await page.$(`button:has-text("${subTab}")`);
        if (btn) {
          const info = await page.evaluate((el) => ({
            text: el.textContent?.trim(),
            visible: el.offsetParent !== null,
            class: el.className?.substring(0, 100)
          }), btn);
          foundSubTabs.push({ name: subTab, ...info });
        }
      }

      console.log('   Found sub-tabs:', foundSubTabs.length);
      foundSubTabs.forEach((tab, i) => {
        console.log(`   ${i + 1}. "${tab.name}" - visible: ${tab.visible}`);
      });

      // Step 5: Get ALL buttons on page after clicking Security Report
      console.log('\n5. All buttons on page after clicking Security Report...');
      const allButtons = await page.$$eval('button', buttons =>
        buttons.map(b => ({
          text: b.textContent?.trim().substring(0, 30),
          class: b.className?.substring(0, 100)
        }))
      );
      console.log('   Total buttons:', allButtons.length);
      allButtons.forEach((btn, i) => {
        if (i < 25) console.log(`   ${i + 1}. "${btn.text}"`);
      });

      // Step 6: Check if issues/improvements/security/next text appears anywhere
      console.log('\n6. Searching for sub-tab text anywhere on page...');
      const pageContent = await page.evaluate(() => document.body?.textContent || '');

      const hasIssues = pageContent.includes('Issues');
      const hasImprovements = pageContent.includes('Improvements');
      const hasSecurity = pageContent.includes('Security');
      const hasNext = pageContent.includes('Next Steps');

      console.log('   "Issues":', hasIssues ? '✓' : '✗');
      console.log('   "Improvements":', hasImprovements ? '✓' : '✗');
      console.log('   "Security":', hasSecurity ? '✓' : '✗');
      console.log('   "Next Steps":', hasNext ? '✓' : '✗');

    } else {
      console.log('   ✗ Security Report button NOT FOUND');
    }

    console.log('\n=== RESULT ===');
    console.log('Security Report sub-tabs investigation complete');

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
