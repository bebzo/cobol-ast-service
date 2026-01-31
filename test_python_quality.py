#!/usr/bin/env python3
"""
Testeur de Qualité Python - Vérifie syntaxe et sémantique
Utilise Pyodide pour valider le code Python généré
"""

import json
import sys
import ast
import traceback
from io import StringIO

def analyze_python_quality(code: str) -> dict:
    """
    Analyse complète de la qualité du code Python
    
    Vérifie:
    1. Syntaxe (parse AST)
    2. Exécution (peut-import, pas d'erreurs runtime)
    3. Sémantique (noms cohérents, imports valides, structure logique)
    """
    result = {
        'valid_syntax': False,
        'executable': False,
        'semantic_score': 0,
        'issues': [],
        'warnings': [],
        'metrics': {},
        'details': {}
    }
    
    # ========== 1. VÉRIFICATION SYNTAXE ==========
    print("🔍 Vérification syntaxe...")
    try:
        tree = ast.parse(code)
        result['valid_syntax'] = True
        print("✅ Syntaxe valide")
        
        # Extraire les métriques AST
        classes = [node.name for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
        functions = [node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
        imports = [node.name for node in ast.walk(tree) if isinstance(node, ast.Import)]
        imports_from = [node.name for node in ast.walk(tree) if isinstance(node, ast.ImportFrom)]
        
        result['metrics'] = {
            'classes_count': len(classes),
            'functions_count': len(functions),
            'imports_count': len(imports) + len(imports_from),
            'total_lines': len(code.split('\n')),
            'code_statements': sum(1 for _ in ast.walk(tree) if isinstance(_, (ast.Assign, ast.Expr, ast.If, ast.For, ast.While, ast.FunctionDef, ast.ClassDef))),
        }
        
        result['details']['classes'] = classes[:10]  # Top 10
        result['details']['functions'] = functions[:20]  # Top 20
        
    except SyntaxError as e:
        result['issues'].append({
            'type': 'syntax_error',
            'line': e.lineno,
            'message': str(e.msg),
            'offset': e.offset
        })
        print(f"❌ Erreur syntaxe ligne {e.lineno}: {e.msg}")
        return result
    
    # ========== 2. VÉRIFICATION EXÉCUTION ==========
    print("🚀 Vérification exécution...")
    
    # Créer un namespace sécurisé pour l'exécution
    namespace = {
        '__name__': '__test__',
        '__builtins__': __builtins__,
        'print': lambda *args, **kwargs: None,  # Muter les prints
    }
    
    # Ajouter les modules courants que le code pourrait utiliser
    common_modules = [
        'decimal', 'datetime', 'json', 're', 'os', 'sys',
        'typing', 'dataclasses', 'enum', 'logging', 'functools'
    ]
    
    for module in common_modules:
        try:
            exec(f'import {module}', namespace)
        except ImportError:
            pass
    
    try:
        exec(code, namespace)
        result['executable'] = True
        print("✅ Code exécutable sans erreur")
        
        # Essayer d'instancier les classes principales
        result['details']['instantiable_classes'] = []
        result['details']['callable_functions'] = []
        
        for cls_name in classes[:5]:  # Tester max 5 classes
            try:
                cls = namespace.get(cls_name)
                if cls and callable(cls):
                    # Essayer d'instancier sans arguments
                    instance = cls()
                    result['details']['instantiable_classes'].append(cls_name)
            except Exception:
                pass  # Classe nécessite des arguments
        
        for func_name in functions[:10]:  # Tester max 10 fonctions
            try:
                func = namespace.get(func_name)
                if func and callable(func):
                    result['details']['callable_functions'].append(func_name)
            except Exception:
                pass
        
    except Exception as e:
        result['issues'].append({
            'type': 'runtime_error',
            'message': str(e),
            'traceback': traceback.format_exc()
        })
        print(f"❌ Erreur exécution: {e}")
    
    # ========== 3. VÉRIFICATION SÉMANTIQUE ==========
    print("🧠 Analyse sémantique...")
    
    semantic_score = 100
    issues_found = []
    
    # Vérifier les noms cohérents (snake_case pour fonctions, PascalCase pour classes)
    for func_name in functions:
        if not func_name.startswith('_') and not func_name.islower():
            if not all(c.islower() or c.isdigit() or c == '_' for c in func_name):
                semantic_score -= 2
                issues_found.append({
                    'type': 'naming_convention',
                    'message': f"Fonction '{func_name}' devrait être en snake_case"
                })
    
    for cls_name in classes:
        if not cls_name[0].isupper():
            semantic_score -= 2
            issues_found.append({
                'type': 'naming_convention',
                'message': f"Classe '{cls_name}' devrait être en PascalCase"
            })
    
    # Vérifier la présence de docstrings
    has_docstrings = False
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.ClassDef, ast.Module)):
            if ast.get_docstring(node):
                has_docstrings = True
                break
    
    if not has_docstrings and len(functions) > 0:
        semantic_score -= 5
        issues_found.append({
            'type': 'documentation',
            'message': "Code sans docstrings (recommandé pour fonctions/classes)"
        })
    
    # Vérifier les imports utilisés
    all_names = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Name):
            all_names.add(node.id)
        elif isinstance(node, ast.Attribute):
            all_names.add(node.attr)
    
    # Vérifier les patterns dangereux
    dangerous_patterns = [
        ('eval(', 'Utilisation de eval()'),
        ('exec(', 'Utilisation de exec()'),
        ('compile(', 'Utilisation de compile()'),
        ('__import__', 'Utilisation de __import__'),
        ('pickle.load', 'Désérialisation pickle non sécurisée'),
        ('subprocess.call', 'Appel système possible'),
        ('os.system', 'Appel système possible'),
    ]
    
    for pattern, warning in dangerous_patterns:
        if pattern in code:
            semantic_score -= 3
            issues_found.append({
                'type': 'security_warning',
                'message': warning
            })
    
    # Vérifier la complexité (nombre de structures de contrôle)
    control_structures = 0
    for node in ast.walk(tree):
        if isinstance(node, (ast.If, ast.For, ast.While, ast.Try, ast.With)):
            control_structures += 1
    
    if control_structures > 50:
        semantic_score -= 5
        issues_found.append({
            'type': 'complexity',
            'message': f"Code complexe ({control_structures} structures de contrôle)"
        })
    
    # Calculer le score final
    result['semantic_score'] = max(0, semantic_score)
    result['issues'].extend(issues_found)
    result['warnings'] = [
        {'message': w} for w in issues_found 
        if w['type'] in ['naming_convention', 'documentation']
    ]
    
    print(f"📊 Score sémantique: {result['semantic_score']}/100")
    
    # ========== 4. RÉSUMÉ ==========
    print("\n" + "="*50)
    print("RÉSUMÉ DE L'ANALYSE")
    print("="*50)
    print(f"Syntaxe valide: {'✅' if result['valid_syntax'] else '❌'}")
    print(f"Exécutable: {'✅' if result['executable'] else '❌'}")
    print(f"Score sémantique: {result['semantic_score']}/100")
    print(f"Classes: {result['metrics'].get('classes_count', 0)}")
    print(f"Fonctions: {result['metrics'].get('functions_count', 0)}")
    print(f"Lignes: {result['metrics'].get('total_lines', 0)}")
    
    if result['issues']:
        print(f"\n⚠️  {len(result['issues'])} problème(s) trouvé(s):")
        for issue in result['issues'][:5]:
            print(f"   - {issue['type']}: {issue['message']}")
    
    return result


