// Test the safeConvertToDecimal logic
function safeConvertToDecimal(expr) {
  let result = expr;
  
  // Step 1: Protect existing Decimal("...") from double-wrapping
  const placeholders = [];
  result = result.replace(/Decimal\s*\(\s*["'][^"']*["']\s*\)/g, (match) => {
    const placeholder = `@@DEC_${placeholders.length}@@`;
    placeholders.push(match);
    return placeholder;
  });
  
  // Step 2: Convert decimal numbers (with dot)
  result = result.replace(/(?<!["'\w@])(\d+\.\d+)(?!["'\w\]@])/g, 'Decimal("$1")');
  
  // Step 3: Convert integers
  result = result.replace(/(?<!["'\w\[@])(\d+)(?!["'\w\]\.@])/g, 'Decimal("$1")');
  
  // Step 4: Restore placeholders
  for (let i = 0; i < placeholders.length; i++) {
    result = result.replace(`@@DEC_${i}@@`, placeholders[i]);
  }
  
  return result;
}

// Test cases
const tests = [
  ['self.rate * 1027.50', 'self.rate * Decimal("1027.50")'],
  ['Decimal("100") + 50', 'Decimal("100") + Decimal("50")'],
  ['Decimal("1027.50") * self.factor', 'Decimal("1027.50") * self.factor'],
  ['self.arr[0] + 100', 'self.arr[0] + Decimal("100")'],
  ['3.14159 * 2', 'Decimal("3.14159") * Decimal("2")'],
  ['Decimal("1027.50")', 'Decimal("1027.50")'],
];

console.log('Testing safeConvertToDecimal:');
let allPassed = true;
for (const [input, expected] of tests) {
  const actual = safeConvertToDecimal(input);
  const passed = actual === expected;
  if (!passed) allPassed = false;
  console.log(`  ${passed ? '✅' : '❌'} "${input}"`);
  if (!passed) {
    console.log(`      Expected: "${expected}"`);
    console.log(`      Got:      "${actual}"`);
  }
}

// The critical bug case: double-wrapping
const bugCase = 'Decimal("1027.50")';
const bugResult = safeConvertToDecimal(bugCase);
const bugFixed = !bugResult.includes('Decimal("Decimal');
console.log('');
console.log('Critical bug test (no double-wrapping):');
console.log(`  ${bugFixed ? '✅ FIXED!' : '❌ Still broken'} - "${bugResult}"`);

console.log('');
console.log(allPassed && bugFixed ? '🎉 All tests passed!' : '⚠️ Some tests failed');
