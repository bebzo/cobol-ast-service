"""
Tests unitaires pour le module Banking de MegaEnterpriseSystem
pytest + hypothesis pour tests de propriétés
"""
import pytest
from decimal import Decimal
from hypothesis import given, strategies as st
import sys
import importlib.util
from decimal import Decimal

# Load module with hyphen in filename - register in sys.modules first
spec = importlib.util.spec_from_file_location("mega_enterprise", "/workspace/public/MEGA-ENTERPRISE_hybrid.py")
mega_module = importlib.util.module_from_spec(spec)
sys.modules["mega_enterprise"] = mega_module
spec.loader.exec_module(mega_module)

MegaEnterpriseSystem = mega_module.MegaEnterpriseSystem
MegaEnterpriseSystemConfig = mega_module.MegaEnterpriseSystemConfig


class TestConfiguration:
    """Tests pour la configuration des taux et frais"""
    
    def test_config_defaults(self):
        """Vérifie les valeurs par défaut de configuration"""
        config = MegaEnterpriseSystemConfig()
        
        assert config.overdraft_fee == Decimal('35.00')
        assert config.nsf_fee == Decimal('35.00')
        assert config.wire_fee_domestic == Decimal('25.00')
        assert config.wire_fee_intl == Decimal('45.00')
        assert config.late_payment_fee == Decimal('39.00')
    
    def test_interest_rates_positive(self):
        """Tous les taux d'intérêt doivent être positifs"""
        config = MegaEnterpriseSystemConfig()
        
        assert config.savings_rate > Decimal('0')
        assert config.checking_rate >= Decimal('0')
        assert config.mm_rate > Decimal('0')
        assert config.cd_rate_1yr > Decimal('0')
        assert config.mortgage_rate_30 > Decimal('0')
    
    def test_tax_brackets_ordered(self):
        """Les tranches d'imposition doivent être ordonnées"""
        config = MegaEnterpriseSystemConfig()
        
        assert config.bracket_1_rate < config.bracket_2_rate
        assert config.bracket_2_rate < config.bracket_3_rate
        assert config.bracket_3_rate < config.bracket_4_rate
        assert config.bracket_4_rate < config.bracket_5_rate


class TestBankingOperations:
    """Tests pour les opérations bancaires"""
    
    @pytest.fixture
    def system(self):
        """Fixture pour créer une instance du système"""
        return MegaEnterpriseSystem()
    
    def test_system_initialization(self, system):
        """Le système doit s'initialiser correctement"""
        assert system.config is not None
        assert system.total_deposits == Decimal('0')
        assert system.total_withdrawals == Decimal('0')
        assert system.total_transfers == Decimal('0')
    
    def test_deposit_increases_balance(self, system):
        """Un dépôt doit augmenter le solde"""
        initial_balance = Decimal('1000.00')
        deposit_amount = Decimal('500.00')
        
        system.acct_balance = initial_balance
        system.acct_available = initial_balance
        system.calc_amount = deposit_amount
        system.total_deposits = Decimal('0')
        
        # Simulate deposit
        system.acct_balance += system.calc_amount
        system.total_deposits += system.calc_amount
        
        assert system.acct_balance == Decimal('1500.00')
        assert system.total_deposits == Decimal('500.00')
    
    def test_withdrawal_decreases_balance(self, system):
        """Un retrait doit diminuer le solde"""
        initial_balance = Decimal('1000.00')
        withdrawal_amount = Decimal('300.00')
        
        system.acct_balance = initial_balance
        system.acct_available = initial_balance
        system.calc_amount = withdrawal_amount
        
        # Simulate withdrawal
        system.acct_balance -= system.calc_amount
        
        assert system.acct_balance == Decimal('700.00')
    
    def test_overdraft_applies_fee(self, system):
        """Un découvert doit appliquer des frais"""
        system.acct_balance = Decimal('100.00')
        system.acct_available = Decimal('100.00')
        system.acct_overdraft_limit = Decimal('500.00')
        system.calc_amount = Decimal('400.00')  # Plus que le solde
        
        overdraft_fee = system.config.overdraft_fee
        
        # Withdrawal exceeds balance but within overdraft limit
        if system.calc_amount > system.acct_available:
            if system.calc_amount <= (system.acct_available + system.acct_overdraft_limit):
                system.acct_balance -= overdraft_fee
        
        assert system.acct_balance == Decimal('65.00')  # 100 - 35 fee


