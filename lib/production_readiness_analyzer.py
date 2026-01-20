"""
Production Readiness Analyzer - Real Code Analysis Engine

Ce module analyse le code Python et COBOL pour évaluer la maturité opérationnelle
et calculer un score de Production Readiness (0-100) basé sur des métriques réelles.

Auteur: MiniMax Agent
Version: 1.0.0 - Production Ready
"""

import ast
import re
import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
from decimal import Decimal
import json


class Severity(Enum):
    """Niveaux de sévérité des problèmes."""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class Category(Enum):
    """Catégories de vérification."""
    ERROR_HANDLING = "Error Handling"
    SECURITY = "Security"
    TESTING = "Testing"
    DOCUMENTATION = "Documentation"
    TYPE_SAFETY = "Type Safety"
    THREAD_SAFETY = "Thread Safety"
    DATABASE = "Database"
    LOGGING = "Logging"
    ARCHITECTURE = "Architecture"
    PERFORMANCE = "Performance"


@dataclass
class Issue:
    """Représente un problème trouvé lors de l'analyse."""
    severity: Severity
    category: Category
    line_number: int
    message: str
    suggestion: str
    code_snippet: str = ""
    
    def to_dict(self) -> dict:
        return {
            'severity': self.severity.value,
            'category': self.category.value,
            'line_number': self.line_number,
            'message': self.message,
            'suggestion': self.suggestion,
            'code_snippet': self.code_snippet
        }


@dataclass
class Metrics:
    """Métriques détaillées de l'analyse."""
    total_lines: int = 0
    code_lines: int = 0
    comment_lines: int = 0
    blank_lines: int = 0
    
    # Python-specific
    functions_count: int = 0
    classes_count: int = 0
    dataclasses_count: int = 0
    async_functions_count: int = 0
    type_annotated_functions: int = 0
    documented_functions: int = 0
    functions_with_error_handling: int = 0
    try_blocks_count: int = 0
    test_functions_count: int = 0
    
    # Security
    hardcoded_secrets: int = 0
    dangerous_calls: int = 0
    input_validations: int = 0
    
    # Architecture
    logging_statements: int = 0
    contextvars_usage: int = 0
    lock_usage: int = 0
    
    # Database
    sql_queries: int = 0
    orm_usage: int = 0
    
    def to_dict(self) -> dict:
        return {
            'total_lines': self.total_lines,
            'code_lines': self.code_lines,
            'comment_lines': self.comment_lines,
            'blank_lines': self.blank_lines,
            'functions': self.functions_count,
            'classes': self.classes_count,
            'dataclasses': self.dataclasses_count,
            'async_functions': self.async_functions_count,
            'type_annotated': self.type_annotated_functions,
            'documented': self.documented_functions,
            'error_handled': self.functions_with_error_handling,
            'try_blocks': self.try_blocks_count,
            'test_functions': self.test_functions_count,
            'hardcoded_secrets': self.hardcoded_secrets,
            'dangerous_calls': self.dangerous_calls,
            'input_validations': self.input_validations,
            'logging_statements': self.logging_statements,
            'contextvars': self.contextvars_usage,
            'locks': self.lock_usage,
            'sql_queries': self.sql_queries,
            'orm_usage': self.orm_usage
        }


@dataclass
class ReadinessReport:
    """Rapport complet de Production Readiness."""
    file_path: str
    language: str
    score: int
    grade: str
    metrics: Metrics
    issues: List[Issue]
    summary: str
    recommendations: List[str]
    
    def to_dict(self) -> dict:
        return {
            'file_path': self.file_path,
            'language': self.language,
            'score': self.score,
            'grade': self.grade,
            'metrics': self.metrics.to_dict(),
            'issues': [i.to_dict() for i in self.issues],
            'summary': self.summary,
            'recommendations': self.recommendations
        }
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2, default=str)


