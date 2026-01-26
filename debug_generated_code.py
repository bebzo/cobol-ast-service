#!/usr/bin/env python3
"""Debug script to examine the generated Python code from COBOL transpilation."""

import sys
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
print("DEBUGGING GENERATED PYTHON CODE")
print("=" * 80)

try:
    result = generate_python_code(cobol_with_bugs, enhance=False)

    if result.get('success'):
        python_code = result.get('python_code', '')
        
        # Write the generated code to a file for inspection
        with open('/workspace/generated_debug.py', 'w') as f:
            f.write(python_code)
        
        print(f"\nGenerated code saved to /workspace/generated_debug.py")
        print(f"Code length: {len(python_code)} characters")
        
        # Find and print the problematic sections
        print("\n" + "="*80)
        print("PROBLEMATIC CODE SECTIONS:")
        print("="*80)
        
        lines = python_code.split('\n')
        problem_lines = []
        
        for i, line in enumerate(lines, 1):
            if ('p_999999999999,99' in line or 
                'self.upon' in line or 
                'self.sysout' in line or 
                'if True:' in line or 
                'self.with =' in line or 
                "'300 THRU 579'" in line or 
                '"300 THRU 579"' in line or
                '(10000, 0)' in line or
                '(0, 5)' in line or
                ',99' in line or  # Look for comma decimal issues
                ',00' in line or
                ',01' in line or
                ',5' in line):
                
                problem_lines.append((i, line.strip()))
        
        if problem_lines:
            for line_num, line_content in problem_lines:
                print(f"Line {line_num}: {line_content}")
        else:
            print("No obvious problematic lines found.")
            
        # Let's also look around line 1256 where we saw the issue
        print("\n" + "="*80)
        print("CONTEXT AROUND LINE 1256:")
        print("="*80)
        
        start = max(0, 1256-5)
        end = min(len(lines), 1256+5)
        
        for i in range(start, end):
            marker = ">>> " if i+1 == 1256 else "    "
            print(f"{marker}Line {i+1}: {lines[i]}")
            
    else:
        print(f"❌ Transpilation failed: {result.get('error', 'Unknown error')}")
        if 'validation_warnings' in result:
            print(f"Warnings: {result['validation_warnings']}")

except Exception as e:
    print(f"❌ Exception: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()