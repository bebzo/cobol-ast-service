"""
Constants Module for COBOL-to-Python Transpiler
================================================
Replaces magic strings and numbers with named constants.
v5.7.29 - Magic string elimination
"""
from enum import Enum, auto
from decimal import Decimal


# ============================================================
# Status Codes
# ============================================================
class FileStatus(Enum):
    """COBOL file status codes."""
    SUCCESS = "00"
    END_OF_FILE = "10"
    KEY_NOT_FOUND = "23"
    DUPLICATE_KEY = "22"
    RECORD_LOCKED = "68"
    FILE_NOT_OPEN = "41"
    FILE_NOT_FOUND = "35"
    PERMISSION_DENIED = "37"
    DISK_FULL = "34"
    IO_ERROR = "30"


class TransactionStatus(Enum):
    """Transaction processing status codes."""
    PENDING = "P"
    COMPLETED = "C"
    FAILED = "F"
    CANCELLED = "X"
    REVERSED = "R"


class AccountStatus(Enum):
    """Account status codes."""
    ACTIVE = "A"
    INACTIVE = "I"
    CLOSED = "C"
    FROZEN = "F"
    PENDING = "P"
    SUSPENDED = "S"
    DELETED = "D"


class ValidationFlag(Enum):
    """Validation flag values (COBOL Y/N style)."""
    YES = "Y"
    NO = "N"
    UNKNOWN = " "


# ============================================================
# Error Codes (from COBOL MOVE statements)
# ============================================================
class ErrorCode:
    """Standardized error codes matching COBOL LS-RETURN-CODE values."""
    SUCCESS = Decimal("0")
    
    # File errors (9001-9010)
    FILE_OPEN_FAILED = Decimal("9001")
    FILE_READ_ERROR = Decimal("9002")
    ACCOUNT_NOT_FOUND = Decimal("9003")
    CUSTOMER_NOT_FOUND = Decimal("9003")
    RECORD_NOT_FOUND = Decimal("9004")
    UPDATE_FAILED = Decimal("9005")
    WITHDRAWAL_ACCOUNT_NOT_FOUND = Decimal("9006")
    TRANSFER_SOURCE_NOT_FOUND = Decimal("9007")
    TRANSFER_TARGET_NOT_FOUND = Decimal("9008")
    FILE_WRITE_ERROR = Decimal("9009")
    FILE_CLOSE_ERROR = Decimal("9010")
    
    # Validation errors (9011-9020)
    INVALID_AMOUNT = Decimal("9011")
    EXCEEDS_LIMIT = Decimal("9012")
    INSUFFICIENT_FUNDS = Decimal("9013")
    DAILY_LIMIT_EXCEEDED = Decimal("9014")
    FRAUD_SUSPECTED = Decimal("9015")
    SAME_ACCOUNT_TRANSFER = Decimal("9016")
    INVALID_ACCOUNT_STATUS = Decimal("9017")
    ACCOUNT_LOCKED = Decimal("9018")
    INVALID_TRANSACTION_TYPE = Decimal("9019")
    VALIDATION_FAILED = Decimal("9020")
    
    # Security errors (9021-9030)
    AUTHENTICATION_FAILED = Decimal("9021")
    SESSION_EXPIRED = Decimal("9022")
    UNAUTHORIZED_ACCESS = Decimal("9023")
    SECURITY_VIOLATION = Decimal("9024")
    TOO_MANY_ATTEMPTS = Decimal("9025")
    ACCOUNT_LOCKOUT = Decimal("9026")
    INVALID_CREDENTIALS = Decimal("9027")
    SESSION_NOT_FOUND = Decimal("9028")
    TOKEN_EXPIRED = Decimal("9029")
    PERMISSION_DENIED = Decimal("9030")
    
    # System errors (9099)
    SYSTEM_ERROR = Decimal("9099")
    UNKNOWN_ERROR = Decimal("9999")
    
    @classmethod
    def get_message(cls, code: Decimal) -> str:
        """Get human-readable message for error code."""
        messages = {
            cls.SUCCESS: "Success",
            cls.FILE_OPEN_FAILED: "File open failed",
            cls.FILE_READ_ERROR: "File read error",
            cls.ACCOUNT_NOT_FOUND: "Account not found",
            cls.RECORD_NOT_FOUND: "Record not found",
            cls.UPDATE_FAILED: "Update failed",
            cls.INVALID_AMOUNT: "Invalid amount",
            cls.EXCEEDS_LIMIT: "Amount exceeds limit",
            cls.INSUFFICIENT_FUNDS: "Insufficient funds",
            cls.DAILY_LIMIT_EXCEEDED: "Daily limit exceeded",
            cls.FRAUD_SUSPECTED: "Fraud suspected",
            cls.SAME_ACCOUNT_TRANSFER: "Cannot transfer to same account",
            cls.AUTHENTICATION_FAILED: "Authentication failed",
            cls.SESSION_EXPIRED: "Session expired",
            cls.UNAUTHORIZED_ACCESS: "Unauthorized access",
            cls.SYSTEM_ERROR: "System error",
            cls.UNKNOWN_ERROR: "Unknown error",
        }
        return messages.get(code, f"Error {code}")


