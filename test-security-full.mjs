import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // Read the test COBOL file
  const cobolCode = fs.readFileSync('/workspace/test-security-issues.cbl', 'utf8');
  console.log('COBOL file loaded:', cobolCode.length, 'chars');
  
  // Login
  console.log('Logging in...');
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill('embebangon@gmail.com');
  await page.locator('input[type="password"]').fill('EManu1231975@@');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(3000);
  
  console.log('Pasting COBOL code...');
  // Find the textarea/editor and paste code
  const editor = page.locator('textarea').first();
  if (await editor.isVisible()) {
    await editor.fill(cobolCode);
  } else {
    // Try Monaco editor
    await page.keyboard.press('Control+a');
    await page.keyboard.type(cobolCode.slice(0, 500)); // Type first 500 chars
  }
  
  await page.waitForTimeout(1000);
  
  // Click analyze
  console.log('Starting analysis...');
  const refactorBtn = page.getByRole('button', { name: /refactor with gemini/i });
  if (await refactorBtn.isVisible()) {
    await refactorBtn.click();
  }
  
  // Wait for analysis
  console.log('Waiting for analysis (20s)...');
  await page.waitForTimeout(20000);
  
  // Screenshot
  await page.screenshot({ path: '/workspace/security-full-test.png', fullPage: true });
  
  // Extract security info
  const securitySection = await page.$('.security-warnings, [class*="security"]');
  
  // Get page text for analysis
  const pageText = await page.evaluate(() => document.body.innerText);
  
  // Find security-related content
  const scoreMatch = pageText.match(/Security Score:\s*(\d+)\/100/i);
  const gradeMatch = pageText.match(/Grade\s+([A-F]\+?)/i);
  const fixedMatch = pageText.match(/(\d+)\s*issues?\s*auto[- ]?fixed/i);
  
  console.log('\n========== SECURITY ANALYSIS RESULTS ==========');
  console.log('Security Score:', scoreMatch ? scoreMatch[1] + '/100' : 'Checking...');
  console.log('Grade:', gradeMatch ? gradeMatch[1] : 'Checking...');
  console.log('Auto-fixed:', fixedMatch ? fixedMatch[1] + ' issues' : 'Checking...');
  
  // Check for specific issues
  const issues = {
    credentials: pageText.includes('Credential') || pageText.includes('password'),
    pii: pageText.includes('PII') || pageText.includes('SSN'),
    overflow: pageText.includes('Overflow') || pageText.includes('numeric'),
    sqlInjection: pageText.includes('SQL') || pageText.includes('injection'),
  };
  
  console.log('\nIssues detected:');
  Object.entries(issues).forEach(([key, found]) => {
    console.log(`  ${key}: ${found ? '✓ Detected' : '✗ Not found'}`);
  });
  
  await browser.close();
  console.log('\n✅ Test complete - check security-full-test.png');
})();
