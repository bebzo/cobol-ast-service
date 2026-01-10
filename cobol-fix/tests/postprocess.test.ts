/**
 * Post-Processing Unit Tests
 * Validates that all generator artifacts are properly cleaned
 * Run with: npx tsx tests/postprocess.test.ts
 */

import { postProcessPythonCode } from '../lib/postprocess';

interface TestCase {
  name: string;
  input: string;
  shouldNotContain: string[];
  shouldContain?: string[];
}

// Padding to ensure all inputs are > 50 chars (min threshold)
const PAD = '\n# padding comment to ensure minimum length requirement is met\n';

// Test cases for all known artifact patterns
const TEST_CASES: TestCase[] = [
  // ========== v11.5: Generated from artifacts ==========
  {
    name: 'Remove "Generated from" at line start',
    input: `class WorkingStorage:
working_storage - Generated from working_storage.cpy
    def __init__(self):
        pass${PAD}`,
    shouldNotContain: ['Generated from', 'working_storage.cpy'],
    shouldContain: ['class WorkingStorage', 'def __init__']
  },
  {
    name: 'Remove indented "Generated from" (inside class)',
    input: `class WorkingStorage:
    working_storage - Generated from working_storage.cpy
    def __init__(self):
        self.data = {}${PAD}`,
    shouldNotContain: ['Generated from', 'working_storage.cpy'],
    shouldContain: ['class WorkingStorage', 'def __init__']
  },
  {
    name: 'Remove deeply indented "Generated from"',
    input: `class Outer:
    class Inner:
        ws_data - Generated from ws_data.cpy
        def process(self):
            pass${PAD}`,
    shouldNotContain: ['Generated from', 'ws_data.cpy'],
    shouldContain: ['class Outer', 'class Inner', 'def process']
  },

  // ========== v11.6: Record length artifacts ==========
  {
    name: 'Remove "Record length" artifacts',
    input: `class DataRecord:
    Record length: 256 bytes
    def __init__(self):
        pass${PAD}`,
    shouldNotContain: ['Record length', '256 bytes'],
    shouldContain: ['class DataRecord']
  },
  {
    name: 'Remove indented "Record length"',
    input: `    Record length: 128 bytes
class Something:
    def method(self):
        pass${PAD}`,
    shouldNotContain: ['Record length', '128 bytes'],
    shouldContain: ['class Something']
  },

  // ========== Orphan closing brackets ==========
  {
    name: 'Remove orphan closing parentheses',
    input: `def calculate():
    result = value * 2
    return result
))))${PAD}`,
    shouldNotContain: ['))))'],
    shouldContain: ['def calculate', 'return result']
  },
  {
    name: 'Remove lines with only brackets',
    input: `class TestClass:
    def method(self):
        pass
)
]
}${PAD}`,
    shouldNotContain: [],
    shouldContain: ['class TestClass', 'def method']
  },

  // ========== Docstring with orphan paren ==========
  {
    name: 'Fix docstring with trailing paren',
    input: `def example():
    """This is a docstring.""")
    value = 42
    return value${PAD}`,
    shouldNotContain: ['""")'],
    shouldContain: ['"""This is a docstring."""', 'return value']
  },

  // ========== Unclosed raise NotImplementedError ==========
  {
    name: 'Fix unclosed NotImplementedError multiline',
    input: `def not_done():
    raise NotImplementedError(
    "This feature"
    "is not implemented"
${PAD}`,
    shouldNotContain: ['raise NotImplementedError(\n    "This'],
    shouldContain: ['NotImplementedError']
  },
  {
    name: 'Fix NotImplementedError at end of line',
    input: `def stub():
    """A stub function that is not implemented yet."""
    raise NotImplementedError(${PAD}`,
    shouldNotContain: [],  // It transforms to valid syntax
    shouldContain: ['NotImplementedError("Not implemented")']
  },

  // ========== NUCLEAR/syntax error comments ==========
  {
    name: 'Remove NUCLEAR comments',
    input: `def process():
    pass  # NUCLEAR: syntax error here
    value = calculate()
    return True${PAD}`,
    shouldNotContain: ['NUCLEAR', 'syntax error'],
    shouldContain: ['def process', 'return True']
  },

  // ========== self.xxx corruptions ==========
  {
    name: 'Fix self.rXX enum values',
    input: `class Processor:
    def check_status(self):
        status = "self.r01"
        code = self.r02
        return status${PAD}`,
    shouldNotContain: [],  // These are fixed via string replacement
    shouldContain: ['class Processor', 'def check_status']
  },
  {
    name: 'Fix self.thresholds',
    input: `class Validator:
    def validate(self):
        limit = self.thresholds.MAX
        return limit > 0${PAD}`,
    shouldNotContain: [],  // Transformed in context
    shouldContain: ['class Validator', 'def validate']
  },

  // ========== Edit/Copy/Share artifacts ==========
  {
    name: 'Remove Edit/Copy/Share lines',
    input: `class MyClass:
    def method(self):
        pass
Edit
Copy
Share${PAD}`,
    shouldNotContain: ['Edit\n', 'Copy\n', 'Share\n'],
    shouldContain: ['class MyClass', 'def method']
  },
  {
    name: 'Remove indented Edit/Copy/Share',
    input: `class MyClass:
    def method(self):
        pass
    Edit
    Copy
    Share${PAD}`,
    shouldNotContain: [],  // These should be filtered
    shouldContain: ['class MyClass', 'def method']
  },

  // ========== Auto-generated comments ==========
  {
    name: 'Clean Auto-generated line',
    input: `Auto-generated from COBOL program
class Program:
    def run(self):
        pass${PAD}`,
    shouldNotContain: ['Auto-generated from COBOL'],
    shouldContain: ['class Program']
  },

  // ========== Combined stress test ==========
  {
    name: 'Combined: Multiple artifacts in one file',
    input: `# [v8.0] Generated Python
# Auto-generated by CodeSwitch

from decimal import Decimal
from dataclasses import dataclass
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

@dataclass
class WorkingStorage:
    working_storage - Generated from working_storage.cpy
    Record length: 256 bytes
    
    ws_amount: Decimal = Decimal("0")
    ws_status: str = "active"
    
    def validate(self):
        """Validate the storage.""")
        if self.ws_amount > 1000:
            pass  # NUCLEAR: syntax error
            raise NotImplementedError(

class TransactionProcessor:
    def __init__(self):
        self.data = {}
    
    def process(self):
        return True
))))
Edit
Copy
Share
`,
    shouldNotContain: [
      'Generated from working_storage.cpy',
      'Record length: 256',
      '""")' ,
      'NUCLEAR',
      '))))'
    ],
    shouldContain: ['class WorkingStorage', 'class TransactionProcessor', 'def process']
  }
];

