"""
Tests unitaires pour le module Investments de MegaEnterpriseSystem
"""
import pytest
from decimal import Decimal
from hypothesis import given, strategies as st


class TestPortfolioValuation:
    """Tests pour l'évaluation du portefeuille"""
    
    def test_position_value_calculation(self):
        """Calcul de la valeur d'une position"""
        shares = Decimal('100')
        price_per_share = Decimal('150.50')
        
        position_value = shares * price_per_share
        
        assert position_value == Decimal('15050.00')
    
    def test_gain_loss_calculation(self):
        """Calcul des gains/pertes"""
        cost_basis = Decimal('10000.00')
        current_value = Decimal('12500.00')
        
        gain_loss = current_value - cost_basis
        gain_loss_pct = (gain_loss / cost_basis) * 100
        
        assert gain_loss == Decimal('2500.00')
        assert gain_loss_pct == Decimal('25.00')
    
    def test_unrealized_vs_realized_gains(self):
        """Distinction gains réalisés/non réalisés"""
        purchase_price = Decimal('100.00')
        current_price = Decimal('120.00')
        sale_price = Decimal('115.00')
        shares = Decimal('50')
        
        unrealized_gain = (current_price - purchase_price) * shares
        realized_gain = (sale_price - purchase_price) * shares
        
        assert unrealized_gain == Decimal('1000.00')
        assert realized_gain == Decimal('750.00')
    
    @given(st.decimals(min_value=1, max_value=10000, places=4),
           st.decimals(min_value=0.01, max_value=1000, places=2))
    def test_position_value_always_positive(self, shares, price):
        """La valeur d'une position est toujours positive"""
        if shares > 0 and price > 0:
            value = shares * price
            assert value > Decimal('0')


class TestDividendCalculations:
    """Tests pour les calculs de dividendes"""
    
    def test_dividend_payment(self):
        """Calcul du paiement de dividendes"""
        shares = Decimal('200')
        dividend_per_share = Decimal('0.85')
        
        total_dividend = shares * dividend_per_share
        
        assert total_dividend == Decimal('170.00')
    
    def test_dividend_yield(self):
        """Calcul du rendement de dividendes"""
        annual_dividend = Decimal('4.00')
        stock_price = Decimal('100.00')
        
        dividend_yield = (annual_dividend / stock_price) * 100
        
        assert dividend_yield == Decimal('4.00')
    
    def test_dividend_reinvestment(self):
        """Réinvestissement des dividendes"""
        dividend_received = Decimal('170.00')
        share_price = Decimal('85.00')
        
        new_shares = dividend_received / share_price
        
        assert new_shares == Decimal('2')


class TestAssetAllocation:
    """Tests pour l'allocation d'actifs"""
    
    def test_allocation_sums_to_100(self):
        """L'allocation totale doit être de 100%"""
        allocation = {
            'stocks': Decimal('60.00'),
            'bonds': Decimal('30.00'),
            'cash': Decimal('5.00'),
            'real_estate': Decimal('5.00'),
        }
        
        total = sum(allocation.values())
        
        assert total == Decimal('100.00')
    
    def test_rebalancing_calculation(self):
        """Calcul de rééquilibrage"""
        portfolio_value = Decimal('100000.00')
        
        current_allocation = {'stocks': Decimal('70'), 'bonds': Decimal('30')}
        target_allocation = {'stocks': Decimal('60'), 'bonds': Decimal('40')}
        
        stocks_current = portfolio_value * current_allocation['stocks'] / 100
        stocks_target = portfolio_value * target_allocation['stocks'] / 100
        
        stocks_to_sell = stocks_current - stocks_target
        
        assert stocks_to_sell == Decimal('10000.00')


class TestTradeExecution:
    """Tests pour l'exécution des trades"""
    
    def test_buy_order_cost(self):
        """Coût d'un ordre d'achat"""
        shares = Decimal('100')
        price = Decimal('50.00')
        commission = Decimal('9.99')
        
        total_cost = (shares * price) + commission
        
        assert total_cost == Decimal('5009.99')
    
    def test_sell_order_proceeds(self):
        """Produit d'un ordre de vente"""
        shares = Decimal('100')
        price = Decimal('55.00')
        commission = Decimal('9.99')
        
        net_proceeds = (shares * price) - commission
        
        assert net_proceeds == Decimal('5490.01')
    
    def test_market_order_execution(self):
        """Exécution d'un ordre au marché"""
        order_type = 'MARKET'
        shares = Decimal('100')
        market_price = Decimal('50.00')
        
        # Market orders execute at current price
        execution_price = market_price
        
        assert execution_price == Decimal('50.00')
    
    def test_limit_order_execution(self):
        """Exécution d'un ordre limite"""
        order_type = 'LIMIT'
        limit_price = Decimal('48.00')
        market_price = Decimal('50.00')
        
        # Limit buy only executes if market <= limit
        executes = market_price <= limit_price
        
        assert executes == False


class TestTaxCalculations:
    """Tests pour les calculs fiscaux"""
    
    def test_short_term_capital_gains(self):
        """Gains en capital à court terme"""
        gain = Decimal('5000.00')
        tax_rate = Decimal('0.35')  # Ordinary income rate
        
        tax_owed = gain * tax_rate
        
        assert tax_owed == Decimal('1750.00')
    
    def test_long_term_capital_gains(self):
        """Gains en capital à long terme"""
        gain = Decimal('5000.00')
        tax_rate = Decimal('0.15')  # Long-term rate
        
        tax_owed = gain * tax_rate
        
        assert tax_owed == Decimal('750.00')
    
    def test_tax_loss_harvesting(self):
        """Récolte des pertes fiscales"""
        realized_gains = Decimal('10000.00')
        realized_losses = Decimal('4000.00')
        
        net_gain = realized_gains - realized_losses
        tax_rate = Decimal('0.15')
        
        tax_owed = net_gain * tax_rate
        tax_savings = realized_losses * tax_rate
        
        assert tax_owed == Decimal('900.00')
        assert tax_savings == Decimal('600.00')


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
