#!/usr/bin/env python3
"""
Correcteur Complet - Corrige les erreurs d'indentation et de syntaxe
"""

import re
import ast

def fix_extra_quotes(code: str) -> str:
    """Corriger les quotes parasites à la fin des lignes"""
    lines = code.split('\n')
    result = []
    
    for line in lines:
        stripped = line.rstrip()
        
        # Pattern: ... "''"'
        # C'est une quote fermante en trop après une string
        if stripped.endswith("'") and stripped.count("'") % 2 == 1:
            # Vérifier si ça ressemble à une quote parasite
            # Chercher le pattern: string + ''
            match = re.search(r'"\+\'\'$|\'\'"$|"\'\'$', stripped)
            if match:
                # Enlever le dernier '
                fixed = stripped[:-1].rstrip()
                result.append(fixed)
                continue
        
        result.append(line)
    
    return '\n'.join(result)


def fix_indentation_after_decorator_or_special(code: str) -> str:
    """Corriger l'indentation après les décorateurs et certaines lignes spéciales"""
    lines = code.split('\n')
    result = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Pattern 1: Docstring juste après une méthode sans indentation
        # """quelque chose""" suivi de def ou d'une autre méthode
        if stripped.startswith('"""') or stripped.startswith("'''"):
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                # Si la ligne suivante est une définition de méthode
                if next_line.startswith('def ') or next_line.startswith('async def '):
                    # Cette docstring devrait être dans la méthode précédente
                    # Ou c'est une docstring orphan
                    # On va la supprimer et assume qu'elle était un commentaire
                    # En regardant le contexte...
                    pass
        
        # Pattern 2: Méthode sans indentation après une classe
        # class Foo:
        # def bar(self):  <- devrait être indenté
        
        result.append(line)
        i += 1
    
    return '\n'.join(result)


def fix_class_method_indentation(code: str) -> str:
    """Corriger l'indentation des méthodes dans les classes"""
    lines = code.split('\n')
    result = []
    
    in_class = False
    class_indent = 0
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Détecter début de classe
        if stripped.startswith('class ') and ':' in stripped:
            in_class = True
            class_indent = len(line) - len(line.lstrip())
            result.append(line)
            continue
        
        # Si on est dans une classe
        if in_class:
            current_indent = len(line) - len(line.lstrip())
            
            # Si on trouve une méthode (def ou async def) qui n'est pas indentée
            if (stripped.startswith('def ') or stripped.startswith('async def ')) and current_indent == 0:
                # L'indenter!
                fixed_line = '    ' + line.lstrip()
                result.append(fixed_line)
                continue
            
            # Si on trouve une autre classe ou fin de classe
            if stripped.startswith('class '):
                in_class = False
        
        result.append(line)
    
    return '\n'.join(result)


def fix_orphan_docstrings(code: str) -> str:
    """Corriger les docstrings qui ne sont pas liées à une fonction/méthode"""
    lines = code.split('\n')
    result = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Si c'est une docstring seule (pas dans une fonction)
        if (stripped.startswith('"""') or stripped.startswith("'''")) and stripped.count('"""') == 1:
            # Vérifier le contexte
            if i > 0:
                prev_line = lines[i - 1].strip()
                next_line = lines[i + 1].strip() if i + 1 < len(lines) else ''
                
                # Si la ligne précédente est du code et la suivante est une méthode
                if not prev_line.startswith('"""') and not prev_line.startswith("'''"):
                    if next_line.startswith('def ') or next_line.startswith('class '):
                        # C'est une docstring orphan, la supprimer
                        # et la remplacer par un commentaire
                        result.append('# ' + line)
                        i += 1
                        continue
        
        result.append(line)
        i += 1
    
    return '\n'.join(result)


def comprehensive_fix(code: str) -> str:
    """Appliquer toutes les corrections"""
    print("\n1. Correction des quotes parasites...")
    fixed1 = fix_extra_quotes(code)
    
    print("2. Correction de l'indentation des méthodes...")
    fixed2 = fix_class_method_indentation(fixed1)
    
    print("3. Correction des docstrings orphan...")
    fixed3 = fix_orphan_docstrings(fixed2)
    
    return fixed3


def main():
    test_file = '/workspace/user_input_files/pasted-text-2026-01-31T00-31-01.txt'
    output_file = '/workspace/code_corrected_v4.py'
    
    print("=" * 60)
    print("CORRECTEUR COMPLET - v4")
    print("=" * 60)
    
    with open(test_file, 'r', encoding='utf-8') as f:
        code = f.read()
    
    print(f"\n📄 Fichier: {test_file}")
    print(f"📏 Taille: {len(code):,} caractères")
    
    # Appliquer les corrections
    print("\n🔧 Application des corrections...")
    fixed = comprehensive_fix(code)
    
    # Vérifier
    print("\n🔍 Vérification de la syntaxe...")
    try:
        ast.parse(fixed)
        valid = True
        print("✅ Syntaxe valide!")
    except SyntaxError as e:
        valid = False
        print(f"❌ Erreur: {e}")
        print(f"   Ligne: {e.lineno if hasattr(e, 'lineno') else 'N/A'}")
        
        # Essayer de corriger en boucle jusqu'à ce que ce soit bon
        print("\n🔧 Tentative de correction itérative...")
        for attempt in range(10):
            fixed = comprehensive_fix(fixed)
            try:
                ast.parse(fixed)
                valid = True
                print(f"✅ Tentative {attempt + 1}: Syntaxe valide!")
                break
            except SyntaxError as e2:
                valid = False
                print(f"   Tentative {attempt + 1}: Erreur à la ligne {e2.lineno if hasattr(e2, 'lineno') else 'N/A'}")
    
    if valid:
        print(f"\n📊 Lignes: {len(fixed.split(chr(10))):,}")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print(f"💾 Code corrigé sauvegardé: {output_file}")
    else:
        print("\n⚠️ Impossible de corriger automatiquement")


if __name__ == '__main__':
    main()