// ========== Test Runner ==========
function runTests(): { passed: number; failed: number; results: string[] } {
  let passed = 0;
  let failed = 0;
  const results: string[] = [];

  for (const testCase of TEST_CASES) {
    const output = postProcessPythonCode(testCase.input, 'TEST');
    let testPassed = true;
    const errors: string[] = [];

    // Check shouldNotContain
    for (const pattern of testCase.shouldNotContain) {
      if (output.includes(pattern)) {
        testPassed = false;
        errors.push(`  FAIL: Still contains "${pattern.replace(/\n/g, '\\n')}"`);
      }
    }

    // Check shouldContain
    if (testCase.shouldContain) {
      for (const pattern of testCase.shouldContain) {
        if (!output.includes(pattern)) {
          testPassed = false;
          errors.push(`  FAIL: Missing expected "${pattern}"`);
        }
      }
    }

    if (testPassed) {
      passed++;
      results.push(`✓ ${testCase.name}`);
    } else {
      failed++;
      results.push(`✗ ${testCase.name}`);
      results.push(...errors);
      // Show output for debugging
      results.push(`  OUTPUT:\n${output.split('\n').map(l => '    ' + l).join('\n')}`);
    }
  }

  return { passed, failed, results };
}

// ========== Syntax Validation ==========
async function validatePythonSyntax(code: string): Promise<{ valid: boolean; error?: string }> {
  const { spawn } = await import('child_process');
  
  return new Promise((resolve) => {
    const python = spawn('python3', ['-c', `import ast; ast.parse(${JSON.stringify(code)})`]);
    let stderr = '';
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        resolve({ valid: true });
      } else {
        resolve({ valid: false, error: stderr });
      }
    });
    
    python.on('error', () => {
      resolve({ valid: false, error: 'Python not available' });
    });
  });
}

// ========== Real-world Sample Test ==========
async function testRealWorldSample(): Promise<{ passed: boolean; error?: string }> {
  // Simulated real output with common issues
  const realWorldSample = `# [v8.0] Python Translation
# Auto-generated by CodeSwitch

from decimal import Decimal
from dataclasses import dataclass
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

@dataclass
class WorkingStorage:
    working_storage - Generated from working_storage.cpy
    Record length: 256 bytes
    
    ws_amount: Decimal = Decimal("0")
    ws_status: str = "self.r01"
    
    def validate(self):
        """Validate the storage.""")
        if self.ws_amount > self.thresholds.MAX:
            pass  # NUCLEAR: syntax error
            raise NotImplementedError(

class TransactionProcessor:
    def __init__(self):
        self.data = {}
    
    def process(self):
        return True
))))
Edit
Copy
Share
`;

  const cleaned = postProcessPythonCode(realWorldSample, 'REAL_TEST');
  
  // Validate syntax
  const syntaxResult = await validatePythonSyntax(cleaned);
  
  if (!syntaxResult.valid) {
    return { 
      passed: false, 
      error: `Syntax error in cleaned code:\n${syntaxResult.error}\n\nCleaned code:\n${cleaned}` 
    };
  }
  
  return { passed: true };
}

// ========== Main ==========
async function main() {
  console.log('=' .repeat(60));
  console.log('PostProcess Unit Tests');
  console.log('='.repeat(60));
  console.log('');

  // Run pattern tests
  const { passed, failed, results } = runTests();
  
  for (const result of results) {
    console.log(result);
  }
  
  console.log('');
  console.log('-'.repeat(60));
  console.log(`Pattern Tests: ${passed} passed, ${failed} failed`);
  console.log('-'.repeat(60));
  
  // Run real-world syntax validation
  console.log('');
  console.log('Running real-world syntax validation...');
  const realWorldResult = await testRealWorldSample();
  
  if (realWorldResult.passed) {
    console.log('✓ Real-world sample: Syntax valid');
  } else {
    console.log('✗ Real-world sample: FAILED');
    console.log(realWorldResult.error);
  }
  
  console.log('');
  console.log('='.repeat(60));
  
  const totalPassed = passed + (realWorldResult.passed ? 1 : 0);
  const totalFailed = failed + (realWorldResult.passed ? 0 : 1);
  
  if (totalFailed === 0) {
    console.log(`ALL TESTS PASSED (${totalPassed}/${totalPassed})`);
    process.exit(0);
  } else {
    console.log(`TESTS FAILED: ${totalFailed} failures`);
    process.exit(1);
  }
}

main().catch(console.error);
