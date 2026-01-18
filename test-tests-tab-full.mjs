import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login
  console.log('📍 Logging in...');
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill('embebangon@gmail.com');
  await page.locator('input[type="password"]').fill('EManu1231975@@');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(3000);
  
  console.log('✅ Logged in, URL:', page.url());
  
  // We need to trigger a transpilation first to have content
  // For now, let's check the initial state of tabs
  
  // Wait for page to be ready
  await page.waitForTimeout(2000);
  
  // Take initial screenshot
  await page.screenshot({ path: '/workspace/dashboard-initial.png', fullPage: true });
  
  // Look for tabs
  console.log('\n🔍 Checking tab structure...');
  const allButtons = await page.$$('button');
  const tabButtons = [];
  
  for (const btn of allButtons) {
    const text = await btn.textContent();
    const role = await btn.getAttribute('role');
    if (text && (text.includes('Python') || text.includes('Tests') || text.includes('Architecture'))) {
      tabButtons.push({ text: text.trim(), role });
      console.log(`  Tab: "${text.trim()}" (role: ${role})`);
    }
  }
  
  // Find and click the Tests tab
  console.log('\n🧪 Looking for Tests tab...');
  const testsTabBtn = await page.$('button:has-text("Tests")');
  
  if (testsTabBtn) {
    console.log('Found Tests tab, clicking...');
    await testsTabBtn.click();
    await page.waitForTimeout(2000);
    
    // Check what's in the panel
    console.log('\n📋 Checking Tests panel content...');
    
    // Check for Monaco
    const monacoEditor = await page.$('.monaco-editor');
    console.log('Monaco Editor:', monacoEditor ? 'PRESENT ✅' : 'NOT FOUND');
    
    // Check for pre blocks (loading state)
    const preBlocks = await page.$$('pre');
    console.log('Pre blocks:', preBlocks.length);
    
    // Check for "Loading..." text
    const loadingElements = await page.$$('text=Loading');
    console.log('Loading elements:', loadingElements.length);
    
    // Get content of the tab panel
    const tabPanel = await page.$('[role="tabpanel"]');
    if (tabPanel) {
      const panelText = await tabPanel.textContent();
      console.log('Panel content preview:', panelText?.slice(0, 200));
    }
    
    await page.screenshot({ path: '/workspace/tests-tab-clicked.png', fullPage: true });
  } else {
    console.log('❌ Tests tab not found');
  }
  
  await browser.close();
  console.log('\n✅ Test complete');
})();
