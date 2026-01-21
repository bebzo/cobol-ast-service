#!/usr/bin/env python3
"""
Test complet de tous les fichiers COBOL pour identifier les erreurs de transpilation
"""

import os
import glob
from api.transpile import generate_python_code

# Liste de tous les fichiers COBOL
cobol_files = glob.glob('/workspace/user_input_files/*.txt')

print(f"Nombre de fichiers COBOL à tester: {len(cobol_files)}")
print("=" * 80)

errors_found = []

for cobol_file in sorted(cobol_files):
    filename = os.path.basename(cobol_file)
    try:
        with open(cobol_file, 'r') as f:
            cobol_code = f.read()

        result = generate_python_code(cobol_code, enhance=False)

        # Check if transpilation was successful
        if not result.get('success', True):
            errors_found.append((filename, 'validation', result.get('error', 'Unknown validation error')))
            print(f"❌ {filename}: VALIDATION ERROR - {result.get('error', 'Unknown')}")
            continue
        
        if not result.get('python_code'):
            errors_found.append((filename, 'empty', 'No Python code generated'))
            print(f"❌ {filename}: No Python code generated")
            continue

        # Vérifier la compilation du code Python
        try:
            compile(result['python_code'], '<python>', 'exec')
        except SyntaxError as e:
            errors_found.append((filename, 'python_code', f"SyntaxError: {e}"))
            print(f"❌ {filename}: SyntaxError in Python code")

        # Vérifier la compilation des tests
        try:
            compile(result['unit_tests'], '<tests>', 'exec')
        except SyntaxError as e:
            errors_found.append((filename, 'unit_tests', f"SyntaxError: {e}"))
            print(f"❌ {filename}: SyntaxError in tests")
        except TypeError as e:
            errors_found.append((filename, 'unit_tests', f"TypeError: {e}"))
            print(f"❌ {filename}: TypeError in tests")

        print(f"✓ {filename}: OK")

    except Exception as e:
        errors_found.append((filename, 'exception', str(e)))
        print(f"❌ {filename}: ERREUR - {e}")

print("=" * 80)

if errors_found:
    print(f"\n⚠️  Fichiers avec erreurs: {len(errors_found)}")
    print("-" * 80)
    for filename, error_type, error_msg in errors_found:
        print(f"Fichier: {filename}")
        print(f"  Type: {error_type}")
        print(f"  Erreur: {error_msg[:200]}")
        print("-" * 40)
else:
    print("\n✓ Tous les fichiers COBOL ont été transpilés avec succès !")
