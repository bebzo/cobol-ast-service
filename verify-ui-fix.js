const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the dashboard
    await page.goto('http://localhost:3000/dashboard');

    // Wait for the page to load
    await page.waitForTimeout(3000);

    // Check if both panels have the same background color
    const cobolPanel = await page.locator('div.flex-1.overflow-auto.bg-slate-950').first();
    const pythonPanel = await page.locator('div.flex-1.overflow-auto.bg-slate-950').nth(1);

    const cobolBg = await cobolPanel.evaluate(el => getComputedStyle(el).backgroundColor);
    const pythonBg = await pythonPanel.evaluate(el => getComputedStyle(el).backgroundColor);

    console.log('COBOL panel background:', cobolBg);
    console.log('Python panel background:', pythonBg);

    if (cobolBg === pythonBg) {
      console.log('✓ SUCCESS: Both panels have the same background color');
    } else {
      console.log('✗ FAIL: Panel backgrounds do not match');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
})();
