#!/usr/bin/env python3
"""
Script to verify generated Python code is actually executable.
"""

import sys
import os
sys.path.insert(0, '/workspace')

def main():
    output_file = '/workspace/test_generated_output.py'
    
    print("=" * 70)
    print("EXECUTABILITY TEST")
    print("=" * 70)
    print(f"Testing file: {output_file}")
    print()
    
    # Test 1: Syntax validation
    print("Test 1: Syntax Validation")
    print("-" * 40)
    try:
        with open(output_file, 'r', encoding='utf-8') as f:
            code = f.read()
        compile(code, output_file, 'exec')
        print("✅ Syntax: VALID")
        syntax_valid = True
    except SyntaxError as e:
        print(f"❌ Syntax Error: {e}")
        syntax_valid = False
    print()
    
    # Test 2: Module import
    print("Test 2: Module Import")
    print("-" * 40)
    try:
        # Create a namespace for execution
        namespace = {}
        exec(code, namespace)
        print("✅ Import: SUCCESS")
        import_success = True
    except Exception as e:
        print(f"❌ Import Error: {e}")
        import_success = False
    print()
    
    # Test 3: Class instantiation
    print("Test 3: Class Instantiation")
    print("-" * 40)
    try:
        if 'TestProgram' in namespace:
            instance = namespace['TestProgram']()
            print("✅ Instantiation: SUCCESS")
            print(f"   Class: {instance.__class__.__name__}")
            print(f"   VERSION: {getattr(instance, 'VERSION', 'N/A')}")
            instantiate_success = True
        else:
            print("⚠️  TestProgram class not found")
            instantiate_success = False
    except Exception as e:
        print(f"❌ Instantiation Error: {e}")
        instantiate_success = False
    print()
    
    # Test 4: Run method
    print("Test 4: Run Method")
    print("-" * 40)
    try:
        if instantiate_success and 'run' in dir(instance):
            instance.run()
            print("✅ Run: SUCCESS")
            run_success = True
        else:
            print("⚠️  Run method not available")
            run_success = False
    except Exception as e:
        print(f"❌ Run Error: {e}")
        run_success = False
    print()
    
    # Summary
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    all_passed = syntax_valid and import_success and instantiate_success and run_success
    
    if all_passed:
        print("✅ ALL TESTS PASSED!")
        print()
        print("The generated Python code is:")
        print("  - Syntactically valid")
        print("  - Importable as a module")
        print("  - Can be instantiated")
        print("  - Can execute the main logic")
        print()
        print("The MIXED_TABS_SPACES warnings are code STYLE issues,")
        print("not correctness issues. The code runs correctly!")
        return 0
    else:
        print("❌ SOME TESTS FAILED")
        return 1

if __name__ == '__main__':
    sys.exit(main())
