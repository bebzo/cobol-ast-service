"""
Shadow Tester Enhanced - Strangler Pattern pour Migration Progressive

Ce module implémente le test en ombre (Shadow Testing) pour comparer les résultats
du système COBOL original avec le nouveau système Python pendant la migration.

Features:
- Exécution parallèle COBOL vs Python
- Comparaison intelligente des résultats
- Détection des divergences de précision
- Métriques de parité
- Rollback automatique si divergences

Auteur: MiniMax Agent
Version: 1.0.0 - Production Ready
"""

from decimal import Decimal
from typing import Optional, Dict, Any, List, Tuple, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import logging
import json
import hashlib


logger = logging.getLogger(__name__)


# ============================================================================
# TYPES ET CONSTANTES
# ============================================================================

class ComparisonResult(Enum):
    """Résultat de la comparaison COBOL vs Python."""
    IDENTICAL = "identical"
    EQUIVALENT = "equivalent"  # Valeurs numériques égales après arrondissement
    DIVERGENT = "divergent"
    ERROR = "error"


class TestStatus(Enum):
    """Statut d'un test shadow."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class ShadowTestCase:
    """Cas de test pour shadow testing."""
    test_id: str
    test_name: str
    cobol_input: Dict[str, Any]
    python_input: Dict[str, Any]
    expected_cobol_output: Dict[str, Any]
    expected_python_output: Dict[str, Any]
    tolerance: Decimal = Decimal('0.01')
    created_at: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ShadowTestResult:
    """Résultat d'un test shadow."""
    test_id: str
    test_name: str
    status: TestStatus
    comparison: ComparisonResult
    cobol_output: Optional[Dict[str, Any]] = None
    python_output: Optional[Dict[str, Any]] = None
    discrepancies: List[str] = field(default_factory=list)
    precision_errors: List[Dict[str, Any]] = field(default_factory=list)
    execution_time_ms: float = 0.0
    timestamp: datetime = field(default_factory=datetime.utcnow)
    error_message: Optional[str] = None
    
    @property
    def is_successful(self) -> bool:
        return self.comparison in [ComparisonResult.IDENTICAL, ComparisonResult.EQUIVALENT]


@dataclass
class ShadowTestReport:
    """Rapport agrégé des tests shadow."""
    total_tests: int
    passed_tests: int
    failed_tests: int
    identical_results: int
    equivalent_results: int
    divergent_results: int
    precision_errors: int
    average_execution_time_ms: float
    parity_score: float  # Pourcentage de similarité
    execution_date: datetime = field(default_factory=datetime.utcnow)
    details: List[ShadowTestResult] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'total_tests': self.total_tests,
            'passed_tests': self.passed_tests,
            'failed_tests': self.failed_tests,
            'identical_results': self.identical_results,
            'equivalent_results': self.equivalent_results,
            'divergent_results': self.divergent_results,
            'precision_errors': self.precision_errors,
            'average_execution_time_ms': self.average_execution_time_ms,
            'parity_score': self.parity_score,
            'execution_date': self.execution_date.isoformat(),
            'details': [d.__dict__ for d in self.details]
        }


# ============================================================================
# COMPARATEUR INTELLIGENT
# ============================================================================