class ProductionReadinessAnalyzer:
    """
    Analyseur de Production Readiness pour Python et COBOL.
    
    Calcule un score de 0-100 basé sur l'analyse statique du code,
    sans exécution du code.
    """
    
    # Patterns de sécurité dangereux
    DANGEROUS_PATTERNS = [
        (r'eval\s*\(', 'Utilisation de eval() - risque d\'injection de code'),
        (r'exec\s*\(', 'Utilisation de exec() - risque d\'injection de code'),
        (r'subprocess.*shell\s*=\s*True', 'subprocess avec shell=True - risque de commande injection'),
        (r'pickle\.loads', 'Désérialisation pickle - vulnérable à l\'exécution de code arbitraire'),
        (r'yaml\.load.*Loader\s*=\s*None', 'YAML load sans Loader sécurisé'),
        (r'md5\s*\(', 'Utilisation de MD5 obsolète - vulnérable aux collisions'),
        (r'sha1\s*\(', 'Utilisation de SHA1 obsolète'),
        (r'random\.random', 'random.random() non cryptographique'),
    ]
    
    # Mots-clés pour détecter les secrets codés en dur
    SECRET_PATTERNS = [
        r'(password|passwd|pwd|secret|api_key|apikey|auth_token|private_key)',
        r'(access_token|refresh_token)',
        r'(database_url|db_password|connection_string)',
    ]
    
    def __init__(self):
        self.issues: List[Issue] = []
        self.metrics = Metrics()
    
    def analyze_file(self, file_path: str) -> ReadinessReport:
        """Analyse un fichier et retourne un rapport complet."""
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        if file_path.endswith('.py'):
            return self.analyze_python(content, file_path)
        elif file_path.endswith(('.cbl', '.cob', '.cpy')):
            return self.analyze_cobol(content, file_path)
        else:
            # Analyse générique
            return self._create_generic_report(file_path, content)
    
    def analyze_python(self, code: str, file_path: str) -> ReadinessReport:
        """Analyse du code Python via AST."""
        self.issues = []
        self.metrics = Metrics()
        
        # Analyse des lignes
        lines = code.split('\n')
        self.metrics.total_lines = len(lines)
        self.metrics.code_lines = len([l for l in lines if l.strip() and not l.strip().startswith('#')])
        self.metrics.comment_lines = len([l for l in lines if l.strip().startswith('#')])
        self.metrics.blank_lines = len([l for l in lines if not l.strip()])
        
        # Parsing AST
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            self.issues.append(Issue(
                severity=Severity.CRITICAL,
                category=Category.ARCHITECTURE,
                line_number=e.lineno or 1,
                message=f"Syntax Error: {e.msg}",
                suggestion="Corrigez la syntaxe Python avant l'analyse"
            ))
            return self._create_report(file_path, "Python", code)
        
        # Analyse des nœuds AST
        self._analyze_ast(tree, code)
        
        # Analyse de sécurité par pattern
        self._analyze_security_patterns(code, lines)
        
        return self._create_report(file_path, "Python", code)
    
    def _analyze_ast(self, tree: ast.AST, code: str) -> None:
        """Parcourt l'arbre AST pour collecter les métriques."""
        
        class PythonAnalyzer(ast.NodeVisitor):
            def __init__(self, analyzer: 'ProductionReadinessAnalyzer'):
                self.analyzer = analyzer
            
            def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
                self.analyzer.metrics.functions_count += 1
                
                # Vérification du type de retour
                if node.returns is not None:
                    self.analyzer.metrics.type_annotated_functions += 1
                elif not node.name.startswith('_'):
                    # Fonction publique sans annotation de type
                    self.analyzer.issues.append(Issue(
                        severity=Severity.MEDIUM,
                        category=Category.TYPE_SAFETY,
                        line_number=node.lineno,
                        message=f"Fonction '{node.name}' sans annotation de type de retour",
                        suggestion="Ajoutez -> Type pour le type de retour",
                        code_snippet=self._get_source_snippet(node, code)
                    ))
                
                # Vérification de la documentation
                if ast.get_docstring(node) is None:
                    if not node.name.startswith('_'):
                        self.analyzer.metrics.documented_functions += 1
                else:
                    self.analyzer.metrics.documented_functions += 1
                
                # Vérification du try/except dans la fonction
                has_try = False
                for child in ast.walk(node):
                    if isinstance(child, ast.Try):
                        has_try = True
                        self.analyzer.metrics.try_blocks_count += 1
                
                if has_try:
                    self.analyzer.metrics.functions_with_error_handling += 1
                
                # Vérification async
                if isinstance(node, ast.AsyncFunctionDef):
                    self.analyzer.metrics.async_functions_count += 1
                
                self.generic_visit(node)
            
            def visit_ClassDef(self, node: ast.ClassDef) -> None:
                self.analyzer.metrics.classes_count += 1
                
                # Vérification si c'est un dataclass
                for decorator in node.decorator_list:
                    if isinstance(decorator, ast.Name) and decorator.id == 'dataclass':
                        self.analyzer.metrics.dataclasses_count += 1
                        break
                
                self.generic_visit(node)
            
            def visit_Try(self, node: ast.Try) -> None:
                self.analyzer.metrics.try_blocks_count += 1
                self.generic_visit(node)
            
            def visit_Import(self, node: ast.Import) -> None:
                for alias in node.names:
                    name = alias.name or alias.asname or ''
                    if 'logging' in name:
                        self.analyzer.metrics.logging_statements += 1
                    elif any(orm in name.lower() for orm in ['sqlalchemy', 'django', 'orm']):
                        self.analyzer.metrics.orm_usage += 1
                    elif 'contextvars' in name:
                        self.analyzer.metrics.contextvars_usage += 1
                    elif any(t in name.lower() for t in ['threading', 'multiprocessing']):
                        self.analyzer._check_thread_safety(node, code)
                self.generic_visit(node)
            
            def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
                if node.module:
                    if 'logging' in node.module:
                        self.analyzer.metrics.logging_statements += 1
                    elif any(orm in node.module.lower() for orm in ['sqlalchemy', 'django']):
                        self.analyzer.metrics.orm_usage += 1
                    elif 'contextvars' in node.module:
                        self.analyzer.metrics.contextvars_usage += 1
                    elif any(t in node.module.lower() for t in ['threading', 'multiprocessing']):
                        self.analyzer._check_thread_safety(node, code)
                self.generic_visit(node)
            
            def visit_Call(self, node: ast.Call) -> None:
                # Détection des requêtes SQL brutes
                if isinstance(node.func, ast.Name):
                    if node.func.id.lower() in ['execute', 'query', 'raw_query']:
                        self.analyzer.metrics.sql_queries += 1
                self.generic_visit(node)
            
            def _get_source_snippet(self, node: ast.AST, code: str) -> str:
                """Récupère le snippet de code source."""
                lines = code.split('\n')
                if node.lineno <= len(lines):
                    return lines[node.lineno - 1].strip()
                return ""
        
        analyzer = PythonAnalyzer(self)
        analyzer.visit(tree)
        
        # Analyse des tests
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                if node.name.startswith('test_') or node.name.startswith('Test'):
                    self.metrics.test_functions_count += 1
    
    def _check_thread_safety(self, node: ast.AST, code: str) -> None:
        """Vérifie les patterns de thread safety."""
        lines = code.split('\n')
        
        # Chercher Lock() ou RLock()
        for i, line in enumerate(lines):
            if 'Lock()' in line or 'RLock()' in line:
                self.metrics.lock_usage += 1
                return
        
        # Si threading est utilisé mais sans Lock
        self.issues.append(Issue(
            severity=Severity.MEDIUM,
            category=Category.THREAD_SAFETY,
            line_number=node.lineno if hasattr(node, 'lineno') else 1,
            message="Module 'threading' utilisé sans détection de verrous (Lock)",
            suggestion="Ajoutez des Lock() pour les opérations non-atomiques",
            code_snippet=self._get_line(code, node.lineno if hasattr(node, 'lineno') else 1)
        ))
    
    def _analyze_security_patterns(self, code: str, lines: List[str]) -> None:
        """Analyse les patterns de sécurité."""
        for i, line in enumerate(lines, 1):
            # Vérification des patterns dangereux
            for pattern, message in self.DANGEROUS_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    self.metrics.dangerous_calls += 1
                    self.issues.append(Issue(
                        severity=Severity.CRITICAL,
                        category=Category.SECURITY,
                        line_number=i,
                        message=message,
                        suggestion="Remplacez par une alternative sécurisée",
                        code_snippet=line.strip()
                    ))
            
            # Vérification des secrets codés en dur
            for pattern in self.SECRET_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    # Éviter les faux positifs (commentaires, docstrings)
                    if not line.strip().startswith('#') and '"""' not in line and "'''" not in line:
                        self.metrics.hardcoded_secrets += 1
                        self.issues.append(Issue(
                            severity=Severity.HIGH,
                            category=Category.SECURITY,
                            line_number=i,
                            message=f"Secret potentiellement codé en dur détecté",
                            suggestion="Utilisez des variables d'environnement ou un gestionnaire de secrets",
                            code_snippet=line.strip()
                        ))
            
            # Vérification de la validation d'entrées
            if any(kw in line.lower() for kw in ['validate', 'sanitize', 'check_input', 'assert']):
                self.metrics.input_validations += 1
    
    def _get_line(self, code: str, line_num: int) -> str:
        """Récupère une ligne de code."""
        lines = code.split('\n')
        if 1 <= line_num <= len(lines):
            return lines[line_num - 1].strip()
        return ""
    
    def analyze_cobol(self, code: str, file_path: str) -> ReadinessReport:
        """Analyse du code COBOL via patterns Regex."""
        self.issues = []
        self.metrics = Metrics()
        
        lines = code.split('\n')
        self.metrics.total_lines = len(lines)
        self.metrics.code_lines = len([l for l in lines if l.strip() and not l.strip().startswith('*')])
        
        # Vérifications COBOL
        upper_code = code.upper()
        
        # Vérification des GO TO (spaghetti code)
        goto_count = len(re.findall(r'\bGO\s+TO\b', upper_code))
        if goto_count > 5:
            self.issues.append(Issue(
                severity=Severity.MEDIUM,
                category=Category.ARCHITECTURE,
                line_number=1,
                message=f"Excessive GO TO statements detected ({goto_count})",
                suggestion="Refactor using structured PERFORM statements"
            ))
        
        # Vérification SQL sans gestion d'erreurs
        sql_matches = list(re.finditer(r'EXEC\s+SQL', code, re.IGNORECASE))
        self.metrics.sql_queries = len(sql_matches)
        
        for match in sql_matches:
            line_num = code[:match.start()].count('\n') + 1
            # Vérifier si SQLCODE est checked après
            end_exec_match = re.search(r'END-EXEC[.\s]*[\w-]*', code[match.start():], re.IGNORECASE)
            if end_exec_match:
                after_sql = code[match.start() + end_exec_match.end():match.start() + end_exec_match.end() + 100]
                if 'SQLCODE' not in after_sql.upper() and 'SQLSTATE' not in after_sql.upper():
                    self.issues.append(Issue(
                        severity=Severity.HIGH,
                        category=Category.DATABASE,
                        line_number=line_num,
                        message="EXEC SQL without SQLCODE/SQLSTATE error checking",
                        suggestion="Add error handling after every database operation"
                    ))
        
        # Vérification ON SIZE ERROR pour les calculs
        compute_count = len(re.findall(r'\bCOMPUTE\b', upper_code))
        on_size_error_count = len(re.findall(r'\bON\s+SIZE\s+ERROR\b', upper_code))
        
        if compute_count > 0 and on_size_error_count == 0:
            self.issues.append(Issue(
                severity=Severity.MEDIUM,
                category=Category.ERROR_HANDLING,
                line_number=1,
                message=f"{compute_count} COMPUTE statements without ON SIZE ERROR handling",
                suggestion="Add ON SIZE ERROR clause to prevent silent overflow"
            ))
        
        return self._create_report(file_path, "COBOL", code)
    
    def _create_generic_report(self, file_path: str, code: str) -> ReadinessReport:
        """Crée un rapport générique pour fichiers non-Python/COBOL."""
        self.issues = []
        self.metrics = Metrics()
        
        lines = code.split('\n')
        self.metrics.total_lines = len(lines)
        self.metrics.code_lines = len([l for l in lines if l.strip()])
        
        return self._create_report(file_path, "Unknown", code)
    
    def _create_report(self, file_path: str, language: str, code: str) -> ReadinessReport:
        """Crée le rapport final avec le score calculé."""
        score = self._calculate_score()
        grade = self._get_grade(score)
        summary = self._generate_summary()
        recommendations = self._generate_recommendations()
        
        return ReadinessReport(
            file_path=file_path,
            language=language,
            score=score,
            grade=grade,
            metrics=self.metrics,
            issues=self.issues,
            summary=summary,
            recommendations=recommendations
        )
    
    def _calculate_score(self) -> int:
        """Calcule le score de Production Readiness (0-100)."""
        score = 100
        
        # Deductions pour les problèmes critiques (-20 chacun, max 60)
        critical_count = sum(1 for i in self.issues if i.severity == Severity.CRITICAL)
        score -= min(critical_count * 20, 60)
        
        # Deductions pour les problèmes HIGH (-10 chacun, max 30)
        high_count = sum(1 for i in self.issues if i.severity == Severity.HIGH)
        score -= min(high_count * 10, 30)
        
        # Deductions pour les problèmes MEDIUM (-5 chacun, max 20)
        medium_count = sum(1 for i in self.issues if i.severity == Severity.MEDIUM)
        score -= min(medium_count * 5, 20)
        
        # Deductions pour les problèmes LOW (-2 chacun, max 10)
        low_count = sum(1 for i in self.issues if i.severity == Severity.LOW)
        score -= min(low_count * 2, 10)
        
        # Bonus pour les bonnes pratiques
        # Tests coverage (si tests présents)
        if self.metrics.functions_count > 0:
            test_ratio = self.metrics.test_functions_count / self.metrics.functions_count
            if test_ratio >= 0.3:
                score += 5
            elif test_ratio >= 0.5:
                score += 10
        
        # Bonus pour la documentation
        if self.metrics.functions_count > 0:
            doc_ratio = self.metrics.documented_functions / self.metrics.functions_count
            if doc_ratio >= 0.7:
                score += 5
        
        # Bonus pour le logging
        if self.metrics.logging_statements > 0:
            score += 3
        
        # Bonus pour async/thread safety
        if self.metrics.async_functions_count > 0:
            score += 3
        if self.metrics.contextvars_usage > 0:
            score += 2
        if self.metrics.lock_usage > 0:
            score += 2
        
        return max(0, min(score, 100))
    
    def _get_grade(self, score: int) -> str:
        """Convertit le score en lettre de grade."""
        if score >= 95:
            return "A+"
        elif score >= 90:
            return "A"
        elif score >= 85:
            return "A-"
        elif score >= 80:
            return "B+"
        elif score >= 75:
            return "B"
        elif score >= 70:
            return "B-"
        elif score >= 65:
            return "C+"
        elif score >= 60:
            return "C"
        elif score >= 55:
            return "C-"
        elif score >= 50:
            return "D+"
        elif score >= 45:
            return "D"
        elif score >= 40:
            return "D-"
        else:
            return "F"
    
    def _generate_summary(self) -> str:
        """Génère un résumé textuel du rapport."""
        critical = sum(1 for i in self.issues if i.severity == Severity.CRITICAL)
        high = sum(1 for i in self.issues if i.severity == Severity.HIGH)
        medium = sum(1 for i in self.issues if i.severity == Severity.MEDIUM)
        
        summary_parts = []
        
        if critical > 0:
            summary_parts.append(f"{critical} CRITICAL security/compatibility issue(s) require immediate attention")
        if high > 0:
            summary_parts.append(f"{high} HIGH priority issue(s) should be addressed before production")
        if medium > 0:
            summary_parts.append(f"{medium} MEDIUM issue(s) are recommended improvements")
        
        if not summary_parts:
            summary_parts.append("Code passes all standard production readiness checks")
        
        return ". ".join(summary_parts) + "."
    
    def _generate_recommendations(self) -> List[str]:
        """Génère des recommandations spécifiques."""
        recommendations = []
        
        # Basé sur les métriques
        if self.metrics.functions_count > 0:
            if self.metrics.test_functions_count == 0:
                recommendations.append("Add unit tests for all business logic functions")
            if self.metrics.type_annotated_functions / self.metrics.functions_count < 0.5:
                recommendations.append("Increase type annotation coverage for better IDE support and safety")
        
        if self.metrics.logging_statements == 0 and self.metrics.functions_count > 5:
            recommendations.append("Add logging statements for production monitoring and debugging")
        
        if self.metrics.hardcoded_secrets > 0:
            recommendations.append("Move all secrets to environment variables or a secrets manager")
        
        if self.metrics.dangerous_calls > 0:
            recommendations.append("Review and replace dangerous function calls (eval, exec, pickle)")
        
        if self.metrics.sql_queries > 0 and self.metrics.orm_usage == 0:
            recommendations.append("Consider using an ORM layer for safer database operations")
        
        if self.metrics.contextvars_usage == 0 and self.metrics.functions_count > 10:
            recommendations.append("Add contextvars for request-scoped data in web applications")
        
        return recommendations
    
    def analyze_code_string(self, code: str, language: str = "Python") -> ReadinessReport:
        """Analyse une chaîne de code directement."""
        if language == "Python":
            return self.analyze_python(code, "<string>")
        elif language == "COBOL":
            return self.analyze_cobol(code, "<string>")
        else:
            return self._create_generic_report("<string>", code)


