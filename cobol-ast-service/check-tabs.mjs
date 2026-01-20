import { chromium } from 'playwright';

async function checkTabs() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Checking tabs and sub-tabs...\n');

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

    // Check main tabs
    console.log('\n2. Checking main tabs...');
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
    console.log('   Main tabs:', mainTabs.map(t => t.text).join(', '));

    // Click Tests tab
    console.log('\n3. Clicking Tests tab...');
    const testsTab = await page.$('button:has-text("Tests")');
    if (testsTab) {
      await testsTab.click();
      await page.waitForTimeout(2000);
      console.log('   ✓ Clicked Tests');

      // Check for sub-tabs
      console.log('\n4. Checking Tests sub-tabs...');
      const subTabs = await page.$$eval('button', buttons =>
        buttons
          .filter(b => {
            const text = b.textContent?.trim() || '';
            return text === 'Coverage' || text === 'Mock' || text === 'Assert';
          })
          .map(b => ({
            text: b.textContent?.trim(),
            class: b.className?.substring(0, 100)
          }))
      );
      console.log('   Tests sub-tabs found:', subTabs.map(t => t.text).join(', ') || 'NONE');

      // Click Architecture tab
      console.log('\n5. Clicking Architecture tab...');
      const archTab = await page.$('button:has-text("Architecture")');
      if (archTab) {
        await archTab.click();
        await page.waitForTimeout(2000);
        console.log('   ✓ Clicked Architecture');

        // Check for Architecture sub-tabs
        console.log('\n6. Checking Architecture sub-tabs...');
        const archSubTabs = await page.$$eval('button', buttons =>
          buttons
            .filter(b => {
              const text = b.textContent?.trim() || '';
              return text === 'Code' || text === 'Tests' || text === 'Config' || text === 'Security';
            })
            .map(b => ({
              text: b.textContent?.trim(),
              class: b.className?.substring(0, 100)
            }))
        );
        console.log('   Architecture sub-tabs found:', archSubTabs.map(t => t.text).join(', ') || 'NONE');
      }

      // Click Security Report tab
      console.log('\n7. Clicking Security Report tab...');
      const securityTab = await page.$('button:has-text("Security Report")');
      if (securityTab) {
        await securityTab.click();
        await page.waitForTimeout(2000);
        console.log('   ✓ Clicked Security Report');

        // Check for Security Report sub-tabs
        console.log('\n8. Checking Security Report sub-tabs...');
        const securitySubTabs = await page.$$eval('button', buttons =>
          buttons
            .filter(b => {
              const text = b.textContent?.trim() || '';
              return text === 'Issues' || text === 'Improvements' || text === 'Security' || text === 'Next Steps';
            })
            .map(b => ({
              text: b.textContent?.trim(),
              class: b.className?.substring(0, 100)
            }))
        );
        console.log('   Security Report sub-tabs found:', securitySubTabs.map(t => t.text).join(', ') || 'NONE');
      }
    }

    console.log('\n=== RESULT ===');
    console.log('Check complete!');

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
