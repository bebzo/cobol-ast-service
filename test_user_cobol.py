#!/usr/bin/env python3
"""
Test du fichier COBOL problématique pour identifier l'erreur exacte
"""

from api.transpile import generate_python_code

# Lire le fichier COBOL
with open('/workspace/user_input_files/5claude_cobol_test.txt', 'r') as f:
    cobol_code = f.read()

print(f"Fichier COBOL chargé: {len(cobol_code)} caractères, {len(cobol_code.splitlines())} lignes")

# Effectuer la transpilation
result = generate_python_code(cobol_code, enhance=False)

print(f"Code Python généré: {len(result['python_code'])} caractères")
print(f"Tests générés: {len(result['unit_tests'])} caractères")

# Vérifier la compilation du code Python
print("\n=== Vérification du code Python ===")
try:
    compile(result['python_code'], '<python>', 'exec')
    print("✓ Compilation Python: OK")
except SyntaxError as e:
    print(f"✗ Erreur SyntaxError Python: {e}")
    print(f"  Ligne {e.lineno}: {result['python_code'].splitlines()[e.lineno-1] if e.lineno <= len(result['python_code'].splitlines()) else 'N/A'}")
except TypeError as e:
    print(f"✗ Erreur TypeError Python: {e}")

# Vérifier la compilation des tests
print("\n=== Vérification des tests ===")
try:
    compile(result['unit_tests'], '<tests>', 'exec')
    print("✓ Compilation Tests: OK")
except SyntaxError as e:
    print(f"✗ Erreur SyntaxError Tests: {e}")
    lines = result['unit_tests'].split('\n')
    print(f"\n  Contenu autour de la ligne {e.lineno}:")
    start = max(0, e.lineno - 5)
    end = min(len(lines), e.lineno + 3)
    for i in range(start, end):
        prefix = ">>>" if i + 1 == e.lineno else "   "
        print(f"  {prefix} {i+1:4d}: {lines[i]}")
except TypeError as e:
    print(f"✗ Erreur TypeError Tests: {e}")
    # Chercher "Decimal" dans le code de test
    lines = result['unit_tests'].split('\n')
    for i, line in enumerate(lines):
        if 'Decimal' in line and 'def ' not in line and 'from ' not in line:
            print(f"    Ligne {i+1}: {line.strip()}")
