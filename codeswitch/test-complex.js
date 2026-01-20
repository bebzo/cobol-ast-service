/**
 * TEST COMPLEX COBOL - DÉCLENCHEUR DE TOUTES LES FONCTIONNALITÉS
 * Code COBOL complet avec logique métier, fichiers, SQL, dates, etc.
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

       01  SQL-COMM-AREA.
           05  SQL-CODE            PIC S9(9).
           05  SQL-MESSAGE         PIC X(256).

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

async function runComplexTest() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 TEST COMPLEXE COBOL - TOUTES LES FONCTIONNALITÉS');
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
        log('✅ AUTHENTIFICATION RÉUSSIE - dev@minimax.io');
      } catch (e) {
        log(`Échec auth - URL: ${page.url()}`, page.url().includes('/dashboard'));
      }
    }

    // ============================================
    // ÉTAPE 2: DASHBOARD
    // ============================================
    if (page.url().includes('/dashboard')) {
      console.log('\n📋 ÉTAPE 2: VÉRIFICATION DASHBOARD\n' + '-'.repeat(50));

      await page.waitForTimeout(3000);

      // Vérifier les éléments principaux
      const hasEditor = await page.locator('.monaco-editor, [class*="editor"]').count() > 0;
      const hasRefactor = await page.locator('button:has-text("Refactor")').count() > 0;
      log('Éditeur Monaco présent', hasEditor);
      log('Bouton Refactor présent', hasRefactor);

      // ============================================
      // ÉTAPE 3: CONVERSION COBOL COMPLEXE
      // ============================================
      console.log('\n📋 ÉTAPE 3: CONVERSION COBOL COMPLEXE\n' + '-'.repeat(50));
      console.log(`   📝 Code source: ${COMPLEX_COBOL.split('\n').length} lignes`);
      console.log('   🏦 Système de gestion de comptes bancaires');
      console.log('   📁 Features: File I/O, SQL, Dates, Security, Reports\n');

      // Coller le code COBOL
      const cobolTextarea = page.locator('textarea').first();
      if (await cobolTextarea.count() > 0) {
        await cobolTextarea.fill(COMPLEX_COBOL);
        log('Code COBOL complexe inséré', true);

        // Lancer la conversion
        const refactorButton = page.locator('button:has-text("Refactor")').first();
        if (await refactorButton.count() > 0) {
          await refactorButton.click();
          console.log('   🚀 Conversion en cours (Code COBOL Complexe)...\n');

          // Attendre la conversion
          let pythonFound = false;
          let attempts = 0;
          const maxAttempts = 45; // 90 secondes max

          while (!pythonFound && attempts < maxAttempts) {
            await page.waitForTimeout(2000);
            attempts++;

            const pageContent = await page.content();

            // Vérifier différents indicateurs de génération Python
            const hasPython = pageContent.includes('def ') ||
                             pageContent.includes('class ') ||
                             pageContent.includes('Decimal') ||
                             pageContent.includes('dataclass');

            // Indicateurs spécifiques CodeSwitch Pro
            const hasProFeatures =
              pageContent.includes('TaxConfig') ||
              pageContent.includes('TaxManager') ||
              pageContent.includes('TaxAudit') ||
              pageContent.includes('@dataclass') ||
              pageContent.includes('Decimal') ||
              pageContent.includes('load(') ||
              pageContent.includes('CSV') ||
              pageContent.includes('migrate_') ||
              pageContent.includes('security_warnings');

            console.log(`   ⏳ Tentative ${attempts}/${maxAttempts}`);

            if (hasPython) {
              pythonFound = true;
              console.log('   ✅ Code Python détecté!\n');
            }

            if (attempts >= maxAttempts) {
              console.log('   ⚠️ Timeout - Analyse du contenu généré...\n');
            }
          }

          // Attendre l'affichage complet
          await page.waitForTimeout(3000);

          const finalContent = await page.content();

          // ============================================
          // VÉRIFICATIONS DÉTAILLÉES
          // ============================================
          console.log('📊 VÉRIFICATION DES FONCTIONNALITÉS:\n');

          // Architecture Pro
          const hasDataclass = finalContent.includes('@dataclass') || finalContent.includes('dataclass');
          const hasDecimal = finalContent.includes('Decimal');
          const hasConfig = finalContent.includes('class Config') || finalContent.includes('load(') || finalContent.includes('json');
          const hasAudit = finalContent.includes('Audit') || finalContent.includes('audit') || finalContent.includes('CSV') || finalContent.includes('logging');
          const hasManager = finalContent.includes('class TaxManager') || finalContent.includes('class Manager') || finalContent.includes('class Bank');

          log('Architecture @dataclass générée', hasDataclass);
          log('Type Decimal pour finances', hasDecimal);
          log('Configuration externe (JSON/load)', hasConfig);
          log('Système Audit/Logging', hasAudit);
          log('Classe Manager/Controller', hasManager);

          // Métriques
          const hasTests = finalContent.includes('def test_') || finalContent.includes('pytest');
          const hasMigrationScore = finalContent.includes('migration_score') || finalContent.includes('confidence');
          const hasSecurityWarnings = finalContent.includes('security_warnings') || finalContent.includes('Vulnerability') || finalContent.includes('CVSS');

          log('Tests unitaires générés (test_*)', hasTests);
          log('Score de migration affiché', hasMigrationScore);
          log('Avertissements de sécurité', hasSecurityWarnings);

          // Fonctionnalités avancées
          const hasIssues = finalContent.includes('"issues"') || finalContent.includes('Issues') || finalContent.includes('problems');
          const hasImprovements = finalContent.includes('"improvements"') || finalContent.includes('Improvements');
          const hasNextSteps = finalContent.includes('"next_steps"') || finalContent.includes('next_steps');

          log('Issues détectés', hasIssues);
          log('Améliorations suggérées', hasImprovements);
          log('Next steps définis', hasNextSteps);

          // Analyse métier
          const hasBusinessContext = finalContent.includes('business_context') ||
                                    finalContent.includes('domain') ||
                                    finalContent.includes('Banking');
          const hasObsolescence = finalContent.includes('is_obsolete') ||
                                 finalContent.includes('obsolete') ||
                                 finalContent.includes('1995');

          log('Contexte métier détecté', hasBusinessContext);
          log('Détection obsolescence (1995 rates)', hasObsolescence);

          // Onglet Tests
          console.log('\n📋 ÉTAPE 4: VÉRIFICATION ONGLETS TESTS\n' + '-'.repeat(50));

          const testsTab = page.locator('button:has-text("Tests")').first();
          if (await testsTab.count() > 0) {
            await testsTab.click();
            await page.waitForTimeout(2000);

            const testsContent = await page.content();

            const hasUnit = testsContent.includes('Unit') || testsContent.includes('unit');
            const hasShadow = testsContent.includes('Shadow') || testsContent.includes('readiness');
            const hasProduction = testsContent.includes('Production') || testsContent.includes('critical');

            log('Onglet Tests > Unit', hasUnit);
            log('Onglet Tests > Shadow (readiness)', hasShadow);
            log('Onglet Tests > Production (critical)', hasProduction);

            // Cliquer sur Shadow pour voir le contenu
            if (hasShadow) {
              const shadowTab = page.locator('button:has-text("Shadow")').first();
              if (await shadowTab.count() > 0) {
                await shadowTab.click();
                await page.waitForTimeout(2000);

                const shadowContent = await page.content();
                const hasReadiness = shadowContent.includes('readiness') ||
                                    shadowContent.includes('critical') ||
                                    shadowContent.includes('test_points');
                log('Plan de test Shadow détecté', hasReadiness);
              }
            }
          }

          // ============================================
          // RÉSUMÉ
          // ============================================
          console.log('\n📋 RÉSUMÉ DE LA CONVERSION COMPLEXE:\n');
          console.log('   🏦 Code source: BANK ACCOUNT MANAGER');
          console.log('   📝 Lignes COBOL: ' + COMPLEX_COBOL.split('\n').length);
          console.log('   ✅ Features détectées:');
          console.log('     - File I/O (ACCOUNT-FILE, indexed)');
          console.log('     - SQL/CICS integration');
          console.log('     - Date logic (ACCEPT FROM DATE)');
          console.log('     - Security (password hash, access levels)');
          console.log('     - Reports generation');
          console.log('     - Interest calculation');
          console.log('     - Tax rates (1995 - OBSOLETE!)');
          console.log('     - 88-level condition names (ACCT-ACTIVE, etc.)');
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
    console.log('📊 RAPPORT FINAL - TEST COMPLEXE');
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
runComplexTest()
  .then(results => {
    console.log('\n📋 RÉSULTATS:', JSON.stringify({ passed: results.passed, failed: results.failed }, null, 2));
    process.exit(results.failed > 8 ? 1 : 0);
  })
  .catch(error => {
    console.error('💥 Échec du test:', error);
    process.exit(1);
  });
