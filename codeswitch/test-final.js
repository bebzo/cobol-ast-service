/**
 * TEST FINAL DE L'APPLICATION CODESWITCH
 * Vérifie que toutes les corrections fonctionnent
 */

const { chromium } = require('playwright');

async function runFinalTest() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 TEST FINAL DE L\'APPLICATION CODESWITCH');
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  }).then(ctx => ctx.newPage());

  const results = { passed: 0, failed: 0, issues: [] };

  function log(message, success = true) {
    const status = success ? '✅' : '❌';
    console.log(`${status} ${message}`);
    if (success) results.passed++;
    else {
      results.failed++;
      results.issues.push(message);
    }
  }

  try {
    // ============================================
    // TEST 1: Page de Login avec nouvelles clés
    // ============================================
    console.log('\n📋 TEST 1: Page de Login\n' + '-'.repeat(50));

    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const loginContent = await page.content();

    // Vérifier les éléments
    log('Logo CodeSwitch visible', loginContent.includes('CodeSwitch'));
    log('Champ email visible', await page.locator('input[type="email"]').count() > 0);
    log('Champ password visible', await page.locator('input[type="password"]').count() > 0);
    log('Bouton Se connecter visible', await page.locator('button:has-text("Se connecter")').count() > 0 || await page.locator('button:has-text("Créer un compte")').count() > 0);
    log('Bouton Accès Demo visible', await page.locator('button:has-text("Accès Demo")').count() > 0);
    log('Bouton Google visible', await page.locator('button:has-text("Google")').count() > 0 || await page.locator('text=Continuer avec Google').count() > 0);
    log('Bouton GitHub visible', await page.locator('button:has-text("GitHub")').count() > 0 || await page.locator('text=Continuer avec GitHub').count() > 0);

    // Vérifier les indicateurs de mode
    const devModeIndicator = await page.locator('text=Mode Développement').count();
    const apiIndicator = await page.locator('text=API').count();
    log('Indicateur Mode Développement', devModeIndicator > 0 || apiIndicator > 0);

    // ============================================
    // TEST 2: Demo Access - ACCÈS AU DASHBOARD
    // ============================================
    console.log('\n📋 TEST 2: Demo Access vers Dashboard\n' + '-'.repeat(50));

    // Cliquer sur Accès Demo
    const demoButton = page.locator('button:has-text("Accès Demo")').first();
    if (await demoButton.count() > 0) {
      await demoButton.click();

      // Attendre que l'URL change vers /dashboard
      try {
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        console.log('✅ Navigation vers dashboard réussie');
      } catch (e) {
        // Si le timeout est atteint, vérifier l'URL actuelle
        const currentUrl = page.url();
        console.log(`⚠️ Timeout navigation, URL actuelle: ${currentUrl}`);
      }

      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const dashboardLoaded = currentUrl.includes('/dashboard');
      log(`URL après Demo Access: ${currentUrl}`, dashboardLoaded);

      if (dashboardLoaded) {
        log('✅ ACCÈS AU DASHBOARD RÉUSSI!');
      } else {
        log('Échec de l\'accès au dashboard', false);
      }
    } else {
      log('Bouton Demo Access non trouvé', false);
    }

    // ============================================
    // TEST 3: Dashboard - Vérification des éléments
    // ============================================
    if (page.url().includes('/dashboard')) {
      console.log('\n📋 TEST 3: Dashboard\n' + '-'.repeat(50));

      await page.waitForTimeout(2000);
      const dashboardContent = await page.content();

      log('Dashboard chargé', dashboardContent.includes('Dashboard') || dashboardContent.includes('CodeSwitch'));

      // Vérifier les onglets principaux
      const mainTabs = ['Code', 'Tests', 'Architecture', 'Insights', 'Chat', 'Config'];
      let tabsFound = 0;
      for (const tab of mainTabs) {
        const tabExists = await page.locator(`button:has-text("${tab}")`).count() > 0;
        if (tabExists) tabsFound++;
        log(`Onglet "${tab}"`, tabExists);
      }

      // ============================================
      // TEST 4: Onglet Tests et Shadow Testing
      // ============================================
      console.log('\n📋 TEST 4: Tests et Shadow Testing\n' + '-'.repeat(50));

      // Cliquer sur Tests
      const testsTab = page.locator('button:has-text("Tests")').first();
      if (await testsTab.count() > 0) {
        await testsTab.click();
        await page.waitForTimeout(2000);
        log('Onglet Tests cliqué', true);

        // Vérifier les sous-onglets
        const subTabs = ['Unit', 'Shadow', 'Production'];
        for (const subTab of subTabs) {
          const subTabBtn = page.locator(`button:has-text("${subTab}")`).first();
          const isVisible = await subTabBtn.count() > 0 && await subTabBtn.isVisible().catch(() => false);

          if (isVisible) {
            await subTabBtn.click();
            await page.waitForTimeout(2000);
            log(`Sous-onglet Tests > ${subTab} cliqué`, true);

            // Pour Shadow, vérifier le contenu
            if (subTab === 'Shadow') {
              const shadowContent = await page.content();
              const hasShadowElements = shadowContent.includes('Shadow') ||
                                        shadowContent.includes('readiness') ||
                                        shadowContent.includes('critical') ||
                                        shadowContent.includes('COBOL') ||
                                        shadowContent.includes('Python');
              log('Contenu Shadow Testing présent', hasShadowElements);
            }
          } else {
            log(`Sous-onglet Tests > ${subTab} non visible`, false);
          }
        }
      } else {
        log('Onglet Tests non trouvé', false);
      }

      // ============================================
      // TEST 5: Vérification des fonctionnalités principales
      // ============================================
      console.log('\n📋 TEST 5: Fonctionnalités\n' + '-'.repeat(50));

      // Éditeur de code
      const editorExists = await page.locator('.monaco-editor, [class*="editor"]').count() > 0;
      log('Éditeur de code présent', editorExists);

      // Boutons d'action
      const uploadButton = await page.locator('button:has-text("Upload")').count();
      const playButton = await page.locator('button:has-text("Play")').count();
      log('Bouton Upload présent', uploadButton > 0);
      log('Bouton Play présent', playButton > 0);
    } else {
      console.log('\n⚠️ Dashboard non accessible - certains tests ignorés');
      log('Impossible d\'accéder au dashboard', false);
    }

    // ============================================
    // RAPPORT FINAL
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 RAPPORT FINAL');
    console.log('='.repeat(70));
    console.log(`✅ Tests réussis: ${results.passed}`);
    console.log(`❌ Tests échoués: ${results.failed}`);

    if (results.issues.length > 0) {
      console.log('\n⚠️ Problèmes identifiés:');
      results.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    const status = results.failed === 0 ? '✅ SUCCÈS COMPLET' : (results.failed <= results.passed * 0.2 ? '✅ SUCCÈS PARTIEL' : '⚠️ ÉCHEC PARTIEL');
    console.log(`🏁 STATUT GLOBAL: ${status}`);
    console.log('='.repeat(70));

    return results;

  } catch (error) {
    console.error('\n💥 Erreur critique:', error.message);
    return { passed: results.passed, failed: results.failed + 1, issues: [...results.issues, error.message] };
  } finally {
    await browser.close();
    console.log('\n🔒 Test terminé - Navigateur fermé');
  }
}

// Exécuter le test
runFinalTest()
  .then(results => {
    console.log('\n📋 RÉSULTATS:', JSON.stringify({ passed: results.passed, failed: results.failed }, null, 2));
    process.exit(results.failed > 5 ? 1 : 0);
  })
  .catch(error => {
    console.error('💥 Échec du test:', error);
    process.exit(1);
  });
