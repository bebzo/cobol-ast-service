"""FraudDetection Repository - Data access interface for fraud_detection."""

from typing import Protocol, Optional, List, Dict, Any
from decimal import Decimal
from datetime import date


class FraudDetectionRepository(Protocol):
    """Repository interface for fraud detection data access.
    
    This is a Port (interface) - implement with concrete adapters.
    """
    
    def find_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        """Find entity by ID."""
        ...
    
    def find_all(self, filters: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Find all entities matching filters."""
        ...
    
    def save(self, entity: Dict[str, Any]) -> str:
        """Save entity and return ID."""
        ...
    
    def update(self, id: str, data: Dict[str, Any]) -> bool:
        """Update entity by ID."""
        ...
    
    def delete(self, id: str) -> bool:
        """Delete entity by ID."""
        ...


class InMemoryFraudDetectionRepository:
    """In-memory implementation for testing."""
    
    def __init__(self):
        self._storage: Dict[str, Dict[str, Any]] = {}
        self._next_id = 1
    
    def find_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        return self._storage.get(id)
    
    def find_all(self, filters: Optional[Dict] = None) -> List[Dict[str, Any]]:
        results = list(self._storage.values())
        if filters:
            for key, value in filters.items():
                results = [r for r in results if r.get(key) == value]
        return results
    
    def save(self, entity: Dict[str, Any]) -> str:
        id = str(self._next_id)
        self._next_id += 1
        entity['id'] = id
        self._storage[id] = entity
        return id
    
    def update(self, id: str, data: Dict[str, Any]) -> bool:
        if id in self._storage:
            self._storage[id].update(data)
            return True
        return False
    
    def delete(self, id: str) -> bool:
        if id in self._storage:
            del self._storage[id]
            return True
        return False
