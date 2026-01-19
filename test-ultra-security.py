import sys
sys.path.insert(0, '/workspace')

from api.transpile import generate_python_code

# Read COBOL file
with open('/workspace/test-ultra-insecure.cbl', 'r') as f:
    cobol_code = f.read()

print("=" * 70)
print("TESTING ULTRA-INSECURE COBOL FILE")
print("=" * 70)
print(f"COBOL Code: {len(cobol_code)} chars, {cobol_code.count(chr(10))} lines\n")

# Count vulnerabilities in source
source_lower = cobol_code.lower()
print("SOURCE VULNERABILITIES DETECTED:")
print(f"  - 'password' mentions: {source_lower.count('password')}")
print(f"  - 'secret' mentions: {source_lower.count('secret')}")
print(f"  - 'api-key' mentions: {source_lower.count('api-key') + source_lower.count('api_key')}")
print(f"  - 'ssn' mentions: {source_lower.count('ssn')}")
print(f"  - 'credit-card' mentions: {source_lower.count('credit-card') + source_lower.count('credit_card')}")
print(f"  - 'token' mentions: {source_lower.count('token')}")
print(f"  - 'aws' mentions: {source_lower.count('aws')}")

# Transpile
print("\n" + "=" * 70)
print("TRANSPILING...")
print("=" * 70)
result = generate_python_code(cobol_code, enhance=False)

print(f"Success: {result.get('success')}")
print(f"Version: {result.get('version')}")

python_code = result.get('python_code', '')
print(f"Python Code: {len(python_code)} chars\n")

# Analyze generated code
print("=" * 70)
print("SECURITY ANALYSIS OF GENERATED CODE")
print("=" * 70)

# Split into code and comments
lines = python_code.split('\n')
code_lines = [l for l in lines if not l.strip().startswith('#')]
comment_lines = [l for l in lines if l.strip().startswith('#')]
code_only = '\n'.join(code_lines)

print(f"\nTotal lines: {len(lines)}")
print(f"Code lines: {len(code_lines)}")
print(f"Comment lines: {len(comment_lines)}")

# Check credentials in executable code
import re

print("\n--- CREDENTIAL PROTECTION ---")
secure_calls = len(re.findall(r'get_secure_credential', python_code))
print(f"get_secure_credential() calls: {secure_calls}")

# Find any remaining hardcoded secrets in CODE (not comments)
hardcoded_patterns = [
    (r"password.*=\s*['\"][^'\"]{8,}['\"]", "Hardcoded password"),
    (r"secret.*=\s*['\"][^'\"]{8,}['\"]", "Hardcoded secret"),
    (r"api.?key.*=\s*['\"][^'\"]{8,}['\"]", "Hardcoded API key"),
    (r"token.*=\s*['\"][^'\"]{8,}['\"]", "Hardcoded token"),
]

issues_found = []
for pattern, desc in hardcoded_patterns:
    matches = re.findall(pattern, code_only, re.IGNORECASE)
    for m in matches:
        if 'get_secure_credential' not in m and 'REDACTED' not in m:
            issues_found.append(f"{desc}: {m[:50]}...")

if issues_found:
    print(f"⚠️  Issues in code: {len(issues_found)}")
    for issue in issues_found[:5]:
        print(f"   - {issue}")
else:
    print("✅ No hardcoded credentials in executable code!")

print("\n--- PII PROTECTION ---")
pii_helpers = ['PIIField', 'mask_pii', 'encrypt_pii', 'mask_ssn', 'mask_card']
for helper in pii_helpers:
    count = python_code.count(helper)
    if count > 0:
        print(f"✅ {helper}: {count} occurrences")

print("\n--- OVERFLOW PROTECTION ---")
overflow_patterns = ['getcontext', 'Decimal', 'try:', 'except']
for pattern in overflow_patterns:
    count = code_only.count(pattern)
    print(f"  {pattern}: {count} occurrences")

print("\n--- SQL PROTECTION ---")
sql_helpers = ['parameterized', 'prepare', 'bind', 'escape']
for helper in sql_helpers:
    count = code_only.lower().count(helper)
    if count > 0:
        print(f"✅ {helper}: {count} occurrences")

# Save output
with open('/workspace/ultra-insecure-output.py', 'w') as f:
    f.write(python_code)

print("\n" + "=" * 70)
print("OUTPUT SAVED TO: ultra-insecure-output.py")
print("=" * 70)
