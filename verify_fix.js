const { chromium } = require('playwright');

(async () => {
  console.log('='.repeat(70));
  console.log('VÉRIFICATION DE L\'APPLICATION - Test Oracle v9.0');
  console.log('='.repeat(70));
  console.log();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    console.log(`  [${msg.type()}] ${text}`);
  });

  try {
    console.log('1. Navigation vers l\'application...');
    await page.goto('https://cobol-ast-service-git-main-emmanuel-beb-a-ngons-projects.vercel.app/', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    console.log('   ✓ Page chargée');

    // Wait for page to be fully loaded
    await page.waitForTimeout(2000);

    console.log();
    console.log('2. Vérification des éléments de l\'interface...');

    // Check for key elements
    const elements = {
      'Logo/Title': 'text=CodeSwitch',
      'Upload Area': 'text=Upload .cbl',
      'AI Insights': 'text=AI Insights',
      'Refactor Button': 'text=Refactor with Gemini'
    };

    for (const [name, selector] of Object.entries(elements)) {
      const element = await page.$(selector);
      if (element) {
        console.log(`   ✓ ${name} trouvé`);
      } else {
        console.log(`   ⚠ ${name} non trouvé`);
      }
    }

    console.log();
    console.log('3. Vérification du Test Oracle...');

    // Look for Test Oracle section
    const testOracle = await page.$('text=Test Oracle');
    if (testOracle) {
      console.log('   ✓ Test Oracle trouvé');

      // Check for errors in Test Oracle
      const errorText = await page.textContent('body');
      if (errorText.includes('unterminated string literal')) {
        console.log('   ⚠ Erreur detectée: unterminated string literal');
        console.log('   → Le fix n\'est pas encore déployé ou nécessite un re-test');
      } else if (errorText.includes('Tests Passed')) {
        console.log('   ✓ Les tests passent!');
      }
    } else {
      console.log('   ⚠ Test Oracle non trouvé sur cette page');
    }

    console.log();
    console.log('4. Console Logs (extraits):');
    const relevantLogs = consoleLogs.filter(log =>
      log.includes('transpile') ||
      log.includes('test') ||
      log.includes('deterministic') ||
      log.includes('gemini') ||
      log.includes('error')
    ).slice(0, 10);

    for (const log of relevantLogs) {
      console.log(`   ${log}`);
    }

    console.log();
    console.log('='.repeat(70));
    console.log('RÉSULTAT DE LA VÉRIFICATION');
    console.log('='.repeat(70));

    // Final assessment
    const pageContent = await page.textContent('body');

    if (pageContent.includes('unterminated string literal')) {
      console.log('⚠ LE FIX N\'EST PAS ENCORE ACTIF');
      console.log('   L\'erreur "unterminated string literal" est toujours présente.');
      console.log('   Le Test Oracle utilise peut-être encore Gemini.');
      console.log('   Veuillez:');
      console.log('   1. Attendre que le déploiement soit complet (Vercel)');
      console.log('   2. Rafraîchir la page (F5)');
      console.log('   3. Ou uploader à nouveau le fichier pour déclencher un nouveau test');
    } else if (pageContent.includes('Tests Passed') || pageContent.includes('0 Tests Failed')) {
      console.log('✓ LE FIX EST ACTIF!');
      console.log('   Les tests déterministes fonctionnent correctement.');
    } else {
      console.log('? ÉTAT INDÉTERMINÉ');
      console.log('   Le Test Oracle n\'a pas pu être vérifié automatiquement.');
      console.log('   Veuillez vérifier manuellement dans l\'interface.');
    }

    console.log('='.repeat(70));

  } catch (error) {
    console.error('Erreur lors de la vérification:', error.message);
  } finally {
    await browser.close();
  }
})();
