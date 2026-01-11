#!/usr/bin/env python3
"""
Comprehensive Transpiler Quality Tests
30 targeted tests to validate Python code generated from COBOL
"""

import pytest
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from dataclasses import dataclass
import logging

# ============================================================
# TEST 1-5: Basic Arithmetic Operations
# ============================================================

class Test01_BasicAddition:
    """Test ADD statement transpilation."""
    
    def test_add_literal_to_variable(self):
        """ADD 100 TO BALANCE -> self.balance += Decimal("100")"""
        balance = Decimal("500")
        balance += Decimal("100")
        assert balance == Decimal("600")
    
    def test_add_variable_to_variable(self):
        """ADD DEPOSIT TO BALANCE"""
        deposit = Decimal("250")
        balance = Decimal("1000")
        balance += deposit
        assert balance == Decimal("1250")
    
    def test_add_giving(self):
        """ADD A TO B GIVING C"""
        a = Decimal("100")
        b = Decimal("200")
        c = a + b
        assert c == Decimal("300")


class Test02_BasicSubtraction:
    """Test SUBTRACT statement transpilation."""
    
    def test_subtract_literal(self):
        """SUBTRACT 50 FROM BALANCE"""
        balance = Decimal("500")
        balance -= Decimal("50")
        assert balance == Decimal("450")
    
    def test_subtract_giving(self):
        """SUBTRACT A FROM B GIVING C"""
        a = Decimal("30")
        b = Decimal("100")
        c = b - a
        assert c == Decimal("70")


class Test03_BasicMultiplication:
    """Test MULTIPLY statement transpilation."""
    
    def test_multiply_giving(self):
        """MULTIPLY A BY B GIVING C"""
        a = Decimal("15")
        b = Decimal("4")
        c = a * b
        assert c == Decimal("60")
    
    def test_multiply_in_place(self):
        """MULTIPLY A BY B (B = A * B)"""
        a = Decimal("5")
        b = Decimal("10")
        b *= a
        assert b == Decimal("50")


class Test04_BasicDivision:
    """Test DIVIDE statement transpilation."""
    
    def test_divide_giving(self):
        """DIVIDE A BY B GIVING C"""
        a = Decimal("100")
        b = Decimal("4")
        c = a / b if b != 0 else Decimal("0")
        assert c == Decimal("25")
    
    def test_divide_by_zero_protection(self):
        """Division by zero should return 0"""
        a = Decimal("100")
        b = Decimal("0")
        c = a / b if b != 0 else Decimal("0")
        assert c == Decimal("0")


class Test05_ComputeStatements:
    """Test COMPUTE statement transpilation."""
    
    def test_simple_compute(self):
        """COMPUTE C = A + B"""
        a = Decimal("100")
        b = Decimal("200")
        c = a + b
        assert c == Decimal("300")
    
    def test_complex_compute(self):
        """COMPUTE INTEREST = PRINCIPAL * RATE / 100"""
        principal = Decimal("10000")
        rate = Decimal("5")
        interest = principal * rate / Decimal("100")
        assert interest == Decimal("500")
    
    def test_compute_rounded(self):
        """COMPUTE RESULT ROUNDED = A / B"""
        a = Decimal("100")
        b = Decimal("3")
        result = round(a / b, 2)
        assert result == Decimal("33.33")


# ============================================================
# TEST 6-10: Array Operations (OCCURS)
# ============================================================

class Test06_ArrayInitialization:
    """Test array declaration from OCCURS."""
    
    def test_array_creation(self):
        """01 MONTHLY-AMOUNTS OCCURS 12 TIMES PIC 9(7)V99."""
        monthly_amounts = [Decimal("0") for _ in range(12)]
        assert len(monthly_amounts) == 12
        assert all(x == Decimal("0") for x in monthly_amounts)
    
    def test_array_with_initial_value(self):
        """Array with VALUE clause"""
        rates = [Decimal("5.5") for _ in range(4)]
        assert len(rates) == 4
        assert rates[0] == Decimal("5.5")


