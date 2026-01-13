"""
Tests unitaires pour le module Security
"""
import pytest
from decimal import Decimal
import sys
sys.path.insert(0, '/workspace/security')

from crypto_utils import (
    encrypt_data, decrypt_data,
    hash_password, verify_password, hash_pii,
    mask_ssn, mask_account_number, mask_card_number, mask_email, mask_phone, mask_pii,
    validate_ssn, validate_account_number, validate_card_luhn, validate_email, validate_phone,
    sanitize_input, prevent_sql_injection
)


class TestEncryption:
    """Tests pour le chiffrement"""
    
    def test_encrypt_decrypt_roundtrip(self):
        """Le déchiffrement doit retourner le texte original"""
        plaintext = "Sensitive banking data 12345"
        encrypted = encrypt_data(plaintext)
        decrypted = decrypt_data(encrypted)
        
        assert decrypted == plaintext
    
    def test_encrypt_produces_different_output(self):
        """Le chiffrement doit produire un résultat différent de l'entrée"""
        plaintext = "My secret data"
        encrypted = encrypt_data(plaintext)
        
        assert encrypted != plaintext
        assert len(encrypted) > 0
    
    def test_encrypt_empty_string(self):
        """Une chaîne vide reste vide"""
        assert encrypt_data("") == ""
        assert decrypt_data("") == ""
    
    def test_different_encryptions_are_different(self):
        """Deux chiffrements du même texte doivent être différents (IV aléatoire)"""
        plaintext = "Same text"
        enc1 = encrypt_data(plaintext)
        enc2 = encrypt_data(plaintext)
        
        # Les deux doivent déchiffrer vers le même texte
        assert decrypt_data(enc1) == plaintext
        assert decrypt_data(enc2) == plaintext
        
        # Mais les chiffrés doivent être différents (IV différent)
        assert enc1 != enc2


class TestPasswordHashing:
    """Tests pour le hachage de mots de passe"""
    
    def test_hash_password_format(self):
        """Le hash doit avoir le format salt$hash"""
        hashed = hash_password("password123")
        
        assert '$' in hashed
        parts = hashed.split('$')
        assert len(parts) == 2
    
    def test_verify_correct_password(self):
        """Un mot de passe correct doit être vérifié"""
        password = "SecureP@ssw0rd!"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) == True
    
    def test_verify_wrong_password(self):
        """Un mauvais mot de passe doit échouer"""
        hashed = hash_password("correct_password")
        
        assert verify_password("wrong_password", hashed) == False
    
    def test_hash_pii_consistent(self):
        """Le hash PII doit être consistant"""
        pii = "123-45-6789"
        
        hash1 = hash_pii(pii)
        hash2 = hash_pii(pii)
        
        assert hash1 == hash2
        assert len(hash1) == 64  # SHA-256 en hex


class TestPIIMasking:
    """Tests pour le masquage des PII"""
    
    def test_mask_ssn(self):
        """Masquage du SSN"""
        assert mask_ssn("123-45-6789") == "XXX-XX-6789"
        assert mask_ssn("123456789") == "XXX-XX-6789"
        assert mask_ssn("") == ""
    
    def test_mask_account_number(self):
        """Masquage du numéro de compte"""
        assert mask_account_number("1234567890123456") == "****-****-3456"
        assert mask_account_number("ACC-12345678") == "****-****-5678"
    
    def test_mask_card_number(self):
        """Masquage du numéro de carte"""
        assert mask_card_number("4111111111111111") == "****-****-****-1111"
        assert mask_card_number("4111-1111-1111-1111") == "****-****-****-1111"
    
    def test_mask_email(self):
        """Masquage de l'email"""
        assert mask_email("john.doe@example.com") == "j*******@example.com"
        assert mask_email("a@b.com") == "*@b.com"
    
    def test_mask_phone(self):
        """Masquage du téléphone"""
        assert mask_phone("(555) 123-4567") == "(***) ***-4567"
        assert mask_phone("5551234567") == "(***) ***-4567"
    
    def test_mask_pii_auto_detect(self):
        """Détection automatique du type de PII"""
        assert "XXX-XX-" in mask_pii("123-45-6789")
        assert "@" in mask_pii("test@example.com")
        assert "****" in mask_pii("4111111111111111")


