import { chromium } from 'playwright';

async function testProd() {
  console.log('🔍 Test Production - cobol-ast-service.vercel.app');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  
  try {
    // Go to production dashboard
    console.log('📡 Loading production site...');
    await page.goto('https://cobol-ast-service.vercel.app/dashboard', { 
      timeout: 30000,
      waitUntil: 'networkidle' 
    });
    
    // Check if redirected to login
    const url = page.url();
    console.log('📍 Current URL:', url);
    
    if (url.includes('login')) {
      console.log('⚠️ Redirected to login page (expected behavior)');
    }
    
    // Take screenshot
    await page.screenshot({ path: '/workspace/prod-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved: prod-screenshot.png');
    
    // Check for JS errors
    if (errors.length > 0) {
      console.log('\n❌ Console Errors:');
      errors.forEach(e => console.log('  -', e.substring(0, 200)));
    } else {
      console.log('\n✅ No console errors detected');
    }
    
  } catch (e) {
    console.log('❌ Error:', e.message);
  }
  
  await browser.close();
}

testProd();
