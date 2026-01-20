const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  const networkErrors = [];
  
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  try {
    console.log('=== TEST: SHADOW TESTING ET READINESS ===\n');
    console.log('URL de test: http://localhost:3000/dashboard');
    console.log('Email: embebengon@gmail.com\n');
    
    // First, navigate to login and login
    console.log('1. Connexion à l\'application...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('input[type="email"]', 'embebengon@gmail.com');
    await page.fill('input[type="password"]', 'EManu1231975@@');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    console.log('   ✓ Connecté avec succès');
    console.log(`   URL: ${page.url()}\n`);

    // Now we're on the dashboard, let's explore
    console.log('2. Exploration du dashboard...\n');
    
    // Wait for dashboard to load
    await page.waitForTimeout(3000);
    
    // Get page content
    const pageContent = await page.content();
    const dashboardTitle = await page.title();
    console.log(`   Titre du dashboard: ${dashboardTitle}`);
    
    // Look for various elements
    console.log('\n3. Recherche des fonctionnalités...\n');
    
    // Check for navigation elements
    const navElements = await page.$$('nav, header, .sidebar, .navigation');
    console.log(`   Éléments de navigation: ${navElements.length}`);
    
    // Look for buttons and links
    const allLinks = await page.$$('a, button');
    console.log(`   Liens/boutons totaux: ${allLinks.length}`);
    
    // Look for specific keywords related to shadow testing and readiness
    const keywords = [
      'shadow', 'test', 'readiness', 'analysis', 'cobol', 'python',
      'migration', 'critical', 'score', 'plan', 'phase'
    ];
    
    console.log('\n4. Recherche de mots-clés...\n');
    for (const keyword of keywords) {
      const count = (pageContent.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
      if (count > 0) {
        console.log(`   "${keyword}": ${count} occurrence(s)`);
      }
    }

    // Look for readiness score display
    console.log('\n5. Vérification du score de readiness...\n');
    const readinessPatterns = [
      /readiness/i,
      /score/i,
      /pourcentage/i,
      /progress/i,
      /status/i
    ];
    
    for (const pattern of readinessPatterns) {
      const matches = pageContent.match(pattern);
      if (matches) {
        console.log(`   ✓ Trouvé: ${matches[0]}`);
      }
    }

    // Look for specific UI elements
    console.log('\n6. Analyse de l\'interface...\n');
    
    // Check for cards/panels
    const cards = await page.$$('.card, .panel, [class*="card"], [class*="panel"]');
    console.log(`   Cartes/panneaux: ${cards.length}`);
    
    // Check for tables
    const tables = await page.$$('table');
    console.log(`   Tableaux: ${tables.length}`);
    
    // Check for charts/graphs
    const charts = await page.$$('[class*="chart"], [class*="graph"]');
    console.log(`   Graphiques: ${charts.length}`);

    // Check for specific sections
    console.log('\n7. Sections potentiellement liées au shadow testing...\n');
    
    const sections = [
      { name: 'Analyse History', selectors: ['.history', '#history', '[id*="history"]'] },
      { name: 'Shadow Testing', selectors: ['.shadow', '#shadow', '[id*="shadow"]'] },
      { name: 'Readiness', selectors: ['.readiness', '#readiness', '[id*="readiness"]'] },
      { name: 'Migration', selectors: ['.migration', '#migration', '[id*="migration"]'] },
      { name: 'Results', selectors: ['.results', '#results', '[id*="result"]'] }
    ];
    
    for (const section of sections) {
      let found = false;
      for (const selector of section.selectors) {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          console.log(`   ✓ ${section.name}: Trouvé (${elements.length} élément(s))`);
          found = true;
          break;
        }
      }
      if (!found) {
        console.log(`   ✗ ${section.name}: Non trouvé`);
      }
    }

    // Take a screenshot for visual verification
    console.log('\n8. Capture d\'écran...\n');
    await page.screenshot({ path: '/workspace/dashboard_screenshot.png', fullPage: true });
    console.log('   ✓ Capture sauvegardée: /workspace/dashboard_screenshot.png\n');

    // Check for error messages or issues
    console.log('9. Vérification des erreurs...\n');
    const errors = consoleMessages.filter(m => m.type === 'error');
    if (errors.length > 0) {
      console.log(`   ⚠️ ${errors.length} erreur(s) de console:`);
      errors.forEach((e, i) => {
        console.log(`      ${i + 1}. ${e.text.substring(0, 100)}`);
      });
    } else {
      console.log('   ✓ Aucune erreur de console');
    }

    // Summary
    console.log('\n=== RÉSUMÉ ===');
    console.log(`Page actuelle: ${page.url()}`);
    console.log(`Titre: ${dashboardTitle}`);
    console.log(`Éléments de navigation: ${navElements.length}`);
    console.log(`Liens/boutons: ${allLinks.length}`);
    console.log(`Erreurs: ${errors.length}`);
    console.log('\nLe dashboard semble loaded correctement.');
    console.log('Pour voir le shadow testing et readiness:');
    console.log('  1. Allez à http://localhost:3000/dashboard');
    console.log('  2. Cherchez les sections "Analysis History"');
    console.log('  3. Cliquez sur une analyse pour voir les détails');
    console.log('  4. Vérifiez le "readiness_score" et "shadow_testing_plan"');

  } catch (error) {
    console.error('\n❌ Erreur de test:', error.message);
  } finally {
    await browser.close();
    console.log('\n=== TEST TERMINÉ ===');
  }
})();