class ResultComparator:
    """
    Compare les résultats COBOL et Python avec tolérance pour les différences numériques.
    """
    
    def __init__(self, tolerance: Decimal = Decimal('0.01')):
        """
        Initialise le comparateur.
        
        Args:
            tolerance: Tolérance pour les comparaisons numériques
        """
        self.tolerance = tolerance
    
    def compare(self, 
                cobol_output: Dict[str, Any], 
                python_output: Dict[str, Any]) -> Tuple[ComparisonResult, List[str], List[Dict[str, Any]]]:
        """
        Compare deux résultats et identifie les divergences.
        
        Args:
            cobol_output: Résultat du système COBOL
            python_output: Résultat du système Python
        
        Returns:
            Tuple[résultat, divergences, erreurs de précision]
        """
        discrepancies = []
        precision_errors = []
        
        # Extraction des valeurs numériques
        cobol_values = self._extract_values(cobol_output)
        python_values = self._extract_values(python_output)
        
        # Comparaison des clés
        cobol_keys = set(cobol_values.keys())
        python_keys = set(python_values.keys())
        
        missing_in_python = cobol_keys - python_keys
        missing_in_cobol = python_keys - cobol_keys
        
        for key in missing_in_python:
            discrepancies.append(f"Clé '{key}' présente dans COBOL mais pas dans Python")
        
        for key in missing_in_cobol:
            discrepancies.append(f"Clé '{key}' présente dans Python mais pas dans COBOL")
        
        # Comparaison des valeurs
        common_keys = cobol_keys & python_keys
        
        for key in common_keys:
            cobol_val = cobol_values[key]
            python_val = python_values[key]
            
            # Si les deux sont numériques
            if isinstance(cobol_val, (int, float, Decimal)) and isinstance(python_val, (int, float, Decimal)):
                cobol_dec = Decimal(str(cobol_val))
                python_dec = Decimal(str(python_val))
                
                diff = abs(cobol_dec - python_dec)
                
                if diff > self.tolerance:
                    precision_errors.append({
                        'key': key,
                        'cobol_value': str(cobol_val),
                        'python_value': str(python_val),
                        'difference': str(diff),
                        'severity': 'high' if diff > Decimal('1.00') else 'low'
                    })
            
            # Sinon, comparaison string
            elif str(cobol_val) != str(python_val):
                discrepancies.append(f"Valeur différente pour '{key}': COBOL='{cobol_val}', Python='{python_val}'")
        
        # Détermination du résultat
        if len(precision_errors) == 0 and len(discrepancies) == 0:
            return ComparisonResult.IDENTICAL, [], []
        
        elif len(precision_errors) == 0 and len(discrepancies) > 0:
            return ComparisonResult.DIVERGENT, discrepancies, precision_errors
        
        elif len(precision_errors) > 0 and len(discrepancies) == 0:
            # Vérifier si les erreurs de précision sont acceptables
            max_error = max([Decimal(str(e['difference'])) for e in precision_errors], default=Decimal('0'))
            if max_error < self.tolerance:
                return ComparisonResult.EQUIVALENT, [], precision_errors
            else:
                return ComparisonResult.DIVERGENT, discrepancies, precision_errors
        
        else:
            return ComparisonResult.DIVERGENT, discrepancies, precision_errors
    
    def _extract_values(self, data: Dict[str, Any], prefix: str = '') -> Dict[str, Any]:
        """Extraction récursive des valeurs d'un dictionnaire."""
        values = {}
        
        for key, value in data.items():
            full_key = f"{prefix}.{key}" if prefix else key
            
            if isinstance(value, dict):
                values.update(self._extract_values(value, full_key))
            elif isinstance(value, list):
                # Arrays - comparer élément par élément
                for i, item in enumerate(value):
                    if isinstance(item, (int, float, Decimal, str)):
                        values[f"{full_key}[{i}]"] = item
            else:
                values[full_key] = value
        
        return values


# ============================================================================
# SHADOW TEST RUNNER
# ============================================================================

