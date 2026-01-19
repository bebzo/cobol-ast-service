"""
Services Métier Thread-Safe - Architecture Stateless

Ce module implémente les services métier sans état (stateless) pour garantir
la thread-safety en environnement web multi-utilisateurs.

Architecture:
- CustomerService: Gestion des clients
- AccountService: Gestion des comptes avec verrouillage optimiste
- TransferService: Transferts atomiques entre comptes
- AuditService: Logging des opérations pour compliance

Auteur: MiniMax Agent
Version: 1.0.0 - Production Ready
"""

from decimal import Decimal
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import logging
import uuid
import contextvars

from lib.database_layer import (
    db, Customer, Account, Transaction,
    CustomerRepository, AccountRepository, TransactionRepository
)


# Configuration du logging
logger = logging.getLogger(__name__)

# Contexte pour isoler l'état par requête (thread-safety)
request_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar('request_id', default='')


# ============================================================================
# TYPES ET DATACLASSES
# ============================================================================

class TransferStatus(Enum):
    """Statut d'un transfert."""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    INSUFFICIENT_FUNDS = "insufficient_funds"
    ACCOUNT_NOT_FOUND = "account_not_found"


@dataclass
class TransferResult:
    """Résultat d'un transfert."""
    status: TransferStatus
    transaction_id: Optional[str]
    source_balance: Decimal
    target_balance: Decimal
    amount: Decimal
    error_message: Optional[str] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()


@dataclass
class CustomerProfile:
    """Profil client agrégé."""
    customer: Customer
    accounts: List[Account]
    total_balance: Decimal
    account_count: int


# ============================================================================
# SERVICE DE BASE
# ============================================================================

class BaseService:
    """
    Classe de base pour tous les services métier.
    
    Fournit:
    - Isolation du contexte de requête
    - Gestion des repositories
    - Logging standardisé
    """
    
    def __init__(self):
        self._request_id = None
    
    def _get_request_id(self) -> str:
        """Récupère ou génère un ID de requête unique."""
        self._request_id = request_id_ctx.get()
        if not self._request_id:
            self._request_id = str(uuid.uuid4())[:8]
        return self._request_id
    
    def _log_operation(self, operation: str, details: Dict[str, Any] = None):
        """Log structuré pour audit trail."""
        log_data = {
            'request_id': self._get_request_id(),
            'operation': operation,
            'timestamp': datetime.utcnow().isoformat(),
        }
        if details:
            log_data.update(details)
        logger.info(f"[AUDIT] {log_data}")
    
    def _get_session(self):
        """Obtient une session de base de données."""
        return db.session_factory()
    
    def _cleanup_session(self, session):
        """Nettoie la session en cas d'erreur."""
        session.rollback()
        session.close()


# ============================================================================
# CUSTOMER SERVICE
# ============================================================================

