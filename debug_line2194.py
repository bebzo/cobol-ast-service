#!/usr/bin/env python3
"""Check line 2194 of generated tests."""

import sys
sys.path.insert(0, '/workspace')
from api.transpile import generate_python_code

with open('/workspace/user_input_files/5claude_cobol_test.txt', 'r') as f:
    content = f.read()

result = generate_python_code(content, enhance=False)

lines = result['unit_tests'].split('\n')

print(f"Total lines in tests: {len(lines)}")
print(f"Line 2194:" if len(lines) >= 2194 else "File has fewer than 2194 lines")

if len(lines) >= 2194:
    # Show lines around 2194
    for i in range(2189, 2200):
        print(f"{i+1}: {lines[i]}")
    
    # Check for issues around line 2194
    print("\n" + "="*60)
    print("Looking for potential issues:")
    for i in range(2180, 2210):
        line = lines[i]
        # Check for unterminated strings
        if "'" in line and line.count("'") % 2 == 1:
            print(f"Line {i+1}: POSSIBLE UNTERMINATED STRING - {line[:80]}")
        # Check for Decimal() with quotes inside
        if re.search(r"Decimal\(['\"][^'\"]*$", line):
            print(f"Line {i+1}: POSSIBLE DECIMAL ISSUE - {line[:80]}")
