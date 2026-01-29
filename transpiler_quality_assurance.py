#!/usr/bin/env python3
"""
Système de Garantie Qualité pour le Transpileur COBOL → Python
================================================================

Ce module fournit des outils pour:
1. Auditer le pipeline de transpilation
2. Valider la syntaxe Python générée
3. Détecter les anomalies courantes
4. Tracer les étapes de transformation
5. Tester les transformations COBOL → Python

Auteur: MiniMax Agent
Date: 2026-01-29
"""

import ast
import re
import sys
import json
import logging
import tempfile
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple, Callable
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from collections import defaultdict


# Configuration du logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('transpiler_qa.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('TranspilerQA')


class SeverityLevel(Enum):
    """Niveaux de sévérité pour les problèmes détectés."""
    CRITICAL = "CRITICAL"
    ERROR = "ERROR"
    WARNING = "WARNING"
    INFO = "INFO"


class IssueType(Enum):
    """Types de problèmes pouvant être détectés."""
    SYNTAX_ERROR = "SYNTAX_ERROR"
    UNTERMINATED_STRING = "UNTERMINATED_STRING"
    INDENTATION_ERROR = "INDENTATION_ERROR"
    MISSING_METHOD = "MISSING_METHOD"
    INVALID_SYNTAX = "INVALID_SYNTAX"
    CORRUPTED_LINE = "CORRUPTED_LINE"
    MALFORMED_DOCSTRING = "MALFORMED_DOCSTRING"
    ORPHANED_BRACKET = "ORPHANED_BRACKET"
    MIXED_TABS_SPACES = "MIXED_TABS_SPACES"
    UNDEFINED_NAME = "UNDEFINED_NAME"
    IMPORT_ERROR = "IMPORT_ERROR"


@dataclass
class QAIssue:
    """Représente un problème de qualité détecté."""
    issue_type: IssueType
    severity: SeverityLevel
    line_number: int
    column: int
    message: str
    code_snippet: str = ""
    suggestion: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'issue_type': self.issue_type.value,
            'severity': self.severity.value,
            'line_number': self.line_number,
            'column': self.column,
            'message': self.message,
            'code_snippet': self.code_snippet,
            'suggestion': self.suggestion
        }


@dataclass
class ValidationReport:
    """Rapport de validation complet."""
    timestamp: str
    file_path: str
    total_lines: int
    issues_found: int
    issues_by_type: Dict[str, int]
    issues_by_severity: Dict[str, int]
    issues: List[Dict[str, Any]]
    syntax_valid: bool
    transpiler_version: str = "11.0"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'timestamp': self.timestamp,
            'file_path': self.file_path,
            'total_lines': self.total_lines,
            'issues_found': self.issues_found,
            'issues_by_type': self.issues_by_type,
            'issues_by_severity': self.issues_by_severity,
            'issues': self.issues,
            'syntax_valid': self.syntax_valid,
            'transpiler_version': self.transpiler_version
        }
    
    def to_json(self, output_path: str) -> None:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.to_dict(), f, indent=2, ensure_ascii=False)
        logger.info(f"Rapport sauvegardé: {output_path}")


