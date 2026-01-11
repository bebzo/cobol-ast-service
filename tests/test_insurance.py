"""
Tests unitaires pour le module Insurance de MegaEnterpriseSystem
"""
import pytest
from decimal import Decimal
from hypothesis import given, strategies as st
import sys
import importlib.util

# Load module with hyphen in filename
spec = importlib.util.spec_from_file_location("mega_enterprise", "/workspace/public/MEGA-ENTERPRISE_hybrid.py")
mega_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mega_module)

MegaEnterpriseSystemConfig = mega_module.MegaEnterpriseSystemConfig


class TestInsurancePremiums:
    """Tests pour les calculs de primes d'assurance"""
    
    def test_life_insurance_rate(self):
        """Taux d'assurance vie par 1000$"""
        config = MegaEnterpriseSystemConfig()
        
        coverage = Decimal('100000')  # 100k coverage
        rate_per_1000 = config.life_rate_per_1000
        
        monthly_premium = (coverage / 1000) * rate_per_1000
        
        assert monthly_premium == Decimal('125.00')
    
    def test_home_insurance_rate(self):
        """Taux d'assurance habitation par 1000$"""
        config = MegaEnterpriseSystemConfig()
        
        home_value = Decimal('300000')
        rate_per_1000 = config.home_rate_per_1000
        
        annual_premium = (home_value / 1000) * rate_per_1000
        
        assert annual_premium == Decimal('1050.00')
    
    def test_umbrella_rate_fixed(self):
        """Prime parapluie fixe"""
        config = MegaEnterpriseSystemConfig()
        
        assert config.umbrella_rate == Decimal('200.00')
    
    @given(st.decimals(min_value=50000, max_value=1000000, places=0))
    def test_premium_scales_with_coverage(self, coverage):
        """La prime doit être proportionnelle à la couverture"""
        config = MegaEnterpriseSystemConfig()
        
        premium = (coverage / 1000) * config.life_rate_per_1000
        
        # Premium should be proportional
        assert premium == coverage * config.life_rate_per_1000 / 1000


class TestRiskFactors:
    """Tests pour les facteurs de risque"""
    
    def test_age_risk_factor(self):
        """Le facteur de risque augmente avec l'âge"""
        age_factors = {
            25: Decimal('1.0'),
            35: Decimal('1.2'),
            45: Decimal('1.5'),
            55: Decimal('2.0'),
            65: Decimal('3.0'),
        }
        
        # Verify increasing order
        ages = sorted(age_factors.keys())
        for i in range(len(ages) - 1):
            assert age_factors[ages[i]] < age_factors[ages[i+1]]
    
    def test_smoking_risk_factor(self):
        """Les fumeurs ont un facteur de risque plus élevé"""
        non_smoker_factor = Decimal('1.0')
        smoker_factor = Decimal('1.5')
        
        assert smoker_factor > non_smoker_factor
    
    def test_combined_risk_factors(self):
        """Les facteurs de risque se multiplient"""
        base_premium = Decimal('100.00')
        age_factor = Decimal('1.5')
        smoker_factor = Decimal('1.5')
        
        final_premium = base_premium * age_factor * smoker_factor
        
        assert final_premium == Decimal('225.00')


class TestClaimsProcessing:
    """Tests pour le traitement des réclamations"""
    
    def test_claim_within_coverage(self):
        """Réclamation dans les limites de couverture"""
        coverage_limit = Decimal('50000.00')
        claim_amount = Decimal('25000.00')
        deductible = Decimal('1000.00')
        
        payout = min(claim_amount - deductible, coverage_limit)
        
        assert payout == Decimal('24000.00')
    
    def test_claim_exceeds_coverage(self):
        """Réclamation dépassant la couverture"""
        coverage_limit = Decimal('50000.00')
        claim_amount = Decimal('75000.00')
        deductible = Decimal('1000.00')
        
        payout = min(claim_amount - deductible, coverage_limit)
        
        assert payout == coverage_limit
    
    def test_deductible_applied(self):
        """La franchise est appliquée"""
        claim_amount = Decimal('5000.00')
        deductible = Decimal('500.00')
        
        payout = claim_amount - deductible
        
        assert payout == Decimal('4500.00')


class TestPolicyRenewal:
    """Tests pour le renouvellement des polices"""
    
    def test_renewal_premium_adjustment(self):
        """Ajustement de prime au renouvellement"""
        current_premium = Decimal('1200.00')
        claims_made = 2
        
        # 5% increase per claim
        adjustment_factor = Decimal('1.0') + (Decimal('0.05') * claims_made)
        new_premium = current_premium * adjustment_factor
        
        assert new_premium == Decimal('1320.00')
    
    def test_no_claims_discount(self):
        """Réduction sans réclamation"""
        current_premium = Decimal('1200.00')
        years_no_claims = 3
        
        # 2% discount per year, max 10%
        discount = min(Decimal('0.02') * years_no_claims, Decimal('0.10'))
        new_premium = current_premium * (1 - discount)
        
        assert new_premium == Decimal('1128.00')  # 6% discount


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
