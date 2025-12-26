// Test de Performance Gemini - CodeSwitch
import { GoogleGenerativeAI } from "@google/generative-ai";

const SAMPLE_COBOL = `       IDENTIFICATION DIVISION.
       PROGRAM-ID.  PAYROLL01.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  EMP-HOURLY-RATE         PIC S9(5)V99 COMP-3.
       01  WS-TAX-BRACKETS-1995.
           05  WS-BRACKET-1-LIMIT  PIC 9(7) VALUE 23350.
           05  WS-RATE-BRACKET-1   PIC V999 VALUE .150.
       PROCEDURE DIVISION.
       0000-MAIN.
           COMPUTE WS-GROSS-PAY = EMP-HOURLY-RATE * 40.
           STOP RUN.`;

const PROMPT = `Analyse ce code COBOL et retourne un JSON avec: summary, python_code (court), issues (array).
Code: ${SAMPLE_COBOL}`;

async function testPerformance(apiKey) {
  console.log("🚀 Test de Performance Gemini\n");
  console.log("=" .repeat(50));
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  // Test 1: Temps de réponse simple
  console.log("\n📊 Test 1: Analyse COBOL simple");
  const start1 = Date.now();
  
  try {
    const result = await model.generateContent(PROMPT);
    const time1 = Date.now() - start1;
    const response = result.response.text();
    
    console.log(`   ✅ Temps: ${time1}ms (${(time1/1000).toFixed(2)}s)`);
    console.log(`   📝 Longueur réponse: ${response.length} caractères`);
    
    // Évaluation
    if (time1 < 3000) {
      console.log("   🟢 EXCELLENT - Parfait pour la démo");
    } else if (time1 < 6000) {
      console.log("   🟡 BON - Acceptable pour la démo");
    } else {
      console.log("   🔴 LENT - Risque pour la démo vidéo");
    }
    
    return { success: true, time: time1, responseLength: response.length };
    
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Vérifier si une clé API est fournie
const apiKey = process.argv[2];
if (!apiKey) {
  console.log("Usage: node perf-test.mjs <GEMINI_API_KEY>");
  console.log("\nPour obtenir une clé: https://aistudio.google.com/apikey");
  process.exit(1);
}

testPerformance(apiKey).then(result => {
  console.log("\n" + "=".repeat(50));
  console.log("📈 Résumé:", JSON.stringify(result, null, 2));
});
