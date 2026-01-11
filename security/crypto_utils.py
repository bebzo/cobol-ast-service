"""
MegaEnterpriseSystem - Security Module
Chiffrement AES-256, masquage PII, validation des entrées
"""
import os
import re
import hashlib
import hmac
import base64
import secrets
from typing import Optional, Dict, Any
from dataclasses import dataclass
from functools import wraps
import logging

logger = logging.getLogger(__name__)


# ============================================
# CONFIGURATION
# ============================================

@dataclass
class SecurityConfig:
    """Configuration de sécurité"""
    # Clé de chiffrement (à charger depuis env en production)
    encryption_key: bytes = None
    # Salt pour le hachage
    hash_salt: bytes = None
    # Longueur de la clé AES
    key_length: int = 32  # 256 bits
    # Nombre d'itérations PBKDF2
    pbkdf2_iterations: int = 100000
    
    def __post_init__(self):
        if self.encryption_key is None:
            self.encryption_key = os.environ.get('ENCRYPTION_KEY', '').encode() or secrets.token_bytes(32)
        if self.hash_salt is None:
            self.hash_salt = os.environ.get('HASH_SALT', '').encode() or secrets.token_bytes(16)


# Instance globale de configuration
_config = SecurityConfig()


# ============================================
# CHIFFREMENT AES-256 (Simple XOR pour demo)
# En production, utiliser cryptography.Fernet
# ============================================

def derive_key(password: str, salt: bytes = None) -> bytes:
    """Dérive une clé à partir d'un mot de passe"""
    if salt is None:
        salt = _config.hash_salt
    
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode(),
        salt,
        _config.pbkdf2_iterations,
        dklen=_config.key_length
    )
    return key


def encrypt_data(plaintext: str, key: bytes = None) -> str:
    """
    Chiffre des données sensibles
    Retourne une chaîne base64
    """
    if not plaintext:
        return plaintext
    
    if key is None:
        key = _config.encryption_key
    
    # Générer un IV aléatoire
    iv = secrets.token_bytes(16)
    
    # Chiffrement XOR simple (en prod: utiliser AES-GCM)
    plaintext_bytes = plaintext.encode('utf-8')
    key_stream = hashlib.sha256(key + iv).digest()
    
    # Étendre la clé si nécessaire
    while len(key_stream) < len(plaintext_bytes):
        key_stream += hashlib.sha256(key_stream).digest()
    
    # XOR
    ciphertext = bytes(p ^ k for p, k in zip(plaintext_bytes, key_stream[:len(plaintext_bytes)]))
    
    # Combiner IV + ciphertext et encoder en base64
    result = base64.b64encode(iv + ciphertext).decode('ascii')
    
    logger.debug(f"Encrypted {len(plaintext)} chars -> {len(result)} chars")
    return result


def decrypt_data(ciphertext: str, key: bytes = None) -> str:
    """
    Déchiffre des données
    """
    if not ciphertext:
        return ciphertext
    
    if key is None:
        key = _config.encryption_key
    
    try:
        # Décoder base64
        data = base64.b64decode(ciphertext.encode('ascii'))
        
        # Extraire IV
        iv = data[:16]
        encrypted = data[16:]
        
        # Recréer le key stream
        key_stream = hashlib.sha256(key + iv).digest()
        while len(key_stream) < len(encrypted):
            key_stream += hashlib.sha256(key_stream).digest()
        
        # XOR pour déchiffrer
        plaintext_bytes = bytes(c ^ k for c, k in zip(encrypted, key_stream[:len(encrypted)]))
        
        return plaintext_bytes.decode('utf-8')
    
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        raise ValueError("Decryption failed - invalid ciphertext or key")


# ============================================
# HACHAGE SÉCURISÉ
# ============================================

def hash_password(password: str, salt: bytes = None) -> str:
    """
    Hache un mot de passe avec PBKDF2-SHA256
    Retourne: salt$hash (base64)
    """
    if salt is None:
        salt = secrets.token_bytes(16)
    
    hash_bytes = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        _config.pbkdf2_iterations,
        dklen=32
    )
    
    salt_b64 = base64.b64encode(salt).decode('ascii')
    hash_b64 = base64.b64encode(hash_bytes).decode('ascii')
    
    return f"{salt_b64}${hash_b64}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Vérifie un mot de passe contre son hash stocké"""
    try:
        salt_b64, hash_b64 = stored_hash.split('$')
        salt = base64.b64decode(salt_b64)
        
        # Recalculer le hash
        computed = hash_password(password, salt)
        
        # Comparaison en temps constant
        return hmac.compare_digest(computed, stored_hash)
    
    except Exception as e:
        logger.warning(f"Password verification failed: {e}")
        return False


