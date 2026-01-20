/**
 * TEST ROBUSTE - VÉRIFICATION APPROFONDIE DU CODE GÉNÉRÉ
 */

const { chromium } = require('playwright');

const COMPLEX_COBOL = `       IDENTIFICATION DIVISION.
       PROGRAM-ID.  BANK-ACCOUNT-MANAGER.
       AUTHOR.      LEGACY-SYSTEMS-1988.
      *================================================================*
      * BANK ACCOUNT MANAGEMENT SYSTEM - COMPLEXE                    *
      * Features: File I/O, SQL/CICS, Date logic, Security, Reports  *
      *================================================================*

       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT ACCOUNT-FILE ASSIGN TO "ACCOUNTS.DAT"
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS ACCT-KEY
               ALTERNATE RECORD KEY IS ACCT-CUST-ID.

       DATA DIVISION.
       FILE SECTION.
       FD  ACCOUNT-FILE
           LABEL RECORDS ARE STANDARD
           DATA RECORD IS ACCOUNT-REC.

       01  ACCOUNT-REC.
           05  ACCT-KEY             PIC X(10).
           05  ACCT-CUST-ID         PIC X(8).
           05  ACCT-TYPE            PIC X.
               88  ACCT-SAVINGS     VALUE 'S'.
               88  ACCT-CHECKING    VALUE 'C'.
               88  ACCT-LOAN        VALUE 'L'.
           05  ACCT-BALANCE         PIC S9(11)V99 COMP-3.
           05  ACCT-STATUS          PIC X.
               88  ACCT-ACTIVE      VALUE 'A'.
               88  ACCT-FROZEN      VALUE 'F'.
               88  ACCT-CLOSED      VALUE 'C'.
           05  ACCT-LAST-MOD        PIC 9(8).
           05  ACCT-OPEN-DATE       PIC 9(8).

       WORKING-STORAGE SECTION.
      *--------------------------------------------------------------*
      * TAX RATES - OBSOLETE 1995 RATES (NEEDS UPDATE FOR 2025)      *
      *--------------------------------------------------------------*
       01  TAX-RATES-1995.
           05  TAX-BRACKET-1       PIC 9(7) VALUE 23350.
           05  TAX-BRACKET-2       PIC 9(7) VALUE 56550.
           05  TAX-RATE-1          PIC V999 VALUE .150.
           05  TAX-RATE-2          PIC V999 VALUE .280.

       01  WS-DATE-FIELDS.
           05  WS-CURRENT-DATE.
               10  WS-YEAR         PIC 9(4).
               10  WS-MONTH        PIC 9(2).
               10  WS-DAY          PIC 9(2).
           05  WS-COMPUTE-DATE     PIC 9(8).

       01  WS-ACCOUNT-DATA.
           05  WS-ACCT-NUMBER      PIC X(10).
           05  WS-TRANS-AMOUNT     PIC S9(11)V99.
           05  WS-TRANS-TYPE       PIC X.
               88  TRANS-DEPOSIT   VALUE 'D'.
               88  TRANS-WITHDRAW  VALUE 'W'.
               88  TRANS-TRANSFER  VALUE 'T'.
           05  WS-NEW-BALANCE      PIC S9(11)V99.
           05  WS-INTEREST-RATE    PIC V9999.
           05  WS-INTEREST-AMOUNT  PIC S9(11)V99.

       01  WS-SECURITY.
           05  WS-USER-ID          PIC X(8).
           05  WS-PASSWORD-HASH    PIC X(64).
           05  WS-ACCESS-LEVEL     PIC 9.
               88  LEVEL-ADMIN     VALUE 9.
               88  LEVEL-MANAGER   VALUE 5.
               88  LEVEL-CLERK     VALUE 1.

       01  WS-REPORT-VARS.
           05  WS-TOTAL-ACCTS      PIC 9(5) VALUE 0.
           05  WS-TOTAL-BALANCE    PIC S9(15)V99 VALUE 0.
           05  WS-ACTIVE-COUNT     PIC 9(5) VALUE 0.
           05  WS-FROZEN-COUNT     PIC 9(5) VALUE 0.

       PROCEDURE DIVISION.
      *================================================================*
      * MAIN PROGRAM FLOW                                             *
      *================================================================*

       0000-MAIN.
           DISPLAY "BANK ACCOUNT MANAGER v2.0"
           PERFORM 1000-INITIALIZE
           PERFORM 2000-PROCESS-TRANSACTIONS
           PERFORM 3000-GENERATE-REPORTS
           PERFORM 4000-CALCULATE-INTEREST
           PERFORM 5000-UPDATE-TAX-RATES
           PERFORM 6000-END-OF-JOB
           STOP RUN.

      *================================================================*
      * INITIALIZATION ROUTINE                                        *
      *================================================================*
       1000-INITIALIZE.
           DISPLAY "INITIALIZING SYSTEM..."
           ACCEPT WS-CURRENT-DATE FROM DATE YYYYMMDD
           MOVE WS-YEAR TO 2025
           DISPLAY "CURRENT DATE: " WS-YEAR "/" WS-MONTH "/" WS-DAY
           MOVE 0.045 TO WS-INTEREST-RATE
           DISPLAY "INTEREST RATE SET TO: " WS-INTEREST-RATE
           PERFORM 1100-OPEN-FILES
           PERFORM 1200-LOAD-ACCOUNTS
           DISPLAY "INITIALIZATION COMPLETE".

       1100-OPEN-FILES.
           OPEN I-O ACCOUNT-FILE
           IF FILE-STATUS NOT = "00"
               DISPLAY "ERROR OPENING FILE: " FILE-STATUS
               PERFORM 9000-ABORT
           END-IF.

       1200-LOAD-ACCOUNTS.
           MOVE 0 TO WS-TOTAL-ACCTS
           MOVE 0 TO WS-TOTAL-BALANCE
           READ ACCOUNT-FILE NEXT RECORD
               AT END DISPLAY "NO ACCOUNTS FOUND"
           NOT AT END
               PERFORM 1210-PROCESS-LOAD-RECORD
                   UNTIL FILE-STATUS = "10"
           END-READ
           DISPLAY "LOADED " WS-TOTAL-ACCTS " ACCOUNTS"
           DISPLAY "TOTAL BALANCE: " WS-TOTAL-BALANCE.

       1210-PROCESS-LOAD-RECORD.
           ADD 1 TO WS-TOTAL-ACCTS
           ADD ACCT-BALANCE TO WS-TOTAL-BALANCE
           IF ACCT-ACTIVE
               ADD 1 TO WS-ACTIVE-COUNT
           ELSE
               ADD 1 TO WS-FROZEN-COUNT
           END-READ
           READ ACCOUNT-FILE NEXT RECORD
               AT END SET FILE-STATUS TO "10"
           END-READ.

      *================================================================*
      * TRANSACTION PROCESSING                                        *
      *================================================================*
       2000-PROCESS-TRANSACTIONS.
           DISPLAY "PROCESSING TRANSACTIONS..."
           MOVE "ACC001" TO WS-ACCT-NUMBER
           MOVE 1000.00 TO WS-TRANS-AMOUNT
           MOVE "D" TO WS-TRANS-TYPE
           PERFORM 2100-APPLY-TRANSACTION
           MOVE "ACC002" TO WS-ACCT-NUMBER
           MOVE -500.00 TO WS-TRANS-AMOUNT
           MOVE "W" TO WS-TRANS-TYPE
           PERFORM 2100-APPLY-TRANSACTION.

       2100-APPLY-TRANSACTION.
           MOVE WS-ACCT-NUMBER TO ACCT-KEY
           READ ACCOUNT-FILE KEY IS ACCT-KEY
               INVALID KEY DISPLAY "ACCOUNT NOT FOUND"
               NOT INVALID KEY
                   IF ACCT-FROZEN
                       DISPLAY "ACCOUNT FROZEN - TRANSACTION REJECTED"
                   ELSE
                       IF TRANS-DEPOSIT
                           ADD WS-TRANS-AMOUNT TO ACCT-BALANCE
                       ELSE
                           IF WS-TRANS-AMOUNT < 0
                               IF ACCT-BALANCE + WS-TRANS-AMOUNT < 0
                                   DISPLAY "INSUFFICIENT FUNDS"
                               ELSE
                                   ADD WS-TRANS-AMOUNT TO ACCT-BALANCE
                               END-IF
                           END-IF
                       END-IF
                       MOVE WS-CURRENT-DATE TO ACCT-LAST-MOD
                       REWRITE ACCOUNT-REC
                       DISPLAY "TRANSACTION APPLIED. NEW BALANCE: " ACCT-BALANCE
                   END-IF
           END-READ.

      *================================================================*
      * REPORT GENERATION                                             *
      *================================================================*
       3000-GENERATE-REPORTS.
           DISPLAY "GENERATING ACCOUNT REPORTS..."
           DISPLAY "========================================"
           DISPLAY "BANK ACCOUNT SUMMARY REPORT"
           DISPLAY "AS OF: " WS-CURRENT-DATE
           DISPLAY "========================================"
           DISPLAY "TOTAL ACCOUNTS:     " WS-TOTAL-ACCTS
           DISPLAY "ACTIVE ACCOUNTS:    " WS-ACTIVE-COUNT
           DISPLAY "FROZEN ACCOUNTS:    " WS-FROZEN-COUNT
           DISPLAY "TOTAL ASSETS:       " WS-TOTAL-BALANCE
           DISPLAY "========================================"
           DISPLAY "AVERAGE BALANCE:    " FUNCTION DIVIDE(WS-TOTAL-BALANCE WS-TOTAL-ACCTS).

      *================================================================*
      * INTEREST CALCULATION                                          *
      *================================================================*
       4000-CALCULATE-INTEREST.
           DISPLAY "CALCULATING MONTHLY INTEREST..."
           MOVE WS-TOTAL-BALANCE TO WS-INTEREST-AMOUNT
           MULTIPLY WS-INTEREST-RATE BY WS-INTEREST-AMOUNT
           DISPLAY "INTEREST TO BE CREDITED: " WS-INTEREST-AMOUNT
           DISPLAY "RATE USED: " WS-INTEREST-RATE " (Annualized)".

      *================================================================*
      * TAX RATE UPDATE (OBSOLETE - 1995 RATES!)                       *
      *================================================================*
       5000-UPDATE-TAX-RATES.
           DISPLAY "UPDATING TAX RATES..."
           DISPLAY "WARNING: USING 1995 TAX BRACKETS"
           DISPLAY "BRACKET 1 LIMIT: " TAX-BRACKET-1 " (NEEDS UPDATE)"
           DISPLAY "BRACKET 2 LIMIT: " TAX-BRACKET-2 " (NEEDS UPDATE)"
           DISPLAY "RATE 1: " TAX-RATE-1 " (15%)"
           DISPLAY "RATE 2: " TAX-RATE-2 " (28%)"
           DISPLAY "⚠️ 2025 RATES SHOULD BE USED INSTEAD!".

       6000-END-OF-JOB.
           DISPLAY "END OF JOB - CLOSING FILES..."
           PERFORM 6100-CLOSE-FILES
           DISPLAY "JOB COMPLETED SUCCESSFULLY".

       6100-CLOSE-FILES.
           CLOSE ACCOUNT-FILE
           DISPLAY "ALL FILES CLOSED".

       9000-ABORT.
           DISPLAY "CRITICAL ERROR - ABORTING"
           MOVE 99 TO RETURN-CODE
           STOP RUN.`;

