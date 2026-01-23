#!/usr/bin/env python3
"""
Test de validation pour la fonction _escape_for_python_string
"""

import sys
sys.path.insert(0, '/workspace')

from api.transpile import _escape_for_python_string

def test_escape_basic():
    """Test basique avec une chaîne simple"""
    result = _escape_for_python_string("hello")
    # repr() utilise des guillemets simples par défaut en Python 3
    expected = "'hello'"
    assert result == expected, f"Attendu: {expected}, Obtenu: {result}"
    print(f"✓ test_escape_basic passed: {result}")

def test_escape_newline():
    """Test avec un saut de ligne"""
    result = _escape_for_python_string("hello\nworld")
    expected = "'hello\\nworld'"
    assert result == expected, f"Attendu: {expected}, Obtenu: {result}"
    print(f"✓ test_escape_newline passed: {result}")

def test_escape_quotes():
    """Test avec des guillemets"""
    result = _escape_for_python_string('say "hello"')
    # repr() utilise des guillemets simples et n'échappe pas les guillemets doubles internes
    expected = "'say \"hello\"'"
    assert result == expected, f"Attendu: {expected}, Obtenu: {result}"
    print(f"✓ test_escape_quotes passed: {result}")

def test_escape_backslash():
    """Test avec un backslash"""
    result = _escape_for_python_string("path\\to\\file")
    expected = "'path\\\\to\\\\file'"
    assert result == expected, f"Attendu: {expected}, Obtenu: {result}"
    print(f"✓ test_escape_backslash passed: {result}")

def test_escape_single_line_literal():
    """Test reproduisant le cas original: SINGLE LINE\\n"""
    # La chaîne "SINGLE LINE\n" (avec真正的saut de ligne) devrait être échappée
    literal_string = "SINGLE LINE\\n"  # Ceci est la chaîne littérale avec backslash-n
    result = _escape_for_python_string(literal_string)
    # Devrait produire '"SINGLE LINE\\n"' qui est valide en Python
    print(f"✓ test_single_line_literal: {result}")
    # Vérifier que le résultat est du Python valide
    try:
        eval(result)  # Devrait être une chaîne Python valide
        print(f"  Le résultat est du Python valide: {repr(eval(result))}")
    except SyntaxError as e:
        print(f"  ERREUR: Le résultat n'est pas du Python valide: {e}")
        raise

def test_full_integration():
    """Test d'intégration complet simulant la génération de tests"""
    # Simuler la liste de tests
    tests = []
    tests.append('def test_example():')
    tests.append(f'    f.write({_escape_for_python_string("SINGLE LINE\\n")})')
    tests.append('    return True')

    # Joindre les lignes
    generated_code = '\n'.join(tests)

    print("\n--- Code généré ---")
    print(generated_code)
    print("--- Fin du code généré ---\n")

    # Vérifier que le code généré est du Python valide
    try:
        compile(generated_code, '<string>', 'exec')
        print("✓ test_full_integration: Le code généré est du Python valide!")
    except SyntaxError as e:
        print(f"✗ test_full_integration: ERREUR de syntaxe: {e}")
        raise

if __name__ == '__main__':
    print("=== Tests de validation de _escape_for_python_string ===\n")

    test_escape_basic()
    test_escape_newline()
    test_escape_quotes()
    test_escape_backslash()
    test_escape_single_line_literal()
    test_full_integration()

    print("\n=== Tous les tests ont réussi! ===")
