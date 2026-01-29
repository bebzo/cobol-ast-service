#!/usr/bin/env python3
"""
Script de détection des lignes COBOL résiduelles dans le Python généré.
"""

import re
import sys
from pathlib import Path

def detect_raw_cobol_in_python(python_file: str) -> list:
    """
    Détecte les lignes de code COBOL qui ne sont pas dans un docstring.
    """
    issues = []
    
    with open(python_file, 'r') as f:
        lines = f.readlines()
    
    # Patterns COBOL typiques qui ne devraient pas apparaître en Python
    cobol_patterns = [
        r'^\s+IF\s+\w+[\s-]',      # IF statements
        r'^\s+MOVE\s+',            # MOVE statements  
        r'^\s+PERFORM\s+',         # PERFORM statements
        r'^\s+COMPUTE\s+',         # COMPUTE statements
        r'^\s+EVALUATE\s+',        # EVALUATE statements
        r'^\s+WHEN\s+',            # WHEN clauses
        r'^\s+ADD\s+',             # ADD statements
        r'^\s+SUBTRACT\s+',        # SUBTRACT statements
        r'^\s+MULTIPLY\s+',        # MULTIPLY statements
        r'^\s+DIVIDE\s+',          # DIVIDE statements
        r'^\s+DISPLAY\s+',         # DISPLAY statements
        r'^\s+ACCEPT\s+',          # ACCEPT statements
        r'^\s+CALL\s+',            # CALL statements
        r'^\s+EXIT\s+',            # EXIT statements
    ]
    
    in_docstring = False
    docstring_quote_count = 0
    
    for line_num, line in enumerate(lines, start=1):
        stripped = line.rstrip()
        
        # Détecter si on est dans un docstring
        if '"""' in stripped:
            # Compter les quotes dans la ligne
            quote_count = stripped.count('"""')
            if quote_count == 1:
                # Une seule quote - changer d'état
                if not in_docstring:
                    # Entrée dans docstring
                    in_docstring = True
                    docstring_quote_count = 1
                else:
                    # Sortie de docstring
                    in_docstring = False
                    docstring_quote_count = 0
            elif quote_count == 2:
                # Deux quotes - toggle deux fois
                in_docstring = not in_docstring
                docstring_quote_count = 2
            elif quote_count >= 3:
                # Trois quotes ou plus - toggle une fois de plus
                in_docstring = not in_docstring
        
        # Si on n'est PAS dans un docstring, vérifier les patterns COBOL
        if not in_docstring and not stripped.startswith('#'):
            for pattern in cobol_patterns:
                if re.match(pattern, stripped):
                    # Vérifier que ce n'est pas un commentaire Python
                    if not stripped.strip().startswith('#'):
                        # Vérifier que ce n'est pas du code Python valide
                        if not re.match(r'^\s*(if|for|while|def|class|try|except|with)\b', stripped, re.IGNORECASE):
                            issues.append({
                                'line': line_num,
                                'content': stripped[:80],
                                'pattern': pattern
                            })
                    break
    
    return issues

def main():
    if len(sys.argv) < 2:
        print("Usage: python detect_raw_cobol.py <fichier_python>")
        sys.exit(1)
    
    python_file = sys.argv[1]
    
    if not Path(python_file).exists():
        print(f"Erreur: Le fichier {python_file} n'existe pas")
        sys.exit(1)
    
    print(f" Analyse de: {python_file}")
    print("=" * 70)
    
    issues = detect_raw_cobol_in_python(python_file)
    
    if issues:
        print(f" ⚠️  {len(issues)} lignes COBOL résiduelles détectées:")
        print()
        
        for issue in issues[:20]:  # Afficher max 20
            print(f"  Ligne {issue['line']}: {issue['content']}")
        
        if len(issues) > 20:
            print(f"  ... et {len(issues) - 20} autres")
        
        # Retourner un code d'erreur
        sys.exit(1)
    else:
        print(" ✅ Aucune ligne COBOL résiduelle détectée!")
        sys.exit(0)

if __name__ == '__main__':
    main()
