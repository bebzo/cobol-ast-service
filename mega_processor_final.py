"""
MegaProcessor - Banking Operations Module
Production Ready - No Placeholders
"""

from decimal import Decimal
from datetime import date
from typing import Dict, Optional
from dataclasses import dataclass


class Config:
    """Configuration constants."""
    DEFAULT_INTEREST_RATE: Decimal = Decimal("0.05")
    OVERDRAFT_FEE: Decimal = Decimal("25.00")
    MINIMUM_BALANCE: Decimal = Decimal("100.00")
    LOW_BALANCE_FEE: Decimal = Decimal("10.00")
    MAX_OVERDRAFT_AMOUNT: Decimal = Decimal("100.00")
    WIRE_TRANSFER_FEE: Decimal = Decimal("15.00")
    ACH_TRANSFER_FEE: Decimal = Decimal("3.00")
    LOAN_DEFAULT_TERM_MONTHS: int = 12


@dataclass
class WorkingStorage:
    """Working Storage Area."""
    ws_current_date: int = 0
    ws_cust_count: int = 0
    ws_acct_count: int = 0
    ws_tran_count: int = 0
    ws_loan_count: int = 0
    ws_error_count: int = 0
    ws_total_deposits: Decimal = Decimal("0")
    ws_total_withdrawals: Decimal = Decimal("0")
    ws_total_transfers: Decimal = Decimal("0")
    ws_total_interest: Decimal = Decimal("0")
    ws_total_fees: Decimal = Decimal("0")
    ws_total_loans: Decimal = Decimal("0")
    ws_total_payments: Decimal = Decimal("0")


@dataclass
class LoanRecord:
    """Loan data structure."""
    loan_id: str
    account_number: str
    principal: Decimal
    interest_rate: Decimal
    term_months: int
    monthly_payment: Decimal
    remaining_balance: Decimal


