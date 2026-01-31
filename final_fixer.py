#!/usr/bin/env python3
"""
Correcteur Simple et Direct - Ferme les docstrings non fermees
"""

import re

def fix_unclosed_docstrings_simple(code):
    """
    Trouver les docstrings qui ne sont pas fermees et les fermer.
    
    Le pattern est:
        def func():
            \"\"\"docstring
            v8.x: du texte qui devrait etre du code
            
    Devient:
        def func():
            \"\"\"docstring\"\"\"
            # v8.x: du texte qui devrait etre du code
    """
    lines = code.split('\n')
    result = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Chercher une definition de fonction
        if stripped.startswith('def ') and ':' in stripped:
            # C'est une fonction
            result.append(line)
            i += 1
            
            # Ajouter les lignes suivantes
            while i < len(lines):
                current = lines[i]
                current_stripped = current.strip()
                
                # Si c'est une docstring qui commence
                if current_stripped.startswith('DBL_QUOTE') or current_stripped.startswith("SGL_QUOTE"):
                    doc_char = 'DBL_QUOTE' if 'DBL_QUOTE' in current_stripped else "SGL_QUOTE"
                    
                    # Si elle commence mais ne finit pas sur cette ligne
                    if current_stripped.count(doc_char) == 1 and not current_stripped.endswith(doc_char):
                        # Docstring non fermee!
                        # Ajouter la ligne de debut
                        result.append(current)
                        i += 1
                        
                        # Ajouter les lignes suivantes jusqu'a trouver du vrai code
                        while i < len(lines):
                            next_line = lines[i]
                            next_stripped = next_line.strip()
                            
                            # Si on trouve une vraie instruction
                            if (next_stripped.startswith('if ') or 
                                next_stripped.startswith('return ') or
                                next_stripped.startswith('for ') or
                                next_stripped.startswith('while ') or
                                next_stripped.startswith('try ') or
                                next_stripped.startswith('with ') or
                                next_stripped.startswith('raise ') or
                                next_stripped.startswith('value = ') or
                                next_stripped.startswith('import ') or
                                next_stripped.startswith('from ') or
                                next_stripped.startswith('def ') or
                                next_stripped.startswith('class ') or
                                next_stripped.startswith('@')):
                                
                                # Fermer la docstring
                                indent = len(current) - len(current.lstrip())
                                if doc_char == 'DBL_QUOTE':
                                    result.append(' ' * indent + '"""')
                                else:
                                    result.append(' ' * indent + "'''")
                                
                                # Convertir les lignes "v8.x" en commentaires
                                if next_stripped.startswith('v8.') or next_stripped.startswith('v9.'):
                                    result.append(' ' * indent + '# ' + next_stripped)
                                else:
                                    result.append(next_line)
                                
                                i += 1
                                break
                            
                            # Si c'est une ligne de version
                            elif next_stripped.startswith('v8.') or next_stripped.startswith('v9.'):
                                indent = len(next_line) - len(next_line.lstrip())
                                result.append(' ' * indent + '# ' + next_stripped)
                                i += 1
                            
                            # Sinon, c'est probablement la suite de la docstring
                            else:
                                result.append(next_line)
                                i += 1
                        
                        break
                    else:
                        result.append(current)
                        i += 1
                else:
                    result.append(current)
                    i += 1
        else:
            result.append(line)
            i += 1
    
    return '\n'.join(result)


def replace_quotes(code):
    """Remplacer les triple quotes par des marqueurs"""
    code = code.replace('"""', 'DBL_QUOTE')
    code = code.replace("'''", "SGL_QUOTE")
    return code


def restore_quotes(code):
    """Restaurer les triple quotes"""
    code = code.replace('DBL_QUOTE', '"""')
    code = code.replace("SGL_QUOTE", "'''")
    return code


def main():
    test_file = '/workspace/user_input_files/pasted-text-2026-01-31T00-31-01.txt'
    output_file = '/workspace/code_final_fixed.py'
    
    print("=" * 60)
    print("CORRECTEUR FINAL")
    print("=" * 60)
    
    with open(test_file, 'r', encoding='utf-8') as f:
        code = f.read()
    
    print(f"\nFichier: {test_file}")
    print(f"Taille: {len(code):,} caracteres")
    
    # Etape 1: Remplacer les triple quotes par des marqueurs
    print("\n1. Preparation...")
    marked = replace_quotes(code)
    
    # Etape 2: Corriger les docstrings
    print("2. Correction des docstrings...")
    fixed = fix_unclosed_docstrings_simple(marked)
    
    # Etape 3: Restaurer les triple quotes
    print("3. Restauration...")
    restored = restore_quotes(fixed)
    
    # Verifier
    print("\nVerification...")
    try:
        import ast
        ast.parse(restored)
        print("Syntaxe valide!")
        valid = True
    except SyntaxError as e:
        print(f"Erreur: {e}")
        print(f"   Ligne: {e.lineno if hasattr(e, 'lineno') else 'N/A'}")
        valid = False
    
    if valid:
        print(f"\nLignes: {len(restored.split(chr(10))):,}")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(restored)
        print(f"Code corrige sauvegarde: {output_file}")
    else:
        print("\nAttention: Certaines erreurs persistent")


if __name__ == '__main__':
    main()
