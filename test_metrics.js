const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('1️⃣ Connexion...');
  await page.goto('https://cobol-ast-service.vercel.app/login');
  await page.waitForTimeout(3000);
  
  await page.fill('input[type="email"]', 'embebangon@gmail.com');
  await page.fill('input[type="password"]', 'EManu1231975@@');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(5000);
  
  const url = page.url();
  console.log('   URL:', url);
  
  if (url.includes('dashboard')) {
    console.log('✅ Connecté au dashboard!');
    
    // Chercher l'onglet Métriques
    console.log('\n2️⃣ Recherche onglet Métriques...');
    const metriquesTab = await page.locator('button:has-text("Métriques")').first();
    
    if (await metriquesTab.isVisible()) {
      console.log('✅ Onglet "Métriques" trouvé!');
      await metriquesTab.click();
      await page.waitForTimeout(2000);
      
      // Screenshot
      await page.screenshot({ path: '/workspace/screenshots/metriques_tab.png', fullPage: true });
      console.log('📸 Screenshot sauvegardé');
      
      // Vérifier le contenu
      const content = await page.textContent('body');
      if (content.includes('Métriques Temps Réel')) {
        console.log('✅ Titre "Métriques Temps Réel" visible');
      }
      if (content.includes('EN ATTENTE') || content.includes('Aucune analyse')) {
        console.log('✅ État vide affiché (correct - pas d\'analyse)');
      }
    } else {
      console.log('❌ Onglet Métriques non trouvé');
      const tabs = await page.locator('button').allTextContents();
      console.log('   Onglets disponibles:', tabs.filter(t => t.length > 1 && t.length < 20).join(', '));
    }
  } else {
    console.log('❌ Connexion échouée');
    await page.screenshot({ path: '/workspace/screenshots/login_fail.png', fullPage: true });
  }
  
  await browser.close();
})();
