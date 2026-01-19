import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('https://cobol-ast-service.vercel.app/dashboard');
await page.waitForTimeout(3000);

// Click on Python tab
const pythonTab = await page.$('button:has-text("Python")');
if (pythonTab) {
  await pythonTab.click();
  await page.waitForTimeout(2000);
}

// Check if "Loading..." text still appears in the Python tab area
const rightPanel = await page.$('.bg-slate-800');
const content = await rightPanel?.textContent() || '';

if (content.includes('Loading...')) {
  console.log('❌ FAIL: "Loading..." still appears in Python tab');
} else if (content.includes('No Python code yet') || content.includes('Initializing editor')) {
  console.log('✅ PASS: Correct placeholder shown');
} else {
  console.log('⚠️ Content:', content.substring(0, 200));
}

// Take screenshot
await page.screenshot({ path: '/workspace/screenshots/python-tab-test.png', fullPage: false });
console.log('Screenshot saved');

await browser.close();
