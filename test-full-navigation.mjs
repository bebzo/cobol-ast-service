import { chromium } from 'playwright';

const BASE_URL = 'https://cobol-ast-service.vercel.app';

async function testFullNavigation() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const issues = [];
  const screenshots = [];
  
  console.log('🧪 Testing Full Navigation System\n');
  console.log('='.repeat(50));

  // Helper function
  const testLink = async (selector, expectedUrl, name) => {
    try {
      const link = page.locator(selector).first();
      if (await link.isVisible({ timeout: 3000 })) {
        await link.click();
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        if (currentUrl.includes(expectedUrl)) {
          console.log(`✅ ${name}: OK (${currentUrl})`);
          return true;
        } else {
          console.log(`⚠️ ${name}: Unexpected URL (${currentUrl})`);
          issues.push({ name, expected: expectedUrl, got: currentUrl });
          return false;
        }
      } else {
        console.log(`❌ ${name}: Link not visible`);
        issues.push({ name, error: 'Link not visible' });
        return false;
      }
    } catch (err) {
      console.log(`❌ ${name}: ${err.message}`);
      issues.push({ name, error: err.message });
      return false;
    }
  };

  try {
    // 1. Test Landing Page
    console.log('\n📍 1. LANDING PAGE');
    console.log('-'.repeat(30));
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: 'nav-01-landing.png' });
    console.log('✅ Landing page loaded');
    
    // Check main elements on landing
    const heroTitle = await page.locator('h1').first().textContent();
    console.log(`   Hero title: "${heroTitle?.substring(0, 50)}..."`);
    
    // Check navigation links
    const navLinks = await page.locator('nav a, header a').count();
    console.log(`   Navigation links found: ${navLinks}`);

    // 2. Test Header Navigation
    console.log('\n📍 2. HEADER NAVIGATION');
    console.log('-'.repeat(30));
    
    // Login button
    await page.goto(BASE_URL);
    await testLink('a:has-text("Login"), a:has-text("Sign In"), button:has-text("Login")', '/login', 'Login link');
    await page.screenshot({ path: 'nav-02-login.png' });
    
    // 3. Test Login Page Buttons
    console.log('\n📍 3. LOGIN PAGE BUTTONS');
    console.log('-'.repeat(30));
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check Demo button
    const demoBtn = page.locator('button:has-text("Demo")');
    if (await demoBtn.isVisible()) {
      console.log('   Demo button: visible');
      await demoBtn.click();
      await page.waitForTimeout(3000);
      if (page.url().includes('/dashboard')) {
        console.log('✅ Demo button: Redirects to dashboard');
      } else {
        console.log(`⚠️ Demo button: Still on ${page.url()}`);
        issues.push({ name: 'Demo button', error: 'No redirect' });
      }
    }
    await page.screenshot({ path: 'nav-03-after-demo-click.png' });
    
    // 4. Test Dashboard
    console.log('\n📍 4. DASHBOARD');
    console.log('-'.repeat(30));
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'nav-04-dashboard.png' });
    console.log(`   Current URL: ${page.url()}`);
    
    // Check if dashboard loads or redirects to login
    if (page.url().includes('/login')) {
      console.log('   Dashboard requires auth (redirected to login)');
    } else if (page.url().includes('/dashboard')) {
      console.log('✅ Dashboard accessible');
      
      // Check main dashboard elements
      const loadDemoBtn = page.locator('button:has-text("Load Demo")');
      const refactorBtn = page.locator('button:has-text("Refactor")');
      const uploadBtn = page.locator('button:has-text("Upload")');
      
      console.log(`   Load Demo button: ${await loadDemoBtn.isVisible() ? 'visible' : 'NOT visible'}`);
      console.log(`   Refactor button: ${await refactorBtn.isVisible() ? 'visible' : 'NOT visible'}`);
      console.log(`   Upload button: ${await uploadBtn.isVisible() ? 'visible' : 'NOT visible'}`);
    }
    
    // 5. Test Docs Page
    console.log('\n📍 5. DOCUMENTATION');
    console.log('-'.repeat(30));
    await page.goto(`${BASE_URL}/docs`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'nav-05-docs.png' });
    
    // Check docs navigation
    const docsSections = await page.locator('nav button, aside button').count();
    console.log(`   Doc sections found: ${docsSections}`);
    
    // Test clicking a section
    const featuresBtn = page.locator('button:has-text("Features")');
    if (await featuresBtn.isVisible()) {
      await featuresBtn.click();
      await page.waitForTimeout(500);
      console.log('✅ Features section clickable');
    }
    
    // 6. Test Demo Page
    console.log('\n📍 6. INTERACTIVE DEMO');
    console.log('-'.repeat(30));
    await page.goto(`${BASE_URL}/demo`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'nav-06-demo.png' });
    
    const playBtn = page.locator('button:has(svg.lucide-play), button:has-text("Play")').first();
    if (await playBtn.isVisible()) {
      console.log('✅ Play button visible');
    } else {
      console.log('⚠️ Play button not found');
      issues.push({ name: 'Demo Play button', error: 'Not visible' });
    }
    
    // 7. Test Pricing Page
    console.log('\n📍 7. PRICING');
    console.log('-'.repeat(30));
    await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'nav-07-pricing.png' });
    
    const pricingCards = await page.locator('[class*="rounded"]').count();
    console.log(`   Pricing elements: ${pricingCards}`);
    
    // 8. Test Contact Page
    console.log('\n📍 8. CONTACT');
    console.log('-'.repeat(30));
    await page.goto(`${BASE_URL}/contact`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'nav-08-contact.png' });
    console.log('✅ Contact page loaded');
    
    // 9. Test Legal Pages
    console.log('\n📍 9. LEGAL PAGES');
    console.log('-'.repeat(30));
    await page.goto(`${BASE_URL}/legal/terms`, { waitUntil: 'networkidle' });
    console.log('✅ Terms page loaded');
    
    await page.goto(`${BASE_URL}/legal/privacy`, { waitUntil: 'networkidle' });
    console.log('✅ Privacy page loaded');
    
    // 10. Test 404 handling
    console.log('\n📍 10. 404 HANDLING');
    console.log('-'.repeat(30));
    await page.goto(`${BASE_URL}/nonexistent-page-xyz`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'nav-10-404.png' });
    const pageContent = await page.content();
    if (pageContent.includes('404') || pageContent.includes('not found')) {
      console.log('✅ 404 page displayed');
    } else {
      console.log('⚠️ No proper 404 handling');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 NAVIGATION TEST SUMMARY');
    console.log('='.repeat(50));
    
    if (issues.length === 0) {
      console.log('✅ All navigation tests passed!');
    } else {
      console.log(`⚠️ Found ${issues.length} issues:`);
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue.name}: ${issue.error || `Expected ${issue.expected}, got ${issue.got}`}`);
      });
    }
    
    console.log('\n📸 Screenshots saved:');
    for (let i = 1; i <= 10; i++) {
      console.log(`   nav-0${i < 10 ? i : i}-*.png`);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'nav-error.png' });
  }

  await browser.close();
  
  return issues;
}

testFullNavigation().then(issues => {
  console.log('\n✅ Navigation test complete');
  process.exit(issues.length > 0 ? 1 : 0);
});
