#!/usr/bin/env python3
"""
Analyse des erreurs "invalid syntax" dans les fichiers problématiques
"""

from api.transpile import generate_python_code

# Fichiers problématiques
problematic_files = [
    '/workspace/user_input_files/pasted-text-2026-01-12T16-26-02.txt',
    '/workspace/user_input_files/pasted-text-2026-01-15T09-33-25.txt',
]

for cobol_file in problematic_files:
    filename = cobol_file.split('/')[-1]
    print(f"\n{'='*80}")
    print(f"Analyse de: {filename}")
    print('='*80)
    
    with open(cobol_file, 'r') as f:
        cobol_code = f.read()

    result = generate_python_code(cobol_code, enhance=False)
    
    python_code = result['python_code']
    test_code = result['unit_tests']
    
    # Analyser le code Python
    print("\n=== Analyse du code Python ===")
    lines = python_code.split('\n')
    
    # Erreur à la ligne 2035 pour pasted-text-2026-01-12T16-26-02.txt
    if '2035' in python_code:
        print("Recherche de la ligne 2035...")
        for i in range(2030, 2045):
            if i < len(lines):
                print(f"Ligne {i+1}: {lines[i][:150]}")
    
    # Rechercher les patterns problématiques
    import re
    
    # Pattern: ligne contenant des caractères spéciaux non échappés
    problematic_chars = [
        (r"'''[^']*'''[^']*$", "Docstring non fermée"),
        (r'"""[^"]*"""[^"]*$', "Docstring non fermée"),
        (r"'\w+\s*$", "Chaîne non fermée"),
    ]
    
    print("\n=== Recherche de patterns problématiques ===")
    for i, line in enumerate(lines[:2050], 1):
        for pattern, desc in problematic_chars:
            if re.search(pattern, line):
                print(f"Ligne {i+1}: {desc}")
                print(f"  {line[:150]}")
    
    # Tester la compilation du code Python
    print("\n=== Test de compilation Python ===")
    try:
        compile(python_code, '<python>', 'exec')
        print("✓ Compilation Python: OK")
    except SyntaxError as e:
        print(f"✗ Erreur Python: {e}")
        print(f"  Ligne {e.lineno}: {lines[e.lineno-1] if e.lineno <= len(lines) else 'N/A'}")
        
        # Afficher le contexte
        print("\n  Contexte:")
        for i in range(max(0, e.lineno-3), min(len(lines), e.lineno+2)):
            prefix = ">>>" if i+1 == e.lineno else "   "
            print(f"  {prefix} {i+1}: {lines[i][:120]}")