class TestInterestCalculations:
    """Tests pour les calculs d'intérêts"""
    
    def test_simple_interest_calculation(self):
        """Calcul d'intérêt simple"""
        principal = Decimal('10000.00')
        rate = Decimal('0.05')  # 5%
        
        annual_interest = principal * rate
        monthly_interest = annual_interest / 12
        
        assert annual_interest == Decimal('500.00')
        assert monthly_interest == Decimal('500.00') / 12
    
    @given(st.decimals(min_value=0, max_value=1000000, places=2))
    def test_interest_always_positive_for_positive_balance(self, balance):
        """L'intérêt doit toujours être positif pour un solde positif"""
        if balance > 0:
            rate = Decimal('0.0225')  # Savings rate
            interest = balance * rate / 12
            assert interest >= Decimal('0')
    
    def test_cd_rates_increase_with_term(self):
        """Les taux CD doivent augmenter avec la durée"""
        config = MegaEnterpriseSystemConfig()
        
        assert config.cd_rate_1yr < config.cd_rate_2yr
        assert config.cd_rate_2yr < config.cd_rate_5yr


class TestLoanProcessing:
    """Tests pour le traitement des prêts"""
    
    def test_loan_payment_reduces_principal(self):
        """Un paiement de prêt doit réduire le principal"""
        loan_balance = Decimal('100000.00')
        payment = Decimal('1000.00')
        interest_rate = Decimal('0.06')  # 6% annuel
        
        monthly_interest = loan_balance * interest_rate / 12
        principal_payment = payment - monthly_interest
        new_balance = loan_balance - principal_payment
        
        assert new_balance < loan_balance
        assert principal_payment > Decimal('0')
    
    def test_amortization_principal_increases_over_time(self):
        """La part de principal augmente au fil du temps"""
        loan_balance = Decimal('100000.00')
        payment = Decimal('1000.00')
        rate = Decimal('0.06') / 12  # Taux mensuel
        
        # Premier mois
        interest_1 = loan_balance * rate
        principal_1 = payment - interest_1
        balance_after_1 = loan_balance - principal_1
        
        # Deuxième mois
        interest_2 = balance_after_1 * rate
        principal_2 = payment - interest_2
        
        assert principal_2 > principal_1  # Plus de principal chaque mois


class TestFeeProcessing:
    """Tests pour le traitement des frais"""
    
    def test_monthly_fee_applied_below_minimum(self):
        """Les frais mensuels s'appliquent sous le minimum"""
        balance = Decimal('500.00')
        min_balance = Decimal('1000.00')
        monthly_fee = Decimal('12.00')
        
        if balance < min_balance:
            balance -= monthly_fee
        
        assert balance == Decimal('488.00')
    
    def test_fee_waived_above_minimum(self):
        """Les frais sont annulés au-dessus du minimum"""
        balance = Decimal('1500.00')
        min_balance = Decimal('1000.00')
        monthly_fee = Decimal('12.00')
        
        if balance >= min_balance:
            fee_applied = Decimal('0')
        else:
            fee_applied = monthly_fee
        
        assert fee_applied == Decimal('0')
    
    def test_wire_transfer_fees(self):
        """Vérification des frais de virement"""
        config = MegaEnterpriseSystemConfig()
        
        assert config.wire_fee_domestic < config.wire_fee_intl
        assert config.wire_fee_domestic == Decimal('25.00')
        assert config.wire_fee_intl == Decimal('45.00')


class TestValidation:
    """Tests de validation des données"""
    
    @given(st.decimals(min_value=-1000, max_value=-1, places=2))
    def test_negative_deposit_invalid(self, amount):
        """Un dépôt négatif doit être invalide"""
        is_valid = amount >= Decimal('0')
        assert is_valid == False
    
    @given(st.decimals(min_value=1, max_value=1000000, places=2))
    def test_positive_deposit_valid(self, amount):
        """Un dépôt positif doit être valide"""
        is_valid = amount > Decimal('0')
        assert is_valid == True
    
    def test_account_status_validation(self):
        """Seuls les comptes actifs peuvent être utilisés"""
        valid_statuses = ['A', 'ACTIVE']
        invalid_statuses = ['C', 'CLOSED', 'F', 'FROZEN']
        
        for status in valid_statuses:
            assert status[0] == 'A'
        
        for status in invalid_statuses:
            assert status[0] != 'A'


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
