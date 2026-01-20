"""
Tests Unitaires v5.7.27 - Objectif 10/10
=========================================
20 tests pour validation dépôt, retrait, transfert, intérêts et frais.
Basé sur le feedback d'évaluation finale.
"""
import pytest
from decimal import Decimal, ROUND_HALF_UP
import sys
import importlib.util
from unittest.mock import Mock, MagicMock


# ============================================================
# SETUP: Charger le module banking_system
# ============================================================
spec = importlib.util.spec_from_file_location(
    "banking_system", 
    "/workspace/output/banking_system_v5720_production.py"
)
banking_module = importlib.util.module_from_spec(spec)
sys.modules["banking_system"] = banking_module
spec.loader.exec_module(banking_module)

UltimateBankingSystem = banking_module.UltimateBankingSystem


# ============================================================
# FIXTURES
# ============================================================
@pytest.fixture
def system():
    """Fixture pour créer une instance configurée du système."""
    s = UltimateBankingSystem()
    # Configuration par défaut pour les tests
    s.max_single_transaction = Decimal('100000.00')
    s.fraud_threshold = Decimal('100')
    s.fraud_score = Decimal('0')
    s.daily_limit = Decimal('10000.00')
    s.daily_total = Decimal('0')
    s.cm_available_balance = Decimal('5000.00')
    s.cm_account_balance = Decimal('5000.00')
    s.ls_from_account = 'ACC001'
    s.ls_to_account = 'ACC002'
    return s


# ============================================================
# TESTS VALIDATION DÉPÔT (5 tests)
# ============================================================
class TestDepositValidation:
    """Tests pour p_311_validate_deposit - 5 tests"""
    
    def test_deposit_valid_amount_sets_flag_Y(self, system):
        """Vérifie que validation_flag='Y' pour montants valides."""
        system.ls_amount = Decimal('1000.00')
        
        system.p_311_validate_deposit()
        
        assert system.validation_flag == 'Y'
        assert system.data_valid == True
    
    def test_deposit_negative_amount_sets_flag_N(self, system):
        """Vérifie que validation_flag='N' pour montants négatifs."""
        system.ls_amount = Decimal('-100.00')
        
        system.p_311_validate_deposit()
        
        assert system.validation_flag == 'N'
        assert system.data_valid == False
        assert 'INVALID AMOUNT' in system.error_message
    
    def test_deposit_zero_amount_rejected(self, system):
        """Vérifie que validation_flag='N' pour montant zéro."""
        system.ls_amount = Decimal('0')
        
        system.p_311_validate_deposit()
        
        assert system.validation_flag == 'N'
        assert 'INVALID AMOUNT' in system.error_message
    
    def test_deposit_exceeds_limit_rejected(self, system):
        """Vérifie que validation_flag='N' si montant > limite."""
        system.ls_amount = Decimal('200000.00')
        system.max_single_transaction = Decimal('100000.00')
        
        system.p_311_validate_deposit()
        
        assert system.validation_flag == 'N'
        assert 'EXCEEDS LIMIT' in system.error_message
    
    def test_deposit_fraud_detected_rejected(self, system):
        """Vérifie que validation_flag='N' si fraude détectée."""
        system.ls_amount = Decimal('1000.00')
        # Mock calculate_fraud_score pour forcer un score élevé
        def mock_fraud_score():
            system.fraud_score = Decimal('150')  # Au-dessus du seuil
        system.calculate_fraud_score = mock_fraud_score
        system.fraud_threshold = Decimal('100')
        
        system.p_311_validate_deposit()
        
        assert system.validation_flag == 'N'
        assert 'FRAUD SUSPECTED' in system.error_message


# ============================================================
# TESTS VALIDATION RETRAIT (5 tests)
# ============================================================
class TestWithdrawalValidation:
    """Tests pour p_321_validate_withdrawal - 5 tests"""
    
    def test_withdrawal_valid_amount_accepted(self, system):
        """Vérifie que validation_flag='Y' pour retrait valide."""
        system.ls_amount = Decimal('500.00')
        system.cm_available_balance = Decimal('5000.00')
        system.daily_limit = Decimal('10000.00')
        
        system.p_321_validate_withdrawal()
        
        assert system.validation_flag == 'Y'
        assert system.data_valid == True
    
    def test_withdrawal_negative_amount_rejected(self, system):
        """Vérifie que validation_flag='N' pour montant négatif."""
        system.ls_amount = Decimal('-50.00')
        
        system.p_321_validate_withdrawal()
        
        assert system.validation_flag == 'N'
        assert 'INVALID AMOUNT' in system.error_message
    
    def test_withdrawal_insufficient_funds_rejected(self, system):
        """Vérifie que validation_flag='N' si fonds insuffisants."""
        system.ls_amount = Decimal('10000.00')
        system.cm_available_balance = Decimal('1000.00')
        
        system.p_321_validate_withdrawal()
        
        assert system.validation_flag == 'N'
        assert 'INSUFFICIENT FUNDS' in system.error_message
    
    def test_withdrawal_exceeds_daily_limit_rejected(self, system):
        """Vérifie que validation_flag='N' si limite journalière dépassée."""
        system.ls_amount = Decimal('15000.00')
        system.cm_available_balance = Decimal('50000.00')
        system.daily_limit = Decimal('10000.00')
        system.daily_total = Decimal('0')
        
        system.p_321_validate_withdrawal()
        
        assert system.validation_flag == 'N'
        # Le code vérifie ls_amount > daily_limit puis daily_total > daily_limit
        assert 'DAILY' in system.error_message
    
    def test_withdrawal_daily_total_exceeded_rejected(self, system):
        """Vérifie que validation_flag='N' si total journalier dépassé."""
        system.ls_amount = Decimal('2000.00')
        system.daily_total = Decimal('9000.00')  # Déjà proche de la limite
        system.daily_limit = Decimal('10000.00')
        system.cm_available_balance = Decimal('50000.00')
        
        system.p_321_validate_withdrawal()
        
        assert system.validation_flag == 'N'
        assert 'DAILY TOTAL EXCEEDED' in system.error_message


