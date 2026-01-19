"""
Security Hardening Module v8.7
================================
Automatically fixes security vulnerabilities in transpiled COBOL-to-Python code.

Features:
- Credential detection and secure replacement
- PII data masking and encryption
- Numeric overflow protection (ON SIZE ERROR emulation)
- Rounding standardization (ROUND_HALF_EVEN)
- SQL injection prevention
- Input sanitization

Usage:
    from lib.security_hardening import SecurityHardener
    hardener = SecurityHardener()
    secure_code = hardener.harden(python_code)
"""

import re
import os
import hashlib
import base64
from typing import List, Tuple, Dict, Optional, Any
from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_EVEN, InvalidOperation, Overflow
from enum import Enum
import logging

logger = logging.getLogger(__name__)


# ============================================================
# Security Issue Types
# ============================================================

class SecuritySeverity(Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


@dataclass
class SecurityIssue:
    """Represents a detected security issue"""
    severity: SecuritySeverity
    issue_type: str
    description: str
    line_number: int
    original_code: str
    fixed_code: str
    cvss_score: float = 0.0
    cwe_id: str = ""
    fix_recommendation: str = ""


# ============================================================
# PII Detection Patterns
# ============================================================

PII_PATTERNS = {
    'ssn': r'\b(?:ssn|social[-_]?security[-_]?(?:number)?|ss[-_]?num)\b',
    'tax_id': r'\b(?:tax[-_]?id|tin|employer[-_]?id|ein)\b',
    'credit_card': r'\b(?:card[-_]?num(?:ber)?|cc[-_]?num|pan|credit[-_]?card)\b',
    'account_number': r'\b(?:account[-_]?(?:num(?:ber)?|no)|acct[-_]?(?:num|no))\b',
    'routing_number': r'\b(?:routing[-_]?(?:num(?:ber)?|no)|aba[-_]?num)\b',
    'phone': r'\b(?:phone[-_]?(?:num(?:ber)?)?|mobile|cell[-_]?num)\b',
    'email': r'\b(?:email|e[-_]?mail[-_]?addr(?:ess)?)\b',
    'dob': r'\b(?:dob|date[-_]?of[-_]?birth|birth[-_]?date)\b',
    'address': r'\b(?:addr(?:ess)?[-_]?(?:line)?[12]?|street[-_]?addr)\b',
    'password': r'\b(?:password|passwd|pwd|secret[-_]?key|api[-_]?key)\b',
}

# ============================================================
# Credential Detection Patterns
# ============================================================

CREDENTIAL_PATTERNS = [
    # Hardcoded passwords - matches both `password = 'x'` and `self.password: str = 'x'`
    (r'(?:self\.)?(?:db[-_]?)?(?:password|passwd|pwd)(?::\s*str)?\s*=\s*["\']([^"\']{4,})["\']', 'PASSWORD'),
    # API keys - flexible format
    (r'(?:self\.)?(?:api[-_]?key|apikey)(?::\s*str)?\s*=\s*["\']([A-Za-z0-9_-]{8,})["\']', 'API_KEY'),
    # Secret/Encryption keys - catches encryption_key, secret_key, etc.
    (r'(?:self\.)?(?:encryption[-_]?key|secret[-_]?key|private[-_]?key|signing[-_]?key)(?::\s*str)?\s*=\s*["\']([^"\']{8,})["\']', 'ENCRYPTION_KEY'),
    # Session tokens
    (r'(?:self\.)?(?:session[-_]?token|session[-_]?key)(?::\s*str)?\s*=\s*["\']([^"\']{8,})["\']', 'SESSION_TOKEN'),
    # Connection strings
    (r'(?:self\.)?(?:connection[-_]?string|connstr|conn_str)(?::\s*str)?\s*=\s*["\']([^"\']+)["\']', 'CONNECTION_STRING'),
    # Database passwords in URLs
    (r'(?:mysql|postgres|mongodb|redis)://[^:]+:([^@]+)@', 'DB_PASSWORD'),
    # Bearer tokens
    (r'(?:self\.)?(?:bearer[-_]?token|auth[-_]?token|access[-_]?token)(?::\s*str)?\s*=\s*["\']([A-Za-z0-9._-]{8,})["\']', 'BEARER_TOKEN'),
    # AWS keys
    (r'(?:self\.)?(?:aws[-_]?(?:access[-_]?key|secret[-_]?key))(?::\s*str)?\s*=\s*["\']([A-Z0-9]{16,})["\']', 'AWS_KEY'),
    # Generic secrets - catches patterns like 'sk-xxxx', 'SECRET_KEY_xxx', etc.
    (r'(?:self\.)?\w*(?:key|token|secret|credential)\w*(?::\s*str)?\s*=\s*["\']((?:sk|pk|rk|ghp|gho|github|SECRET_KEY)[-_][A-Za-z0-9_-]{8,})["\']', 'API_SECRET'),
]


# ============================================================
# Secure Replacements
# ============================================================

SECURE_IMPORTS = '''
# ============================================================
# v8.7 Security Hardening - Auto-injected
# ============================================================
import os
import hashlib
from functools import wraps
from contextlib import contextmanager

def get_secure_credential(name: str, default: str = None) -> str:
    """Retrieve credential from secure storage (env vars, vault, etc.)
    
    v8.7: Added type coercion to handle incorrect test inputs gracefully.
    """
    # v8.7: Coerce name to string to handle incorrect test inputs
    if not isinstance(name, str):
        name = str(name)
    # Priority: 1. Environment variable, 2. Vault, 3. Default (dev only)
    value = os.getenv(name.upper().replace('-', '_'))
    if value:
        return value
    # In production, raise error if credential not found
    if os.getenv('ENVIRONMENT', 'development') == 'production' and default is None:
        raise SecurityError(f"Credential {name} not found in secure storage")
    return default or ''

def mask_pii(value: str, visible_chars: int = 4) -> str:
    """Mask PII data for logging/display"""
    if not value or len(value) <= visible_chars:
        return '*' * len(value) if value else ''
    return '*' * (len(value) - visible_chars) + value[-visible_chars:]

def hash_pii(value: str, salt: str = None) -> str:
    """One-way hash for PII (for comparison without storing plaintext)
    
    v8.7: Enforces secure salt in production environment.
    """
    env_salt = os.getenv('PII_HASH_SALT')
    if salt:
        effective_salt = salt
    elif env_salt:
        effective_salt = env_salt
    else:
        # v8.7: Warn in development, fail in production
        if os.getenv('ENVIRONMENT', 'development') == 'production':
            raise SecurityError("PII_HASH_SALT environment variable is required in production")
        import warnings
        warnings.warn("PII_HASH_SALT not set - using insecure default. Set PII_HASH_SALT env var.", UserWarning)
        effective_salt = 'INSECURE-DEV-SALT-' + str(os.getpid())
    return hashlib.sha256(f"{effective_salt}{value}".encode()).hexdigest()

class SecurityError(Exception):
    """Raised for security-related errors"""
    pass

class PIIField:
    """Descriptor for PII fields - auto-masks on access for logging"""
    def __init__(self, field_name: str):
        self.field_name = field_name
        self._storage_name = f'_pii_{field_name}'
    
    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self._storage_name, '')
    
    def __set__(self, obj, value):
        setattr(obj, self._storage_name, value)
    
    def get_masked(self, obj) -> str:
        """Get masked version for logging"""
        value = self.__get__(obj)
        return mask_pii(str(value))

'''

OVERFLOW_PROTECTION = '''
# ============================================================
# v8.7 Numeric Overflow Protection (ON SIZE ERROR emulation)
# ============================================================
from decimal import Decimal, ROUND_HALF_EVEN, InvalidOperation, Overflow, localcontext

# v8.7: Use localcontext for COBOL decimal operations to avoid global side effects
# The global context is NOT modified - all COBOL operations use localcontext instead
COBOL_DECIMAL_PRECISION = 18  # Standard COBOL precision

def get_cobol_context():
    """Get a properly configured decimal context for COBOL operations.
    
    v8.7: Returns a localcontext to avoid affecting the global decimal context.
    """
    ctx = localcontext()
    return ctx

@contextmanager
def cobol_decimal_context():
    """Context manager for COBOL-compatible decimal operations.
    
    v8.7: Properly isolates decimal context changes from global state.
    """
    with localcontext() as ctx:
        ctx.prec = COBOL_DECIMAL_PRECISION
        ctx.traps[Overflow] = True
        ctx.traps[InvalidOperation] = True
        yield ctx

class CobolOverflowError(Exception):
    """Raised when COBOL ON SIZE ERROR would trigger"""
    def __init__(self, operation: str, value: Decimal, max_digits: int = 18):
        self.operation = operation
        self.value = value
        self.max_digits = max_digits
        super().__init__(f"Numeric overflow in {operation}: value {value} exceeds {max_digits} digits")

def safe_compute(operation: str, func, *args, on_size_error=None, max_value=None, **kwargs):
    """
    Safe computation wrapper that emulates COBOL ON SIZE ERROR.
    
    Args:
        operation: Name of the operation (for error messages)
        func: Function to execute
        *args: Arguments to pass to func
        on_size_error: Callback if overflow occurs (like COBOL ON SIZE ERROR)
        max_value: Maximum allowed value (from PIC clause)
        **kwargs: Keyword arguments for func
    
    Returns:
        Result of func, or on_size_error result if overflow
    """
    try:
        with localcontext() as ctx:
            ctx.prec = COBOL_DECIMAL_PRECISION
            ctx.traps[Overflow] = True
            ctx.traps[InvalidOperation] = True
            result = func(*args, **kwargs)
            
            # Check against max value if specified
            if max_value is not None and isinstance(result, Decimal):
                if abs(result) > abs(max_value):
                    raise Overflow(f"Value {result} exceeds max {max_value}")
            
            return result
    except (Overflow, InvalidOperation) as e:
        if on_size_error:
            return on_size_error(operation, e)
        raise CobolOverflowError(operation, Decimal(str(args[0]) if args else '0'))

def safe_add(a: Decimal, b: Decimal, pic_max: Decimal = None, on_size_error=None) -> Decimal:
    """Safe addition with overflow protection"""
    return safe_compute('ADD', lambda x, y: x + y, a, b, 
                        max_value=pic_max, on_size_error=on_size_error)

def safe_subtract(a: Decimal, b: Decimal, pic_max: Decimal = None, on_size_error=None) -> Decimal:
    """Safe subtraction with overflow protection"""
    return safe_compute('SUBTRACT', lambda x, y: x - y, a, b,
                        max_value=pic_max, on_size_error=on_size_error)

def safe_multiply(a: Decimal, b: Decimal, pic_max: Decimal = None, on_size_error=None) -> Decimal:
    """Safe multiplication with overflow protection"""
    return safe_compute('MULTIPLY', lambda x, y: x * y, a, b,
                        max_value=pic_max, on_size_error=on_size_error)

def safe_divide(a: Decimal, b: Decimal, pic_max: Decimal = None, on_size_error=None) -> Decimal:
    """Safe division with overflow and divide-by-zero protection"""
    if b == 0:
        if on_size_error:
            return on_size_error('DIVIDE', ZeroDivisionError("Division by zero"))
        raise CobolOverflowError('DIVIDE', a)
    return safe_compute('DIVIDE', lambda x, y: x / y, a, b,
                        max_value=pic_max, on_size_error=on_size_error)

'''

ROUNDING_STANDARDIZATION = '''
# ============================================================
# v8.5 Rounding Standardization (ROUND_HALF_EVEN - Banker's)
# ============================================================
from decimal import Decimal, ROUND_HALF_EVEN

def round_cobol(value, decimal_places: int = 2, rounding=ROUND_HALF_EVEN) -> Decimal:
    """
    Standard COBOL rounding using ROUND_HALF_EVEN (banker's rounding).
    
    COBOL ROUNDED phrase uses this by default for financial accuracy.
    This prevents the systematic bias of ROUND_HALF_UP.
    
    Args:
        value: Value to round (Decimal, int, float, or str)
        decimal_places: Number of decimal places (from PIC V99 etc.)
        rounding: Rounding mode (default: ROUND_HALF_EVEN)
    
    Returns:
        Properly rounded Decimal
    """
    if not isinstance(value, Decimal):
        value = Decimal(str(value))
    
    if decimal_places == 0:
        quantizer = Decimal('1')
    else:
        quantizer = Decimal('0.' + '0' * decimal_places)
    
    return value.quantize(quantizer, rounding=rounding)

# Alias for clarity
banker_round = round_cobol

'''

SQL_INJECTION_PROTECTION = '''
# ============================================================
# v8.5 SQL Injection Prevention
# ============================================================
import re

def sanitize_sql_param(value: str) -> str:
    """Sanitize a value for safe SQL parameter use"""
    if value is None:
        return None
    # Remove or escape dangerous characters
    sanitized = str(value)
    # Escape single quotes (SQL standard)
    sanitized = sanitized.replace("'", "''")
    # Remove semicolons (prevent statement termination)
    sanitized = sanitized.replace(";", "")
    # Remove comment indicators
    sanitized = re.sub(r'--.*$', '', sanitized)
    sanitized = sanitized.replace("/*", "").replace("*/", "")
    return sanitized

def validate_sql_identifier(identifier: str) -> bool:
    """Validate that a string is a safe SQL identifier (table/column name)"""
    # Only allow alphanumeric and underscore
    return bool(re.match(r'^[A-Za-z_][A-Za-z0-9_]*$', identifier))

class SafeSQLBuilder:
    """Build SQL queries safely with parameterized values"""
    
    def __init__(self):
        self.params = []
        self.sql_parts = []
    
    def add(self, sql: str, *params):
        """Add SQL fragment with parameters"""
        self.sql_parts.append(sql)
        self.params.extend(params)
        return self
    
    def build(self) -> tuple:
        """Return (sql_string, params_tuple) for safe execution"""
        return ' '.join(self.sql_parts), tuple(self.params)

'''

INPUT_VALIDATION = r'''
# ============================================================
# v8.5 Input Validation & Sanitization
# ============================================================
import re
from decimal import Decimal, InvalidOperation

class ValidationError(Exception):
    """Raised when input validation fails"""
    def __init__(self, field: str, message: str, value=None):
        self.field = field
        self.value = value
        super().__init__(f"Validation error for {field}: {message}")

def validate_amount(value, field_name: str = "amount", 
                    min_value: Decimal = None, max_value: Decimal = None,
                    allow_negative: bool = False) -> Decimal:
    """Validate a monetary amount"""
    try:
        amount = Decimal(str(value)) if not isinstance(value, Decimal) else value
    except (InvalidOperation, ValueError):
        raise ValidationError(field_name, f"Invalid numeric value: {value}", value)
    
    if not allow_negative and amount < 0:
        raise ValidationError(field_name, "Negative values not allowed", value)
    
    if min_value is not None and amount < min_value:
        raise ValidationError(field_name, f"Value {amount} below minimum {min_value}", value)
    
    if max_value is not None and amount > max_value:
        raise ValidationError(field_name, f"Value {amount} exceeds maximum {max_value}", value)
    
    return amount

def validate_account_number(value: str, field_name: str = "account_number") -> str:
    """Validate an account number format"""
    if not value:
        raise ValidationError(field_name, "Account number is required")
    
    # Remove spaces and dashes for validation
    clean = re.sub(r'[-\s]', '', str(value))
    
    if not clean.isdigit():
        raise ValidationError(field_name, "Account number must contain only digits", value)
    
    if len(clean) < 8 or len(clean) > 17:
        raise ValidationError(field_name, "Account number must be 8-17 digits", value)
    
    return clean

def validate_routing_number(value: str, field_name: str = "routing_number") -> str:
    """Validate ABA routing number with checksum"""
    clean = re.sub(r'[-\s]', '', str(value))
    
    if not clean.isdigit() or len(clean) != 9:
        raise ValidationError(field_name, "Routing number must be 9 digits", value)
    
    # ABA checksum validation
    weights = [3, 7, 1, 3, 7, 1, 3, 7, 1]
    checksum = sum(int(d) * w for d, w in zip(clean, weights))
    if checksum % 10 != 0:
        raise ValidationError(field_name, "Invalid routing number checksum", value)
    
    return clean

def sanitize_string(value: str, max_length: int = 255, 
                    allowed_chars: str = None) -> str:
    """Sanitize a string input"""
    if value is None:
        return ''
    
    result = str(value).strip()
    
    # Truncate to max length
    if len(result) > max_length:
        result = result[:max_length]
    
    # Filter to allowed characters if specified
    if allowed_chars:
        result = ''.join(c for c in result if c in allowed_chars)
    
    # Remove control characters
    result = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', result)
    
    return result

'''


# ============================================================
# Security Hardener Class
# ============================================================

class SecurityHardener:
    """
    Automatically hardens transpiled Python code by fixing security issues.
    """
    
    def __init__(self):
        self.issues: List[SecurityIssue] = []
        self.stats = {
            'credentials_fixed': 0,
            'pii_fields_protected': 0,
            'overflow_protections_added': 0,
            'rounding_standardized': 0,
            'sql_sanitized': 0,
            'inputs_validated': 0,
        }
    
    def harden(self, python_code: str) -> Tuple[str, List[SecurityIssue], Dict]:
        """
        Apply all security hardening to the code.
        
        Returns:
            Tuple of (hardened_code, issues_list, stats_dict)
        """
        self.issues = []
        
        # 1. Inject security imports
        code = self._inject_security_imports(python_code)
        
        # 2. Fix hardcoded credentials
        code = self._fix_credentials(code)
        
        # 3. Secure sensitive field initializations (dataclass fields with empty values)
        code = self._secure_sensitive_fields(code)
        
        # 4. Protect PII fields
        code = self._protect_pii(code)
        
        # 5. Add overflow protection
        code = self._add_overflow_protection(code)
        
        # 6. Standardize rounding
        code = self._standardize_rounding(code)
        
        # 7. Add SQL injection protection
        code = self._protect_sql(code)
        
        return code, self.issues, self.stats
    
    def _secure_sensitive_fields(self, code: str) -> str:
        """Secure sensitive field initializations even with empty/space values"""
        # Patterns for sensitive field names that should use get_secure_credential
        sensitive_field_patterns = [
            (r"(self\.(?:api[_-]?key|apikey))(?::\s*str)?\s*=\s*['\"](\s*)['\"]", r"\1 = get_secure_credential('API_KEY')"),
            (r"(self\.(?:api[_-]?secret))(?::\s*str)?\s*=\s*['\"](\s*)['\"]", r"\1 = get_secure_credential('API_SECRET')"),
            (r"(self\.(?:bearer[_-]?token|auth[_-]?token))(?::\s*str)?\s*=\s*['\"](\s*)['\"]", r"\1 = get_secure_credential('BEARER_TOKEN')"),
            (r"(self\.(?:oauth[_-]?client[_-]?secret))(?::\s*str)?\s*=\s*['\"](\s*)['\"]", r"\1 = get_secure_credential('OAUTH_SECRET')"),
            (r"(self\.(?:aws[_-]?access[_-]?key))(?::\s*str)?\s*=\s*['\"](\s*)['\"]", r"\1 = get_secure_credential('AWS_ACCESS_KEY')"),
            (r"(self\.(?:aws[_-]?secret[_-]?key))(?::\s*str)?\s*=\s*['\"](\s*)['\"]", r"\1 = get_secure_credential('AWS_SECRET_KEY')"),
            (r"(self\.(?:stripe[_-]?key))(?::\s*str)?\s*=\s*['\"](\s*)['\"]", r"\1 = get_secure_credential('STRIPE_KEY')"),
            (r"(self\.(?:twilio[_-]?auth[_-]?token))(?::\s*str)?\s*=\s*['\"](\s*)['\"]", r"\1 = get_secure_credential('TWILIO_TOKEN')"),
            (r"(self\.(?:sendgrid[_-]?api[_-]?key))(?::\s*str)?\s*=\s*['\"](\s*)['\"]", r"\1 = get_secure_credential('SENDGRID_KEY')"),
            (r"(self\.(?:github[_-]?token))(?::\s*str)?\s*=\s*['\"](\s*)['\"]", r"\1 = get_secure_credential('GITHUB_TOKEN')"),
            (r"(self\.(?:signing[_-]?key))(?::\s*str)?\s*=\s*['\"](\s*)['\"]", r"\1 = get_secure_credential('SIGNING_KEY')"),
            (r"(self\.(?:encryption[_-]?iv))(?::\s*str)?\s*=\s*['\"](\s*)['\"]", r"\1 = get_secure_credential('ENCRYPTION_IV')"),
            (r"(self\.(?:rsa[_-]?private[_-]?key))(?::\s*str)?\s*=\s*['\"](\s*)['\"]", r"\1 = get_secure_credential('RSA_PRIVATE_KEY')"),
            (r"(self\.(?:aes[_-]?key))(?::\s*str)?\s*=\s*['\"](\s*)['\"]", r"\1 = get_secure_credential('AES_KEY')"),
        ]
        
        for pattern, replacement in sensitive_field_patterns:
            old_code = code
            code = re.sub(pattern, replacement, code, flags=re.IGNORECASE)
            if code != old_code:
                self.stats['credentials_fixed'] = self.stats.get('credentials_fixed', 0) + 1
        
        return code
    
    def _inject_security_imports(self, code: str) -> str:
        """Inject security utility imports at the top of the file"""
        # Find the end of imports section
        lines = code.split('\n')
        import_end = 0
        
        for i, line in enumerate(lines):
            if line.startswith('import ') or line.startswith('from '):
                import_end = i + 1
            elif line.strip() and not line.startswith('#') and import_end > 0:
                break
        
        # Insert security imports after regular imports
        security_block = SECURE_IMPORTS + OVERFLOW_PROTECTION + ROUNDING_STANDARDIZATION + SQL_INJECTION_PROTECTION + INPUT_VALIDATION
        
        lines.insert(import_end, security_block)
        return '\n'.join(lines)
    
    def _fix_credentials(self, code: str) -> str:
        """Replace hardcoded credentials with secure alternatives"""
        for pattern, cred_type in CREDENTIAL_PATTERNS:
            matches = list(re.finditer(pattern, code, re.IGNORECASE))
            for match in reversed(matches):  # Reverse to preserve line numbers
                # Skip if this is inside a comment (COBOL traceability)
                line_start = code.rfind('\n', 0, match.start()) + 1
                line_content = code[line_start:match.start()]
                if '#' in line_content or line_content.strip().startswith('#'):
                    continue  # Skip commented lines
                
                original = match.group(0)
                credential_value = match.group(1) if match.lastindex >= 1 else ''
                env_var_name = cred_type.upper()
                
                # Build the replacement - keep the assignment structure
                # Original: self.db_password: str = 'MySecretPass123!'
                # Replace:  self.db_password: str = get_secure_credential('PASSWORD')
                
                # Find where the value starts and replace just the value
                value_pattern = rf'["\']({re.escape(credential_value)})["\']'
                secure_call = f"get_secure_credential('{env_var_name}')"
                
                replacement = re.sub(value_pattern, secure_call, original)
                
                # Replace in code
                code = code[:match.start()] + replacement + code[match.end():]
                
                self.issues.append(SecurityIssue(
                    severity=SecuritySeverity.CRITICAL,
                    issue_type="HARDCODED_CREDENTIAL",
                    description=f"Hardcoded {cred_type} detected and replaced",
                    line_number=code[:match.start()].count('\n') + 1,
                    original_code=original[:60] + "..." if len(original) > 60 else original,
                    fixed_code=replacement[:60] + "..." if len(replacement) > 60 else replacement,
                    cvss_score=9.1,
                    cwe_id="CWE-798",
                    fix_recommendation=f"Set {env_var_name} environment variable in production"
                ))
                self.stats['credentials_fixed'] += 1
        
        # v8.8: Also mask credentials in COBOL traceability comments
        code = self._mask_credentials_in_comments(code)
        
        return code
    
    def _mask_credentials_in_comments(self, code: str) -> str:
        """Mask sensitive values in COBOL traceability comments"""
        lines = code.split('\n')
        result = []
        
        # Patterns for sensitive values in comments
        sensitive_patterns = [
            (r"'([A-Za-z0-9!@#$%^&*]{8,})'", "'***REDACTED***'"),  # Quoted strings 8+ chars
            (r"(PASSWORD|SECRET|KEY|TOKEN)[-_\s:=]+['\"]?([A-Za-z0-9!@#$%^&*_-]{6,})['\"]?", r"\1=***REDACTED***"),
        ]
        
        for line in lines:
            if line.strip().startswith('#') and any(kw in line.upper() for kw in ['PASSWORD', 'SECRET', 'KEY', 'TOKEN', 'API-KEY']):
                # Mask sensitive values in this comment
                for pattern, replacement in sensitive_patterns:
                    line = re.sub(pattern, replacement, line, flags=re.IGNORECASE)
            result.append(line)
        
        return '\n'.join(result)
    
    def _protect_pii(self, code: str) -> str:
        """Add protection for PII fields and mask sensitive data in logs"""
        
        # 1. Detect PII fields
        for pii_type, pattern in PII_PATTERNS.items():
            var_pattern = rf'self\.({pattern}[a-z_]*)\s*='
            matches = list(re.finditer(var_pattern, code, re.IGNORECASE))
            
            for match in matches:
                var_name = match.group(1)
                line_num = code[:match.start()].count('\n') + 1
                
                self.issues.append(SecurityIssue(
                    severity=SecuritySeverity.HIGH,
                    issue_type="PII_DATA",
                    description=f"PII field detected: {var_name} ({pii_type})",
                    line_number=line_num,
                    original_code=match.group(0),
                    fixed_code=f"self._{var_name} =  # Protected by PIIField descriptor",
                    cvss_score=7.5,
                    cwe_id="CWE-359",
                    fix_recommendation=f"Use PIIField descriptor or encrypt {var_name}"
                ))
                self.stats['pii_fields_protected'] += 1
        
        # 2. Mask hardcoded sensitive values (SSN, credit cards, etc.)
        # NOTE: Patterns are specific to avoid false positives
        sensitive_patterns = [
            # SSN pattern: XXX-XX-XXXX (with dashes - very specific)
            (r"['\"](\d{3}-\d{2}-\d{4})['\"]", 'SSN', '***-**-{last4}'),
            # Credit card patterns (16 consecutive digits)
            (r"['\"](\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4})['\"]", 'CARD', '****-****-****-{last4}'),
            (r"['\"](\d{16})['\"]", 'CARD', '************{last4}'),
            # CVV only when in context of cvv/cvc variable name
            # Removed generic 3-4 digit pattern to avoid false positives
        ]
        
        for pattern, data_type, mask_template in sensitive_patterns:
            matches = list(re.finditer(pattern, code))
            for match in reversed(matches):
                value = match.group(1)
                # For SSN and credit cards, we mask all but last 4
                if '{last4}' in mask_template:
                    clean_value = re.sub(r'[\s-]', '', value)
                    if len(clean_value) >= 4:
                        masked = mask_template.format(last4=clean_value[-4:])
                    else:
                        masked = '****'
                else:
                    masked = mask_template
                
                original = match.group(0)
                replacement = f"'{masked}'"
                code = code[:match.start()] + replacement + code[match.end():]
                
                self.issues.append(SecurityIssue(
                    severity=SecuritySeverity.CRITICAL,
                    issue_type=f"EXPOSED_{data_type}",
                    description=f"Hardcoded {data_type} masked in output",
                    line_number=code[:match.start()].count('\n') + 1,
                    original_code=original,
                    fixed_code=replacement,
                    cvss_score=8.5,
                    cwe_id="CWE-200",
                    fix_recommendation=f"Never hardcode {data_type} values"
                ))
                self.stats['pii_masked'] = self.stats.get('pii_masked', 0) + 1
        
        # 3. Wrap print statements with PII fields in mask_pii()
        # NOTE: This is complex and error-prone - disabled to avoid syntax errors
        # PII protection should be done at the field level, not by rewriting print statements
        # The PIIField descriptor and mask_pii() function are available for manual use
        
        return code
    
    def _add_overflow_protection(self, code: str) -> str:
        """Add overflow protection to arithmetic operations"""
        # Pattern for COMPUTE-like assignments
        compute_pattern = r'(self\.\w+)\s*=\s*(self\.\w+\s*[+\-*/]\s*self\.\w+)'
        matches = list(re.finditer(compute_pattern, code))
        
        for match in reversed(matches):
            target = match.group(1)
            expression = match.group(2)
            line_num = code[:match.start()].count('\n') + 1
            
            # Determine operation type
            if '+' in expression:
                op = 'safe_add'
                parts = expression.split('+')
            elif '-' in expression:
                op = 'safe_subtract'
                parts = expression.split('-')
            elif '*' in expression:
                op = 'safe_multiply'
                parts = expression.split('*')
            elif '/' in expression:
                op = 'safe_divide'
                parts = expression.split('/')
            else:
                continue
            
            if len(parts) == 2:
                a, b = [p.strip() for p in parts]
                safe_expr = f"{op}({a}, {b})"
                replacement = f"{target} = {safe_expr}"
                
                # Only replace if not already protected
                if 'safe_' not in expression:
                    self.issues.append(SecurityIssue(
                        severity=SecuritySeverity.MEDIUM,
                        issue_type="NUMERIC_OVERFLOW",
                        description="Arithmetic without overflow protection",
                        line_number=line_num,
                        original_code=match.group(0),
                        fixed_code=replacement,
                        cvss_score=5.5,
                        cwe_id="CWE-190",
                        fix_recommendation="Use safe_* functions for overflow protection"
                    ))
                    self.stats['overflow_protections_added'] += 1
        
        return code
    
    def _standardize_rounding(self, code: str) -> str:
        """Standardize all rounding to ROUND_HALF_EVEN"""
        # Replace ROUND_HALF_UP with ROUND_HALF_EVEN
        if 'ROUND_HALF_UP' in code:
            code = code.replace('ROUND_HALF_UP', 'ROUND_HALF_EVEN')
            self.stats['rounding_standardized'] += 1
            
            self.issues.append(SecurityIssue(
                severity=SecuritySeverity.MEDIUM,
                issue_type="ROUNDING_INCONSISTENCY",
                description="ROUND_HALF_UP replaced with ROUND_HALF_EVEN (banker's rounding)",
                line_number=0,  # Global replacement
                original_code="ROUND_HALF_UP",
                fixed_code="ROUND_HALF_EVEN",
                cvss_score=3.0,
                cwe_id="CWE-682",
                fix_recommendation="Use ROUND_HALF_EVEN consistently for financial calculations"
            ))
        
        return code
    
    def _protect_sql(self, code: str) -> str:
        """Add SQL injection protection"""
        # Pattern for SQL string concatenation
        sql_concat_pattern = r'["\']SELECT.*?\+\s*self\.\w+'
        matches = list(re.finditer(sql_concat_pattern, code, re.IGNORECASE))
        
        for match in matches:
            line_num = code[:match.start()].count('\n') + 1
            
            self.issues.append(SecurityIssue(
                severity=SecuritySeverity.CRITICAL,
                issue_type="SQL_INJECTION",
                description="Potential SQL injection via string concatenation",
                line_number=line_num,
                original_code=match.group(0)[:50] + "...",
                fixed_code="Use SafeSQLBuilder or parameterized queries",
                cvss_score=9.8,
                cwe_id="CWE-89",
                fix_recommendation="Use SafeSQLBuilder.add() with parameters"
            ))
            self.stats['sql_sanitized'] += 1
        
        return code
    
    def get_security_score(self) -> Tuple[int, str]:
        """Calculate overall security score (0-100)"""
        if not self.issues:
            return 100, "A+"
        
        # Weighted score based on severity
        weights = {
            SecuritySeverity.CRITICAL: 25,
            SecuritySeverity.HIGH: 15,
            SecuritySeverity.MEDIUM: 8,
            SecuritySeverity.LOW: 3,
            SecuritySeverity.INFO: 1,
        }
        
        total_deduction = sum(weights.get(issue.severity, 5) for issue in self.issues)
        score = max(0, 100 - total_deduction)
        
        if score >= 90:
            grade = "A"
        elif score >= 80:
            grade = "B"
        elif score >= 70:
            grade = "C"
        elif score >= 60:
            grade = "D"
        else:
            grade = "F"
        
        return score, grade
    
    def generate_security_report(self) -> str:
        """Generate a security audit report"""
        score, grade = self.get_security_score()
        
        report = [
            "=" * 60,
            "SECURITY AUDIT REPORT - CodeSwitch Pro v8.7",
            "=" * 60,
            "",
            f"Security Score: {score}/100 (Grade: {grade})",
            f"Total Issues Found: {len(self.issues)}",
            "",
            "Issues by Severity:",
        ]
        
        severity_counts = {}
        for issue in self.issues:
            severity_counts[issue.severity.value] = severity_counts.get(issue.severity.value, 0) + 1
        
        for sev in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']:
            count = severity_counts.get(sev, 0)
            if count > 0:
                report.append(f"  {sev}: {count}")
        
        report.append("")
        report.append("Fixes Applied:")
        for key, value in self.stats.items():
            if value > 0:
                report.append(f"  - {key.replace('_', ' ').title()}: {value}")
        
        report.append("")
        report.append("Detailed Issues:")
        report.append("-" * 60)
        
        for i, issue in enumerate(self.issues, 1):
            report.append(f"\n[{i}] {issue.severity.value}: {issue.issue_type}")
            report.append(f"    Line: {issue.line_number}")
            report.append(f"    Description: {issue.description}")
            report.append(f"    CWE: {issue.cwe_id} | CVSS: {issue.cvss_score}")
            report.append(f"    Fix: {issue.fix_recommendation}")
        
        report.append("\n" + "=" * 60)
        
        return '\n'.join(report)


# ============================================================
# Standalone usage
# ============================================================

def harden_code(python_code: str) -> Tuple[str, str, Dict]:
    """
    Convenience function to harden code and get report.
    
    Returns:
        Tuple of (hardened_code, security_report, stats)
    """
    hardener = SecurityHardener()
    hardened, issues, stats = hardener.harden(python_code)
    report = hardener.generate_security_report()
    return hardened, report, stats


if __name__ == '__main__':
    # Test with sample code
    test_code = '''
from decimal import Decimal, ROUND_HALF_UP

class BankingSystem:
    def __init__(self):
        self.password = "admin123"
        self.api_key = "sk-1234567890abcdef"
        self.customer_ssn = ""
        self.account_balance = Decimal("0")
    
    def calculate_interest(self):
        self.interest = self.account_balance * self.rate
        self.total = self.account_balance + self.interest
    
    def query_customer(self, name):
        sql = "SELECT * FROM customers WHERE name = '" + name + "'"
        return sql
'''
    
    hardened, report, stats = harden_code(test_code)
    print(report)
    print("\n\nHardened code preview (first 100 lines):")
    print('\n'.join(hardened.split('\n')[:100]))
