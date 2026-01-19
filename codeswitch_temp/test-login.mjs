import { chromium } from 'playwright';

async function testLogin() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🔍 Testing login page...\n');
  
  try {
    await page.goto('https://cobol-ast-service.vercel.app/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✓ Page loaded');
    
    // Wait for content
    await page.waitForTimeout(2000);
    
    // Check for buttons
    const demoButton = await page.locator('button:has-text("Try Demo")');
    const googleButton = await page.locator('button:has-text("Google")');
    const githubButton = await page.locator('button:has-text("GitHub")');
    
    console.log('\nButton visibility:');
    console.log('- Demo button visible:', await demoButton.isVisible());
    console.log('- Google button visible:', await googleButton.isVisible());
    console.log('- GitHub button visible:', await githubButton.isVisible());
    
    // Check if buttons are disabled
    console.log('\nButton states:');
    console.log('- Demo button disabled:', await demoButton.isDisabled().catch(() => 'N/A'));
    console.log('- Google button disabled:', await googleButton.isDisabled().catch(() => 'N/A'));
    console.log('- GitHub button disabled:', await githubButton.isDisabled().catch(() => 'N/A'));
    
    // Try clicking Demo button
    console.log('\n📸 Taking screenshot before click...');
    await page.screenshot({ path: 'login-before-click.png' });
    
    if (await demoButton.isVisible()) {
      console.log('\n🖱️ Clicking Demo button...');
      await demoButton.click();
      await page.waitForTimeout(3000);
      
      console.log('Current URL after click:', page.url());
      await page.screenshot({ path: 'login-after-click.png' });
    }
    
    // Check for any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'login-error.png' });
  }
  
  await browser.close();
  console.log('\n✅ Test complete');
}

testLogin();
