#!/usr/bin/env python3
"""Check for potential issues in generated tests."""

import sys
sys.path.insert(0, '/workspace')
from api.transpile import generate_python_code
import re

with open('/workspace/user_input_files/5claude_cobol_test.txt', 'r') as f:
    content = f.read()

result = generate_python_code(content, enhance=False)

lines = result['unit_tests'].split('\n')

print("Looking for potential issues:")
issues = []

for i, line in enumerate(lines, 1):
    # Check for unterminated strings (odd number of quotes)
    single_quotes = line.count("'")
    double_quotes = line.count('"')
    
    if single_quotes % 2 == 1 and single_quotes > 0:
        issues.append(f"Line {i}: Odd single quotes ({single_quotes}): {line[:60]}")
    if double_quotes % 2 == 1 and double_quotes > 0:
        issues.append(f"Line {i}: Odd double quotes ({double_quotes}): {line[:60]}")
    
    # Check for Decimal( followed by variable that might have quotes
    if 'Decimal(' in line:
        # Look for Decimal( followed by something that looks like it might be a string with quotes
        decimal_match = re.search(r'Decimal\(\s*[\'"]', line)
        if decimal_match:
            issues.append(f"Line {i}: Decimal with string: {line[:80]}")

print(f"Found {len(issues)} potential issues:")
for issue in issues[:30]:
    print(issue)
