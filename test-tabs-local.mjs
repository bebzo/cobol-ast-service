import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('📍 Navigating to demo page...');
  await page.goto('http://localhost:3001/demo', { waitUntil: 'networkidle' });
  
  // Wait for the page to be ready
  await page.waitForTimeout(2000);
  
  // Check initial state
  console.log('\n📋 Checking initial page state...');
  const pageTitle = await page.title();
  console.log('Title:', pageTitle);
  
  // Look for tabs in the demo results area
  console.log('\n🔍 Looking for result tabs...');
  
  // Find "Try Demo" or similar button and click
  const demoBtn = await page.$('text=Try Demo');
  if (demoBtn) {
    console.log('Found "Try Demo" button');
  }
  
  // Check for Monaco editor elements
  const monacoContainer = await page.$('.monaco-editor');
  console.log('Monaco Editor present:', !!monacoContainer);
  
  // Check for any code blocks
  const codeBlocks = await page.$$('pre, code, .monaco-editor');
  console.log('Code blocks found:', codeBlocks.length);
  
  // Take a screenshot of the demo page
  await page.screenshot({ path: '/workspace/test-tabs-demo.png', fullPage: true });
  console.log('\n📸 Screenshot saved to test-tabs-demo.png');
  
  // Now check the dashboard page
  console.log('\n\n📍 Navigating to dashboard...');
  await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Check if we got redirected to login
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  if (currentUrl.includes('/login')) {
    console.log('⚠️  Redirected to login - dashboard requires auth');
    await page.screenshot({ path: '/workspace/test-tabs-login.png', fullPage: true });
  } else {
    // Look for tabs on dashboard
    const tabs = await page.$$('[role="tablist"] button, [role="tab"]');
    console.log('Tabs found:', tabs.length);
    
    for (const tab of tabs) {
      const text = await tab.textContent();
      console.log('  Tab:', text?.trim());
    }
    
    await page.screenshot({ path: '/workspace/test-tabs-dashboard.png', fullPage: true });
  }
  
  await browser.close();
  console.log('\n✅ Test complete');
})();
