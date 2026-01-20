import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const BASE_URL = 'https://cobol-ast-service.vercel.app';

console.log('1. Go to login...');
await page.goto(`${BASE_URL}/login`);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

console.log('2. Fill credentials...');
await page.fill('input[type="email"], input[placeholder*="email" i]', 'emmanuel@nexusconsulting.tech');
await page.fill('input[type="password"]', 'Emma@2025!');
await page.screenshot({ path: 'before-login.png' });

console.log('3. Click Sign In...');
await page.click('button:has-text("Sign In"), button:has-text("Connexion")');
await page.waitForTimeout(5000);
await page.screenshot({ path: 'after-login.png' });
console.log('After login URL:', page.url());

// Check if we're on dashboard
if (page.url().includes('dashboard')) {
  console.log('Login successful!');
  
  // Look for admin panel - check header area
  await page.screenshot({ path: 'dashboard-check.png', fullPage: true });
  
  // Find admin/settings icon in header
  const headerBtns = page.locator('header button, nav button');
  const count = await headerBtns.count();
  console.log('Header buttons found:', count);
  
  for (let i = 0; i < count; i++) {
    const btn = headerBtns.nth(i);
    const text = await btn.textContent().catch(() => '');
    console.log(`Button ${i}:`, text?.trim() || '[icon only]');
  }
} else {
  console.log('Still on login page');
  // Check for error message
  const error = await page.locator('[class*="error"], [role="alert"]').textContent().catch(() => null);
  if (error) console.log('Error:', error);
}

await browser.close();
