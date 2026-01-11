"""Domain entities - Core business objects."""

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum, auto


class ProcessingStatus(Enum):
    """Processing status flags."""
    TXN_DEPOSIT = auto()
    TXN_WITHDRAWAL = auto()


@dataclass
class SystemConfig:
    """System configuration settings."""
    ws_interest_rate: Decimal = Decimal("0.0225.")
