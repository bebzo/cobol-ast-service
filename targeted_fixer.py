#!/usr/bin/env python3
"""
Correcteur Ciblé - Corrige les erreurs spécifiques du code généré par CodeSwitch
"""

import re
import unicodedata
from typing import Dict

def clean_python_code(code: str) -> str:
    """Nettoyer le code Python de caractères problématiques"""
    lines = code.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # Enlever les caractères de contrôle invisibles
        cleaned = ''.join(c for c in line if unicodedata.category(c) != 'Cc')
        
        # Normaliser les espaces (enlever les trailing spaces problématiques)
        cleaned = cleaned.rstrip()
        
        # Corriger les patterns connus problématiques
        
        # Pattern 1: @decorator suivi de def sans indentation suffisante
        if re.match(r'^@\w+.*\n\s*def ', line):
            # Cette ligne est un décorateur, la suivante doit être indentée
            pass
        
        cleaned_lines.append(cleaned)
    
    return '\n'.join(cleaned_lines)


def fix_decorator_indentation(code: str) -> str:
    """Corriger l'indentation après les décorateurs"""
    lines = code.split('\n')
    result = []
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Si cette ligne est un décorateur
        if stripped.startswith('@'):
            # Ajouter cette ligne
            result.append(line)
            
            # Regarder les lignes suivantes
            j = i + 1
            while j < len(lines) and lines[j].strip() == '':
                result.append(lines[j])
                j += 1
            
            if j < len(lines):
                next_line = lines[j]
                next_stripped = next_line.strip()
                
                # Si la ligne suivante est def ou class, ajouter indentation
                if next_stripped.startswith('def ') or next_stripped.startswith('class '):
                    # Compter les espaces de la ligne décorateur (pour保持一致)
                    spaces = len(line) - len(line.lstrip())
                    if spaces < 4:
                        # Ajouter indentation standard
                        result.append('    ' + next_stripped)
                    else:
                        result.append(next_line)
                    j += 1
                else:
                    result.append(next_line)
                    j += 1
                    
                # Ajouter les lignes restantes jusqu'à la prochaine non-vide
                for k in range(j, len(lines)):
                    result.append(lines[k])
                break
        else:
            result.append(line)
    
    return '\n'.join(result)


def fix_docstring_format(code: str) -> str:
    """Corriger le format des docstrings"""
    lines = code.split('\n')
    result = []
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Si c'est une docstring seule
        if stripped in ['"""', "'''"]:
            if i > 0:
                prev = lines[i-1].rstrip()
                # Si la ligne précédente est une définition de fonction
                if re.match(r'^(def |class )\w+.*:\s*$', prev):
                    # La docstring doit être indentée ou sur la même ligne
                    # Option: mettre sur la même ligne
                    docstring_content = stripped + "TODO" + stripped
                    result[-1] = prev + ' """TODO"""'
                    continue
                elif re.match(r'^(def |class )\w+.*$', prev):
                    # Ajouter les deux-points
                    result[-1] = prev + ':'
                    # Garder la docstring
                    result.append(line)
                    continue
        
        result.append(line)
    
    return '\n'.join(result)


def verify_and_fix(code: str) -> Dict:
    """Vérifier et corriger le code"""
    # Sauvegarder l'original pour comparaison
    original = code
    original_lines = len(code.split('\n'))
    
    # Étape 1: Nettoyage de base
    cleaned = clean_python_code(code)
    
    # Étape 2: Corrections d'indentation
    fixed1 = fix_decorator_indentation(cleaned)
    
    # Étape 3: Corrections de docstrings
    fixed2 = fix_docstring_format(fixed1)
    
    # Vérifier si c'est maintenant valide
    try:
        import ast
        ast.parse(fixed2)
        valid = True
        error = None
    except SyntaxError as e:
        valid = False
        error = str(e)
    
    fixed_lines = len(fixed2.split('\n'))
    
    return {
        'original_lines': original_lines,
        'fixed_lines': fixed_lines,
        'valid_syntax': valid,
        'error': error,
        'fixed_code': fixed2,
        'changes': original_lines - fixed_lines
    }


