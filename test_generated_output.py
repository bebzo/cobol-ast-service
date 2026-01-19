#!/usr/bin/env python3
"""
Test that the generated unit tests can be executed by pytest.
This verifies that the self-contained test file works correctly.
"""

import sys
import subprocess
import tempfile
import os

sys.path.insert(0, '/workspace/api')
from transpile import generate_python_code

SAMPLE_COBOL = """
       IDENTIFICATION DIVISION.
       PROGRAM-ID. TESTPROG.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-AMOUNT         PIC 9(9)V99 VALUE 100.00.
       01 WS-RATE           PIC 9V9(4)  VALUE 0.05.
       01 WS-RESULT         PIC 9(9)V99 VALUE ZEROS.
       01 WS-COUNT          PIC 9(5)    VALUE 0.
       
       01 WS-FLAG           PIC X       VALUE 'N'.
          88 WS-ACTIVE      VALUE 'Y'.
          88 WS-INACTIVE    VALUE 'N'.
       
       PROCEDURE DIVISION.
       
       0000-MAIN.
           PERFORM 1000-CALCULATE
           STOP RUN.
       
       1000-CALCULATE.
           COMPUTE WS-RESULT = WS-AMOUNT * WS-RATE
           ADD 1 TO WS-COUNT
           DISPLAY "RESULT: " WS-RESULT.
"""

def main():
    print("=" * 60)
    print("PYTEST EXECUTION TEST")
    print("=" * 60)
    
    # Generate code and tests
    result = generate_python_code(SAMPLE_COBOL, enhance=False)
    
    if not result['success']:
        print(f"[FAIL] Transpiler failed: {result.get('error')}")
        return 1
    
    test_code = result['unit_tests']
    
    # Write to a temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='_test.py', delete=False) as f:
        f.write(test_code)
        test_file = f.name
    
    print(f"[INFO] Test file: {test_file}")
    print(f"[INFO] Test file size: {len(test_code)} chars")
    
    try:
        # Run pytest with a timeout
        proc = subprocess.run(
            ['python', '-m', 'pytest', test_file, '-v', '--tb=short', '-x', '--timeout=30'],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        print("\n--- PYTEST OUTPUT ---")
        print(proc.stdout[-3000:] if len(proc.stdout) > 3000 else proc.stdout)
        
        if proc.stderr:
            print("\n--- STDERR ---")
            print(proc.stderr[-1000:])
        
        if proc.returncode == 0:
            print("\n[SUCCESS] All pytest tests passed!")
            return 0
        else:
            print(f"\n[WARNING] Some tests failed (exit code: {proc.returncode})")
            return 1
            
    except subprocess.TimeoutExpired:
        print("[ERROR] Pytest timed out")
        return 1
    except Exception as e:
        print(f"[ERROR] {e}")
        return 1
    finally:
        # Cleanup
        try:
            os.unlink(test_file)
        except:
            pass

if __name__ == '__main__':
    sys.exit(main())
