"""Factorial - Auto-transpiled from COBOL [Deterministic Transpiler v1.0]"""

from decimal import Decimal, ROUND_HALF_UP
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
import logging
import json

class Factorial:
    """Main processor class transpiled from COBOL."""

    def __init__(self):
        """Initialize processor with default values."""
        self.logger = logging.getLogger(__name__)
        self.file_paths: Dict[str, str] = {}
        self.status: str = "initialized"
        self.ws_n: Decimal = Decimal("5")  # PIC 9(2)
        self.ws_result: Decimal = Decimal("1")  # PIC 9(10)
        self.ws_counter: Decimal = Decimal("1")  # PIC 9(2)

    def p_calc_factorial(self) -> None:
        """Translated from COBOL paragraph: CALC-FACTORIAL"""
        self.ws_result = Decimal("1")
        self.ws_counter = Decimal("1")
        self.ws_result *= self.ws_counter
        self.ws_counter += Decimal("1")
        print(self.ws_result)
        return

    def run(self):
        """Main entry point."""
        self.p_calc_factorial()

    def call_program(self, name: str, *args) -> Any:
        """Call external program/subroutine."""
        self.logger.info(f"Calling program: {name} with {len(args)} args")
        return None


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    processor = Factorial()
    processor.run()
