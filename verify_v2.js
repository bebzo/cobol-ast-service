const { chromium } = require('playwright');

(async () => {
  console.log('='.repeat(70));
  console.log('VÉRIFICATION DU TEST ORACLE - Application de Production');
  console.log('='.repeat(70));
  console.log();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
  });

  try {
    console.log('1. Navigation vers https://cobol-ast-service.vercel.app...');
    await page.goto('https://cobol-ast-service.vercel.app/', {
      waitUntil: 'networkidle',
      timeout: 90000
    });
    console.log('   ✓ Page chargée');

    // Wait for React to hydrate
    await page.waitForTimeout(3000);

    console.log();
    console.log('2. Extraction du contenu de la page...');
    const pageContent = await page.content();
    console.log(`   ✓ Contenu extrait (${pageContent.length} caractères)`);

    console.log();
    console.log('3. Analyse du Test Oracle...');

    // Check for various error patterns
    const errorPatterns = [
      { pattern: 'unterminated string literal', label: 'Erreur string literal' },
      { pattern: 'Failed to compile Python code', label: 'Erreur compilation' },
      { pattern: 'decimal.Decimal object is not callable', label: 'Erreur Decimal' },
      { pattern: 'Tests Passed', label: 'Tests Passed' },
      { pattern: 'Tests Failed', label: 'Tests Failed' },
      { pattern: 'deterministic', label: 'Tests deterministes' },
      { pattern: 'Test Oracle', label: 'Test Oracle' }
    ];

    let hasError = false;
    let hasSuccess = false;

    for (const { pattern, label } of errorPatterns) {
      if (pageContent.includes(pattern)) {
        console.log(`   ✓ Trouvé: ${label}`);
        if (['Erreur string literal', 'Erreur compilation', 'Erreur Decimal', 'Tests Failed'].includes(label)) {
          hasError = true;
        }
        if (label === 'Tests Passed') {
          hasSuccess = true;
        }
      }
    }

    console.log();
    console.log('4. Extraction des statistiques de test...');

    // Look for test count patterns
    const testMatch = pageContent.match(/(\d+)\s+Tests\s+Generated/i);
    if (testMatch) {
      console.log(`   ✓ Tests Generated: ${testMatch[1]}`);
    }

    const passedMatch = pageContent.match(/(\d+)\s+Tests\s+Passed/i);
    if (passedMatch) {
      console.log(`   ✓ Tests Passed: ${passedMatch[1]}`);
    }

    const failedMatch = pageContent.match(/(\d+)\s+Tests\s+Failed/i);
    if (failedMatch) {
      console.log(`   ✓ Tests Failed: ${failedMatch[1]}`);
    }

    console.log();
    console.log('5. Logs console pertinents...');
    const relevantLogs = consoleLogs.filter(log =>
      log.includes('transpile') ||
      log.includes('deterministic') ||
      log.includes('test') ||
      log.includes('gemini') ||
      log.includes('error')
    );

    for (const log of relevantLogs.slice(0, 5)) {
      console.log(`   ${log.substring(0, 100)}...`);
    }

    console.log();
    console.log('='.repeat(70));
    console.log('RÉSULTAT FINAL');
    console.log('='.repeat(70));

    if (hasError && !hasSuccess) {
      console.log('⚠ LE FIX N\'EST PAS ENCORE ACTIF');
      console.log('');
      console.log('L\'erreur "unterminated string literal" est toujours présente.');
      console.log('Cela signifie que:');
      console.log('  - Le Test Oracle utilise encore Gemini au lieu des tests déterministes');
      console.log('  - Ou le cache du navigateur doit être vidé');
      console.log('  - Ou l\'ancien déploiement est encore actif');
      console.log('');
      console.log('Actions recommandées:');
      console.log('  1. Vider le cache du navigateur (Ctrl+Shift+R)');
      console.log('  2. Attendre 2-3 minutes pour la propagation DNS');
      console.log('  3. Ou uploader à nouveau le fichier COBOL');
    } else if (hasSuccess && !hasError) {
      console.log('✓ LE FIX EST ACTIF ET FONCTIONNE!');
      console.log('');
      console.log('Les tests déterministes (v9.0) sont maintenant actifs.');
      console.log('Plus d\'erreurs "unterminated string literal"!');
    } else {
      console.log('? ÉTAT INDÉTERMINÉ');
      console.log('');
      console.log('Le Test Oracle n\'a pas pu être vérifié automatiquement.');
      console.log('Veuillez vérifier manuellement dans l\'interface.');
    }

    console.log('='.repeat(70));

  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await browser.close();
  }
})();
