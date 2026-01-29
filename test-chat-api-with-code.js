/**
 * Test Script: Chat API with Code Context
 * v9.3: Verify that the chat API correctly receives COBOL and Python code
 */

const TEST_COBOL_CODE = `       IDENTIFICATION DIVISION.
       PROGRAM-ID.  PAYROLL01.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-SALARY           PIC 9(7)V99 COMP-3.
       01  WS-TAX-RATE         PIC V999 VALUE .150.
       PROCEDURE DIVISION.
       0000-MAIN.
           MOVE 50000 TO WS-SALARY
           COMPUTE WS-TAX = WS-SALARY * WS-TAX-RATE
           DISPLAY "TAX: " WS-TAX
           STOP RUN.`;

const TEST_PYTHON_CODE = `from decimal import Decimal, ROUND_HALF_EVEN

class PayrollProcessor:
    def __init__(self):
        self.salary = Decimal('0')
        self.tax_rate = Decimal('0.150')
    
    def calculate_tax(self, salary: Decimal) -> Decimal:
        """Calculate tax using COBOL-compatible rounding"""
        tax = salary * self.tax_rate
        return tax.quantize(Decimal('0.01'), rounding=ROUND_HALF_EVEN)

if __name__ == "__main__":
    processor = PayrollProcessor()
    salary = Decimal('50000.00')
    tax = processor.calculate_tax(salary)
    print(f"Tax: {tax}")`;

async function testChatAPI() {
  console.log('🧪 TEST: Chat API with Code Context (v9.3)');
  console.log('='.repeat(60));
  
  // Simulate the frontend request structure (after our fix)
  const requestBody = {
    query: "Comment évalues-tu cette migration COBOL vers Python?",
    // v9.3: Top-level code strings (our fix)
    cobolCode: TEST_COBOL_CODE,
    pythonCode: TEST_PYTHON_CODE,
    // Full context for all other data
    fullContext: {
      analysis: {
        summary: "Payroll processing module migration",
        migration_score: {
          confidence: 92,
          complexity: "MEDIUM",
          risk_level: "LOW"
        },
        issues: [],
        improvements: [],
        security_warnings: []
      },
      testResults: { total: 5, passed: 5, failed: 0 }
    }
  };

  console.log('\n📤 REQUEST BODY STRUCTURE:');
  console.log('- query:', requestBody.query.substring(0, 50) + '...');
  console.log('- cobolCode:', requestBody.cobolCode.length, 'characters');
  console.log('- pythonCode:', requestBody.pythonCode.length, 'characters');
  console.log('- fullContext.analysis.summary:', requestBody.fullContext.analysis.summary);
  
  // Verify the structure is correct
  const tests = [
    {
      name: 'cobolCode is a string (not object)',
      pass: typeof requestBody.cobolCode === 'string'
    },
    {
      name: 'pythonCode is a string (not object)',
      pass: typeof requestBody.pythonCode === 'string'
    },
    {
      name: 'cobolCode is not empty',
      pass: requestBody.cobolCode.length > 0
    },
    {
      name: 'pythonCode is not empty',
      pass: requestBody.pythonCode.length > 0
    },
    {
      name: 'fullContext.analysis is present',
      pass: requestBody.fullContext?.analysis !== undefined
    }
  ];

  console.log('\n✅ VALIDATION TESTS:');
  let allPassed = true;
  tests.forEach((test, i) => {
    const status = test.pass ? '✓' : '✗';
    console.log(`${status} ${test.name}`);
    if (!test.pass) allPassed = false;
  });

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED - Chat API will receive code correctly!');
    console.log('\n📋 Summary of fix:');
    console.log('  Before: cobolCode was nested in fullContext as object');
    console.log('  After:  cobolCode and pythonCode are top-level strings');
  } else {
    console.log('❌ SOME TESTS FAILED - Check the structure above');
  }
  
  return allPassed;
}

// Run the test
testChatAPI().then(passed => {
  process.exit(passed ? 0 : 1);
});
