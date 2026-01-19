import sys
sys.path.insert(0, '/workspace')

from api.transpile import generate_python_code

# Read COBOL file
with open('/workspace/test-security-issues.cbl', 'r') as f:
    cobol_code = f.read()

print("Testing LOCAL transpiler with security-heavy COBOL file...")
print(f"Code length: {len(cobol_code)} chars\n")

# Call local transpiler
result = generate_python_code(cobol_code, enhance=False)

print("========== TRANSPILER RESULT ==========")
print("Success:", result.get('success'))
print("Version:", result.get('version'))

python_code = result.get('python_code', '')
print(f"Python code length: {len(python_code)} chars")

print("\n========== SECURITY CHECKS IN GENERATED CODE ==========")

import re

# Check for hardcoded credentials (excluding comments)
code_lines = [l for l in python_code.split('\n') if not l.strip().startswith('#')]
code_only = '\n'.join(code_lines)

has_hardcoded_password = bool(re.search(r"password.*=.*['\"][A-Za-z0-9!@#$%^&*]+['\"]", code_only, re.IGNORECASE))
has_secure_credential = 'get_secure_credential' in python_code
has_os_environ = 'os.environ' in python_code or 'os.getenv' in python_code

print(f"Hardcoded passwords (in code): {'❌ YES (BAD)' if has_hardcoded_password else '✅ NO (GOOD)'}")
print(f"get_secure_credential() used: {'✅ YES (GOOD)' if has_secure_credential else '❌ NO'}")
print(f"os.environ/getenv used: {'✅ YES (GOOD)' if has_os_environ else '❌ NO'}")

# Check for PII handling
has_pii_field = 'PIIField' in python_code or 'mask_pii' in python_code or 'encrypt_pii' in python_code
print(f"PII protection helpers: {'✅ YES (GOOD)' if has_pii_field else '❌ NO'}")

# Check for overflow protection
has_decimal_traps = 'getcontext' in python_code and 'traps' in python_code
print(f"Overflow protection: {'✅ YES (GOOD)' if has_decimal_traps else '❌ NO'}")

# Check security stats from result
security_stats = result.get('security_stats', {})
print(f"\n========== SECURITY STATS FROM TRANSPILER ==========")
for key, value in security_stats.items():
    print(f"  {key}: {value}")

# Save output
with open('/workspace/security-local-output.py', 'w') as f:
    f.write(python_code)
print("\n✅ Full output saved to security-local-output.py")
