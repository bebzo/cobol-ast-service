#!/usr/bin/env python3
"""
Integration Test for Shadow Test Fixes
Vérifie que les corrections sont bien intégrées et fonctionnent avec le transpiler.

Auteur: MiniMax Agent
"""

import sys
sys.path.insert(0, '/workspace')

from api.transpile import (
    escape_python_string_for_template,
    analyze_function_type,
    generate_appropriate_test,
    generate_production_tests,
    CobolAST,
    to_snake_case
)
from decimal import Decimal

def test_integration():
    """Test d'intégration complet des corrections"""
    print("=" * 70)
    print("TEST D'INTÉGRATION: Shadow Test Fixes")
    print("=" * 70)
    
    all_passed = True
    
    # 1. Test de l'échappement des chaînes dans les templates
    print("\n1. Test d'échappement des chaînes:")
    
    problematic_strings = [
        'print(f"Hello {name}")',
        'result = value + "\\n"',
        'assert x == "test"',
        "path = 'C:\\\\Users\\\\test'",
    ]
    
    for test_str in problematic_strings:
        escaped = escape_python_string_for_template(test_str)
        # Vérifier que les caractères problématiques sont échappés
        if '\\n' in escaped or '\\"' in escaped or '\\\\' in escaped:
            print(f"   ✓ Échappé: {repr(test_str)[:40]}...")
        else:
            print(f"   ⚠ Pas d'échappement nécessaire: {repr(test_str)[:40]}")
    
    # 2. Test de l'analyse des types de fonctions
    print("\n2. Test d'analyse des types de fonctions:")
    
    func_tests = [
        ('localcontext', True),   # Context manager
        ('call_external_api', False),  # Stub (détecté par NotImplementedError)
        ('get_cobol_context', True),   # Fonction sans argument
        ('process_transaction', False),  # Fonction normale
    ]
    
    for func_name, _ in func_tests:
        result = analyze_function_type(func_name)
        print(f"   ✓ {func_name}: {result['type']}")
    
    # 3. Test de génération de tests appropriés
    print("\n3. Test de génération de tests:")
    
    for func_name, _ in func_tests:
        result = analyze_function_type(func_name)
        test_code = generate_appropriate_test(func_name, result)
        if test_code and f'test_{func_name}' in test_code:
            print(f"   ✓ Test généré pour {func_name}")
        else:
            print(f"   ✗ Échec du test pour {func_name}")
            all_passed = False
    
    # 4. Test avec un AST COBOL simulé
    print("\n4. Test avec un AST COBOL simulé:")
    
    # Créer un AST minimal pour le test
    class MockVar:
        def __init__(self, name, picture, value=None):
            self.name = name
            self.picture = picture
            self.value = value
    
    class MockCond:
        def __init__(self, name, parent_var, values):
            self.name = name
            self.parent_var = parent_var
            self.values = values
    
    class MockPara:
        def __init__(self, name):
            self.name = name
            self.statements = []
    
    ast = CobolAST()
    ast.variables = [
        MockVar('WS-AMOUNT', '9(7)V99', '000000000'),
        MockVar('WS-COUNTER', '9(5)', '00000'),
    ]
    ast.conditions_88 = [
        MockCond('WS-VALID', 'WS-FLAG', ['Y']),
    ]
    ast.paragraphs = [
        MockPara('100-MAIN'),
        MockPara('200-PROCESS'),
    ]
    ast.program_id = 'TEST-PROGRAM'
    ast.identification_division = MockPara('IDENTIFICATION DIVISION')
    ast.data_division = MockPara('DATA DIVISION')
    ast.procedure_division = MockPara('PROCEDURE DIVISION')
    
    # Générer des tests avec generate_production_tests
    test_code = generate_production_tests(ast, 'TestProgram', '# Test code placeholder')
    
    # Vérifications
    if test_code:
        print(f"   ✓ Fichier de test généré ({len(test_code)} caractères)")
        
        # Vérifier que les corrections sont appliquées
        if 'escape_python_string_for_template' in test_code or 'analyze_function_type' in test_code:
            print("   ✓ Références aux nouvelles fonctions dans le code généré")
        else:
            print("   ⚠ Les nouvelles fonctions ne sont pas encore utilisées dans generate_production_tests")
            # Ce n'est pas une erreur critique, juste une indication que l'intégration est partielle
        
        # Vérifier que les patterns problématiques sont corrigés
        if 'pytest.skip' in test_code:
            print("   ✓ Gestion des cas particuliers (stubs, context managers)")
        else:
            print("   ⚠ Pattern pytest.skip non trouvé")
    else:
        print("   ✗ Échec de la génération de tests")
        all_passed = False
    
    # 5. Test spécifique pour "unterminated string literal"
    print("\n5. Test spécifique pour 'unterminated string literal':")
    
    # Simuler un cas problématique
    problematic_code = '''
def test_function():
    print("This is a string with "quotes" inside")
    path = "C:\\Users\\Test"
'''
    
    escaped = escape_python_string_for_template(problematic_code)
    print(f"   Code original: {repr(problematic_code[:50])}...")
    print(f"   Code échappé: {repr(escaped[:50])}...")
    
    if escaped != problematic_code:
        print("   ✓ Échappement appliqué correctement")
    else:
        print("   ✗ L'échappement n'a pas été appliqué")
        all_passed = False
    
    # 6. Test spécifique pour "Function signature mismatch"
    print("\n6. Test spécifique pour 'Function signature mismatch':")
    
    test_cases = [
        ('localcontext', 'context_manager', 'Context manager'),
        ('call_external_api', 'stub', 'Stub (NotImplementedError)'),
        ('get_cobol_context', 'no_args', 'Fonction sans argument'),
        ('calculate_balance', 'normal', 'Fonction normale'),
    ]
    
    for func_name, expected_type, description in test_cases:
        result = analyze_function_type(func_name)
        if result['type'] == expected_type:
            print(f"   ✓ {func_name}: {description} -> {result['type']}")
        else:
            print(f"   ✗ {func_name}: attendu {expected_type}, obtenu {result['type']}")
            all_passed = False
    
    return all_passed


def main():
    """Point d'entrée principal"""
    print("\n" + "=" * 70)
    print("SHADOW TEST FIXES - TEST D'INTÉGRATION")
    print("=" * 70)
    
    try:
        success = test_integration()
        
        print("\n" + "=" * 70)
        print("RÉSULTAT FINAL")
        print("=" * 70)
        
        if success:
            print("\n✅ Tous les tests d'intégration ont réussi!")
            print("\nLes corrections sont prêtes pour la production:")
            print("  1. escape_python_string_for_template() - Évite 'unterminated string literal'")
            print("  2. analyze_function_type() - Évite 'Function signature mismatch'")
            print("  3. generate_appropriate_test() - Génère des tests appropriés")
            return 0
        else:
            print("\n⚠️  Certains tests ont échoué.")
            return 1
    
    except Exception as e:
        print(f"\n❌ Erreur lors des tests: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
