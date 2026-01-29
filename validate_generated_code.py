#!/usr/bin/env python3
"""
Validation script for the corrected generated Python code.
Tests for syntax errors, import issues, and class instantiation.
"""
import sys
import os

# Add the workspace directory to the path
sys.path.insert(0, '/workspace')

def test_syntax():
    """Test if the generated code has any syntax errors."""
    print("=" * 60)
    print("TEST 1: Syntax Validation")
    print("=" * 60)
    
    try:
        with open('/workspace/generated_code_corrected.py', 'r') as f:
            code = f.read()
        
        compile(code, 'generated_code_corrected.py', 'exec')
        print("[PASS] Syntax validation passed")
        return True
    except SyntaxError as e:
        print(f"[FAIL] Syntax Error: {e}")
        return False
    except Exception as e:
        print(f"[FAIL] Unexpected error: {e}")
        return False

def test_import():
    """Test if the module can be imported."""
    print("\n" + "=" * 60)
    print("TEST 2: Module Import")
    print("=" * 60)
    
    try:
        # We need to mock the supabase module since it might not be installed
        import types
        
        # Create a mock supabase module
        mock_supabase = types.ModuleType('supabase')
        mock_client = types.ModuleType('supabase.Client')
        mock_supabase.create_client = lambda url, key: None
        mock_supabase.Client = mock_client
        
        sys.modules['supabase'] = mock_supabase
        sys.modules['core.external_calls'] = types.ModuleType('core.external_calls')
        sys.modules['core.external_calls'].get_auth_module = lambda: None
        sys.modules['core.external_calls'].get_session_manager = lambda: None
        sys.modules['core.external_calls'].get_security_module = lambda: None
        sys.modules['core.external_calls'].get_metrics_module = lambda: None
        sys.modules['core.external_calls'].get_audit_module = lambda: None
        
        # Now import the generated code
        import generated_code_corrected
        
        print("[PASS] Module import successful")
        return generated_code_corrected
    except ImportError as e:
        print(f"[FAIL] Import Error: {e}")
        return False
    except Exception as e:
        print(f"[FAIL] Unexpected error during import: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_supabase_dal_instantiation(module):
    """Test if SupabaseDataAccessLayer can be instantiated with URL and key."""
    print("\n" + "=" * 60)
    print("TEST 3: SupabaseDataAccessLayer Instantiation")
    print("=" * 60)
    
    try:
        SupabaseDAL = module.SupabaseDataAccessLayer
        
        # Test with explicit parameters
        dal = SupabaseDAL(supabase_url='https://test.supabase.co', supabase_key='test-key')
        
        # Verify the attributes are set correctly
        assert dal._supabase_url == 'https://test.supabase.co', "URL not set correctly"
        assert dal._supabase_key == 'test-key', "Key not set correctly"
        assert hasattr(dal, '_files'), "Missing _files attribute"
        assert hasattr(dal, '_status'), "Missing _status attribute"
        
        print("[PASS] SupabaseDataAccessLayer instantiation with parameters: OK")
        print(f"  - URL: {dal._supabase_url}")
        print(f"  - Key: {dal._supabase_key[:10]}...")
        
        # Test with default parameters
        dal_default = SupabaseDAL()
        assert dal_default._supabase_url is None, "Default URL should be None"
        assert dal_default._supabase_key is None, "Default key should be None"
        
        print("[PASS] SupabaseDataAccessLayer instantiation with defaults: OK")
        return True
        
    except TypeError as e:
        print(f"[FAIL] TypeError (constructor issue): {e}")
        return False
    except AssertionError as e:
        print(f"[FAIL] Assertion failed: {e}")
        return False
    except Exception as e:
        print(f"[FAIL] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_complex_banking_system_instantiation(module):
    """Test if ComplexBankingSystem can be instantiated correctly."""
    print("\n" + "=" * 60)
    print("TEST 4: ComplexBankingSystem Instantiation")
    print("=" * 60)
    
    try:
        # Set environment variables for Supabase
        os.environ['SUPABASE_URL'] = 'https://test-project.supabase.co'
        os.environ['SUPABASE_KEY'] = 'test-anon-key'
        
        # Now instantiate ComplexBankingSystem
        system = module.ComplexBankingSystem()
        
        # Verify that the DAL is properly initialized
        assert hasattr(system, 'dal'), "Missing 'dal' attribute"
        assert isinstance(system.dal, module.SupabaseDataAccessLayer), "DAL is not SupabaseDataAccessLayer"
        assert system.dal._supabase_url == 'https://test-project.supabase.co', "DAL URL not set from env"
        assert system.dal._supabase_key == 'test-anon-key', "DAL key not set from env"
        
        print("[PASS] ComplexBankingSystem instantiation: OK")
        print(f"  - DAL Type: {type(system.dal).__name__}")
        print(f"  - DAL URL: {system.dal._supabase_url}")
        print(f"  - DAL Key: {system.dal._supabase_key[:10]}...")
        
        return True
        
    except TypeError as e:
        if "positional argument" in str(e):
            print(f"[FAIL] TypeError (constructor issue - parameters not accepted): {e}")
            print("       This indicates the SupabaseDataAccessLayer constructor is incorrect")
        else:
            print(f"[FAIL] TypeError: {e}")
        return False
    except AssertionError as e:
        print(f"[FAIL] Assertion failed: {e}")
        return False
    except Exception as e:
        print(f"[FAIL] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_dal_methods(module):
    """Test if DAL methods exist and are callable."""
    print("\n" + "=" * 60)
    print("TEST 5: DAL Methods Validation")
    print("=" * 60)
    
    try:
        dal = module.SupabaseDataAccessLayer('https://test.supabase.co', 'test-key')
        
        required_methods = ['open', 'read_record', 'write_record', 'rewrite_record', 'close', 'get_status', 'is_ok']
        
        for method_name in required_methods:
            assert hasattr(dal, method_name), f"Missing method: {method_name}"
            assert callable(getattr(dal, method_name)), f"Method {method_name} is not callable"
        
        print("[PASS] All required DAL methods exist and are callable:")
        for method_name in required_methods:
            print(f"  - {method_name}")
        
        # Test calling a method
        status = dal.open('test_file', 'INPUT')
        assert status == "00", f"Open should return '00', got {status}"
        print(f"[PASS] dal.open() returned correct status: {status}")
        
        return True
        
    except AssertionError as e:
        print(f"[FAIL] Assertion failed: {e}")
        return False
    except Exception as e:
        print(f"[FAIL] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all validation tests."""
    print("\n" + "=" * 60)
    print("VALIDATION OF GENERATED PYTHON CODE")
    print("File: generated_code_corrected.py")
    print("=" * 60 + "\n")
    
    results = []
    
    # Test 1: Syntax
    results.append(("Syntax Validation", test_syntax()))
    
    # Test 2: Import (only if syntax passed)
    if results[0][1]:
        module = test_import()
        results.append(("Module Import", module is not False))
        
        if module and module is not True:
            # Test 3: SupabaseDAL instantiation
            results.append(("SupabaseDAL Instantiation", test_supabase_dal_instantiation(module)))
            
            # Test 4: ComplexBankingSystem instantiation
            results.append(("ComplexBankingSystem Instantiation", test_complex_banking_system_instantiation(module)))
            
            # Test 5: DAL methods
            results.append(("DAL Methods Validation", test_dal_methods(module)))
    else:
        print("\n[SKIP] Cannot run import tests due to syntax/import errors")
        for i in range(3, 6):
            results.append((f"Test {i}", "SKIPPED"))
    
    # Summary
    print("\n" + "=" * 60)
    print("VALIDATION SUMMARY")
    print("=" * 60)
    
    passed = 0
    failed = 0
    skipped = 0
    
    for name, result in results:
        if result is True:
            status = "[PASS]"
            passed += 1
        elif result is False:
            status = "[FAIL]"
            failed += 1
        else:
            status = f"[{result}]"
            skipped += 1
        print(f"{status} {name}")
    
    print("-" * 60)
    print(f"Total: {passed} passed, {failed} failed, {skipped} skipped")
    print("=" * 60)
    
    if failed > 0:
        print("\n[RESULT] VALIDATION FAILED - Fix the issues above")
        sys.exit(1)
    else:
        print("\n[RESULT] ALL TESTS PASSED - Code is valid!")
        sys.exit(0)

if __name__ == '__main__':
    main()
