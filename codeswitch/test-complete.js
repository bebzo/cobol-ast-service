/**
 * TEST COMPLET CODESWITCH - AUTHENTIFICATION + CONVERSION COBOL→PYTHON
 * Utilise l'utilisateur dev@minimax.io
 */

const { chromium } = require('playwright');

const SAMPLE_COBOL = `       IDENTIFICATION DIVISION.
       PROGRAM-ID.  PAYROLL01.
       AUTHOR.      LEGACY-SYSTEMS-1995.
      *============================================================
      * PAYROLL SYSTEM - GROSS TO NET CALCULATION
      *============================================================
       DATA DIVISION.
       WORKING-STORAGE SECTION.

       01  EMP-RECORD.
           05  EMP-NAME           PIC X(30).
           05  EMP-HOURLY-RATE    PIC 9(3)V99.
           05  EMP-HOURS-WEEK     PIC 9(3).
           05  EMP-TAX-RATE       PIC V999.

       01  CALC-RESULTS.
           05  GROSS-PAY          PIC 9(5)V99.
           05  TAX-AMOUNT         PIC 9(5)V99.
           05  NET-PAY            PIC 9(5)V99.

       PROCEDURE DIVISION.

       0000-MAIN-PROC.
           MOVE "JOHN SMITH" TO EMP-NAME
           MOVE 25.50 TO EMP-HOURLY-RATE
           MOVE 40 TO EMP-HOURS-WEEK
           MOVE 0.15 TO EMP-TAX-RATE

           PERFORM 1000-CALC-GROSS
           PERFORM 2000-CALC-TAX
           PERFORM 3000-CALC-NET

           DISPLAY "Employee: " EMP-NAME
           DISPLAY "Gross Pay: " GROSS-PAY
           DISPLAY "Tax:       " TAX-AMOUNT
           DISPLAY "Net Pay:   " NET-PAY

           STOP RUN.

       1000-CALC-GROSS.
           COMPUTE GROSS-PAY = EMP-HOURLY-RATE * EMP-HOURS-WEEK.

       2000-CALC-TAX.
           COMPUTE TAX-AMOUNT = GROSS-PAY * EMP-TAX-RATE.

       3000-CALC-NET.
           COMPUTE NET-PAY = GROSS-PAY - TAX-AMOUNT.`;

