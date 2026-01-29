#!/usr/bin/env python3
"""Test script to reproduce the syntax error at line 68"""

import subprocess
import sys

# Test with a simple COBOL file first
TEST_COBOL = """       IDENTIFICATION DIVISION.
       PROGRAM-ID. TESTPROG.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-COUNTER         PIC 9(3) VALUE 0.
       
       PROCEDURE DIVISION.
       0000-MAIN.
           MOVE 0 TO WS-COUNTER.
           PERFORM 1000-INCREMENT.
           DISPLAY "Counter: " WS-COUNTER.
           STOP RUN.
       
       1000-INCREMENT.
           ADD 1 TO WS-COUNTER.
"""

# Write test file
with open('/workspace/test_simple.cbl', 'w') as f:
    f.write(TEST_COBOL)

# Run transpiler
print("Testing transpilation...")
result = subprocess.run(
    ['python', '-c', '''
import sys
sys.path.insert(0, "/workspace")
from api.transpile import transpile_cobol

with open("/workspace/test_simple.cbl", "r") as f:
    cobol_code = f.read()

python_code = transpile_cobol(cobol_code)
print(python_code)
'''],
    capture_output=True,
    text=True,
    timeout=60
)

if result.returncode != 0:
    print("ERROR in transpilation:")
    print(result.stderr)
else:
    print("Transpilation successful!")
    # Check line 68
    lines = result.stdout.split('\n')
    print(f"\nTotal lines: {len(lines)}")
    if len(lines) >= 68:
        print(f"\nLine 68 content:")
        print(repr(lines[67]))  # line 68 is index 67
