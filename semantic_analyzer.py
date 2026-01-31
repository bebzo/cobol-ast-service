#!/usr/bin/env python3
"""
Analyseur de Qualité Python - Détection et Correction des Erreurs Sémantiques
"""

import re
import ast
import json
from typing import Dict, List, Tuple, Optional

class PythonQualityAnalyzer:
    """Analyseur complet de qualité Python"""
    
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.fixes = []
        
    def analyze(self, code: str) -> Dict:
        """Analyse complète du code"""
        return {
            'syntax_errors': self._find_syntax_errors(code),
            'semantic_issues': self._find_semantic_issues(code),
            'code_smells': self._find_code_smells(code),
            'suggested_fixes': self.fixes,
            'quality_score': self._calculate_quality_score()
        }
    
    def _find_syntax_errors(self, code: str) -> List[Dict]:
        """Trouver les erreurs de syntaxe"""
        errors = []
        lines = code.split('\n')
        
        for i, line in enumerate(lines, 1):
            line = line.rstrip()
            
            # Vérifier indentation après def/class/decorator
            if re.match(r'^@\w+', line):
                # Ligne suivante doit être def ou class avec indentation
                if i < len(lines):
                    next_line = lines[i].rstrip()
                    if next_line and not next_line.startswith((' ', '\t', '@', '#')):
                        if next_line.startswith(('def ', 'class ')):
                            errors.append({
                                'line': i + 1,
                                'type': 'indentation_after_decorator',
                                'message': f"Ligne {i+1}: '{next_line[:30]}...' devrait être indentée après le décorateur",
                                'severity': 'error'
                            })
            
            # Vérifier docstring mal placée après def
            if re.match(r'^    """', line):
                # Vérifier si la ligne précédente est une定义
                if i > 1:
                    prev_line = lines[i-2].rstrip()
                    if prev_line.startswith('def ') or prev_line.startswith('class '):
                        # La docstring devrait être sur la même ligne ou la ligne précédente
                        if not prev_line.endswith(':'):
                            errors.append({
                                'line': i,
                                'type': 'malformed_docstring',
                                'message': "Docstring mal placée après définition de fonction/classe",
                                'severity': 'error'
                            })
            
            # Vérifier les lignes de continuation
            if line.endswith('\\'):
                continuation = line.count('\\')
                # Lescontinuations doivent être suivies
                pass
                
        return errors
    
    def _find_semantic_issues(self, code: str) -> List[Dict]:
        """Trouver les problèmes sémantiques"""
        issues = []
        lines = code.split('\n')
        
        in_triple_quote = False
        triple_quote_char = None
        
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            
            # Vérifier les chaînes triples
            if '"""' in stripped or "'''" in stripped:
                if not in_triple_quote:
                    # Ouvrir
                    count = stripped.count('"""')
                    if count % 2 == 1:
                        in_triple_quote = True
                        triple_quote_char = '"""'
                    count = stripped.count("'''")
                    if count % 2 == 1:
                        in_triple_quote = True
                        triple_quote_char = "'''"
                else:
                    # Fermer
                    count = stripped.count(triple_quote_char)
                    if count % 2 == 1:
                        in_triple_quote = False
            
            # Vérifier les parenthèses non fermées
            if '(' in stripped and ')' not in stripped and not stripped.endswith('\\'):
                if not any(stripped.startswith(kw) for kw in ['import ', 'from ', 'class ', 'def ', 'if ', 'elif ', 'for ', 'while ', 'with ', 'try:', 'except ', 'return ', 'raise ']):
                    if not stripped.startswith('#'):
                        issues.append({
                            'line': i,
                            'type': 'unclosed_paren',
                            'message': f"Parenthèses non fermées: {stripped[:50]}...",
                            'severity': 'warning'
                        })
            
            # Vérifier les crochets non fermés
            if '[' in stripped and ']' not in stripped:
                if not stripped.startswith('#'):
                    issues.append({
                        'line': i,
                        'type': 'unclosed_bracket',
                        'message': f"Crochets non fermés: {stripped[:50]}...",
                        'severity': 'warning'
                    })
            
            # Vérifier les accolades non fermées
            if '{' in stripped and '}' not in stripped:
                if not stripped.startswith('#'):
                    issues.append({
                        'line': i,
                        'type': 'unclosed_brace',
                        'message': f"Accolades non fermées: {stripped[:50]}...",
                        'severity': 'warning'
                    })
        
        if in_triple_quote:
            issues.append({
                'line': len(lines),
                'type': 'unclosed_triple_quote',
                'message': "Docstring triple-quote non fermée à la fin du fichier",
                'severity': 'error'
            })
            
        return issues
    
    def _find_code_smells(self, code: str) -> List[Dict]:
        """Trouver les code smells"""
        smells = []
        lines = code.split('\n')
        
        # Compter les lignes
        total_lines = len(lines)
        code_lines = [l for l in lines if l.strip() and not l.strip().startswith('#')]
        
        if total_lines > 1000:
            smells.append({
                'type': 'too_long',
                'message': f"Fichier très long ({total_lines} lignes) - considérer la division",
                'severity': 'info'
            })
        
        # Vérifier les fonctions trop longues
        in_function = False
        func_start = 0
        for i, line in enumerate(lines):
            if re.match(r'^def \w+|^\s*def \w+', line):
                in_function = True
                func_start = i
            elif in_function and (line.startswith('def ') or line.startswith('class ') or (line.strip() and not line.startswith(' ') and not line.startswith('\t'))):
                func_length = i - func_start
                if func_length > 100:
                    smells.append({
                        'line': func_start + 1,
                        'type': 'long_function',
                        'message': f"Fonction de {func_length} lignes - considérer la division",
                        'severity': 'info'
                    })
                in_function = False
        
        return smells
    
    def _calculate_quality_score(self) -> Dict:
        """Calculer le score de qualité"""
        error_count = len(self.errors)
        warning_count = len(self.warnings)
        
        # Score de base
        score = 100
        
        # Déduire pour les erreurs
        score -= error_count * 10
        
        # Déduire pour les warnings
        score -= warning_count * 2
        
        # Score final
        score = max(0, min(100, score))
        
        grade = 'A' if score >= 90 else 'B' if score >= 80 else 'C' if score >= 70 else 'D' if score >= 50 else 'F'
        
        return {
            'score': score,
            'grade': grade,
            'error_count': error_count,
            'warning_count': warning_count
        }


