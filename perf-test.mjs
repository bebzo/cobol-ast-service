// Test de Performance Gemini API - Direct fetch
const API_KEY = process.argv[2];
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;

const COBOL = `IDENTIFICATION DIVISION. PROGRAM-ID. PAYROLL01. DATA DIVISION. 01 EMP-RATE PIC S9(5)V99 COMP-3. PROCEDURE DIVISION. COMPUTE WS-PAY = EMP-RATE * 40. STOP RUN.`;

async function test() {
  console.log("🚀 Test Performance Gemini 2.0 Flash\n" + "=".repeat(40));
  
  const start = Date.now();
  
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Analyse ce COBOL, retourne JSON {summary, python_code}: ${COBOL}` }] }]
    })
  });
  
  const time = Date.now() - start;
  const data = await res.json();
  
  if (data.error) {
    console.log(`❌ Erreur: ${data.error.message}`);
    return;
  }
  
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  console.log(`\n⏱️  Temps de réponse: ${time}ms (${(time/1000).toFixed(2)}s)`);
  console.log(`📝 Longueur: ${text.length} caractères`);
  
  if (time < 3000) console.log("🟢 EXCELLENT - Parfait pour la démo vidéo");
  else if (time < 6000) console.log("🟡 BON - Acceptable");
  else console.log("🔴 LENT - Prévoir loading");
  
  console.log("\n📄 Aperçu réponse:\n" + text.substring(0, 300) + "...");
}

if (!API_KEY) { console.log("Usage: node perf-test.mjs <API_KEY>"); process.exit(1); }
test();
