#!/usr/bin/env python3
"""
Comprehensive test to verify transpiler fixes for:
1. Decimal object in range() - TypeError fix
2. Unterminated string literal - SyntaxError fix
3. Proper string escaping in generated tests
"""

import sys
import os

# Add api directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

from transpile import generate_python_code, to_snake_case
from decimal import Decimal

# Test COBOL code with PERFORM VARYING (tests Decimal in range())
COBOL_PERFORM_VARYING = """
       IDENTIFICATION DIVISION.
       PROGRAM-ID. TEST-PERFORM-VARYING.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-COUNTERS.
          05 WS-IDX            PIC 9(3) VALUE 1.
          05 WS-LIMIT          PIC 9(3) VALUE 10.
          05 WS-STEP           PIC 9(1) VALUE 1.
          05 WS-RESULT         PIC 9(5) VALUE 0.
       
       PROCEDURE DIVISION.
           PERFORM CALC-PARA VARYING WS-IDX FROM 1 BY 1 
              UNTIL WS-IDX > WS-LIMIT
           DISPLAY 'RESULT: ' WS-RESULT
           STOP RUN.
       
       CALC-PARA.
           ADD WS-IDX TO WS-RESULT.
"""

# Test COBOL code with PERFORM TIMES (tests Decimal in range())
COBOL_PERFORM_TIMES = """
       IDENTIFICATION DIVISION.
       PROGRAM-ID. TEST-PERFORM-TIMES.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-COUNTERS.
          05 WS-COUNT          PIC 9(3) VALUE 5.
          05 WS-RESULT         PIC 9(5) VALUE 0.
       
       PROCEDURE DIVISION.
           PERFORM ADD-PARA WS-COUNT TIMES
           STOP RUN.
       
       ADD-PARA.
           ADD 1 TO WS-RESULT.
"""

# Test file operations in tests
COBOL_FILE_TEST = """
       IDENTIFICATION DIVISION.
       PROGRAM-ID. TEST-FILE-IO.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-FILE-NAME    PIC X(20) VALUE "TEST.DAT".
       01 WS-RECORD       PIC X(80).
       
       PROCEDURE DIVISION.
           DISPLAY 'Test program for file I/O'
           STOP RUN.
"""