class TestValidation:
    """Tests de validation"""
    
    def test_validate_ssn_valid(self):
        """SSN valides"""
        assert validate_ssn("123-45-6789") == True
        assert validate_ssn("123456789") == True
    
    def test_validate_ssn_invalid(self):
        """SSN invalides"""
        assert validate_ssn("000-00-0000") == False  # Zone 000
        assert validate_ssn("666-00-0000") == False  # Zone 666
        assert validate_ssn("900-00-0000") == False  # Zone >= 900
        assert validate_ssn("123-00-1234") == False  # Groupe 00
        assert validate_ssn("123-45-0000") == False  # Série 0000
        assert validate_ssn("12345") == False  # Trop court
    
    def test_validate_account_number(self):
        """Validation de numéro de compte"""
        assert validate_account_number("12345678") == True
        assert validate_account_number("123456789012345") == True
        assert validate_account_number("1234") == False  # Trop court
    
    def test_validate_card_luhn_valid(self):
        """Numéros de carte valides (Luhn)"""
        assert validate_card_luhn("4111111111111111") == True  # Visa test
        assert validate_card_luhn("5500000000000004") == True  # MC test
        assert validate_card_luhn("340000000000009") == True   # Amex test
    
    def test_validate_card_luhn_invalid(self):
        """Numéros de carte invalides"""
        assert validate_card_luhn("4111111111111112") == False
        assert validate_card_luhn("1234567890123456") == False
    
    def test_validate_email(self):
        """Validation d'email"""
        assert validate_email("user@example.com") == True
        assert validate_email("user.name+tag@domain.co.uk") == True
        assert validate_email("invalid-email") == False
        assert validate_email("@nodomain.com") == False
    
    def test_validate_phone(self):
        """Validation de téléphone"""
        assert validate_phone("5551234567") == True
        assert validate_phone("15551234567") == True
        assert validate_phone("123") == False


class TestSanitization:
    """Tests de nettoyage des entrées"""
    
    def test_sanitize_max_length(self):
        """Respecte la longueur maximale"""
        result = sanitize_input("a" * 100, max_length=10)
        assert len(result) == 10
    
    def test_sanitize_removes_control_chars(self):
        """Supprime les caractères de contrôle"""
        result = sanitize_input("Hello\x00World\x1f!")
        assert result == "HelloWorld!"
    
    def test_sanitize_allowed_chars(self):
        """Filtre selon les caractères autorisés"""
        result = sanitize_input("ABC123!@#", allowed_chars="A-Z0-9")
        assert result == "ABC123"
    
    def test_prevent_sql_injection(self):
        """Prévient l'injection SQL"""
        dangerous = "'; DROP TABLE users; --"
        result = prevent_sql_injection(dangerous)
        
        assert "'" not in result
        assert ";" not in result
        assert "--" not in result


class TestIntegration:
    """Tests d'intégration"""
    
    def test_full_pii_workflow(self):
        """Workflow complet: validation -> chiffrement -> masquage"""
        ssn = "123-45-6789"
        
        # 1. Valider
        assert validate_ssn(ssn) == True
        
        # 2. Chiffrer pour stockage
        encrypted = encrypt_data(ssn)
        assert ssn not in encrypted
        
        # 3. Déchiffrer
        decrypted = decrypt_data(encrypted)
        assert decrypted == ssn
        
        # 4. Masquer pour affichage
        masked = mask_ssn(decrypted)
        assert masked == "XXX-XX-6789"
    
    def test_password_workflow(self):
        """Workflow complet pour mot de passe"""
        password = "MySecurePassword123!"
        
        # 1. Hasher pour stockage
        stored_hash = hash_password(password)
        
        # 2. Vérifier à la connexion
        assert verify_password(password, stored_hash) == True
        assert verify_password("wrong", stored_hash) == False


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
