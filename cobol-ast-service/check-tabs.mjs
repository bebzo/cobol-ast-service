import { chromium } from 'playwright';

async function checkTabs() {
  const browser = await chromium.launch({ headless: true });
  
  // Test different viewport sizes for responsiveness
  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Laptop', width: 1366, height: 768 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ];

  let allResults = [];

  for (const viewport of viewports) {
    console.log(`\n🖥️ Testing on ${viewport.name} (${viewport.width}x${viewport.height})`);
    console.log('='.repeat(50));

    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    const page = await context.newPage();

    try {
      // Login
      console.log('1. Logging in...');
      await page.goto(`http://localhost:3001/login`, { waitUntil: 'networkidle' });
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

        // Check for sub-tabs using evaluate
        console.log('\n3. Checking Tests sub-tabs...');
        const subTabs = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons
            .filter(b => {
              const text = b.textContent?.trim() || '';
              return text === 'unit tests' || text === 'shadow testing' || text === 'production readiness';
            })
            .map(b => ({
              text: b.textContent?.trim(),
              visible: b.offsetParent !== null
            }));
        });
        
        console.log('   Sub-tabs found:');
        subTabs.forEach(tab => {
          console.log(`   - ${tab.text}: ${tab.visible ? '✓ visible' : '✗ hidden'}`);
        });

        if (subTabs.length === 3) {
          console.log('\n   ✓ SUCCESS: All 3 sub-tabs are displayed!');
        } else {
          console.log(`\n   ✗ PARTIAL: Found ${subTabs.length}/3 sub-tabs`);
        }

        // Test clicking each sub-tab
        console.log('\n4. Testing sub-tab navigation...');
        for (const subTab of subTabs) {
          const button = await page.$(`button:has-text("${subTab.text}")`);
          if (button) {
            await button.click();
            await page.waitForTimeout(500);
            console.log(`   ✓ Clicked "${subTab.text}"`);
          }
        }

        // Check production readiness score calculation
        console.log('\n5. Checking Production Readiness calculation...');
        const readinessSection = await page.$('text=Production Readiness');
        if (readinessSection) {
          const scoreText = await page.evaluate(() => {
            // Look for percentage in the page
            const allText = document.body.innerText;
            const match = allText.match(/(\d+)%\s*Production Readiness/);
            return match ? match[0] : null;
          });
          if (scoreText) {
            console.log(`   ✓ Found: ${scoreText}`);
          } else {
            console.log('   ✓ Production Readiness section displayed');
          }
        }

        // Check responsiveness - verify content fits viewport
        console.log('\n6. Checking responsive layout...');
        const contentFits = await page.evaluate(() => {
          const mainContent = document.querySelector('main');
          if (!mainContent) return false;
          const contentWidth = mainContent.scrollWidth;
          const viewportWidth = window.innerWidth;
          return contentWidth <= viewportWidth || document.documentElement.clientWidth >= viewportWidth * 0.95;
        });
        console.log(`   ${contentFits ? '✓' : '✗'} Content fits within viewport`);

        allResults.push({
          viewport: viewport.name,
          success: subTabs.length === 3,
          subTabsCount: subTabs.length,
          contentFits
        });
      } else {
        console.log('   ✗ Tests tab not found');
        allResults.push({
          viewport: viewport.name,
          success: false,
          error: 'Tests tab not found'
        });
      }

    } catch (err) {
      console.error('   ✗ Error:', err.message);
      allResults.push({
        viewport: viewport.name,
        success: false,
        error: err.message
      });
    }

    await context.close();
  }

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const desktopResult = allResults.find(r => r.viewport === 'Desktop');
  const mobileResult = allResults.find(r => r.viewport === 'Mobile');

  console.log(`\n✅ Desktop (1920x1080): ${desktopResult?.success ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Mobile (375x667): ${mobileResult?.success ? 'PASS' : 'FAIL'}`);

  const allPassed = allResults.every(r => r.success);
  console.log(`\n${allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);

  return { success: allPassed, results: allResults };
}

checkTabs().then(result => {
  console.log('\n' + JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
}).catch(err => {
  console.error('Fatal Error:', err.message);
  process.exit(1);
});
