#!/usr/bin/env python3
"""
Analyseur Syntaxique Profond - Détecte les vrais problèmes dans le code généré
"""

import sys
import ast
import tokenize
import io
import json
import re
from typing import Dict, List, Any, Optional

def deep_syntax_analysis(code: str) -> Dict:
    """Analyse syntaxique approfondie avec tokens"""
    results = {
        'valid': False,
        'errors': [],
        'warnings': [],
        'info': [],
        'ast_tree': None,
        'token_count': 0
    }
    
    # ========== 1. Test AST basique ==========
    print("🔍 Test AST...")
    try:
        tree = ast.parse(code)
        results['ast_tree'] = True
        print("✅ AST parse OK")
    except SyntaxError as e:
        results['errors'].append({
            'type': 'AST_SYNTAX_ERROR',
            'line': e.lineno,
            'offset': e.offset,
            'message': e.msg,
            'context': _get_error_context(code, e.lineno, 3)
        })
        print(f"❌ Erreur AST ligne {e.lineno}: {e.msg}")
        return results
    
    # ========== 2. Analyse par tokens ==========
    print("🔍 Analyse par tokens...")
    try:
        tokens = list(tokenize.generate_tokens(io.StringIO(code).readline))
        results['token_count'] = len(tokens)
        print(f"✅ {len(tokens)} tokens analysés")
        
        # Vérifier les tokens problématiques
        for i, tok in enumerate(tokens):
            if tok.type == tokenize.ERRORTOKEN:
                results['warnings'].append({
                    'type': 'ERRORTOKEN',
                    'line': tok.start[0],
                    'message': f"Token erroné: {repr(tok.string)}"
                })
            
            # Vérifier les IndentationError
            if tok.type == tokenize.INDENT:
                # Vérifier la cohérence de l'indentation
                if i > 0:
                    prev = tokens[i-1]
                    if prev.type == tokenize.NEWLINE:
                        # C'est une nouvelle indentation - vérifier le contexte
                        pass
            
            # Vérifier les DEDENT
            if tok.type == tokenize.DEDENT:
                pass
                
    except Exception as e:
        results['warnings'].append({
            'type': 'TOKENIZE_ERROR',
            'message': str(e)
        })
    
    # ========== 3. Analyse structurelle ==========
    print("🔍 Analyse structurelle...")
    
    # Vérifier les imports manquants
    needed_imports = ['lru_cache', 'dataclass', 'field', 'contextmanager']
    available_imports = []
    
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                available_imports.append(alias.name.split('.')[0])
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                available_imports.append(node.module.split('.')[0])
    
    for imp in needed_imports:
        if imp not in available_imports:
            results['warnings'].append({
                'type': 'MISSING_IMPORT',
                'message': f"'{imp}' utilisé mais non importé explicitement"
            })
    
    # ========== 4. Analyse des classes et fonctions ==========
    print("🔍 Analyse des définitions...")
    
    classes = []
    functions = []
    decorators = []
    
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            classes.append({
                'name': node.name,
                'line': node.lineno,
                'methods': len([n for n in ast.walk(node) if isinstance(n, ast.FunctionDef)]),
                'has_docstring': bool(ast.get_docstring(node))
            })
        elif isinstance(node, ast.FunctionDef):
            functions.append({
                'name': node.name,
                'line': node.lineno,
                'args': len(node.args.args),
                'has_decorator': len(node.decorator_list) > 0,
                'has_docstring': bool(ast.get_docstring(node))
            })
            for dec in node.decorator_list:
                decorators.append({
                    'func': node.name,
                    'decorator': _get_decorator_name(dec)
                })
    
    results['info'].append({
        'classes_count': len(classes),
        'functions_count': len(functions),
        'decorators_used': decorators
    })
    
    # ========== 5. Vérification des patterns ==========
    print("🔍 Vérification des patterns...")
    
    patterns = [
        (r'@\w+\s*\n\s*def', 'Decorateur suivi de def sur nouvelle ligne - indentation requise'),
        (r'@\w+\s*\n\s*class', 'Decorateur suivi de class sur nouvelle ligne - indentation requise'),
        (r'def\s+\w+\([^)]*$', 'Définition de fonction non terminée'),
        (r'class\s+\w+[^:]*$', 'Classe sans : final'),
        (r'"""[^"]*$', 'Docstring non fermée'),
        (r"'''[^']*$", 'Docstring non fermée'),
    ]
    
    lines = code.split('\n')
    for i, line in enumerate(lines, 1):
        for pattern, message in patterns:
            if re.search(pattern, line):
                results['warnings'].append({
                    'type': 'PATTERN_WARNING',
                    'line': i,
                    'message': f"{message}: {line[:50]}..."
                })
    
    # ========== Résultats ==========
    results['valid'] = len([e for e in results['errors'] if e['type'] == 'AST_SYNTAX_ERROR']) == 0
    
    return results


