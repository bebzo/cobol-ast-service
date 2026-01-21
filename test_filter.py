#!/usr/bin/env python3
"""Test script to verify the non-COBOL filter is working correctly."""

import sys
sys.path.insert(0, '/workspace')

from api.transpile import filter_non_cobol_content, generate_python_code

# Test 1: Certificate file content
certificate_content = """CodeSwitch Pro
Equivalence Validation Certificate
CERTIFIED
4.deepseek_cobol_20260114_3fcf3b assurances.txt
Validated on January 14, 2026 at 09:29 PM
Overall Equivalence Score
97.0%
🏆 ANALYSE DU CERTIFICAT D'ÉQUIVALENCE CODESWITCH PRO
📜 CE CERTIFICAT EST EXCEPTIONNEL
CodeSwitch ne se contente pas de transpiler - il garantit et certifie l'équivalence.
© 2026 CodeSwitch Pro - COBOL Migration Platform
"""

print("=== Test 1: Certificate content filtering ===")
filtered = filter_non_cobol_content(certificate_content)
print(f"Original lines: {len(certificate_content.split(chr(10)))}")
print(f"Filtered lines: {len(filtered.split(chr(10)))}")
print(f"Filtered content:\n'{filtered}'")
print()

# Test 2: Real COBOL code (should be preserved)
cobol_code = """       IDENTIFICATION DIVISION.
       PROGRAM-ID. TEST-PROGRAM.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 AVEC PIC X(10) VALUE 'TEST'.
       PROCEDURE DIVISION.
       MAIN-PARA.
           DISPLAY AVEC.
           STOP RUN.
"""

print("=== Test 2: Real COBOL code preservation ===")
filtered_cobol = filter_non_cobol_content(cobol_code)
print(f"Original lines: {len(cobol_code.split(chr(10)))}")
print(f"Filtered lines: {len(filtered_cobol.split(chr(10)))}")
print(f"Filtered content:\n{filtered_cobol}")
print()

# Test 3: Mixed content (certificate + COBOL)
mixed_content = """CodeSwitch Pro
Equivalence Validation Certificate
CERTIFIED
Validated on January 14, 2026 at 09:29 PM
       IDENTIFICATION DIVISION.
       PROGRAM-ID. TEST-PROGRAM.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 AVEC PIC X(10) VALUE 'TEST'.
       PROCEDURE DIVISION.
       MAIN-PARA.
           DISPLAY AVEC.
           STOP RUN.
© 2026 CodeSwitch Pro - COBOL Migration Platform
"""

print("=== Test 3: Mixed content filtering ===")
filtered_mixed = filter_non_cobol_content(mixed_content)
print(f"Original lines: {len(mixed_content.split(chr(10)))}")
print(f"Filtered lines: {len(filtered_mixed.split(chr(10)))}")
print(f"Filtered content:\n{filtered_mixed}")
print()

# Test 4: Full transpilation test with certificate file
print("=== Test 4: Full transpilation with certificate file ===")
try:
    result = generate_python_code(certificate_content, enhance=False)
    if 'error' in result:
        print(f"Expected error: {result.get('error')}")
    else:
        print("Unexpected success - should have failed for non-COBOL input")
except Exception as e:
    print(f"Expected exception: {type(e).__name__}: {e}")

print("\n=== All tests completed ===")
