"""LoopTest - Auto-transpiled from COBOL [Deterministic Transpiler v1.0]"""

from decimal import Decimal, ROUND_HALF_UP
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
import logging
import json

class LoopTest:
    """Main processor class transpiled from COBOL."""

    def __init__(self):
        """Initialize processor with default values."""
        self.logger = logging.getLogger(__name__)
        self.file_paths: Dict[str, str] = {}
        self.status: str = "initialized"
        self.ws_i: Decimal = Decimal("0")  # PIC 9(2)

    def p_main(self) -> None:
        """Translated from COBOL paragraph: MAIN"""
        while self.ws_i < Decimal("10"):
            self.ws_i += Decimal("1")
            print(self.ws_i)
        print("DONE")
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
    processor = LoopTest()
    processor.run()