class TranspilerAudit:
    """
    Auditeur du pipeline de transpilation.
    
    Détecte et rapporte les problèmes de qualité dans le code Python généré.
    """
    
    # Patterns de détection d'anomalies
    ANOMALY_PATTERNS = {
        'fstring_multiline_single_quote': {
            'pattern': r"f'[^\']*?\n",
            'issue_type': IssueType.UNTERMINATED_STRING,
            'severity': SeverityLevel.CRITICAL,
            'message': "F-string multiligne avec guillemets simples détectée",
            'suggestion': "Utiliser f\"\"\"...\"\"\" pour les f-strings multilignes"
        },
        'orphan_closing_bracket': {
            'pattern': r"^\s*\]\s*$",
            'issue_type': IssueType.ORPHANED_BRACKET,
            'severity': SeverityLevel.ERROR,
            'message': "Crochet fermant orphelin détecté",
            'suggestion': "Vérifier l'indentation et la structure du code"
        },
        'method_def_without_def': {
            'pattern': r"^\s+\w+\s*\([^)]*\)\s*:\s*$",
            'issue_type': IssueType.INVALID_SYNTAX,
            'severity': SeverityLevel.CRITICAL,
            'message': "Ligne ressemblant à une définition de méthode sans 'def'",
            'suggestion': "Ajouter 'def' au début de la ligne"
        },
        'malformed_docstring': {
            'pattern': r'"""[^"]*"""[^"]*$',
            'issue_type': IssueType.MALFORMED_DOCSTRING,
            'severity': SeverityLevel.WARNING,
            'message': "Docstring potentiellement malformée",
            'suggestion': "Vérifier les triples guillemets"
        },
        'mixed_indentation': {
            'pattern': r'^\t+ | {1,3}[^\s]',
            'issue_type': IssueType.MIXED_TABS_SPACES,
            'severity': SeverityLevel.WARNING,
            'message': "Mélange de tabs et d'espaces détecté",
            'suggestion': "Utiliser uniquement des espaces (4 recommended)"
        }
    }
    
    def __init__(self):
        self.issues: List[QAIssue] = []
        self.stats = defaultdict(int)
    
    def validate_file(self, file_path: str) -> ValidationReport:
        """
        Valide un fichier généré et retourne un rapport complet.
        
        Args:
            file_path: Chemin vers le fichier Python à valider
            
        Returns:
            ValidationReport: Rapport de validation complet
        """
        logger.info(f"=== Début de l'audit: {file_path} ===")
        
        self.issues = []
        self.stats.clear()
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
        except Exception as e:
            logger.error(f"Erreur lors de la lecture du fichier: {e}")
            return self._create_error_report(file_path, str(e))
        
        total_lines = len(lines)
        logger.info(f"Fichier lu: {total_lines} lignes")
        
        # Exécution des validations
        self._check_syntax_with_ast(lines, file_path)
        self._check_line_by_line_anomalies(lines)
        self._check_indentation(lines)
        self._check_strings(lines)
        
        # Compilation du rapport
        report = self._compile_report(file_path, total_lines)
        
        logger.info(f"Audit terminé: {len(self.issues)} problèmes détectés")
        
        return report
    
    def _check_syntax_with_ast(self, lines: List[str], file_path: str) -> None:
        """Vérifie la syntaxe Python en utilisant le module AST."""
        logger.debug("Vérification de la syntaxe avec AST...")
        
        source = ''.join(lines)
        
        try:
            ast.parse(source)
            logger.debug("✓ Syntaxe AST valide")
        except SyntaxError as e:
            issue = QAIssue(
                issue_type=IssueType.SYNTAX_ERROR,
                severity=SeverityLevel.CRITICAL,
                line_number=e.lineno or 1,
                column=e.offset or 1,
                message=f"Erreur de syntaxe: {e.msg}",
                code_snippet=lines[e.lineno - 1] if e.lineno else "",
                suggestion=f"Vérifier la ligne {e.lineno}: {e.text}"
            )
            self.issues.append(issue)
            self.stats['syntax_errors'] += 1
            logger.warning(f"✗ Erreur de syntaxe détectée ligne {e.lineno}: {e.msg}")
        except Exception as e:
            logger.error(f"Erreur inattendue lors de l'analyse AST: {e}")
    
    def _check_line_by_line_anomalies(self, lines: List[str]) -> None:
        """Vérifie chaque ligne pour des anomalies spécifiques."""
        logger.debug("Vérification ligne par ligne des anomalies...")
        
        for line_num, line in enumerate(lines, start=1):
            line_content = line.rstrip('\n\r')
            
            for name, config in self.ANOMALY_PATTERNS.items():
                if re.search(config['pattern'], line_content):
                    issue = QAIssue(
                        issue_type=config['issue_type'],
                        severity=config['severity'],
                        line_number=line_num,
                        column=line_content.find(re.search(config['pattern'], line_content).group()) + 1 if re.search(config['pattern'], line_content) else 1,
                        message=config['message'],
                        code_snippet=line_content[:80] + ('...' if len(line_content) > 80 else ''),
                        suggestion=config['suggestion']
                    )
                    self.issues.append(issue)
                    self.stats[name] += 1
    
    def _check_indentation(self, lines: List[str]) -> None:
        """Vérifie la cohérence de l'indentation."""
        logger.debug("Vérification de l'indentation...")
        
        for line_num, line in enumerate(lines, start=1):
            if line.strip() and not line.startswith('#'):
                # Détecter les tabs
                if '\t' in line:
                    # Compter les tabs au début
                    leading_tabs = len(line) - len(line.lstrip('\t'))
                    leading_spaces = len(line) - len(line.lstrip())
                    
                    if leading_tabs > 0 and leading_spaces > 0:
                        issue = QAIssue(
                            issue_type=IssueType.MIXED_TABS_SPACES,
                            severity=SeverityLevel.WARNING,
                            line_number=line_num,
                            column=1,
                            message="Mélange de tabs et d'espaces",
                            code_snippet=line[:60],
                            suggestion="Utiliser uniquement des espaces pour l'indentation"
                        )
                        self.issues.append(issue)
                        self.stats['mixed_indentation'] += 1
    
    def _check_strings(self, lines: List[str]) -> None:
        """Vérifie les chaînes de caractères mal formées."""
        logger.debug("Vérification des chaînes de caractères...")
        
        # Vérifier les docstrings dans les classes
        in_class = False
        class_indent = 0
        
        for line_num, line in enumerate(lines, start=1):
            stripped = line.strip()
            
            # Détecter le début d'une classe
            class_match = re.match(r'^class\s+(\w+)', stripped)
            if class_match:
                in_class = True
                class_indent = len(line) - len(line.lstrip())
                continue
            
            # Vérifier si on est toujours dans la classe
            if in_class:
                current_indent = len(line) - len(line.lstrip())
                if current_indent <= class_indent and stripped:
                    in_class = False
            
            # Vérifier les docstrings孤岛
            docstring_match = re.search(r'"""[^"]*$', stripped)
            if docstring_match and not re.search(r'"""[^"]*"""', stripped):
                issue = QAIssue(
                    issue_type=IssueType.MALFORMED_DOCSTRING,
                    severity=SeverityLevel.WARNING,
                    line_number=line_num,
                    column=stripped.find('"""') + 1,
                    message="Docstring potentiellement non fermée",
                    code_snippet=stripped[:60],
                    suggestion="Vérifier que la docstring est fermée avec \"\"\""
                )
                self.issues.append(issue)
                self.stats['malformed_docstring'] += 1
    
    def _compile_report(self, file_path: str, total_lines: int) -> ValidationReport:
        """Compile le rapport de validation final."""
        
        # Compter par type et sévérité
        issues_by_type = defaultdict(int)
        issues_by_severity = defaultdict(int)
        
        for issue in self.issues:
            issues_by_type[issue.issue_type.value] += 1
            issues_by_severity[issue.severity.value] += 1
        
        # Vérifier si la syntaxe est globalement valide
        syntax_valid = all(
            issue.severity != SeverityLevel.CRITICAL 
            for issue in self.issues
        )
        
        return ValidationReport(
            timestamp=datetime.now().isoformat(),
            file_path=file_path,
            total_lines=total_lines,
            issues_found=len(self.issues),
            issues_by_type=dict(issues_by_type),
            issues_by_severity=dict(issues_by_severity),
            issues=[i.to_dict() for i in self.issues],
            syntax_valid=syntax_valid
        )
    
    def _create_error_report(self, file_path: str, error_message: str) -> ValidationReport:
        """Crée un rapport d'erreur en cas d'échec de lecture."""
        return ValidationReport(
            timestamp=datetime.now().isoformat(),
            file_path=file_path,
            total_lines=0,
            issues_found=1,
            issues_by_type={IssueType.INVALID_SYNTAX.value: 1},
            issues_by_severity={SeverityLevel.ERROR.value: 1},
            issues=[{
                'issue_type': IssueType.INVALID_SYNTAX.value,
                'severity': SeverityLevel.ERROR.value,
                'line_number': 0,
                'column': 0,
                'message': f"Erreur de lecture du fichier: {error_message}",
                'code_snippet': '',
                'suggestion': 'Vérifier les permissions et le format du fichier'
            }],
            syntax_valid=False
        )


