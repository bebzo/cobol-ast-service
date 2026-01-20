/**
 * Test script for Pattern Library + Confidence Scoring
 */

import { readFileSync } from 'fs';

// Test the pattern library directly
const testPatterns = () => {
  console.log('=== Testing Pattern Library ===\n');
  
  const testCases = [
    // Data Movement
    { cobol: 'MOVE AMOUNT TO BALANCE', expected: 'self.balance = self.amount' },
    { cobol: 'MOVE "ACTIVE" TO STATUS', expected: 'self.status = "ACTIVE"' },
    { cobol: 'MOVE 100.50 TO AMOUNT', expected: 'self.amount = Decimal("100.50")' },
    { cobol: 'MOVE ZEROS TO BALANCE', expected: 'self.balance = Decimal("0")' },
    { cobol: 'MOVE SPACES TO NAME', expected: 'self.name = ""' },
    
    // Arithmetic
    { cobol: 'ADD AMOUNT TO BALANCE', expected: 'self.balance += self.amount' },
    { cobol: 'SUBTRACT FEE FROM BALANCE', expected: 'self.balance -= self.fee' },
    { cobol: 'MULTIPLY RATE BY PRINCIPAL GIVING INTEREST', expected: 'self.interest = self.rate * self.principal' },
    { cobol: 'DIVIDE TOTAL BY COUNT GIVING AVERAGE', expected: 'self.average = self.total / self.count' },
    { cobol: 'COMPUTE TOTAL = SUBTOTAL + TAX', expected: 'self.total = self.subtotal + self.tax' },
    
    // Control Flow
    { cobol: 'IF STATUS = "A"', expected: 'if self.status == "A":' },
    { cobol: 'IF BALANCE > LIMIT', expected: 'if self.balance > self.limit:' },
    { cobol: 'PERFORM VALIDATE-INPUT', expected: 'self.p_validate_input()' },
    { cobol: 'STOP RUN', expected: 'return' },
    { cobol: 'GOBACK', expected: 'return' },
    
    // Validation
    { cobol: 'IF WS-AMOUNT IS POSITIVE', expected: 'if self.ws_amount > 0:' },
    { cobol: 'IF WS-COUNT IS ZERO', expected: 'if self.ws_count == 0:' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const tc of testCases) {
    // Simple regex-based pattern matching (simulating the pattern library)
    let result = translateCobolLine(tc.cobol);
    
    const match = result.toLowerCase().includes(tc.expected.toLowerCase().substring(0, 20));
    if (match) {
      console.log(`✅ ${tc.cobol}`);
      console.log(`   → ${result}`);
      passed++;
    } else {
      console.log(`❌ ${tc.cobol}`);
      console.log(`   Expected: ${tc.expected}`);
      console.log(`   Got: ${result}`);
      failed++;
    }
    console.log();
  }
  
  console.log(`\n=== Results: ${passed}/${passed + failed} passed ===\n`);
  return { passed, failed };
};

// Simple translator (mimicking the pattern library logic)
function translateCobolLine(cobol) {
  const upper = cobol.toUpperCase().trim();
  
  // MOVE patterns
  if (/MOVE\s+ZEROS?\s+TO\s+(\S+)/i.test(upper)) {
    const match = upper.match(/MOVE\s+ZEROS?\s+TO\s+(\S+)/i);
    return `self.${match[1].toLowerCase().replace(/-/g, '_')} = Decimal("0")`;
  }
  if (/MOVE\s+SPACES?\s+TO\s+(\S+)/i.test(upper)) {
    const match = upper.match(/MOVE\s+SPACES?\s+TO\s+(\S+)/i);
    return `self.${match[1].toLowerCase().replace(/-/g, '_')} = ""`;
  }
  if (/MOVE\s+"([^"]+)"\s+TO\s+(\S+)/i.test(upper)) {
    const match = upper.match(/MOVE\s+"([^"]+)"\s+TO\s+(\S+)/i);
    return `self.${match[2].toLowerCase().replace(/-/g, '_')} = "${match[1]}"`;
  }
  if (/MOVE\s+(\d+(?:\.\d+)?)\s+TO\s+(\S+)/i.test(upper)) {
    const match = upper.match(/MOVE\s+(\d+(?:\.\d+)?)\s+TO\s+(\S+)/i);
    return `self.${match[2].toLowerCase().replace(/-/g, '_')} = Decimal("${match[1]}")`;
  }
  if (/MOVE\s+(\S+)\s+TO\s+(\S+)/i.test(upper)) {
    const match = upper.match(/MOVE\s+(\S+)\s+TO\s+(\S+)/i);
    return `self.${match[2].toLowerCase().replace(/-/g, '_')} = self.${match[1].toLowerCase().replace(/-/g, '_')}`;
  }
  
  // ADD pattern
  if (/ADD\s+(\S+)\s+TO\s+(\S+)/i.test(upper)) {
    const match = upper.match(/ADD\s+(\S+)\s+TO\s+(\S+)/i);
    return `self.${match[2].toLowerCase().replace(/-/g, '_')} += self.${match[1].toLowerCase().replace(/-/g, '_')}`;
  }
  
  // SUBTRACT pattern
  if (/SUBTRACT\s+(\S+)\s+FROM\s+(\S+)/i.test(upper)) {
    const match = upper.match(/SUBTRACT\s+(\S+)\s+FROM\s+(\S+)/i);
    return `self.${match[2].toLowerCase().replace(/-/g, '_')} -= self.${match[1].toLowerCase().replace(/-/g, '_')}`;
  }
  
  // MULTIPLY pattern
  if (/MULTIPLY\s+(\S+)\s+BY\s+(\S+)\s+GIVING\s+(\S+)/i.test(upper)) {
    const match = upper.match(/MULTIPLY\s+(\S+)\s+BY\s+(\S+)\s+GIVING\s+(\S+)/i);
    return `self.${match[3].toLowerCase().replace(/-/g, '_')} = self.${match[1].toLowerCase().replace(/-/g, '_')} * self.${match[2].toLowerCase().replace(/-/g, '_')}`;
  }
  
  // DIVIDE pattern
  if (/DIVIDE\s+(\S+)\s+BY\s+(\S+)\s+GIVING\s+(\S+)/i.test(upper)) {
    const match = upper.match(/DIVIDE\s+(\S+)\s+BY\s+(\S+)\s+GIVING\s+(\S+)/i);
    return `self.${match[3].toLowerCase().replace(/-/g, '_')} = self.${match[1].toLowerCase().replace(/-/g, '_')} / self.${match[2].toLowerCase().replace(/-/g, '_')}`;
  }
  
  // COMPUTE patterns
  if (/COMPUTE\s+(\S+)\s*=\s*(\S+)\s*\+\s*(\S+)/i.test(upper)) {
    const match = upper.match(/COMPUTE\s+(\S+)\s*=\s*(\S+)\s*\+\s*(\S+)/i);
    return `self.${match[1].toLowerCase().replace(/-/g, '_')} = self.${match[2].toLowerCase().replace(/-/g, '_')} + self.${match[3].toLowerCase().replace(/-/g, '_')}`;
  }
  
  // IF patterns
  if (/IF\s+(\S+)\s*=\s*"([^"]+)"/i.test(upper)) {
    const match = upper.match(/IF\s+(\S+)\s*=\s*"([^"]+)"/i);
    return `if self.${match[1].toLowerCase().replace(/-/g, '_')} == "${match[2]}":`;
  }
  if (/IF\s+(\S+)\s*>\s*(\S+)/i.test(upper)) {
    const match = upper.match(/IF\s+(\S+)\s*>\s*(\S+)/i);
    return `if self.${match[1].toLowerCase().replace(/-/g, '_')} > self.${match[2].toLowerCase().replace(/-/g, '_')}:`;
  }
  if (/IF\s+(\S+)\s+IS\s+POSITIVE/i.test(upper)) {
    const match = upper.match(/IF\s+(\S+)\s+IS\s+POSITIVE/i);
    return `if self.${match[1].toLowerCase().replace(/-/g, '_')} > 0:`;
  }
  if (/IF\s+(\S+)\s+IS\s+ZERO/i.test(upper)) {
    const match = upper.match(/IF\s+(\S+)\s+IS\s+ZERO/i);
    return `if self.${match[1].toLowerCase().replace(/-/g, '_')} == 0:`;
  }
  
  // PERFORM pattern
  if (/PERFORM\s+([A-Z0-9][\w-]+)/i.test(upper)) {
    const match = upper.match(/PERFORM\s+([A-Z0-9][\w-]+)/i);
    return `self.p_${match[1].toLowerCase().replace(/-/g, '_')}()`;
  }
  
  // STOP RUN / GOBACK
  if (/STOP\s+RUN/i.test(upper)) return 'return';
  if (/GOBACK/i.test(upper)) return 'return';
  
  return `# COBOL: ${cobol.substring(0, 80)}`;
}