class MegaProcessor:
    """Banking processor - deposits, withdrawals, transfers, interest, fees, loans."""
    
    def __init__(self, config: Optional[Config] = None):
        self.config = config or Config()
        self.working_storage = WorkingStorage()
        self.account_balances: Dict[str, Decimal] = {}
        self.loans: Dict[str, LoanRecord] = {}
        self.system_interest_rate: Decimal = self.config.DEFAULT_INTEREST_RATE

    def initialize(self) -> None:
        """Initialize system."""
        self.working_storage.ws_current_date = int(date.today().strftime("%Y%m%d"))
        self.working_storage.ws_cust_count = 0
        self.working_storage.ws_acct_count = 0
        self.working_storage.ws_tran_count = 0
        self.working_storage.ws_error_count = 0

    # ==================== DEPOSITS ====================
    def deposit(self, account_number: str, amount: Decimal) -> bool:
        """Process a deposit."""
        if not account_number or amount <= 0:
            self.working_storage.ws_error_count += 1
            return False
        
        if account_number not in self.account_balances:
            self.account_balances[account_number] = Decimal("0")
        
        self.account_balances[account_number] += amount
        self.working_storage.ws_total_deposits += amount
        self.working_storage.ws_tran_count += 1
        return True

    # ==================== WITHDRAWALS ====================
    def withdraw(self, account_number: str, amount: Decimal) -> bool:
        """Process a withdrawal."""
        if not account_number or amount <= 0:
            self.working_storage.ws_error_count += 1
            return False
        
        if account_number not in self.account_balances:
            self.working_storage.ws_error_count += 1
            return False
        
        balance = self.account_balances[account_number]
        
        if balance < amount:
            if amount <= self.config.MAX_OVERDRAFT_AMOUNT:
                self.account_balances[account_number] -= self.config.OVERDRAFT_FEE
                self.working_storage.ws_total_fees += self.config.OVERDRAFT_FEE
            else:
                self.working_storage.ws_error_count += 1
                return False
        
        self.account_balances[account_number] -= amount
        self.working_storage.ws_total_withdrawals += amount
        self.working_storage.ws_tran_count += 1
        return True

    # ==================== TRANSFERS ====================
    def transfer(self, from_account: str, to_account: str, amount: Decimal) -> bool:
        """Process internal transfer."""
        if not from_account or not to_account or amount <= 0:
            self.working_storage.ws_error_count += 1
            return False
        
        if from_account not in self.account_balances:
            self.working_storage.ws_error_count += 1
            return False
        
        if self.account_balances[from_account] < amount:
            self.working_storage.ws_error_count += 1
            return False
        
        if to_account not in self.account_balances:
            self.account_balances[to_account] = Decimal("0")
        
        self.account_balances[from_account] -= amount
        self.account_balances[to_account] += amount
        self.working_storage.ws_total_transfers += amount
        self.working_storage.ws_tran_count += 1
        return True

    def wire_transfer(self, from_account: str, to_account: str, amount: Decimal) -> bool:
        """Process wire transfer with fee."""
        if from_account not in self.account_balances:
            return False
        
        total_debit = amount + self.config.WIRE_TRANSFER_FEE
        if self.account_balances[from_account] < total_debit:
            return False
        
        self.account_balances[from_account] -= total_debit
        self.working_storage.ws_total_fees += self.config.WIRE_TRANSFER_FEE
        self.working_storage.ws_total_transfers += amount
        self.working_storage.ws_tran_count += 1
        return True

    def ach_transfer(self, from_account: str, to_account: str, amount: Decimal) -> bool:
        """Process ACH transfer with fee."""
        if from_account not in self.account_balances:
            return False
        
        total_debit = amount + self.config.ACH_TRANSFER_FEE
        if self.account_balances[from_account] < total_debit:
            return False
        
        self.account_balances[from_account] -= total_debit
        self.working_storage.ws_total_fees += self.config.ACH_TRANSFER_FEE
        self.working_storage.ws_total_transfers += amount
        self.working_storage.ws_tran_count += 1
        return True

    # ==================== INTEREST ====================
    def calculate_interest(self, account_number: str) -> Decimal:
        """Calculate and apply interest."""
        if account_number not in self.account_balances:
            return Decimal("0")
        
        balance = self.account_balances[account_number]
        if balance <= 0:
            return Decimal("0")
        
        interest = balance * self.system_interest_rate
        self.account_balances[account_number] += interest
        self.working_storage.ws_total_interest += interest
        return interest

    def calculate_interest_all(self) -> Decimal:
        """Calculate interest for all accounts."""
        total = Decimal("0")
        for account in self.account_balances:
            total += self.calculate_interest(account)
        return total

    # ==================== FEES ====================
    def apply_minimum_balance_fee(self, account_number: str) -> bool:
        """Apply fee if below minimum balance."""
        if account_number not in self.account_balances:
            return False
        
        if self.account_balances[account_number] < self.config.MINIMUM_BALANCE:
            self.account_balances[account_number] -= self.config.LOW_BALANCE_FEE
            self.working_storage.ws_total_fees += self.config.LOW_BALANCE_FEE
            return True
        return False

    def apply_fees_all(self) -> int:
        """Apply minimum balance fees to all accounts."""
        count = 0
        for account in self.account_balances:
            if self.apply_minimum_balance_fee(account):
                count += 1
        return count

    # ==================== LOANS ====================
    def calculate_monthly_payment(self, principal: Decimal, annual_rate: Decimal, term_months: int) -> Decimal:
        """Calculate monthly loan payment using amortization formula."""
        if term_months <= 0 or principal <= 0:
            return Decimal("0")
        
        monthly_rate = annual_rate / Decimal("12")
        
        if monthly_rate == 0:
            return principal / term_months
        
        # PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
        rate_factor = (1 + monthly_rate) ** term_months
        payment = principal * (monthly_rate * rate_factor) / (rate_factor - 1)
        return payment.quantize(Decimal("0.01"))

    def create_loan(self, account_number: str, principal: Decimal, 
                    annual_rate: Optional[Decimal] = None, 
                    term_months: Optional[int] = None) -> Optional[str]:
        """Create a new loan."""
        if account_number not in self.account_balances:
            return None
        
        if principal <= 0:
            return None
        
        rate = annual_rate or self.system_interest_rate
        term = term_months or self.config.LOAN_DEFAULT_TERM_MONTHS
        monthly_payment = self.calculate_monthly_payment(principal, rate, term)
        
        loan_id = f"L{self.working_storage.ws_loan_count + 1:06d}"
        
        self.loans[loan_id] = LoanRecord(
            loan_id=loan_id,
            account_number=account_number,
            principal=principal,
            interest_rate=rate,
            term_months=term,
            monthly_payment=monthly_payment,
            remaining_balance=principal
        )
        
        self.account_balances[account_number] += principal
        self.working_storage.ws_total_loans += principal
        self.working_storage.ws_loan_count += 1
        return loan_id

    def process_loan_payment(self, loan_id: str, payment_amount: Optional[Decimal] = None) -> bool:
        """Process a loan payment."""
        if loan_id not in self.loans:
            return False
        
        loan = self.loans[loan_id]
        account = loan.account_number
        
        if account not in self.account_balances:
            return False
        
        amount = payment_amount or loan.monthly_payment
        
        if self.account_balances[account] < amount:
            return False
        
        interest_portion = loan.remaining_balance * (loan.interest_rate / Decimal("12"))
        principal_portion = amount - interest_portion
        
        if principal_portion < 0:
            principal_portion = Decimal("0")
            interest_portion = amount
        
        self.account_balances[account] -= amount
        loan.remaining_balance -= principal_portion
        self.working_storage.ws_total_payments += amount
        self.working_storage.ws_total_interest += interest_portion
        
        if loan.remaining_balance <= 0:
            loan.remaining_balance = Decimal("0")
        
        return True

    def get_loan_balance(self, loan_id: str) -> Decimal:
        """Get remaining loan balance."""
        if loan_id not in self.loans:
            return Decimal("-1")
        return self.loans[loan_id].remaining_balance

    # ==================== QUERIES ====================
    def get_balance(self, account_number: str) -> Decimal:
        """Get account balance."""
        return self.account_balances.get(account_number, Decimal("-1"))

    def get_total_assets(self) -> Decimal:
        """Get sum of all positive balances."""
        return sum(b for b in self.account_balances.values() if b > 0)

    def get_total_liabilities(self) -> Decimal:
        """Get sum of all loan balances."""
        return sum(loan.remaining_balance for loan in self.loans.values())


