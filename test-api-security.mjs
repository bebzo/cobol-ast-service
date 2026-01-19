import fs from 'fs';

const cobolCode = fs.readFileSync('/workspace/test-security-issues.cbl', 'utf8');

console.log('Testing API with security-heavy COBOL file...');
console.log('Code length:', cobolCode.length, 'chars\n');

// Call the external transpiler API directly
const response = await fetch('https://cobol-ast-service.vercel.app/api/transpile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    cobolCode,
    enhance: false,
    allow_stubs: true
  })
});

const result = await response.json();

console.log('========== TRANSPILER RESULT ==========');
console.log('Success:', result.success);
console.log('Version:', result.version);
console.log('Python code length:', result.python_code?.length || 0, 'chars');

// Check for security in the Python code
const pythonCode = result.python_code || '';

console.log('\n========== SECURITY CHECKS IN GENERATED CODE ==========');

// Check for hardcoded credentials
const hasHardcodedPassword = /password.*=.*['"][^'"]+['"]/i.test(pythonCode);
const hasSecureCredential = /get_secure_credential/i.test(pythonCode);
const hasOsEnviron = /os\.environ|os\.getenv/i.test(pythonCode);

console.log('Hardcoded passwords found:', hasHardcodedPassword ? '❌ YES (BAD)' : '✅ NO (GOOD)');
console.log('get_secure_credential() used:', hasSecureCredential ? '✅ YES (GOOD)' : '❌ NO');
console.log('os.environ/getenv used:', hasOsEnviron ? '✅ YES (GOOD)' : '❌ NO');

// Check for PII handling
const hasPIIField = /PIIField|mask_pii|encrypt_pii/i.test(pythonCode);
console.log('PII protection helpers:', hasPIIField ? '✅ YES (GOOD)' : '❌ NO');

// Check for overflow protection
const hasDecimalTraps = /getcontext.*traps|Overflow/i.test(pythonCode);
console.log('Overflow protection:', hasDecimalTraps ? '✅ YES (GOOD)' : '❌ NO');

// Show a sample of the generated code
console.log('\n========== PYTHON CODE SAMPLE (first 2000 chars) ==========');
console.log(pythonCode.slice(0, 2000));

// Save full output
fs.writeFileSync('/workspace/security-test-output.py', pythonCode);
console.log('\n✅ Full output saved to security-test-output.py');
