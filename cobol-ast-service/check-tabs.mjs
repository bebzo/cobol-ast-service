import { chromium } from 'playwright';

async function checkTabs() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console messages
  const consoleMessages = [];
  const consoleErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  console.log('🔍 Checking dashboard page with demo mode...\n');

  // Navigate to dashboard with demo mode
  await page.goto('http://localhost:3000/dashboard?demo=true', { waitUntil: 'networkidle' });

  // Wait for React to hydrate
  await page.waitForTimeout(5000);

  // Check URL
  const url = page.url();
  console.log('Current URL:', url);

  // Check all buttons on the page
  const allButtons = await page.$$eval('button', buttons =>
    buttons.map(b => ({ text: b.textContent?.trim(), class: b.className?.substring(0, 100) }))
  );
  console.log('\n🔘 All buttons on page:', allButtons);

  // Check for specific text
  const hasRefactor = await page.evaluate(() =>
    document.body?.textContent?.includes('Refactor')
  );
  console.log('\n🔍 Has "Refactor" text:', hasRefactor);

  const hasArchitecture = await page.evaluate(() =>
    document.body?.textContent?.includes('Architecture')
  );
  console.log('🔍 Has "Architecture" text:', hasArchitecture);

  // Check for Code button (sub-tab)
  const hasCodeTab = await page.evaluate(() =>
    document.body?.textContent?.includes('"Code"')
  );
  console.log('🔍 Has "Code" sub-tab:', hasCodeTab);

  // Console errors
  console.log('\n❌ Console errors:', consoleErrors.slice(0, 5));

  await browser.close();

  return {
    success: true,
    hasRefactor,
    hasArchitecture,
    hasCodeTab,
    consoleErrors: consoleErrors.length
  };
}

checkTabs().then(result => {
  console.log('\n=== RESULT ===');
  console.log(JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
