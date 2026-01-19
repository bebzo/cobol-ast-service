"""
Utility Functions for COBOL-to-Python Transpiler
=================================================
Refactored helper functions extracted from long methods.
v5.7.29 - Method refactoring
"""
from decimal import Decimal, ROUND_HALF_UP, ROUND_HALF_EVEN
from datetime import datetime, date
from typing import Optional, Any, Tuple, List
import logging

logger = logging.getLogger(__name__)


# ============================================================
# Validation Utilities
# ============================================================
def validate_amount(amount: Decimal, min_val: Decimal = Decimal("0"),
                    max_val: Optional[Decimal] = None) -> Tuple[bool, str]:
    """
    Validate a monetary amount.
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if amount is None:
        return False, "AMOUNT IS NULL"
    
    if amount <= min_val:
        return False, "INVALID AMOUNT"
    
    if max_val is not None and amount > max_val:
        return False, "EXCEEDS LIMIT"
    
    return True, ""


def validate_account_status(status: str, allowed_statuses: List[str] = None) -> Tuple[bool, str]:
    """
    Validate account status.
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if allowed_statuses is None:
        allowed_statuses = ["A", "ACTIVE"]
    
    if not status:
        return False, "STATUS IS NULL"
    
    if status.upper() not in [s.upper() for s in allowed_statuses]:
        return False, "INVALID ACCOUNT STATUS"
    
    return True, ""


def validate_daily_limit(amount: Decimal, daily_total: Decimal, 
                         daily_limit: Decimal) -> Tuple[bool, str]:
    """
    Validate against daily transaction limits.
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if amount > daily_limit:
        return False, "DAILY LIMIT EXCEEDED"
    
    new_total = daily_total + amount
    if new_total > daily_limit:
        return False, "DAILY TOTAL EXCEEDED"
    
    return True, ""


def validate_sufficient_funds(amount: Decimal, available_balance: Decimal,
                              overdraft_limit: Decimal = Decimal("0")) -> Tuple[bool, str]:
    """
    Validate sufficient funds for transaction.
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    total_available = available_balance + overdraft_limit
    
    if amount > total_available:
        return False, "INSUFFICIENT FUNDS"
    
    return True, ""


# ============================================================
# Calculation Utilities
# ============================================================
def calculate_simple_interest(principal: Decimal, rate: Decimal,
                              periods: int = 1) -> Decimal:
    """Calculate simple interest with COBOL rounding."""
    interest = principal * rate * Decimal(periods)
    return interest.quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)


def calculate_compound_interest(principal: Decimal, rate: Decimal,
                                periods: int, compounds_per_period: int = 12) -> Decimal:
    """
    Calculate compound interest.
    
    A = P(1 + r/n)^(nt)
    """
    if compounds_per_period == 0:
        return principal
    
    rate_per_compound = rate / Decimal(compounds_per_period)
    total_compounds = compounds_per_period * periods
    
    future_value = principal * ((1 + rate_per_compound) ** total_compounds)
    return future_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_daily_interest(principal: Decimal, annual_rate: Decimal) -> Decimal:
    """Calculate one day's interest."""
    daily_rate = annual_rate / Decimal("365")
    interest = principal * daily_rate
    return interest.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_fee(amount: Decimal, rate: Decimal, 
                  min_fee: Decimal = Decimal("0"),
                  max_fee: Optional[Decimal] = None) -> Decimal:
    """
    Calculate fee with min/max bounds.
    """
    fee = (amount * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    
    if fee < min_fee:
        fee = min_fee
    
    if max_fee is not None and fee > max_fee:
        fee = max_fee
    
    return fee


def calculate_tax(amount: Decimal, tax_rate: Decimal) -> Decimal:
    """Calculate tax amount."""
    return (amount * tax_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_net_amount(gross: Decimal, tax: Decimal, fees: Decimal = Decimal("0")) -> Decimal:
    """Calculate net amount after deductions."""
    return (gross - tax - fees).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


# ============================================================
# Date/Time Utilities
# ============================================================
def get_current_date_cobol() -> Decimal:
    """Get current date in COBOL format (YYYYMMDD as Decimal)."""
    return Decimal(datetime.now().strftime("%Y%m%d"))


def get_current_time_cobol() -> Decimal:
    """Get current time in COBOL format (HHMMSS as Decimal)."""
    return Decimal(datetime.now().strftime("%H%M%S"))


def parse_cobol_date(date_decimal: Decimal) -> Optional[date]:
    """Parse COBOL date (YYYYMMDD) to Python date."""
    try:
        date_str = str(int(date_decimal)).zfill(8)
        return datetime.strptime(date_str, "%Y%m%d").date()
    except (ValueError, TypeError):
        return None


def format_date_cobol(dt: datetime) -> Decimal:
    """Format Python datetime to COBOL date (YYYYMMDD)."""
    return Decimal(dt.strftime("%Y%m%d"))


def days_between(date1: Decimal, date2: Decimal) -> int:
    """Calculate days between two COBOL dates."""
    d1 = parse_cobol_date(date1)
    d2 = parse_cobol_date(date2)
    
    if d1 is None or d2 is None:
        return 0
    
    return abs((d2 - d1).days)


# ============================================================
# String Utilities
# ============================================================
def pad_string(value: str, length: int, fill_char: str = " ") -> str:
    """Pad string to COBOL field length."""
    if value is None:
        value = ""
    return value.ljust(length, fill_char)[:length]


def trim_string(value: str) -> str:
    """Trim COBOL string (remove trailing spaces)."""
    if value is None:
        return ""
    return value.rstrip()


def format_account_number(account: Any, length: int = 10) -> str:
    """Format account number with leading zeros."""
    return str(account).zfill(length)


def format_currency(amount: Decimal, symbol: str = "$") -> str:
    """Format amount as currency string."""
    return f"{symbol}{amount:,.2f}"


# ============================================================
# Array/Table Utilities (COBOL 1-based indexing)
# ============================================================
def array_get(array: list, index: Any, default: Any = None) -> Any:
    """
    Get array element using COBOL 1-based indexing.
    """
    try:
        idx = int(index) - 1  # Convert to 0-based
        if 0 <= idx < len(array):
            return array[idx]
        return default
    except (ValueError, TypeError):
        return default


def array_set(array: list, index: Any, value: Any) -> bool:
    """
    Set array element using COBOL 1-based indexing.
    """
    try:
        idx = int(index) - 1
        if 0 <= idx < len(array):
            array[idx] = value
            return True
        return False
    except (ValueError, TypeError):
        return False


def search_array(array: list, key: Any, key_extractor=None) -> Tuple[bool, int]:
    """
    Search array for key (COBOL SEARCH).
    
    Returns:
        Tuple of (found, 1-based index)
    """
    for idx, item in enumerate(array, start=1):
        compare_value = key_extractor(item) if key_extractor else item
        if compare_value == key:
            return True, idx
    return False, 0


# ============================================================
# Logging Utilities
# ============================================================
def log_transaction(trans_type: str, amount: Decimal, account: str,
                    status: str, user_id: str = None) -> None:
    """Log a transaction for audit purposes."""
    logger.info(
        f"TRANSACTION: type={trans_type} amount={amount} "
        f"account={account} status={status} user={user_id}"
    )


def log_error(error_code: Decimal, error_message: str,
              context: str = None) -> None:
    """Log an error with context."""
    logger.error(
        f"ERROR: code={error_code} message={error_message} context={context}"
    )


def log_security_event(event_type: str, user_id: str = None,
                       details: str = None) -> None:
    """Log a security event."""
    logger.warning(
        f"SECURITY: event={event_type} user={user_id} details={details}"
    )
