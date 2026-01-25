#!/usr/bin/env python3
"""Test script to verify the COBOL transpiler bug fixes."""

import sys
sys.path.insert(0, '/workspace')

from api.transpile import generate_python_code

# Test COBOL code with various bug scenarios
cobol_test = """       IDENTIFICATION DIVISION.
       PROGRAM-ID. BUG-FIX-TEST.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-AMOUNT          PIC 9(6)V99 VALUE 1234,56.
       01 WS-LIMIT           PIC 9(5)V99 VALUE 10000,00.
       01 WS-INPUT           PIC X(50) VALUE "A|B|C|D".
       01 WS-OUTPUT          PIC X(50).
       01 WS-PTR             PIC 9(2) VALUE 0.
       01 WS-CREDIT-SCORE    PIC 9(3) VALUE 450.
       01 WS-STATUS          PIC X VALUE 'A'.
       01 WS-RESULT          PIC X(100).

       PROCEDURE DIVISION.
       MAIN-PARA.
           DISPLAY "MEGA-ENTERPRISE-BEAST STARTING..." UPON SYSOUT.
           MOVE 9999,99 TO WS-AMOUNT.
           COMPUTE WS-LIMIT = 5000,00 * 1,5.
           UNSTRING WS-INPUT DELIMITED BY '|' INTO
               WS-OUTPUT WITH POINTER WS-PTR.
           EVALUATE TRUE
               WHEN WS-CREDIT-SCORE >= 300 THRU 579
                   MOVE "POOR" TO WS-RESULT
           END-EVALUATE.
           STOP RUN.
"""

print("=" * 80)
print("TESTING COBOL TRANSPILER BUG FIXES")
print("=" * 80)

try:
    result = generate_python_code(cobol_test, enhance=False)

    if result.get('success'):
        python_code = result.get('python_code', '')

        print("\n✓ Transpilation successful!")

        # Check for specific bug fixes
        print("\n" + "-" * 40)
        print("VERIFICATION OF BUG FIXES:")
        print("-" * 40)

        # Bug #3: Check DISPLAY UPON SYSOUT
        if 'self.upon' in python_code or 'self.sysout' in python_code:
            print("❌ Bug #3 NOT FIXED: Phantom variables 'upon' or 'sysout' found")
        else:
            print("✓ Bug #3 FIXED: No phantom variables from DISPLAY UPON SYSOUT")

        # Bug #1, #2, #8: Check Decimal comma handling
        import ast
        try:
            ast.parse(python_code)
            print("✓ Syntax validation: Python code is valid")
        except SyntaxError as e:
            print(f"❌ Syntax error: {e}")

        # Check for tuple creation (Bug #2, #8)
        if '(10000, 0)' in python_code or '(0, 5)' in python_code:
            print("❌ Bug #2/#8 NOT FIXED: Tuple creation from comma decimals found")
        else:
            print("✓ Bug #2/#8 LIKELY FIXED: No obvious tuple patterns")

        # Bug #6: Check UNSTRING WITH
        if 'self.with' in python_code:
            print("❌ Bug #6 NOT FIXED: Reserved keyword 'with' used as variable")
        else:
            print("✓ Bug #6 LIKELY FIXED: No 'self.with' variable found")

        # Bug #7: Check THRU range
        if "'300 THRU 579'" in python_code or '"300 THRU 579"' in python_code:
            print("❌ Bug #7 NOT FIXED: THRU range converted to string literal")
        elif '300 <= self.ws_credit_score <= 579' in python_code:
            print("✓ Bug #7 FIXED: THRU range properly converted to range comparison")
        else:
            print("⚠ Bug #7: Manual verification needed")

        # Show key code sections
        print("\n" + "-" * 40)
        print("GENERATED CODE SECTIONS:")
        print("-" * 40)

        lines = python_code.split('\n')
        for i, line in enumerate(lines, 1):
            if any(x in line.lower() for x in ['print("mega', 'ws_amount', 'ws_limit', 'ws_credit_score', 'with pointer', 'thru']):
                print(f"Line {i}: {line.strip()}")

    else:
        print(f"❌ Transpilation failed: {result.get('error', 'Unknown error')}")
        if 'validation_warnings' in result:
            print(f"Warnings: {result['validation_warnings']}")

except Exception as e:
    print(f"❌ Exception: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