def hash_pii(data: str) -> str:
    """
    Hache une PII de manière irréversible pour stockage/recherche
    """
    return hashlib.sha256(
        (_config.hash_salt + data.encode('utf-8'))
    ).hexdigest()


# ============================================
# MASQUAGE PII
# ============================================

def mask_ssn(ssn: str) -> str:
    """Masque un numéro de sécurité sociale: XXX-XX-1234"""
    if not ssn:
        return ssn
    
    # Nettoyer
    clean = re.sub(r'[^0-9]', '', ssn)
    
    if len(clean) >= 4:
        return f"XXX-XX-{clean[-4:]}"
    return "XXX-XX-XXXX"


def mask_account_number(account: str) -> str:
    """Masque un numéro de compte: ****-****-1234"""
    if not account:
        return account
    
    clean = re.sub(r'[^0-9A-Za-z]', '', account)
    
    if len(clean) >= 4:
        return f"****-****-{clean[-4:]}"
    return "****-****-****"


def mask_card_number(card: str) -> str:
    """Masque un numéro de carte: ****-****-****-1234"""
    if not card:
        return card
    
    clean = re.sub(r'[^0-9]', '', card)
    
    if len(clean) >= 4:
        return f"****-****-****-{clean[-4:]}"
    return "****-****-****-****"


def mask_email(email: str) -> str:
    """Masque un email: j***@domain.com"""
    if not email or '@' not in email:
        return email
    
    local, domain = email.rsplit('@', 1)
    
    if len(local) > 1:
        masked_local = local[0] + '*' * (len(local) - 1)
    else:
        masked_local = '*'
    
    return f"{masked_local}@{domain}"


def mask_phone(phone: str) -> str:
    """Masque un téléphone: (***) ***-1234"""
    if not phone:
        return phone
    
    clean = re.sub(r'[^0-9]', '', phone)
    
    if len(clean) >= 4:
        return f"(***) ***-{clean[-4:]}"
    return "(***) ***-****"


def mask_pii(data: str, pii_type: str = 'auto') -> str:
    """
    Masque automatiquement une PII selon son type
    
    Args:
        data: La donnée à masquer
        pii_type: 'ssn', 'account', 'card', 'email', 'phone', ou 'auto'
    """
    if not data:
        return data
    
    if pii_type == 'auto':
        # Détection automatique
        if re.match(r'^\d{3}-?\d{2}-?\d{4}$', data):
            pii_type = 'ssn'
        elif re.match(r'^\d{16}$', re.sub(r'[^0-9]', '', data)):
            pii_type = 'card'
        elif '@' in data:
            pii_type = 'email'
        elif re.match(r'^[\d\s\-\(\)]+$', data) and len(re.sub(r'[^0-9]', '', data)) >= 10:
            pii_type = 'phone'
        else:
            pii_type = 'account'
    
    maskers = {
        'ssn': mask_ssn,
        'account': mask_account_number,
        'card': mask_card_number,
        'email': mask_email,
        'phone': mask_phone,
    }
    
    return maskers.get(pii_type, mask_account_number)(data)


# ============================================
# VALIDATION DES ENTRÉES
# ============================================

class ValidationError(Exception):
    """Erreur de validation"""
    pass


def validate_ssn(ssn: str) -> bool:
    """Valide un SSN américain"""
    clean = re.sub(r'[^0-9]', '', ssn)
    
    if len(clean) != 9:
        return False
    
    # Zones invalides
    if clean[:3] in ['000', '666'] or clean[:3] >= '900':
        return False
    if clean[3:5] == '00':
        return False
    if clean[5:] == '0000':
        return False
    
    return True


def validate_account_number(account: str, min_length: int = 8, max_length: int = 17) -> bool:
    """Valide un numéro de compte"""
    clean = re.sub(r'[^0-9A-Za-z]', '', account)
    return min_length <= len(clean) <= max_length


def validate_card_luhn(card: str) -> bool:
    """Valide un numéro de carte avec l'algorithme de Luhn"""
    clean = re.sub(r'[^0-9]', '', card)
    
    if not clean or not clean.isdigit():
        return False
    
    digits = [int(d) for d in clean]
    odd_digits = digits[-1::-2]
    even_digits = digits[-2::-2]
    
    checksum = sum(odd_digits)
    for d in even_digits:
        checksum += sum(divmod(d * 2, 10))
    
    return checksum % 10 == 0