class CustomerService(BaseService):
    """
    Service pour la gestion des clients bancaires.
    
    Thread-safe: Ne stocke aucune données utilisateur dans l'état de l'instance.
    Toutes les données sont passées via les arguments des méthodes.
    """
    
    def get_customer(self, customer_id: str) -> Optional[Customer]:
        """
        Récupère un client par son ID.
        
        Args:
            customer_id: Identifiant unique du client
        
        Returns:
            Customer: Instance du client ou None
        """
        session = self._get_session()
        try:
            repo = CustomerRepository(session)
            customer = repo.get_by_id(customer_id)
            self._log_operation('get_customer', {'customer_id': customer_id, 'found': customer is not None})
            return customer
        finally:
            session.close()
    
    def get_customer_profile(self, customer_id: str) -> Optional[CustomerProfile]:
        """
        Récupère le profil complet d'un client avec tous ses comptes.
        
        Args:
            customer_id: Identifiant du client
        
        Returns:
            CustomerProfile: Profil agrégé ou None
        """
        session = self._get_session()
        try:
            customer_repo = CustomerRepository(session)
            account_repo = AccountRepository(session)
            
            customer = customer_repo.get_by_id(customer_id)
            if not customer:
                return None
            
            accounts = account_repo.get_accounts_by_customer(customer_id)
            total_balance = sum(acc.balance or Decimal('0') for acc in accounts)
            
            profile = CustomerProfile(
                customer=customer,
                accounts=accounts,
                total_balance=total_balance,
                account_count=len(accounts)
            )
            
            self._log_operation('get_customer_profile', {
                'customer_id': customer_id,
                'account_count': len(accounts)
            })
            
            return profile
        finally:
            session.close()
    
    def search_customers(self, 
                        status: str = None,
                        min_balance: Decimal = None,
                        limit: int = 100) -> List[Customer]:
        """
        Recherche des clients selon des critères flexibles.
        
        Args:
            status: Statut du client (A=Active, I=Inactive)
            min_balance: Solde minimum requis
            limit: Nombre maximum de résultats
        
        Returns:
            List[Customer]: Liste des clients matching les critères
        """
        session = self._get_session()
        try:
            repo = CustomerRepository(session)
            customers = repo.get_all(limit=limit)
            
            # Filtrage en mémoire (pour simplicité)
            if status:
                customers = [c for c in customers if c.status == status]
            
            if min_balance is not None:
                customers = [c for c in customers if (c.total_balance or Decimal('0')) >= min_balance]
            
            return customers
        finally:
            session.close()
    
    def create_customer(self, 
                       customer_id: str,
                       name: str,
                       tax_id: str,
                       **kwargs) -> Customer:
        """
        Crée un nouveau client.
        
        Args:
            customer_id: Identifiant unique
            name: Nom du client
            tax_id: Numéro fiscal/SSN
            **kwargs: Attributs optionnels
        
        Returns:
            Customer: Instance créée
        """
        session = self._get_session()
        try:
            repo = CustomerRepository(session)
            customer = repo.create(
                id=customer_id,
                name=name,
                tax_id=tax_id,
                status='A',
                **kwargs
            )
            session.commit()
            self._log_operation('create_customer', {'customer_id': customer_id})
            return customer
        except Exception as e:
            session.rollback()
            self._log_operation('create_customer_failed', {'customer_id': customer_id, 'error': str(e)})
            raise
        finally:
            session.close()


# ============================================================================
# ACCOUNT SERVICE
# ============================================================================

class AccountService(BaseService):
    """
    Service pour la gestion des comptes bancaires.
    
    Thread-safe: Utilise le verrouillage pessimiste (FOR UPDATE)
    pour les opérations de modification.
    """
    
    def get_account(self, account_number: str) -> Optional[Account]:
        """Récupère un compte par son numéro."""
        session = self._get_session()
        try:
            repo = AccountRepository(session)
            return repo.get_by_id(account_number)
        finally:
            session.close()
    
    def get_account_with_lock(self, account_number: str) -> Optional[Account]:
        """
        Récupère un compte avec verrouillage exclusif.
        
        Utile pour les opérations de transfert atomiques.
        
        Args:
            account_number: Numéro de compte
        
        Returns:
            Account: Instance verrouillée ou None
        """
        session = self._get_session()
        try:
            repo = AccountRepository(session)
            account = repo.get_account_with_lock(account_number)
            return account
        finally:
            session.close()
    
    def deposit(self, 
               account_number: str, 
               amount: Decimal,
               description: str = None) -> Tuple[bool, Optional[Transaction]]:
        """
        Effectue un dépôt sur un compte.
        
        Args:
            account_number: Numéro du compte destinataire
            amount: Montant du dépôt
            description: Description optionnelle
        
        Returns:
            Tuple[success, transaction]
        """
        if amount <= 0:
            raise ValueError("Le montant du dépôt doit être positif")
        
        session = self._get_session()
        try:
            account_repo = AccountRepository(session)
            transaction_repo = TransactionRepository(session)
            
            # Verrouillage pessimiste
            account = account_repo.get_account_with_lock(account_number)
            if not account:
                return False, None
            
            # Mise à jour du solde
            old_balance = account.balance or Decimal('0')
            account.balance = old_balance + amount
            account.last_activity = datetime.utcnow()
            
            # Création de la transaction
            transaction = transaction_repo.create(
                account_number=account_number,
                transaction_type='DEP',
                amount=amount,
                description=description or 'Dépôt',
                is_completed=True
            )
            
            session.commit()
            
            self._log_operation('deposit', {
                'account_number': account_number,
                'amount': str(amount),
                'old_balance': str(old_balance),
                'new_balance': str(account.balance)
            })
            
            return True, transaction
            
        except Exception as e:
            session.rollback()
            self._log_operation('deposit_failed', {
                'account_number': account_number,
                'amount': str(amount),
                'error': str(e)
            })
            raise
        finally:
            session.close()
    
    def withdraw(self,
                account_number: str,
                amount: Decimal,
                description: str = None) -> Tuple[bool, Optional[Transaction]]:
        """
        Effectue un retrait sur un compte.
        
        Vérifie le solde et la limite de découvert.
        """
        if amount <= 0:
            raise ValueError("Le montant du retrait doit être positif")
        
        session = self._get_session()
        try:
            account_repo = AccountRepository(session)
            transaction_repo = TransactionRepository(session)
            
            account = account_repo.get_account_with_lock(account_number)
            if not account:
                return False, None
            
            old_balance = account.balance or Decimal('0')
            new_balance = old_balance - amount
            
            # Vérification du solde et découvert
            overdraft = account.overdraft_limit or Decimal('0')
            if new_balance < -overdraft:
                transaction = transaction_repo.create(
                    account_number=account_number,
                    transaction_type='WTH',
                    amount=amount,
                    description=description or 'Retrait',
                    is_completed=False,
                    error_code='51',
                    error_message='Solde insuffisant'
                )
                session.commit()
                return False, transaction
            
            # Mise à jour du solde
            account.balance = new_balance
            account.last_activity = datetime.utcnow()
            
            transaction = transaction_repo.create(
                account_number=account_number,
                transaction_type='WTH',
                amount=amount,
                description=description or 'Retrait',
                is_completed=True
            )
            
            session.commit()
            
            self._log_operation('withdraw', {
                'account_number': account_number,
                'amount': str(amount),
                'old_balance': str(old_balance),
                'new_balance': str(new_balance)
            })
            
            return True, transaction
            
        except Exception as e:
            session.rollback()
            self._log_operation('withdraw_failed', {
                'account_number': account_number,
                'amount': str(amount),
                'error': str(e)
            })
            raise
        finally:
            session.close()
    
    def get_balance(self, account_number: str) -> Optional[Decimal]:
        """Récupère le solde d'un compte."""
        account = self.get_account(account_number)
        return account.balance if account else None


