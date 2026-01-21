const { chromium } = require('playwright');

(async () => {
  console.log('='.repeat(70));
  console.log('VÉRIFICATION COMPLÈTE DU TEST ORACLE');
  console.log('='.repeat(70));
  console.log();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let hasError = false;
  let hasSuccess = false;
  let errorMessage = '';
  let successMessage = '';

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('unterminated') || text.includes('Failed to compile') || text.includes('Decimal object')) {
      hasError = true;
      errorMessage = text;
    }
    if (text.includes('Tests Passed') && text.includes('54')) {
      hasSuccess = true;
      successMessage = text;
    }
  });

  try {
    console.log('1. Navigation vers l\'application...');
    await page.goto('https://cobol-ast-service-git-main-emmanuel-beb-a-ngons-projects.vercel.app/', {
      waitUntil: 'networkidle',
      timeout: 90000
    });
    console.log('   ✓ Page chargée');

    // Wait for full render
    await page.waitForTimeout(5000);

    console.log();
    console.log('2. Extraction du HTML complet...');
    const html = await page.content();
    console.log(`   ✓ ${html.length} caractères extraits`);

    console.log();
    console.log('3. Recherche des erreurs...');

    // Search for error patterns in HTML
    const errors = [];
    if (html.includes('unterminated string literal')) {
      errors.push('unterminated string literal');
    }
    if (html.includes("decimal.Decimal object is not callable")) {
      errors.push('decimal.Decimal object is not callable');
    }
    if (html.includes('Failed to compile Python code')) {
      errors.push('Failed to compile Python code');
    }
    if (html.includes('Test Execution Error')) {
      errors.push('Test Execution Error');
    }

    if (errors.length > 0) {
      console.log(`   ⚠ Erreurs trouvées: ${errors.join(', ')}`);
      hasError = true;
    } else {
      console.log('   ✓ Aucune erreur détectée!');
    }

    console.log();
    console.log('4. Recherche des succès...');

    // Search for success patterns
    const successPatterns = ['Tests Passed', '100%', 'All tests', 'PASSED', 'SUCCESS'];
    let successCount = 0;

    for (const pattern of successPatterns) {
      if (html.includes(pattern)) {
        console.log(`   ✓ Trouvé: ${pattern}`);
        successCount++;
      }
    }

    if (successCount > 2) {
      hasSuccess = true;
    }

    console.log();
    console.log('5. Extraction des métriques...');

    // Extract metrics using regex
    const metrics = {
      testsGenerated: html.match(/(\d+)\s*Tests\s*Generated/i)?.[1] || 'N/A',
      testsPassed: html.match(/(\d+)\s*Tests\s*Passed/i)?.[1] || 'N/A',
      testsFailed: html.match(/(\d+)\s*Tests\s*Failed/i)?.[1] || 'N/A',
      passRate: html.match(/(\d+)%\s*Pass\s*Rate/i)?.[1] || 'N/A'
    };

    console.log(`   Tests Generated: ${metrics.testsGenerated}`);
    console.log(`   Tests Passed: ${metrics.testsPassed}`);
    console.log(`   Tests Failed: ${metrics.testsFailed}`);
    console.log(`   Pass Rate: ${metrics.passRate}%`);

    // Check for line 2194 specifically
    console.log();
    console.log('6. Vérification ligne 2194 (historique)...');
    if (html.includes('line 2194') || html.includes('2194')) {
      console.log('   ⚠ Référence à la ligne 2194 trouvée (historique)');
    } else {
      console.log('   ✓ Pas de référence à la ligne 2194');
    }

    console.log();
    console.log('='.repeat(70));
    console.log('RÉSULTAT FINAL');
    console.log('='.repeat(70));

    if (hasError) {
      console.log('⚠ LE FIX N\'EST PAS ENCORE ACTIF');
      console.log('');
      console.log(`Erreur détectée: ${errorMessage || errors.join(', ')}`);
      console.log('');
      console.log('Actions recommandées:');
      console.log('  1. Vider le cache du navigateur (Ctrl+Shift+R)');
      console.log('  2. Attendre 2-3 minutes');
      console.log('  3. Rafraîchir la page');
      console.log('  4. Uploader à nouveau le fichier COBOL si nécessaire');
    } else if (hasSuccess || (metrics.testsPassed !== 'N/A' && parseInt(metrics.testsFailed) === 0)) {
      console.log('✓ LE FIX SEMBLE ACTIF!');
      console.log('');
      console.log('Observations:');
      console.log(`  - ${metrics.testsGenerated} tests générés`);
      console.log(`  - ${metrics.testsPassed} tests passés`);
      console.log(`  - ${metrics.testsFailed} tests échoués`);
      console.log(`  - Taux de passage: ${metrics.passRate}%`);
      console.log('');
      console.log('Les erreurs "unterminated string literal" ont disparu!');
      console.log('Le Test Oracle utilise probablement les tests déterministes.');
    } else if (metrics.testsGenerated !== 'N/A' && parseInt(metrics.testsFailed) === 0) {
      console.log('✓ LE FIX EST PROBABLEMENT ACTIF!');
      console.log('');
      console.log(`Tests Generated: ${metrics.testsGenerated}`);
      console.log(`Tests Failed: ${metrics.testsFailed} (zéro!)`);
      console.log('');
      console.log('Cela suggère que les tests déterministes fonctionnent.');
      console.log('Veuillez vérifier manuellement le taux de passage.');
    } else {
      console.log('? ÉTAT INCERTAIN');
      console.log('');
      console.log('Les vérifications automatiques n\'ont pas pu déterminer l\'état.');
      console.log('Veuillez vérifier manuellement dans l\'interface:');
      console.log('  1. Regardez la section "Test Oracle - Equivalence Validation"');
      console.log('  2. Vérifiez s\'il y a des erreurs affichées');
      console.log('  3. Vérifiez le taux de passage');
    }

    console.log('='.repeat(70));

  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await browser.close();
  }
})();
