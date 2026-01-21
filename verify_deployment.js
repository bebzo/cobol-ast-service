/**
 * Test script to verify deterministic test generation
 */

const { chromium } = require('playwright');

(async () => {
  console.log('='.repeat(70));
  console.log('VÉRIFICATION DU DÉPLOIEMENT v9.0');
  console.log('='.repeat(70));
  console.log();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    if (msg.text().includes('Deterministic') || msg.text().includes('test')) {
      console.log(`  [console] ${msg.text()}`);
    }
  });

  try {
    console.log('1. Navigation vers l\'application...');
    await page.goto('https://cobol-ast-service-git-main-emmanuel-beb-a-ngons-projects.vercel.app/', {
      waitUntil: 'networkidle',
      timeout: 90000
    });
    console.log('   ✓ Page chargée');

    // Wait for React to render
    await page.waitForTimeout(3000);

    console.log();
    console.log('2. Vérification du HTML...');
    const html = await page.content();
    
    // Check for errors
    const hasLiteralError = html.includes('unterminated string literal');
    const hasDecimalError = html.includes("decimal.Decimal object is not callable");
    const hasCompilationError = html.includes('Failed to compile Python code');
    const hasTestsGenerated = html.includes('Tests Generated');
    
    console.log(`   unterminated string literal: ${hasLiteralError ? '⚠ OUI' : '✓ NON'}`);
    console.log(`   Decimal error: ${hasDecimalError ? '⚠ OUI' : '✓ NON'}`);
    console.log(`   Compilation error: ${hasCompilationError ? '⚠ OUI' : '✓ NON'}`);
    console.log(`   Tests Generated: ${hasTestsGenerated ? '✓ OUI' : '⚠ NON'}`);

    console.log();
    console.log('3. Extraction des statistiques...');
    
    // Extract test counts
    const generatedMatch = html.match(/(\d+)\s*Tests\s*Generated/i);
    const passedMatch = html.match(/(\d+)\s*Tests\s*Passed/i);
    const failedMatch = html.match(/(\d+)\s*Tests\s*Failed/i);
    
    console.log(`   Tests Generated: ${generatedMatch ? generatedMatch[1] : 'N/A'}`);
    console.log(`   Tests Passed: ${passedMatch ? passedMatch[1] : 'N/A'}`);
    console.log(`   Tests Failed: ${failedMatch ? failedMatch[1] : 'N/A'}`);

    console.log();
    console.log('='.repeat(70));
    console.log('RÉSULTAT');
    console.log('='.repeat(70));

    if (hasLiteralError || hasDecimalError || hasCompilationError) {
      console.log('⚠ LES ERREURS PERSISTENT');
      console.log('');
      console.log('Le déploiement v9.0 n\'a peut-être pas encore été pris en compte.');
      console.log('Actions recommandées:');
      console.log('  1. Attendre 2-3 minutes pour la propagation');
      console.log('  2. Vider le cache (Ctrl+Shift+R)');
      console.log('  3. Rafraîchir la page');
    } else if (passedMatch && failedMatch) {
      const passed = parseInt(passedMatch[1]);
      const failed = parseInt(failedMatch[1]);
      
      if (failed === 0 && passed > 0) {
        console.log('✓ SUCCÈS! LE FIX FONCTIONNE!');
        console.log('');
        console.log(`   ${passed} tests passés, ${failed} échoués`);
        console.log('   Les tests déterministes v9.0 sont actifs!');
      } else if (failed > 0) {
        console.log('⚠ CERTAINS TESTS ÉCHOUENT ENCORE');
        console.log('');
        console.log(`   ${passed} tests passés, ${failed} échoués`);
        console.log('   Il peut y avoir d\'autres problèmes à corriger.');
      }
    } else {
      console.log('? STATUT INCERTAIN');
      console.log('');
      console.log('Les résultats des tests n\'ont pas pu être déterminés.');
      console.log('Veuillez vérifier manuellement dans l\'interface.');
    }

    console.log('='.repeat(70));

  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await browser.close();
  }
})();
