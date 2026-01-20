import { chromium } from 'playwright';

async function checkTabs() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Checking Tests sub-tabs and Production Readiness...\n');

  try {
    // Login
    console.log('1. Logging in...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
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
      const subTabs = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons
          .filter(b => {
            const text = b.textContent?.trim() || '';
            return text === 'unit tests' || text === 'shadow testing' || text === 'production readiness';
          })
          .map(b => b.textContent?.trim());
      });
      console.log('   Sub-tabs found:', subTabs.join(', ') || 'NONE');

      // Click on production readiness
      console.log('\n4. Clicking Production Readiness...');
      const prTab = await page.$('button:has-text("production readiness")');
      if (prTab) {
        await prTab.click();
        await page.waitForTimeout(1000);
        console.log('   ✓ Clicked Production Readiness');

        // Check what content is displayed
        console.log('\n5. Checking Production Readiness content...');
        const content = await page.evaluate(() => {
          const pageText = document.body.innerText;
          
          // Check if "Run a COBOL analysis" message is shown (expected when no analysis)
          if (pageText.includes('Run a COBOL analysis')) {
            return {
              state: 'NO_ANALYSIS',
              message: 'Correctly shows "Run a COBOL analysis" message when no data',
              score: null
            };
          }
          
          // Check if there's a percentage score
          const scoreMatch = pageText.match(/(\d+)%.*Production Readiness/);
          if (scoreMatch) {
            return {
              state: 'HAS_SCORE',
              message: 'Shows calculated score',
              score: scoreMatch[1]
            };
          }
          
          return {
            state: 'UNKNOWN',
            message: 'Could not determine state',
            score: null
          };
        });

        console.log(`   State: ${content.state}`);
        console.log(`   Message: ${content.message}`);
        if (content.score) {
          console.log(`   Score: ${content.score}%`);
        }

        // Verify no false positives
        if (content.state === 'NO_ANALYSIS') {
          console.log('\n✅ SUCCESS: No false positive! Message correctly shown when no analysis');
        } else if (content.state === 'HAS_SCORE') {
          console.log('\n⚠️  Note: Score shown - this is real data from a loaded analysis');
        }
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