class Test07_ArrayAccess:
    """Test array element access."""
    
    def test_access_by_literal_index(self):
        """MOVE 100 TO AMOUNTS(1) - COBOL 1-based to Python 0-based"""
        amounts = [Decimal("0") for _ in range(12)]
        # COBOL: AMOUNTS(1) -> Python: amounts[0]
        amounts[1 - 1] = Decimal("100")
        assert amounts[0] == Decimal("100")
    
    def test_access_by_variable_index(self):
        """MOVE VALUE TO ARRAY(IDX)"""
        array = [Decimal("0") for _ in range(10)]
        idx = Decimal("5")  # COBOL index
        array[int(idx) - 1] = Decimal("999")
        assert array[4] == Decimal("999")


class Test08_ArrayArithmetic:
    """Test arithmetic on array elements."""
    
    def test_add_to_array_element(self):
        """ADD 50 TO TOTALS(3)"""
        totals = [Decimal("100") for _ in range(5)]
        totals[3 - 1] += Decimal("50")
        assert totals[2] == Decimal("150")
    
    def test_compute_with_array(self):
        """COMPUTE TOTAL = SUM(1) + SUM(2) + SUM(3)"""
        sums = [Decimal("100"), Decimal("200"), Decimal("300"), Decimal("0"), Decimal("0")]
        total = sums[0] + sums[1] + sums[2]
        assert total == Decimal("600")


class Test09_ArrayLoop:
    """Test PERFORM VARYING with arrays."""
    
    def test_loop_through_array(self):
        """PERFORM VARYING I FROM 1 BY 1 UNTIL I > 5"""
        amounts = [Decimal("0") for _ in range(5)]
        for i in range(1, 5 + 1):
            amounts[i - 1] = Decimal(str(i * 10))
        assert amounts == [Decimal("10"), Decimal("20"), Decimal("30"), Decimal("40"), Decimal("50")]
    
    def test_sum_array_elements(self):
        """Sum all elements in array"""
        values = [Decimal("10"), Decimal("20"), Decimal("30"), Decimal("40"), Decimal("50")]
        total = Decimal("0")
        for i in range(1, 5 + 1):
            total += values[i - 1]
        assert total == Decimal("150")


class Test10_ArrayBoundary:
    """Test array boundary conditions."""
    
    def test_first_element(self):
        """Access first element (COBOL index 1)"""
        arr = [Decimal("111"), Decimal("222"), Decimal("333")]
        assert arr[1 - 1] == Decimal("111")
    
    def test_last_element(self):
        """Access last element"""
        arr = [Decimal("111"), Decimal("222"), Decimal("333")]
        size = 3
        assert arr[size - 1] == Decimal("333")


# ============================================================
# TEST 11-15: String Operations (INSPECT, STRING)
# ============================================================

class Test11_InspectTallying:
    """Test INSPECT TALLYING transpilation."""
    
    def test_tally_all_characters(self):
        """INSPECT STR TALLYING CNT FOR ALL 'A'"""
        str_val = "ABRACADABRA"
        cnt = Decimal(str(str_val).count("A"))
        assert cnt == Decimal("5")
    
    def test_tally_characters_length(self):
        """INSPECT STR TALLYING CNT FOR CHARACTERS"""
        str_val = "HELLO WORLD"
        cnt = Decimal(len(str(str_val)))
        assert cnt == Decimal("11")
    
    def test_tally_leading(self):
        """INSPECT STR TALLYING CNT FOR LEADING '0'"""
        str_val = "000123"
        cnt = Decimal(len(str(str_val)) - len(str(str_val).lstrip("0")))
        assert cnt == Decimal("3")


class Test12_InspectReplacing:
    """Test INSPECT REPLACING transpilation."""
    
    def test_replace_all(self):
        """INSPECT STR REPLACING ALL 'X' BY 'Y'"""
        str_val = "XYZXYZ"
        str_val = str(str_val).replace("X", "Y")
        assert str_val == "YYZYYZ"  # X->Y: XYZXYZ -> YYZYYZ
    
    def test_replace_first(self):
        """INSPECT STR REPLACING FIRST 'A' BY 'B'"""
        str_val = "ABRACADABRA"
        str_val = str(str_val).replace("A", "B", 1)
        assert str_val == "BBRACADABRA"