def analyze_production_readiness(code: str, language: str = "Python") -> Dict[str, Any]:
    """
    Fonction utilitaire principale pour analyser la production readiness.
    
    Args:
        code: Le code source à analyser
        language: Le langage du code ('Python' ou 'COBOL')
    
    Returns:
        Dict contenant le score, les métriques, et les problèmes trouvés
    """
    analyzer = ProductionReadinessAnalyzer()
    report = analyzer.analyze_code_string(code, language)
    
    return {
        'score': report.score,
        'grade': report.grade,
        'summary': report.summary,
        'recommendations': report.recommendations,
        'metrics': report.metrics.to_dict(),
        'issues': [i.to_dict() for i in report.issues],
        'production_ready': report.score >= 70
    }


def analyze_file_path(file_path: str) -> Dict[str, Any]:
    """
    Analyse un fichier par son chemin.
    
    Args:
        file_path: Chemin du fichier à analyser
    
    Returns:
        Dict contenant le rapport complet
    """
    analyzer = ProductionReadinessAnalyzer()
    report = analyzer.analyze_file(file_path)
    
    return report.to_dict()


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    'ProductionReadinessAnalyzer',
    'ReadinessReport',
    'Metrics',
    'Issue',
    'Severity',
    'Category',
    'analyze_production_readiness',
    'analyze_file_path',
]


if __name__ == "__main__":
    import sys
    import argparse
    
    parser = argparse.ArgumentParser(description='Production Readiness Analyzer')
    parser.add_argument('--target', type=str, required=True, help='Path to file to analyze')
    parser.add_argument('--json', action='store_true', help='Output results as JSON')
    parser.add_argument('--code', type=str, help='Code string to analyze (optional)')
    parser.add_argument('--language', type=str, default='Python', help='Programming language')
    
    args = parser.parse_args()
    
    try:
        if args.code:
            # Analyze code string directly
            report = analyze_production_readiness(args.code, args.language)
        else:
            # Analyze file
            report = analyze_file_path(args.target)
        
        if args.json:
            print(json.dumps(report, indent=2, default=str))
        else:
            print(f"Score: {report['score']}/{100}")
            print(f"Grade: {report['grade']}")
            print(f"Production Ready: {report['production_ready']}")
            print(f"\nSummary: {report['summary']}")
            print(f"\nMetrics: {report['metrics']}")
            print(f"\nIssues Found: {len(report['issues'])}")
            for issue in report['issues']:
                print(f"  - [{issue['severity']}] {issue['message']}")
            print(f"\nRecommendations:")
            for rec in report['recommendations']:
                print(f"  - {rec}")
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
