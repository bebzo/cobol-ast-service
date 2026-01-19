const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('=== TEST NOUVEL ONGLET ARCHITECTURE ===\n');
  
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
  console.log('⏳ Analyse (40s)...');
  await page.waitForTimeout(40000);
  console.log('✅ Terminée\n');
  
  // Test Architecture
  console.log('📐 TEST ONGLET ARCHITECTURE...');
  await page.click('button:has-text("Architecture")');
  await page.waitForTimeout(3000);
  
  // Screenshot vue Layers
  await page.screenshot({ path: '/workspace/screenshots/arch_layers.png', fullPage: true });
  console.log('   📸 Vue Layers');
  
  // Test vue Dependencies
  const depsBtn = await page.locator('button:has-text("Dependencies")').first();
  if (await depsBtn.isVisible()) {
    await depsBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/workspace/screenshots/arch_dependencies.png', fullPage: true });
    console.log('   📸 Vue Dependencies');
  }
  
  // Test vue Impact
  const impactBtn = await page.locator('button:has-text("Impact")').first();
  if (await impactBtn.isVisible()) {
    await impactBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/workspace/screenshots/arch_impact.png', fullPage: true });
    console.log('   📸 Vue Impact');
  }
  
  // Test vue Metrics
  const metricsBtn = await page.locator('button:has-text("Metrics")').first();
  if (await metricsBtn.isVisible()) {
    await metricsBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/workspace/screenshots/arch_metrics.png', fullPage: true });
    console.log('   📸 Vue Metrics');
  }
  
  const content = await page.textContent('body');
  const hasLayers = content.includes('Presentation Layer') || content.includes('Business Layer');
  const hasSearch = content.includes('Search');
  const hasExport = content.includes('PNG') || content.includes('SVG');
  
  console.log(`\n✅ Layers: ${hasLayers ? 'OUI' : 'NON'}`);
  console.log(`✅ Search: ${hasSearch ? 'OUI' : 'NON'}`);
  console.log(`✅ Export: ${hasExport ? 'OUI' : 'NON'}`);
  
  console.log('\n=== TEST TERMINÉ ===');
  
  await browser.close();
})();
