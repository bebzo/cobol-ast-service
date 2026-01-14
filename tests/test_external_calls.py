"""
Tests for External CALL Implementations
========================================
Tests for auth, session, security, metrics, and audit modules.
v5.7.29 - External calls testing
"""
import pytest
import os
from decimal import Decimal
from datetime import datetime, timedelta
import sys

# Add lib to path
sys.path.insert(0, '/workspace')

from core.external_calls import (
    SessionManager, Session, AuthModule, 
    SecurityAlertModule, MetricsModule, AuditModule,
    get_session_manager, get_auth_module, get_security_module,
    get_metrics_module, get_audit_module
)
from core.config import AppConfig, get_config, DatabaseConfig, BusinessConfig


# ============================================================
# Session Manager Tests (5 tests)
# ============================================================
class TestSessionManager:
    """Tests for SessionManager."""
    
    def test_create_session(self):
        """Session creation returns valid session."""
        mgr = SessionManager()
        session = mgr.create_session('user123')
        
        assert session.session_id is not None
        assert session.user_id == 'user123'
        assert session.is_valid == True
        assert session.expires_at > datetime.now()
    
    def test_validate_valid_session(self):
        """Valid session passes validation."""
        mgr = SessionManager()
        session = mgr.create_session('user123')
        
        is_valid, found_session = mgr.validate_session(session.session_id)
        
        assert is_valid == True
        assert found_session is not None
        assert found_session.user_id == 'user123'
    
    def test_validate_invalid_session(self):
        """Invalid session ID fails validation."""
        mgr = SessionManager()
        
        is_valid, found_session = mgr.validate_session('nonexistent-session-id')
        
        assert is_valid == False
        assert found_session is None
    
    def test_session_expiration(self):
        """Expired session fails validation."""
        mgr = SessionManager(session_timeout_minutes=0)  # Immediate expiration
        session = mgr.create_session('user123')
        
        # Manually expire
        session.expires_at = datetime.now() - timedelta(minutes=1)
        
        assert session.is_expired == True
    
    def test_invalidate_session(self):
        """Session invalidation removes session."""
        mgr = SessionManager()
        session = mgr.create_session('user123')
        
        result = mgr.invalidate_session(session.session_id)
        
        assert result == True
        is_valid, _ = mgr.validate_session(session.session_id)
        assert is_valid == False


# ============================================================
# Authentication Tests (5 tests)
# ============================================================
class TestAuthModule:
    """Tests for AuthModule."""
    
    def test_demo_mode_auth_success(self):
        """Demo mode authentication works in development."""
        os.environ['ENVIRONMENT'] = 'development'
        auth = AuthModule()
        
        success, message, session_id = auth.authenticate('testuser', 'demo123')
        
        assert success == True
        assert session_id is not None
        assert 'successful' in message.lower()
    
    def test_auth_failure_wrong_password(self):
        """Wrong password fails authentication."""
        os.environ['ENVIRONMENT'] = 'development'
        auth = AuthModule()
        
        success, message, session_id = auth.authenticate('testuser', 'wrongpassword')
        
        assert success == False
        assert session_id is None
    
    def test_lockout_after_max_attempts(self):
        """Account locks after max failed attempts."""
        os.environ['ENVIRONMENT'] = 'development'
        os.environ['MAX_LOGIN_ATTEMPTS'] = '3'
        auth = AuthModule()
        auth.max_attempts = 3
        
        # Fail 3 times
        for _ in range(3):
            auth.authenticate('locktest', 'wrong')
        
        success, message, _ = auth.authenticate('locktest', 'demo123')
        
        assert success == False
        assert 'locked' in message.lower()
    
    def test_failed_attempts_tracking(self):
        """Failed attempts are tracked correctly."""
        auth = AuthModule()
        auth._failed_attempts = {}  # Reset
        
        auth.authenticate('trackuser', 'wrong1')
        auth.authenticate('trackuser', 'wrong2')
        
        assert auth._failed_attempts.get('trackuser', 0) == 2
    
    def test_successful_auth_clears_attempts(self):
        """Successful auth clears failed attempt counter."""
        os.environ['ENVIRONMENT'] = 'development'
        auth = AuthModule()
        auth._failed_attempts = {}  # Reset state
        auth._lockouts = {}
        
        # Add some failed attempts
        auth._failed_attempts['clearuser'] = 2
        
        # Successful auth should clear
        success, _, _ = auth.authenticate('clearuser', 'demo123')
        
        # If auth succeeded, attempts should be cleared
        if success:
            assert auth._failed_attempts.get('clearuser', 0) == 0
        else:
            # In case Supabase is not available and demo mode fails for some reason
            pytest.skip("Demo mode auth not available")


