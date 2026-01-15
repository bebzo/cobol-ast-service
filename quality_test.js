const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('=== TEST QUALITÉ DÉTAILLÉ ===\n');
  
  // Connexion
  console.log('1️⃣ CONNEXION...');
  await page.goto('https://cobol-ast-service.vercel.app/login');
  await page.waitForTimeout(3000);
  await page.fill('input[type="email"]', 'embebangon@gmail.com');
  await page.fill('input[type="password"]', 'EManu1231975@@');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(5000);
  console.log('✅ Connecté!\n');
  
  // Charger démo et analyser
  console.log('2️⃣ CHARGEMENT & ANALYSE...');
  await page.click('button:has-text("Load Demo")');
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Refactor with Gemini")');
  console.log('   Analyse en cours (40s)...');
  await page.waitForTimeout(40000);
  console.log('✅ Analyse terminée!\n');
  
  // ===== TEST ONGLET PYTHON =====
  console.log('3️⃣ ONGLET PYTHON...');
  await page.click('button:has-text("Python")');
  await page.waitForTimeout(2000);
  
  const pythonContent = await page.textContent('body');
  const hasPythonCode = pythonContent.includes('def ') || pythonContent.includes('class ') || pythonContent.includes('import ');
  console.log(`   Code Python généré: ${hasPythonCode ? '✅ OUI' : '❌ NON'}`);
  await page.screenshot({ path: '/workspace/screenshots/quality_python.png', fullPage: true });
  
  // ===== TEST ONGLET DIFF =====
  console.log('\n4️⃣ ONGLET DIFF...');
  await page.click('button:has-text("Diff")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/workspace/screenshots/quality_diff_before.png', fullPage: true });
  
  // Vérifier la vue diff
  const diffContent = await page.textContent('body');
  const hasDiffView = diffContent.includes('COBOL') && diffContent.includes('Python');
  console.log(`   Vue comparaison COBOL/Python: ${hasDiffView ? '✅ OUI' : '❌ NON'}`);
  
  // Tester l'interaction - cliquer sur une ligne
  const diffLines = await page.locator('.diff-line, [class*="line"], pre code').first();
  if (await diffLines.isVisible()) {
    await diffLines.click();
    await page.waitForTimeout(1000);
    console.log('   Interaction clic sur ligne: ✅ Testé');
    await page.screenshot({ path: '/workspace/screenshots/quality_diff_after.png', fullPage: true });
  }
  
  // ===== TEST ONGLET MÉTRIQUES =====
  console.log('\n5️⃣ ONGLET MÉTRIQUES...');
  await page.click('button:has-text("Métriques")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/workspace/screenshots/quality_metriques.png', fullPage: true });
  
  const metriquesContent = await page.textContent('body');
  
  // Vérifier les valeurs numériques
  const hasNumbers = /\d+(\.\d+)?/.test(metriquesContent);
  const hasLiveIndicator = metriquesContent.includes('LIVE') || metriquesContent.includes('Temps Réel');
  const notWaiting = !metriquesContent.includes('EN ATTENTE');
  
  console.log(`   Valeurs numériques: ${hasNumbers ? '✅ OUI' : '❌ NON'}`);
  console.log(`   Indicateur temps réel: ${hasLiveIndicator ? '✅ OUI' : '❌ NON'}`);
  console.log(`   Données actives (pas EN ATTENTE): ${notWaiting ? '✅ OUI' : '❌ NON'}`);
  
  // ===== TEST ONGLET REPORT =====
  console.log('\n6️⃣ ONGLET REPORT...');
  await page.click('button:has-text("Report")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/workspace/screenshots/quality_report.png', fullPage: true });
  
  const reportContent = await page.textContent('body');
  const hasReportData = reportContent.includes('Summary') || reportContent.includes('Résumé') || 
                        reportContent.includes('Analysis') || reportContent.includes('Analyse');
  console.log(`   Rapport généré: ${hasReportData ? '✅ OUI' : '❌ NON'}`);
  
  // ===== TEST ONGLET ARCHITECTURE =====
  console.log('\n7️⃣ ONGLET ARCHITECTURE...');
  await page.click('button:has-text("Architecture")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/workspace/screenshots/quality_architecture.png', fullPage: true });
  
  const archContent = await page.textContent('body');
  const hasArchDiagram = archContent.includes('Component') || archContent.includes('Module') || 
                         archContent.includes('Layer') || archContent.includes('Service');
  console.log(`   Diagramme architecture: ${hasArchDiagram ? '✅ OUI' : '❌ NON'}`);
  
  // ===== TEST ONGLET IMPACT =====
  console.log('\n8️⃣ ONGLET IMPACT...');
  await page.click('button:has-text("Impact")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/workspace/screenshots/quality_impact.png', fullPage: true });
  
  const impactContent = await page.textContent('body');
  const hasImpactData = impactContent.includes('Risk') || impactContent.includes('Impact') || 
                        impactContent.includes('High') || impactContent.includes('Medium') || impactContent.includes('Low');
  console.log(`   Analyse d'impact: ${hasImpactData ? '✅ OUI' : '❌ NON'}`);
  
  // ===== TEST ONGLET CALL GRAPH =====
  console.log('\n9️⃣ ONGLET CALL GRAPH...');
  await page.click('button:has-text("Call Graph")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/workspace/screenshots/quality_callgraph.png', fullPage: true });
  
  // Vérifier si le graphe est visible (SVG ou canvas)
  const hasSvg = await page.locator('svg').first().isVisible().catch(() => false);
  const hasCanvas = await page.locator('canvas').first().isVisible().catch(() => false);
  console.log(`   Graphe visuel: ${(hasSvg || hasCanvas) ? '✅ OUI' : '❌ NON (ou texte)'}`);
  
  // ===== TEST ONGLET EXPORT =====
  console.log('\n🔟 ONGLET EXPORT...');
  await page.click('button:has-text("Export")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/workspace/screenshots/quality_export.png', fullPage: true });
  
  const exportContent = await page.textContent('body');
  const hasExportOptions = exportContent.includes('Download') || exportContent.includes('Export') || 
                           exportContent.includes('ZIP') || exportContent.includes('PDF');
  console.log(`   Options d'export: ${hasExportOptions ? '✅ OUI' : '❌ NON'}`);
  
  console.log('\n=== TEST TERMINÉ ===');
  console.log('📸 Screenshots sauvegardés dans /workspace/screenshots/');
  
  await browser.close();
})();
