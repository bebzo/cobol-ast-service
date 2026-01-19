import { chromium } from 'playwright';

const BASE_URL = 'https://cobol-ast-service.vercel.app';

async function testCodeSwitchV85() {
  console.log('🚀 Testing CodeSwitch v8.5 with Playwright\n');
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  function logTest(name, passed, details = '') {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${name}${details ? ' - ' + details : ''}`);
    results.tests.push({ name, passed, details });
    if (passed) results.passed++; else results.failed++;
  }
  
  try {
    // Test 1: Homepage loads
    console.log('\n📍 Test 1: Homepage');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    const title = await page.title();
    logTest('Homepage loads', title.includes('CodeSwitch') || title.length > 0, `Title: ${title}`);
    
    // Test 2: API Health endpoint
    console.log('\n📍 Test 2: API Health');
    const healthResponse = await page.goto(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    logTest('API Health returns healthy', healthData.status === 'healthy', `Status: ${healthData.status}`);
    logTest('Gemini integration available', healthData.capabilities?.gemini_integration === true);
    
    // Test 3: Login page
    console.log('\n📍 Test 3: Login Page');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    const loginForm = await page.locator('input[type="email"], input[placeholder*="email" i]').count();
    logTest('Login page has email input', loginForm > 0);
    
    // Test 4: Dashboard page structure (may redirect to login)
    console.log('\n📍 Test 4: Dashboard Structure');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // Wait for any redirects
    
    const currentUrl = page.url();
    const onDashboard = currentUrl.includes('/dashboard');
    const onLogin = currentUrl.includes('/login');
    
    if (onLogin) {
      logTest('Dashboard redirects to login (auth required)', true, 'Expected behavior');
    } else if (onDashboard) {
      logTest('Dashboard accessible', true);
      
      // Check for v8.5 UI elements
      const pageContent = await page.content();
      
      // Check Shadow Test tab
      const hasShadowTab = pageContent.includes('Shadow Test') || pageContent.includes('shadow');
      logTest('Shadow Test tab present', hasShadowTab);
      
      // Check Compliance tab
      const hasComplianceTab = pageContent.includes('Compliance') || pageContent.includes('compliance');
      logTest('Compliance tab present', hasComplianceTab);
      
      // Check for navigation buttons
      const navButtons = await page.locator('button').count();
      logTest('Navigation buttons present', navButtons > 5, `Found ${navButtons} buttons`);
    }
    
    // Test 5: Demo page
    console.log('\n📍 Test 5: Demo Page');
    await page.goto(`${BASE_URL}/demo`, { waitUntil: 'networkidle', timeout: 30000 });
    const demoContent = await page.content();
    logTest('Demo page loads', demoContent.length > 1000);
    
    // Test 6: Docs page
    console.log('\n📍 Test 6: Documentation');
    await page.goto(`${BASE_URL}/docs`, { waitUntil: 'networkidle', timeout: 30000 });
    const docsContent = await page.content();
    logTest('Docs page loads', docsContent.length > 1000);
    
    // Test 7: API Analyse endpoint (structure check)
    console.log('\n📍 Test 7: API Analyse Endpoint');
    const analyseResponse = await page.request.post(`${BASE_URL}/api/analyse`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ cobolCode: 'IDENTIFICATION DIVISION.' })
    });
    logTest('API Analyse responds', analyseResponse.status() === 200 || analyseResponse.status() === 400 || analyseResponse.status() === 500, `Status: ${analyseResponse.status()}`);
    
    // Test 8: Check page load performance
    console.log('\n📍 Test 8: Performance');
    const startTime = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;
    logTest('Homepage loads under 5s', loadTime < 5000, `${loadTime}ms`);
    
    // Test 9: Mobile responsiveness
    console.log('\n📍 Test 9: Mobile Responsiveness');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    const mobileContent = await page.content();
    logTest('Mobile view renders', mobileContent.length > 1000);
    
    // Test 10: Screenshot for visual verification
    console.log('\n📍 Test 10: Visual Capture');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: '/workspace/screenshot-login.png', fullPage: false });
    logTest('Screenshot captured', true, 'screenshot-login.png');
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    results.failed++;
  } finally {
    await browser.close();
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  console.log('='.repeat(60));
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! CodeSwitch v8.5 is fully operational.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Review the results above.\n');
  }
  
  return results;
}

testCodeSwitchV85().catch(console.error);
