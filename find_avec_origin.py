#!/usr/bin/env python3
"""
Recherche de l'origine de 'self.avec' dans le code généré
"""

from api.transpile import generate_python_code

cobol_file = '/workspace/user_input_files/pasted-text-2026-01-12T16-26-02.txt'

with open(cobol_file, 'r') as f:
    cobol_code = f.read()

result = generate_python_code(cobol_code, enhance=False)
python_code = result['python_code']

lines = python_code.split('\n')

# Rechercher 'self.avec' dans le code généré
for i, line in enumerate(lines, 1):
    if 'self.avec' in line:
        print(f"Ligne {i}: {line}")
        # Afficher le contexte
        for j in range(max(0, i-3), min(len(lines), i+3)):
            prefix = ">>>" if j+1 == i else "   "
            print(f"  {prefix} {j+1}: {lines[j][:120]}")
        print()