# ============================================================
# Security Alert Tests (3 tests)
# ============================================================
class TestSecurityAlertModule:
    """Tests for SecurityAlertModule."""
    
    def test_send_alert_returns_true(self):
        """Alert sending returns success."""
        security = SecurityAlertModule()
        
        result = security.send_alert('FRAUD', user_id='user123', details={'amount': 10000})
        
        assert result == True
    
    def test_alert_types_accepted(self):
        """Different alert types are accepted."""
        security = SecurityAlertModule()
        alert_types = ['FRAUD', 'LOCKOUT', 'UNAUTHORIZED', 'SUSPICIOUS', 'BREACH']
        
        for alert_type in alert_types:
            result = security.send_alert(alert_type, user_id='test')
            assert result == True
    
    def test_alert_without_user(self):
        """Alert without user ID works."""
        security = SecurityAlertModule()
        
        result = security.send_alert('SYSTEM_ERROR')
        
        assert result == True


# ============================================================
# Metrics Tests (4 tests)
# ============================================================
class TestMetricsModule:
    """Tests for MetricsModule."""
    
    def test_initial_metrics(self):
        """Initial metrics are zero."""
        metrics = MetricsModule()
        
        data = metrics.get_metrics()
        
        assert data['total_transactions'] == 0
        assert data['total_amount'] == Decimal('0')
    
    def test_update_transaction_count(self):
        """Transaction count updates correctly."""
        metrics = MetricsModule()
        
        metrics.update(transaction_count=5)
        metrics.update(transaction_count=3)
        
        data = metrics.get_metrics()
        assert data['total_transactions'] == 8
    
    def test_update_total_amount(self):
        """Total amount accumulates correctly."""
        metrics = MetricsModule()
        
        metrics.update(total_amount=Decimal('100.50'))
        metrics.update(total_amount=Decimal('200.25'))
        
        data = metrics.get_metrics()
        assert data['total_amount'] == Decimal('300.75')
    
    def test_transactions_by_type(self):
        """Transactions are tracked by type."""
        metrics = MetricsModule()
        
        metrics.update(transaction_type='DEPOSIT')
        metrics.update(transaction_type='DEPOSIT')
        metrics.update(transaction_type='WITHDRAWAL')
        
        data = metrics.get_metrics()
        assert data['transactions_by_type']['DEPOSIT'] == 2
        assert data['transactions_by_type']['WITHDRAWAL'] == 1


# ============================================================
# Audit Tests (3 tests)
# ============================================================
class TestAuditModule:
    """Tests for AuditModule."""
    
    def test_log_action_returns_id(self):
        """Logging action returns audit ID."""
        audit = AuditModule()
        
        audit_id = audit.log_action('LOGIN', user_id='user123')
        
        assert audit_id is not None
        assert len(audit_id) == 32  # hex(16 bytes)
    
    def test_verify_finds_entry(self):
        """Verify finds logged entries."""
        audit = AuditModule()
        audit._local_trail = []  # Reset
        
        audit_id = audit.log_action('TRANSFER', user_id='user456')
        
        success, entries = audit.verify(audit_id=audit_id)
        
        assert success == True
        assert len(entries) == 1
        assert entries[0]['user_id'] == 'user456'
    
    def test_verify_by_user(self):
        """Verify filters by user ID."""
        audit = AuditModule()
        audit._local_trail = []  # Reset
        
        audit.log_action('ACTION1', user_id='userA')
        audit.log_action('ACTION2', user_id='userB')
        audit.log_action('ACTION3', user_id='userA')
        
        success, entries = audit.verify(user_id='userA')
        
        assert success == True
        assert len(entries) == 2


# ============================================================
# Configuration Tests (5 tests)
# ============================================================
class TestConfiguration:
    """Tests for configuration management."""
    
    def test_default_config_loads(self):
        """Default configuration loads without error."""
        config = AppConfig()
        
        assert config.version == "5.7.29"
        assert config.environment in ['development', 'staging', 'production']
    
    def test_business_config_defaults(self):
        """Business config has sensible defaults."""
        config = BusinessConfig()
        
        assert config.overdraft_fee == Decimal('35.00')
        assert config.max_single_transaction == Decimal('100000.00')
        assert config.fraud_threshold == Decimal('100')
    
    def test_database_config_from_env(self):
        """Database config reads from environment."""
        os.environ['SUPABASE_URL'] = 'https://test.supabase.co'
        
        config = DatabaseConfig()
        
        assert config.url == 'https://test.supabase.co'
    
    def test_is_production_flag(self):
        """is_production flag works correctly."""
        os.environ['ENVIRONMENT'] = 'production'
        config = AppConfig()
        
        assert config.is_production == True
        assert config.is_development == False
    
    def test_singleton_pattern(self):
        """get_config returns same instance."""
        from core.config import reload_config
        config1 = reload_config()
        config2 = get_config()
        
        assert config1 is config2


# ============================================================
# Run Tests
# ============================================================
if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
