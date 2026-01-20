const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const issues = [];
  
  console.log('=== TEST COMPLET CODESWITCH ===\n');
  
  // 1. Connexion
  console.log('1️⃣ CONNEXION...');
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
  console.log('✅ Connecté!\n');
  
  // 2. Charger le code démo
  console.log('2️⃣ CHARGEMENT CODE DEMO...');
  const demoBtn = page.locator('button:has-text("Load Demo")');
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    await page.waitForTimeout(2000);
    console.log('✅ Code démo chargé\n');
  } else {
    issues.push('Bouton Load Demo non visible');
  }
  
  // 3. Lancer l'analyse
  console.log('3️⃣ LANCEMENT ANALYSE...');
  const analyzeBtn = page.locator('button:has-text("Refactor with Gemini")');
  if (await analyzeBtn.isVisible()) {
    await analyzeBtn.click();
    console.log('   Analyse en cours (attente 30s)...');
    await page.waitForTimeout(30000);
    console.log('✅ Analyse terminée\n');
  } else {
    issues.push('Bouton Refactor non visible');
  }
  
  // 4. Visiter chaque onglet
  const tabs = [
    { name: 'Python', expected: ['def ', 'class ', 'import ', 'python'] },
    { name: 'Tests', expected: ['test', 'assert', 'pytest', 'unittest'] },
    { name: 'Config', expected: ['config', 'settings', 'options'] },
    { name: 'Diff', expected: ['diff', 'changes', 'comparison'] },
    { name: 'Architecture', expected: ['architecture', 'components', 'structure'] },
    { name: 'Modules', expected: ['module', 'dependency', 'import'] },
    { name: 'DDD', expected: ['domain', 'entity', 'aggregate'] },
    { name: 'Impact', expected: ['impact', 'risk', 'analysis'] },
    { name: 'Report', expected: ['report', 'summary', 'analysis'] },
    { name: 'Métriques', expected: ['métriques', 'temps', 'performance'] },
    { name: 'Call Graph', expected: ['graph', 'call', 'function'] },
    { name: 'Export', expected: ['export', 'download', 'zip'] }
  ];
  
  console.log('4️⃣ VISITE DES ONGLETS...\n');
  
  for (const tab of tabs) {
    console.log(`   📑 ${tab.name}...`);
    const tabBtn = page.locator(`button:has-text("${tab.name}")`).first();
    
    if (await tabBtn.isVisible()) {
      await tabBtn.click();
      await page.waitForTimeout(1500);
      
      // Screenshot
      const filename = tab.name.toLowerCase().replace(/\s+/g, '_');
      await page.screenshot({ path: `/workspace/screenshots/tab_${filename}.png`, fullPage: true });
      
      // Vérifier le contenu
      const content = await page.textContent('body');
      const contentLower = content.toLowerCase();
      
      // Vérifier les erreurs visibles
      if (contentLower.includes('error') && !contentLower.includes('no error')) {
        issues.push(`${tab.name}: Erreur visible sur la page`);
        console.log(`      ⚠️  Erreur détectée`);
      }
      
      // Vérifier si le contenu est vide
      if (contentLower.includes('no data') || contentLower.includes('aucune donnée') || 
          (contentLower.includes('empty') && !contentLower.includes('non-empty'))) {
        console.log(`      ⚠️  Contenu vide ou manquant`);
      } else {
        console.log(`      ✅ OK`);
      }
    } else {
      issues.push(`${tab.name}: Onglet non trouvé`);
      console.log(`      ❌ Non trouvé`);
    }
  }
  
  // 5. Résumé
  console.log('\n=== RÉSUMÉ ===');
  if (issues.length === 0) {
    console.log('✅ Aucun problème détecté!');
  } else {
    console.log(`❌ ${issues.length} problème(s) détecté(s):`);
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  await browser.close();
})();
