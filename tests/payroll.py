"""PayrollCalc - Auto-transpiled from COBOL [Deterministic Transpiler v1.0]"""

from decimal import Decimal, ROUND_HALF_UP
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
import logging
import json

class PayrollCalc:
    """Main processor class transpiled from COBOL."""

    def __init__(self):
        """Initialize processor with default values."""
        self.logger = logging.getLogger(__name__)
        self.file_paths: Dict[str, str] = {}
        self.status: str = "initialized"
        self.ws_hours: Decimal = Decimal("45")  # PIC 9(3)
        self.ws_rate: Decimal = Decimal("25.00")  # PIC 9(4)V99
        self.ws_regular_pay: Decimal = Decimal("0.00")  # PIC 9(6)V99
        self.ws_overtime_pay: Decimal = Decimal("0.00")  # PIC 9(6)V99
        self.ws_total_pay: Decimal = Decimal("0.00")  # PIC 9(6)V99

    def p_calc_pay(self) -> None:
        """Translated from COBOL paragraph: CALC-PAY"""
        if self.ws_hours > 40:
            self.ws_regular_pay = 40 * self.ws_rate
            self.ws_overtime_pay = (self.ws_hours - 40) * self.ws_rate * Decimal("1.5")
        else:
            self.ws_regular_pay = self.ws_hours * self.ws_rate
            self.ws_overtime_pay = Decimal("0")
        self.ws_total_pay = self.ws_regular_pay + self.ws_overtime_pay
        print(self.ws_total_pay)
        return

    def run(self):
        """Main entry point."""
        self.p_calc_pay()

    def call_program(self, name: str, *args) -> Any:
        """Call external program/subroutine."""
        self.logger.info(f"Calling program: {name} with {len(args)} args")
        return None


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    processor = PayrollCalc()
    processor.run()
