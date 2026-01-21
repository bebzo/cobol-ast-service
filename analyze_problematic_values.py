#!/usr/bin/env python3
"""
Analyse des valeurs potentiellement problématiques dans le code généré
"""

from api.transpile import generate_python_code
import re

# Lire le fichier COBOL problématique
with open('/workspace/user_input_files/5claude_cobol_test.txt', 'r') as f:
    cobol_code = f.read()

print(f"Fichier COBOL chargé: {len(cobol_code)} caractères")

# Effectuer la transpilation
result = generate_python_code(cobol_code, enhance=False)

# Chercher les comparaisons Decimal avec des valeurs non numériques
# Ces valeurs pourraient contenir des caractères spéciaux comme des apostrophes

# Pattern: Decimal(' suivie d'un caractère non-numérique (potentiellement problématique)
problematic_pattern = r"Decimal\('([^']*'[^']*|[^']*[^0-9.\-])"

problematic_main = re.findall(problematic_pattern, result['python_code'])
problematic_tests = re.findall(problematic_pattern, result['unit_tests'])

print(f"\nValeurs potentiellement problématiques dans le code principal: {len(problematic_main)}")
for val in problematic_main[:10]:
    print(f"  Contient: {val[:50]}")

print(f"\nValeurs potentiellement problématiques dans les tests: {len(problematic_tests)}")
for val in problematic_tests[:10]:
    print(f"  Contient: {val[:50]}")

# Chercher les comparaisons 88-level qui pourraient contenir des caractères spéciaux
pattern_88 = r"self\.[\w-]+ == Decimal\('([^']+)'\)"
comparisons_88 = re.findall(pattern_88, result['python_code'])

print(f"\nComparaisons 88-level avec Decimal: {len(comparisons_88)}")
non_numeric = [c for c in comparisons_88 if not re.match(r'^[0-9.\-]+$', c)]
print(f"Comparaisons avec valeurs non-numériques: {len(non_numeric)}")
for val in non_numeric[:10]:
    print(f"  Valeur: '{val}'")

# Afficher les lignes exactes autour de l'erreur pour le fichier COBOL de l'utilisateur
print("\n=== Analyse des lignes du fichier COBOL ===")

# Chercher les 88-level conditions dans le COBOL
lines = cobol_code.split('\n')
for i, line in enumerate(lines, 1):
    if '88' in line and 'VALUE' in line.upper():
        print(f"Ligne {i}: {line[:100]}")