class TranspilerTestFramework:
    """
    Framework de tests unitaires pour le transpileur.
    
    Permet de valider les transformations COBOL → Python et de détecter
    les régressions.
    """
    
    def __init__(self):
        self.test_cases: List[Dict[str, Any]] = []
        self.results: List[Dict[str, Any]] = []
    
    def add_test_case(self, name: str, cobol_code: str, expected_python: str, 
                      transformation_type: str) -> None:
        """
        Ajoute un cas de test.
        
        Args:
            name: Nom du test
            cobol_code: Code COBOL source
            expected_python: Code Python attendu après transformation
            transformation_type: Type de transformation (FSTRING, CLASS, METHOD, etc.)
        """
        self.test_cases.append({
            'name': name,
            'cobol_code': cobol_code,
            'expected_python': expected_python,
            'transformation_type': transformation_type
        })
        logger.debug(f"Cas de test ajouté: {name}")
    
    def run_tests(self) -> Dict[str, Any]:
        """
        Exécute tous les cas de test.
        
        Returns:
            Dict contenant les résultats des tests
        """
        logger.info(f"=== Exécution de {len(self.test_cases)} tests ===")
        
        self.results = []
        passed = 0
        failed = 0
        
        for test in self.test_cases:
            result = self._run_single_test(test)
            self.results.append(result)
            
            if result['status'] == 'PASS':
                passed += 1
            else:
                failed += 1
        
        summary = {
            'total_tests': len(self.test_cases),
            'passed': passed,
            'failed': failed,
            'pass_rate': f"{(passed / len(self.test_cases) * 100):.1f}%" if self.test_cases else "0%",
            'timestamp': datetime.now().isoformat(),
            'results': self.results
        }
        
        logger.info(f"Tests terminés: {passed}/{len(self.test_cases)} réussis")
        
        return summary
    
    def _run_single_test(self, test: Dict[str, Any]) -> Dict[str, Any]:
        """Exécute un test individuel."""
        
        # Simuler la transformation (dans un vrai système, cela appellerait le transpileur)
        transformed = self._simulate_transformation(test['cobol_code'], test['transformation_type'])
        
        # Vérifier si la transformation est correcte
        if transformed.strip() == test['expected_python'].strip():
            return {
                'name': test['name'],
                'status': 'PASS',
                'transformation_type': test['transformation_type'],
                'expected': test['expected_python'],
                'actual': transformed,
                'error': None
            }
        else:
            return {
                'name': test['name'],
                'status': 'FAIL',
                'transformation_type': test['transformation_type'],
                'expected': test['expected_python'],
                'actual': transformed,
                'error': f"Transformation incorrecte: attendue '{test['expected_python'][:50]}...', obtenu '{transformed[:50]}...'"
            }
    
    def _simulate_transformation(self, cobol_code: str, transformation_type: str) -> str:
        """
        Simule une transformation COBOL → Python.
        
        Note: Dans un vrai système, cela appellerait le transpileur réel.
        """
        # Simulations basiques pour démonstration
        if transformation_type == 'FSTRING_MULTILINE':
            # Vérifier si les f-strings multilignes utilisent les bons guillemets
            if "f'''" in cobol_code:
                return cobol_code.replace("f'''", 'f"""').replace("'''", '"""')
            return cobol_code
        
        elif transformation_type == 'METHOD_DEFINITION':
            # Vérifier si les méthodes ont 'def'
            if re.search(r'^\s+\w+\s*\([^)]*\)\s*:\s*$', cobol_code, re.MULTILINE):
                # Ajouter 'def' manquante
                return re.sub(r'^(\s+)(\w+)(\s*\()', r'\1def \2\3', cobol_code, flags=re.MULTILINE)
            return cobol_code
        
        elif transformation_type == 'DOCSTRING':
            # Vérifier les docstrings
            if '"""' not in cobol_code:
                return f'"""{cobol_code}"""'
            return cobol_code
        
        return cobol_code