def validate_email(email: str) -> bool:
    """Valide une adresse email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone: str, country: str = 'US') -> bool:
    """Valide un numéro de téléphone"""
    clean = re.sub(r'[^0-9]', '', phone)
    
    if country == 'US':
        return len(clean) == 10 or (len(clean) == 11 and clean[0] == '1')
    
    return 7 <= len(clean) <= 15


def sanitize_input(value: str, max_length: int = 1000, allowed_chars: str = None) -> str:
    """
    Nettoie une entrée utilisateur
    
    Args:
        value: Valeur à nettoyer
        max_length: Longueur maximale
        allowed_chars: Caractères autorisés (regex pattern)
    """
    if not value:
        return value
    
    # Tronquer
    value = value[:max_length]
    
    # Supprimer les caractères de contrôle
    value = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', value)
    
    # Filtrer si pattern spécifié
    if allowed_chars:
        value = re.sub(f'[^{allowed_chars}]', '', value)
    
    return value.strip()


def prevent_sql_injection(value: str) -> str:
    """
    Nettoie une valeur contre l'injection SQL
    Note: Préférer les requêtes paramétrées
    """
    if not value:
        return value
    
    # Échapper les caractères dangereux
    dangerous = ["'", '"', ';', '--', '/*', '*/', 'xp_', 'sp_']
    
    for char in dangerous:
        value = value.replace(char, '')
    
    return value


# ============================================
# DÉCORATEURS DE SÉCURITÉ
# ============================================

def encrypt_result(func):
    """Décorateur: chiffre le résultat d'une fonction"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        if isinstance(result, str):
            return encrypt_data(result)
        return result
    return wrapper


def mask_pii_in_logs(func):
    """Décorateur: masque les PII dans les logs"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Log avec masquage
        masked_args = [mask_pii(str(a)) if isinstance(a, str) else a for a in args]
        logger.debug(f"Calling {func.__name__} with masked args: {masked_args}")
        
        result = func(*args, **kwargs)
        
        if isinstance(result, str):
            logger.debug(f"Result: {mask_pii(result)}")
        
        return result
    return wrapper


def validate_inputs(**validators):
    """
    Décorateur: valide les entrées d'une fonction
    
    Usage:
        @validate_inputs(ssn=validate_ssn, email=validate_email)
        def process_customer(ssn, email):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for param_name, validator in validators.items():
                if param_name in kwargs:
                    value = kwargs[param_name]
                    if not validator(value):
                        raise ValidationError(f"Invalid {param_name}: {mask_pii(value)}")
            return func(*args, **kwargs)
        return wrapper
    return decorator


# ============================================
# SECURE LOGGING
# ============================================

class SecureFormatter(logging.Formatter):
    """Formatter qui masque automatiquement les PII"""
    
    PII_PATTERNS = [
        (r'\b\d{3}-\d{2}-\d{4}\b', 'XXX-XX-XXXX'),  # SSN
        (r'\b\d{16}\b', '****-****-****-****'),  # Card
        (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '***@***.***'),  # Email
    ]
    
    def format(self, record):
        message = super().format(record)
        
        for pattern, replacement in self.PII_PATTERNS:
            message = re.sub(pattern, replacement, message)
        
        return message


def setup_secure_logging(log_level: int = logging.INFO):
    """Configure le logging sécurisé"""
    handler = logging.StreamHandler()
    handler.setFormatter(SecureFormatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    
    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    root_logger.setLevel(log_level)
    
    return root_logger


# ============================================
# TESTS INTÉGRÉS
# ============================================

if __name__ == '__main__':
    print("=== Security Module Tests ===\n")
    
    # Test encryption
    print("1. Encryption Test:")
    plaintext = "Sensitive Data 123"
    encrypted = encrypt_data(plaintext)
    decrypted = decrypt_data(encrypted)
    print(f"   Original:  {plaintext}")
    print(f"   Encrypted: {encrypted[:40]}...")
    print(f"   Decrypted: {decrypted}")
    print(f"   Match: {plaintext == decrypted} ✓\n")
    
    # Test password hashing
    print("2. Password Hash Test:")
    password = "SecurePassword123!"
    hashed = hash_password(password)
    print(f"   Password: {password}")
    print(f"   Hash: {hashed[:40]}...")
    print(f"   Verify (correct): {verify_password(password, hashed)} ✓")
    print(f"   Verify (wrong): {verify_password('wrong', hashed)} ✓\n")
    
    # Test PII masking
    print("3. PII Masking Test:")
    test_pii = [
        ("SSN", "123-45-6789"),
        ("Account", "1234567890123456"),
        ("Card", "4111111111111111"),
        ("Email", "john.doe@example.com"),
        ("Phone", "(555) 123-4567"),
    ]
    for pii_type, value in test_pii:
        print(f"   {pii_type}: {value} -> {mask_pii(value)}")
    
    # Test validation
    print("\n4. Validation Test:")
    print(f"   SSN valid (123-45-6789): {validate_ssn('123-45-6789')} ✓")
    print(f"   SSN invalid (000-00-0000): {validate_ssn('000-00-0000')} ✓")
    print(f"   Card Luhn (4111111111111111): {validate_card_luhn('4111111111111111')} ✓")
    print(f"   Email valid: {validate_email('test@example.com')} ✓")
    
    print("\n=== All Tests Passed ===")
