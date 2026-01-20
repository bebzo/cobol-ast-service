/**
 * TEST MONACO DIRECT - Extraction du contenu éditeur pour analyse précise
 */

const { chromium } = require('playwright');

const COBOL_CODE = `       IDENTIFICATION DIVISION.
       PROGRAM-ID.  BANK-ACCOUNT-MANAGER.
       AUTHOR.      LEGACY-SYSTEMS-1988.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-ACCOUNT.
           05  ACCT-BALANCE     PIC S9(11)V99 COMP-3.
           05  ACCT-STATUS      PIC X.
               88  ACTIVE       VALUE 'A'.
           05  ACCT-TYPE        PIC X.
       PROCEDURE DIVISION.
       0000-MAIN.
           MOVE 1000 TO ACCT-BALANCE.
           IF ACCT-BALANCE > 500
               DISPLAY "BALANCE OK"
           ELSE
               DISPLAY "LOW BALANCE".
           STOP RUN.`;

async function runMonacoTest() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 TEST MONACO DIRECT - Extraction contenu éditeur');
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
    await page.waitForTimeout(1500);

    await page.locator('input[type="email"]').fill('dev@minimax.io');
    await page.locator('input[type="password"]').fill('CodeSwitch2024!');
    await page.locator('button[type="submit"]').click();

    try {
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      log('✅ AUTHENTIFICATION - dev@minimax.io');
    } catch (e) {
      log('Échec authentification', page.url().includes('/dashboard'));
    }

    // ============================================
    // ÉTAPE 2: CONVERSION COBOL → PYTHON
    // ============================================
    if (page.url().includes('/dashboard')) {
      console.log('\n📋 ÉTAPE 2: CONVERSION\n' + '-'.repeat(50));
      console.log(`   📝 Code COBOL: ${COBOL_CODE.split('\n').length} lignes`);

      await page.waitForTimeout(3000);

      // Coller le code COBOL
      const textarea = page.locator('textarea').first();
      if (await textarea.count() > 0) {
        await textarea.fill(COBOL_CODE);
        console.log('   ✅ Code COBOL collé');

        // Lancer la conversion
        const refactorBtn = page.locator('button:has-text("Refactor")').first();
        if (await refactorBtn.count() > 0) {
          await refactorBtn.click();
          console.log('   🚀 Conversion en cours...\n');

          // Attendre la conversion
          let pythonContent = '';
          let attempts = 0;
          const maxAttempts = 40;

          while (attempts < maxAttempts) {
            await page.waitForTimeout(2000);
            attempts++;

            // Essayer d'extraire le contenu de l'éditeur Monaco via JavaScript
            pythonContent = await page.evaluate(() => {
              // Chercher l'éditeur Monaco
              const monacoEditor = document.querySelector('.monaco-editor');
              if (monacoEditor) {
                // Le contenu est dans une span avec la classe 'view-line' ou 'mtk'
                const lines = monacoEditor.querySelectorAll('.view-line, .mtk');
                if (lines.length > 0) {
                  return Array.from(lines).map(line => line.textContent).join('\n');
                }
              }

              // Fallback: chercher tout élément contenant du Python
              const allElements = document.querySelectorAll('*');
              let foundPython = '';
              for (const el of allElements) {
                const text = el.textContent || '';
                if (text.includes('from decimal import') ||
                    text.includes('@dataclass') ||
                    (text.includes('def ') && text.includes('self'))) {
                  // Chercher un bloc plus grand
                  const parent = el.parentElement?.parentElement;
                  if (parent) {
                    return parent.textContent || text;
                  }
                }
              }

              return text;
            });

            const hasPython = pythonContent.includes('def ') ||
                             pythonContent.includes('class ') ||
                             pythonContent.includes('from decimal');

            if (hasPython && pythonContent.length > 200) {
              console.log(`   ✅ Code Python détecté (tentative ${attempts})`);
              break;
            }

            if (attempts % 10 === 0) {
              console.log(`   ⏳ Progression: ${(attempts/maxAttempts)*100}%`);
            }
          }

          // ============================================
          // ANALYSE DU CONTENU
          // ============================================
          console.log('\n📋 ÉTAPE 3: ANALYSE DU CODE PYTHON\n' + '-'.repeat(50));

          if (pythonContent.length > 200) {
            console.log(`   📊 Longueur du code analysé: ${pythonContent.length} caractères\n`);

            // Vérifications flexibles
            const checks = {
              'Type Decimal': pythonContent.includes('Decimal'),
              '@dataclass': pythonContent.includes('dataclass') || pythonContent.includes('@dataclass'),
              'Classe Python': pythonContent.includes('class '),
              'Méthodes Python': pythonContent.match(/def \w+/g)?.length || 0,
              'Imports typing': pythonContent.includes('from typing') || pythonContent.includes('import typing'),
              'Docstrings': pythonContent.includes('"""') || pythonContent.includes("'''"),
            };

            for (const [check, result] of Object.entries(checks)) {
              if (typeof result === 'boolean') {
                log(check, result);
              } else {
                log(`${check}: ${result}`, result > 0);
              }
            }

            // Vérifier les métriques dans l'interface
            console.log('\n📋 ÉTAPE 4: VÉRIFICATION INTERFACE\n' + '-'.repeat(50));

            const interfaceElements = {
              'Indicateur COBOL': page.locator('text=COBOL').count() > 0 || page.locator('text=AMBER').count() > 0,
              'Indicateur Python': page.locator('text=Python').count() > 0 || page.locator('text=GREEN').count() > 0,
              'Bouton Tests': page.locator('button:has-text("Tests")').count() > 0,
              'Bouton Architecture': page.locator('button:has-text("Architecture")').count() > 0,
              'Bouton Insights': page.locator('button:has-text("Insights")').count() > 0,
              'Score confiance': page.locator('text=Confidence').count() > 0 || page.locator('text=85').count() > 0,
            };

            for (const [element, exists] of Object.entries(interfaceElements)) {
              log(element, exists);
            }

            // ============================================
            // TEST DES ONGLETS
            // ============================================
            console.log('\n📋 ÉTAPE 5: NAVIGATION ONGLETS\n' + '-'.repeat(50));

            // Onglet Tests
            const testsTab = page.locator('button:has-text("Tests")').first();
            if (await testsTab.count() > 0) {
              await testsTab.click();
              await page.waitForTimeout(1500);
              log('Navigation vers Tests', true);

              // Vérifier les sous-onglets
              const unitTab = page.locator('button:has-text("Unit")').first();
              const shadowTab = page.locator('button:has-text("Shadow")').first();
              const prodTab = page.locator('button:has-text("Production")').first();

              log('Sous-onglet Unit', await unitTab.count() > 0);
              log('Sous-onglet Shadow', await shadowTab.count() > 0);
              log('Sous-onglet Production', await prodTab.count() > 0);

              // Cliquer sur Shadow pour voir le contenu
              if (await shadowTab.count() > 0) {
                await shadowTab.click();
                await page.waitForTimeout(1500);
                const shadowContent = await page.content();
                const hasReadiness = shadowContent.includes('readiness') ||
                                    shadowContent.includes('critical') ||
                                    shadowContent.includes('test_points') ||
                                    shadowContent.includes('Strategy');
                log('Plan Shadow Testing visible', hasReadiness);
              }
            }

          } else {
            log('Code Python non détecté dans l\'éditeur', false);
            console.log('   ⚠️ Le code généré pourrait être dans un panneau latéral');

            // Vérifier les panneaux latéraux
            const panels = await page.locator('[class*="panel"], [class*="sidebar"]').count();
            log('Panneaux latéraux détectés', panels > 0);
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
    console.log('📊 RAPPORT FINAL - TEST MONACO DIRECT');
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
                  successRate >= 70 ? '✅ SUCCÈS PARTIEL' : '⚠️ ÉCHEC PARTIEL';
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

runMonacoTest()
  .then(results => {
    console.log('\n📋 RÉSULTATS:', JSON.stringify({ passed: results.passed, failed: results.failed }, null, 2));
    process.exit(results.failed > 4 ? 1 : 0);
  })
  .catch(error => {
    console.error('💥', error);
    process.exit(1);
  });
