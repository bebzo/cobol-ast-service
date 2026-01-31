#!/usr/bin/env python3
"""
Correcteur Automatique de Code Python Généré
Corrige les erreurs d'indentation et de syntaxe courantes
"""

import re
import json
from typing import Dict, List, Tuple, Optional

def fix_generated_python(code: str) -> str:
    """Corriger les erreurs courantes du code Python généré"""
    lines = code.split('\n')
    fixed_lines = []
    
    for i, line in enumerate(lines):
        original_line = line
        stripped = line.strip()
        
        # ============================================
        # CORRECTION 1: Indentation après décorateurs
        # ============================================
        # Si on a @decorator suivi de def/class sans indentation, ajouter 4 espaces
        if i > 0:
            prev_stripped = lines[i-1].strip()
            if prev_stripped.startswith('@') and (stripped.startswith('def ') or stripped.startswith('class ')):
                # Ajouter indentation
                line = '    ' + line
        
        # ============================================
        # CORRECTION 2: Docstrings mal placées
        # ============================================
        # Si une docstring """ commence sans indentation après def/class
        if stripped.startswith('"""') or stripped.startswith("'''"):
            if i > 0:
                prev = lines[i-1].rstrip()
                # Si la ligne précédente est une définition de fonction/classe
                if re.match(r'^(def |class |    def |    class )', prev):
                    # S'assurer que la ligne précédente finit par :
                    if not prev.rstrip().endswith(':'):
                        # Corriger la ligne précédente
                        lines[i-1] = prev.rstrip() + ':'
        
        # ============================================
        # CORRECTION 3: Dictionnaires multi-lignes mal formés
        # ============================================
        # Compter les accolades dans la ligne
        open_braces = line.count('{')
        close_braces = line.count('}')
        
        # Si plus d'accolades ouvrantes que fermantes et pas de continuation
        if open_braces > close_braces and not stripped.endswith('\\'):
            # Vérifier si c'est une ligne de retour avec dictionnaire
            if 'return {' in line and open_braces == close_braces + 1:
                # C'est probablement un dictionnaire mal formé sur plusieurs lignes
                pass  # Laisser pour l'instant
        
        fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)


def fix_indentation_issues(code: str) -> str:
    """Correction spécifique des problèmes d'indentation"""
    lines = code.split('\n')
    result = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Si cette ligne est un décorateur
        if stripped.startswith('@'):
            # Chercher la définition suivante
            j = i + 1
            while j < len(lines) and lines[j].strip() == '':
                j += 1
            
            if j < len(lines):
                next_line = lines[j].strip()
                # Si la ligne suivante est def ou class
                if next_line.startswith('def ') or next_line.startswith('class '):
                    # Ajouter les 4 lignes au résultat
                    result.append(line)
                    # Ajouter les lignes vides
                    for k in range(i + 1, j):
                        result.append(lines[k])
                    # Ajouter la définition avec indentation
                    result.append('    ' + next_line)
                    i = j + 1
                    continue
        
        result.append(line)
        i += 1
    
    return '\n'.join(result)


def fix_docstrings(code: str) -> str:
    """Correction des docstrings mal formées"""
    lines = code.split('\n')
    result = []
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Si la ligne est une docstring seule
        if stripped in ['"""', "'''"]:
            if i > 0:
                prev = lines[i-1].rstrip()
                # Si la ligne précédente est une définition
                if re.match(r'^(def |class )', prev):
                    # La docstring doit être sur la ligne de la définition ou indentée
                    # Option 1: Mettre sur la même ligne
                    if prev.endswith(':'):
                        # Créer une docstring inline
                        docstring_line = prev + ' """TODO"""'
                        result[-1] = docstring_line
                        # Sauter la ligne de docstring单独的
                        continue
                    else:
                        # Ajouter : à la ligne précédente
                        result[-1] = prev + ':'
                        # Garder la docstring
                        result.append(line)
                        continue
        
        result.append(line)
    
    return '\n'.join(result)


