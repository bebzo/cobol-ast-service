/**
 * TEST DIAGNOSTIC - Structure du DOM et extraction Python
 */

const { chromium } = require('playwright');

async function runDiagnostic() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 TEST DIAGNOSTIC - Structure DOM CodeSwitch');
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Authentification
    console.log('\n📋 AUTHENTIFICATION\n' + '-'.repeat(50));

    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    await page.locator('input[type="email"]').fill('dev@minimax.io');
    await page.locator('input[type="password"]').fill('CodeSwitch2024!');
    await page.locator('button[type="submit"]').click();

    try {
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      console.log('✅ Authentifié: dev@minimax.io\n');
    } catch (e) {
      console.log('❌ Échec auth\n');
    }

    // Attendre le chargement du dashboard
    await page.waitForTimeout(3000);

    // ============================================
    // ANALYSE DE LA STRUCTURE DOM
    // ============================================
    console.log('📋 ANALYSE STRUCTURE DOM\n' + '-'.repeat(50));

    const domAnalysis = await page.evaluate(() => {
      const results = {
        editors: [],
        textareas: [],
        preElements: [],
        codeElements: [],
        monacoCount: 0,
        panels: [],
        buttons: []
      };

      // Compter les éditeurs Monaco
      const monacoEditors = document.querySelectorAll('.monaco-editor');
      results.monacoCount = monacoEditors.length;
      console.log(`   🔍 Éditeurs Monaco trouvés: ${results.monacoCount}`);

      // Analyser chaque éditeur Monaco
      monacoEditors.forEach((editor, i) => {
        const lines = editor.querySelectorAll('.view-line');
        const text = Array.from(lines).map(l => l.textContent).join('\n').substring(0, 500);
        results.editors.push({
          index: i,
          linesCount: lines.length,
          preview: text.substring(0, 100)
        });
      });

      // Textareas
      const textareas = document.querySelectorAll('textarea');
      results.textareas = Array.from(textareas).map(t => ({
        visible: t.offsetParent !== null,
        length: t.value?.length || 0
      }));

      // Boutons
      const buttons = document.querySelectorAll('button');
      results.buttons = Array.from(buttons)
        .filter(b => b.offsetParent !== null)
        .map(b => b.textContent?.trim())
        .filter(t => t);

      return results;
    });

    console.log(`\n📊 Structure DOM:`);
    console.log(`   • Éditeurs Monaco: ${domAnalysis.monacoCount}`);
    console.log(`   • Textareas visibles: ${domAnalysis.textareas.filter(t => t.visible).length}`);

    console.log(`\n📝 Boutons visibles (${domAnalysis.buttons.length}):`);
    domAnalysis.buttons.slice(0, 10).forEach(btn => console.log(`   • ${btn}`));

    // ============================================
    // EXTRAIRE LE CONTENU PYTHON
    // ============================================
    console.log('\n📋 EXTRACTION CONTENU\n' + '-'.repeat(50));

    const pythonContent = await page.evaluate(() => {
      // Méthode 1: Chercher le contenu Python dans Monaco
      const monacoEditors = document.querySelectorAll('.monaco-editor');
      let pythonCode = '';

      monacoEditors.forEach((editor, i) => {
        const lines = editor.querySelectorAll('.view-line');
        const text = Array.from(lines).map(l => l.textContent).join('\n');

        // Détecter si c'est du Python (contient des mots-clés Python)
        const isPython = text.includes('def ') ||
                        text.includes('class ') ||
                        text.includes('import ') ||
                        text.includes('from ');

        if (isPython && text.length > 100) {
          pythonCode = text;
          console.log(`   ✅ Éditeur ${i}: Python détecté (${text.length} caractères)`);
        } else if (text.includes('IDENTIFICATION') || text.includes('PROCEDURE DIVISION')) {
          console.log(`   📝 Éditeur ${i}: COBOL (${text.length} caractères)`);
        }
      });

      // Méthode 2: Si pas trouvé, chercher dans les panneaux
      if (!pythonCode) {
        const panels = document.querySelectorAll('[class*="panel"], [class*="result"], [class*="output"]');
        panels.forEach((panel, i) => {
          const text = panel.textContent || '';
          if (text.includes('def ') || text.includes('class ')) {
            pythonCode = text;
            console.log(`   ✅ Panneau ${i}: Python trouvé (${text.length} caractères)`);
          }
        });
      }

      return pythonCode;
    });

    console.log(`\n📊 Code Python trouvé: ${pythonContent.length > 0 ? `${pythonContent.length} caractères ✅` : '0 caractères ❌'}`);

    if (pythonContent.length > 100) {
      console.log('\n📋 ANALYSE CODE PYTHON\n' + '-'.repeat(50));

      const analysis = {
        hasDecimal: pythonContent.includes('Decimal'),
        hasDataclass: pythonContent.includes('@dataclass') || pythonContent.includes('dataclass'),
        hasClass: pythonContent.includes('class '),
        hasMethods: (pythonContent.match(/def \w+/g) || []).length,
        hasTyping: pythonContent.includes('from typing') || pythonContent.includes('import typing'),
        hasDocstrings: pythonContent.includes('"""') || pythonContent.includes("'''"),
        hasTests: pythonContent.includes('def test_'),
        hasConfig: pythonContent.includes('load') || pythonContent.includes('Config'),
        hasAudit: pythonContent.includes('audit') || pythonContent.includes('Audit'),
      };

      console.log('   🔍 Fonctionnalités détectées:');
      console.log(`   • Type Decimal: ${analysis.hasDecimal ? '✅' : '❌'}`);
      console.log(`   • @dataclass: ${analysis.hasDataclass ? '✅' : '❌'}`);
      console.log(`   • Classes: ${analysis.hasClass ? '✅' : '❌'} (${pythonContent.match(/class \w+/g)?.length || 0})`);
      console.log(`   • Méthodes: ${analysis.hasMethods > 0 ? '✅' : '❌'} (${analysis.hasMethods})`);
      console.log(`   • Imports typing: ${analysis.hasTyping ? '✅' : '❌'}`);
      console.log(`   • Docstrings: ${analysis.hasDocstrings ? '✅' : '❌'}`);
      console.log(`   • Tests unitaires: ${analysis.hasTests ? '✅' : '❌'}`);
      console.log(`   • Configuration: ${analysis.hasConfig ? '✅' : '❌'}`);
      console.log(`   • Audit/Logging: ${analysis.hasAudit ? '✅' : '❌'}`);

      // Compter les lignes et fonctions
      const lineCount = pythonContent.split('\n').length;
      console.log(`\n   📊 Statistiques:`);
      console.log(`   • Lignes de code: ${lineCount}`);

      // Afficher un extrait du code
      console.log('\n📝 Extrait du code généré:');
      console.log('─'.repeat(50));
      const lines = pythonContent.split('\n').slice(0, 15);
      lines.forEach(line => console.log(line));
      console.log('─'.repeat(50));
    } else {
      console.log('\n⚠️ Code Python non trouvé dans la page');
    }

    // ============================================
    // VÉRIFICATION DES ONGLETS
    // ============================================
    console.log('\n📋 VÉRIFICATION ONGLETS\n' + '-'.repeat(50));

    const tabs = ['Tests', 'Architecture', 'Insights', 'Compliance', 'Shadow', 'Production'];

    for (const tab of tabs) {
      const tabBtn = page.locator(`button:has-text("${tab}")`).first();
      const exists = await tabBtn.count() > 0;
      console.log(`   ${exists ? '✅' : '❌'} Onglet "${tab}": ${exists ? 'présent' : 'non trouvé'}`);

      if (exists) {
        await tabBtn.click();
        await page.waitForTimeout(1000);

        // Vérifier le contenu de l'onglet
        const content = await page.content();
        const hasContent = content.length > 5000;
        console.log(`      Contenu chargé: ${hasContent ? '✅' : '⚠️'}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('🏁 TEST DIAGNOSTIC TERMINÉ');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n💥 Erreur:', error.message);
  } finally {
    await browser.close();
    console.log('\n🔒 Navigateur fermé');
  }
}

runDiagnostic();
