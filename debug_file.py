#!/usr/bin/env python3
"""Debug script for specific file with errors."""

import sys
sys.path.insert(0, '/workspace')

from api.transpile import generate_python_code

filepath = '/workspace/user_input_files/pasted-text-2026-01-12T16-26-02.txt'

with open(filepath, 'r', encoding='utf-8') as f:
    cobol_content = f.read()

print("First 500 characters of input:")
print(cobol_content[:500])
print("\n" + "="*60 + "\n")

result = generate_python_code(cobol_content, enhance=False)

if 'error' in result:
    print(f"Error type: {result.get('error_type')}")
    print(f"Error message: {result.get('error')}")
    print(f"\nError details: {result}")
elif 'python_code' in result:
    print("Success - Python code generated")
    # Check for syntax errors
    try:
        compile(result['python_code'], '<generated>', 'exec')
        print("Syntax check: PASSED")
    except SyntaxError as e:
        print(f"Syntax check: FAILED at line {e.lineno}")
        print(f"Error: {e.msg}")
        # Show the problematic line
        lines = result['python_code'].split('\n')
        if e.lineno <= len(lines):
            print(f"Line {e.lineno}: {lines[e.lineno-1]}")
