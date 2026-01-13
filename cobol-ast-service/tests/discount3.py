"""Discount - Auto-transpiled from COBOL [Deterministic Transpiler v1.0]"""

from decimal import Decimal, ROUND_HALF_UP
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
import logging
import json

class Discount:
    """Main processor class transpiled from COBOL."""

    def __init__(self):
        """Initialize processor with default values."""
        self.logger = logging.getLogger(__name__)
        self.file_paths: Dict[str, str] = {}
        self.status: str = "initialized"
        self.ws_amount: Decimal = Decimal("1500.00")  # PIC 9(6)V99
        self.ws_discount: Decimal = Decimal("0.00")  # PIC 9(5)V99

    def p_main(self) -> None:
        """Translated from COBOL paragraph: MAIN"""
        if self.ws_amount > 1000:
            self.ws_discount = self.ws_amount * Decimal("0.15")
        else:
            self.ws_discount = self.ws_amount * Decimal("0.05")
        self.ws_amount -= self.ws_discount
        print(self.ws_amount)
        return

    def run(self):
        """Main entry point."""
        self.p_main()

    def call_program(self, name: str, *args) -> Any:
        """Call external program/subroutine."""
        self.logger.info(f"Calling program: {name} with {len(args)} args")
        return None


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    processor = Discount()
    processor.run()
