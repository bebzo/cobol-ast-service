#!/usr/bin/env python3
"""Test script to verify transpiler with the problematic file."""

import sys
sys.path.insert(0, '/workspace/api')

from transpile import generate_python_code

# Read the problematic COBOL file
with open('/workspace/user_input_files/pasted-text-2026-02-03T17-19-17.txt', 'r') as f:
    cobol_code = f.read()

print("=" * 80)
print("TRANSPILER TEST - PROBLEMATIC FILE")
print("=" * 80)
print(f"COBOL file size: {len(cobol_code):,} characters")
print(f"Number of lines: {len(cobol_code.splitlines())}")
print()

# Transpile
result = generate_python_code(cobol_code, production_quality=True)

print("Transpilation Result:")
print("-" * 40)
print(f"Success: {result.get('success', False)}")
print(f"Error: {result.get('error', 'None')}")
print(f"Version: {result.get('version', 'Unknown')}")
print()

if result.get('success') and result.get('python_code'):
    python_code = result['python_code']
    print(f"Python code size: {len(python_code):,} characters")
    print(f"Number of lines: {len(python_code.splitlines())}")
    print()
    
    # Check for docstrings
    docstring_count = python_code.count('"""')
    print(f"Docstring markers: {docstring_count}")
    
    # Try to compile
    try:
        compile(python_code, '<transpiled>', 'exec')
        print("✅ Compilation: SUCCESS - Code is syntactically valid!")
    except SyntaxError as e:
        print(f"❌ Compilation: FAILED - {e}")
        print(f"   Line {e.lineno}: {e.msg}")
        if e.text:
            print(f"   Text: {e.text[:100]}")
    except Exception as e:
        print(f"❌ Compilation: FAILED - {type(e).__name__}: {e}")
else:
    print("❌ Transpilation failed!")
    print(f"Error details: {result.get('error')}")
    if 'validation_warnings' in result:
        print(f"Validation warnings: {result['validation_warnings']}")

print("=" * 80)