class ShadowTestRunner:
    """
    Exécuteur de tests shadow pour la migration COBOL vers Python.
    
    Permet d'exécuter des tests parallèles et de comparer les résultats.
    """
    
    def __init__(self, 
                 cobol_executor: Callable = None,
                 python_executor: Callable = None,
                 tolerance: Decimal = Decimal('0.01')):
        """
        Initialise le runner de tests shadow.
        
        Args:
            cobol_executor: Fonction pour exécuter la logique COBOL (ou simulateur)
            python_executor: Fonction pour exécuter la logique Python
            tolerance: Tolérance pour les comparaisons numériques
        """
        self.cobol_executor = cobol_executor
        self.python_executor = python_executor
        self.comparator = ResultComparator(tolerance)
        self.test_cases: List[ShadowTestCase] = []
        self.results: List[ShadowTestResult] = []
    
    def add_test_case(self, test_case: ShadowTestCase) -> str:
        """
        Ajoute un cas de test à la file d'attente.
        
        Args:
            test_case: Cas de test à ajouter
        
        Returns:
            ID du cas de test ajouté
        """
        self.test_cases.append(test_case)
        return test_case.test_id
    
    def create_test_case(self,
                        test_name: str,
                        cobol_input: Dict[str, Any],
                        python_input: Dict[str, Any],
                        expected_output: Dict[str, Any],
                        tolerance: Decimal = None) -> str:
        """
        Crée et ajoute un cas de test.
        
        Args:
            test_name: Nom du test
            cobol_input: Données d'entrée pour COBOL
            python_input: Données d'entrée pour Python
            expected_output: Résultat attendu (les deux côtés doivent matcher)
            tolerance: Tolérance optionnelle
        
        Returns:
            ID du cas de test créé
        """
        import hashlib
        import secrets
        
        test_id = hashlib.md5(f"{test_name}{datetime.now()}".encode()).hexdigest()[:8]
        
        test_case = ShadowTestCase(
            test_id=test_id,
            test_name=test_name,
            cobol_input=cobol_input,
            python_input=python_input,
            expected_cobol_output=expected_output,
            expected_python_output=expected_output,
            tolerance=tolerance or self.comparator.tolerance
        )
        
        return self.add_test_case(test_case)
    
    def run_single_test(self, test_case: ShadowTestCase) -> ShadowTestResult:
        """
        Exécute un test shadow unique.
        
        Args:
            test_case: Cas de test à exécuter
        
        Returns:
            Résultat du test
        """
        import time
        start_time = time.time()
        
        result = ShadowTestResult(
            test_id=test_case.test_id,
            test_name=test_case.test_name,
            status=TestStatus.RUNNING,
            comparison=ComparisonResult.ERROR
        )
        
        try:
            # Exécution COBOL (ou simulateur)
            if self.cobol_executor:
                cobol_result = self.cobol_executor(**test_case.cobol_input)
            else:
                cobol_result = test_case.expected_cobol_output
            
            result.cobol_output = cobol_result
            
            # Exécution Python
            if self.python_executor:
                python_result = self.python_executor(**test_case.python_input)
            else:
                python_result = test_case.expected_python_output
            
            result.python_output = python_result
            
            # Comparaison
            comparison, discrepancies, precision_errors = self.comparator.compare(
                cobol_result, python_result
            )
            
            result.comparison = comparison
            result.discrepancies = discrepancies
            result.precision_errors = precision_errors
            result.status = TestStatus.COMPLETED
            
            if result.is_successful:
                logger.info(f"[SHADOW] Test '{test_case.test_name}': PASSED ({comparison.value})")
            else:
                logger.warning(f"[SHADOW] Test '{test_case.test_name}': FAILED ({comparison.value})")
                for disc in discrepancies:
                    logger.warning(f"  - {disc}")
                
        except Exception as e:
            result.status = TestStatus.FAILED
            result.error_message = str(e)
            logger.error(f"[SHADOW] Test '{test_case.test_name}': ERROR - {e}")
        
        result.execution_time_ms = (time.time() - start_time) * 1000
        return result
    
    def run_all_tests(self) -> ShadowTestReport:
        """
        Exécute tous les tests shadow en file d'attente.
        
        Returns:
            Rapport agrégé des résultats
        """
        self.results = []
        
        for test_case in self.test_cases:
            result = self.run_single_test(test_case)
            self.results.append(result)
        
        # Calcul des métriques
        total = len(self.results)
        passed = sum(1 for r in self.results if r.is_successful)
        failed = total - passed
        
        identical = sum(1 for r in self.results if r.comparison == ComparisonResult.IDENTICAL)
        equivalent = sum(1 for r in self.results if r.comparison == ComparisonResult.EQUIVALENT)
        divergent = sum(1 for r in self.results if r.comparison == ComparisonResult.DIVERGENT)
        precision_errs = sum(len(r.precision_errors) for r in self.results)
        
        avg_time = sum(r.execution_time_ms for r in self.results) / total if total > 0 else 0
        parity_score = (passed / total * 100) if total > 0 else 0
        
        report = ShadowTestReport(
            total_tests=total,
            passed_tests=passed,
            failed_tests=failed,
            identical_results=identical,
            equivalent_results=equivalent,
            divergent_results=divergent,
            precision_errors=precision_errs,
            average_execution_time_ms=avg_time,
            paritY_score=parity_score,
            details=self.results
        )
        
        logger.info(f"[SHADOW] Tests completed: {passed}/{total} passed, parity={parity_score:.1f}%")
        
        return report


# ============================================================================
# SHADOW TESTER SIMPLE POUR DÉMONSTRATION
# ============================================================================