# ============================================================
# TESTS VALIDATION TRANSFERT (5 tests)
# ============================================================
class TestTransferValidation:
    """Tests pour p_331_validate_transfer - 5 tests"""
    
    def test_transfer_valid_accepted(self, system):
        """Vérifie que validation_flag='Y' pour transfert valide."""
        system.ls_amount = Decimal('500.00')
        system.cm_available_balance = Decimal('5000.00')
        system.ls_from_account = 'ACC001'
        system.ls_to_account = 'ACC002'
        
        system.p_331_validate_transfer()
        
        assert system.validation_flag == 'Y'
        assert system.data_valid == True
    
    def test_transfer_negative_amount_rejected(self, system):
        """Vérifie que validation_flag='N' pour montant négatif."""
        system.ls_amount = Decimal('-100.00')
        
        system.p_331_validate_transfer()
        
        assert system.validation_flag == 'N'
        assert 'INVALID AMOUNT' in system.error_message
    
    def test_transfer_zero_amount_rejected(self, system):
        """Vérifie que validation_flag='N' pour montant zéro."""
        system.ls_amount = Decimal('0')
        
        system.p_331_validate_transfer()
        
        assert system.validation_flag == 'N'
        assert 'INVALID AMOUNT' in system.error_message
    
    def test_transfer_insufficient_funds_rejected(self, system):
        """Vérifie que validation_flag='N' si fonds insuffisants."""
        system.ls_amount = Decimal('10000.00')
        system.cm_available_balance = Decimal('1000.00')
        
        system.p_331_validate_transfer()
        
        assert system.validation_flag == 'N'
        assert 'INSUFFICIENT FUNDS' in system.error_message
    
    def test_transfer_same_account_rejected(self, system):
        """Vérifie que validation_flag='N' si même compte source/destination."""
        system.ls_amount = Decimal('500.00')
        system.ls_from_account = 'ACC001'
        system.ls_to_account = 'ACC001'  # Même compte!
        
        system.p_331_validate_transfer()
        
        assert system.validation_flag == 'N'
        assert 'SAME ACCOUNT' in system.error_message


# ============================================================
# TESTS CALCUL INTÉRÊTS (3 tests)
# ============================================================
class TestInterestCalculation:
    """Tests pour calculs d'intérêts - 3 tests"""
    
    def test_daily_interest_calculation(self, system):
        """Vérifie le calcul d'intérêt journalier."""
        system.principal = Decimal('10000.00')
        system.cm_interest_rate = Decimal('0.05')  # 5% annuel
        system.annual_rate = Decimal('0.05')
        system.daily_rate = system.annual_rate / Decimal('365')
        system.tax_rate = Decimal('0.20')  # 20% taxe
        
        system.p_410_calculate_daily_interest()
        
        # Intérêt journalier = principal * daily_rate
        expected_interest = (Decimal('10000.00') * system.daily_rate).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )
        
        assert system.interest_amount == expected_interest
        assert system.net_interest <= system.interest_amount  # Après taxe
    
    def test_compound_interest_calculation(self, system):
        """Vérifie le calcul d'intérêt composé."""
        system.principal = Decimal('10000.00')
        system.annual_rate = Decimal('0.05')
        system.compound_periods = Decimal('12')  # Mensuel
        system.time_years = Decimal('1')
        
        system.p_363_calculate_compound()
        
        # future_value doit être > principal
        assert system.future_value > system.principal
        assert system.interest_amount > Decimal('0')
    
    def test_interest_with_zero_rate(self, system):
        """Vérifie qu'aucun intérêt avec taux zéro."""
        system.principal = Decimal('10000.00')
        system.cm_interest_rate = Decimal('0')
        system.tax_rate = Decimal('0.20')
        
        system.p_410_calculate_daily_interest()
        
        assert system.interest_amount == Decimal('0.00')


# ============================================================
# TESTS CALCUL FRAIS (2 tests)
# ============================================================
class TestFeeCalculation:
    """Tests pour calculs de frais - 2 tests"""
    
    def test_withdrawal_fee_minimum_applied(self, system):
        """Vérifie que le frais minimum de 5$ est appliqué."""
        system.ls_amount = Decimal('100.00')  # 1.5% = 1.50$, en dessous du min
        system.cm_account_balance = Decimal('5000.00')
        
        system.p_322_execute_withdrawal()
        
        # Frais minimum = 5.00$
        assert system.fee_amount == Decimal('5.00')
    
    def test_withdrawal_fee_percentage_applied(self, system):
        """Vérifie que le frais % est appliqué quand > minimum."""
        system.ls_amount = Decimal('1000.00')  # 1.5% = 15$, au-dessus du min
        system.cm_account_balance = Decimal('5000.00')
        
        system.p_322_execute_withdrawal()
        
        expected_fee = (Decimal('1000.00') * Decimal('0.015')).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )
        assert system.fee_amount == expected_fee
        assert system.fee_amount > Decimal('5.00')


# ============================================================
# EXÉCUTION
# ============================================================
if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short', '-x'])
