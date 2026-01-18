import { chromium } from 'playwright';

async function testDemoPage() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text().substring(0, 200));
    }
  });
  
  console.log('Testing /demo page...');
  await page.goto('http://localhost:3000/demo', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('URL:', url);
  
  // Check Monaco editors
  const monacoCount = await page.locator('.monaco-editor').count();
  console.log('Monaco editors:', monacoCount);
  
  // Check Loading...
  const loadingCount = await page.locator('text="Loading..."').count();
  console.log('"Loading..." text:', loadingCount);
  
  // Check for CSP/Monaco errors
  const relevantErrors = errors.filter(e => 
    e.includes('monaco') || 
    e.includes('Security') || 
    e.includes('jsdelivr') ||
    e.includes('Script')
  );
  
  if (relevantErrors.length > 0) {
    console.log('\n❌ Relevant errors:');
    relevantErrors.forEach(e => console.log('  -', e));
  } else {
    console.log('\n✅ No CSP/Monaco errors');
  }
  
  await page.screenshot({ path: '/workspace/test-demo.png' });
  console.log('Screenshot: test-demo.png');
  
  await browser.close();
}

testDemoPage().catch(e => console.error(e.message));
