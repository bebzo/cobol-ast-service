"""
Configuration pytest pour les tests MegaEnterpriseSystem
"""
import pytest
import sys
from decimal import Decimal
from pathlib import Path

# Ajouter le chemin du module
sys.path.insert(0, str(Path(__file__).parent.parent / 'public'))


@pytest.fixture
def sample_account():
    """Compte bancaire exemple pour les tests"""
    return {
        'account_id': 'ACC-001234',
        'account_type': 'SAVINGS',
        'balance': Decimal('10000.00'),
        'available': Decimal('10000.00'),
        'min_balance': Decimal('500.00'),
        'overdraft_limit': Decimal('1000.00'),
        'interest_rate': Decimal('0.0225'),
        'status': 'ACTIVE',
    }


@pytest.fixture
def sample_loan():
    """Prêt exemple pour les tests"""
    return {
        'loan_id': 'LOAN-005678',
        'loan_type': 'MORTGAGE',
        'principal': Decimal('250000.00'),
        'current_balance': Decimal('245000.00'),
        'interest_rate': Decimal('0.0699'),
        'term_months': 360,
        'monthly_payment': Decimal('1663.26'),
        'status': 'ACTIVE',
    }


@pytest.fixture
def sample_policy():
    """Police d'assurance exemple pour les tests"""
    return {
        'policy_id': 'POL-009012',
        'policy_type': 'LIFE',
        'coverage_amount': Decimal('500000.00'),
        'premium': Decimal('625.00'),
        'deductible': Decimal('0.00'),
        'status': 'ACTIVE',
    }


@pytest.fixture
def sample_portfolio():
    """Portefeuille d'investissement exemple pour les tests"""
    return {
        'portfolio_id': 'PORT-003456',
        'total_value': Decimal('150000.00'),
        'cost_basis': Decimal('120000.00'),
        'unrealized_gain': Decimal('30000.00'),
        'positions': [
            {'symbol': 'AAPL', 'shares': Decimal('50'), 'price': Decimal('180.00')},
            {'symbol': 'MSFT', 'shares': Decimal('30'), 'price': Decimal('350.00')},
            {'symbol': 'GOOGL', 'shares': Decimal('20'), 'price': Decimal('140.00')},
        ],
    }


@pytest.fixture
def decimal_precision():
    """Configuration de précision pour les calculs Decimal"""
    return {
        'monetary': 2,
        'rates': 6,
        'percentages': 4,
    }


# Markers personnalisés
def pytest_configure(config):
    config.addinivalue_line("markers", "slow: marks tests as slow")
    config.addinivalue_line("markers", "integration: marks tests as integration tests")
    config.addinivalue_line("markers", "financial: marks tests involving financial calculations")