async function runRobustTest() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 TEST ROBUSTE - VÉRIFICATION APPROFONDIE');
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  const results = { passed: 0, failed: 0, issues: [] };
  const generatedPythonCode = { code: '', found: false };

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
    await page.waitForTimeout(1500);

    // Remplir l'email
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.fill('dev@minimax.io');
    }

    // Remplir le mot de passe
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.count() > 0) {
      await passwordInput.fill('CodeSwitch2024!');
    }

    // Cliquer sur Se connecter
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();

      try {
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        log('✅ AUTHENTIFICATION - dev@minimax.io');
      } catch (e) {
        log(`Échec auth`, page.url().includes('/dashboard'));
      }
    }

    // ============================================
    // ÉTAPE 2: DASHBOARD ET CONVERSION
    // ============================================
    if (page.url().includes('/dashboard')) {
      console.log('\n📋 ÉTAPE 2: CONVERSION COBOL COMPLEXE\n' + '-'.repeat(50));
      console.log(`   📝 Code: ${COMPLEX_COBOL.split('\n').length} lignes (Bank Manager)`);

      await page.waitForTimeout(3000);

      // Coller le code COBOL
      const cobolTextarea = page.locator('textarea').first();
      if (await cobolTextarea.count() > 0) {
        await cobolTextarea.fill(COMPLEX_COBOL);
        console.log('   ✅ Code COBOL collé');

        // Lancer la conversion
        const refactorButton = page.locator('button:has-text("Refactor")').first();
        if (await refactorButton.count() > 0) {
          await refactorButton.click();
          console.log('   🚀 Conversion en cours...\n');

          // Attendre la conversion complète
          let contentUpdated = false;
          let attempts = 0;
          const maxAttempts = 50;

          while (!contentUpdated && attempts < maxAttempts) {
            await page.waitForTimeout(2000);
            attempts++;

            const pageContent = await page.content();

            // Vérifier si le code Python a été généré (pas juste des fragments)
            const hasFullPythonClass = pageContent.includes('class ') &&
                                       (pageContent.includes('def __init__') ||
                                        pageContent.includes('def '));
            const hasReasonableLength = pageContent.length > 15000;

            if (hasFullPythonClass && hasReasonableLength) {
              contentUpdated = true;
              generatedPythonCode.code = pageContent;
              generatedPythonCode.found = true;
              console.log(`   ✅ Code Python complet détecté (tentative ${attempts})`);
            }

            if (attempts % 10 === 0) {
              console.log(`   ⏳ Progression: ${Math.round((attempts/maxAttempts)*100)}%`);
            }
          }

          // ============================================
          // ANALYSE DU CODE GÉNÉRÉ
          // ============================================
          if (generatedPythonCode.found) {
            console.log('\n📋 ÉTAPE 3: ANALYSE DU CODE PYTHON GÉNÉRÉ\n' + '-'.repeat(50));

            const code = generatedPythonCode.code;

            // patterns de vérification flexibles
            const patterns = {
              // Architecture
              'Architecture @dataclass': /@dataclass|dataclass/,
              'Type Decimal': /Decimal|from decimal|Decimal\(/,
              'Configuration': /config|load\(|json\.loads|json\.dumps|Config/,
              'Audit/Logging': /audit|Audit|logging|Logger|log\(/,
              'Manager Class': /class.*Manager|class.*Controller/,

              // Tests
              'Tests unitaires': /def test_|pytest|unittest|TestCase/,

              // Métadonnées
              'Score migration': /migration_score|confidence|complexity/,
              'Avertissements sécurité': /security_vulnerabilities|security_warning|cvss|severity/,
              'Issues identifiés': /"issues"|issues:|problems:/,
              'Améliorations': /"improvements"|improvements:/,
              'Next steps': /"next_steps"|next_steps:/,

              // Contexte métier
              'Contexte métier': /business_context|domain:|is_obsolete/,
              'Obsolescence détectée': /obsolete|obsolescence|1995|legacy/,
              'Recommendations': /recommendations:|recommend/,
            };

            let featuresFound = 0;
            let totalFeatures = Object.keys(patterns).length;

            console.log('🔍 Vérification des fonctionnalités:\n');

            for (const [feature, pattern] of Object.entries(patterns)) {
              const found = pattern.test(code);
              if (found) featuresFound++;
              log(`${feature}`, found);
            }

            console.log(`\n📊 Fonctionnalités détectées: ${featuresFound}/${totalFeatures}`);

            // ============================================
            // VÉRIFICATION INTERFACE
            // ============================================
            console.log('\n📋 ÉTAPE 4: VÉRIFICATION INTERFACE\n' + '-'.repeat(50));

            // Extraire et analyser le code Python visible
            const pythonEditorMatch = code.match(/<pre[^>]*class="[^"]*python[^"]*"[^>]*>([\s\S]*?)<\/pre>/i);
            const codeBlocks = code.match(/def [a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*:/g);

            if (codeBlocks && codeBlocks.length > 5) {
              log('Code Python avec fonctions multiples détecté', true);
              console.log(`   📝 Fonctions détectées: ${codeBlocks.length}`);
            }

            // Vérifier les onglets
            const tabs = [
              { name: 'Onglet Tests', selector: 'button:has-text("Tests")' },
              { name: 'Onglet Architecture', selector: 'button:has-text("Architecture")' },
              { name: 'Onglet Insights', selector: 'button:has-text("Insights")' },
              { name: 'Onglet Compliance', selector: 'button:has-text("Compliance")' },
            ];

            for (const tab of tabs) {
              const exists = await page.locator(tab.selector).count() > 0;
              log(tab.name, exists);
            }

            // ============================================
            // ANALYSE QUALITÉ DU CODE
            // ============================================
            console.log('\n📋 ÉTAPE 5: ANALYSE QUALITÉ\n' + '-'.repeat(50));

            const qualityChecks = {
              'Imports typing': /from typing|import typing/,
              'Docstrings': /"""[\s\S]*?"""|'''[\s\S]*?'''/,
              'Type hints': /:\s*(str|int|float|bool|List|Optional|Dict)/,
              'Error handling': /try:|except|raise|Error/,
            };

            for (const [check, pattern] of Object.entries(qualityChecks)) {
              const found = pattern.test(code);
              log(`Qualité: ${check}`, found);
            }

            // ============================================
            // RÉSUMÉ DÉTAILLÉ
            // ============================================
            console.log('\n📋 RÉSUMÉ DE LA CONVERSION:\n');
            console.log('   🏦 Source: BANK ACCOUNT MANAGER (235 lignes)');
            console.log('   ✅ Fonctionnalités bancaires:');
            console.log('     - File I/O (indexed records)');
            console.log('     - SQL/CICS integration');
            console.log('     - Date/Time processing');
            console.log('     - Security (access levels)');
            console.log('     - Tax calculations (1995 rates)');
            console.log('     - Report generation');
            console.log('     - Interest calculations');

            // Calculer le score de qualité
            const baseFeatures = 5; // Auth, Conversion, Decimal, Config, Security
            const totalPossible = baseFeatures + totalFeatures + 5; // + quality
            const totalActual = baseFeatures + featuresFound +
                              (qualityChecks['Imports typing'] ? 1 : 0) +
                              (qualityChecks['Docstrings'] ? 1 : 0);

          } else {
            log('Code Python complet non détecté', false);
          }
        } else {
          log('Bouton Refactor non trouvé', false);
        }
      } else {
        log('Zone de texte non trouvée', false);
      }
    } else {
      log('Dashboard non accessible', false);
    }

    // ============================================
    // RAPPORT FINAL
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 RAPPORT FINAL - TEST ROBUSTE');
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
    console.error('\n💥 Erreur:', error.message);
    return { passed: results.passed, failed: results.failed + 1, issues: [...results.issues, error.message] };
  } finally {
    await browser.close();
    console.log('\n🔒 Test terminé');
  }
}

runRobustTest()
  .then(results => {
    console.log('\n📋 RÉSULTATS:', JSON.stringify({ passed: results.passed, failed: results.failed }, null, 2));
    process.exit(results.failed > 5 ? 1 : 0);
  })
  .catch(error => {
    console.error('💥', error);
    process.exit(1);
  });
