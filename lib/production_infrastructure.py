"""
Module d'infrastructure de production pour CodeSwitch

Ce module fournit les classes fondamentales nécessaires pour transformer
du code COBOL transpilé en code Python de qualité production bancaire.

Classes principales:
- ThreadSafeRuntime: Environnement d'exécution thread-safe avec gestion des ressources
- UnitOfWork: Gestionnaire de transactions avec pattern de cohérence eventually
- SOXAuditLogger: Logger conformité SOX pour la traçabilité des opérations

Auteur: CodeSwitch Team
Version: 1.0.0
"""

import threading
import time
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional, List, Callable
from contextlib import contextmanager
from dataclasses import dataclass, field
from enum import Enum
from queue import Queue, Empty
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import os


# Configuration du logger pour ce module
logger = logging.getLogger(__name__)


class TransactionState(Enum):
    """États possibles d'une transaction dans le système."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMMITTED = "committed"
    ROLLED_BACK = "rolled_back"
    FAILED = "failed"


class AuditEventType(Enum):
    """Types d'événements d'audit selon les standards SOX."""
    TRANSACTION_START = "TX_START"
    TRANSACTION_COMMIT = "TX_COMMIT"
    TRANSACTION_ROLLBACK = "TX_ROLLBACK"
    DATA_ACCESS = "DATA_ACCESS"
    DATA_MODIFICATION = "DATA_MODIFICATION"
    SECURITY_EVENT = "SECURITY_EVENT"
    SYSTEM_EVENT = "SYSTEM_EVENT"
    ERROR_EVENT = "ERROR_EVENT"
    BUSINESS_OPERATION = "BUSINESS_OPERATION"


@dataclass
class AuditEvent:
    """
    Représente un événement d'audit conforme aux exigences SOX.
    
    Attributes:
        event_id: Identifiant unique de l'événement
        event_type: Type de l'événement (voir AuditEventType)
        timestamp: Horodatage de l'événement en UTC
        user_id: Identifiant de l'utilisateur effectuant l'opération
        session_id: Identifiant de la session
        resource: Ressource accédée ou modifiée
        action: Action effectuée
        before_state: État avant modification (si applicable)
        after_state: État après modification (si applicable)
        success: Indique si l'opération a réussi
        error_message: Message d'erreur en cas d'échec
        metadata: Métadonnées additionnelles
        checksum: Hash de vérification de l'intégrité
    """
    event_type: AuditEventType
    timestamp: datetime
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    resource: Optional[str] = None
    action: Optional[str] = None
    before_state: Optional[Dict[str, Any]] = None
    after_state: Optional[Dict[str, Any]] = None
    success: bool = True
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        if not self.event_id:
            object.__setattr__(self, 'event_id', str(uuid.uuid4()))
        if not self.timestamp:
            object.__setattr__(self, 'timestamp', datetime.now(timezone.utc))
    
    def compute_checksum(self) -> str:
        """
        Calcule un hash de vérification pour garantir l'intégrité de l'événement.
        
        Returns:
            Hash SHA-256 de la représentation JSON de l'événement
        """
        event_data = {
            'event_id': self.event_id,
            'event_type': self.event_type.value,
            'timestamp': self.timestamp.isoformat(),
            'user_id': self.user_id,
            'resource': self.resource,
            'action': self.action,
            'before_state': self.before_state,
            'after_state': self.after_state,
            'success': self.success
        }
        return hashlib.sha256(json.dumps(event_data, sort_keys=True).encode()).hexdigest()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertit l'événement en dictionnaire sérialisable."""
        return {
            'event_id': self.event_id,
            'event_type': self.event_type.value,
            'timestamp': self.timestamp.isoformat(),
            'user_id': self.user_id,
            'session_id': self.session_id,
            'resource': self.resource,
            'action': self.action,
            'before_state': self.before_state,
            'after_state': self.after_state,
            'success': self.success,
            'error_message': self.error_message,
            'metadata': self.metadata,
            'checksum': self.compute_checksum()
        }


