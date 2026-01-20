"""Basic service tests."""

import pytest
from decimal import Decimal

from domain.core_service import CoreService
from infra.repositories.core_repository import InMemoryCoreRepository
from domain.lifecycle_service import LifecycleService
from infra.repositories.lifecycle_repository import InMemoryLifecycleRepository
from domain.utilities_service import UtilitiesService
from infra.repositories.utilities_repository import InMemoryUtilitiesRepository
from domain.fraud_detection_service import FraudDetectionService
from infra.repositories.fraud_detection_repository import InMemoryFraudDetectionRepository


# Fixtures

@pytest.fixture
def core_service():
    """Create CoreService with in-memory repository."""
    repo = InMemoryCoreRepository()
    return CoreService(repo)

@pytest.fixture
def lifecycle_service():
    """Create LifecycleService with in-memory repository."""
    repo = InMemoryLifecycleRepository()
    return LifecycleService(repo)

@pytest.fixture
def utilities_service():
    """Create UtilitiesService with in-memory repository."""
    repo = InMemoryUtilitiesRepository()
    return UtilitiesService(repo)

@pytest.fixture
def fraud_detection_service():
    """Create FraudDetectionService with in-memory repository."""
    repo = InMemoryFraudDetectionRepository()
    return FraudDetectionService(repo)


# Basic tests

class TestCoreService:
    """Tests for CoreService."""

    def test_service_initialization(self, core_service):
        """Test service can be instantiated."""
        assert core_service is not None
        assert core_service.repository is not None

    def test_main_control(self, core_service):
        """Test main_control method exists."""
        assert hasattr(core_service, 'main_control')

class TestLifecycleService:
    """Tests for LifecycleService."""

    def test_service_initialization(self, lifecycle_service):
        """Test service can be instantiated."""
        assert lifecycle_service is not None
        assert lifecycle_service.repository is not None

    def test_initialization(self, lifecycle_service):
        """Test initialization method exists."""
        assert hasattr(lifecycle_service, 'initialization')

class TestUtilitiesService:
    """Tests for UtilitiesService."""

    def test_service_initialization(self, utilities_service):
        """Test service can be instantiated."""
        assert utilities_service is not None
        assert utilities_service.repository is not None

    def test_validate_deposit(self, utilities_service):
        """Test validate_deposit method exists."""
        assert hasattr(utilities_service, 'validate_deposit')

class TestFraudDetectionService:
    """Tests for FraudDetectionService."""

    def test_service_initialization(self, fraud_detection_service):
        """Test service can be instantiated."""
        assert fraud_detection_service is not None
        assert fraud_detection_service.repository is not None

    def test_fraud_check(self, fraud_detection_service):
        """Test fraud_check method exists."""
        assert hasattr(fraud_detection_service, 'fraud_check')