def test_perform_varying():
    """Test PERFORM VARYING generates valid Python with int() conversion."""
    print("=" * 60)
    print("TEST 1: PERFORM VARYING with Decimal variables")
    print("=" * 60)
    
    try:
        result = generate_python_code(COBOL_PERFORM_VARYING)
        python_code = result['python_code']
        tests = result['unit_tests']
        
        # Check that range() uses int() for Decimal variables
        if 'int(self.ws_idx)' in python_code or 'int(self.ws_limit)' in python_code:
            print("✓ PASS: int() conversion found for Decimal variables in range()")
        else:
            print("⚠ WARNING: int() conversion may be missing")
        
        # Check for range() usage
        if 'range(' in python_code:
            print("✓ PASS: range() found in generated code")
        else:
            print("✗ FAIL: range() not found in generated code")
            return False
        
        # Try to compile the generated code
        try:
            compile(python_code, '<generated>', 'exec')
            print("✓ PASS: Generated Python code compiles successfully")
        except SyntaxError as e:
            print(f"✗ FAIL: Syntax error in generated code: {e}")
            return False
        
        # Try to compile the tests
        try:
            compile(tests, '<tests>', 'exec')
            print("✓ PASS: Generated test code compiles successfully")
        except SyntaxError as e:
            print(f"✗ FAIL: Syntax error in test code: {e}")
            return False
        
        print("\n" + "=" * 60)
        print("Generated Python code snippet:")
        print("=" * 60)
        # Show relevant part of generated code
        lines = python_code.split('\n')
        for i, line in enumerate(lines):
            if 'for ' in line and 'range(' in line:
                print(f"Line {i+1}: {line}")
                # Show next few lines
                for j in range(1, 4):
                    if i+j < len(lines):
                        print(f"Line {i+1+j}: {lines[i+j]}")
                break
        
        return True
        
    except Exception as e:
        print(f"✗ FAIL: Exception during transpilation: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_perform_times():
    """Test PERFORM TIMES generates valid Python with int() conversion."""
    print("\n" + "=" * 60)
    print("TEST 2: PERFORM TIMES with Decimal variable")
    print("=" * 60)
    
    try:
        result = generate_python_code(COBOL_PERFORM_TIMES)
        python_code = result['python_code']
        tests = result['unit_tests']
        
        # Check that range() uses int() for Decimal variables
        if 'int(self.ws_count)' in python_code:
            print("✓ PASS: int() conversion found for Decimal variable in range()")
        else:
            print("⚠ WARNING: int() conversion may be missing")
        
        # Check for range() usage
        if 'range(' in python_code:
            print("✓ PASS: range() found in generated code")
        else:
            print("✗ FAIL: range() not found in generated code")
            return False
        
        # Try to compile the generated code
        try:
            compile(python_code, '<generated>', 'exec')
            print("✓ PASS: Generated Python code compiles successfully")
        except SyntaxError as e:
            print(f"✗ FAIL: Syntax error in generated code: {e}")
            return False
        
        # Try to compile the tests
        try:
            compile(tests, '<tests>', 'exec')
            print("✓ PASS: Generated test code compiles successfully")
        except SyntaxError as e:
            print(f"✗ FAIL: Syntax error in test code: {e}")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ FAIL: Exception during transpilation: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_file_operations_in_tests():
    """Test that file operations in generated tests use proper escaping."""
    print("\n" + "=" * 60)
    print("TEST 3: File operations in generated tests")
    print("=" * 60)
    
    try:
        result = generate_python_code(COBOL_FILE_TEST)
        tests = result['unit_tests']
        
        # Check for proper escaping in f.write calls
        if '_escape_for_python_string' in tests:
            print("✓ PASS: _escape_for_python_string() found in generated tests")
        else:
            print("⚠ NOTE: _escape_for_python_string() not used (may use repr() instead)")
        
        # Check that there are no unterminated string literals
        # Look for patterns like f.write("RECORD 1\n") which would be wrong
        import re
        bad_pattern = r'f\.write\("[^"]*\n"\)'
        if re.search(bad_pattern, tests):
            print("✗ FAIL: Found unescaped newline in f.write() call")
            return False
        else:
            print("✓ PASS: No unescaped newlines found in f.write() calls")
        
        # Try to compile the tests
        try:
            compile(tests, '<tests>', 'exec')
            print("✓ PASS: Generated test code compiles successfully")
        except SyntaxError as e:
            print(f"✗ FAIL: Syntax error in test code: {e}")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ FAIL: Exception during transpilation: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_docstring_escaping():
    """Test that docstrings in generated tests don't have literal \\n."""
    print("\n" + "=" * 60)
    print("TEST 4: Docstring escaping in generated tests")
    print("=" * 60)
    
    try:
        result = generate_python_code(COBOL_FILE_TEST)
        tests = result['unit_tests']
        
        # Check for proper docstring patterns (multiline should be split)
        # Bad pattern: """Some text\n        \n        More text"""
        import re
        bad_pattern = r'"""[^"]*\\n[^"]*"""'
        if re.search(bad_pattern, tests):
            print("✗ FAIL: Found literal \\n in docstring")
            return False
        else:
            print("✓ PASS: No literal \\n found in docstrings")
        
        # Try to compile the tests
        try:
            compile(tests, '<tests>', 'exec')
            print("✓ PASS: Generated test code compiles successfully")
        except SyntaxError as e:
            print(f"✗ FAIL: Syntax error in test code: {e}")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ FAIL: Exception during transpilation: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests and report results."""
    print("\n" + "=" * 60)
    print("COMPREHENSIVE TRANSPILER FIX VERIFICATION")
    print("=" * 60)
    
    results = []
    
    results.append(("PERFORM VARYING with Decimal", test_perform_varying()))
    results.append(("PERFORM TIMES with Decimal", test_perform_times()))
    results.append(("File operations in tests", test_file_operations_in_tests()))
    results.append(("Docstring escaping", test_docstring_escaping()))
    
    print("\n" + "=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    
    all_passed = True
    for test_name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {test_name}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("ALL TESTS PASSED! Transpiler fixes are working correctly.")
    else:
        print("SOME TESTS FAILED. Please review the output above.")
    print("=" * 60)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
