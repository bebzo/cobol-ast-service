"""
Module de post-traitement de production pour CodeSwitch

Ce module transforme le code Python transpéré depuis COBOL en code
de qualité production bancaire en injectant les patterns d'infrastructure
nécessaires à la conformité et à la robustesse.

Fonctions principales:
- inject_production_patterns: Injection des patterns de production
- validate_production_code: Validation du code produit
- optimize_performance: Optimisations de performance
- add_error_handling: Gestion robuste des erreurs
- generate_production_report: Rapport de qualité production

Auteur: CodeSwitch Team
Version: 1.0.0
"""

import re
import ast
import inspect
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from datetime import datetime, timezone
import logging


# Configuration du logger
logger = logging.getLogger(__name__)


class ProductionLevel(Enum):
    """Niveaux de qualité production disponibles."""
    BASIC = "basic"
    STANDARD = "standard"
    ENHANCED = "enhanced"
    BANK_GRADE = "bank_grade"


@dataclass
class ProductionCheck:
    """Représente un contrôle de qualité production."""
    name: str
    description: str
    passed: bool
    severity: str  # "error", "warning", "info"
    details: Optional[str] = None
    line_number: Optional[int] = None


@dataclass
class ProductionReport:
    """Rapport de qualité du code de production."""
    timestamp: datetime
    production_level: ProductionLevel
    overall_score: float
    checks: List[ProductionCheck]
    injected_patterns: List[str]
    code_size: int
    production_size: int
    recommendations: List[str]
    warnings: List[str]
    errors: List[str]