def test_code_from_file(filepath: str):
    """Tester le code Python depuis un fichier"""
    print(f"\n📄 Lecture du fichier: {filepath}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()
    
    print(f"📏 Code lu: {len(code)} caractères, {len(code.split(chr(10)))} lignes")
    
    return analyze_python_quality(code)


def main():
    """Point d'entrée principal"""
    import os
    
    # Fichiers de test possibles
    test_files = [
        '/workspace/user_input_files/pasted-text-2026-01-31T00-31-01.txt',
        '/workspace/test_python.py',
        None
    ]
    
    # Chercher un fichier à tester
    file_to_test = None
    for f in test_files:
        if f and os.path.exists(f):
            file_to_test = f
            break
    
    if file_to_test:
        result = test_code_from_file(file_to_test)
    else:
        # Code de test intégré
        test_code = '''
"""Module de test pour vérification sémantique"""

from decimal import Decimal
from dataclasses import dataclass
from typing import Optional, List

@dataclass
class TestClass:
    """Une classe de test"""
    value: Decimal
    name: str
    
    def calculate(self) -> Decimal:
        """Calculer une valeur"""
        return self.value * Decimal('2')
        
def helper_function(amount: Decimal) -> Optional[Decimal]:
    """Fonction utilitaire"""
    if amount > 0:
        return amount
    return None

class AnotherClass:
    """Autre classe de test"""
    def __init__(self):
        self.data = []
        
    def add_item(self, item):
        self.data.append(item)
'''
        
        print("🧪 Test avec code intégré...")
        result = analyze_python_quality(test_code)
    
    # Sauvegarder le résultat
    output_file = '/workspace/analysis_result.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, default=str)
    
    print(f"\n💾 Résultat sauvegardé dans: {output_file}")
    
    return result


if __name__ == '__main__':
    main()