# ============================================================================
# TRANSFER SERVICE
# ============================================================================

class TransferService(BaseService):
    """
    Service pour les transferts entre comptes.
    
    Thread-safe et Atomique:
    - Verrouillage pessimiste des deux comptes
    - Rollback complet en cas d'erreur
    - Logging de chaque étape pour audit
    """
    
    def __init__(self):
        super().__init__()
        self.account_service = AccountService()
    
    def execute_transfer(self,
                        source_account: str,
                        target_account: str,
                        amount: Decimal,
                        description: str = None) -> TransferResult:
        """
        Exécute un transfert entre deux comptes.
        
        Opération atomique:
        1. Verrouiller le compte source
        2. Vérifier le solde
        3. Débiter le compte source
        4. Verrouiller le compte cible
        5. Créditer le compte cible
        6. Créer les transactions
        7. Commit ou Rollback
        
        Args:
            source_account: Compte source
            target_account: Compte cible
            amount: Montant du transfert
            description: Description optionnelle
        
        Returns:
            TransferResult: Résultat du transfert
        """
        if amount <= 0:
            return TransferResult(
                status=TransferStatus.FAILED,
                transaction_id=None,
                source_balance=Decimal('0'),
                target_balance=Decimal('0'),
                amount=amount,
                error_message="Le montant doit être positif"
            )
        
        if source_account == target_account:
            return TransferResult(
                status=TransferStatus.FAILED,
                transaction_id=None,
                source_balance=Decimal('0'),
                target_balance=Decimal('0'),
                amount=amount,
                error_message="Impossible de transférer vers le même compte"
            )
        
        session = self._get_session()
        try:
            account_repo = AccountRepository(session)
            transaction_repo = TransactionRepository(session)
            
            # Verrouillage pessimiste des deux comptes (ordre alphabétique pour éviter deadlock)
            accounts_locked = [source_account, target_account]
            accounts_locked.sort()
            
            locked_accounts = {}
            for acc_num in accounts_locked:
                account = account_repo.get_account_with_lock(acc_num)
                if account:
                    locked_accounts[acc_num] = account
                else:
                    return TransferResult(
                        status=TransferStatus.ACCOUNT_NOT_FOUND,
                        transaction_id=None,
                        source_balance=Decimal('0'),
                        target_balance=Decimal('0'),
                        amount=amount,
                        error_message=f"Compte {acc_num} non trouvé"
                    )
            
            source = locked_accounts[source_account]
            target = locked_accounts[target_account]
            
            # Vérification solde source
            source_balance = source.balance or Decimal('0')
            overdraft = source.overdraft_limit or Decimal('0')
            
            if source_balance - amount < -overdraft:
                transaction = transaction_repo.create(
                    account_number=source_account,
                    transaction_type='TRF',
                    amount=amount,
                    description=description or 'Transfert',
                    is_completed=False,
                    error_code='51',
                    error_message='Solde insuffisant'
                )
                session.commit()
                
                return TransferResult(
                    status=TransferStatus.INSUFFICIENT_FUNDS,
                    transaction_id=str(transaction.id),
                    source_balance=source_balance,
                    target_balance=target.balance or Decimal('0'),
                    amount=amount,
                    error_message="Solde insuffisant"
                )
            
            # Exécution du transfert
            source.balance = source_balance - amount
            target.balance = (target.balance or Decimal('0')) + amount
            
            source.last_activity = datetime.utcnow()
            target.last_activity = datetime.utcnow()
            
            # Transactions de débit et crédit
            debit_tx = transaction_repo.create(
                account_number=source_account,
                transaction_type='TRF',
                amount=-amount,
                description=f"Transfert vers {target_account}",
                reference_id=str(target.id) if target else None,
                is_completed=True
            )
            
            credit_tx = transaction_repo.create(
                account_number=target_account,
                transaction_type='TRF',
                amount=amount,
                description=f"Transfert depuis {source_account}",
                reference_id=str(source.id) if source else None,
                is_completed=True
            )
            
            session.commit()
            
            self._log_operation('transfer', {
                'source_account': source_account,
                'target_account': target_account,
                'amount': str(amount),
                'source_balance': str(source.balance),
                'target_balance': str(target.balance),
                'debit_tx_id': debit_tx.id,
                'credit_tx_id': credit_tx.id
            })
            
            return TransferResult(
                status=TransferStatus.COMPLETED,
                transaction_id=str(debit_tx.id),
                source_balance=source.balance,
                target_balance=target.balance,
                amount=amount
            )
            
        except Exception as e:
            session.rollback()
            self._log_operation('transfer_failed', {
                'source_account': source_account,
                'target_account': target_account,
                'amount': str(amount),
                'error': str(e)
            })
            
            return TransferResult(
                status=TransferStatus.FAILED,
                transaction_id=None,
                source_balance=Decimal('0'),
                target_balance=Decimal('0'),
                amount=amount,
                error_message=str(e)
            )
        finally:
            session.close()


