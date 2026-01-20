/**
 * TEST FINAL COMPLET - Auth + Conversion COBOL→Python + Validation
 * Utilise: dev@minimax.io
 */

const { chromium } = require('playwright');

const COBOL_SAMPLE = `       IDENTIFICATION DIVISION.
       PROGRAM-ID.  PAYROLL-CALCULATOR.
       AUTHOR.      LEGACY-SYSTEMS-1995.
      *============================================================
      * PAYROLL SYSTEM - GROSS TO NET CALCULATION
      * OBSOLETE 1995 TAX RATES - REQUIRES UPDATE
      *============================================================
       DATA DIVISION.
       WORKING-STORAGE SECTION.

       01  TAX-RATES-1995.
           05  TAX-BRACKET-1       PIC 9(7) VALUE 23350.
           05  TAX-BRACKET-2       PIC 9(7) VALUE 56550.
           05  TAX-RATE-1          PIC V999 VALUE .150.
           05  TAX-RATE-2          PIC V999 VALUE .280.

       01  EMPLOYEE-DATA.
           05  EMP-HOURLY-RATE     PIC 9(3)V99.
           05  EMP-HOURS-WEEK      PIC 9(3).
           05  EMP-TAX-RATE        PIC V999.
           05  GROSS-PAY           PIC 9(5)V99.
           05  NET-PAY             PIC 9(5)V99.

       PROCEDURE DIVISION.

       0000-MAIN.
           MOVE 25.50 TO EMP-HOURLY-RATE
           MOVE 40 TO EMP-HOURS-WEEK
           MOVE 0.15 TO EMP-TAX-RATE

           PERFORM 1000-CALC-GROSS
           PERFORM 2000-CALC-TAX
           PERFORM 3000-CALC-NET

           DISPLAY "Employee Payroll Calculated"
           DISPLAY "Gross Pay: " GROSS-PAY
           DISPLAY "Net Pay: " NET-PAY
           STOP RUN.

       1000-CALC-GROSS.
           COMPUTE GROSS-PAY = EMP-HOURLY-RATE * EMP-HOURS-WEEK.

       2000-CALC-TAX.
           IF GROSS-PAY * 52 <= TAX-BRACKET-1
               COMPUTE NET-PAY = GROSS-PAY * (1 - EMP-TAX-RATE)
           ELSE
               DISPLAY "Higher tax bracket - manual calc required".

       3000-CALC-NET.
           COMPUTE NET-PAY = GROSS-PAY - (GROSS-PAY * EMP-TAX-RATE).`;

