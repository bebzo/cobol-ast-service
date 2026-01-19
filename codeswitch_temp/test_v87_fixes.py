#!/usr/bin/env python3
"""
Test suite for v8.7 fixes
Validates that the security and test compatibility fixes work correctly.
"""

import unittest
import sys
import os
from decimal import Decimal, localcontext, Overflow, InvalidOperation

# Add workspace to path
sys.path.insert(0, '/workspace')

# Import the fixed module functions by executing the file
exec(open('/workspace/mega_enterprise_system_fixed_v8.7.py').read())


class TestGetSecureCredential(unittest.TestCase):
    """Test get_secure_credential type coercion fix."""
    
    def test_string_input(self):
        """Normal string input should work."""
        result = get_secure_credential('TEST_VAR', 'default')
        self.assertIsInstance(result, str)
    
    def test_decimal_input(self):
        """Decimal input should be coerced to string (v8.7 fix)."""
        # This was failing before: 'decimal.Decimal' object has no attribute 'upper'
        result = get_secure_credential(Decimal('123'), 'default')
        self.assertEqual(result, 'default')
    
    def test_integer_input(self):
        """Integer input should be coerced to string."""
        result = get_secure_credential(42, 'default')
        self.assertEqual(result, 'default')
    
    def test_zero_input(self):
        """Zero input should be coerced to string."""
        result = get_secure_credential(Decimal('0'), 'default')
        self.assertEqual(result, 'default')
    
    def test_negative_input(self):
        """Negative Decimal input should be coerced to string."""
        result = get_secure_credential(Decimal('-100'), 'default')
        self.assertEqual(result, 'default')
    
    def test_large_value_input(self):
        """Large Decimal input should be coerced to string."""
        result = get_secure_credential(Decimal('999999999999'), 'default')
        self.assertEqual(result, 'default')


class TestHashPii(unittest.TestCase):
    """Test hash_pii salt enforcement fix."""
    
    def test_with_explicit_salt(self):
        """Explicit salt should work."""
        result = hash_pii('test-value', salt='my-salt')
        self.assertEqual(len(result), 64)  # SHA256 hex
    
    def test_with_env_salt(self):
        """Environment variable salt should work."""
        os.environ['PII_HASH_SALT'] = 'env-test-salt'
        try:
            result = hash_pii('test-value')
            self.assertEqual(len(result), 64)
        finally:
            del os.environ['PII_HASH_SALT']
    
    def test_development_mode_warns(self):
        """Development mode should warn but not fail."""
        # Ensure we're in development mode
        if 'ENVIRONMENT' in os.environ:
            del os.environ['ENVIRONMENT']
        if 'PII_HASH_SALT' in os.environ:
            del os.environ['PII_HASH_SALT']
        
        import warnings
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            result = hash_pii('test-value')
            self.assertEqual(len(result), 64)
            # Should have warned
            self.assertTrue(any('PII_HASH_SALT' in str(warning.message) for warning in w))
    
    def test_production_mode_raises(self):
        """Production mode without salt should raise SecurityError."""
        os.environ['ENVIRONMENT'] = 'production'
        if 'PII_HASH_SALT' in os.environ:
            del os.environ['PII_HASH_SALT']
        
        try:
            with self.assertRaises(SecurityError):
                hash_pii('test-value')
        finally:
            del os.environ['ENVIRONMENT']


class TestLocalContext(unittest.TestCase):
    """Test that localcontext is used instead of global getcontext."""
    
    def test_safe_compute_uses_localcontext(self):
        """safe_compute should use localcontext, not modify global."""
        from decimal import getcontext
        
        # Get original global precision
        original_prec = getcontext().prec
        
        # Run safe_compute
        result = safe_compute('TEST', lambda x, y: x + y, Decimal('1'), Decimal('2'))
        self.assertEqual(result, Decimal('3'))
        
        # Global context should be unchanged
        self.assertEqual(getcontext().prec, original_prec)
    
    def test_cobol_decimal_context_isolates(self):
        """cobol_decimal_context should isolate precision changes."""
        from decimal import getcontext
        
        original_prec = getcontext().prec
        
        with cobol_decimal_context() as ctx:
            self.assertEqual(ctx.prec, COBOL_DECIMAL_PRECISION)
        
        # Global should be unchanged
        self.assertEqual(getcontext().prec, original_prec)


class TestValidateAmount(unittest.TestCase):
    """Test validate_amount edge cases."""
    
    def test_zero_input(self):
        """Zero should be valid."""
        result = validate_amount(Decimal('0'))
        self.assertEqual(result, Decimal('0'))
    
    def test_negative_input_rejected(self):
        """Negative values should raise ValidationError by default."""
        with self.assertRaises(ValidationError) as ctx:
            validate_amount(Decimal('-100'))
        self.assertIn('Negative', str(ctx.exception))
    
    def test_negative_allowed(self):
        """Negative values should be allowed if allow_negative=True."""
        result = validate_amount(Decimal('-100'), allow_negative=True)
        self.assertEqual(result, Decimal('-100'))
    
    def test_large_value(self):
        """Large values should work."""
        result = validate_amount(Decimal('999999999999.99'))
        self.assertEqual(result, Decimal('999999999999.99'))


class TestSafeArithmetic(unittest.TestCase):
    """Test safe arithmetic functions."""
    
    def test_safe_add(self):
        """Safe add should work."""
        result = safe_add(Decimal('1.5'), Decimal('2.5'))
        self.assertEqual(result, Decimal('4.0'))
    
    def test_safe_subtract(self):
        """Safe subtract should work."""
        result = safe_subtract(Decimal('10'), Decimal('3'))
        self.assertEqual(result, Decimal('7'))
    
    def test_safe_multiply(self):
        """Safe multiply should work."""
        result = safe_multiply(Decimal('4'), Decimal('5'))
        self.assertEqual(result, Decimal('20'))
    
    def test_safe_divide(self):
        """Safe divide should work."""
        result = safe_divide(Decimal('10'), Decimal('4'))
        self.assertEqual(result, Decimal('2.5'))
    
    def test_safe_divide_by_zero(self):
        """Division by zero should raise CobolOverflowError."""
        with self.assertRaises(CobolOverflowError):
            safe_divide(Decimal('10'), Decimal('0'))


class TestRoundCobol(unittest.TestCase):
    """Test COBOL rounding."""
    
    def test_banker_rounding(self):
        """Should use banker's rounding (ROUND_HALF_EVEN)."""
        # 2.5 rounds to 2 (even), 3.5 rounds to 4 (even)
        self.assertEqual(round_cobol(Decimal('2.5'), 0), Decimal('2'))
        self.assertEqual(round_cobol(Decimal('3.5'), 0), Decimal('4'))
    
    def test_two_decimal_places(self):
        """Default should round to 2 decimal places."""
        result = round_cobol(Decimal('123.456'))
        self.assertEqual(result, Decimal('123.46'))


if __name__ == '__main__':
    # Run tests with verbosity
    unittest.main(verbosity=2)
