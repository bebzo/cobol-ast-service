#!/usr/bin/env python3
"""
Analyse de l'erreur d'indentation dans un fichier problématique
"""

from api.transpile import generate_python_code
import ast

# Lire le fichier problématique
with open('/workspace/user_input_files/pasted-text-2026-01-11T07-56-56.txt', 'r') as f:
    cobol_code = f.read()

print(f"Fichier COBOL chargé: {len(cobol_code)} caractères")

# Effectuer la transpilation
result = generate_python_code(cobol_code, enhance=False)

python_code = result['python_code']
lines = python_code.split('\n')

# Afficher les lignes autour de l'erreur (ligne 2282)
error_line = 2282
print(f"\n=== Analyse de l'erreur à la ligne {error_line} ===")
print(f"Ligne {error_line}: {lines[error_line-1][:200]}")

# Vérifier l'indentation des lignes précédentes
print("\n=== Lignes avec indentation suspecte (> 50 espaces) ===")
for i in range(max(0, error_line - 20), min(len(lines), error_line + 5)):
    line = lines[i]
    indent = len(line) - len(line.lstrip())
    if indent > 50:
        print(f"Ligne {i+1} (indent={indent}): {line[:100]}")

# Analyser la structure du code AST
print("\n=== Analyse AST ===")
try:
    ast.parse(python_code)
    print("✓ AST parsing successful")
except SyntaxError as e:
    print(f"✗ AST parsing failed: {e}")
    print(f"  Ligne: {e.lineno}")
    print(f"  Offset: {e.offset}")
    if e.lineno:
        print(f"  Contenu: {lines[e.lineno-1][:200]}")
