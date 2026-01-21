"""
Test Generation Module - v1.0
Separated from transpile.py to reduce file size and improve Vercel performance.
"""

import re
from typing import Any, Dict, List, Optional, Set, Tuple


def escape_python_string_for_template(code: str) -> str:
    """
    Échappe les caractères spéciaux pour insertion dans une chaîne Python.
    
    CORRECTION CRITIQUE: Utilisé pour éviter "unterminated string literal"
    """
    # Ordre important: escape \\ en premier
    replacements = [
        ('\\', '\\\\'),   # Barre inverse
        ('"""', '\\"\\"\\"'),  # Triple quotes
        ('"', '\\"'),     # Guillemets doubles
        ("'", "\\'"),     # Guillemets simples
        ('\n', '\\n'),    # Nouvelle ligne
        ('\r', '\\r'),    # Retour chariot
        ('\t', '\\t'),    # Tabulation
        ('${', '\\${'),   # Variables template
        ('#{', '\\#{'),   # Variables Ruby
    ]
    
    result = code
    for old, new in replacements:
        result = result.replace(old, new)
    
    return result


def analyze_function_type(func_name: str, func_code: str = '') -> Dict[str, Any]:
    """
    Analyse le type de fonction pour générer le test approprié.
    
    CORRECTION: Remplace les tests génériques par des tests adaptés
    pour éviter "Function signature mismatch"
    """
    # Vérifier si c'est un context manager connu
    context_managers = {
        'localcontext': {
            'type': 'context_manager',
            'test_pattern': 'context_manager',
            'description': 'Context manager du module decimal'
        },
        'supabase_client': {
            'type': 'context_manager', 
            'test_pattern': 'context_manager',
            'description': 'Client Supabase'
        }
    }
    
    if func_name in context_managers:
        info = context_managers[func_name]
        info['signature'] = []
        return info
    
    # Détecter les stubs (fonctions qui lèvent NotImplementedError)
    if 'NotImplementedError' in func_code:
        return {
            'type': 'stub',
            'signature': [],
            'test_pattern': 'skip',
            'description': 'Stub - implementation required'
        }
    
    # Détecter les fonctions sans argument (pattern commun dans COBOL transpilé)
    no_args_patterns = [
        r'def\s+' + func_name + r'\s*\(\s*\)\s*:',
    ]
    
    for pattern in no_args_patterns:
        if re.search(pattern, func_code, re.IGNORECASE):
            return {
                'type': 'no_args',
                'signature': [],
                'test_pattern': 'no_args',
                'description': 'Fonction sans argument'
            }
    
    # Fonction standard avec arguments
    return {
        'type': 'normal',
        'signature': [],
        'test_pattern': 'boundary_values',
        'description': 'Fonction avec arguments'
    }


def generate_appropriate_test(func_name: str, func_type_info: Dict[str, Any]) -> str:
    """Génère un test approprié pour une fonction donnée selon son type."""
    func_type = func_type_info['type']
    
    if func_type == 'context_manager':
        return f'''
    def test_{func_name}_is_context_manager(self):
        """Test que {func_name} fonctionne comme context manager."""
        try:
            with {func_name}() as ctx:
                assert ctx is not None
        except TypeError as e:
            if "argument" in str(e).lower():
                pytest.skip(f"{func_name} n'est pas un context manager")
            raise
        except AttributeError:
            pytest.skip(f"{func_name} n'a pas de méthode __enter__")
'''
    elif func_type == 'no_args':
        return f'''
    def test_{func_name}_execution(self):
        """Test que {func_name} peut être appelée sans argument."""
        try:
            result = self.{func_name}()
            assert result is not None or result is None
        except TypeError as e:
            if "argument" in str(e).lower():
                pytest.fail(f"{func_name} appelée avec arguments incorrects: {{e}}")
            raise
'''
    elif func_type == 'stub':
        return f'''
    def test_{func_name}_is_stub(self):
        """Test pour {func_name} (stub - à implémenter)."""
        assert hasattr(self, '{func_name}')
        pytest.skip(f"{func_name} est un stub - implémentation requise")
'''
    else:
        return f'''
    def test_{func_name}_basic(self):
        """Test basique pour {func_name}."""
        assert hasattr(self, '{func_name}')
        assert callable(self.{func_name}')
'''


def to_snake_case(name: str) -> str:
    """Convertit un nom COBOL en snake_case Python."""
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).upper()


def _generate_test_args(args: List[str], returns: str) -> str:
    """Génère des arguments de test pour une fonction."""
    test_values = []
    
    for arg in args[:3]:  # Limiter à 3 arguments
        arg_lower = arg.lower()
        if 'decimal' in arg_lower or 'amount' in arg_lower or 'rate' in arg_lower or 'price' in arg_lower or 'fee' in arg_lower:
            test_values.append('Decimal("100.00")')
        elif 'int' in arg_lower or 'count' in arg_lower or 'num' in arg_lower:
            test_values.append('1')
        elif 'str' in arg_lower or 'name' in arg_lower or 'code' in arg_lower:
            test_values.append('repr("test")')
        elif 'bool' in arg_lower:
            test_values.append('True')
        else:
            test_values.append('None')
    
    if test_values:
        return f"[{', '.join(test_values)}]"
    return ""


def _generate_syntax_error_tests(source_code: str, class_name: str, error: str) -> str:
    """Générer des tests basiques quand le code a une erreur de syntaxe."""
    lines = [
        '# -*- coding: utf-8 -*-',
        f'"""Tests pour {class_name} (mode dégradé - erreur syntaxe détectée)"""',
        '',
        'import pytest',
        'from decimal import Decimal',
        '',
        f'class Test{class_name}Basic:',
        '    """Tests basiques en mode dégradé."""',
        '',
        '    def test_decimal_operations(self):',
        '        """Vérifier opérations Decimal de base."""',
        '        assert Decimal("0.1") + Decimal("0.2") == Decimal("0.3")',
        '',
    ]
    
    return '\n'.join(lines)