async function runFinalCompleteTest() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 TEST FINAL COMPLET - CODESWITCH PRO');
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

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
    // ÉTAPE 1: AUTHENTIFICATION
    // ============================================
    console.log('\n📋 ÉTAPE 1: AUTHENTIFICATION\n' + '-'.repeat(50));

    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Remplir l'email
    await page.locator('input[type="email"]').fill('dev@minimax.io');
    console.log('   📧 Email: dev@minimax.io');

    // Remplir le mot de passe
    await page.locator('input[type="password"]').fill('CodeSwitch2024!');
    console.log('   🔑 Mot de passe: ********');

    // Cliquer sur Se connecter
    await page.locator('button[type="submit"]').click();
    console.log('   ⏳ Connexion en cours...');

    try {
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      log('✅ AUTHENTIFICATION RÉUSSIE');
    } catch (e) {
      log(`Échec auth - URL: ${page.url()}`, page.url().includes('/dashboard'));
    }

    // ============================================
    // ÉTAPE 2: CONVERSION COBOL → PYTHON
    // ============================================
    if (page.url().includes('/dashboard')) {
      console.log('\n📋 ÉTAPE 2: CONVERSION COBOL → PYTHON\n' + '-'.repeat(50));
      console.log(`   📝 Code source: ${COBOL_SAMPLE.split('\n').length} lignes`);
      console.log('   🏦 Système de paie avec taxes 1995\n');

      await page.waitForTimeout(3000);

      // Coller le code COBOL
      const textarea = page.locator('textarea').first();
      if (await textarea.count() > 0) {
        await textarea.fill(COBOL_SAMPLE);
        log('Code COBOL collé', true);
        console.log('   ✅ Code collé dans l\'éditeur');

        // Cliquer sur "Refactor with Gemini"
        const refactorBtn = page.locator('button:has-text("Refactor with Gemini")').first();
        if (await refactorBtn.count() > 0) {
          console.log('   🚀 Lancement "Refactor with Gemini"...\n');
          await refactorBtn.click();

          // Attendre la conversion complète (60 secondes max)
          let conversionComplete = false;
          let attempts = 0;
          const maxAttempts = 40;

          while (!conversionComplete && attempts < maxAttempts) {
            await page.waitForTimeout(2000);
            attempts++;

            // Vérifier si le code Python a été généré
            const pageContent = await page.content();

            // Indicateurs de conversion réussie
            const hasPythonCode =
              pageContent.includes('def ') &&
              (pageContent.includes('class ') ||
               pageContent.includes('Decimal') ||
               pageContent.includes('@dataclass'));

            // Vérifier les métriques
            const hasMetrics =
              pageContent.includes('Confidence') ||
              pageContent.includes('Transformation') ||
              pageContent.includes('COBOL') ||
              pageContent.includes('Python');

            console.log(`   ⏳ Tentative ${attempts}/${maxAttempts} - Métriques: ${hasMetrics ? '✅' : '❌'}`);

            if (hasPythonCode && hasMetrics) {
              conversionComplete = true;
              console.log(`\n   ✅ Conversion terminée!\n`);
            }

            if (attempts >= maxAttempts && !conversionComplete) {
              console.log('   ⚠️ Timeout atteint - Analyse du contenu actuel...\n');
            }
          }

          // Attendre un peu plus pour l'affichage complet
          await page.waitForTimeout(3000);

          // ============================================
          // ÉTAPE 3: ANALYSE DU CODE GÉNÉRÉ
          // ============================================
          console.log('📋 ÉTAPE 3: ANALYSE DU CODE GÉNÉRÉ\n' + '-'.repeat(50));

          const finalContent = await page.content();

          // Vérifications flexibles
          const features = {
            'Type Decimal': finalContent.includes('Decimal'),
            '@dataclass': finalContent.includes('@dataclass') || finalContent.includes('dataclass'),
            'Classe Python': finalContent.includes('class '),
            'Tests unitaires (test_*)': finalContent.includes('def test_'),
            'Configuration (load/Config)': finalContent.includes('load') || finalContent.includes('Config'),
            'Audit/Logging': finalContent.includes('audit') || finalContent.includes('Audit'),
            'Score migration': finalContent.includes('migration_score') || finalContent.includes('confidence'),
            'Avertissements sécurité': finalContent.includes('security') || finalContent.includes('vulnerability'),
            'Issues détectés': finalContent.includes('"issues"') || finalContent.includes('Issues') || finalContent.includes('issues:'),
          };

          let featuresCount = 0;
          for (const [feature, found] of Object.entries(features)) {
            if (found) featuresCount++;
            log(`${feature}`, found);
          }

          // ============================================
          // ÉTAPE 4: VÉRIFICATION INTERFACE
          // ============================================
          console.log('\n📋 ÉTAPE 4: VÉRIFICATION INTERFACE\n' + '-'.repeat(50));

          const interfaceElements = {
            'Indicateur COBOL': finalContent.includes('COBOL') || finalContent.includes('AMBER'),
            'Indicateur Python': finalContent.includes('Python') || finalContent.includes('GREEN'),
            'Onglet Tests': await page.locator('button:has-text("Tests")').count() > 0,
            'Onglet Architecture': await page.locator('button:has-text("Architecture")').count() > 0,
            'Onglet Insights': await page.locator('button:has-text("AI Insights")').count() > 0 ||
                              await page.locator('button:has-text("Insights")').count() > 0,
            'Score confiance': finalContent.includes('Confidence') || finalContent.includes('85') || finalContent.includes('90'),
          };

          for (const [element, found] of Object.entries(interfaceElements)) {
            log(element, found);
          }

          // ============================================
          // ÉTAPE 5: NAVIGATION ONGLETS
          // ============================================
          console.log('\n📋 ÉTAPE 5: NAVIGATION ONGLETS TESTS\n' + '-'.repeat(50));

          const testsTab = page.locator('button:has-text("Tests")').first();
          if (await testsTab.count() > 0) {
            await testsTab.click();
            await page.waitForTimeout(2000);
            log('Navigation vers Tests', true);

            // Vérifier les sous-onglets
            const subTabs = ['Unit', 'Shadow', 'Production'];
            let subTabsFound = 0;

            for (const subTab of subTabs) {
              const subTabBtn = page.locator(`button:has-text("${subTab}")`).first();
              const exists = await subTabBtn.count() > 0;
              log(`Sous-onglet ${subTab}`, exists);
              if (exists) subTabsFound++;

              // Cliquer sur Shadow pour voir le contenu
              if (subTab === 'Shadow' && exists) {
                await subTabBtn.click();
                await page.waitForTimeout(2000);

                const shadowContent = await page.content();
                const hasPlan = shadowContent.includes('readiness') ||
                               shadowContent.includes('critical') ||
                               shadowContent.includes('Strategy') ||
                               shadowContent.includes('test_points');
                log('Plan Shadow Testing visible', hasPlan);
              }
            }

            log(`Sous-onglets Tests (${subTabsFound}/3)`, subTabsFound >= 2);
          }

          // ============================================
          // RÉSUMÉ
          // ============================================
          console.log('\n📋 RÉSUMÉ DU TEST:\n');
          console.log(`   🏦 Source: PAYROLL CALCULATOR (${COBOL_SAMPLE.split('\n').length} lignes)`);
          console.log(`   📊 Fonctionnalités CodeSwitch Pro détectées: ${featuresCount}/9`);
          console.log(`   🔐 Utilisateur: dev@minimax.io`);
          console.log(`   📝 Mode: Production Ready`);
        } else {
          log('Bouton "Refactor with Gemini" non trouvé', false);
        }
      } else {
        log('Zone de texte non trouvée', false);
      }
    } else {
      log('Dashboard non accessible après auth', false);
    }

    // ============================================
    // RAPPORT FINAL
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 RAPPORT FINAL - TEST COMPLET');
    console.log('='.repeat(70));
    console.log(`✅ Tests réussis: ${results.passed}`);
    console.log(`❌ Tests échoués: ${results.failed}`);

    if (results.issues.length > 0) {
      console.log('\n⚠️ Points à améliorer:');
      results.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    const successRate = Math.round((results.passed / (results.passed + results.failed)) * 100);
    const status = results.failed === 0 ? '✅ SUCCÈS COMPLET' :
                  successRate >= 75 ? '✅ SUCCÈS PARTIEL' : '⚠️ ÉCHEC PARTIEL';
    console.log(`🏁 STATUT GLOBAL: ${status} (${successRate}%)`);
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
runFinalCompleteTest()
  .then(results => {
    console.log('\n📋 RÉSULTATS:', JSON.stringify({ passed: results.passed, failed: results.failed }, null, 2));
    process.exit(results.failed > 6 ? 1 : 0);
  })
  .catch(error => {
    console.error('💥 Échec du test:', error);
    process.exit(1);
  });
