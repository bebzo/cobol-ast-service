import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('📍 Going to login page...');
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Take a screenshot of login page
  await page.screenshot({ path: '/workspace/test-login-screen.png', fullPage: true });
  
  // Check for demo login button using getByText
  const demoBtn = page.getByRole('button', { name: /demo/i });
  if (await demoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Found Demo button, clicking...');
    await demoBtn.click();
    await page.waitForTimeout(3000);
  } else {
    // Try other possible demo buttons
    const altDemoBtn = page.getByText(/try demo|demo access|demo login/i);
    if (await altDemoBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Found alternative demo button');
      await altDemoBtn.click();
      await page.waitForTimeout(3000);
    } else {
      console.log('No demo button found. Login page content:');
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await btn.textContent();
        console.log('  Button:', text?.trim());
      }
    }
  }
  
  // Check current URL
  const url = page.url();
  console.log('Current URL:', url);
  
  await page.screenshot({ path: '/workspace/test-after-click.png', fullPage: true });
  
  await browser.close();
  console.log('\n✅ Test complete');
})();