# ==================== TESTS ====================
if __name__ == "__main__":
    p = MegaProcessor()
    p.initialize()
    
    # Test deposits
    assert p.deposit("ACC001", Decimal("1000")) == True
    assert p.get_balance("ACC001") == Decimal("1000")
    
    # Test withdrawals
    assert p.withdraw("ACC001", Decimal("200")) == True
    assert p.get_balance("ACC001") == Decimal("800")
    
    # Test transfer
    p.deposit("ACC002", Decimal("500"))
    assert p.transfer("ACC001", "ACC002", Decimal("300")) == True
    assert p.get_balance("ACC001") == Decimal("500")
    assert p.get_balance("ACC002") == Decimal("800")
    
    # Test interest
    interest = p.calculate_interest("ACC001")
    assert interest == Decimal("25.00")
    assert p.get_balance("ACC001") == Decimal("525")
    
    # Test minimum balance fee
    p.deposit("ACC003", Decimal("50"))
    assert p.apply_minimum_balance_fee("ACC003") == True
    assert p.get_balance("ACC003") == Decimal("40")
    
    # Test loan creation
    loan_id = p.create_loan("ACC001", Decimal("10000"), Decimal("0.06"), 12)
    assert loan_id is not None
    assert p.get_balance("ACC001") == Decimal("10525")
    
    # Test loan payment
    assert p.process_loan_payment(loan_id) == True
    assert p.get_loan_balance(loan_id) < Decimal("10000")
    
    # Test wire transfer
    assert p.wire_transfer("ACC002", "EXT001", Decimal("100")) == True
    assert p.get_balance("ACC002") == Decimal("685")  # 800 - 100 - 15 fee
    
    print("✓ All tests passed")
    print(f"Total deposits: {p.working_storage.ws_total_deposits}")
    print(f"Total withdrawals: {p.working_storage.ws_total_withdrawals}")
    print(f"Total transfers: {p.working_storage.ws_total_transfers}")
    print(f"Total fees: {p.working_storage.ws_total_fees}")
    print(f"Total loans: {p.working_storage.ws_total_loans}")