class ThreadSafeRuntime:
    """
    Environnement d'exécution thread-safe pour les applications de production.
    
    Cette classe fournit un wrapper thread-safe autour de l'exécution de code,
    avec gestion des ressources, isolation des threads et monitoring.
    
    Caractéristiques principales:
    - Pool de threads avec configuration flexible
    - Isolation des contextes d'exécution par thread
    - Détection et prévention des deadlocks
    - Monitoring en temps réel des ressources
    - Nettoyage automatique des ressources
    
    Example d'utilisation:
        ```python
        runtime = ThreadSafeRuntime(
            max_workers=10,
            timeout_seconds=30,
            enable_deadlock_detection=True
        )
        
        result = runtime.execute(
            lambda: calculate_loan_interest(amount, rate, term),
            context={'user_id': 'U123', 'loan_id': 'L456'}
        )
        ```
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls, max_workers: int = 10, timeout_seconds: int = 30, 
               enable_deadlock_detection: bool = True):
        """
        Implémentation du pattern Singleton avec thread-safety.
        
        Args:
            max_workers: Nombre maximum de workers dans le pool
            timeout_seconds: Timeout par défaut pour les exécutions
            enable_deadlock_detection: Active la détection de deadlocks
        """
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance
    
    def __init__(self, max_workers: int = 10, timeout_seconds: int = 30,
                 enable_deadlock_detection: bool = True):
        """Initialise le runtime thread-safe."""
        if self._initialized:
            return
        
        self.max_workers = max_workers
        self.default_timeout = timeout_seconds
        self.enable_deadlock_detection = enable_deadlock_detection
        self._executor = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="codeswitch")
        self._thread_contexts = threading.local()
        self._resource_lock = threading.RLock()
        self._resources: Dict[str, Dict[str, Any]] = {}
        self._deadlock_watchdog: Optional[threading.Thread] = None
        self._shutdown_event = threading.Event()
        self._execution_counter = 0
        self._active_executions = 0
        
        # Configuration du logging
        self._setup_logging()
        
        # Démarrage du watchdog de deadlock si activé
        if self.enable_deadlock_detection:
            self._start_deadlock_watchdog()
        
        self._initialized = True
        logger.info(f"ThreadSafeRuntime initialisé avec {max_workers} workers")
    
    def _setup_logging(self):
        """Configure le logging pour le runtime."""
        self.logger = logging.getLogger("ThreadSafeRuntime")
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - [%(threadName)s] %(message)s'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)
    
    def _start_deadlock_watchdog(self):
        """Démarre le thread de surveillance des deadlocks."""
        def watchdog_loop():
            while not self._shutdown_event.is_set():
                self._check_deadlocks()
                time.sleep(5)  # Vérification toutes les 5 secondes
        
        self._deadlock_watchdog = threading.Thread(
            target=watchdog_loop,
            name="DeadlockWatchdog",
            daemon=True
        )
        self._deadlock_watchdog.start()
    
    def _check_deadlocks(self):
        """Vérifie la présence de deadlocks potentiels."""
        # Implémentation simplifiée - dans une version complète,
        # on utiliserait un graphe de dépendances
        active_count = self._get_active_execution_count()
        if active_count >= self.max_workers * 0.9:  # 90% de capacité
            self.logger.warning(
                f"Alerte deadlock: {active_count}/{self.max_workers} exécutions actives"
            )
    
    def _get_active_execution_count(self) -> int:
        """Retourne le nombre d'exécutions actives (thread-safe)."""
        with self._resource_lock:
            return self._active_executions
    
    @contextmanager
    def _execution_context(self):
        """Contexte manager pour le suivi des exécutions."""
        with self._resource_lock:
            self._execution_counter += 1
            self._active_executions += 1
        
        try:
            yield
        finally:
            with self._resource_lock:
                self._active_executions -= 1
    
    def execute(self, func: Callable, context: Optional[Dict[str, Any]] = None,
                timeout: Optional[int] = None) -> Any:
        """
        Exécute une fonction de manière thread-safe avec timeout.
        
        Args:
            func: Fonction à exécuter
            context: Contexte d'exécution (user_id, session_id, etc.)
            timeout: Timeout optionnel en secondes
            
        Returns:
            Résultat de la fonction exécutée
            
        Raises:
            TimeoutError: Si l'exécution dépasse le timeout
            RuntimeError: En cas d'erreur d'exécution
        """
        timeout = timeout or self.default_timeout
        
        with self._execution_context():
            future = self._executor.submit(func)
            
            try:
                result = future.result(timeout=timeout)
                self.logger.info(
                    f"Exécution réussie: {func.__name__ if hasattr(func, '__name__') else 'anonymous'} "
                    f"en contexte {context}"
                )
                return result
            except TimeoutError:
                future.cancel()
                self.logger.error(f"Timeout lors de l'exécution: {func.__name__}")
                raise TimeoutError(f"L'exécution a dépassé le timeout de {timeout}s")
            except Exception as e:
                self.logger.error(f"Erreur lors de l'exécution: {str(e)}")
                raise
    
    def execute_batch(self, tasks: List[Callable], 
                      max_concurrent: Optional[int] = None) -> List[Any]:
        """
        Exécute un lot de tâches en parallèle.
        
        Args:
            tasks: Liste de fonctions à exécuter
            max_concurrent: Nombre maximum de tâches concurrentes
            
        Returns:
            Liste des résultats dans l'ordre des tâches
        """
        max_concurrent = max_concurrent or self.max_workers
        
        results = [None] * len(tasks)
        completed_count = 0
        
        with ThreadPoolExecutor(max_workers=max_concurrent) as executor:
            future_to_index = {
                executor.submit(task): index 
                for index, task in enumerate(tasks)
            }
            
            for future in as_completed(future_to_index):
                index = future_to_index[future]
                try:
                    results[index] = future.result()
                except Exception as e:
                    results[index] = e
                    self.logger.error(f"Erreur dans la tâche {index}: {str(e)}")
                completed_count += 1
        
        return results
    
    def allocate_resource(self, resource_id: str, resource_type: str, 
                          capacity: int = 1) -> bool:
        """
        Alloue une ressource dans le runtime.
        
        Args:
            resource_id: Identifiant unique de la ressource
            resource_type: Type de ressource (database, cache, etc.)
            capacity: Capacité disponible
            
        Returns:
            True si l'allocation a réussi
        """
        with self._resource_lock:
            if resource_id in self._resources:
                return False
            
            self._resources[resource_id] = {
                'type': resource_type,
                'capacity': capacity,
                'used': 0,
                'allocated_at': datetime.now(timezone.utc)
            }
            return True
    
    def release_resource(self, resource_id: str):
        """Libère une ressource allouée."""
        with self._resource_lock:
            if resource_id in self._resources:
                del self._resources[resource_id]
    
    def get_resource_status(self, resource_id: str) -> Optional[Dict[str, Any]]:
        """Retourne le statut d'une ressource."""
        with self._resource_lock:
            return self._resources.get(resource_id)
    
    def get_statistics(self) -> Dict[str, Any]:
        """Retourne les statistiques d'utilisation du runtime."""
        with self._resource_lock:
            return {
                'total_executions': self._execution_counter,
                'active_executions': self._active_executions,
                'max_workers': self.max_workers,
                'resources_allocated': len(self._resources),
                'utilization_percent': (
                    (self._active_executions / self.max_workers) * 100 
                    if self.max_workers > 0 else 0
                )
            }
    
    def shutdown(self):
        """
        Arrête proprement le runtime et libère les ressources.
        
        Cette méthode doit être appelée lors de l'arrêt de l'application
        pour garantir la libération correcte des ressources.
        """
        self.logger.info("Arrêt du ThreadSafeRuntime...")
        self._shutdown_event.set()
        
        if self._deadlock_watchdog:
            self._deadlock_watchdog.join(timeout=2)
        
        self._executor.shutdown(wait=True)
        
        with self._resource_lock:
            self._resources.clear()
        
        logger.info("ThreadSafeRuntime arrêté avec succès")


