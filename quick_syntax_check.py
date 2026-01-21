#!/usr/bin/env python3
"""
Analyse ciblée des erreurs de syntaxe
"""

from api.transpile import generate_python_code

# Test un seul fichier problématique
cobol_file = '/workspace/user_input_files/pasted-text-2026-01-12T16-26-02.txt'

print(f"Analyse de: {cobol_file.split('/')[-1]}")

with open(cobol_file, 'r') as f:
    cobol_code = f.read()

print(f"COBOL: {len(cobol_code)} caractères")

result = generate_python_code(cobol_code, enhance=False)
python_code = result['python_code']

print(f"Python: {len(python_code)} caractères")

lines = python_code.split('\n')

# Tester la compilation
try:
    compile(python_code, '<python>', 'exec')
    print("✓ OK")
except SyntaxError as e:
    print(f"✗ Erreur ligne {e.lineno}: {e.msg}")
    
    # Afficher le contexte
    start = max(0, e.lineno - 3)
    end = min(len(lines), e.lineno + 2)
    
    for i in range(start, end):
        prefix = ">>>" if i + 1 == e.lineno else "   "
        print(f"  {prefix} {i+1:4d}: {lines[i][:100]}")
