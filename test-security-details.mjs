import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // Login
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill('embebangon@gmail.com');
  await page.locator('input[type="password"]').fill('EManu1231975@@');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(3000);
  
  // Load demo & analyze
  await page.getByRole('button', { name: /load demo/i }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /refactor with gemini/i }).click();
  await page.waitForTimeout(15000);
  
  // Scroll to security section and capture
  await page.evaluate(() => {
    const securitySection = document.querySelector('[class*="security"], [class*="Security"]');
    if (securitySection) {
      securitySection.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  await page.waitForTimeout(500);
  
  // Find security score text
  const securityText = await page.evaluate(() => {
    const allText = document.body.innerText;
    const lines = allText.split('\n').filter(l => 
      l.includes('Security') || l.includes('Score') || l.includes('Grade') || 
      l.includes('fixed') || l.includes('CVSS') || l.includes('auto')
    );
    return lines.slice(0, 20).join('\n');
  });
  
  console.log('📊 SECURITY SECTION TEXT:');
  console.log(securityText);
  
  // Capture the security section
  await page.screenshot({ path: '/workspace/security-section.png', fullPage: true });
  
  await browser.close();
})();
