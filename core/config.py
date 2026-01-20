"""
Configuration Management for COBOL-to-Python Transpiler
========================================================
Externalizes all hardcoded settings into environment variables.
v5.7.29 - Configuration externalization
"""
import os
from decimal import Decimal
from dataclasses import dataclass, field
from typing import Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class DatabaseConfig:
    """Database connection settings (Supabase)."""
    url: str = field(default_factory=lambda: os.getenv('SUPABASE_URL', ''))
    service_key: str = field(default_factory=lambda: os.getenv('SUPABASE_SERVICE_KEY', ''))
    anon_key: str = field(default_factory=lambda: os.getenv('SUPABASE_ANON_KEY', ''))
    
    @property
    def is_configured(self) -> bool:
        return bool(self.url and (self.service_key or self.anon_key))


@dataclass
class AuthConfig:
    """Authentication settings."""
    jwt_secret: str = field(default_factory=lambda: os.getenv('JWT_SECRET', ''))  # Required in production
    session_timeout_minutes: int = field(default_factory=lambda: int(os.getenv('SESSION_TIMEOUT_MINUTES', '60')))
    max_login_attempts: int = field(default_factory=lambda: int(os.getenv('MAX_LOGIN_ATTEMPTS', '5')))
    lockout_duration_minutes: int = field(default_factory=lambda: int(os.getenv('LOCKOUT_DURATION_MINUTES', '30')))


@dataclass
class FileConfig:
    """File management settings."""
    customer_master_path: str = field(default_factory=lambda: os.getenv('CUSTOMER_MASTER_PATH', './data/customer_master.dat'))
    transaction_log_path: str = field(default_factory=lambda: os.getenv('TRANSACTION_LOG_PATH', './data/transactions.log'))
    audit_trail_path: str = field(default_factory=lambda: os.getenv('AUDIT_TRAIL_PATH', './data/audit_trail.dat'))
    temp_work_path: str = field(default_factory=lambda: os.getenv('TEMP_WORK_PATH', './data/temp_work.dat'))


@dataclass
class BusinessConfig:
    """Business rules and rates."""
    # Interest rates
    savings_rate: Decimal = field(default_factory=lambda: Decimal(os.getenv('SAVINGS_RATE', '0.0225')))
    checking_rate: Decimal = field(default_factory=lambda: Decimal(os.getenv('CHECKING_RATE', '0.001')))
    mm_rate: Decimal = field(default_factory=lambda: Decimal(os.getenv('MM_RATE', '0.035')))
    cd_rate_1yr: Decimal = field(default_factory=lambda: Decimal(os.getenv('CD_RATE_1YR', '0.045')))
    cd_rate_2yr: Decimal = field(default_factory=lambda: Decimal(os.getenv('CD_RATE_2YR', '0.050')))
    cd_rate_5yr: Decimal = field(default_factory=lambda: Decimal(os.getenv('CD_RATE_5YR', '0.055')))
    
    # Loan rates
    mortgage_rate_30: Decimal = field(default_factory=lambda: Decimal(os.getenv('MORTGAGE_RATE_30', '0.0675')))
    mortgage_rate_15: Decimal = field(default_factory=lambda: Decimal(os.getenv('MORTGAGE_RATE_15', '0.0625')))
    auto_loan_rate: Decimal = field(default_factory=lambda: Decimal(os.getenv('AUTO_LOAN_RATE', '0.0725')))
    personal_loan_rate: Decimal = field(default_factory=lambda: Decimal(os.getenv('PERSONAL_LOAN_RATE', '0.1199')))
    
    # Fees
    overdraft_fee: Decimal = field(default_factory=lambda: Decimal(os.getenv('OVERDRAFT_FEE', '35.00')))
    nsf_fee: Decimal = field(default_factory=lambda: Decimal(os.getenv('NSF_FEE', '35.00')))
    wire_fee_domestic: Decimal = field(default_factory=lambda: Decimal(os.getenv('WIRE_FEE_DOMESTIC', '25.00')))
    wire_fee_intl: Decimal = field(default_factory=lambda: Decimal(os.getenv('WIRE_FEE_INTL', '45.00')))
    late_payment_fee: Decimal = field(default_factory=lambda: Decimal(os.getenv('LATE_PAYMENT_FEE', '39.00')))
    
    # Limits
    max_single_transaction: Decimal = field(default_factory=lambda: Decimal(os.getenv('MAX_SINGLE_TRANSACTION', '100000.00')))
    daily_withdrawal_limit: Decimal = field(default_factory=lambda: Decimal(os.getenv('DAILY_WITHDRAWAL_LIMIT', '10000.00')))
    daily_transfer_limit: Decimal = field(default_factory=lambda: Decimal(os.getenv('DAILY_TRANSFER_LIMIT', '50000.00')))
    
    # Fraud detection
    fraud_threshold: Decimal = field(default_factory=lambda: Decimal(os.getenv('FRAUD_THRESHOLD', '100')))
    
    # Tax
    default_tax_rate: Decimal = field(default_factory=lambda: Decimal(os.getenv('DEFAULT_TAX_RATE', '0.20')))


@dataclass  
class SecurityConfig:
    """Security settings."""
    allow_stubs: bool = field(default_factory=lambda: os.getenv('ALLOW_STUBS', 'false').lower() == 'true')
    require_auth: bool = field(default_factory=lambda: os.getenv('REQUIRE_AUTH', 'true').lower() == 'true')
    log_level: str = field(default_factory=lambda: os.getenv('LOG_LEVEL', 'INFO'))
    encrypt_sensitive_data: bool = field(default_factory=lambda: os.getenv('ENCRYPT_SENSITIVE_DATA', 'true').lower() == 'true')


@dataclass
class AppConfig:
    """Main application configuration."""
    environment: str = field(default_factory=lambda: os.getenv('ENVIRONMENT', 'development'))
    debug: bool = field(default_factory=lambda: os.getenv('DEBUG', 'false').lower() == 'true')
    version: str = "5.7.31"
    
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    auth: AuthConfig = field(default_factory=AuthConfig)
    files: FileConfig = field(default_factory=FileConfig)
    business: BusinessConfig = field(default_factory=BusinessConfig)
    security: SecurityConfig = field(default_factory=SecurityConfig)
    
    def __post_init__(self):
        """Validate configuration after initialization."""
        if self.environment == 'production':
            if not self.database.is_configured:
                logger.warning("Production environment without database configuration!")
            if self.security.allow_stubs:
                logger.error("SECURITY: allow_stubs=true in production is dangerous!")
            if not self.auth.jwt_secret:
                raise ValueError("JWT_SECRET is required in production environment")
    
    @property
    def is_production(self) -> bool:
        return self.environment == 'production'
    
    @property
    def is_development(self) -> bool:
        return self.environment == 'development'


# Singleton instance
_config: Optional[AppConfig] = None


def get_config() -> AppConfig:
    """Get the application configuration (singleton)."""
    global _config
    if _config is None:
        _config = AppConfig()
    return _config


def reload_config() -> AppConfig:
    """Force reload of configuration from environment."""
    global _config
    _config = AppConfig()
    return _config
