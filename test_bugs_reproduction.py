#!/usr/bin/env python3
"""Test script to reproduce the COBOL transpiler bugs identified in the analysis."""

import sys
import os
sys.path.insert(0, '/workspace')

from api.transpile import generate_python_code

# COBOL code that should reproduce the bugs mentioned in the analysis
cobol_with_bugs = """       IDENTIFICATION DIVISION.
       PROGRAM-ID. MEGA-ENTERPRISE-BEAST.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-AMOUNT          PIC 9(12)V99 VALUE 999999999999,99.
       01 WS-LIMIT           PIC 9(8)V99 VALUE 10000,00.
       01 WS-INPUT           PIC X(50) VALUE "A|B|C|D".
       01 WS-CREDIT-SCORE    PIC 9(3) VALUE 450.
       01 WS-TRX-AMOUNT      PIC S9(12)V99 VALUE 15000,00.
       01 WS-TRANSACTION-LIMIT PIC S9(12)V99 VALUE 1000000,00.
       01 WS-HIGH-RISK       PIC X VALUE 'Y'.
       01 WS-TRX-TYPE        PIC X(10) VALUE 'WIRE'.

       PROCEDURE DIVISION.
       MAIN-PARA.
           DISPLAY "MEGA-ENTERPRISE-BEAST STARTING..." UPON SYSOUT.
           MOVE 999999999999,99 TO WS-AMOUNT.
           IF WS-TRX-AMOUNT > (WS-TRANSACTION-LIMIT * 0,5)
               MOVE 'HIGH' TO WS-HIGH-RISK
           END-IF.
           IF WS-TRX-AMOUNT > 10000,00
               DISPLAY "LARGE TRANSACTION DETECTED"
           END-IF.
           EVALUATE TRUE
               WHEN WS-TRX-AMOUNT < 0,01
                   DISPLAY "INVALID AMOUNT: TOO SMALL"
               WHEN WS-TRX-AMOUNT > WS-TRANSACTION-LIMIT
                   DISPLAY "EXCEEDS LIMIT"
           END-EVALUATE.
           UNSTRING WS-INPUT DELIMITED BY '|' INTO
               WS-OUTPUT WITH POINTER WS-PTR.
           IF WS-CREDIT-SCORE = 300 THRU 579
               DISPLAY "SUBPRIME CREDIT"
           END-IF.
           STOP RUN.
"""

print("=" * 80)
print("TESTING COBOL TRANSPILER BUG REPRODUCTION")
print("=" * 80)

try:
    result = generate_python_code(cobol_with_bugs, enhance=False)

    if result.get('success'):
        python_code = result.get('python_code', '')

        print("\n✓ Transpilation successful!")

        # Check for specific bugs
        print("\n" + "-" * 40)
        print("CHECKING FOR BUGS:")
        print("-" * 40)

        # Bug #1: Check for p_999999999999,99 syntax error
        if 'p_999999999999,99' in python_code:
            print("❌ BUG #1 FOUND: p_999999999999,99 syntax error")
        else:
            print("✓ Bug #1 NOT FOUND: Proper syntax")

        # Bug #2: Check for tuple creation (comma decimal issue)
        if '(10000, 0)' in python_code or '(0, 5)' in python_code:
            print("❌ BUG #2 FOUND: Tuple creation from comma decimals")
        else:
            print("✓ Bug #2 NOT FOUND: No obvious tuple patterns")

        # Bug #3: Check for phantom variables 'upon' and 'sysout'
        if 'self.upon' in python_code or 'self.sysout' in python_code:
            print("❌ BUG #3 FOUND: Phantom variables 'upon' or 'sysout'")
        else:
            print("✓ Bug #3 NOT FOUND: No phantom variables from DISPLAY UPON SYSOUT")

        # Bug #4: Check for EVALUATE TRUE issue
        if 'if True:' in python_code:
            print("❌ BUG #4 FOUND: EVALUATE TRUE becomes if True (dead code)")
        else:
            print("✓ Bug #4 NOT FOUND: EVALUATE TRUE properly handled")

        # Bug #5: Check for WITH POINTER creating 'with' variable
        if 'self.with =' in python_code:
            print("❌ BUG #5 FOUND: Reserved keyword 'with' used as variable")
        else:
            print("✓ Bug #5 NOT FOUND: No 'self.with' variable")

        # Bug #6: Check for THRU range as string literal
        if "'300 THRU 579'" in python_code or '"300 THRU 579"' in python_code:
            print("❌ BUG #6 FOUND: THRU range converted to string literal")
        else:
            print("✓ Bug #6 NOT FOUND: THRU range properly handled")

        # Show key problematic code sections
        print("\n" + "-" * 40)
        print("CODE SECTIONS TO CHECK:")
        print("-" * 40)

        lines = python_code.split('\n')
        for i, line in enumerate(lines, 1):
            if any(x in line.lower() for x in ['p_999999999999', 'self.upon', 'self.sysout', 'self.with', 'if True:', "'300 thru", '"300 thru']):
                print(f"Line {i}: {line.strip()}")

        # Try to compile the generated code to check for syntax errors
        print("\n" + "-" * 40)
        print("SYNTAX VALIDATION:")
        print("-" * 40)
        
        try:
            compile(python_code, '<generated>', 'exec')
            print("✓ Generated code compiles successfully!")
        except SyntaxError as e:
            print(f"❌ Syntax error in generated code: {e}")
            print(f"   Line {e.lineno}: {e.text.strip() if e.text else 'N/A'}")

    else:
        print(f"❌ Transpilation failed: {result.get('error', 'Unknown error')}")
        if 'validation_warnings' in result:
            print(f"Warnings: {result['validation_warnings']}")

except Exception as e:
    print(f"❌ Exception: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()