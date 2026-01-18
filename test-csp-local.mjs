import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function testCSP() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  console.log('Loading dashboard...');
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  
  // Wait for page load
  await page.waitForTimeout(2000);
  
  // Check for CSP errors
  const cspErrors = errors.filter(e => e.includes('Content Security Policy') || e.includes('cdn.jsdelivr'));
  
  if (cspErrors.length > 0) {
    console.log('❌ CSP ERRORS FOUND:');
    cspErrors.forEach(e => console.log('  -', e.substring(0, 150)));
  } else {
    console.log('✅ No CSP errors detected');
  }
  
  // Take screenshot
  await page.screenshot({ path: '/workspace/test-local-csp.png' });
  console.log('Screenshot saved: test-local-csp.png');
  
  await browser.close();
  
  return cspErrors.length === 0;
}

testCSP().then(ok => {
  console.log(ok ? '\n✅ CSP TEST PASSED' : '\n❌ CSP TEST FAILED');
  process.exit(ok ? 0 : 1);
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
