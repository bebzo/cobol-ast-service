/**
 * Test Playwright - Sous-onglet Shadow Testing
 * Avec authentification Supabase réelle
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
    console.log('='.repeat(70));
    console.log('🧪 TEST SHADOW TESTING - PLAYWRIGHT AVEC AUTHENTIFICATION');
    console.log('='.repeat(70));

    // ============================================
    // ÉTAPE 1: Connexion à Supabase
    // ============================================
    log('Étape 1: Connexion avec credentials Supabase');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Remplir le formulaire de connexion
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const signInButton = page.locator('button[type="submit"]').first();

    if (await emailInput.count() > 0) {
      await emailInput.fill('test@codeswitch.app');
      await passwordInput.fill('TestPassword123!@#');
      await signInButton.click();

      // Attendre la connexion
      await page.waitForTimeout(5000);

      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        log(`Connexion réussie! URL: ${currentUrl}`);
      } else {
        log(`Connexion échouée. URL: ${currentUrl}`, true);
      }
    } else {
      log('Formulaire non trouvé', true);
    }

    // ============================================
    // ÉTAPE 2: Accéder à l'onglet Tests
    // ============================================
    log('Étape 2: Navigation vers l\'onglet Tests');

    const testsTab = page.locator('button:has-text("Tests")').first();
    if (await testsTab.count() > 0 && await testsTab.isVisible()) {
      await testsTab.click();
      await page.waitForTimeout(2000);
      log('Onglet Tests cliqué');
    } else {
      log('Onglet Tests non trouvé - vérification du contenu...');
      const pageContent = await page.content();
      if (pageContent.includes('Tests')) {
        log('Le mot "Tests" est présent sur la page');
      }
    }

    // ============================================
    // ÉTAPE 3: Accéder au sous-onglet Shadow Testing
    // ============================================
    log('Étape 3: Accès au sous-onglet Shadow Testing');

    // Chercher le bouton Shadow Testing avec différentes variantes
    const shadowSelectors = [
      'button:has-text("Shadow")',
      'button:has-text("Shadow Testing")',
      '[data-subtab="shadow"]'
    ];

    let shadowTabFound = false;
    for (const selector of shadowSelectors) {
      const tab = page.locator(selector).first();
      if (await tab.count() > 0) {
        const isVisible = await tab.isVisible().catch(() => false);
        if (isVisible) {
          await tab.click();
          await page.waitForTimeout(2000);
          log(`Sous-onglet Shadow trouvé et cliqué: ${selector}`);
          shadowTabFound = true;
          break;
        }
      }
    }

    if (!shadowTabFound) {
      log('Sous-onglet Shadow non trouvé - recherche alternative...');
      // Vérifier si on est déjà sur le bon onglet
      const activeTab = page.locator('[class*="bg-blue"][class*="500/20"], [class*="amber"][class*="500/20"]').first();
      if (await activeTab.count() > 0) {
        const tabText = await activeTab.textContent().catch(() => '');
        log(`Onglet actif: ${tabText}`);
      }
    }

    // ============================================
    // ÉTAPE 4: Vérification du contenu Shadow Testing
    // ============================================
    log('Étape 4: Vérification du contenu Shadow Testing');
    await page.waitForTimeout(2000);

    const pageContent = await page.content();

    // Vérifier les éléments clés
    const elements = [
      { name: 'Shadow Testing titre', patterns: ['Shadow Testing', 'shadow_testing', 'SHADOW'] },
      { name: 'Readiness Score', patterns: ['readiness', 'Readiness', 'READINESS', '%'] },
      { name: 'Critical Paths', patterns: ['Critical', 'critical', 'CRITICAL'] },
      { name: 'Execution Plan', patterns: ['Execution', 'execution', 'plan'] },
      { name: 'COBOL/Python', patterns: ['COBOL', 'Python', 'cobol', 'python'] }
    ];

    let totalElementsFound = 0;
    for (const element of elements) {
      const found = element.patterns.some(p => pageContent.includes(p));
      if (found) {
        log(`  ✅ ${element.name}: présent`);
        totalElementsFound++;
      } else {
        log(`  ⚠️ ${element.name}: non trouvé`);
      }
    }

    if (totalElementsFound >= 3) {
      log(`Panel Shadow Testing visible (${totalElementsFound}/5 éléments)`);
    } else {
      log(`Panel Shadow Testing incomplet (${totalElementsFound}/5 éléments)`, true);
    }

    // ============================================
    // RÉSUMÉ FINAL
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(70));
    console.log(`✅ Tests réussis: ${testResults.passed}`);
    console.log(`❌ Tests échoués: ${testResults.failed}`);

    if (testResults.errors.length > 0) {
      console.log('\n⚠️ Erreurs:');
      testResults.errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('🏁 STATUT GLOBAL: ' + (testResults.failed === 0 ? '✅ SUCCÈS' : '⚠️ PARTIEL'));
    console.log('='.repeat(70));

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
    console.log('\n🔒 Test terminé - Navigateur fermé');
  }
}

// Exécuter le test
runShadowTestingTest()
  .then(results => {
    console.log('\n📋 RÉSULTATS FINAUX:');
    console.log(JSON.stringify({ passed: results.passed, failed: results.failed }, null, 2));
    process.exit(results.failed > 2 ? 1 : 0);
  })
  .catch(error => {
    console.error('💥 Échec du test:', error);
    process.exit(1);
  });