# ============================================================================
 AUDIT SERVICE
# ============================================================================

class AuditService(BaseService):
    """
    Service d'audit pour la conformité bancaire.
    
    Logger toutes les opérations avec:
    - ID de requête unique
    - Timestamp précis
    - Données avant/après modification
    """
    
    def log_account_access(self, account_number: str, operation: str, user_id: str = None):
        """Log un accès à un compte."""
        self._log_operation('account_access', {
            'account_number': account_number,
            'operation': operation,
            'user_id': user_id
        })
    
    def log_balance_change(self, 
                          account_number: str, 
                          old_balance: Decimal,
                          new_balance: Decimal,
                          reason: str):
        """Log un changement de solde."""
        self._log_operation('balance_change', {
            'account_number': account_number,
            'old_balance': str(old_balance),
            'new_balance': str(new_balance),
            'difference': str(new_balance - old_balance),
            'reason': reason
        })
    
    def log_transfer(self,
                    source: str,
                    target: str,
                    amount: Decimal,
                    status: str):
        """Log un transfert."""
        self._log_operation('transfer', {
            'source_account': source,
            'target_account': target,
            'amount': str(amount),
            'status': status
        })


# ============================================================================
 FACTORY
# ============================================================================

def get_customer_service() -> CustomerService:
    """Factory pour CustomerService."""
    return CustomerService()


def get_account_service() -> AccountService:
    """Factory pour AccountService."""
    return AccountService()


def get_transfer_service() -> TransferService:
    """Factory pour TransferService."""
    return TransferService()


def get_audit_service() -> AuditService:
    """Factory pour AuditService."""
    return AuditService()


# ============================================================================
 EXPORTS
# ============================================================================

__all__ = [
    # Services
    'CustomerService',
    'AccountService',
    'TransferService',
    'AuditService',
    
    # Types
    'TransferStatus',
    'TransferResult',
    'CustomerProfile',
    
    # Factories
    'get_customer_service',
    'get_account_service',
    'get_transfer_service',
    'get_audit_service',
]
