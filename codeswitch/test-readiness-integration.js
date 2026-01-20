/**
 * Test d'Intégration Production Readiness - API & Supabase
 * 
 * Ce test vérifie :
 * 1. L'API /api/readiness-analysis fonctionne correctement
 * 2. L'intégration Supabase lit et écrit des données réelles
 * 3. Les données historiques sont correctement récupérées
 */

const { chromium } = require('playwright');

async function runIntegrationTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const testResults = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  const log = (message, isError = false) => {
    const timestamp = new Date().toISOString();
    const status = isError ? '❌ FAIL' : '✅ PASS';
    console.log(`[${timestamp}] ${status}: ${message}`);
    if (isError) {
      testResults.errors.push(message);
      testResults.failed++;
    } else {
      testResults.passed++;
    }
  };
  
  try {
    log('='.repeat(60));
    log('TEST D\'INTÉGRATION PRODUCTION READINESS');
    log('='.repeat(60));
    
    // Test 1: Vérifier que l'API répond avec le bon format
    log('Test 1: Vérification de l\'API /api/readiness-analysis');
    
    const apiResponse = await page.evaluate(async () => {
      const response = await fetch('http://localhost:3001/api/readiness-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: `def calculate_total(items: list) -> float:
    """Calculate total price with tax"""
    total = 0.0
    for item in items:
        total += item['price'] * item['quantity']
    return total * 1.08

def test_calculate_total():
    """Test function for coverage"""
    items = [{'price': 10.0, 'quantity': 2}]
    result = calculate_total(items)
    assert result == 21.6

class TaxCalculator:
    """Tax calculator using dataclass"""
    def __init__(self, rate: float):
        self.rate = rate
    
    def calculate(self, amount: float) -> float:
        return amount * self.rate`,
          targetPath: ''
        })
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json()
      };
    });
    
    if (apiResponse.ok && apiResponse.data.score !== undefined) {
      log(`API répond correctement - Score: ${apiResponse.data.score}, Grade: ${apiResponse.data.grade}`);
      testResults.passed++;
    } else {
      log(`Échec API: ${JSON.stringify(apiResponse)}`, true);
    }
    
    // Test 2: Vérifier que les données Supabase sont présentes
    log('Test 2: Vérification des données historiques Supabase');
    
    if (apiResponse.data.historical_scores && apiResponse.data.historical_scores.length > 0) {
      log(`Données historiques trouvées: ${apiResponse.data.historical_scores.length} entrées`);
      log(`  - Dernière analyse: Score ${apiResponse.data.historical_scores[0].score}, Grade ${apiResponse.data.historical_scores[0].grade}`);
      testResults.passed++;
    } else {
      log('Aucune donnée historique trouvée', true);
    }
    
    // Test 3: Vérifier que le mode est "live_analysis"
    log('Test 3: Vérification du mode d\'analyse');
    
    if (apiResponse.data.mode === 'live_analysis') {
      log('Mode live_analysis confirmé - analyse réelle via Python');
      testResults.passed++;
    } else {
      log(`Mode inattendu: ${apiResponse.data.mode}`, true);
    }
    
    // Test 4: Vérifier les métriques calculées
    log('Test 4: Vérification des métriques');
    
    const metrics = apiResponse.data.metrics;
    if (metrics && metrics.functions > 0) {
      log(`Métriques: ${metrics.functions} fonctions, ${metrics.classes} classes, ${metrics.test_functions} tests`);
      log(`  - Type coverage: ${metrics.type_annotated}/${metrics.functions} (${metrics.functions > 0 ? Math.round((metrics.type_annotated / metrics.functions) * 100) : 0}%)`);
      log(`  - Error handling: ${metrics.error_handled}/${metrics.functions} (${metrics.functions > 0 ? Math.round((metrics.error_handled / metrics.functions) * 100) : 0}%)`);
      testResults.passed++;
    } else {
      log('Métriques non calculées correctement', true);
    }
    
    // Test 5: Vérifier les issues et recommandations
    log('Test 5: Vérification des issues et recommandations');
    
    if (Array.isArray(apiResponse.data.issues) && Array.isArray(apiResponse.data.recommendations)) {
      log(`Issues: ${apiResponse.data.issues.length} trouvées`);
      log(`Recommandations: ${apiResponse.data.recommendations.length} générées`);
      testResults.passed++;
    } else {
      log('Format des issues/recommandations incorrect', true);
    }
    
    // Test 6: Vérifier l'ID d'analyse stocké
    log('Test 6: Vérification du stockage Supabase');
    
    if (apiResponse.data.id) {
      log(`Analyse stockée avec ID: ${apiResponse.data.id.substring(0, 8)}...`);
      testResults.passed++;
    } else {
      log('ID d\'analyse manquant', true);
    }
    
    // Test 7: Vérifier le statut production_ready
    log('Test 7: Vérification du statut Production Ready');
    
    if (typeof apiResponse.data.production_ready === 'boolean') {
      const status = apiResponse.data.production_ready ? 'Production Ready' : 'Needs Improvements';
      log(`Statut: ${status} (score ${apiResponse.data.score} >= 75)`);
      testResults.passed++;
    } else {
      log('Statut production_ready manquant ou incorrect', true);
    }
    
    // Test 8: Test avec code problématique pour vérifier la détection d'issues
    log('Test 8: Détection d\'issues de sécurité');
    
    const securityTest = await page.evaluate(async () => {
      const response = await fetch('http://localhost:3001/api/readiness-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: `def process_data(user_input):
    # Security issue: using eval with user input
    result = eval(user_input)
    return result

# Another issue: hardcoded secret
api_key = "sk-1234567890abcdef"
    
password = "secret123"`,
          targetPath: ''
        })
      });
      return await response.json();
    });
    
    const securityIssues = securityTest.issues?.filter(i => 
      i.severity === 'HIGH' || i.severity === 'CRITICAL'
    ) || [];
    
    if (securityIssues.length > 0) {
      log(`Détection de ${securityIssues.length} issue(s) de sécurité`);
      securityIssues.forEach(issue => {
        log(`  - [${issue.severity}] ${issue.message}`);
      });
      testResults.passed++;
    } else {
      log('Aucune issue de sécurité détectée (attendu: eval + secrets codés)', true);
    }
    
    // Résumé
    log('='.repeat(60));
    log('RÉSUMÉ DES TESTS');
    log('='.repeat(60));
    log(`Tests réussis: ${testResults.passed}`);
    log(`Tests échoués: ${testResults.failed}`);
    
    if (testResults.errors.length > 0) {
      log('Erreurs:');
      testResults.errors.forEach((err, i) => {
        log(`  ${i + 1}. ${err.substring(0, 150)}`, true);
      });
    }
    
    const status = testResults.failed === 0 ? '✅ SUCCÈS' : '⚠️ PARTIEL';
    log(`Statut global: ${status}`);
    log('='.repeat(60));
    
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
    log('Test terminé - Navigateur fermé');
  }
}

// Exécuter le test
runIntegrationTest()
  .then(results => {
    console.log('\n' + '='.repeat(60));
    console.log('RÉSULTATS FINAUX');
    console.log('='.repeat(60));
    console.log(JSON.stringify(results, null, 2));
    
    const exitCode = results.failed > 0 ? 1 : 0;
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Échec du test:', error);
    process.exit(1);
  });
