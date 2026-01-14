"""
Tests for Utility Functions
============================
Tests for validation, calculation, date, string, and array utilities.
v5.7.29 - Utility testing
"""
import pytest
from decimal import Decimal
from datetime import datetime, date
import sys

sys.path.insert(0, '/workspace')

from core.utils import (
    # Validation
    validate_amount, validate_account_status, validate_daily_limit,
    validate_sufficient_funds,
    # Calculations
    calculate_simple_interest, calculate_compound_interest,
    calculate_daily_interest, calculate_fee, calculate_tax,
    calculate_net_amount,
    # Date/Time
    get_current_date_cobol, get_current_time_cobol,
    parse_cobol_date, format_date_cobol, days_between,
    # String
    pad_string, trim_string, format_account_number, format_currency,
    # Array
    array_get, array_set, search_array
)
from core.constants import ErrorCode, ErrorMessage, TransactionType, AccountStatus


# ============================================================
# Validation Tests (6 tests)
# ============================================================
class TestValidation:
    """Tests for validation utilities."""
    
    def test_validate_amount_valid(self):
        """Valid amount passes validation."""
        is_valid, error = validate_amount(Decimal("100.00"))
        assert is_valid == True
        assert error == ""
    
    def test_validate_amount_negative(self):
        """Negative amount fails validation."""
        is_valid, error = validate_amount(Decimal("-50.00"))
        assert is_valid == False
        assert "INVALID" in error
    
    def test_validate_amount_exceeds_max(self):
        """Amount exceeding max fails validation."""
        is_valid, error = validate_amount(
            Decimal("200.00"), 
            max_val=Decimal("100.00")
        )
        assert is_valid == False
        assert "EXCEEDS" in error
    
    def test_validate_daily_limit_ok(self):
        """Amount within daily limit passes."""
        is_valid, error = validate_daily_limit(
            Decimal("500.00"),
            Decimal("1000.00"),
            Decimal("5000.00")
        )
        assert is_valid == True
    
    def test_validate_daily_limit_exceeded(self):
        """Amount exceeding daily limit fails."""
        is_valid, error = validate_daily_limit(
            Decimal("6000.00"),
            Decimal("0"),
            Decimal("5000.00")
        )
        assert is_valid == False
        assert "DAILY" in error
    
    def test_validate_sufficient_funds(self):
        """Sufficient funds check works."""
        is_valid, _ = validate_sufficient_funds(
            Decimal("100.00"),
            Decimal("500.00")
        )
        assert is_valid == True
        
        is_valid, error = validate_sufficient_funds(
            Decimal("600.00"),
            Decimal("500.00")
        )
        assert is_valid == False
        assert "INSUFFICIENT" in error


# ============================================================
# Calculation Tests (6 tests)
# ============================================================
class TestCalculations:
    """Tests for calculation utilities."""
    
    def test_simple_interest(self):
        """Simple interest calculates correctly."""
        interest = calculate_simple_interest(
            Decimal("10000.00"),
            Decimal("0.05"),
            1
        )
        assert interest == Decimal("500.00")
    
    def test_compound_interest(self):
        """Compound interest calculates correctly."""
        future_value = calculate_compound_interest(
            Decimal("10000.00"),
            Decimal("0.05"),
            1,
            12
        )
        # Should be slightly more than simple interest
        assert future_value > Decimal("10500.00")
    
    def test_daily_interest(self):
        """Daily interest calculates correctly."""
        interest = calculate_daily_interest(
            Decimal("10000.00"),
            Decimal("0.0365")  # ~10 cents/day
        )
        assert interest == Decimal("1.00")
    
    def test_fee_with_minimum(self):
        """Fee respects minimum."""
        fee = calculate_fee(
            Decimal("100.00"),
            Decimal("0.01"),  # 1% = $1
            min_fee=Decimal("5.00")
        )
        assert fee == Decimal("5.00")  # Min applied
    
    def test_fee_with_maximum(self):
        """Fee respects maximum."""
        fee = calculate_fee(
            Decimal("10000.00"),
            Decimal("0.05"),  # 5% = $500
            max_fee=Decimal("100.00")
        )
        assert fee == Decimal("100.00")  # Max applied
    
    def test_net_amount(self):
        """Net amount calculates correctly."""
        net = calculate_net_amount(
            Decimal("1000.00"),
            Decimal("200.00"),
            Decimal("50.00")
        )
        assert net == Decimal("750.00")


