const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  const networkErrors = [];
  
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', error => {
    console.log('[PAGE ERROR] ' + error.message);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status()
      });
    }
  });

  try {
    console.log('=== TEST COMPLET: SHADOW TESTING ET READINESS ===\n');
    
    // COBOL code from the provided file
    const cobolCode = `       IDENTIFICATION DIVISION.
       PROGRAM-ID. ULTIMATE-BANKING-SYSTEM.
       AUTHOR. ENTERPRISE-ARCHITECT.
       DATE-WRITTEN. 1987-11-30.
       DATE-COMPILED. 2024-01-15.
       SECURITY. LEVEL-4 ENCRYPTED-AUDIT.
       REMARKS. CRITICAL FINANCIAL PROCESSING SYSTEM.

       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       SOURCE-COMPUTER. IBM-Z15 WITH DEBUGGING MODE.
       OBJECT-COMPUTER. IBM-Z15.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-CONTROL-FIELDS.
           05 WS-PROGRAM-STATUS         PIC X(2).
           05 WS-TRANSACTION-COUNT      PIC 9(6) VALUE ZERO.
           05 WS-TOTAL-AMOUNT           PIC S9(12)V99 VALUE ZERO.

       01 WS-CALCULATION-FIELDS.
           05 WS-NEW-BALANCE            PIC S9(9)V99.
           05 WS-INTEREST-AMOUNT        PIC S9(7)V99.
           05 WS-FEE-AMOUNT             PIC S9(5)V99.
           05 WS-TAX-AMOUNT             PIC S9(7)V99.

       01 WS-SECURITY-CONTROLS.
           05 WS-AUTH-LEVEL             PIC 9.
               88 AUTH-NONE             VALUE 0.
               88 AUTH-BASIC            VALUE 1.
               88 AUTH-ADVANCED         VALUE 2.
               88 AUTH-ADMIN            VALUE 3.

       01 WS-FLAGS.
           05 WS-EOF-FLAG               PIC X VALUE 'N'.
           05 WS-VALIDATION-FLAG        PIC X.
           05 WS-SECURITY-FLAG          PIC X.

       PROCEDURE DIVISION.
       MAIN-PROCEDURE.
           PERFORM 100-INITIALIZE
           PERFORM 200-PROCESS-TRANSACTION
           PERFORM 300-CALCULATE-INTEREST
           PERFORM 400-GENERATE-REPORTS
           PERFORM 900-TERMINATE
           GOBACK.

       100-INITIALIZE.
           MOVE FUNCTION CURRENT-DATE TO WS-CURRENT-DATE.
           OPEN I-O CUSTOMER-MASTER-FILE.

       200-PROCESS-TRANSACTION.
           EVALUATE TRANS-TYPE
               WHEN 'DEP'
                   PERFORM 210-PROCESS-DEPOSIT
               WHEN 'WDR'
                   PERFORM 220-PROCESS-WITHDRAWAL
               WHEN 'TRF'
                   PERFORM 230-PROCESS-TRANSFER
           END-EVALUATE.

       210-PROCESS-DEPOSIT.
           COMPUTE WS-NEW-BALANCE = CM-ACCOUNT-BALANCE + TRANS-AMOUNT.
           COMPUTE WS-TAX-AMOUNT = TRANS-AMOUNT * 0.196.
           ADD WS-TAX-AMOUNT TO CM-ACCOUNT-BALANCE.

       220-PROCESS-WITHDRAWAL.
           IF TRANS-AMOUNT > CM-AVAILABLE-BALANCE
               MOVE 'N' TO WS-VALIDATION-FLAG
           ELSE
               COMPUTE WS-FEE-AMOUNT = TRANS-AMOUNT * 0.015
               SUBTRACT TRANS-AMOUNT FROM CM-ACCOUNT-BALANCE
           END-IF.

       230-PROCESS-TRANSFER.
           IF TRANS-AMOUNT > CM-AVAILABLE-BALANCE
               MOVE 'N' TO WS-VALIDATION-FLAG
           ELSE
               SUBTRACT TRANS-AMOUNT FROM CM-ACCOUNT-BALANCE
               ADD TRANS-AMOUNT TO CM-TARGET-BALANCE
           END-IF.

       300-CALCULATE-INTEREST.
           MOVE CM-ACCOUNT-BALANCE TO WS-PRINCIPAL.
           MOVE CM-INTEREST-RATE TO WS-ANNUAL-RATE.
           COMPUTE WS-INTEREST-AMOUNT = WS-PRINCIPAL * WS-ANNUAL-RATE.
           ADD WS-INTEREST-AMOUNT TO CM-ACCOUNT-BALANCE.

       400-GENERATE-REPORTS.
           MOVE 'TRANSACTION REPORT' TO WS-REPORT-TITLE.
           DISPLAY WS-TRANSACTION-COUNT.
           DISPLAY WS-TOTAL-AMOUNT.

       900-TERMINATE.
           CLOSE CUSTOMER-MASTER-FILE.`;

    // Login first
    console.log('1. Connexion a l\'application...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('input[type="email"]', 'embebengon@gmail.com');
    await page.fill('input[type="password"]', 'EManu1231975@@');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    if (!page.url().includes('/dashboard')) {
      console.log('   [ERREUR] Echec de connexion');
      return;
    }
    console.log('   [OK] Connecte avec succes\n');

    // Navigate to conversion page
    console.log('2. Navigation vers la page de conversion...');
    const convertLink = await page.$('a[href="/convert"], a:has-text("Convert")');
    if (convertLink) {
      await convertLink.click();
      await page.waitForTimeout(3000);
    } else {
      await page.goto('http://localhost:3000/convert', { waitUntil: 'networkidle', timeout: 30000 });
    }
    console.log('   [OK] Page de conversion chargee\n');

    // Find and fill the textarea
    console.log('3. Recherche de la zone de texte COBOL...');
    const textarea = await page.$('textarea');
    if (textarea) {
      console.log('   [OK] Zone de texte trouvee\n');
      
      console.log('4. Insertion du code COBOL de test...');
      await textarea.fill(cobolCode);
      console.log('   [OK] Code COBOL insere (' + cobolCode.length + ' caracteres)\n');
      
      // Find and click convert button
      console.log('5. Recherche du bouton de conversion...');
      const convertBtn = await page.$('button:has-text("Convert"), button:has-text("Transpile"), button:has-text("Analyze")');
      if (convertBtn) {
        console.log('   [OK] Bouton trouve\n');
        
        console.log('6. Lancement de la conversion...\n');
        await convertBtn.click();
        
        console.log('7. Attente des resultats (20 secondes)...\n');
        await page.waitForTimeout(20000);

        // Analyze results
        console.log('8. Analyse des resultats...\n');
        const currentUrl = page.url();
        console.log('   URL actuelle: ' + currentUrl);
        
        // Get page content
        const pageContent = await page.content();
        
        // Check for shadow testing keywords
        console.log('   Mots-cles trovues:');
        const keywords = ['shadow', 'readiness', 'score', 'critical', 'test', 'phase', 'plan', 'risk', 'fraud'];
        const foundKeywords = {};
        for (const keyword of keywords) {
          const count = (pageContent.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
          if (count > 0) {
            foundKeywords[keyword] = count;
            console.log('     "' + keyword + '": ' + count + ' occurrence(s)');
          }
        }
        console.log('');

        // Check for readiness score
        console.log('   Verification du score de readiness:');
        const readinessPatterns = [
          /readiness_score/i,
          /readiness_status/i,
          /readiness.*status/i,
          /status.*ready/i
        ];
        let readinessFound = false;
        for (const pattern of readinessPatterns) {
          if (pattern.test(pageContent)) {
            console.log('     [OK] Readiness detecte');
            readinessFound = true;
            break;
          }
        }
        if (!readinessFound) {
          console.log('     [NON TROUVE] Score de readiness non detecte');
        }
        console.log('');

        // Check for critical paths
        console.log('   Verification des critical paths:');
        const criticalPatterns = [
          /critical.*path/i,
          /critical.*calculation/i,
          /financial.*calculation/i
        ];
        let criticalFound = false;
        for (const pattern of criticalPatterns) {
          if (pattern.test(pageContent)) {
            console.log('     [OK] Critical path detecte');
            criticalFound = true;
            break;
          }
        }
        if (!criticalFound) {
          console.log('     [NON TROUVE] Critical paths non detectes');
        }
        console.log('');

        // Check for shadow testing plan
        console.log('   Verification du plan de shadow testing:');
        const shadowPatterns = [
          /shadow.*test.*plan/i,
          /parallel.*execution/i,
          /output.*parity/i,
          /discrepancy/i
        ];
        let shadowFound = false;
        for (const pattern of shadowPatterns) {
          if (pattern.test(pageContent)) {
            console.log('     [OK] Shadow testing plan detecte');
            shadowFound = true;
            break;
          }
        }
        if (!shadowFound) {
          console.log('     [NON TROUVE] Plan de shadow testing non detecte');
        }
        console.log('');

        // Check for execution phases
        console.log('   Verification des phases de migration:');
        const phases = ['phase1', 'phase2', 'phase3', 'phase4'];
        let phasesFound = 0;
        for (const phase of phases) {
          if (pageContent.toLowerCase().includes(phase)) {
            console.log('     [OK] ' + phase.toUpperCase() + ' detecte');
            phasesFound++;
          }
        }
        if (phasesFound === 0) {
          console.log('     [NON TROUVE] Phases non detectees');
        }
        console.log('');

        // Check for success criteria
        console.log('   Verification des success criteria:');
        const successPatterns = [
          /success.*criterion/i,
          /output.*parity/i,
          /99.*percent/i,
          /99\.99/i
        ];
        let successFound = false;
        for (const pattern of successPatterns) {
          if (pattern.test(pageContent)) {
            console.log('     [OK] Success criteria detecte');
            successFound = true;
            break;
          }
        }
        if (!successFound) {
          console.log('     [NON TROUVE] Success criteria non detectes');
        }
        console.log('');

        // Check for numeric values (scores)
        console.log('   Scores et pourcentages detectes:');
        const scorePattern = /\d{1,3}%/g;
        const scores = pageContent.match(scorePattern);
        if (scores) {
          console.log('     Scores: ' + scores.join(', '));
        } else {
          console.log('     [AUCUN] Aucun score detecte');
        }
        console.log('');

        // Check for test data recommendations
        console.log('   Verification des recommendations de test:');
        const testDataPatterns = [
          /test.*data/i,
          /sample.*input/i,
          /boundary/i,
          /edge.*case/i
        ];
        let testDataFound = false;
        for (const pattern of testDataPatterns) {
          if (pattern.test(pageContent)) {
            console.log('     [OK] Donnees de test recommandees detectees');
            testDataFound = true;
            break;
          }
        }
        if (!testDataFound) {
          console.log('     [NON TROUVE] Recommendations non detectees');
        }

      } else {
        console.log('   [ERREUR] Bouton de conversion non trouve\n');
        console.log('   Elements disponibles:');
        const buttons = await page.$$('button');
        for (let i = 0; i < buttons.length; i++) {
          const text = await buttons[i].textContent();
          console.log('     ' + (i + 1) + '. ' + text.substring(0, 50));
        }
      }
    } else {
      console.log('   [ERREUR] Zone de texte non trouvee\n');
    }

    // Check for errors
    console.log('\n9. Verification des erreurs...');
    const errors = consoleMessages.filter(m => m.type === 'error');
    if (errors.length > 0) {
      console.log('   [ERREUR] ' + errors.length + ' erreur(s):');
      errors.forEach((e, i) => {
        console.log('     ' + (i + 1) + '. ' + e.text.substring(0, 80));
      });
    } else {
      console.log('   [OK] Aucune erreur critique');
    }

    // Summary
    console.log('\n========================================');
    console.log('           RESUME DU TEST              ');
    console.log('========================================');
    console.log('Page actuelle: ' + page.url());
    console.log('Erreurs: ' + errors.length);
    
    if (page.url().includes('/result') || page.url().includes('/analysis') || page.url().includes('/convert')) {
      console.log('\nLa conversion a ete effectuee.');
      console.log('Pour voir les details de shadow testing:');
      console.log('  1. Recherchez "readiness_score" dans la page');
      console.log('  2. Verifiez "critical_paths" pour les calculs');
      console.log('  3. Consultez "shadow_testing_plan" pour le plan');
      console.log('  4. Check "execution_phases" pour les etapes');
    }

  } catch (error) {
    console.error('\n[ERREUR] ' + error.message);
  } finally {
    await browser.close();
    console.log('\n=== TEST TERMINÉ ===');
  }
})();
