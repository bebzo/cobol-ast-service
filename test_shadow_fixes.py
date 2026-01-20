#!/usr/bin/env python3
"""
Test Script for Shadow Test Fixes
Vérifie que les corrections pour "unterminated string literal" et "Function signature mismatch" fonctionnent.

Auteur: MiniMax Agent
"""

import sys
import os

# Ajouter le répertoire courant au path
sys.path.insert(0, '/workspace')

def test_escape_python_string():
    """Test de la fonction escape_python_string_for_template"""
    print("=" * 60)
    print("TEST 1: escape_python_string_for_template()")
    print("=" * 60)
    
    from api.transpile import escape_python_string_for_template
    
    # Test avec des caractères spéciaux
    test_cases = [
        ('print("hello")', 'print(\\"hello\\")'),
        ("line1\nline2", 'line1\\nline2'),
        ('quote "test"', 'quote \\"test\\"'),
        ('backslash \\ path', 'backslash \\\\ path'),
        ("single 'quote'", "single \\'quote\\'"),
    ]
    
    all_passed = True
    for input_str, expected in test_cases:
        result = escape_python_string_for_template(input_str)
        if result == expected:
            print(f"✓ PASS: {repr(input_str)}")
        else:
            print(f"✗ FAIL: {repr(input_str)}")
            print(f"  Attendu: {repr(expected)}")
            print(f"  Obtenu:  {repr(result)}")
            all_passed = False
    
    return all_passed


def test_analyze_function_type():
    """Test de la fonction analyze_function_type"""
    print("\n" + "=" * 60)
    print("TEST 2: analyze_function_type()")
    print("=" * 60)
    
    from api.transpile import analyze_function_type
    
    test_cases = [
        # Context managers
        ('localcontext', '', 'context_manager'),
        ('supabase_client', '', 'context_manager'),
        
        # Stubs
        ('call_external_api', 'raise NotImplementedError', 'stub'),
        ('call_auth_service', 'raise NotImplementedError("auth")', 'stub'),
        
        # No args functions
        ('get_cobol_context', 'def get_cobol_context():', 'no_args'),
        ('get_context', 'def get_context(): pass', 'no_args'),
        
        # Normal functions
        ('process_data', 'def process_data(self, value):', 'normal'),
        ('calculate_total', 'def calculate_total(self, amount, rate):', 'normal'),
    ]
    
    all_passed = True
    for func_name, func_code, expected_type in test_cases:
        result = analyze_function_type(func_name, func_code)
        actual_type = result['type']
        if actual_type == expected_type:
            print(f"✓ PASS: {func_name} -> {actual_type}")
        else:
            print(f"✗ FAIL: {func_name}")
            print(f"  Attendu: {expected_type}")
            print(f"  Obtenu:  {actual_type}")
            all_passed = False
    
    return all_passed


def test_generate_appropriate_test():
    """Test de la fonction generate_appropriate_test"""
    print("\n" + "=" * 60)
    print("TEST 3: generate_appropriate_test()")
    print("=" * 60)
    
    from api.transpile import generate_appropriate_test
    
    test_cases = [
        ('localcontext', {'type': 'context_manager', 'test_pattern': 'context_manager'}),
        ('call_external_api', {'type': 'stub', 'test_pattern': 'skip'}),
        ('get_cobol_context', {'type': 'no_args', 'test_pattern': 'no_args'}),
        ('process_data', {'type': 'normal', 'test_pattern': 'boundary_values'}),
    ]
    
    all_passed = True
    for func_name, func_type_info in test_cases:
        result = generate_appropriate_test(func_name, func_type_info)
        
        # Vérifier que le test contient le nom de la fonction
        if f'test_{func_name}' in result:
            print(f"✓ PASS: {func_name} - test généré correctement")
        else:
            print(f"✗ FAIL: {func_name} - test non généré")
            all_passed = False
        
        # Vérifier le type de test approprié
        if func_type_info['type'] == 'context_manager':
            if 'with ' in result and '__enter__' in result:
                print(f"✓ PASS: {func_name} - context manager test")
            else:
                print(f"✗ FAIL: {func_name} - wrong context manager test")
                all_passed = False
        elif func_type_info['type'] == 'stub':
            if 'pytest.skip' in result and 'stub' in result:
                print(f"✓ PASS: {func_name} - stub test")
            else:
                print(f"✗ FAIL: {func_name} - wrong stub test")
                all_passed = False
    
    return all_passed


def test_import_transpile():
    """Test que le module transpile peut être importé avec les nouvelles fonctions"""
    print("\n" + "=" * 60)
    print("TEST 4: Import du module transpile avec les nouvelles fonctions")
    print("=" * 60)
    
    try:
        from api.transpile import (
            escape_python_string_for_template,
            analyze_function_type,
            generate_appropriate_test
        )
        print("✓ PASS: Toutes les fonctions importées avec succès")
        return True
    except ImportError as e:
        print(f"✗ FAIL: Erreur d'import - {e}")
        return False


def main():
    """Point d'entrée principal"""
    print("\n" + "=" * 60)
    print("SHADOW TEST FIXES - SUITE DE TESTS")
    print("=" * 60)
    
    results = []
    
    # Exécuter les tests
    results.append(("Import", test_import_transpile()))
    results.append(("escape_python_string", test_escape_python_string()))
    results.append(("analyze_function_type", test_analyze_function_type()))
    results.append(("generate_appropriate_test", test_generate_appropriate_test()))
    
    # Résumé
    print("\n" + "=" * 60)
    print("RÉSUMÉ DES TESTS")
    print("=" * 60)
    
    passed = 0
    failed = 0
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print("-" * 40)
    print(f"Total: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("\n✅ Tous les tests ont réussi!")
        print("\nLes corrections sont prêtes à être intégrées.")
        return 0
    else:
        print(f"\n⚠️  {failed} test(s) ont échoué.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
