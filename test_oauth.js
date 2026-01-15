const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('=== TEST OAUTH GOOGLE & GITHUB ===\n');
  
  await page.goto('https://cobol-ast-service.vercel.app/login');
  await page.waitForTimeout(3000);
  
  // Test bouton Google
  console.log('1️⃣ Test bouton Google...');
  const googleBtn = page.locator('button:has-text("Continue with Google")');
  if (await googleBtn.isVisible()) {
    console.log('   ✅ Bouton visible');
    
    // Cliquer et vérifier la redirection
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
      googleBtn.click()
    ]);
    
    await page.waitForTimeout(2000);
    const newUrl = page.url();
    
    if (newUrl.includes('google') || newUrl.includes('accounts.google')) {
      console.log('   ✅ Redirection Google OAuth OK');
    } else if (popup) {
      console.log('   ✅ Popup Google ouvert:', popup.url().substring(0, 50));
    } else {
      console.log('   ⚠️  URL après clic:', newUrl.substring(0, 60));
      await page.screenshot({ path: '/workspace/screenshots/oauth_google.png' });
    }
  } else {
    console.log('   ❌ Bouton non trouvé');
  }
  
  // Retour à la page login
  await page.goto('https://cobol-ast-service.vercel.app/login');
  await page.waitForTimeout(2000);
  
  // Test bouton GitHub
  console.log('\n2️⃣ Test bouton GitHub...');
  const githubBtn = page.locator('button:has-text("Continue with GitHub")');
  if (await githubBtn.isVisible()) {
    console.log('   ✅ Bouton visible');
    
    const [popup2] = await Promise.all([
      page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
      githubBtn.click()
    ]);
    
    await page.waitForTimeout(2000);
    const newUrl2 = page.url();
    
    if (newUrl2.includes('github')) {
      console.log('   ✅ Redirection GitHub OAuth OK');
    } else if (popup2) {
      console.log('   ✅ Popup GitHub ouvert:', popup2.url().substring(0, 50));
    } else {
      console.log('   ⚠️  URL après clic:', newUrl2.substring(0, 60));
      await page.screenshot({ path: '/workspace/screenshots/oauth_github.png' });
    }
  } else {
    console.log('   ❌ Bouton non trouvé');
  }
  
  await browser.close();
})();