def _get_error_context(code: str, line_num: int, context_lines: int = 3) -> List[str]:
    """Récupérer le contexte autour d'une erreur"""
    lines = code.split('\n')
    start = max(0, line_num - context_lines - 1)
    end = min(len(lines), line_num + context_lines)
    
    context = []
    for i in range(start, end):
        marker = '>>>' if i + 1 == line_num else '   '
        context.append(f"{marker} {i+1:4d}: {lines[i]}")
    
    return context


def _get_decorator_name(dec: ast.AST) -> str:
    """Récupérer le nom d'un décorateur"""
    if isinstance(dec, ast.Name):
        return dec.id
    elif isinstance(dec, ast.Attribute):
        return dec.attr
    elif isinstance(dec, ast.Call):
        return _get_decorator_name(dec.func)
    return 'unknown'


def main():
    """Test principal"""
    test_file = '/workspace/user_input_files/pasted-text-2026-01-31T00-31-01.txt'
    report_file = '/workspace/deep_analysis_report.json'
    
    print("=" * 60)
    print("ANALYSE SYNTAXIQUE PROFONDE")
    print("=" * 60)
    
    with open(test_file, 'r', encoding='utf-8') as f:
        code = f.read()
    
    print(f"\n📄 Fichier: {test_file}")
    print(f"📏 Taille: {len(code):,} caractères")
    
    # Analyse
    results = deep_syntax_analysis(code)
    
    # Afficher les résultats
    print("\n" + "=" * 60)
    print("RÉSULTATS")
    print("=" * 60)
    
    print(f"\n✅ AST valide: {results['valid']}")
    print(f"📊 Tokens: {results['token_count']}")
    
    if results['errors']:
        print(f"\n❌ {len(results['errors'])} erreur(s):")
        for err in results['errors'][:5]:
            print(f"   Ligne {err['line']}: {err['message']}")
            for ctx in err.get('context', []):
                print(f"      {ctx}")
    
    if results['warnings']:
        print(f"\n⚠️  {len(results['warnings'])} warning(s):")
        unique_warnings = {}
        for w in results['warnings']:
            key = f"{w['type']}-{w.get('line', 0)}"
            if key not in unique_warnings:
                unique_warnings[key] = w
        
        for w in list(unique_warnings.values())[:10]:
            print(f"   - {w['type']}: {w['message'][:60]}")
    
    if results['info']:
        info = results['info'][0]
        print(f"\n📊 Structure:")
        print(f"   Classes: {info['classes_count']}")
        print(f"   Fonctions: {info['functions_count']}")
        
        if info.get('decorators_used'):
            print(f"   Décorateurs utilisés:")
            for dec in info['decorators_used'][:5]:
                print(f"      - {dec['decorator']} sur {dec['func']}")
    
    # Sauvegarder le rapport
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump({
            'file': test_file,
            'size': len(code),
            'valid': results['valid'],
            'token_count': results['token_count'],
            'errors': results['errors'],
            'warnings': results['warnings'],
            'info': results['info']
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Rapport sauvegardé: {report_file}")
    
    return results


if __name__ == '__main__':
    main()
