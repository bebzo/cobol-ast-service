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
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  try {
    console.log('=== TEST COMPLET: SHADOW TESTING ET READINESS ===\n');
    
    // Sample COBOL code for testing
    const sampleCobol = `       IDENTIFICATION DIVISION.
       PROGRAM-ID. CALCULATE-INTEREST.
       AUTHOR. TEST-DEVELOPER.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-PRINCIPAL        PIC 9(10)V99.
       01 WS-RATE            PIC 9(3)V999.
       01 WS-TIME            PIC 9(3).
       01 WS-INTEREST        PIC 9(10)V99.
       01 WS-AMOUNT          PIC 9(10)V99.
       
       PROCEDURE DIVISION.
       MAIN-PARA.
           DISPLAY "Enter Principal Amount: ".
           ACCEPT WS-PRINCIPAL.
           DISPLAY "Enter Rate (e.g., 525 for 5.25%): ".
           ACCEPT WS-RATE.
           DISPLAY "Enter Time in years: ".
           ACCEPT WS-TIME.
           
           COMPUTE WS-INTEREST = WS-PRINCIPAL * (WS-RATE / 1000) * WS-TIME.
           COMPUTE WS-AMOUNT = WS-PRINCIPAL + WS-INTEREST.
           
           DISPLAY "Interest = " WS-INTEREST.
           DISPLAY "Total Amount = " WS-AMOUNT.
           
           IF WS-AMOUNT > 1000000
               DISPLAY "LARGE TRANSACTION"
           ELSE
               DISPLAY "STANDARD TRANSACTION"
           END-IF.
           
           STOP RUN.`;

    // First, login
    console.log('1. Connexion à l\'application...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('input[type="email"]', 'embebengon@gmail.com');
    await page.fill('input[type="password"]', 'EManu1231975@@');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    if (!page.url().includes('/dashboard')) {
      console.log('   ✗ Échec de connexion');
      return;
    }
    console.log('   ✓ Connecté avec succès\n');

    console.log('2. Navigation vers la page de conversion...');
    // Look for conversion/input page
    const newAnalysisBtn = await page.$('a:has-text("New Analysis"), button:has-text("New"), a:has-text("Convert")');
    if (newAnalysisBtn) {
      await newAnalysisBtn.click();
      await page.waitForTimeout(3000);
      console.log('   ✓ Page d\'analyse atteinte\n');
    } else {
      // Try to go directly to conversion page
      await page.goto('http://localhost:3000/convert', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      console.log('   ✓ Page de conversion chargée\n');
    }

    console.log('3. Recherche de la zone de texte COBOL...');
    const textAreas = await page.$$('textarea');
    console.log(`   ${textAreas.length} zone(s) de texte trouvée(s)\n`);

    if (textAreas.length > 0) {
      console.log('4. Insertion du code COBOL de test...');
      await textAreas[0].fill(sampleCobol);
      console.log('   ✓ Code COBOL inséré\n');

      console.log('5. Recherche du bouton de conversion...');
      const convertBtn = await page.$('button:has-text("Convert"), button:has-text("Analyze"), button:has-text("Transpile")');
      if (convertBtn) {
        console.log('   ✓ Bouton trouvé\n');
        
        console.log('6. Lancement de la conversion...');
        await convertBtn.click();
        
        console.log('7. Attente des résultats (15 secondes)...\n');
        await page.waitForTimeout(15000);

        // Check for results
        console.log('8. Analyse des résultats...\n');
        const currentUrl = page.url();
        console.log(`   URL actuelle: ${currentUrl}`);
        
        // Look for results section
        const pageContent = await page.content();
        
        // Check for shadow testing keywords
        console.log('   Mots-clés trovés:');
        const keywords = ['shadow', 'readiness', 'score', 'critical', 'test', 'phase', 'plan'];
        for (const keyword of keywords) {
          const count = (pageContent.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
          if (count > 0) {
            console.log(`     "${keyword}": ${count} occurrence(s)`);
          }
        }

        // Look for specific readiness elements
        console.log('\n   Recherche des éléments de readiness:');
        const readinessPatterns = [
          /readiness_score/i,
          /readiness_status/i,
          /critical_path/i,
          /test_data/i,
          /execution_plan/i,
          /success_criteria/i
        ];
        
        for (const pattern of readinessPatterns) {
          if (pattern.test(pageContent)) {
            console.log(`     ✓ ${pattern.source} - TROUVÉ`);
          }
        }

        // Check for shadow testing plan
        console.log('\n   Recherche du plan de shadow testing:');
        const shadowPatterns = [
          /shadow_testing_plan/i,
          /parallel_execution/i,
          /discrepancy/i,
          /output_parity/i
        ];
        
        for (const pattern of shadowPatterns) {
          if (pattern.test(pageContent)) {
            console.log(`     ✓ ${pattern.source} - TROUVÉ`);
          }
        }

        // Check for numeric values (scores, percentages)
        console.log('\n   Recherche des scores et pourcentages:');
        const scorePattern = /\d+\s*%/g;
        const scores = pageContent.match(scorePattern);
        if (scores) {
          console.log(`     Scores trovés: ${scores.join(', ')}`);
        }

        // Look for phase descriptions
        console.log('\n   Phases de migration trovées:');
        const phases = ['phase1', 'phase2', 'phase3', 'phase4'];
        for (const phase of phases) {
          if (pageContent.toLowerCase().includes(phase)) {
            console.log(`     ✓ ${phase.toUpperCase()}`);
          }
        }

      } else {
        console.log('   ✗ Bouton de conversion non trouvé\n');
      }
    } else {
      console.log('   ✗ Aucune zone de texte trouvée\n');
      console.log('   Liste des éléments disponibles:');
      const inputs = await page.$$('input, textarea, select');
      inputs.forEach((input, i) => {
        console.log(`     ${i + 1}. ${await input.getAttribute('type') || 'unknown'}`);
      });
    }

    // Check for errors
    console.log('\n9. Vérification des erreurs...\n');
    const errors = consoleMessages.filter(m => m.type === 'error');
    if (errors.length > 0) {
      console.log(`   ⚠️ ${errors.length} erreur(s):`);
      errors.forEach((e, i) => {
        console.log(`      ${i + 1}. ${e.text.substring(0, 100)}`);
      });
    } else {
      console.log('   ✓ Aucune erreur critique');
    }

    // Summary
    console.log('\n=== RÉSUMÉ ===');
    console.log(`Page actuelle: ${page.url()}`);
    console.log(`Erreurs: ${errors.length}`);
    
    if (page.url().includes('/result') || page.url().includes('/analysis')) {
      console.log('\n✅ La conversion semble avoir réussi!');
      console.log('Vérifiez la page pour voir les détails de:');
      console.log('  - Readiness Score (0-100%)');
      console.log('  - Critical Paths');
      console.log('  - Shadow Testing Plan');
      console.log('  - Execution Phases');
      console.log('  - Success Criteria');
    } else {
      console.log('\n⚠️ La page de résultats n\'a pas été atteinte.');
      console.log('Vérifiez manuellement l\'interface.');
    }

  } catch (error) {
    console.error('\n❌ Erreur de test:', error.message);
  } finally {
    await browser.close();
    console.log('\n=== TEST TERMINÉ ===');
  }
})();
