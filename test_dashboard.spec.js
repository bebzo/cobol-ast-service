const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('1️⃣ Accès à la page login...');
  await page.goto('https://cobol-ast-service.vercel.app/login');
  await page.waitForTimeout(2000);
  
  console.log('2️⃣ Saisie des identifiants...');
  await page.fill('input[type="email"]', 'embebangon@gmail.com');
  await page.fill('input[type="password"]', 'EManu1231975@@');
  
  console.log('3️⃣ Connexion...');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(3000);
  
  console.log('4️⃣ Vérification redirection dashboard...');
  const url = page.url();
  console.log('   URL actuelle:', url);
  
  if (url.includes('dashboard')) {
    console.log('✅ Redirection vers dashboard OK!');
    
    // Screenshot du dashboard
    await page.screenshot({ path: '/workspace/screenshots/dashboard_test.png', fullPage: true });
    console.log('📸 Screenshot sauvegardé');
    
    // Vérifier l'état du dashboard
    const content = await page.textContent('body');
    
    if (content.includes('EN ATTENTE') || content.includes('Aucune analyse')) {
      console.log('✅ Dashboard affiche état vide (EN ATTENTE) - Correct!');
    } else if (content.includes('Dashboard Temps Réel')) {
      console.log('✅ Dashboard Temps Réel visible');
    }
    
    // Vérifier les onglets
    const tabs = await page.locator('[role="tab"], button').allTextContents();
    console.log('📋 Onglets trouvés:', tabs.filter(t => t.length > 0).slice(0, 10).join(', '));
    
  } else {
    console.log('❌ Pas redirigé vers dashboard');
    await page.screenshot({ path: '/workspace/screenshots/login_error.png', fullPage: true });
  }
  
  await browser.close();
})();
