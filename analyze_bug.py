#!/usr/bin/env python3
"""
Analyse des comparaisons Decimal dans le code généré
"""

from api.transpile import generate_python_code
import re

# Lire le fichier COBOL
with open('/workspace/user_input_files/5claude_cobol_test.txt', 'r') as f:
    cobol_code = f.read()

print(f"Fichier COBOL chargé: {len(cobol_code)} caractères")

# Effectuer la transpilation
result = generate_python_code(cobol_code, enhance=False)

print(f"Code Python généré: {len(result['python_code'])} caractères")
print(f"Tests générés: {len(result['unit_tests'])} caractères")

# Chercher les comparaisons Decimal avec des chaînes non échappées
decimal_comparisons = re.findall(r"Decimal\('[^\']*'\)", result['python_code'])
print(f"\nTrouvé {len(decimal_comparisons)} comparaisons Decimal (avec guillemets simples) dans le code principal")

# Chercher les comparaisons Decimal dans les tests
test_decimal_comparisons = re.findall(r"Decimal\('[^\']*'\)", result['unit_tests'])
print(f"Trouvé {len(test_decimal_comparisons)} comparaisons Decimal (avec guillemets simples) dans les tests")

# Afficher quelques exemples problématiques
if decimal_comparisons:
    print('\nExemples de comparaisons Decimal dans le code principal:')
    for comp in decimal_comparisons[:10]:
        print(f'  {comp}')

if test_decimal_comparisons:
    print('\nExemples de comparaisons Decimal dans les tests:')
    for comp in test_decimal_comparisons[:10]:
        print(f'  {comp}')

# Vérifier la compilation du code Python
print("\n=== Vérification du code Python ===")
try:
    compile(result['python_code'], '<python>', 'exec')
    print("✓ Compilation Python: OK")
except SyntaxError as e:
    print(f"✗ Erreur SyntaxError Python: {e}")
    print(f"  Ligne {e.lineno}")

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
        print(f"  {prefix} {i+1:4d}: {lines[i][:100]}")
except TypeError as e:
    print(f"✗ Erreur TypeError Tests: {e}")
