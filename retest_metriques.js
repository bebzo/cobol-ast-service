const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('=== RETEST MÉTRIQUES ===\n');
  
  // Connexion
  await page.goto('https://cobol-ast-service.vercel.app/login');
  await page.waitForTimeout(3000);
  await page.fill('input[type="email"]', 'embebangon@gmail.com');
  await page.fill('input[type="password"]', 'EManu1231975@@');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(5000);
  console.log('✅ Connecté');
  
  // Load demo + analyse
  await page.click('button:has-text("Load Demo")');
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Refactor with Gemini")');
  console.log('⏳ Analyse en cours (45s)...');
  await page.waitForTimeout(45000);
  console.log('✅ Analyse terminée');
  
  // Test Métriques
  console.log('\n📊 TEST ONGLET MÉTRIQUES...');
  await page.click('button:has-text("Métriques")');
  await page.waitForTimeout(3000);
  
  const content = await page.textContent('body');
  
  const isActive = !content.includes('EN ATTENTE') && !content.includes('Aucune analyse');
  const hasLive = content.includes('LIVE');
  const hasRealValues = content.includes('Temps de Transpilation') || content.includes('Taux de Succès');
  
  console.log(`   État actif (pas EN ATTENTE): ${isActive ? '✅ OUI' : '❌ NON'}`);
  console.log(`   Badge LIVE: ${hasLive ? '✅ OUI' : '❌ NON'}`);
  console.log(`   Métriques visibles: ${hasRealValues ? '✅ OUI' : '❌ NON'}`);
  
  await page.screenshot({ path: '/workspace/screenshots/metriques_final.png', fullPage: true });
  console.log('\n📸 Screenshot sauvegardé');
  
  await browser.close();
})();