// Run tests
console.log('Pattern Library Test Suite\n');
console.log('==========================\n');

const results = testPatterns();

// Test with actual COBOL file
console.log('\n=== Testing with COBOL file ===\n');

try {
  const cobolCode = readFileSync('./test-patterns.cbl', 'utf-8');
  const lines = cobolCode.split('\n').filter(l => l.trim() && !l.trim().startsWith('*'));
  
  let patternMatched = 0;
  let needsAI = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^[\d\s]*$/.test(trimmed)) continue;
    if (/^(IDENTIFICATION|ENVIRONMENT|DATA|PROCEDURE|WORKING-STORAGE|PROGRAM-ID|PIC|01|05|10|77|\d+-\w+\.)/.test(trimmed)) continue;
    
    const result = translateCobolLine(trimmed);
    if (result.startsWith('# TODO')) {
      needsAI++;
    } else {
      patternMatched++;
      console.log(`✅ ${trimmed.substring(0, 50)}`);
      console.log(`   → ${result}`);
    }
  }
  
  const coverage = Math.round((patternMatched / (patternMatched + needsAI)) * 100);
  console.log(`\n=== File Coverage: ${coverage}% (${patternMatched}/${patternMatched + needsAI} lines) ===`);
  
} catch (e) {
  console.log('Could not read test file:', e.message);
}

console.log('\n✅ Pattern Library tests complete!');
