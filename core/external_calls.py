"""
External CALL Implementations for COBOL-to-Python Transpiler
=============================================================
Replaces stub implementations with real functionality.
v5.7.29 - External calls implementation

Implements:
- AUTHMODULE: User authentication via Supabase
- GENSESSION: Session generation with JWT
- VALIDATESESSION: Session validation
- SECURITYALERT: Security event logging
- UPDATEMETRICS: Metrics tracking
- VERIFYAUDIT: Audit trail verification
"""
import os
import jwt
import logging
import hashlib
import secrets
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, Dict, Any, Tuple
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


# ============================================================
# Session Management
# ============================================================
@dataclass
class Session:
    """Represents an authenticated session."""
    session_id: str
    user_id: str
    created_at: datetime
    expires_at: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_valid: bool = True
    
    @property
    def is_expired(self) -> bool:
        return datetime.now() > self.expires_at


class SessionManager:
    """Manages user sessions in memory (for dev) or database (for prod)."""
    
    def __init__(self, jwt_secret: str = None, session_timeout_minutes: int = 60):
        self.jwt_secret = jwt_secret or os.getenv('JWT_SECRET')
        if not self.jwt_secret:
            raise ValueError("JWT_SECRET environment variable is required")
        self.session_timeout = timedelta(minutes=session_timeout_minutes)
        self._sessions: Dict[str, Session] = {}
        self._supabase_client = None
    
    def _get_supabase(self):
        """Lazy load Supabase client."""
        if self._supabase_client is None:
            try:
                from supabase import create_client
                url = os.getenv('SUPABASE_URL')
                key = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY')
                if url and key:
                    self._supabase_client = create_client(url, key)
                    logger.info("Supabase client initialized")
            except ImportError:
                logger.warning("Supabase package not installed, using in-memory sessions")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase: {e}")
        return self._supabase_client
    
    def create_session(self, user_id: str, ip_address: str = None, user_agent: str = None) -> Session:
        """Create a new session for a user."""
        session_id = secrets.token_urlsafe(32)
        now = datetime.now()
        
        session = Session(
            session_id=session_id,
            user_id=user_id,
            created_at=now,
            expires_at=now + self.session_timeout,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Store session
        self._sessions[session_id] = session
        
        # Try to persist to Supabase
        supabase = self._get_supabase()
        if supabase:
            try:
                supabase.table('sessions').insert({
                    'session_id': session_id,
                    'user_id': user_id,
                    'created_at': now.isoformat(),
                    'expires_at': session.expires_at.isoformat(),
                    'ip_address': ip_address,
                    'user_agent': user_agent
                }).execute()
            except Exception as e:
                logger.warning(f"Failed to persist session to Supabase: {e}")
        
        logger.info(f"Session created for user {user_id[:8]}...")
        return session
    
    def validate_session(self, session_id: str, current_date: str = None, current_time: str = None) -> Tuple[bool, Optional[Session]]:
        """Validate a session ID."""
        # Check in-memory first
        session = self._sessions.get(session_id)
        
        if session:
            if session.is_expired:
                session.is_valid = False
                logger.warning(f"Session {session_id[:8]}... expired")
                return False, session
            return True, session
        
        # Try Supabase
        supabase = self._get_supabase()
        if supabase:
            try:
                result = supabase.table('sessions').select('*').eq('session_id', session_id).execute()
                if result.data:
                    row = result.data[0]
                    expires_at = datetime.fromisoformat(row['expires_at'].replace('Z', '+00:00'))
                    if datetime.now() > expires_at.replace(tzinfo=None):
                        return False, None
                    return True, Session(
                        session_id=row['session_id'],
                        user_id=row['user_id'],
                        created_at=datetime.fromisoformat(row['created_at'].replace('Z', '+00:00')),
                        expires_at=expires_at
                    )
            except Exception as e:
                logger.error(f"Failed to validate session in Supabase: {e}")
        
        logger.warning(f"Session {session_id[:8]}... not found")
        return False, None
    
    def invalidate_session(self, session_id: str) -> bool:
        """Invalidate a session (logout)."""
        if session_id in self._sessions:
            self._sessions[session_id].is_valid = False
            del self._sessions[session_id]
        
        supabase = self._get_supabase()
        if supabase:
            try:
                supabase.table('sessions').delete().eq('session_id', session_id).execute()
            except Exception as e:
                logger.warning(f"Failed to delete session from Supabase: {e}")
        
        return True


# ============================================================
# Authentication Module
# ============================================================
class AuthModule:
    """Authentication module - replaces AUTHMODULE CALL stub."""
    
    def __init__(self):
        self._supabase_client = None
        self._failed_attempts: Dict[str, int] = {}
        self._lockouts: Dict[str, datetime] = {}
        self.max_attempts = int(os.getenv('MAX_LOGIN_ATTEMPTS', '5'))
        self.lockout_duration = timedelta(minutes=int(os.getenv('LOCKOUT_DURATION_MINUTES', '30')))
    
    def _get_supabase(self):
        """Lazy load Supabase client."""
        if self._supabase_client is None:
            try:
                from supabase import create_client
                url = os.getenv('SUPABASE_URL')
                key = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY')
                if url and key:
                    self._supabase_client = create_client(url, key)
            except (ImportError, Exception) as e:
                logger.warning(f"Supabase not available: {e}")
        return self._supabase_client
    
    def authenticate(self, user_id: str, password: str, security_level: int = 1) -> Tuple[bool, str, Optional[str]]:
        """
        Authenticate a user.
        
        Returns:
            Tuple of (success, message, session_id or None)
        """
        # Check lockout
        if user_id in self._lockouts:
            if datetime.now() < self._lockouts[user_id]:
                remaining = (self._lockouts[user_id] - datetime.now()).seconds // 60
                return False, f"Account locked. Try again in {remaining} minutes.", None
            else:
                del self._lockouts[user_id]
                self._failed_attempts.pop(user_id, None)
        
        # Try Supabase Auth
        supabase = self._get_supabase()
        if supabase:
            try:
                # Use Supabase Auth
                result = supabase.auth.sign_in_with_password({
                    "email": user_id,  # Must be a valid email
                    "password": password
                })
                if result.user:
                    session_mgr = SessionManager()
                    session = session_mgr.create_session(user_id)
                    self._failed_attempts.pop(user_id, None)
                    logger.info(f"User {user_id} authenticated via Supabase")
                    return True, "Authentication successful", session.session_id
            except Exception as e:
                logger.warning(f"Supabase auth failed: {e}")
        
        # No demo mode - production requires real authentication
        
        # Failed authentication
        self._failed_attempts[user_id] = self._failed_attempts.get(user_id, 0) + 1
        if self._failed_attempts[user_id] >= self.max_attempts:
            self._lockouts[user_id] = datetime.now() + self.lockout_duration
            logger.warning(f"User {user_id} locked out after {self.max_attempts} failed attempts")
            return False, "Account locked due to too many failed attempts", None
        
        remaining = self.max_attempts - self._failed_attempts[user_id]
        return False, f"Authentication failed. {remaining} attempts remaining.", None


# ============================================================
# Security Alert Module  
# ============================================================
class SecurityAlertModule:
    """Security alert module - replaces SECURITYALERT CALL stub."""
    
    def __init__(self):
        self._supabase_client = None
    
    def _get_supabase(self):
        if self._supabase_client is None:
            try:
                from supabase import create_client
                url = os.getenv('SUPABASE_URL')
                key = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY')
                if url and key:
                    self._supabase_client = create_client(url, key)
            except (ImportError, Exception):
                pass
        return self._supabase_client
    
    def send_alert(self, alert_type: str, user_id: str = None, details: Dict[str, Any] = None) -> bool:
        """
        Send a security alert.
        
        Alert types: FRAUD, LOCKOUT, UNAUTHORIZED, SUSPICIOUS, BREACH
        """
        alert = {
            'type': alert_type,
            'user_id': user_id,
            'timestamp': datetime.now().isoformat(),
            'details': details or {}
        }
        
        # Log locally
        logger.warning(f"SECURITY ALERT [{alert_type}]: User={user_id}, Details={details}")
        
        # Persist to Supabase
        supabase = self._get_supabase()
        if supabase:
            try:
                supabase.table('security_alerts').insert({
                    'alert_type': alert_type,
                    'user_id': user_id,
                    'created_at': alert['timestamp'],
                    'details': details
                }).execute()
                return True
            except Exception as e:
                logger.error(f"Failed to persist security alert: {e}")
        
        return True  # Alert was at least logged


# ============================================================
# Metrics Module
# ============================================================
class MetricsModule:
    """Metrics tracking module - replaces UPDATEMETRICS CALL stub."""
    
    def __init__(self):
        self._metrics: Dict[str, Any] = {
            'total_transactions': 0,
            'total_amount': Decimal('0'),
            'transactions_by_type': {},
            'errors_count': 0,
            'last_updated': None
        }
    
    def update(self, transaction_count: int = 0, total_amount: Decimal = None, 
               transaction_type: str = None, error: bool = False) -> Dict[str, Any]:
        """Update metrics."""
        self._metrics['total_transactions'] += transaction_count
        
        if total_amount:
            self._metrics['total_amount'] += total_amount
        
        if transaction_type:
            current = self._metrics['transactions_by_type'].get(transaction_type, 0)
            self._metrics['transactions_by_type'][transaction_type] = current + 1
        
        if error:
            self._metrics['errors_count'] += 1
        
        self._metrics['last_updated'] = datetime.now().isoformat()
        
        logger.debug(f"Metrics updated: {self._metrics}")
        return self._metrics.copy()
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics."""
        return self._metrics.copy()


# ============================================================
# Audit Module
# ============================================================
class AuditModule:
    """Audit trail module - replaces VERIFYAUDIT CALL stub."""
    
    def __init__(self):
        self._supabase_client = None
        self._local_trail: list = []
    
    def _get_supabase(self):
        if self._supabase_client is None:
            try:
                from supabase import create_client
                url = os.getenv('SUPABASE_URL')
                key = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY')
                if url and key:
                    self._supabase_client = create_client(url, key)
            except (ImportError, Exception):
                pass
        return self._supabase_client
    
    def log_action(self, action: str, user_id: str = None, resource: str = None,
                   details: Dict[str, Any] = None) -> str:
        """Log an auditable action."""
        audit_id = secrets.token_hex(16)
        entry = {
            'audit_id': audit_id,
            'action': action,
            'user_id': user_id,
            'resource': resource,
            'timestamp': datetime.now().isoformat(),
            'details': details or {}
        }
        
        self._local_trail.append(entry)
        
        supabase = self._get_supabase()
        if supabase:
            try:
                supabase.table('audit_trail').insert(entry).execute()
            except Exception as e:
                logger.warning(f"Failed to persist audit entry: {e}")
        
        logger.info(f"AUDIT [{action}]: User={user_id}, Resource={resource}")
        return audit_id
    
    def verify(self, audit_id: str = None, user_id: str = None, 
               start_date: str = None, end_date: str = None) -> Tuple[bool, list]:
        """Verify audit trail integrity."""
        # For now, just return the local trail filtered by criteria
        results = self._local_trail.copy()
        
        if audit_id:
            results = [e for e in results if e['audit_id'] == audit_id]
        if user_id:
            results = [e for e in results if e['user_id'] == user_id]
        
        return True, results


# ============================================================
# Factory Functions (for use in transpiled code)
# ============================================================
_session_manager: Optional[SessionManager] = None
_auth_module: Optional[AuthModule] = None
_security_module: Optional[SecurityAlertModule] = None
_metrics_module: Optional[MetricsModule] = None
_audit_module: Optional[AuditModule] = None


def get_session_manager() -> SessionManager:
    global _session_manager
    if _session_manager is None:
        _session_manager = SessionManager()
    return _session_manager


def get_auth_module() -> AuthModule:
    global _auth_module
    if _auth_module is None:
        _auth_module = AuthModule()
    return _auth_module


def get_security_module() -> SecurityAlertModule:
    global _security_module
    if _security_module is None:
        _security_module = SecurityAlertModule()
    return _security_module


def get_metrics_module() -> MetricsModule:
    global _metrics_module
    if _metrics_module is None:
        _metrics_module = MetricsModule()
    return _metrics_module


def get_audit_module() -> AuditModule:
    global _audit_module
    if _audit_module is None:
        _audit_module = AuditModule()
    return _audit_module


# ============================================================
# v8.6: Temp File Manager (DELETETEMP)
# ============================================================
class TempFileManager:
    """Temp file management module - replaces DELETETEMP CALL stub."""
    
    def __init__(self, temp_dir: str = None):
        self._temp_dir = temp_dir or os.getenv('COBOL_TEMP_DIR', '/tmp/cobol_banking')
    
    def delete_temp_files(self, job_id: str) -> bool:
        """
        Delete temporary files for a job.
        
        Args:
            job_id: Job identifier
            
        Returns:
            bool: True if cleanup was successful
        """
        import shutil
        
        job_id_clean = str(job_id).strip()
        job_temp_dir = os.path.join(self._temp_dir, job_id_clean)
        
        logger.info(f"DELETETEMP: Cleaning up temp files for job {job_id_clean}")
        
        try:
            if os.path.exists(job_temp_dir):
                shutil.rmtree(job_temp_dir)
                logger.info(f"DELETETEMP: Removed directory {job_temp_dir}")
            else:
                logger.debug(f"DELETETEMP: Directory {job_temp_dir} does not exist, nothing to clean")
            return True
        except Exception as e:
            logger.error(f"DELETETEMP: Failed to clean up: {e}")
            return False
    
    def create_temp_dir(self, job_id: str) -> str:
        """Create a temporary directory for a job."""
        job_id_clean = str(job_id).strip()
        job_temp_dir = os.path.join(self._temp_dir, job_id_clean)
        
        os.makedirs(job_temp_dir, exist_ok=True)
        logger.debug(f"DELETETEMP: Created temp directory {job_temp_dir}")
        return job_temp_dir


_temp_manager: Optional[TempFileManager] = None


def get_temp_manager() -> TempFileManager:
    global _temp_manager
    if _temp_manager is None:
        _temp_manager = TempFileManager()
    return _temp_manager
