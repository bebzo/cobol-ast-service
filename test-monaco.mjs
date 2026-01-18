import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  await page.goto('http://localhost:3000/dashboard', { timeout: 15000 });
  await page.waitForTimeout(3000);
  
  // Check for Monaco or CSP errors
  const monacoErrors = errors.filter(e => 
    e.includes('monaco') || 
    e.includes('Content Security Policy') || 
    e.includes('unpkg') ||
    e.includes('jsdelivr')
  );
  
  if (monacoErrors.length > 0) {
    console.log('❌ ERRORS:');
    monacoErrors.forEach(e => console.log('  -', e.substring(0, 120)));
  } else {
    console.log('✅ No Monaco/CSP errors');
  }
  
  // Check if Monaco loaded
  const monaco = await page.locator('.monaco-editor').count();
  console.log('Monaco editors found:', monaco);
  
  await page.screenshot({ path: '/workspace/test-monaco-local.png' });
  await browser.close();
}

test().catch(e => console.error(e.message));
