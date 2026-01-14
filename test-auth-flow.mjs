import { chromium } from 'playwright';

async function testAuthFlow() {
  console.log('⏳ Waiting for Vercel deployment (45s)...');
  await new Promise(r => setTimeout(r, 45000));
  
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  console.log('\n📸 Test 1: Homepage shows landing page');
  await page.goto('https://cobol-ast-service.vercel.app/', { waitUntil: 'networkidle', timeout: 60000 });
  const heroText = await page.textContent('h1');
  console.log('Hero text:', heroText?.substring(0, 50) + '...');
  await page.screenshot({ path: 'screenshots/test-01-homepage.png' });
  
  console.log('\n📸 Test 2: /app redirects to login');
  await page.goto('https://cobol-ast-service.vercel.app/app', { waitUntil: 'networkidle', timeout: 60000 });
  const currentUrl = page.url();
  console.log('Current URL after /app:', currentUrl);
  await page.screenshot({ path: 'screenshots/test-02-app-redirect.png' });
  
  const redirectedToLogin = currentUrl.includes('/login');
  console.log('Redirected to login:', redirectedToLogin);
  
  console.log('\n📸 Test 3: Login page');
  if (!redirectedToLogin) {
    await page.goto('https://cobol-ast-service.vercel.app/login', { waitUntil: 'networkidle' });
  }
  await page.screenshot({ path: 'screenshots/test-03-login.png' });
  const loginTitle = await page.textContent('h2');
  console.log('Login page title:', loginTitle);
  
  await browser.close();
  console.log('\n✅ Auth flow tests completed!');
}

testAuthFlow().catch(console.error);
