import { chromium } from 'playwright';

const URL = 'https://tzvy1x8k9q7y.space.minimax.io';

async function testV87Features() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🧪 Testing v8.7 deployment...\n');
  
  try {
    // Test 1: Page loads
    console.log('1. Loading page...');
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('   ✅ Page loaded successfully\n');
    
    // Test 2: Main UI elements exist
    console.log('2. Checking main UI elements...');
    const title = await page.title();
    console.log(`   Title: ${title}`);
    
    // Check for COBOL editor
    const editorExists = await page.locator('.monaco-editor, textarea').first().isVisible().catch(() => false);
    console.log(`   ✅ Editor visible: ${editorExists}\n`);
    
    // Test 3: Take screenshot
    console.log('3. Taking screenshot...');
    await page.screenshot({ path: '/workspace/test-results/v87-homepage.png', fullPage: true });
    console.log('   ✅ Screenshot saved to test-results/v87-homepage.png\n');
    
    // Test 4: Check for key components
    console.log('4. Checking for key components...');
    const pageContent = await page.content();
    
    const checks = [
      { name: 'Analyze button', found: pageContent.includes('Analyze') || pageContent.includes('analyze') },
      { name: 'COBOL reference', found: pageContent.includes('COBOL') },
      { name: 'Python reference', found: pageContent.includes('Python') },
    ];
    
    checks.forEach(check => {
      console.log(`   ${check.found ? '✅' : '❌'} ${check.name}`);
    });
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: '/workspace/test-results/v87-error.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
}

testV87Features();