class TransformationLogger:
    """
    Logger des étapes de transformation du transpileur.
    
    Permet de tracer et diagnostiquer les problèmes de transpilation.
    """
    
    def __init__(self, log_dir: str = 'transpiler_logs'):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        
        # Logger spécifique
        self.logger = logging.getLogger('TransformationLogger')
        self.logger.setLevel(logging.DEBUG)
        
        # Fichier de log des transformations
        self.transformation_log = self.log_dir / 'transformations.log'
        
        # Historique des transformations
        self.transformation_history: List[Dict[str, Any]] = []
    
    def log_transformation(self, stage: str, input_data: str, output_data: str, 
                          metadata: Dict[str, Any] = None) -> None:
        """
        Enregistre une étape de transformation.
        
        Args:
            stage: Nom de l'étape (ex: 'PARSING', 'AST_GENERATION', 'CODE_EMISSION')
            input_data: Données d'entrée
            output_data: Données de sortie
            metadata: Métadonnées supplémentaires
        """
        entry = {
            'timestamp': datetime.now().isoformat(),
            'stage': stage,
            'input_hash': hash(input_data),
            'output_hash': hash(output_data),
            'input_length': len(input_data),
            'output_length': len(output_data),
            'metadata': metadata or {}
        }
        
        self.transformation_history.append(entry)
        
        # Écrire dans le fichier de log
        with open(self.transformation_log, 'a', encoding='utf-8') as f:
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')
        
        self.logger.debug(f"Transformation [{stage}]: {len(input_data)} → {len(output_data)} caractères")
    
    def log_error(self, stage: str, error_message: str, context: Dict[str, Any] = None) -> None:
        """
        Enregistre une erreur de transformation.
        
        Args:
            stage: Étape où l'erreur s'est produite
            error_message: Message d'erreur
            context: Contexte de l'erreur
        """
        error_entry = {
            'timestamp': datetime.now().isoformat(),
            'stage': stage,
            'error': error_message,
            'context': context or {}
        }
        
        error_log = self.log_dir / 'errors.log'
        with open(error_log, 'a', encoding='utf-8') as f:
            f.write(json.dumps(error_entry, ensure_ascii=False) + '\n')
        
        self.logger.error(f"[{stage}] {error_message}")
    
    def get_transformation_report(self) -> Dict[str, Any]:
        """
        Génère un rapport des transformations effectuées.
        
        Returns:
            Dict contenant le rapport des transformations
        """
        if not self.transformation_history:
            return {'message': 'Aucune transformation enregistrée', 'transformations': []}
        
        # Analyser les transformations
        stages = defaultdict(list)
        for entry in self.transformation_history:
            stages[entry['stage']].append(entry)
        
        report = {
            'total_transformations': len(self.transformation_history),
            'stages': {},
            'potential_issues': []
        }
        
        for stage, entries in stages.items():
            report['stages'][stage] = {
                'count': len(entries),
                'total_input_size': sum(e['input_length'] for e in entries),
                'total_output_size': sum(e['output_length'] for e in entries)
            }
        
        # Détecter les problèmes potentiels
        for i, entry in enumerate(self.transformation_history):
            if entry['output_length'] == 0:
                report['potential_issues'].append({
                    'index': i,
                    'stage': entry['stage'],
                    'issue': 'Transformation produite une sortie vide'
                })
            
            if entry['metadata'].get('had_errors'):
                report['potential_issues'].append({
                    'index': i,
                    'stage': entry['stage'],
                    'issue': 'Des erreurs ont été signalées'
                })
        
        return report
    
    def analyze_corruption_patterns(self) -> List[Dict[str, Any]]:
        """
        Analyse les patterns de corruption dans les transformations.
        
        Returns:
            List de patterns de corruption détectés
        """
        patterns = []
        
        # Analyser les erreurs enregistrées
        error_log = self.log_dir / 'errors.log'
        if error_log.exists():
            with open(error_log, 'r', encoding='utf-8') as f:
                errors = [json.loads(line) for line in f if line.strip()]
            
            # Grouper par type d'erreur
            error_types = defaultdict(list)
            for error in errors:
                error_types[error['error']].append(error)
            
            for error_type, occurrences in error_types.items():
                patterns.append({
                    'error_type': error_type,
                    'occurrences': len(occurrences),
                    'stages_affected': list(set(e['stage'] for e in occurrences)),
                    'severity': 'HIGH' if len(occurrences) > 5 else 'MEDIUM'
                })
        
        return patterns


