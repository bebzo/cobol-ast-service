import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('monaco') || text.includes('Security') || text.includes('jsdelivr')) {
        errors.push(text);
      }
    }
  });
  
  await page.goto('http://localhost:3000/dashboard', { timeout: 20000 });
  await page.waitForTimeout(5000);
  
  // Check Monaco
  const monacoCount = await page.locator('.monaco-editor').count();
  console.log('Monaco editors:', monacoCount);
  
  if (errors.length) {
    console.log('Errors:', errors.slice(0, 3));
  } else {
    console.log('✅ No Monaco errors');
  }
  
  await page.screenshot({ path: '/workspace/test-monaco-v2.png' });
  await browser.close();
}

test().catch(e => console.error(e.message));