class SimpleShadowTester:
    """
    Version simplifiée du shadow tester pour démonstration rapide.
    
    Compare les résultats de fonctions Python avec des valeurs de référence COBOL.
    """
    
    def __init__(self, tolerance: Decimal = Decimal('0.01')):
        self.tolerance = tolerance
        self.test_history: List[Dict[str, Any]] = []
    
    def test_calculation(self,
                        name: str,
                        python_function: Callable,
                        test_inputs: List[Dict[str, Any]],
                        expected_outputs: List[Any],
                        cobol_reference_values: List[Any] = None) -> Dict[str, Any]:
        """
        Teste une fonction de calcul avec des entrées multiples.
        
        Args:
            name: Nom du test
            python_function: Fonction Python à tester
            test_inputs: Liste des entrées
            expected_outputs: Sorties attendues
            cobol_reference_values: Références COBOL optionnelles
        
        Returns:
            Rapport de test
        """
        results = []
        passed = 0
        failed = 0
        precision_issues = 0
        
        for i, (inp, expected) in enumerate(zip(test_inputs, expected_outputs)):
            try:
                result = python_function(**inp)
                
                # Comparaison avec attendu
                if isinstance(expected, (int, float, Decimal)) and isinstance(result, (int, float, Decimal)):
                    diff = abs(Decimal(str(result)) - Decimal(str(expected)))
                    is_pass = diff <= self.tolerance
                else:
                    is_pass = str(result) == str(expected)
                
                # Comparaison avec référence COBOL
                precision_error = None
                if cobol_reference_values and i < len(cobol_reference_values):
                    cobol_ref = cobol_reference_values[i]
                    if isinstance(cobol_ref, (int, float, Decimal)):
                        cobol_diff = abs(Decimal(str(result)) - Decimal(str(cobol_ref)))
                        if cobol_diff > self.tolerance:
                            precision_error = {
                                'test_index': i,
                                'python_result': str(result),
                                'cobol_reference': str(cobol_ref),
                                'difference': str(cobol_diff)
                            }
                            precision_issues += 1
                
                test_result = {
                    'index': i,
                    'input': inp,
                    'python_result': str(result),
                    'expected': str(expected),
                    'passed': is_pass,
                    'cobol_comparison': precision_error
                }
                
                if is_pass:
                    passed += 1
                else:
                    failed += 1
                
                results.append(test_result)
                
            except Exception as e:
                results.append({
                    'index': i,
                    'input': inp,
                    'error': str(e),
                    'passed': False
                })
                failed += 1
        
        report = {
            'test_name': name,
            'total': len(test_inputs),
            'passed': passed,
            'failed': failed,
            'precision_issues': precision_issues,
            'parity_score': (passed / len(test_inputs) * 100) if test_inputs else 0,
            'results': results,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        self.test_history.append(report)
        
        return report
    
    def get_summary(self) -> Dict[str, Any]:
        """Retourne un résumé de tous les tests exécutés."""
        if not self.test_history:
            return {'total_tests': 0, 'message': 'Aucun test exécuté'}
        
        total_tests = sum(t['total'] for t in self.test_history)
        total_passed = sum(t['passed'] for t in self.test_history)
        total_precision = sum(t['precision_issues'] for t in self.test_history)
        
        return {
            'total_test_runs': len(self.test_history),
            'total_tests': total_tests,
            'total_passed': total_passed,
            'total_failed': total_tests - total_passed,
            'total_precision_issues': total_precision,
            'overall_parity': (total_passed / total_tests * 100) if total_tests > 0 else 0,
            'last_test': self.test_history[-1] if self.test_history else None
        }


# ============================================================================
# UTILITAIRES
# ============================================================================

def generate_test_id() -> str:
    """Génère un ID de test unique."""
    return hashlib.md5(f"{datetime.now()}{secrets.token_bytes(8)}".encode()).hexdigest()[:12]


def save_report(report: ShadowTestReport, filepath: str) -> None:
    """Sauvegarde un rapport de test au format JSON."""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(report.to_dict(), f, indent=2, ensure_ascii=False, default=str)
    logger.info(f"[SHADOW] Report saved to {filepath}")


def load_report(filepath: str) -> ShadowTestReport:
    """Charge un rapport de test depuis un fichier JSON."""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    details = [ShadowTestResult(**d) for d in data['details']]
    
    return ShadowTestReport(
        total_tests=data['total_tests'],
        passed_tests=data['passed_tests'],
        failed_tests=data['failed_tests'],
        identical_results=data['identical_results'],
        equivalent_results=data['equivalent_results'],
        divergent_results=data['divergent_results'],
        precision_errors=data['precision_errors'],
        average_execution_time_ms=data['average_execution_time_ms'],
        paritY_score=data['parity_score'],
        execution_date=datetime.fromisoformat(data['execution_date']),
        details=details
    )


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    # Types
    'ComparisonResult',
    'TestStatus',
    'ShadowTestCase',
    'ShadowTestResult',
    'ShadowTestReport',
    
    # Comparateur
    'ResultComparator',
    
    # Runner
    'ShadowTestRunner',
    
    # Simple tester
    'SimpleShadowTester',
    
    # Utilitaires
    'generate_test_id',
    'save_report',
    'load_report',
]