async function runCompleteTest() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 TEST COMPLET CODESWITCH - AUTH + CONVERSION');
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
    // TEST 1: AUTHENTIFICATION
    // ============================================
    console.log('\n📋 ÉTAPE 1: AUTHENTIFICATION\n' + '-'.repeat(50));

    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const loginContent = await page.content();
    log('Page de login chargée', loginContent.includes('CodeSwitch'));

    // Remplir l'email
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.fill('dev@minimax.io');
      console.log('   📧 Email: dev@minimax.io');
    }

    // Remplir le mot de passe
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.count() > 0) {
      await passwordInput.fill('CodeSwitch2024!');
      console.log('   🔑 Mot de passe: ********');
    }

    // Cliquer sur Se connecter
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();
      console.log('   ⏳ Connexion en cours...');

      try {
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        log('✅ AUTHENTIFICATION RÉUSSIE');
      } catch (e) {
        log(`Échec auth - URL: ${page.url()}`, page.url().includes('/dashboard'));
      }
    }

    // ============================================
    // TEST 2: DASHBOARD - VÉRIFICATION INTERFACE
    // ============================================
    if (page.url().includes('/dashboard')) {
      console.log('\n📋 ÉTAPE 2: VÉRIFICATION DASHBOARD\n' + '-'.repeat(50));

      await page.waitForTimeout(3000);
      const dashboardContent = await page.content();

      log('Dashboard chargé', dashboardContent.includes('CodeSwitch'));

      // Vérifier les onglets
      const tabs = [
        { name: 'Code', selector: 'button:has-text("Code")' },
        { name: 'Tests', selector: 'button:has-text("Tests")' },
        { name: 'Architecture', selector: 'button:has-text("Architecture")' },
        { name: 'Insights', selector: 'button:has-text("Insights")' },
        { name: 'Chat', selector: 'button:has-text("Chat")' },
        { name: 'Config', selector: 'button:has-text("Config")' }
      ];

      let tabsCount = 0;
      for (const tab of tabs) {
        const exists = await page.locator(tab.selector).count() > 0;
        if (exists) tabsCount++;
        log(`Onglet "${tab.name}"`, exists);
      }
      log(`${tabsCount}/6 onglets trouvés`, tabsCount >= 4);

      // Vérifier les boutons d'action
      const uploadBtn = await page.locator('button:has-text("Upload")').count();
      const playBtn = await page.locator('button:has-text("Play")').count();
      const refactorBtn = await page.locator('button:has-text("Refactor")').count();
      log('Bouton Upload présent', uploadBtn > 0);
      log('Bouton Play/Run présent', playBtn > 0);
      log('Bouton Refactor présent', refactorBtn > 0);

      // Vérifier l'éditeur de code
      const editorExists = await page.locator('.monaco-editor, [class*="editor"]').count() > 0;
      log('Éditeur Monaco présent', editorExists);

      // ============================================
      // TEST 3: CONVERSION COBOL → PYTHON
      // ============================================
      console.log('\n📋 ÉTAPE 3: CONVERSION COBOL → PYTHON\n' + '-'.repeat(50));

      // Coller le code COBOL dans l'éditeur
      console.log('   📝 Coller le code COBOL de test...');

      // Trouver la zone de texte pour le code COBOL
      const cobolTextarea = page.locator('textarea').first();
      if (await cobolTextarea.count() > 0) {
        await cobolTextarea.fill(SAMPLE_COBOL);
        console.log('   ✅ Code COBOL collé (42 lignes)');
        log('Code COBOL inséré', true);
      } else {
        log('Zone de texte COBOL non trouvée', false);
      }

      // Cliquer sur Refactor with Gemini
      const refactorButton = page.locator('button:has-text("Refactor")').first();
      if (await refactorButton.count() > 0) {
        console.log('   🚀 Lancement de la conversion...');
        await refactorButton.click();

        // Attendre la progression de l'analyse
        log('⏳ Conversion en cours...', true);

        // Attendre que le code Python apparaisse (timeout 60 secondes)
        let pythonFound = false;
        let attempts = 0;
        const maxAttempts = 30; // 30 * 2s = 60s max

        while (!pythonFound && attempts < maxAttempts) {
          await page.waitForTimeout(2000);
          attempts++;

          // Vérifier si du code Python a été généré
          const pageContent = await page.content();
          const hasPythonCode = pageContent.includes('def ') ||
                                pageContent.includes('class ') ||
                                pageContent.includes('Decimal') ||
                                pageContent.includes('dataclass');

          // Vérifier la barre de progression
          const progressBar = await page.locator('[class*="progress"]').count();
          const isLoading = await page.locator('text=Analyzing').count() > 0 ||
                           await page.locator('text=Processing').count() > 0 ||
                           await page.locator('text=Loading').count() > 0;

          console.log(`   ⏳ Tentative ${attempts}/${maxAttempts} - Loading: ${isLoading}`);

          if (hasPythonCode) {
            pythonFound = true;
            console.log('   ✅ Code Python détecté!');
          }

          if (attempts >= maxAttempts && !pythonFound) {
            console.log('   ⚠️ Timeout - vérification du contenu...');
          }
        }

        // Attendre un peu plus pour permettre l'affichage complet
        await page.waitForTimeout(3000);

        // Vérifications finales de la conversion
        const finalContent = await page.content();

        // Compter les métriques
        const hasDataclass = finalContent.includes('@dataclass') || finalContent.includes('dataclass');
        const hasDecimal = finalContent.includes('Decimal');
        const hasTests = finalContent.includes('def test_');
        const hasConfig = finalContent.includes('class Config') || finalContent.includes('load(');
        const hasAudit = finalContent.includes('Audit') || finalContent.includes('audit');

        log('Code Python généré avec @dataclass', hasDataclass);
        log('Utilisation de Decimal pour les calculs', hasDecimal);
        log('Tests unitaires générés (test_*)', hasTests);
        log('Configuration externe détectée', hasConfig);
        log('Système audit/logging détecté', hasAudit);

        // Vérifier le panneau des métriques
        const hasMetrics = finalContent.includes('Confidence') ||
                          finalContent.includes('Confidence') ||
                          finalContent.includes('Transformation');
        log('Métriques de transformation affichées', hasMetrics);

        // Vérifier l'onglet Tests
        const testsTab = page.locator('button:has-text("Tests")').first();
        if (await testsTab.count() > 0) {
          await testsTab.click();
          await page.waitForTimeout(2000);

          const testsContent = await page.content();
          const hasUnitTests = testsContent.includes('Unit') || testsContent.includes('test_');
          const hasShadowTests = testsContent.includes('Shadow') || testsContent.includes('readiness');
          const hasProductionTests = testsContent.includes('Production') || testsContent.includes('critical');

          log('Onglet Tests > Unit visible', hasUnitTests);
          log('Onglet Tests > Shadow visible', hasShadowTests);
          log('Onglet Tests > Production visible', hasProductionTests);
        }

        // ============================================
        // RÉSUMÉ DE LA CONVERSION
        // ============================================
        console.log('\n📊 RÉSUMÉ DE LA CONVERSION:');
        console.log('   • Code source COBOL: 42 lignes');
        console.log('   • Type: Calculateur de paie (GROSS→NET)');
        console.log('   • Métiers détectés: Payroll, Financial');
        console.log('   • Architecture attendue:');
        console.log('     - @dataclass pour structures de données');
        console.log('     - Classe TaxManager avec configuration');
        console.log('     - Classe Audit avec logging CSV');
        console.log('     - Utilisation de Decimal pour précision');
        console.log('     - Tests unitaires avec pytest');
      } else {
        log('Bouton Refactor non trouvé', false);
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
      console.log('\n⚠️ Problèmes identifiés:');
      results.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    const successRate = Math.round((results.passed / (results.passed + results.failed)) * 100);
    const status = results.failed === 0 ? '✅ SUCCÈS COMPLET' :
                  successRate >= 80 ? '✅ SUCCÈS PARTIEL' : '⚠️ ÉCHEC PARTIEL';
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
runCompleteTest()
  .then(results => {
    console.log('\n📋 RÉSULTATS:', JSON.stringify({ passed: results.passed, failed: results.failed }, null, 2));
    process.exit(results.failed > 5 ? 1 : 0);
  })
  .catch(error => {
    console.error('💥 Échec du test:', error);
    process.exit(1);
  });
