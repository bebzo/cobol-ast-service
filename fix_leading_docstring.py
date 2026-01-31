#!/usr/bin/env python3
"""
Correcteur de Docstring de Debut de Fichier
"""

def fix_leading_docstring(code: str) -> str:
    """
    Le fichier commence par une docstring qui n'est pas fermee.
    Il faut trouver ou elle devrait se fermer et la fermer.
    """
    import re
    
    lines = code.split('\n')
    
    # La docstring commence avec """
    # Elle devrait se fermer avant le code reel (imports, etc.)
    
    # Chercher la premiere ligne de code reel (pas un commentaire ou une docstring)
    # Le code reel commence typiquement par des imports ou des definitions
    
    # Pattern pour les imports
    import_pattern = re.compile(r'^import |^from ')
    # Pattern pour les definitions
    def_pattern = re.compile(r'^(def |class |@|# v8\.|# v9\.)')
    
    docstring_lines = []
    in_docstring = False
    docstring_start = None
    
    result = []
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Si on trouve le debut de la docstring
        if stripped.startswith('"""') or stripped.startswith("'''"):
            if not in_docstring:
                in_docstring = True
                docstring_start = i
                docstring_lines.append(line)
                continue
        
        # Si on est dans la docstring
        if in_docstring:
            # Verifier si on trouve la fermeture
            if stripped.endswith('"""') or stripped.endswith("'''"):
                # Docstring fermee
                in_docstring = False
                docstring_lines.append(line)
                # Ajouter tout au resultat
                result.extend(docstring_lines)
                docstring_lines = []
                continue
            
            # Verifier si on est arrive au code reel
            # (les imports ou definitions)
            if import_pattern.match(stripped) or (def_pattern.match(stripped) and not stripped.startswith('#')):
                # La docstring n'est pas fermee!
                # On doit la fermer ici
                # Ajouter la docstring avec la fermeture
                if docstring_lines:
                    # Ajouter la fermeture a la dernier ligne de la docstring
                    last_doc_line = docstring_lines[-1]
                    if last_doc_line.strip().endswith('"""') or last_doc_line.strip().endswith("'''"):
                        # Elle est deja fermee, strange...
                        result.extend(docstring_lines)
                    else:
                        # Fermer la docstring
                        # Garder tout ce qu'on a jusqu'a present
                        for dl in docstring_lines[:-1]:
                            result.append(dl)
                        # Fermer la docstring sur la dernier ligne
                        result.append(docstring_lines[-1] + '"""')
                
                # Ajouter le code actuel
                result.append(line)
                in_docstring = False
                docstring_lines = []
            else:
                docstring_lines.append(line)
        else:
            result.append(line)
    
    # Si on est encore dans la docstring a la fin
    if in_docstring and docstring_lines:
        # Ajouter la fermeture
        for dl in docstring_lines[:-1]:
            result.append(dl)
        last = docstring_lines[-1]
        result.append(last + '"""')
    
    return '\n'.join(result)


def main():
    import re
    
    input_file = '/workspace/user_input_files/pasted-text-2026-01-31T00-31-01.txt'
    output_file = '/workspace/code_leading_docstring_fixed.py'
    
    print("=" * 60)
    print("CORRECTEUR DE DOCSTRING DE DEBUT")
    print("=" * 60)
    
    with open(input_file, 'r', encoding='utf-8') as f:
        code = f.read()
    
    print(f"\nFichier: {input_file}")
    print(f"Taille: {len(code):,} caracteres")
    
    # Appliquer la correction
    print("\nCorrection de la docstring de debut...")
    fixed = fix_leading_docstring(code)
    
    # Verifier
    print("Verification...")
    try:
        import ast
        ast.parse(fixed)
        print("Syntaxe VALIDE! 🎉")
        valid = True
    except SyntaxError as e:
        print(f"Erreur: {e}")
        print(f"Ligne: {e.lineno if hasattr(e, 'lineno') else 'N/A'}")
        valid = False
    
    if valid:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print(f"\nFichier corrige: {output_file}")
        print(f"Lignes: {len(fixed.split(chr(10)))}")


if __name__ == '__main__':
    main()