# ============================================================
# Error Messages (COBOL string literals)
# ============================================================
class ErrorMessage:
    """Standardized error messages matching COBOL MOVE statements."""
    SUCCESS = "SUCCESS"
    
    # Validation messages
    INVALID_AMOUNT = "INVALID AMOUNT"
    EXCEEDS_LIMIT = "EXCEEDS LIMIT"
    INSUFFICIENT_FUNDS = "INSUFFICIENT FUNDS"
    DAILY_LIMIT_EXCEEDED = "DAILY LIMIT EXCEEDED"
    DAILY_TOTAL_EXCEEDED = "DAILY TOTAL EXCEEDED"
    FRAUD_SUSPECTED = "FRAUD SUSPECTED"
    SAME_ACCOUNT = "SAME ACCOUNT"
    
    # File messages
    FILE_OPEN_FAILED = "FILE OPEN FAILED"
    READ_ERROR = "READ ERROR"
    UPDATE_FAILED = "UPDATE FAILED"
    RECORD_NOT_FOUND = "RECORD NOT FOUND"
    
    # Auth messages
    AUTH_FAILED = "AUTHENTICATION FAILED"
    SESSION_EXPIRED = "SESSION EXPIRED"
    ACCOUNT_LOCKED = "ACCOUNT LOCKED"


# ============================================================
# Transaction Types
# ============================================================
class TransactionType:
    """Transaction type codes."""
    DEPOSIT = "DEP"
    WITHDRAWAL = "WDR"
    TRANSFER = "TRF"
    PAYMENT = "PMT"
    FEE = "FEE"
    INTEREST = "INT"
    ADJUSTMENT = "ADJ"
    REVERSAL = "REV"


# ============================================================
# Account Types
# ============================================================
class AccountType:
    """Account type codes."""
    CHECKING = "CHK"
    SAVINGS = "SAV"
    MONEY_MARKET = "MMA"
    CD = "CD"
    LOAN = "LON"
    MORTGAGE = "MTG"
    CREDIT_LINE = "LOC"


# ============================================================
# Security Levels
# ============================================================
class SecurityLevel:
    """Security access levels."""
    PUBLIC = 0
    USER = 1
    TELLER = 2
    SUPERVISOR = 3
    MANAGER = 4
    ADMIN = 5
    SYSTEM = 9


# ============================================================
# Numeric Constants
# ============================================================
class Limits:
    """Business rule limits."""
    MAX_ACCOUNT_NUMBER_LENGTH = 10
    MAX_CUSTOMER_NAME_LENGTH = 50
    MAX_ERROR_MESSAGE_LENGTH = 100
    MAX_SESSION_ID_LENGTH = 64
    
    MIN_TRANSACTION_AMOUNT = Decimal("0.01")
    MAX_DECIMAL_PLACES = 2
    
    DAYS_IN_YEAR = 365
    MONTHS_IN_YEAR = 12


# ============================================================
# File Names (logical names used in COBOL SELECT)
# ============================================================
class LogicalFileName:
    """Logical file names from COBOL SELECT statements."""
    CUSTOMER_MASTER = "customer_master_file"
    TRANSACTION_LOG = "transaction_log_file"
    AUDIT_TRAIL = "audit_trail_file"
    TEMP_WORK = "temporary_work_file"
    REPORT_OUTPUT = "report_output_file"
    ERROR_LOG = "error_log_file"
