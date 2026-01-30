#!/usr/bin/env python3
"""
Trace the complete transpilation flow to find where bugs escape correction.
"""
import sys
sys.path.insert(0, '/workspace')

from api.transpile import transpile_cobol_to_python, ProgramStructure, COBOLParagraph
import ast

# Test COBOL with problematic patterns
TEST_COBOL = '''
       IDENTIFICATION DIVISION.
       PROGRAM-ID. TESTPROG.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-VAR1         PIC X(10) VALUE "0123".
       01  WS-VAR2         PIC 9(3).

       PROCEDURE DIVISION.
       0000-MAIN.
           MOVE "HELLO""" TO WS-VAR1.
           MOVE 007 TO WS-VAR2.
           DISPLAY WS-VAR1 WS-VAR2.
           STOP RUN.
'''

print("=== STEP 1: Transpilation ===")
try:
    result = transpile_cobol_to_python(TEST_COBOL, "test.cbl")
    print(f"✓ Transpilation successful")
    print(f"  Python code length: {len(result['python_code'])} chars")
    print(f"  Lines: {result['python_code'].count(chr(10)) + 1}")
except Exception as e:
    print(f"✗ Transpilation failed: {e}")
    sys.exit(1)

python_code = result['python_code']

print("\n=== STEP 2: Check for problematic patterns ===")
issues = []

# Check for leading zeros
import re
leading_zeros = re.findall(r'(?<![\w"\'`])\b0+\d+\b', python_code)
if leading_zeros:
    issues.append(f"Leading zeros found: {leading_zeros[:5]}")

# Check for unclosed docstrings
lines = python_code.split('\n')
for i, line in enumerate(lines, 1):
    if '"""' in line:
        count = line.count('"""')
        if count == 1 and not line.strip().endswith('"""'):
            # Might be unclosed
            if i > 1 and '"""' not in lines[i-2]:
                issues.append(f"Possible unclosed docstring at line {i}: {line[:50]}...")

print(f"Issues found: {len(issues)}")
for issue in issues:
    print(f"  - {issue}")

print("\n=== STEP 3: AST Validation ===")
try:
    ast.parse(python_code)
    print("✓ AST validation passed")
except SyntaxError as e:
    print(f"✗ AST Syntax Error: {e.msg} (line {e.lineno})")
    # Show context
    for i in range(max(1, e.lineno - 3), min(len(lines) + 1, e.lineno + 4)):
        marker = ">>>" if i == e.lineno else "   "
        print(f"  {marker} {i}: {lines[i-1][:80]}")

print("\n=== STEP 4: Check docstring content ===")
# Find all docstrings and check their content
for node in ast.walk(ast.parse(python_code)):
    if isinstance(node, ast.Expr) and isinstance(node.value, ast.Constant):
        docstring = node.value.value
        if 'Original COBOL' in str(docstring):
            print(f"  Found traceability docstring")
            # Check for problematic content
            if '"""' in docstring:
                print(f"    ⚠️ Contains triple quotes!")
            if re.search(r'\b0+\d+\b', docstring):
                print(f"    ⚠️ Contains leading zeros!")
            # Show first 200 chars
            print(f"    Content preview: {str(docstring)[:200]}...")
