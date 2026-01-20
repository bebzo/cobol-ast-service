/**
 * Test d'Intégration Production Readiness - Version Node.js Native
 * 
 * Ce test vérifie l'API et l'intégration Supabase directement depuis Node.js
 */

const API_URL = 'http://localhost:3001/api/readiness-analysis';

async function runTest() {
  console.log('='.repeat(60));
  console.log('TEST PRODUCTION READINESS - API & SUPABASE');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: API principale
  console.log('\n📋 Test 1: Analyse de code Python');
  try {
    const response = await fetch(API_URL, {
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
    
    const data = await response.json();
    
    if (data.score !== undefined && data.grade) {
      console.log(`  ✅ Score: ${data.score}/100 (Grade: ${data.grade})`);
      console.log(`  ✅ Métriques: ${data.metrics?.functions} fonctions, ${data.metrics?.classes} classes, ${data.metrics?.test_functions} tests`);
      console.log(`  ✅ Issues: ${data.issues?.length} | Recommandations: ${data.recommendations?.length}`);
      passed++;
    } else {
      console.log(`  ❌ Format de réponse incorrect`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ Erreur: ${error.message}`);
    failed++;
  }
  
  // Test 2: Données historiques Supabase
  console.log('\n📋 Test 2: Données historiques Supabase');
  try {
    const response = await fetch(API_URL + '?limit=5');
    const data = await response.json();
    
    if (data.historical_scores && data.historical_scores.length > 0) {
      console.log(`  ✅ ${data.historical_scores.length} analyses historiques trouvées`);
      data.historical_scores.slice(0, 3).forEach((h, i) => {
        console.log(`     ${i+1}. Score ${h.score}/100 (Grade: ${h.grade}) - ${new Date(h.timestamp).toLocaleString()}`);
      });
      passed++;
    } else {
      console.log(`  ⚠️ Aucune donnée historique (table vide ou erreur)`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ Erreur: ${error.message}`);
    failed++;
  }
  
  // Test 3: Détection de sécurité
  console.log('\n📋 Test 3: Détection d\'issues de sécurité');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: `def process_data(user_input):
    result = eval(user_input)  # DANGEROUS!
    return result

api_key = "sk-1234567890abcdef"  # Secret codé!`,
        targetPath: ''
      })
    });
    
    const data = await response.json();
    const securityIssues = data.issues?.filter(i => 
      i.severity === 'HIGH' || i.severity === 'CRITICAL'
    ) || [];
    
    if (securityIssues.length > 0) {
      console.log(`  ✅ ${securityIssues.length} issue(s) de sécurité détectée(s):`);
      securityIssues.forEach(issue => {
        console.log(`     [${issue.severity}] ${issue.message}`);
      });
      passed++;
    } else {
      console.log(`  ⚠️ Aucune issue critique détectée`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ Erreur: ${error.message}`);
    failed++;
  }
  
  // Test 4: Vérification du stockage Supabase
  console.log('\n📋 Test 4: Stockage Supabase');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: `def hello():
    return "Hello World"`,
        targetPath: ''
      })
    });
    
    const data = await response.json();
    
    if (data.id) {
      console.log(`  ✅ Analyse stockée avec ID: ${data.id}`);
      console.log(`  ✅ Mode: ${data.mode}`);
      passed++;
    } else {
      console.log(`  ❌ ID d'analyse manquant`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ Erreur: ${error.message}`);
    failed++;
  }
  
  // Test 5: Score et Grade
  console.log('\n📋 Test 5: Score et Grade');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: `def process_data(data):
    return data`,
        targetPath: ''
      })
    });
    
    const data = await response.json();
    
    if (data.score !== undefined && data.grade) {
      const status = data.production_ready === true ? '✅ Production Ready' : '⚠️ Needs Improvements';
      console.log(`  ✅ Score: ${data.score}/100 (Grade: ${data.grade})`);
      console.log(`  ${status} (Score >= 75 requis)`);
      passed++;
    } else {
      console.log(`  ❌ Score ou grade manquant`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ Erreur: ${error.message}`);
    failed++;
  }
  
  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log('RÉSUMÉ');
  console.log('='.repeat(60));
  console.log(`✅ Tests réussis: ${passed}`);
  console.log(`❌ Tests échoués: ${failed}`);
  
  const total = passed + failed;
  const successRate = Math.round((passed / total) * 100);
  
  if (failed === 0) {
    console.log(`\n🎉 SUCCÈS COMPLET (100%) - Toutes les fonctionnalités sont opérationnelles!`);
  } else if (passed >= total * 0.8) {
    console.log(`\n⚠️ SUCCÈS PARTIEL (${successRate}%) - Quelques problèmes mineurs`);
  } else {
    console.log(`\n❌ ÉCHEC - Problèmes à corriger`);
  }
  
  console.log('='.repeat(60));
  
  return { passed, failed, successRate };
}

// Exécuter le test
runTest()
  .then(result => process.exit(result.failed > 0 ? 1 : 0))
  .catch(error => {
    console.error('Erreur critique:', error);
    process.exit(1);
  });
