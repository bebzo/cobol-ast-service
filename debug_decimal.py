#!/usr/bin/env python3
"""Debug Decimal issues."""

import sys
sys.path.insert(0, '/workspace')
from api.transpile import generate_python_code
import re

with open('/workspace/user_input_files/5claude_cobol_test.txt', 'r') as f:
    content = f.read()

result = generate_python_code(content, enhance=False)

# Look for the pattern Decimal = in the generated code
pattern = re.compile(r'Decimal\s*=', re.IGNORECASE)
matches = list(pattern.finditer(result['python_code']))

print(f"Found {len(matches)} occurrences of 'Decimal =':\n")
for m in matches[:15]:
    start = max(0, m.start() - 30)
    end = min(len(result['python_code']), m.end() + 30)
    context = result['python_code'][start:end]
    print(f"...{context}...")
    print()