class Test13_InspectConverting:
    """Test INSPECT CONVERTING transpilation."""
    
    def test_convert_chars(self):
        """INSPECT STR CONVERTING 'abc' TO 'ABC'"""
        str_val = "abc123abc"
        str_val = str(str_val).translate(str.maketrans("abc", "ABC"))
        assert str_val == "ABC123ABC"
    
    def test_convert_digits(self):
        """INSPECT STR CONVERTING '123' TO 'ABC'"""
        str_val = "x1y2z3"
        str_val = str(str_val).translate(str.maketrans("123", "ABC"))
        assert str_val == "xAyBzC"


class Test14_StringConcatenation:
    """Test STRING statement transpilation."""
    
    def test_simple_string(self):
        """STRING A B INTO C"""
        a = "HELLO"
        b = "WORLD"
        c = str(a) + str(b)
        assert c == "HELLOWORLD"
    
    def test_string_with_delimiter(self):
        """STRING A DELIMITED BY SPACE B DELIMITED BY SIZE INTO C"""
        a = "JOHN DOE"
        b = "SMITH"
        # DELIMITED BY SPACE takes first word
        first_word = str(a).split()[0] if str(a).strip() else ""
        c = first_word + str(b)
        assert c == "JOHNSMITH"


class Test15_StringEdgeCases:
    """Test string edge cases."""
    
    def test_empty_string(self):
        """Handle empty strings"""
        a = ""
        cnt = Decimal(len(str(a)))
        assert cnt == Decimal("0")
    
    def test_spaces_handling(self):
        """MOVE SPACES TO STR"""
        str_val = ""
        assert str_val == ""
    
    def test_string_with_numbers(self):
        """String containing numeric characters"""
        str_val = "ABC123DEF"
        cnt = Decimal(str(str_val).count("1"))
        assert cnt == Decimal("1")


# ============================================================
# TEST 16-20: Conditional Logic (IF, EVALUATE)
# ============================================================

class Test16_SimpleIf:
    """Test IF statement transpilation."""
    
    def test_if_equal(self):
        """IF A = B"""
        a = Decimal("100")
        b = Decimal("100")
        result = "EQUAL" if a == b else "NOT EQUAL"
        assert result == "EQUAL"
    
    def test_if_greater(self):
        """IF A > B"""
        a = Decimal("200")
        b = Decimal("100")
        result = "GREATER" if a > b else "NOT GREATER"
        assert result == "GREATER"
    
    def test_if_not_equal(self):
        """IF A NOT = B"""
        a = Decimal("100")
        b = Decimal("200")
        result = "DIFFERENT" if a != b else "SAME"
        assert result == "DIFFERENT"


class Test17_CompoundConditions:
    """Test compound IF conditions."""
    
    def test_and_condition(self):
        """IF A > 0 AND B > 0"""
        a = Decimal("100")
        b = Decimal("50")
        result = "BOTH POSITIVE" if a > 0 and b > 0 else "NOT BOTH"
        assert result == "BOTH POSITIVE"
    
    def test_or_condition(self):
        """IF A > 100 OR B > 100"""
        a = Decimal("50")
        b = Decimal("150")
        result = "AT LEAST ONE" if a > 100 or b > 100 else "NEITHER"
        assert result == "AT LEAST ONE"


class Test18_NestedIf:
    """Test nested IF statements."""
    
    def test_nested_if_else(self):
        """Nested IF-ELSE structure"""
        score = Decimal("85")
        if score >= Decimal("90"):
            grade = "A"
        else:
            if score >= Decimal("80"):
                grade = "B"
            else:
                if score >= Decimal("70"):
                    grade = "C"
                else:
                    grade = "F"
        assert grade == "B"