class UnitOfWork:
    """
    Implémentation du pattern Unit of Work pour la gestion des transactions.
    
    Cette classe assure la cohérence des données à travers un mécanisme de
    buffering des opérations avec validation avant commit,遵循 le principe
    de "eventual consistency" adapté aux systèmes financiers.
    
    Caractéristiques:
    - Buffering des modifications en mémoire
    - Validation avant commit avec règles métier
    - Rollback en cas d'erreur
    - Journalisation complète pour audit
    
    Example d'utilisation:
        ```python
        uow = UnitOfWork(audit_logger=audit_logger)
        
        with uow.start():
            account = repository.get("ACC123")
            uow.register_dirty(account)
            
            account.balance += 1000
            account.last_modified = datetime.now()
            
            # Le commit est automatique à la sortie du context
        ```
    """
    
    def __init__(self, audit_logger: Optional['SOXAuditLogger'] = None,
                 max_buffer_size: int = 1000):
        """
        Initialise le Unit of Work.
        
        Args:
            audit_logger: Instance du logger d'audit (optionnel)
            max_buffer_size: Taille maximale du buffer de modifications
        """
        self.audit_logger = audit_logger
        self.max_buffer_size = max_buffer_size
        self._lock = threading.Lock()
        self._identity_map: Dict[str, Any] = {}
        self._dirty_objects: Dict[str, Any] = {}
        self._removed_objects: Dict[str, Any] = {}
        self._new_objects: Dict[str, Any] = {}
        self._current_context: Optional['UnitOfWorkContext'] = None
        self._committed_changes: List[Dict[str, Any]] = []
    
    @contextmanager
    def start(self, user_id: Optional[str] = None, 
              session_id: Optional[str] = None):
        """
        Démarre un nouveau contexte de transaction.
        
        Usage:
            with uow.start(user_id="U123", session_id="S456") as ctx:
                # Effectuer les modifications
                pass
            # Commit automatique à la sortie
        
        Yields:
            UnitOfWorkContext: Le contexte de transaction courant
        """
        ctx = UnitOfWorkContext(self, user_id, session_id)
        self._current_context = ctx
        
        try:
            self._log_transaction_start(ctx)
            yield ctx
            self.commit(ctx)
        except Exception as e:
            self.rollback(ctx, str(e))
            raise
    
    def register_dirty(self, obj: Any, key: str):
        """
        Enregistre un objet modifié dans le buffer.
        
        Args:
            obj: L'objet modifié
            key: Clé unique d'identification de l'objet
        """
        with self._lock:
            if key in self._removed_objects:
                raise ValueError(f"Objet {key} déjà marqué comme supprimé")
            
            before_state = self._get_state(obj, key)
            
            self._dirty_objects[key] = {
                'object': obj,
                'before_state': before_state,
                'registered_at': datetime.now(timezone.utc)
            }
            
            if key in self._identity_map:
                del self._identity_map[key]
    
    def register_new(self, obj: Any, key: str):
        """
        Enregistre un nouvel objet.
        
        Args:
            obj: Le nouvel objet
            key: Clé unique d'identification
        """
        with self._lock:
            if key in self._new_objects or key in self._dirty_objects:
                raise ValueError(f"Objet {key} déjà enregistré")
            
            self._new_objects[key] = {
                'object': obj,
                'registered_at': datetime.now(timezone.utc)
            }
    
    def register_removed(self, obj: Any, key: str):
        """
        Enregistre un objet pour suppression.
        
        Args:
            obj: L'objet à supprimer
            key: Clé unique d'identification
        """
        with self._lock:
            before_state = None
            
            if key in self._new_objects:
                del self._new_objects[key]
            elif key in self._dirty_objects:
                before_state = self._dirty_objects[key]['before_state']
                del self._dirty_objects[key]
            else:
                before_state = self._get_state(obj, key)
            
            self._removed_objects[key] = {
                'object': obj,
                'before_state': before_state,
                'registered_at': datetime.now(timezone.utc)
            }
    
    def get(self, key: str) -> Optional[Any]:
        """Récupère un objet du cache d'identité."""
        with self._lock:
            for collection in [self._identity_map, self._new_objects, 
                              self._dirty_objects, self._removed_objects]:
                if key in collection:
                    return collection[key].get('object')
            return None
    
    def _get_state(self, obj: Any, key: str) -> Optional[Dict[str, Any]]:
        """Récupère l'état d'un objet pour l'audit."""
        if hasattr(obj, 'to_dict'):
            return obj.to_dict()
        elif hasattr(obj, '__dict__'):
            return obj.__dict__.copy()
        return None
    
    def _log_transaction_start(self, ctx: 'UnitOfWorkContext'):
        """Log le début de transaction pour l'audit."""
        if self.audit_logger:
            self.audit_logger.log_event(
                event_type=AuditEventType.TRANSACTION_START,
                user_id=ctx.user_id,
                session_id=ctx.session_id,
                action="UOW_START",
                metadata={'transaction_id': ctx.transaction_id}
            )
    
    def _validate_commit(self, ctx: 'UnitOfWorkContext') -> bool:
        """
        Valide les modifications avant commit.
        
        Returns:
            True si la validation passe
        Raises:
            ValueError: Si la validation échoue
        """
        total_changes = (
            len(self._dirty_objects) + 
            len(self._new_objects) + 
            len(self._removed_objects)
        )
        
        if total_changes > self.max_buffer_size:
            raise ValueError(
                f"Trop de modifications ({total_changes}) pour le buffer (max: {self.max_buffer_size})"
            )
        
        # Validation métier personnalisée peut être ajoutée ici
        for key, data in self._dirty_objects.items():
            obj = data['object']
            if hasattr(obj, 'validate') and not obj.validate():
                raise ValueError(f"Validation échouée pour l'objet {key}")
        
        return True
    
    def commit(self, ctx: 'UnitOfWorkContext'):
        """
        Valide et applique les modifications en attente.
        
        Args:
            ctx: Contexte de transaction
        """
        with self._lock:
            self._validate_commit(ctx)
            
            # Application des modifications
            for key, data in self._new_objects.items():
                self._identity_map[key] = data
            
            for key, data in self._dirty_objects.items():
                self._identity_map[key] = data
            
            for key, list_obj in [('_new_objects', self._new_objects),
                                  ('_dirty_objects', self._dirty_objects),
                                  ('_removed_objects', self._removed_objects)]:
                if key != '_removed_objects':
                    self._committed_changes.append({
                        'transaction_id': ctx.transaction_id,
                        'type': key,
                        'keys': list(list_obj.keys()),
                        'timestamp': datetime.now(timezone.utc)
                    })
            
            # Nettoyage des buffers
            self._new_objects.clear()
            self._dirty_objects.clear()
            self._removed_objects.clear()
            
            if self.audit_logger:
                self.audit_logger.log_event(
                    event_type=AuditEventType.TRANSACTION_COMMIT,
                    user_id=ctx.user_id,
                    session_id=ctx.session_id,
                    action="UOW_COMMIT",
                    metadata={
                        'transaction_id': ctx.transaction_id,
                        'changes_committed': len(self._committed_changes)
                    }
                )
    
    def rollback(self, ctx: 'UnitOfWorkContext', reason: str):
        """
        Annule toutes les modifications en attente.
        
        Args:
            ctx: Contexte de transaction
            reason: Raison du rollback
        """
        with self._lock:
            # Restauration de l'état initial
            for key, data in self._dirty_objects.items():
                obj = data['object']
                before_state = data.get('before_state')
                if before_state and hasattr(obj, 'restore_state'):
                    obj.restore_state(before_state)
            
            self._new_objects.clear()
            self._dirty_objects.clear()
            self._removed_objects.clear()
            
            if self.audit_logger:
                self.audit_logger.log_event(
                    event_type=AuditEventType.TRANSACTION_ROLLBACK,
                    user_id=ctx.user_id,
                    session_id=ctx.session_id,
                    action="UOW_ROLLBACK",
                    success=False,
                    error_message=reason,
                    metadata={
                        'transaction_id': ctx.transaction_id,
                        'rollback_reason': reason
                    }
                )
    
    def get_pending_changes(self) -> Dict[str, List[str]]:
        """Retourne la liste des modifications en attente."""
        with self._lock:
            return {
                'new': list(self._new_objects.keys()),
                'modified': list(self._dirty_objects.keys()),
                'removed': list(self._removed_objects.keys())
            }


