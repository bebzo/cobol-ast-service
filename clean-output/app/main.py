"""BankingSystem - Main Application Orchestrator."""

import logging
from typing import Dict, Any

# Import domain services
from domain.core_service import CoreService
from domain.lifecycle_service import LifecycleService
from domain.utilities_service import UtilitiesService
from domain.fraud_detection_service import FraudDetectionService

# Import repositories
from infra.repositories.core_repository import InMemoryCoreRepository
from infra.repositories.lifecycle_repository import InMemoryLifecycleRepository
from infra.repositories.utilities_repository import InMemoryUtilitiesRepository
from infra.repositories.fraud_detection_repository import InMemoryFraudDetectionRepository


class BankingSystem:
    """Main application orchestrator."""

    def __init__(self):
        """Initialize with all services."""
        self.logger = logging.getLogger(__name__)

        # Initialize repositories
        self._core_repo = InMemoryCoreRepository()
        self._lifecycle_repo = InMemoryLifecycleRepository()
        self._utilities_repo = InMemoryUtilitiesRepository()
        self._fraud_detection_repo = InMemoryFraudDetectionRepository()

        # Initialize services with dependency injection
        self.core = CoreService(self._core_repo)
        self.lifecycle = LifecycleService(self._lifecycle_repo)
        self.utilities = UtilitiesService(self._utilities_repo)
        self.fraud_detection = FraudDetectionService(self._fraud_detection_repo)

    def run(self):
        """Main entry point."""
        self.logger.info("Starting application...")
        # Orchestrate domain services as needed
        pass


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    app = BankingSystem()
    app.run()