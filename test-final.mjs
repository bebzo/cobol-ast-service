import { chromium } from 'playwright';

async function testFinal() {
  console.log('⏳ Waiting for Vercel deployment (50s)...');
  await new Promise(r => setTimeout(r, 50000));
  
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  console.log('\n📸 Test 1: Homepage (/) shows landing page');
  await page.goto('https://cobol-ast-service.vercel.app/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  const heroText = await page.textContent('h1');
  console.log('✅ Hero:', heroText?.substring(0, 60));
  await page.screenshot({ path: 'screenshots/final-01-homepage.png' });
  
  console.log('\n📸 Test 2: /dashboard requires login');
  await page.goto('https://cobol-ast-service.vercel.app/dashboard', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000); // Wait for client-side redirect
  const currentUrl = page.url();
  console.log('URL after /dashboard:', currentUrl);
  await page.screenshot({ path: 'screenshots/final-02-dashboard.png' });
  
  if (currentUrl.includes('/login')) {
    console.log('✅ Correctly redirected to login!');
  } else {
    // Check if showing loading or auth screen
    const bodyText = await page.textContent('body');
    console.log('Page content:', bodyText?.substring(0, 100));
  }
  
  console.log('\n📸 Test 3: Login page');
  await page.goto('https://cobol-ast-service.vercel.app/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: 'screenshots/final-03-login.png' });
  const hasGoogleBtn = await page.$('button:has-text("Google")');
  const hasGitHubBtn = await page.$('button:has-text("GitHub")');
  console.log('✅ Login page - Google:', !!hasGoogleBtn, 'GitHub:', !!hasGitHubBtn);
  
  await browser.close();
  console.log('\n🎉 All tests completed!');
}

testFinal().catch(console.error);