class TranspilerQualityAssurance:
    """
    Classe principale orchestrant toutes les vérifications de qualité.
    
    Usage:
        qa = TranspilerQualityAssurance()
        report = qa.audit_file('generated_code.py')
        report.to_json('audit_report.json')
    """
    
    def __init__(self):
        self.audit = TranspilerAudit()
        self.tests = TranspilerTestFramework()
        self.logger = TransformationLogger()
    
    def audit_file(self, file_path: str) -> ValidationReport:
        """
        Audit un fichier généré par le transpileur.
        
        Args:
            file_path: Chemin vers le fichier à auditer
            
        Returns:
            ValidationReport: Rapport de validation
        """
        return self.audit.validate_file(file_path)
    
    def audit_and_fix(self, file_path: str, auto_fix: bool = False) -> Tuple[ValidationReport, List[str]]:
        """
        Audit un fichier et optionnellement applique des corrections automatiques.
        
        Args:
            file_path: Chemin vers le fichier à auditer
            auto_fix: Si True, applique les corrections automatiques possibles
            
        Returns:
            Tuple de (rapport, liste des corrections appliquées)
        """
        report = self.audit_file(file_path)
        fixes_applied = []
        
        if auto_fix:
            fixes_applied = self._apply_auto_fixes(file_path, report)
        
        return report, fixes_applied
    
    def _apply_auto_fixes(self, file_path: str, report: ValidationReport) -> List[str]:
        """
        Applique des corrections automatiques aux problèmes détectés.
        
        Args:
            file_path: Chemin vers le fichier
            report: Rapport de validation
            
        Returns:
            List des corrections appliquées
        """
        fixes = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            modified = False
            
            for issue in report.issues:
                if issue['issue_type'] == IssueType.INVALID_SYNTAX.value:
                    line_num = issue['line_number'] - 1
                    if line_num < len(lines):
                        line = lines[line_num]
                        
                        # Correction: ajouter 'def' manquant
                        if re.search(r'^\s+\w+\s*\([^)]*\)\s*:\s*$', line):
                            new_line = re.sub(r'^(\s+)(\w+)(\s*\()', r'\1def \2\3', line)
                            lines[line_num] = new_line
                            fixes.append(f"Ligne {issue['line_number']}: Ajouté 'def' manquant")
                            modified = True
                
                elif issue['issue_type'] == IssueType.ORPHANED_BRACKET.value:
                    line_num = issue['line_number'] - 1
                    if line_num < len(lines) and lines[line_num].strip() == ']':
                        lines[line_num] = ''
                        fixes.append(f"Ligne {issue['line_number']}: Supprimé crochet orphelin")
                        modified = True
            
            if modified:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.writelines(lines)
                logger.info(f"Corrections appliquées: {len(fixes)}")
        
        except Exception as e:
            logger.error(f"Erreur lors de l'application des corrections: {e}")
        
        return fixes
    
    def run_full_quality_check(self, cobol_file: str = None, python_file: str = None) -> Dict[str, Any]:
        """
        Exécute une vérification complète de qualité.
        
        Args:
            cobol_file: Chemin vers le fichier COBOL source (optionnel)
            python_file: Chemin vers le fichier Python généré
            
        Returns:
            Dict contenant tous les résultats
        """
        results = {
            'timestamp': datetime.now().isoformat(),
            'audit_report': None,
            'test_results': None,
            'transformation_report': None,
            'corruption_patterns': None,
            'overall_status': 'UNKNOWN'
        }
        
        # Audit du fichier généré
        if python_file and Path(python_file).exists():
            results['audit_report'] = self.audit_file(python_file).to_dict()
            self.logger.log_transformation(
                stage='AUDIT',
                input_data=python_file,
                output_data=json.dumps(results['audit_report']),
                metadata={'issues_count': results['audit_report']['issues_found']}
            )
        
        # Exécution des tests
        results['test_results'] = self.tests.run_tests()
        
        # Rapport des transformations
        results['transformation_report'] = self.logger.get_transformation_report()
        
        # Analyse des patterns de corruption
        results['corruption_patterns'] = self.logger.analyze_corruption_patterns()
        
        # Déterminer le statut global
        if results['audit_report']:
            if results['audit_report']['syntax_valid']:
                results['overall_status'] = 'PASS'
            else:
                results['overall_status'] = 'FAIL'
        
        return results