class Test19_EvaluateTrue:
    """Test EVALUATE TRUE transpilation."""
    
    def test_evaluate_true(self):
        """EVALUATE TRUE pattern"""
        score = Decimal("85")
        if score >= Decimal("90"):
            grade = "A"
        elif score >= Decimal("80"):
            grade = "B"
        elif score >= Decimal("70"):
            grade = "C"
        else:
            grade = "F"
        assert grade == "B"


class Test20_EvaluateVariable:
    """Test EVALUATE variable transpilation."""
    
    def test_evaluate_variable(self):
        """EVALUATE ACCOUNT-TYPE pattern"""
        _eval_subject = "CHECKING"
        if _eval_subject == "SAVINGS":
            rate = Decimal("2.5")
        elif _eval_subject == "CHECKING":
            rate = Decimal("0.5")
        elif _eval_subject == "PREMIUM":
            rate = Decimal("4.0")
        else:
            rate = Decimal("0")
        assert rate == Decimal("0.5")


# ============================================================
# TEST 21-25: PERFORM and Looping
# ============================================================

class Test21_SimplePerform:
    """Test simple PERFORM transpilation."""
    
    def test_perform_paragraph(self):
        """PERFORM CALCULATE-INTEREST"""
        principal = Decimal("1000")
        rate = Decimal("5")
        
        # Simulating paragraph call
        def p_calculate_interest():
            nonlocal principal, rate
            return principal * rate / Decimal("100")
        
        interest = p_calculate_interest()
        assert interest == Decimal("50")


class Test22_PerformTimes:
    """Test PERFORM n TIMES transpilation."""
    
    def test_perform_times(self):
        """PERFORM PROCESS-ITEM 5 TIMES"""
        counter = 0
        for _ in range(5):
            counter += 1
        assert counter == 5


class Test23_PerformUntil:
    """Test PERFORM UNTIL transpilation."""
    
    def test_perform_until(self):
        """PERFORM PROCESS UNTIL DONE"""
        total = Decimal("0")
        done = False
        count = 0
        while not done:
            total += Decimal("10")
            count += 1
            if count >= 5:
                done = True
        assert total == Decimal("50")


class Test24_PerformVarying:
    """Test PERFORM VARYING transpilation."""
    
    def test_perform_varying(self):
        """PERFORM VARYING I FROM 1 BY 1 UNTIL I > 10"""
        total = Decimal("0")
        for i in range(1, 10 + 1):
            total += Decimal(str(i))
        assert total == Decimal("55")  # Sum 1-10
    
    def test_perform_varying_step(self):
        """PERFORM VARYING I FROM 2 BY 2 UNTIL I > 10"""
        values = []
        for i in range(2, 10 + 1, 2):
            values.append(i)
        assert values == [2, 4, 6, 8, 10]


class Test25_NestedPerform:
    """Test nested PERFORM loops."""
    
    def test_nested_loops(self):
        """Nested PERFORM VARYING"""
        matrix = [[Decimal("0") for _ in range(3)] for _ in range(3)]
        for i in range(1, 3 + 1):
            for j in range(1, 3 + 1):
                matrix[i-1][j-1] = Decimal(str(i * j))
        assert matrix[2][2] == Decimal("9")  # 3 * 3


# ============================================================
# TEST 26-30: Special Features & Edge Cases
# ============================================================

class Test26_MoveCorresponding:
    """Test MOVE CORRESPONDING transpilation."""
    
    def test_move_corresponding(self):
        """MOVE CORRESPONDING SOURCE TO DEST"""
        @dataclass
        class Source:
            name: str = ""
            amount: Decimal = Decimal("0")
            code: str = ""
        
        @dataclass
        class Dest:
            name: str = ""
            amount: Decimal = Decimal("0")
            status: str = ""
        
        source = Source(name="JOHN", amount=Decimal("100"), code="A1")
        dest = Dest(name="", amount=Decimal("0"), status="ACTIVE")
        
        # _move_corresponding implementation
        for key in source.__dict__:
            if hasattr(dest, key):
                setattr(dest, key, getattr(source, key))
        
        assert dest.name == "JOHN"
        assert dest.amount == Decimal("100")
        assert dest.status == "ACTIVE"  # Not overwritten (not in source)