def analyze_and_fix_code(code: str) -> Dict:
    """Analyser et proposer des corrections"""
    analyzer = PythonQualityAnalyzer()
    result = analyzer.analyze(code)
    
    # Proposer des corrections automatiques
    fixed_code = code
    
    # Corriger les docstrings mal placées
    lines = fixed_code.split('\n')
    fixed_lines = []
    
    for i, line in enumerate(lines):
        if re.match(r'^    """', line):
            # Vérifier si c'est après une定义
            if i > 0:
                prev_line = lines[i-1].rstrip()
                if prev_line.startswith('def ') or prev_line.startswith('class '):
                    # Ajouter indentation à la ligne précédente
                    fixed_lines.append(prev_line + ':')
                    # Garder la docstring
                    fixed_lines.append(line)
                else:
                    fixed_lines.append(line)
            else:
                fixed_lines.append(line)
        else:
            fixed_lines.append(line)
    
    fixed_code = '\n'.join(fixed_lines)
    
    return {
        'original_analysis': result,
        'fixed_code': fixed_code,
        'can_parse_ast': _can_parse(fixed_code)
    }


def _can_parse(code: str) -> bool:
    """Vérifier si le code peut être parsé par AST"""
    try:
        ast.parse(code)
        return True
    except SyntaxError:
        return False


def main():
    """Test principal"""
    import sys
    
    # Lire le fichier problématique
    test_file = '/workspace/user_input_files/pasted-text-2026-01-31T00-31-01.txt'
    
    print("=" * 60)
    print("ANALYSEUR DE QUALITÉ PYTHON - CodeSwitch Pro")
    print("=" * 60)
    
    with open(test_file, 'r', encoding='utf-8') as f:
        code = f.read()
    
    print(f"\n📊 Fichier: {test_file}")
    print(f"📏 Taille: {len(code):,} caractères, {len(code.split(chr(10))):,} lignes")
    
    # Analyse rapide avec AST
    print("\n🔍 Test de parsabilité AST...")
    try:
        ast.parse(code)
        print("✅ Code parsable par AST")
        ast_valid = True
    except SyntaxError as e:
        print(f"❌ Erreur AST ligne {e.lineno}: {e.msg}")
        ast_valid = False
    
    # Analyse complète
    print("\n🧠 Analyse sémantique complète...")
    result = analyze_and_fix_code(code)
    
    # Afficher les résultats
    print("\n" + "=" * 60)
    print("RÉSULTATS DE L'ANALYSE")
    print("=" * 60)
    
    quality = result['original_analysis']['quality_score']
    print(f"\n📈 Score de qualité: {quality['score']}/100 (Grade: {quality['grade']})")
    print(f"   Erreurs: {quality['error_count']}")
    print(f"   Warnings: {quality['warning_count']}")
    
    issues = result['original_analysis']['syntax_errors']
    semantic = result['original_analysis']['semantic_issues']
    smells = result['original_analysis']['code_smells']
    
    if issues:
        print(f"\n❌ {len(issues)} erreur(s) de syntaxe:")
        for issue in issues[:10]:
            print(f"   - Ligne {issue['line']}: {issue['type']}")
            print(f"     {issue['message'][:80]}")
    
    if semantic:
        print(f"\n⚠️  {len(semantic)} problème(s) sémantique(s):")
        for issue in semantic[:10]:
            print(f"   - Ligne {issue['line']}: {issue['type']}")
            print(f"     {issue['message'][:80]}")
    
    if smells:
        print(f"\n💡 {len(smells)} code smell(s):")
        for smell in smells[:5]:
            print(f"   - {smell['type']}: {smell['message'][:60]}")
    
    # Sauvegarder le rapport
    output = {
        'file': test_file,
        'size': len(code),
        'lines': len(code.split('\n')),
        'ast_valid': ast_valid,
        'quality_score': quality,
        'syntax_errors': issues,
        'semantic_issues': semantic,
        'code_smells': smells,
        'analysis_timestamp': str(__import__('datetime').datetime.now())
    }
    
    output_file = '/workspace/python_quality_report.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Rapport sauvegardé: {output_file}")
    
    # Tenter de corriger
    if not ast_valid:
        print("\n🔧 Tentative de correction...")
        if result['can_parse_ast']:
            print("✅ Corrections appliquées avec succès!")
            
            # Sauvegarder le code corrigé
            fixed_file = '/workspace/code_fixed.py'
            with open(fixed_file, 'w', encoding='utf-8') as f:
                f.write(result['fixed_code'])
            print(f"💾 Code corrigé sauvegardé: {fixed_file}")
        else:
            print("⚠️  Corrections insuffisantes - erreurs persistantes")
    
    return output


if __name__ == '__main__':
    main()
