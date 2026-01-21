#!/usr/bin/env python3
"""
Debug script to find the source of the 'decimal.Decimal' object is not callable error.
"""
import sys
sys.path.insert(0, '/workspace')

from api.transpile import generate_python_code

# Read the COBOL file
with open('/workspace/user_input_files/5claude_cobol_test.txt', 'r') as f:
    cobol_source = f.read()

print("Testing COBOL transpilation...")
print(f"COBOL file size: {len(cobol_source)} characters")

try:
    result = generate_python_code(cobol_source)
    
    print(f"\nSuccess: {result.get('success', False)}")
    print(f"Python code lines: {len(result.get('python_code', '').splitlines())}")
    print(f"Test code lines: {len(result.get('unit_tests', '').splitlines())}")
    
    # Check for the pattern that might cause the error
    test_code = result.get('unit_tests', '')
    
    print("\nSearching for potential issues in test code...")
    
    # Look for Decimal(...) patterns where something might be wrong
    lines = test_code.split('\n')
    for i, line in enumerate(lines, 1):
        if 'Decimal(' in line and i >= 2190 and i <= 2200:
            print(f"Line {i}: {line[:100]}")
    
    # Save the test code for inspection
    with open('/workspace/test_output_debug.py', 'w') as f:
        f.write(test_code)
    print(f"\nTest code saved to /workspace/test_output_debug.py")
    print(f"Total lines: {len(lines)}")
    
    # Try to compile the test code to see if there's a syntax error
    print("\nTrying to compile test code...")
    try:
        compile(test_code, '<test>', 'exec')
        print("Test code compiles successfully!")
    except SyntaxError as e:
        print(f"SYNTAX ERROR: {e}")
        print(f"Error at line {e.lineno}: {lines[e.lineno-1] if e.lineno and e.lineno <= len(lines) else 'N/A'}")
        
except Exception as e:
    print(f"Error during transpilation: {e}")
    import traceback
    traceback.print_exc()
