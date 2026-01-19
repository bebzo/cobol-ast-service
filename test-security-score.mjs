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
  console.log('Loading demo and analyzing...');
  await page.getByRole('button', { name: /load demo/i }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /refactor with gemini/i }).click();
  
  // Wait for analysis
  await page.waitForTimeout(15000);
  
  // Take screenshot
  await page.screenshot({ path: '/workspace/security-score-test.png', fullPage: true });
  
  // Look for security score in the page
  const pageContent = await page.content();
  
  // Find security score
  const scoreMatch = pageContent.match(/Security Score:\s*(\d+)\/100/);
  const gradeMatch = pageContent.match(/Grade\s+([A-F]\+?)/);
  
  console.log('\n📊 SECURITY RESULTS:');
  console.log('Score:', scoreMatch ? scoreMatch[1] : 'Not found');
  console.log('Grade:', gradeMatch ? gradeMatch[1] : 'Not found');
  
  // Check for "auto-fixed" or "fixed" indicators
  const fixedCount = (pageContent.match(/fixed|auto-fixed|✓ Corrigé/gi) || []).length;
  console.log('Fixed indicators:', fixedCount);
  
  await browser.close();
  console.log('\n✅ Test complete');
})();
