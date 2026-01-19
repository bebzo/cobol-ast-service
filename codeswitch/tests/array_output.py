"""ArrayTest - Auto-transpiled from COBOL [Deterministic Transpiler v1.0]"""

from decimal import Decimal, ROUND_HALF_UP
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
import logging
import json

class ArrayTest:
    """Main processor class transpiled from COBOL."""

    def __init__(self):
        """Initialize processor with default values."""
        self.logger = logging.getLogger(__name__)
        self.file_paths: Dict[str, str] = {}
        self.status: str = "initialized"
        self.ws_table: Any = ""  # from WS-TABLE
        self.ws_item: List = [Decimal("0") for _ in range(5)]  # PIC 9(4) [OCCURS 5]
        self.ws_index: Decimal = Decimal("1")  # PIC 9(2)
        self.ws_total: Decimal = Decimal("0")  # PIC 9(6)
        self.ws_value: Decimal = Decimal("100")  # PIC 9(4)

    def p_main_para(self) -> None:
        """Translated from COBOL paragraph: MAIN-PARA"""
        self.ws_item[0] = Decimal("10")
        self.ws_item[1] = Decimal("20")
        self.ws_item[2] = Decimal("30")
        self.ws_item[3] = self.ws_value
        self.ws_total = self.ws_item[0] + self.ws_item[1] + self.ws_item[2]
        self.ws_item[0] += Decimal("5")
        print(self.ws_item[0])
        print(self.ws_item[4])
        print(self.ws_total)
        return

    def _move_corresponding(self, source: Any, dest: Any) -> None:
        """Move corresponding fields from source to dest."""
        if hasattr(source, "__dict__") and hasattr(dest, "__dict__"):
            for key in source.__dict__:
                if hasattr(dest, key):
                    setattr(dest, key, getattr(source, key))

    def run(self):
        """Main entry point."""
        self.p_main_para()

    def call_program(self, name: str, *args) -> Any:
        """Call external program/subroutine."""
        self.logger.info(f"Calling program: {name} with {len(args)} args")
        return None


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    processor = ArrayTest()
    processor.run()