def main():
    """Point d'entrée principal pour les tests et l'audit."""
    
    print("=" * 70)
    print("SYSTÈME DE GARANTIE QUALITÉ POUR LE TRANSPYLEUR")
    print("=" * 70)
    
    # Exemple d'utilisation
    qa = TranspilerQualityAssurance()
    
    # Vérifier si un fichier a été passé en argument
    if len(sys.argv) > 1:
        target_file = sys.argv[1]
        print(f"\nAudit du fichier: {target_file}")
        
        report, fixes = qa.audit_and_fix(target_file, auto_fix=True)
        
        print(f"\n{'-' * 50}")
        print(f"RÉSULTATS DE L'AUDIT")
        print(f"{'-' * 50}")
        print(f"Fichier: {report.file_path}")
        print(f"Lignes: {report.total_lines}")
        print(f"Problèmes détectés: {report.issues_found}")
        print(f"Syntaxe valide: {'Oui' if report.syntax_valid else 'Non'}")
        
        print(f"\nRépartition par type:")
        for issue_type, count in report.issues_by_type.items():
            print(f"  - {issue_type}: {count}")
        
        print(f"\nRépartition par sévérité:")
        for severity, count in report.issues_by_severity.items():
            print(f"  - {severity}: {count}")
        
        if fixes:
            print(f"\nCorrections automatiques appliquées ({len(fixes)}):")
            for fix in fixes:
                print(f"  ✓ {fix}")
        
        # Sauvegarder le rapport
        report.to_json(f"audit_{Path(target_file).stem}.json")
        print(f"\nRapport sauvegardé: audit_{Path(target_file).stem}.json")
    
    else:
        print("\nUsage: python transpiler_quality_assurance.py <fichier_python>")
        print("\nExemple de test intégré:")
        
        # Créer un fichier de test
        test_code = '''
# Fichier de test avec des erreurs intentionnelles
class TestClass:
    """
    
    def method_with_error():
    ):
        pass
'''
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(test_code)
            temp_file = f.name
        
        print(f"\nCréation d'un fichier de test: {temp_file}")
        
        # Auditer le fichier de test
        report = qa.audit_file(temp_file)
        
        print(f"\nProblèmes détectés: {report.issues_found}")
        for issue in report.issues:
            print(f"  - [{issue.severity.value}] Ligne {issue.line_number}: {issue.message}")
        
        # Nettoyer
        Path(temp_file).unlink()
    
    print("\n" + "=" * 70)
    print("FIN DE L'AUDIT")
    print("=" * 70)


if __name__ == '__main__':
    main()