class ProductionPostprocessor:
    """
    Post-processeur de code pour l'injection de patterns de production.
    
    Cette classe analyse le code Python transpéré et injecte les patterns
    d'infrastructure nécessaires pour atteindre le niveau de qualité
    de production demandé.
    
    Example d'utilisation:
        ```python
        postprocessor = ProductionPostprocessor(
            production_level=ProductionLevel.BANK_GRADE,
            audit_logger=audit_logger
        )
        
        result = postprocessor.process(
            original_cobol=" IDENTIFICATION DIVISION...",
            transpiled_python=open("output.py").read()
        )
        
        print(f"Score: {result.overall_score}%")
        print(result.injected_code)
        ```
    """
    
    # Templates d'import pour les patterns de production
    PRODUCTION_IMPORTS = '''"""
Code généré par CodeSwitch - Post-traitement de production
Date de génération: {timestamp}
Niveau de production: {production_level}
"""

# Imports des patterns d'infrastructure de production
from lib.production_infrastructure import (
    ThreadSafeRuntime,
    UnitOfWork,
    SOXAuditLogger,
    AuditEventType
)
import threading
from contextlib import contextmanager
from datetime import datetime, timezone

'''
    
    # Template pour l'initialisation de l'infrastructure
    INFRASTRUCTURE_INIT = '''
# Infrastructure de production - Initialisation
_PRODUCTION_RUNTIME = ThreadSafeRuntime(
    max_workers=10,
    timeout_seconds=30,
    enable_deadlock_detection=True
)

_PRODUCTION_AUDIT_LOGGER = SOXAuditLogger(
    log_directory="/var/log/codeswitch/audit",
    retention_days=2555
)

# Contexte de transaction global
_PRODUCTION_UOW: Optional[UnitOfWork] = None
_TRANSACTION_LOCK = threading.Lock()

'''
    
    # Template pour le context manager de transaction
    TRANSACTION_CONTEXT = '''
@contextmanager
def start_production_transaction(user_id: Optional[str] = None, 
                                  session_id: Optional[str] = None):
    """
    Context manager pour les transactions de production.
    
    Assure la cohérence des données et la journalisation d'audit
    pour toutes les modifications effectuées dans le bloc.
    
    Usage:
        with start_production_transaction(user_id="U123") as uow:
            # Effectuer les modifications
            account.balance += amount
    """
    global _PRODUCTION_UOW
    with _TRANSACTION_LOCK:
        if _PRODUCTION_UOW is not None:
            raise RuntimeError("Transaction déjà en cours")
        
        _PRODUCTION_UOW = UnitOfWork(
            audit_logger=_PRODUCTION_AUDIT_LOGGER
        )
    
    try:
        with _PRODUCTION_UOW.start(user_id=user_id, session_id=session_id):
            yield _PRODUCTION_UOW
    finally:
        with _TRANSACTION_LOCK:
            _PRODUCTION_UOW = None

'''
    
    # Template pour l'exécution thread-safe
    THREAD_SAFE_EXECUTION = '''
def execute_thread_safe(func, timeout: Optional[int] = None):
    """
    Exécute une fonction de manière thread-safe avec timeout.
    
    Args:
        func: Fonction à exécuter
        timeout: Timeout optionnel en secondes
        
    Returns:
        Résultat de la fonction
    """
    return _PRODUCTION_RUNTIME.execute(func, timeout=timeout)

'''
    
    def __init__(self, production_level: ProductionLevel = ProductionLevel.BANK_GRADE,
                 audit_logger: Optional[object] = None,
                 strict_mode: bool = True):
        """
        Initialise le post-processeur de production.
        
        Args:
            production_level: Niveau de qualité production souhaité
            audit_logger: Instance du logger d'audit (optionnel)
            strict_mode: Si True, les erreurs bloquent la génération
        """
        self.production_level = production_level
        self.audit_logger = audit_logger
        self.strict_mode = strict_mode
        self._injected_patterns: List[str] = []
        self._checks: List[ProductionCheck] = []
    
    def process(self, original_cobol: str, transpiled_python: str,
                metadata: Optional[Dict[str, Any]] = None) -> Tuple[str, ProductionReport]:
        """
        Traite le code transpilé et injecte les patterns de production.
        
        Args:
            original_cobol: Code COBOL source original
            transpiled_python: Code Python transpilé
            metadata: Métadonnées optionnelles (user_id, etc.)
            
        Returns:
            Tuple de (code de production, rapport de production)
        """
        metadata = metadata or {}
        
        # Analyse du code transpilé
        self._analyze_code(transpiled_python)
        
        # Injection des patterns selon le niveau
        production_code = self._inject_patterns(transpiled_python)
        
        # Validation du code produit
        validation_result = self._validate_production_code(production_code)
        
        # Génération du rapport
        report = self._generate_report(
            transpiled_python, 
            production_code, 
            validation_result,
            metadata
        )
        
        # Logging de l'audit si disponible
        if self.audit_logger:
            self.audit_logger.log_event(
                event_type=AuditEventType.BUSINESS_OPERATION,
                user_id=metadata.get('user_id'),
                action="PRODUCTION_POSTPROCESS",
                after_state={
                    'production_level': self.production_level.value,
                    'score': report.overall_score,
                    'patterns_injected': len(self._injected_patterns)
                }
            )
        
        return production_code, report
    
    def _analyze_code(self, code: str):
        """Analyse le code pour identifier les patterns à injecter."""
        # Analyse AST pour comprendre la structure du code
        try:
            tree = ast.parse(code)
            
            # Identifier les fonctions et classes
            functions = [node.name for node in ast.walk(tree) 
                        if isinstance(node, ast.FunctionDef)]
            classes = [node.name for node in ast.walk(tree) 
                      if isinstance(node, ast.ClassDef)]
            
            # Identifier les accès aux données (variables avec certains noms)
            data_access_patterns = re.findall(
                r'(balance|account|transaction|amount|customer|record)\w*',
                code, re.IGNORECASE
            )
            
            logger.info(f"Analyse: {len(functions)} fonctions, "
                       f"{len(classes)} classes, "
                       f"{len(data_access_patterns)} accès données")
            
        except SyntaxError as e:
            logger.warning(f"Erreur d'analyse AST: {e}")
            self._checks.append(ProductionCheck(
                name="ast_analysis",
                description="Analyse de la structure du code",
                passed=False,
                severity="warning",
                details=str(e)
            ))
    
    def _inject_patterns(self, code: str) -> str:
        """
        Injecte les patterns de production dans le code.
        
        Args:
            code: Code Python transpilé
            
        Returns:
            Code avec les patterns injectés
        """
        self._injected_patterns = []
        result = code
        
        # 1. Ajout des imports en début de fichier
        imports = self._generate_imports()
        result = imports + "\n" + result
        self._injected_patterns.append("production_imports")
        
        # 2. Injection de l'infrastructure selon le niveau
        if self.production_level in [ProductionLevel.STANDARD, 
                                     ProductionLevel.ENHANCED, 
                                     ProductionLevel.BANK_GRADE]:
            infra = self._generate_infrastructure()
            result = self._insert_after_header(result, infra)
            self._injected_patterns.append("infrastructure_initialization")
        
        # 3. Injection du context manager de transaction
        if self.production_level in [ProductionLevel.ENHANCED, 
                                     ProductionLevel.BANK_GRADE]:
            transaction_code = self._generate_transaction_context()
            result = self._insert_at_end(result, transaction_code)
            self._injected_patterns.append("transaction_context")
        
        # 4. Injection de l'exécution thread-safe
        if self.production_level == ProductionLevel.BANK_GRADE:
            thread_safe = self._generate_thread_safe_execution()
            result = self._insert_at_end(result, thread_safe)
            self._injected_patterns.append("thread_safe_execution")
        
        # 5. Injection de la gestion d'erreurs
        error_handling = self._generate_error_handling()
        result = self._insert_at_end(result, error_handling)
        self._injected_patterns.append("error_handling")
        
        # 6. Ajout de l'en-tête de documentation
        header = self._generate_header()
        result = self._insert_at_beginning(result, header)
        
        logger.info(f"Patterns injectés: {self._injected_patterns}")
        return result
    
    def _generate_imports(self) -> str:
        """Génère le bloc d'imports pour la production."""
        return self.PRODUCTION_IMPORTS.format(
            timestamp=datetime.now(timezone.utc).isoformat(),
            production_level=self.production_level.value.upper()
        )
    
    def _generate_infrastructure(self) -> str:
        """Génère le code d'initialisation de l'infrastructure."""
        return self.INFRASTRUCTURE_INIT
    
    def _generate_transaction_context(self) -> str:
        """Génère le context manager de transaction."""
        return self.TRANSACTION_CONTEXT
    
    def _generate_thread_safe_execution(self) -> str:
        """Génère les fonctions d'exécution thread-safe."""
        return self.THREAD_SAFE_EXECUTION
    
    def _generate_error_handling(self) -> str:
        """Génère le code de gestion d'erreurs."""
        return '''
# Gestion d'erreurs de production
class ProductionError(Exception):
    """Exception de base pour les erreurs de production."""
    pass

class TransactionError(ProductionError):
    """Erreur liée aux transactions."""
    pass

class ValidationError(ProductionError):
    """Erreur de validation des données."""
    pass

def handle_production_error(func):
    """
    Décorateur pour la gestion centralisée des erreurs.
    
    Capture les exceptions, les journalise et retourne
    un résultat cohérent.
    
    Usage:
        @handle_production_error
        def process_transaction(data):
            ...
    """
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except ValidationError as e:
            if _PRODUCTION_AUDIT_LOGGER:
                _PRODUCTION_AUDIT_LOGGER.log_error(
                    user_id=getattr(_PRODUCTION_RUNTIME, 'current_user', None),
                    error_type="VALIDATION",
                    error_message=str(e),
                    context={'function': func.__name__}
                )
            raise
        except TransactionError as e:
            if _PRODUCTION_AUDIT_LOGGER:
                _PRODUCTION_AUDIT_LOGGER.log_error(
                    user_id=getattr(_PRODUCTION_RUNTIME, 'current_user', None),
                    error_type="TRANSACTION",
                    error_message=str(e),
                    context={'function': func.__name__}
                )
            raise
        except ProductionError as e:
            if _PRODUCTION_AUDIT_LOGGER:
                _PRODUCTION_AUDIT_LOGGER.log_error(
                    user_id=getattr(_PRODUCTION_RUNTIME, 'current_user', None),
                    error_type="PRODUCTION",
                    error_message=str(e),
                    context={'function': func.__name__}
                )
            raise
        except Exception as e:
            if _PRODUCTION_AUDIT_LOGGER:
                _PRODUCTION_AUDIT_LOGGER.log_error(
                    user_id=getattr(_PRODUCTION_RUNTIME, 'current_user', None),
                    error_type="UNKNOWN",
                    error_message=str(e),
                    context={'function': func.__name__, 'traceback': traceback.format_exc()}
                )
            raise ProductionError(f"Erreur inattendue: {e}") from e
    
    import traceback
    return wrapper

def validate_input(data: Any, schema: Dict[str, Any]) -> bool:
    """
    Valide les données d'entrée selon un schéma.
    
    Args:
        data: Données à valider
        schema: Schéma de validation
        
    Returns:
        True si la validation passe
        
    Raises:
        ValidationError: Si la validation échoue
    """
    if not data:
        raise ValidationError("Les données d'entrée sont vides")
    
    if 'required_fields' in schema:
        for field in schema['required_fields']:
            if field not in data:
                raise ValidationError(f"Champ requis manquant: {field}")
    
    if 'types' in schema:
        for field, expected_type in schema['types'].items():
            if field in data and not isinstance(data[field], expected_type):
                raise ValidationError(
                    f"Type invalide pour {field}: attendu {expected_type.__name__}"
                )
    
    return True

'''
    
    def _generate_header(self) -> str:
        """Génère l'en-tête de documentation."""
        return f'''
# =============================================================================
# CODE GÉNÉRÉ PAR CODESWITCH - TRANSPILEUR COBOL VERS PYTHON
# =============================================================================
# Niveau de production: {self.production_level.value.upper()}
# Patterns injectés: {', '.join(self._injected_patterns)}
# Généré le: {datetime.now(timezone.utc).isoformat()}
# =============================================================================
'''
    
    def _insert_after_header(self, code: str, to_insert: str) -> str:
        """Insère le code après l'en-tête du fichier."""
        lines = code.split('\n')
        insert_idx = 0
        
        # Trouver la fin de l'en-tête (ligne avec #===)
        for i, line in enumerate(lines):
            if line.startswith('#'):
                insert_idx = i + 1
            else:
                break
        
        lines.insert(insert_idx, to_insert)
        return '\n'.join(lines)
    
    def _insert_at_beginning(self, code: str, to_insert: str) -> str:
        """Insère le code au début du fichier."""
        lines = code.split('\n')
        lines.insert(0, to_insert)
        return '\n'.join(lines)
    
    def _insert_at_end(self, code: str, to_insert: str) -> str:
        """Insère le code à la fin du fichier."""
        if code.endswith('\n'):
            return code + to_insert
        else:
            return code + '\n' + to_insert
    
    def _validate_production_code(self, code: str) -> List[ProductionCheck]:
        """
        Valide le code de production généré.
        
        Args:
            code: Code de production à valider
            
        Returns:
            Liste des contrôles effectués
        """
        checks = []
        
        # 1. Vérification de la syntaxe
        try:
            ast.parse(code)
            checks.append(ProductionCheck(
                name="syntax_validation",
                description="Validation de la syntaxe Python",
                passed=True,
                severity="info"
            ))
        except SyntaxError as e:
            checks.append(ProductionCheck(
                name="syntax_validation",
                description="Validation de la syntaxe Python",
                passed=False,
                severity="error",
                details=f"Erreur de syntaxe ligne {e.lineno}: {e.msg}",
                line_number=e.lineno
            ))
        
        # 2. Vérification des imports
        has_imports = re.search(r'^import\s+\w+', code, re.MULTILINE)
        checks.append(ProductionCheck(
            name="imports_check",
            description="Présence des imports nécessaires",
            passed=bool(has_imports),
            severity="warning" if not has_imports else "info"
        ))
        
        # 3. Vérification de la gestion des erreurs
        has_error_handling = 'try:' in code and 'except' in code
        checks.append(ProductionCheck(
            name="error_handling",
            description="Gestion des erreurs présente",
            passed=has_error_handling,
            severity="warning" if not has_error_handling else "info"
        ))
        
        # 4. Vérification de la journalisation
        has_logging = 'logging' in code or '_PRODUCTION_AUDIT_LOGGER' in code
        checks.append(ProductionCheck(
            name="logging",
            description="Journalisation présente",
            passed=has_logging,
            severity="warning" if not has_logging else "info"
        ))
        
        # 5. Vérification de la documentation
        docstring_pattern = r'"""[\s\S]*?"""'
        has_docstring = bool(re.search(docstring_pattern, code))
        checks.append(ProductionCheck(
            name="documentation",
            description="Documentation présente",
            passed=has_docstring,
            severity="info"
        ))
        
        # 6. Vérification des patterns de transaction
        has_transaction = 'start_production_transaction' in code or \
                         'UnitOfWork' in code
        checks.append(ProductionCheck(
            name="transaction_pattern",
            description="Pattern de transaction présent",
            passed=has_transaction or self.production_level == ProductionLevel.BASIC,
            severity="info"
        ))
        
        # 7. Vérification thread-safety
        has_thread_safety = 'ThreadSafeRuntime' in code or \
                           'threading' in code
        checks.append(ProductionCheck(
            name="thread_safety",
            description="Thread-safety implémentée",
            passed=has_thread_safety or self.production_level != ProductionLevel.BANK_GRADE,
            severity="warning" if not has_thread_safety and self.production_level == ProductionLevel.BANK_GRADE else "info"
        ))
        
        self._checks = checks
        return checks
    
    def _generate_report(self, original_code: str, production_code: str,
                        checks: List[ProductionCheck],
                        metadata: Dict[str, Any]) -> ProductionReport:
        """
        Génère le rapport de qualité de production.
        
        Args:
            original_code: Code original transpilé
            production_code: Code avec patterns injectés
            checks: Liste des contrôles effectués
            metadata: Métadonnées de la transpilation
            
        Returns:
            Rapport de production complet
        """
        # Calcul du score global
        error_weight = 50
        warning_weight = 20
        info_weight = 5
        
        score = 100
        warnings = []
        errors = []
        
        for check in checks:
            if check.severity == "error" and not check.passed:
                score -= error_weight
                errors.append(f"{check.name}: {check.details}")
            elif check.severity == "warning" and not check.passed:
                score -= warning_weight
                warnings.append(f"{check.name}: {check.details}")
        
        score = max(0, min(100, score))
        
        # Génération des recommandations
        recommendations = []
        for check in checks:
            if not check.passed and check.severity in ["error", "warning"]:
                recommendations.append(
                    f"Améliorer {check.name}: {check.description}"
                )
        
        return ProductionReport(
            timestamp=datetime.now(timezone.utc),
            production_level=self.production_level,
            overall_score=round(score, 2),
            checks=checks,
            injected_patterns=self._injected_patterns,
            code_size=len(original_code),
            production_size=len(production_code),
            recommendations=recommendations,
            warnings=warnings,
            errors=errors
        )


