"""Bank - Auto-transpiled from COBOL [Deterministic Transpiler v1.0]"""
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any
import logging

class Bank:
    """Main processor class transpiled from COBOL."""
    def __init__(self):
        """Initialize processor with default values."""
        self.logger = logging.getLogger(__name__)
        self.file_paths: Dict[str, str] = {}
        self.status: str = "initialized"
        self.ws_bal: Decimal = Decimal("1000.00")  # PIC 9(7)V99
        self.ws_rate: Decimal = Decimal("0.05")  # PIC 9V99
        self.ws_yr: Decimal = Decimal("0")  # PIC 99

    def p_main(self) -> None:
        """Translated from COBOL paragraph: MAIN"""
        while self.ws_yr <= Decimal("5"): self.p_loop()
        print(self.ws_bal)
        return

    def p_loop(self) -> None:
        """Translated from COBOL paragraph: LOOP"""
        self.ws_bal = self.ws_bal * (1 + self.ws_rate)
        self.ws_yr += Decimal("1")

    def run(self):
        """Main entry point."""
        self.p_main()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    processor = Bank()
    processor.run()
