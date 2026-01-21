const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console messages
  const consoleMessages = [];
  const consoleErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(`Page error: ${error.message}`);
  });

  try {
    console.log('Navigating to https://cobol-ast-service.vercel.app...');
    await page.goto('https://cobol-ast-service.vercel.app', { waitUntil: 'networkidle', timeout: 60000 });
    console.log('Page loaded successfully');

    // Check if page title is correct
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Wait for the page to be fully loaded
    await page.waitForTimeout(3000);

    // Check for any visible text that might indicate errors
    const bodyText = await page.textContent('body');
    console.log(`\n--- Page Content Summary ---`);
    console.log(`Body text length: ${bodyText.length} characters`);

    // Look for error-related content
    const hasUnterminatedError = bodyText.includes('unterminated string literal');
    const hasDecimalError = bodyText.includes('decimal.Decimal object is not callable');
    const hasTestOracle = bodyText.includes('Test Oracle') || bodyText.includes('Test Results') || bodyText.includes('Generated Tests');

    console.log(`\n--- Error Check ---`);
    console.log(`Has 'unterminated string literal' error: ${hasUnterminatedError}`);
    console.log(`Has 'decimal.Decimal object is not callable' error: ${hasDecimalError}`);
    console.log(`Has Test Oracle/Test Results section: ${hasTestOracle}`);

    // Print console errors if any
    if (consoleErrors.length > 0) {
      console.log(`\n--- Console Errors ---`);
      consoleErrors.forEach(err => console.log(err));
    } else {
      console.log(`\n--- No Console Errors Found ---`);
    }

    // Print all console messages
    console.log(`\n--- All Console Messages ---`);
    consoleMessages.forEach(msg => console.log(msg));

  } catch (error) {
    console.error('Error during test:', error.message);
  } finally {
    await browser.close();
  }
})();
