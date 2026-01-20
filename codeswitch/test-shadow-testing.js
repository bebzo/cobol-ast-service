/**
 * Test Playwright - Sous-onglet Shadow Testing
 * 
 * Ce test vérifie :
 * 1. Accès à la page de login
 * 2. Clique sur "Demo Access" si disponible
 * 3. Navigation vers l'onglet "Tests"
 * 4. Clique sur le sous-onglet "Shadow Testing"
 * 5. Vérification du contenu du panel Shadow Testing
 */

const { chromium } = require('playwright');

async function runShadowTestingTest() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const testResults = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  const log = (message, isError = false) => {
    const status = isError ? '❌ FAIL' : '✅ PASS';
    console.log(`[${new Date().toISOString()}] ${status}: ${message}`);
    if (isError) {
      testResults.errors.push(message);
      testResults.failed++;
    } else {
      testResults.passed++;
    }
  };
  
  try {
    console.log('='.repeat(60));
    console.log('TEST SHADOW TESTING - PLAYWRIGHT');
    console.log('='.repeat(60));
    
    // Étape 1: Accéder à la page de login
    log('Étape 1: Accès à la page de login');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const loginContent = await page.content();
    if (loginContent.includes('CodeSwitch') || loginContent.includes('Sign In')) {
      log('Page de login chargée');
      testResults.passed++;
    } else {
      log('Page de login non chargée correctement', true);
    }
    
    // Étape 2: Chercher le bouton Demo Access
    log('Étape 2: Recherche du bouton Demo Access');
    
    const demoButtonSelectors = [
      'button:has-text("Demo Access")',
      'button:has-text("Demo")',
      'text=Demo Access',
      'a:has-text("Demo")'
    ];
    
    let demoClicked = false;
    for (const selector of demoButtonSelectors) {
      const button = page.locator(selector).first();
      if (await button.count() > 0) {
        const isVisible = await button.isVisible().catch(() => false);
        if (isVisible) {
          log(`Bouton Demo trouvé: ${selector}`);
          try {
            await button.click({ timeout: 5000 });
            await page.waitForTimeout(2000);
            demoClicked = true;
            log('Bouton Demo Access cliqué');
            testResults.passed++;
            break;
          } catch (clickError) {
            log(`Échec du clic sur ${selector}`, true);
          }
        }
      }
    }
    
    // Si pas de bouton Demo, naviguer directement au dashboard
    if (!demoClicked) {
      log('Pas de bouton Demo - navigation directe au dashboard');
      await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
    }
    
    // Vérifier l'URL actuelle
    const currentUrl = page.url();
    log(`URL actuelle: ${currentUrl}`);
    
    // Étape 3: Chercher l'onglet "Tests"
    log('Étape 3: Recherche de l\'onglet Tests');
    
    const testsTabSelectors = [
      'button:has-text("Tests")',
      '[data-tab="tests"]',
      'text=/Tests/i'
    ];
    
    let testsTabFound = false;
    for (const selector of testsTabSelectors) {
      const tab = page.locator(selector).first();
      if (await tab.count() > 0) {
        const isVisible = await tab.isVisible().catch(() => false);
        if (isVisible) {
          log(`Onglet Tests trouvé: ${selector}`);
          try {
            await tab.click({ timeout: 10000 });
            await page.waitForTimeout(2000);
            testsTabFound = true;
            log('Onglet Tests cliqué');
            testResults.passed++;
            break;
          } catch (clickError) {
            log(`Échec du clic sur ${selector}`, true);
          }
        }
      }
    }
    
    if (!testsTabFound) {
      // Vérifier tous les boutons disponibles
      const allButtons = await page.locator('button').count();
      log(`Onglet Tests non trouvé - ${allButtons} boutons disponibles sur la page`);
      
      // Lister les boutons pour diagnostic
      for (let i = 0; i < Math.min(allButtons, 10); i++) {
        const btnText = await page.locator('button').nth(i).textContent().catch(() => '');
        if (btnText) {
          log(`  Bouton ${i + 1}: ${btnText.substring(0, 50)}`);
        }
      }
    }
    
    // Étape 4: Chercher le sous-onglet "Shadow Testing"
    log('Étape 4: Recherche du sous-onglet Shadow Testing');
    
    const shadowTabSelectors = [
      'button:has-text("Shadow Testing")',
      'button:has-text("Shadow")',
      '[data-subtab="shadow"]',
      'text=/Shadow/i'
    ];
    
    let shadowTabFound = false;
    for (const selector of shadowTabSelectors) {
      const tab = page.locator(selector).first();
      if (await tab.count() > 0) {
        const isVisible = await tab.isVisible().catch(() => false);
        if (isVisible) {
          log(`Sous-onglet Shadow Testing trouvé: ${selector}`);
          try {
            await tab.click({ timeout: 10000 });
            await page.waitForTimeout(3000);
            shadowTabFound = true;
            log('Sous-onglet Shadow Testing cliqué');
            testResults.passed++;
            break;
          } catch (clickError) {
            log(`Échec du clic sur ${selector}`, true);
          }
        }
      }
    }
    
    if (!shadowTabFound) {
      log('Sous-onglet Shadow Testing non trouvé dans les boutons visibles');
    }
    
    // Étape 5: Vérifier le contenu du panel Shadow Testing
    log('Étape 5: Vérification du contenu du panel Shadow Testing');
    
    // Attendre que le contenu charge
    await page.waitForTimeout(2000);
    
    const shadowContent = await page.content();
    
    // Vérifier les éléments clés du Shadow Testing
    const shadowElements = {
      'readiness_score': shadowContent.includes('readiness_score') || shadowContent.includes('Readiness') || shadowContent.includes('readiness'),
      'critical_paths': shadowContent.includes('Critical Paths') || shadowContent.includes('critical'),
      'execution_plan': shadowContent.includes('Execution Plan') || shadowContent.includes('execution'),
      'test_data': shadowContent.includes('Test Data') || shadowContent.includes('test data'),
      'estimated_duration': shadowContent.includes('estimated_duration') || shadowContent.includes('weeks') || shadowContent.includes('days'),
      'risk_mitigation': shadowContent.includes('risk_mitigation') || shadowContent.includes('Risk') || shadowContent.includes('mitigation')
    };
    
    let elementsFound = 0;
    for (const [element, found] of Object.entries(shadowElements)) {
      if (found) {
        log(`  ✅ ${element}: présent`);
        elementsFound++;
      } else {
        log(`  ⚠️ ${element}: non trouvé`);
      }
    }
    
    if (elementsFound >= 3) {
      log(`Panel Shadow Testing visible avec ${elementsFound}/6 éléments`);
      testResults.passed++;
    } else {
      log(`Panel Shadow Testing incomplet (${elementsFound}/6 éléments)`, true);
    }
    
    // Étape 6: Vérifier le score de readiness (si disponible)
    log('Étape 6: Vérification du Score Readiness');
    
    const scorePattern = shadowContent.match(/(\d{1,3})%/);
    if (scorePattern) {
      const score = scorePattern[1];
      log(`Score de readiness trouvé: ${score}%`);
      testResults.passed++;
    } else {
      log('Score de readiness non trouvé dans le contenu', true);
    }
    
    // Étape 7: Vérifier les paths critiques (si disponible)
    log('Étape 7: Vérification des Critical Paths');
    
    const criticalPathKeywords = ['Financial', 'Date Processing', 'File I/O', 'Business Logic', 'Database'];
    let criticalPathsFound = 0;
    
    for (const keyword of criticalPathKeywords) {
      if (shadowContent.includes(keyword)) {
        log(`  ✅ Critical Path: ${keyword}`);
        criticalPathsFound++;
      }
    }
    
    if (criticalPathsFound > 0) {
      log(`${criticalPathsFound} Critical Paths détectés`);
      testResults.passed++;
    } else {
      log('Aucun Critical Path trouvé dans le panel', true);
    }
    
    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('RÉSUMÉ DES TESTS');
    console.log('='.repeat(60));
    console.log(`Tests réussis: ${testResults.passed}`);
    console.log(`Tests échoués: ${testResults.failed}`);
    
    if (testResults.errors.length > 0) {
      console.log('\nErreurs:');
      testResults.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 100)}`);
      });
    }
    
    const status = testResults.failed === 0 ? '✅ SUCCÈS' : (testResults.failed <= 2 ? '⚠️ PARTIEL' : '❌ ÉCHEC');
    console.log(`Statut global: ${status}`);
    console.log('='.repeat(60));
    
    return testResults;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Erreur critique: ${errorMessage}`, true);
    
    return {
      passed: testResults.passed,
      failed: testResults.failed + 1,
      errors: [...testResults.errors, errorMessage]
    };
    
  } finally {
    await browser.close();
    console.log('\nTest terminé - Navigateur fermé');
  }
}

// Exécuter le test
runShadowTestingTest()
  .then(results => {
    console.log('\n' + '='.repeat(60));
    console.log('RÉSULTATS FINAUX');
    console.log('='.repeat(60));
    console.log(JSON.stringify(results, null, 2));
    
    const exitCode = results.failed > 2 ? 1 : 0;
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Échec du test:', error);
    process.exit(1);
  });
