import { parseCobol } from './lib/cobol-antlr-parser.js';
import { transpileCobol } from './lib/cobol-transpiler.js';

const cobol = `       IDENTIFICATION DIVISION.
       PROGRAM-ID. TEST.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 ACCT-STATUS PIC X(1).
       PROCEDURE DIVISION.
       TEST-PARA.
           IF ACCT-STATUS NOT = 'A'
              DISPLAY 'ERROR'.
           STOP RUN.`;

try {
  const ast = parseCobol(cobol);
  const result = transpileCobol(ast, cobol);
  
  // Check for the bug
  if (result.pythonCode.includes("'self.")) {
    console.log("❌ BUG FOUND: 'self.x' pattern detected");
    const matches = result.pythonCode.match(/.*'self\..*/g);
    matches?.forEach(m => console.log("  ", m.trim()));
  } else {
    console.log("✅ No 'self.x' bug found");
  }
  
  // Show the generated if condition
  const ifLines = result.pythonCode.split('\n').filter(l => l.includes('if self.acct_status'));
  console.log("\nGenerated IF condition:");
  ifLines.forEach(l => console.log("  ", l));
} catch (e) {
  console.error("Error:", e.message);
}
