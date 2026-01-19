import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function testMonacoWithAnalysis() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text().substring(0, 150));
    }
  });
  
  console.log('1. Loading dashboard...');
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // Check if we're on login page
  const url = page.url();
  if (url.includes('login')) {
    console.log('⚠️ Redirected to login - testing without auth');
    await browser.close();
    return;
  }
  
  console.log('2. Checking for COBOL editor...');
  const cobolEditor = await page.locator('.monaco-editor').first();
  const hasCobolEditor = await cobolEditor.isVisible().catch(() => false);
  console.log('   COBOL editor visible:', hasCobolEditor);
  
  console.log('3. Looking for Demo button...');
  const demoBtn = page.locator('text=/Demo|Load Demo|Sample/i').first();
  const hasDemoBtn = await demoBtn.isVisible().catch(() => false);
  
  if (hasDemoBtn) {
    console.log('   Clicking Demo...');
    await demoBtn.click();
    await page.waitForTimeout(1000);
  }
  
  console.log('4. Checking Monaco count...');
  const monacoCount = await page.locator('.monaco-editor').count();
  console.log('   Monaco editors found:', monacoCount);
  
  console.log('5. Checking for Loading... text...');
  const loadingText = await page.locator('text="Loading..."').count();
  console.log('   "Loading..." instances:', loadingText);
  
  // Check tabs
  console.log('6. Checking tabs...');
  const testsTab = page.locator('button:has-text("Tests")').first();
  if (await testsTab.isVisible().catch(() => false)) {
    await testsTab.click();
    await page.waitForTimeout(2000);
    
    const testsLoading = await page.locator('text="Loading..."').count();
    console.log('   Tests tab - Loading... count:', testsLoading);
    
    const testsMonaco = await page.locator('.monaco-editor').count();
    console.log('   Tests tab - Monaco editors:', testsMonaco);
  }
  
  // Screenshot
  await page.screenshot({ path: '/workspace/test-full-result.png', fullPage: true });
  console.log('\n7. Screenshot: test-full-result.png');
  
  if (consoleErrors.length > 0) {
    console.log('\n❌ Console errors:');
    consoleErrors.slice(0, 5).forEach(e => console.log('   -', e));
  } else {
    console.log('\n✅ No console errors');
  }
  
  await browser.close();
}

testMonacoWithAnalysis().catch(e => {
  console.error('Test failed:', e.message);
});
