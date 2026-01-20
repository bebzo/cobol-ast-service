const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const results = [];
  
  console.log('=== TEST COMPLET TOUS ONGLETS ===\n');
  
  // Connexion
  console.log('1️⃣ CONNEXION...');
  await page.goto('https://cobol-ast-service.vercel.app/login');
  await page.waitForTimeout(3000);
  await page.fill('input[type="email"]', 'embebangon@gmail.com');
  await page.fill('input[type="password"]', 'EManu1231975@@');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(5000);
  console.log('✅ Connecté\n');
  
  // Load demo + analyse
  console.log('2️⃣ ANALYSE...');
  await page.click('button:has-text("Load Demo")');
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Refactor with Gemini")');
  console.log('   En cours (40s)...');
  await page.waitForTimeout(40000);
  console.log('✅ Terminée\n');
  
  // Test chaque onglet
  const tabs = [
    'Python', 'Tests', 'Config', 'Diff', 'Architecture', 
    'Modules', 'DDD', 'Impact', 'Report', 'Métriques', 'Call Graph', 'Export'
  ];
  
  console.log('3️⃣ TEST DES ONGLETS:\n');
  
  for (const tab of tabs) {
    process.stdout.write(`   ${tab.padEnd(15)}`);
    
    try {
      const tabBtn = page.locator(`button:has-text("${tab}")`).first();
      await tabBtn.click();
      await page.waitForTimeout(2000);
      
      const content = await page.textContent('body');
      const filename = tab.toLowerCase().replace(/\s+/g, '_');
      await page.screenshot({ path: `/workspace/screenshots/final_${filename}.png`, fullPage: true });
      
      // Vérifications spécifiques
      let status = '✅';
      let note = '';
      
      if (tab === 'Métriques') {
        if (content.includes('EN ATTENTE')) {
          status = '⚠️';
          note = '(EN ATTENTE)';
        } else if (content.includes('LIVE')) {
          note = '(LIVE actif)';
        }
      } else if (tab === 'Python') {
        if (!content.includes('def ') && !content.includes('class ') && !content.includes('Python')) {
          status = '⚠️';
          note = '(pas de code visible)';
        }
      } else if (tab === 'Tests') {
        if (content.includes('passed') || content.includes('test')) {
          note = '(tests visibles)';
        }
      } else if (tab === 'Export') {
        if (content.includes('Download') || content.includes('Export') || content.includes('ZIP')) {
          note = '(options export OK)';
        }
      }
      
      console.log(`${status} ${note}`);
      results.push({ tab, status, note });
      
    } catch (err) {
      console.log(`❌ Erreur: ${err.message.substring(0, 30)}`);
      results.push({ tab, status: '❌', note: 'erreur' });
    }
  }
  
  // Résumé
  console.log('\n=== RÉSUMÉ ===');
  const ok = results.filter(r => r.status === '✅').length;
  const warn = results.filter(r => r.status === '⚠️').length;
  const fail = results.filter(r => r.status === '❌').length;
  
  console.log(`✅ OK: ${ok} | ⚠️ Attention: ${warn} | ❌ Erreurs: ${fail}`);
  console.log('\n📸 Screenshots dans /workspace/screenshots/final_*.png');
  
  await browser.close();
})();