def comprehensive_fix(code: str) -> Dict:
    """Application de toutes les corrections"""
    original_lines = len(code.split('\n'))
    
    # Étape 1: Corrections d'indentation
    fixed1 = fix_indentation_issues(code)
    
    # Étape 2: Corrections de docstrings
    fixed2 = fix_docstrings(fixed1)
    
    # Étape 3: Corrections générales
    fixed3 = fix_generated_python(fixed2)
    
    final_lines = len(fixed3.split('\n'))
    
    # Vérifier si le code est maintenant valide
    try:
        import ast
        ast.parse(fixed3)
        ast_valid = True
    except SyntaxError as e:
        ast_valid = False
        ast_error = str(e)
    
    return {
        'original_lines': original_lines,
        'fixed_lines': final_lines,
        'ast_valid': ast_valid,
        'fixed_code': fixed3,
        'changes': original_lines - final_lines
    }


def main():
    """Test du correcteur"""
    test_file = '/workspace/user_input_files/pasted-text-2026-01-31T00-31-01.txt'
    output_file = '/workspace/code_corrected.py'
    report_file = '/workspace/correction_report.json'
    
    print("=" * 60)
    print("CORRECTEUR AUTOMATIQUE DE CODE PYTHON")
    print("=" * 60)
    
    with open(test_file, 'r', encoding='utf-8') as f:
        code = f.read()
    
    print(f"\n📄 Fichier source: {test_file}")
    print(f"📏 Lignes originales: {len(code.split(chr(10)))}")
    
    # Appliquer les corrections
    print("\n🔧 Application des corrections...")
    result = comprehensive_fix(code)
    
    print(f"\n📊 Résultat:")
    print(f"   Lignes après correction: {result['fixed_lines']}")
    print(f"   Changements: {result['changes']} lignes")
    print(f"   AST valide: {'✅' if result['ast_valid'] else '❌'}")
    
    if result['ast_valid']:
        # Sauvegarder le code corrigé
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(result['fixed_code'])
        print(f"💾 Code corrigé sauvegardé: {output_file}")
        
        # Analyse de la qualité après correction
        print("\n📈 Analyse de qualité post-correction...")
        analyze_quality(result['fixed_code'])
    else:
        print(f"❌ Erreur AST persistante: {result.get('ast_error', 'Inconnue')}")
        
        # Essayer de corriger davantage
        print("\n🔄 Second passage de correction...")
        result2 = comprehensive_fix(result['fixed_code'])
        if result2['ast_valid']:
            print("✅ Corrections du second passage有效!")
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(result2['fixed_code'])
        else:
            print("⚠️  Corrections insuffisantes")
    
    # Sauvegarder le rapport
    report = {
        'source': test_file,
        'output': output_file,
        'original_lines': result['original_lines'],
        'fixed_lines': result['fixed_lines'],
        'ast_valid': result['ast_valid'],
        'changes': result['changes']
    }
    
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)
    
    print(f"💾 Rapport: {report_file}")


def analyze_quality(code: str):
    """Analyse rapide de la qualité après correction"""
    import ast
    
    try:
        tree = ast.parse(code)
        
        classes = [n.name for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]
        functions = [n.name for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]
        
        print(f"\n📊 Structure du code:")
        print(f"   Classes: {len(classes)}")
        print(f"   Fonctions: {len(functions)}")
        print(f"   Lignes: {len(code.split(chr(10)))}")
        
        # Vérifier les noms
        all_valid = True
        for func in functions:
            if not all(c.islower() or c.isdigit() or c == '_' for c in func):
                print(f"⚠️  Fonction au nom non standard: {func}")
                all_valid = False
        
        for cls in classes:
            if not cls[0].isupper():
                print(f"⚠️  Classe au nom non standard: {cls}")
                all_valid = False
        
        if all_valid:
            print("✅ Conventions de nommage respectées")
        
        # Vérifier les imports
        imports = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.add(alias.name.split('.')[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.add(node.module.split('.')[0])
        
        if imports:
            print(f"📦 Imports détectés: {len(imports)}")
        
    except SyntaxError as e:
        print(f"❌ Erreur de syntaxe: {e}")


if __name__ == '__main__':
    main()
