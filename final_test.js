const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('=== TEST FINAL MÉTRIQUES ===\n');
  
  await page.goto('https://cobol-ast-service.vercel.app/login');
  await page.waitForTimeout(3000);
  await page.fill('input[type="email"]', 'embebangon@gmail.com');
  await page.fill('input[type="password"]', 'EManu1231975@@');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(5000);
  console.log('✅ Connecté');
  
  await page.click('button:has-text("Load Demo")');
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Refactor with Gemini")');
  console.log('⏳ Analyse (40s)...');
  await page.waitForTimeout(40000);
  console.log('✅ Analyse OK');
  
  // Aller sur Métriques
  await page.click('button:has-text("Métriques")');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/workspace/screenshots/metriques_v2.png', fullPage: true });
  
  const content = await page.textContent('body');
  console.log('\n📊 RÉSULTATS:');
  console.log(`   EN ATTENTE visible: ${content.includes('EN ATTENTE') ? '❌ OUI (problème)' : '✅ NON (OK)'}`);
  console.log(`   LIVE visible: ${content.includes('LIVE') ? '✅ OUI' : '❌ NON'}`);
  console.log(`   Temps de Transpilation: ${content.includes('Temps de Transpilation') ? '✅' : '❌'}`);
  console.log(`   Taux de Succès: ${content.includes('Taux de Succès') ? '✅' : '❌'}`);
  
  await browser.close();
})();