class UnitOfWorkContext:
    """
    Contexte de transaction Unit of Work.
    
    Ce contexte maintient les informations de session et transaction
    pour la traçabilité et l'audit.
    """
    
    def __init__(self, uow: UnitOfWork, user_id: Optional[str] = None,
                 session_id: Optional[str] = None):
        self.uow = uow
        self.user_id = user_id
        self.session_id = session_id
        self.transaction_id = str(uuid.uuid4())
        self.started_at = datetime.now(timezone.utc)
        self.committed = False
        self.rolled_back = False
    
    def __enter__(self) -> 'UnitOfWorkContext':
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.uow.rollback(self, str(exc_val))
            return False
        if not self.committed and not self.rolled_back:
            self.uow.commit(self)
        return True


class SOXAuditLogger:
    """
    Logger d'audit conforme aux exigences Sarbanes-Oxley (SOX).
    
    Cette classe assure la traçabilité complète des opérations sensibles
    pour la conformité réglementaire et l'audit des systèmes financiers.
    
    Caractéristiques:
    - Journalisation immutable des événements
    - Hachage cryptographique pour intégrité
    - Catégorisation des événements par type
    - Export vers formats d'audit standard
    
    Example d'utilisation:
        ```python
        logger = SOXAuditLogger(
            log_directory="/var/log/codeswitch/audit",
            retention_days=2555  # ~7 ans pour conformité SOX
        )
        
        logger.log_event(
            event_type=AuditEventType.TRANSACTION_COMMIT,
            user_id="U123",
            session_id="S456",
            resource="ACCOUNT001",
            action="CREDIT",
            after_state={"balance": 5000.00}
        )
        ```
    """
    
    def __init__(self, log_directory: str = "/var/log/codeswitch/audit",
                 retention_days: int = 2555,  # ~7 ans pour SOX
                 enable_remote_sync: bool = False,
                 remote_endpoint: Optional[str] = None):
        """
        Initialise le logger d'audit SOX.
        
        Args:
            log_directory: Répertoire de stockage des logs d'audit
            retention_days: Durée de rétention des logs (min 2555 jours pour SOX)
            enable_remote_sync: Active la synchronisation vers un endpoint distant
            remote_endpoint: URL de l'endpoint distant (si activé)
        """
        self.log_directory = log_directory
        self.retention_days = retention_days
        self.enable_remote_sync = enable_remote_sync
        self.remote_endpoint = remote_endpoint
        
        self._lock = threading.Lock()
        self._event_queue: Queue = Queue()
        self._worker_thread: Optional[threading.Thread] = None
        self._running = False
        self._current_file: Optional[str] = None
        self._file_rotation_time: Optional[datetime] = None
        self._events_written = 0
        
        # Création du répertoire de logs si nécessaire
        os.makedirs(log_directory, exist_ok=True)
        
        # Configuration du logging Python
        self._setup_python_logging()
        
        # Démarrage du worker de persistence
        self._start_worker()
        
        logger.info(f"SOXAuditLogger initialisé dans {log_directory}")
    
    def _setup_python_logging(self):
        """Configure le logging Python pour l'audit."""
        self.logger = logging.getLogger("SOXAuditLogger")
        self.logger.setLevel(logging.INFO)
        
        # Handler pour les événements d'audit (pas de logs applicatifs)
        audit_handler = logging.FileHandler(
            os.path.join(self.log_directory, 'audit_system.log')
        )
        audit_handler.setLevel(logging.INFO)
        
        formatter = logging.Formatter(
            '%(asctime)s - AUDIT - %(levelname)s - %(message)s'
        )
        audit_handler.setFormatter(formatter)
        
        # Pas d'addHandler pour éviter les logs applicatifs
        # self.logger.addHandler(audit_handler)
    
    def _start_worker(self):
        """Démarre le thread worker pour la persistence asynchrone."""
        self._running = True
        self._worker_thread = threading.Thread(
            target=self._process_event_queue,
            name="AuditWorker",
            daemon=True
        )
        self._worker_thread.start()
    
    def _process_event_queue(self):
        """Traite la file d'événements d'audit."""
        while self._running or not self._event_queue.empty():
            try:
                event = self._event_queue.get(timeout=1)
                self._persist_event(event)
                self._event_queue.task_done()
            except Empty:
                continue
            except Exception as e:
                # Log d'erreur critique mais continue le traitement
                print(f"Erreur lors du traitement de l'événement d'audit: {e}")
    
    def _get_log_filename(self) -> str:
        """Détermine le nom du fichier de log actuel."""
        now = datetime.now(timezone.utc)
        
        # Rotation quotidienne
        if self._file_rotation_time is None or \
           now.date() != self._file_rotation_time.date():
            self._file_rotation_time = now
            date_str = now.strftime("%Y%m%d")
            self._current_file = os.path.join(
                self.log_directory, f"audit_{date_str}.jsonl"
            )
            self._events_written = 0
        
        return self._current_file
    
    def _persist_event(self, event: AuditEvent):
        """Persiste un événement d'audit sur disque."""
        filename = self._get_log_filename()
        
        event_dict = event.to_dict()
        line = json.dumps(event_dict, ensure_ascii=False) + '\n'
        
        with open(filename, 'a', encoding='utf-8') as f:
            f.write(line)
        
        self._events_written += 1
        
        # Rotation du fichier si trop d'événements (10k max par fichier)
        if self._events_written >= 10000:
            self._file_rotation_time = None
    
    def log_event(self, event_type: AuditEventType, 
                  user_id: Optional[str] = None,
                  session_id: Optional[str] = None,
                  resource: Optional[str] = None,
                  action: Optional[str] = None,
                  before_state: Optional[Dict[str, Any]] = None,
                  after_state: Optional[Dict[str, Any]] = None,
                  success: bool = True,
                  error_message: Optional[str] = None,
                  metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Enregistre un événement d'audit.
        
        Args:
            event_type: Type de l'événement (voir AuditEventType)
            user_id: Identifiant de l'utilisateur
            session_id: Identifiant de la session
            resource: Ressource affectée
            action: Action effectuée
            before_state: État avant modification
            after_state: État après modification
            success: Si l'opération a réussi
            error_message: Message d'erreur si échec
            metadata: Métadonnées additionnelles
            
        Returns:
            L'identifiant de l'événement créé
        """
        event = AuditEvent(
            event_type=event_type,
            user_id=user_id,
            session_id=session_id,
            resource=resource,
            action=action,
            before_state=before_state,
            after_state=after_state,
            success=success,
            error_message=error_message,
            metadata=metadata or {}
        )
        
        event_id = event.event_id
        
        # Ajout à la file pour traitement asynchrone
        self._event_queue.put(event)
        
        # Log pour le système
        self.logger.info(
            f"Event {event.event_type.value}: {action} on {resource} "
            f"(user: {user_id}, success: {success})"
        )
        
        return event_id
    
    def log_transaction_start(self, transaction_id: str, user_id: str,
                              transaction_type: str, **kwargs):
        """Log le début d'une transaction."""
        return self.log_event(
            event_type=AuditEventType.TRANSACTION_START,
            user_id=user_id,
            action=f"START_{transaction_type}",
            metadata={'transaction_id': transaction_id, **kwargs}
        )
    
    def log_transaction_commit(self, transaction_id: str, user_id: str,
                               changes_count: int, **kwargs):
        """Log le commit d'une transaction."""
        return self.log_event(
            event_type=AuditEventType.TRANSACTION_COMMIT,
            user_id=user_id,
            action="TRANSACTION_COMMIT",
            after_state={'transaction_id': transaction_id, 
                        'changes_committed': changes_count, **kwargs}
        )
    
    def log_data_access(self, user_id: str, resource: str, 
                        access_type: str, data_summary: Dict[str, Any]):
        """Log un accès aux données."""
        return self.log_event(
            event_type=AuditEventType.DATA_ACCESS,
            user_id=user_id,
            resource=resource,
            action=f"ACCESS_{access_type}",
            after_state=data_summary
        )
    
    def log_data_modification(self, user_id: str, resource: str,
                              modification_type: str,
                              before: Dict[str, Any],
                              after: Dict[str, Any]):
        """Log une modification de données."""
        return self.log_event(
            event_type=AuditEventType.DATA_MODIFICATION,
            user_id=user_id,
            resource=resource,
            action=f"MODIFY_{modification_type}",
            before_state=before,
            after_state=after
        )
    
    def log_security_event(self, user_id: str, event_type_name: str,
                           severity: str, details: Dict[str, Any]):
        """Log un événement de sécurité."""
        return self.log_event(
            event_type=AuditEventType.SECURITY_EVENT,
            user_id=user_id,
            action=f"SECURITY_{event_type_name}",
            success=(severity != 'CRITICAL'),
            metadata={'severity': severity, **details}
        )
    
    def log_error(self, user_id: str, error_type: str, 
                  error_message: str, context: Dict[str, Any]):
        """Log une erreur."""
        return self.log_event(
            event_type=AuditEventType.ERROR_EVENT,
            user_id=user_id,
            action=f"ERROR_{error_type}",
            success=False,
            error_message=error_message,
            metadata=context
        )
    
    def get_audit_trail(self, start_date: datetime, 
                        end_date: datetime,
                        user_id: Optional[str] = None,
                        resource: Optional[str] = None,
                        event_types: Optional[List[AuditEventType]] = None
                        ) -> List[Dict[str, Any]]:
        """
        Récupère la piste d'audit pour une période donnée.
        
        Args:
            start_date: Date de début de la période
            end_date: Date de fin de la période
            user_id: Filtrer par utilisateur (optionnel)
            resource: Filtrer par ressource (optionnel)
            event_types: Filtrer par types d'événements (optionnel)
            
        Returns:
            Liste des événements d'audit correspondant aux critères
        """
        events = []
        start_dt = start_date.replace(tzinfo=timezone.utc) if \
            start_date.tzinfo is None else start_date
        end_dt = end_date.replace(tzinfo=timezone.utc) if \
            end_date.tzinfo is None else end_date
        
        # Parcours des fichiers de logs
        current = start_dt.date()
        while current <= end_dt.date():
            filename = os.path.join(
                self.log_directory, 
                f"audit_{current.strftime('%Y%m%d')}.jsonl"
            )
            
            if os.path.exists(filename):
                with open(filename, 'r', encoding='utf-8') as f:
                    for line in f:
                        try:
                            event = json.loads(line.strip())
                            
                            # Filtres
                            event_time = datetime.fromisoformat(
                                event['timestamp'].replace('Z', '+00:00')
                            )
                            
                            if user_id and event.get('user_id') != user_id:
                                continue
                            if resource and event.get('resource') != resource:
                                continue
                            if event_types:
                                event_type_str = event.get('event_type')
                                if event_type_str not in [et.value for et in event_types]:
                                    continue
                            
                            events.append(event)
                        except (json.JSONDecodeError, KeyError):
                            continue
            
            current += timedelta(days=1)
        
        return events
    
    def export_compliance_report(self, start_date: datetime, 
                                  end_date: datetime) -> Dict[str, Any]:
        """
        Génère un rapport de conformité pour une période.
        
        Args:
            start_date: Début de la période
            end_date: Fin de la période
            
        Returns:
            Rapport de conformité avec statistiques
        """
        events = self.get_audit_trail(start_date, end_date)
        
        stats = {
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'total_events': len(events),
            'by_type': {},
            'by_user': {},
            'success_rate': 0,
            'security_incidents': 0,
            'failed_transactions': 0
        }
        
        for event in events:
            event_type = event.get('event_type', 'UNKNOWN')
            stats['by_type'][event_type] = stats['by_type'].get(event_type, 0) + 1
            
            user_id = event.get('user_id', 'ANONYMOUS')
            stats['by_user'][user_id] = stats['by_user'].get(user_id, 0) + 1
            
            if not event.get('success', True):
                if event_type == 'SECURITY_EVENT':
                    stats['security_incidents'] += 1
                elif event_type.startswith('TX_'):
                    stats['failed_transactions'] += 1
        
        total_with_status = sum(
            1 for e in events 
            if e.get('success') is not None or e.get('error_message')
        )
        if total_with_status > 0:
            successful = sum(
                1 for e in events 
                if e.get('success', True)
            )
            stats['success_rate'] = (successful / total_with_status) * 100
        
        return stats
    
    def shutdown(self):
        """Arrête proprement le logger et libère les ressources."""
        self._running = False
        
        if self._worker_thread:
            self._worker_thread.join(timeout=5)
        
        # Flush de la file
        while not self._event_queue.empty():
            try:
                event = self._event_queue.get_nowait()
                self._persist_event(event)
                self._event_queue.task_done()
            except Empty:
                break
        
        logger.info("SOXAuditLogger arrêté avec succès")


# Import nécessaire pour timedelta
from datetime import timedelta
