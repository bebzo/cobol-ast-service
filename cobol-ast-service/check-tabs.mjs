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

  console.log('🔍 Checking dashboard page...\n');

  // Navigate to dashboard
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });

  // Wait for React to hydrate
  await page.waitForTimeout(5000);

  // Check URL
  const url = page.url();
  console.log('Current URL:', url);

  // Get page content for debugging
  const bodyHTML = await page.evaluate(() => document.body?.innerHTML?.substring(0, 1000));
  console.log('\n📄 Page body (first 1000 chars):', bodyHTML?.replace(/\s+/g, ' '));

  // Check all buttons on the page
  const allButtons = await page.$$eval('button', buttons =>
    buttons.map(b => ({ text: b.textContent?.trim(), class: b.className?.substring(0, 50) }))
  );
  console.log('\n🔘 All buttons on page:', allButtons);

  // Check for specific text
  const hasRefactor = await page.evaluate(() =>
    document.body?.textContent?.includes('Refactor')
  );
  console.log('\n🔍 Has "Refactor" text:', hasRefactor);

  // Check for any content
  const bodyText = await page.evaluate(() => document.body?.textContent?.trim());
  console.log('\n📄 Body text length:', bodyText?.length);
  console.log('📄 Body text preview:', bodyText?.substring(0, 200));

  // Console errors
  console.log('\n❌ Console errors:', consoleErrors.slice(0, 5));

  await browser.close();

  return {
    success: true,
    hasRefactor,
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
