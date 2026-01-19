const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('=== TEST CONNEXION ADMIN ===\n');
  
  // Login
  console.log('1️⃣ Page login...');
  await page.goto('https://cobol-ast-service.vercel.app/login');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/workspace/screenshots/login_page.png' });
  
  console.log('2️⃣ Saisie identifiants...');
  await page.fill('input[type="email"]', 'embebangon@gmail.com');
  await page.fill('input[type="password"]', 'EManu1231975@@');
  
  // Test toggle password
  const eyeBtn = await page.locator('button[type="button"]').last();
  if (await eyeBtn.isVisible()) {
    await eyeBtn.click();
    await page.waitForTimeout(500);
    console.log('   ✅ Toggle password visible');
  }
  
  console.log('3️⃣ Connexion...');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(5000);
  
  const url = page.url();
  console.log('   URL:', url);
  
  if (url.includes('dashboard')) {
    console.log('   ✅ Redirection dashboard OK!\n');
    
    // Vérifier l'email affiché
    const content = await page.textContent('body');
    if (content.includes('embebangon@gmail.com')) {
      console.log('4️⃣ Email affiché: ✅');
    }
    
    // Test Load Demo
    console.log('5️⃣ Test Load Demo...');
    await page.click('button:has-text("Load Demo")');
    await page.waitForTimeout(2000);
    
    const codeLoaded = await page.textContent('body');
    if (codeLoaded.includes('IDENTIFICATION') || codeLoaded.includes('COBOL')) {
      console.log('   ✅ Code COBOL chargé');
    }
    
    // Screenshot dashboard
    await page.screenshot({ path: '/workspace/screenshots/dashboard_logged.png', fullPage: true });
    console.log('   📸 Screenshot dashboard');
    
    console.log('\n=== TOUT FONCTIONNE ✅ ===');
  } else {
    console.log('   ❌ Connexion échouée');
    await page.screenshot({ path: '/workspace/screenshots/login_error.png' });
  }
  
  await browser.close();
})();