def inject_production_patterns(cobol_code: str, python_code: str,
                               level: str = "bank_grade",
                               **kwargs) -> Tuple[str, Dict[str, Any]]:
    """
    Fonction便捷 pour injecter les patterns de production.
    
    Args:
        cobol_code: Code COBOL source
        python_code: Code Python transpilé
        level: Niveau de production ("basic", "standard", "enhanced", "bank_grade")
        **kwargs: Arguments additionnels (audit_logger, etc.)
        
    Returns:
        Tuple de (code de production, rapport)
    """
    try:
        production_level = ProductionLevel(level)
    except ValueError:
        logger.warning(f"Niveau de production invalide: {level}, "
                      f"utilisation de BANK_GRADE par défaut")
        production_level = ProductionLevel.BANK_GRADE
    
    postprocessor = ProductionPostprocessor(
        production_level=production_level,
        audit_logger=kwargs.get('audit_logger')
    )
    
    production_code, report = postprocessor.process(
        original_cobol=cobol_code,
        transpiled_python=python_code,
        metadata=kwargs
    )
    
    return production_code, {
        'score': report.overall_score,
        'level': production_level.value,
        'patterns_injected': report.injected_patterns,
        'checks_passed': sum(1 for c in report.checks if c.passed),
        'checks_total': len(report.checks),
        'warnings': report.warnings,
        'errors': report.errors,
        'recommendations': report.recommendations
    }