def analyze_specific_issue(code: str) -> Dict:
    """Analyser le problème spécifique à la ligne 81"""
    lines = code.split('\n')
    
    # Afficher les lignes 78-85 pour diagnostic
    context = []
    for i in range(78, min(88, len(lines))):
        marker = '>>>' if i == 80 else '   '
        context.append(f"{marker} {i+1:4d}: {repr(lines[i])}")
    
    return {
        'line_81_content': lines[80] if len(lines) > 80 else None,
        'line_82_content': lines[81] if len(lines) > 81 else None,
        'context': context
    }


def main():
    """Test principal"""
    test_file = '/workspace/user_input_files/pasted-text-2026-01-31T00-31-01.txt'
    output_file = '/workspace/code_corrected_v2.py'
    
    print("=" * 60)
    print("CORRECTEUR CIBLÉ - CodeSwitch Pro")
    print("=" * 60)
    
    with open(test_file, 'r', encoding='utf-8') as f:
        code = f.read()
    
    print(f"\n📄 Fichier: {test_file}")
    print(f"📏 Taille: {len(code):,} caractères")
    
    # Analyser le problème spécifique
    print("\n🔍 Analyse du problème ligne 81...")
    issue = analyze_specific_issue(code)
    
    print(f"\nLigne 81: {issue['line_81_content']}")
    print(f"Ligne 82: {issue['line_82_content']}")
    print("\nContexte:")
    for ctx in issue['context']:
        print(ctx)
    
    # Appliquer les corrections
    print("\n🔧 Application des corrections...")
    result = verify_and_fix(code)
    
    print(f"\n📊 Résultat:")
    print(f"   Lignes originales: {result['original_lines']}")
    print(f"   Lignes après correction: {result['fixed_lines']}")
    print(f"   Syntaxe valide: {'✅' if result['valid_syntax'] else '❌'}")
    
    if not result['valid_syntax']:
        print(f"   Erreur: {result['error']}")
    
    # Sauvegarder le code corrigé
    if result['valid_syntax']:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(result['fixed_code'])
        print(f"\n💾 Code corrigé sauvegardé: {output_file}")
        
        # Analyse de la qualité du code corrigé
        print("\n📈 Analyse de la qualité...")
        analyze_quality(result['fixed_code'])
    else:
        # Essayer de diagnostiquer
        print("\n🔍 Diagnostic supplémentaire...")
        diagnose_further(code)
    
    return result


def analyze_quality(code: str):
    """Analyse rapide de la qualité"""
    import ast
    
    try:
        tree = ast.parse(code)
        
        classes = [n.name for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]
        functions = [n.name for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]
        
        print(f"\n📊 Structure du code corrigé:")
        print(f"   Classes: {len(classes)}")
        print(f"   Fonctions: {len(functions)}")
        print(f"   Lignes: {len(code.split(chr(10)))}")
        
        # Vérifier les imports
        imports = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.add(alias.name.split('.')[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.add(node.module.split('.')[0])
        
        print(f"   Imports: {len(imports)}")
        
        print("\n✅ Code syntaxiquement valide!")
        
    except SyntaxError as e:
        print(f"❌ Erreur: {e}")


def diagnose_further(code: str):
    """Diagnostiquer plus en détail"""
    lines = code.split('\n')
    
    # Vérifier les caractères invisibles
    print("\n🔍 Vérification des caractères...")
    
    for i in range(min(85, len(lines))):
        line = lines[i]
        # Vérifier les tabs vs spaces
        if '\t' in line:
            print(f"   Ligne {i+1}: Contient des tabs")
        
        # Vérifier les caractères Unicode invisibles
        for j, c in enumerate(line):
            cat = unicodedata.category(c)
            if cat.startswith('C') and c not in '\n\r\t':
                print(f"   Ligne {i+1}, pos {j}: Caractère de contrôle U+{ord(c):04X} ({cat})")
    
    # Essayer d'extraire juste la partie problématique
    print("\n🔍 Test avec extraction de la section problématique...")
    try:
        # Prendre les 100 premières lignes
        test_code = '\n'.join(lines[:100])
        import ast
        ast.parse(test_code)
        print("✅ Les 100 premières lignes sont valides")
    except SyntaxError as e:
        print(f"❌ Erreur dans les 100 premières lignes: {e}")
        
        # Trouver exactement où
        for i in range(min(100, len(lines))):
            test_code = '\n'.join(lines[:i+1])
            try:
                import ast
                ast.parse(test_code)
            except SyntaxError as e2:
                print(f"   Problème détecté à la ligne {i+1}: {e2}")
                break


if __name__ == '__main__':
    main()
