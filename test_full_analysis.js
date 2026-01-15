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
  
  if (!page.url().includes('dashboard')) {
    console.log('❌ Connexion échouée');
    await browser.close();
    return;
  }
  console.log('✅ Connecté!');
  
  // 2. Charger le code de démo
  console.log('\n2️⃣ Chargement code démo...');
  const loadDemoBtn = await page.locator('button:has-text("Load Demo")').first();
  await loadDemoBtn.click();
  await page.waitForTimeout(3000);
  console.log('✅ Code démo chargé');
  
  // 3. Lancer l'analyse avec Gemini
  console.log('\n3️⃣ Lancement analyse Gemini...');
  const refactorBtn = await page.locator('button:has-text("Refactor with Gemini")').first();
  if (await refactorBtn.isVisible()) {
    await refactorBtn.click();
    console.log('   Analyse en cours (attente 30s)...');
    await page.waitForTimeout(30000);
  }
  
  // 4. Screenshot de l'onglet Code (résultat Python)
  console.log('\n4️⃣ Capture des onglets...');
  await page.screenshot({ path: '/workspace/screenshots/01_code_result.png', fullPage: true });
  console.log('   📸 Code/Python');
  
  // 5. Onglet Métriques
  const metriquesTab = await page.locator('button:has-text("Métriques")').first();
  if (await metriquesTab.isVisible()) {
    await metriquesTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/workspace/screenshots/02_metriques.png', fullPage: true });
    console.log('   📸 Métriques');
  }
  
  // 6. Onglet Architecture
  const archTab = await page.locator('button:has-text("Architecture")').first();
  if (await archTab.isVisible()) {
    await archTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/workspace/screenshots/03_architecture.png', fullPage: true });
    console.log('   📸 Architecture');
  }
  
  // 7. Onglet DDD
  const dddTab = await page.locator('button:has-text("DDD")').first();
  if (await dddTab.isVisible()) {
    await dddTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/workspace/screenshots/04_ddd.png', fullPage: true });
    console.log('   📸 DDD');
  }
  
  // 8. Onglet Report
  const reportTab = await page.locator('button:has-text("Report")').first();
  if (await reportTab.isVisible()) {
    await reportTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/workspace/screenshots/05_report.png', fullPage: true });
    console.log('   📸 Report');
  }
  
  console.log('\n✅ Analyse complète! Screenshots sauvegardés.');
  await browser.close();
})();