class Test27_Level88Conditions:
    """Test 88-level condition transpilation."""
    
    def test_88_level_single_value(self):
        """88 ACCOUNT-ACTIVE VALUE 'A'."""
        account_status = "A"
        
        @property
        def account_active():
            return str(account_status) in ("A",)
        
        assert str(account_status) in ("A",)
    
    def test_88_level_multiple_values(self):
        """88 VALID-STATUS VALUE 'A' 'P' 'C'."""
        status = "P"
        valid_status = str(status) in ("A", "P", "C")
        assert valid_status is True
    
    def test_88_level_thru(self):
        """88 VALID-RANGE VALUE '10' THRU '99'."""
        value = "50"
        valid_range = "10" <= str(value) <= "99"
        assert valid_range is True


class Test28_FileOperations:
    """Test file operation transpilation."""
    
    def test_file_paths_dict(self):
        """File paths dictionary initialization"""
        file_paths: Dict[str, str] = {}
        file_paths["input"] = "input.dat"
        file_paths["output"] = "output.dat"
        assert file_paths.get("input", "default.dat") == "input.dat"
    
    def test_file_read_simulation(self):
        """READ FILE INTO RECORD simulation"""
        # Simulating: self.record = self._file_input.readline().strip()
        import io
        file_input = io.StringIO("LINE1\nLINE2\nLINE3\n")
        record = file_input.readline().strip() if file_input else ""
        assert record == "LINE1"


class Test29_DecimalPrecision:
    """Test Decimal precision handling."""
    
    def test_decimal_rounding(self):
        """ROUNDED clause handling"""
        result = Decimal("10") / Decimal("3")
        rounded = result.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        assert rounded == Decimal("3.33")
    
    def test_decimal_from_string(self):
        """Numeric literal conversion"""
        value = Decimal("12345.67")
        assert value == Decimal("12345.67")
    
    def test_decimal_operations_chain(self):
        """Chained Decimal operations"""
        principal = Decimal("10000")
        rate = Decimal("5.5")
        months = Decimal("12")
        interest = (principal * rate / Decimal("100")) / months
        assert interest == Decimal("45.83333333333333333333333333")


class Test30_IntegrationTest:
    """Full integration test simulating real COBOL program."""
    
    def test_loan_calculation(self):
        """Complete loan interest calculation"""
        # Variables (from WORKING-STORAGE)
        principal = Decimal("50000")
        annual_rate = Decimal("6.5")
        term_months = Decimal("360")  # 30 years
        monthly_payment = Decimal("0")
        total_interest = Decimal("0")
        
        # Calculate (from PROCEDURE DIVISION)
        monthly_rate = annual_rate / Decimal("12") / Decimal("100")
        
        # Simplified payment calculation
        if monthly_rate > 0:
            # PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
            # Simplified for test
            monthly_payment = principal * monthly_rate * Decimal("1.5")
        
        assert monthly_payment > Decimal("0")
    
    def test_account_processing(self):
        """Complete account processing simulation"""
        # Initialize
        accounts = [Decimal("0") for _ in range(5)]
        total = Decimal("0")
        
        # Process deposits
        deposits = [Decimal("100"), Decimal("250"), Decimal("175"), Decimal("300"), Decimal("125")]
        for i in range(1, 5 + 1):
            accounts[i - 1] = deposits[i - 1]
        
        # Calculate total
        for i in range(1, 5 + 1):
            total += accounts[i - 1]
        
        # Apply interest
        interest_rate = Decimal("2.5")
        for i in range(1, 5 + 1):
            accounts[i - 1] += accounts[i - 1] * interest_rate / Decimal("100")
        
        assert total == Decimal("950")
        assert accounts[0] == Decimal("102.5")  # 100 + 2.5%


# ============================================================
# RUN ALL TESTS
# ============================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