def validate_production_code(code: str) -> Dict[str, Any]:
    """
    Valide du code de production sans l modifier.
    
    Args:
        code: Code Python à valider
        
    Returns:
        Dictionnaire avec les résultats de validation
    """
    postprocessor = ProductionPostprocessor()
    checks = postprocessor._validate_production_code(code)
    
    return {
        'valid': all(c.passed for c in checks if c.severity == 'error'),
        'checks': [c.to_dict() for c in checks],
        'score': sum(10 for c in checks if c.passed) / max(1, len(checks)) * 10
    }


def calculate_production_readiness(code: str) -> Dict[str, Any]:
    """
    Calcule le score de "Production Readiness" du code.
    
    Cette fonction analyse le code et retourne un score détaillé
    avec les domaines d'amélioration identifiés.
    
    Args:
        code: Code Python à analyser
        
    Returns:
        Rapport de production readiness
    """
    validation = validate_production_code(code)
    
    # Analyse supplémentaire pour le score final
    categories = {
        'error_handling': 25,
        'logging': 20,
        'documentation': 15,
        'thread_safety': 20,
        'transaction_management': 20
    }
    
    scores = {}
    for category, max_score in categories.items():
        found = False
        
        if category == 'error_handling':
            found = 'try:' in code and 'except' in code
        elif category == 'logging':
            found = any(x in code for x in ['logging.', '_PRODUCTION_AUDIT_LOGGER', 'logger'])
        elif category == 'documentation':
            found = '"""' in code or "'''" in code
        elif category == 'thread_safety':
            found = any(x in code for x in ['threading', 'ThreadSafeRuntime', 'lock'])
        elif category == 'transaction_management':
            found = any(x in code for x in ['UnitOfWork', 'start_production_transaction'])
        
        scores[category] = max_score if found else 0
    
    total_score = sum(scores.values())
    max_total = sum(categories.values())
    percentage = (total_score / max_total) * 100
    
    return {
        'overall_score': round(percentage, 2),
        'max_score': max_total,
        'earned_score': total_score,
        'category_scores': scores,
        'is_production_ready': percentage >= 80,
        'critical_missing': [k for k, v in scores.items() if v == 0],
        'recommendations': [
            f"Ajouter la gestion des erreurs pour atteindre 100% dans error_handling" if scores['error_handling'] == 0 else None,
            f"Implémenter la journalisation pour atteindre 100% dans logging" if scores['logging'] == 0 else None,
            f"Documenter le code pour atteindre 100% dans documentation" if scores['documentation'] == 0 else None,
            f"Ajouter la thread-safety pour atteindre 100% dans thread_safety" if scores['thread_safety'] == 0 else None,
            f"Implémenter la gestion des transactions pour atteindre 100% dans transaction_management" if scores['transaction_management'] == 0 else None,
        ]
    }