# ============================================================
# Date/Time Tests (5 tests)
# ============================================================
class TestDateTime:
    """Tests for date/time utilities."""
    
    def test_current_date_format(self):
        """Current date is 8 digits."""
        date_val = get_current_date_cobol()
        assert len(str(int(date_val))) == 8
    
    def test_current_time_format(self):
        """Current time is 6 digits."""
        time_val = get_current_time_cobol()
        assert len(str(int(time_val)).zfill(6)) == 6
    
    def test_parse_cobol_date(self):
        """COBOL date parsing works."""
        parsed = parse_cobol_date(Decimal("20260114"))
        assert parsed == date(2026, 1, 14)
    
    def test_format_date_cobol(self):
        """Date formatting to COBOL works."""
        dt = datetime(2026, 1, 14)
        formatted = format_date_cobol(dt)
        assert formatted == Decimal("20260114")
    
    def test_days_between(self):
        """Days between calculation works."""
        days = days_between(
            Decimal("20260101"),
            Decimal("20260115")
        )
        assert days == 14


# ============================================================
# String Tests (4 tests)
# ============================================================
class TestStrings:
    """Tests for string utilities."""
    
    def test_pad_string(self):
        """String padding works."""
        padded = pad_string("TEST", 10)
        assert padded == "TEST      "
        assert len(padded) == 10
    
    def test_pad_string_truncate(self):
        """Long string is truncated."""
        padded = pad_string("VERYLONGSTRING", 5)
        assert padded == "VERYL"
        assert len(padded) == 5
    
    def test_format_account_number(self):
        """Account number formatting works."""
        formatted = format_account_number(12345, 10)
        assert formatted == "0000012345"
    
    def test_format_currency(self):
        """Currency formatting works."""
        formatted = format_currency(Decimal("1234.56"))
        assert formatted == "$1,234.56"


# ============================================================
# Array Tests (4 tests)
# ============================================================
class TestArrays:
    """Tests for array utilities (COBOL 1-based indexing)."""
    
    def test_array_get_valid(self):
        """Array get with valid index works."""
        arr = [10, 20, 30, 40]
        value = array_get(arr, 2)  # 1-based index 2 = element 20
        assert value == 20
    
    def test_array_get_out_of_bounds(self):
        """Array get with invalid index returns default."""
        arr = [10, 20, 30]
        value = array_get(arr, 5, default=-1)
        assert value == -1
    
    def test_array_set(self):
        """Array set with valid index works."""
        arr = [10, 20, 30]
        result = array_set(arr, 2, 99)
        assert result == True
        assert arr[1] == 99  # 0-based index 1
    
    def test_search_array(self):
        """Array search finds element."""
        arr = ["A", "B", "C", "D"]
        found, index = search_array(arr, "C")
        assert found == True
        assert index == 3  # 1-based


# ============================================================
# Constants Tests (3 tests)
# ============================================================
class TestConstants:
    """Tests for constants module."""
    
    def test_error_code_values(self):
        """Error codes have expected values."""
        assert ErrorCode.SUCCESS == Decimal("0")
        assert ErrorCode.ACCOUNT_NOT_FOUND == Decimal("9003")
        assert ErrorCode.INSUFFICIENT_FUNDS == Decimal("9013")
    
    def test_error_code_message(self):
        """Error code message lookup works."""
        message = ErrorCode.get_message(ErrorCode.INSUFFICIENT_FUNDS)
        assert "Insufficient" in message
    
    def test_transaction_types(self):
        """Transaction types are defined."""
        assert TransactionType.DEPOSIT == "DEP"
        assert TransactionType.WITHDRAWAL == "WDR"
        assert TransactionType.TRANSFER == "TRF"


# ============================================================
# Run Tests
# ============================================================
if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
