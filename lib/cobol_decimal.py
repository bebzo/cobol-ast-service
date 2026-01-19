"""
CobolDecimal - Safe Decimal wrapper for COBOL to Python migration
Handles: Overflow checking, ROUND_HALF_EVEN, COMP-3 (packed decimal), audit logging

Author: CodeSwitch Pro v8.5
"""

from decimal import Decimal, ROUND_HALF_EVEN, InvalidOperation, Overflow
from typing import Union, Optional, Tuple
import struct
import logging

logger = logging.getLogger(__name__)


class CobolDecimalError(Exception):
    """Base exception for CobolDecimal errors"""
    pass


class OverflowError(CobolDecimalError):
    """Raised when a value exceeds PIC limits"""
    pass


class PackedDecimalError(CobolDecimalError):
    """Raised when COMP-3 conversion fails"""
    pass


class CobolDecimal:
    """
    A safe Decimal wrapper that enforces COBOL semantics:
    - PIC-based overflow/underflow checking
    - ROUND_HALF_EVEN (banker's rounding) by default
    - COMP-3 (packed decimal) support
    - Audit logging for financial compliance
    
    Usage:
        # Basic usage with PIC clause
        amount = CobolDecimal('1234.56', pic='9(7)V99')
        
        # Arithmetic with automatic overflow checking
        result = amount + CobolDecimal('100.00', pic='9(7)V99')
        
        # COMP-3 conversion
        packed_bytes = amount.to_comp3()
        restored = CobolDecimal.from_comp3(packed_bytes, pic='S9(7)V99')
    """
    
    # Sign nibbles for COMP-3
    SIGN_POSITIVE = 0x0C  # C = positive
    SIGN_NEGATIVE = 0x0D  # D = negative
    SIGN_UNSIGNED = 0x0F  # F = unsigned positive
    
    def __init__(
        self, 
        value: Union[str, int, float, Decimal, 'CobolDecimal'] = 0,
        pic: Optional[str] = None,
        signed: bool = True,
        rounding: str = ROUND_HALF_EVEN,
        audit: bool = True
    ):
        """
        Initialize a CobolDecimal.
        
        Args:
            value: The numeric value
            pic: COBOL PIC clause (e.g., '9(7)V99', 'S9(5)V9(4)')
            signed: Whether the value can be negative
            rounding: Rounding mode (default ROUND_HALF_EVEN)
            audit: Enable audit logging
        """
        self.rounding = rounding
        self.audit = audit
        self.pic = pic
        
        # Parse PIC clause
        if pic:
            self.signed, self.integer_digits, self.decimal_places = self._parse_pic(pic)
        else:
            self.signed = signed
            self.integer_digits = 15  # Default max
            self.decimal_places = 2
        
        # Convert to Decimal
        if isinstance(value, CobolDecimal):
            self._value = value._value
        elif isinstance(value, Decimal):
            self._value = value
        else:
            try:
                self._value = Decimal(str(value))
            except InvalidOperation:
                raise CobolDecimalError(f"Invalid numeric value: {value}")
        
        # Apply rounding and check overflow
        self._value = self._quantize(self._value)
        self._check_overflow(self._value)
    
    def _parse_pic(self, pic: str) -> Tuple[bool, int, int]:
        """
        Parse a COBOL PIC clause.
        
        Examples:
            '9(7)V99' -> (False, 7, 2)
            'S9(5)V9(4)' -> (True, 5, 4)
            '9(9)V99' -> (False, 9, 2)
            'S9(7)V99' -> (True, 7, 2)
        """
        import re
        
        pic = pic.upper().replace(' ', '')
        signed = pic.startswith('S')
        if signed:
            pic = pic[1:]
        
        # Match patterns like 9(7)V99 or 9(7)V9(2)
        integer_match = re.search(r'^9\((\d+)\)|^(9+)', pic)
        decimal_match = re.search(r'V9\((\d+)\)|V(9+)$', pic)
        
        integer_digits = 9  # default
        decimal_places = 2  # default
        
        if integer_match:
            if integer_match.group(1):
                integer_digits = int(integer_match.group(1))
            else:
                integer_digits = len(integer_match.group(2))
        
        if decimal_match:
            if decimal_match.group(1):
                decimal_places = int(decimal_match.group(1))
            else:
                decimal_places = len(decimal_match.group(2))
        elif 'V' not in pic:
            decimal_places = 0
        
        return signed, integer_digits, decimal_places
    
    def _quantize(self, value: Decimal) -> Decimal:
        """Apply rounding based on decimal places."""
        if self.decimal_places == 0:
            quantizer = Decimal('1')
        else:
            quantizer = Decimal('0.' + '0' * self.decimal_places)
        
        try:
            return value.quantize(quantizer, rounding=self.rounding)
        except InvalidOperation:
            raise CobolDecimalError(f"Cannot quantize value: {value}")
    
    def _check_overflow(self, value: Decimal) -> None:
        """Check if value exceeds PIC limits."""
        max_int = '9' * self.integer_digits
        if self.decimal_places > 0:
            max_str = max_int + '.' + '9' * self.decimal_places
        else:
            max_str = max_int
        
        max_value = Decimal(max_str)
        min_value = -max_value if self.signed else Decimal('0')
        
        if value > max_value:
            msg = f"Overflow: {value} exceeds max {max_value} for PIC {self.pic}"
            if self.audit:
                logger.error(msg)
            raise OverflowError(msg)
        
        if value < min_value:
            msg = f"Underflow: {value} below min {min_value} for PIC {self.pic}"
            if self.audit:
                logger.error(msg)
            raise OverflowError(msg)
    
    # =========================================================================
    # COMP-3 (Packed Decimal) Support
    # =========================================================================
    
    def to_comp3(self) -> bytes:
        """
        Convert to COMP-3 (packed decimal) format.
        
        COMP-3 format:
        - Each byte contains 2 digits (4 bits each)
        - Last nibble is the sign (C=positive, D=negative, F=unsigned)
        - Example: -1234.56 with PIC S9(5)V99 -> bytes: 01 23 45 6D
        
        Returns:
            bytes: The packed decimal representation
        """
        # Remove decimal point and get absolute value
        abs_value = abs(self._value)
        
        # Scale to integer
        scaled = int(abs_value * (10 ** self.decimal_places))
        
        # Determine total digits needed
        total_digits = self.integer_digits + self.decimal_places
        
        # Pad to required length
        digit_str = str(scaled).zfill(total_digits)
        
        # Add sign nibble
        if not self.signed:
            sign_nibble = self.SIGN_UNSIGNED
        elif self._value >= 0:
            sign_nibble = self.SIGN_POSITIVE
        else:
            sign_nibble = self.SIGN_NEGATIVE
        
        # Pack digits
        packed = bytearray()
        digits = digit_str + format(sign_nibble, 'x').upper()
        
        # Pad to even length for full bytes
        if len(digits) % 2 == 1:
            digits = '0' + digits
        
        for i in range(0, len(digits), 2):
            byte_val = int(digits[i], 16) << 4 | int(digits[i+1], 16)
            packed.append(byte_val)
        
        if self.audit:
            logger.debug(f"COMP-3 encode: {self._value} -> {packed.hex().upper()}")
        
        return bytes(packed)
    
    @classmethod
    def from_comp3(
        cls, 
        packed_bytes: bytes, 
        pic: str,
        audit: bool = True
    ) -> 'CobolDecimal':
        """
        Create a CobolDecimal from COMP-3 (packed decimal) bytes.
        
        Args:
            packed_bytes: The packed decimal bytes
            pic: COBOL PIC clause
            audit: Enable audit logging
            
        Returns:
            CobolDecimal: The decoded value
        """
        if not packed_bytes:
            raise PackedDecimalError("Empty packed bytes")
        
        # Parse PIC to get decimal places
        instance = cls.__new__(cls)
        instance.signed, instance.integer_digits, instance.decimal_places = instance._parse_pic(pic)
        
        # Unpack bytes to digit string
        digits = ''
        for byte in packed_bytes:
            high = (byte >> 4) & 0x0F
            low = byte & 0x0F
            digits += format(high, 'x') + format(low, 'x')
        
        # Last nibble is sign
        sign_nibble = int(digits[-1], 16)
        digit_str = digits[:-1]
        
        # Remove leading zeros but keep at least one digit
        digit_str = digit_str.lstrip('0') or '0'
        
        # Insert decimal point
        if instance.decimal_places > 0:
            if len(digit_str) <= instance.decimal_places:
                digit_str = '0' * (instance.decimal_places - len(digit_str) + 1) + digit_str
            insert_pos = len(digit_str) - instance.decimal_places
            digit_str = digit_str[:insert_pos] + '.' + digit_str[insert_pos:]
        
        # Apply sign
        if sign_nibble == cls.SIGN_NEGATIVE:
            digit_str = '-' + digit_str
        
        if audit:
            logger.debug(f"COMP-3 decode: {packed_bytes.hex().upper()} -> {digit_str}")
        
        return cls(digit_str, pic=pic, audit=audit)
    
    # =========================================================================
    # Arithmetic Operations (with overflow checking)
    # =========================================================================
    
    def _create_result(self, value: Decimal) -> 'CobolDecimal':
        """Create a new CobolDecimal with same PIC settings."""
        return CobolDecimal(
            value, 
            pic=self.pic, 
            signed=self.signed,
            rounding=self.rounding,
            audit=self.audit
        )
    
    def __add__(self, other: Union['CobolDecimal', Decimal, int, float]) -> 'CobolDecimal':
        other_val = other._value if isinstance(other, CobolDecimal) else Decimal(str(other))
        return self._create_result(self._value + other_val)
    
    def __radd__(self, other: Union[Decimal, int, float]) -> 'CobolDecimal':
        return self.__add__(other)
    
    def __sub__(self, other: Union['CobolDecimal', Decimal, int, float]) -> 'CobolDecimal':
        other_val = other._value if isinstance(other, CobolDecimal) else Decimal(str(other))
        return self._create_result(self._value - other_val)
    
    def __rsub__(self, other: Union[Decimal, int, float]) -> 'CobolDecimal':
        other_val = Decimal(str(other))
        return self._create_result(other_val - self._value)
    
    def __mul__(self, other: Union['CobolDecimal', Decimal, int, float]) -> 'CobolDecimal':
        other_val = other._value if isinstance(other, CobolDecimal) else Decimal(str(other))
        return self._create_result(self._value * other_val)
    
    def __rmul__(self, other: Union[Decimal, int, float]) -> 'CobolDecimal':
        return self.__mul__(other)
    
    def __truediv__(self, other: Union['CobolDecimal', Decimal, int, float]) -> 'CobolDecimal':
        other_val = other._value if isinstance(other, CobolDecimal) else Decimal(str(other))
        if other_val == 0:
            if self.audit:
                logger.error(f"Division by zero attempted: {self._value} / 0")
            raise CobolDecimalError("Division by zero")
        return self._create_result(self._value / other_val)
    
    def __rtruediv__(self, other: Union[Decimal, int, float]) -> 'CobolDecimal':
        if self._value == 0:
            if self.audit:
                logger.error(f"Division by zero attempted: {other} / 0")
            raise CobolDecimalError("Division by zero")
        other_val = Decimal(str(other))
        return self._create_result(other_val / self._value)
    
    def __neg__(self) -> 'CobolDecimal':
        return self._create_result(-self._value)
    
    def __abs__(self) -> 'CobolDecimal':
        return self._create_result(abs(self._value))
    
    # =========================================================================
    # Comparison Operations
    # =========================================================================
    
    def __eq__(self, other) -> bool:
        if isinstance(other, CobolDecimal):
            return self._value == other._value
        return self._value == Decimal(str(other))
    
    def __lt__(self, other) -> bool:
        other_val = other._value if isinstance(other, CobolDecimal) else Decimal(str(other))
        return self._value < other_val
    
    def __le__(self, other) -> bool:
        other_val = other._value if isinstance(other, CobolDecimal) else Decimal(str(other))
        return self._value <= other_val
    
    def __gt__(self, other) -> bool:
        other_val = other._value if isinstance(other, CobolDecimal) else Decimal(str(other))
        return self._value > other_val
    
    def __ge__(self, other) -> bool:
        other_val = other._value if isinstance(other, CobolDecimal) else Decimal(str(other))
        return self._value >= other_val
    
    # =========================================================================
    # Conversion Methods
    # =========================================================================
    
    def __str__(self) -> str:
        return str(self._value)
    
    def __repr__(self) -> str:
        return f"CobolDecimal('{self._value}', pic='{self.pic}')"
    
    def __float__(self) -> float:
        return float(self._value)
    
    def __int__(self) -> int:
        return int(self._value)
    
    def __hash__(self) -> int:
        return hash(self._value)
    
    @property
    def value(self) -> Decimal:
        """Get the underlying Decimal value."""
        return self._value
    
    def to_cobol_display(self) -> str:
        """
        Format as COBOL DISPLAY format.
        
        Returns:
            str: Zero-padded string matching PIC clause
        """
        abs_val = abs(self._value)
        scaled = int(abs_val * (10 ** self.decimal_places))
        total_digits = self.integer_digits + self.decimal_places
        result = str(scaled).zfill(total_digits)
        
        if self.signed and self._value < 0:
            # COBOL negative: last digit becomes letter (0-9 -> } through R)
            last_digit = int(result[-1])
            negative_chars = '}JKLMNOPQR'
            result = result[:-1] + negative_chars[last_digit]
        
        return result


# =========================================================================
# Convenience Functions
# =========================================================================

def cobol_add(a: CobolDecimal, b: CobolDecimal) -> CobolDecimal:
    """Safe addition with overflow checking."""
    return a + b


def cobol_subtract(a: CobolDecimal, b: CobolDecimal) -> CobolDecimal:
    """Safe subtraction with overflow checking."""
    return a - b


def cobol_multiply(a: CobolDecimal, b: CobolDecimal) -> CobolDecimal:
    """Safe multiplication with overflow checking."""
    return a * b


def cobol_divide(a: CobolDecimal, b: CobolDecimal) -> CobolDecimal:
    """Safe division with overflow checking."""
    return a / b


def round_cobol(value: Union[Decimal, float, str], decimal_places: int = 2) -> Decimal:
    """
    Round a value using COBOL-standard ROUND_HALF_EVEN (banker's rounding).
    
    Args:
        value: The value to round
        decimal_places: Number of decimal places
        
    Returns:
        Decimal: The rounded value
    """
    d = Decimal(str(value))
    quantizer = Decimal('0.' + '0' * decimal_places) if decimal_places > 0 else Decimal('1')
    return d.quantize(quantizer, rounding=ROUND_HALF_EVEN)
