"""
Enterprise Banking System
Complete Banking Operations Module - Production Ready
No Placeholders - All Logic Implemented
"""

from decimal import Decimal, ROUND_HALF_UP
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from enum import Enum
from abc import ABC, abstractmethod
import hashlib
import uuid


# ==================== ENUMS ====================
class AccountType(Enum):
    CHECKING = "CHECKING"
    SAVINGS = "SAVINGS"
    MONEY_MARKET = "MONEY_MARKET"
    CERTIFICATE_OF_DEPOSIT = "CD"


class TransactionType(Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    TRANSFER_IN = "TRANSFER_IN"
    TRANSFER_OUT = "TRANSFER_OUT"
    INTEREST_CREDIT = "INTEREST_CREDIT"
    FEE_DEBIT = "FEE_DEBIT"
    LOAN_DISBURSEMENT = "LOAN_DISBURSEMENT"
    LOAN_PAYMENT = "LOAN_PAYMENT"
    WIRE_TRANSFER = "WIRE_TRANSFER"
    ACH_TRANSFER = "ACH_TRANSFER"


class LoanType(Enum):
    PERSONAL = "PERSONAL"
    MORTGAGE = "MORTGAGE"
    AUTO = "AUTO"
    BUSINESS = "BUSINESS"
    STUDENT = "STUDENT"


class LoanStatus(Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    PAID_OFF = "PAID_OFF"
    DEFAULTED = "DEFAULTED"


class CustomerStatus(Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"
    CLOSED = "CLOSED"


class TransferStatus(Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


# ==================== CONFIGURATION ====================
@dataclass
class SystemConfig:
    """System-wide configuration parameters."""
    # Interest rates
    savings_interest_rate: Decimal = Decimal("0.025")
    checking_interest_rate: Decimal = Decimal("0.001")
    money_market_rate: Decimal = Decimal("0.035")
    cd_rate_12_month: Decimal = Decimal("0.045")
    
    # Fees
    overdraft_fee: Decimal = Decimal("35.00")
    minimum_balance_fee: Decimal = Decimal("12.00")
    wire_transfer_fee: Decimal = Decimal("25.00")
    ach_transfer_fee: Decimal = Decimal("3.00")
    account_maintenance_fee: Decimal = Decimal("10.00")
    atm_fee: Decimal = Decimal("3.00")
    
    # Limits
    daily_withdrawal_limit: Decimal = Decimal("5000.00")
    daily_transfer_limit: Decimal = Decimal("10000.00")
    minimum_balance_checking: Decimal = Decimal("100.00")
    minimum_balance_savings: Decimal = Decimal("300.00")
    minimum_balance_money_market: Decimal = Decimal("2500.00")
    max_overdraft_amount: Decimal = Decimal("500.00")
    
    # Loan rates
    personal_loan_rate: Decimal = Decimal("0.0899")
    mortgage_rate: Decimal = Decimal("0.0650")
    auto_loan_rate: Decimal = Decimal("0.0725")
    business_loan_rate: Decimal = Decimal("0.0799")
    student_loan_rate: Decimal = Decimal("0.0550")
    
    # Loan terms (months)
    personal_loan_max_term: int = 60
    mortgage_max_term: int = 360
    auto_loan_max_term: int = 84
    business_loan_max_term: int = 120
    student_loan_max_term: int = 240


# ==================== DATA STRUCTURES ====================
@dataclass
class Address:
    """Customer address."""
    street: str
    city: str
    state: str
    zip_code: str
    country: str = "USA"
    
    def format(self) -> str:
        return f"{self.street}, {self.city}, {self.state} {self.zip_code}, {self.country}"


@dataclass
class Customer:
    """Customer record."""
    customer_id: str
    first_name: str
    last_name: str
    email: str
    phone: str
    address: Address
    date_of_birth: date
    ssn_hash: str
    status: CustomerStatus = CustomerStatus.ACTIVE
    created_date: date = field(default_factory=date.today)
    credit_score: int = 650
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    
    @property
    def age(self) -> int:
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )


@dataclass
class Transaction:
    """Transaction record."""
    transaction_id: str
    account_id: str
    transaction_type: TransactionType
    amount: Decimal
    balance_after: Decimal
    timestamp: datetime
    description: str
    reference_id: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.transaction_id,
            "account": self.account_id,
            "type": self.transaction_type.value,
            "amount": str(self.amount),
            "balance": str(self.balance_after),
            "time": self.timestamp.isoformat(),
            "desc": self.description
        }


@dataclass
class Account:
    """Bank account."""
    account_id: str
    customer_id: str
    account_type: AccountType
    balance: Decimal = Decimal("0.00")
    available_balance: Decimal = Decimal("0.00")
    interest_rate: Decimal = Decimal("0.00")
    opened_date: date = field(default_factory=date.today)
    last_activity_date: date = field(default_factory=date.today)
    is_active: bool = True
    overdraft_protection: bool = False
    daily_withdrawal_used: Decimal = Decimal("0.00")
    daily_transfer_used: Decimal = Decimal("0.00")
    
    def update_activity(self) -> None:
        self.last_activity_date = date.today()


@dataclass
class LoanPaymentSchedule:
    """Single payment in loan schedule."""
    payment_number: int
    due_date: date
    payment_amount: Decimal
    principal_amount: Decimal
    interest_amount: Decimal
    remaining_balance: Decimal
    is_paid: bool = False
    paid_date: Optional[date] = None
    paid_amount: Decimal = Decimal("0.00")


@dataclass
class Loan:
    """Loan record."""
    loan_id: str
    customer_id: str
    account_id: str
    loan_type: LoanType
    principal: Decimal
    interest_rate: Decimal
    term_months: int
    monthly_payment: Decimal
    remaining_balance: Decimal
    status: LoanStatus = LoanStatus.PENDING
    originated_date: Optional[date] = None
    maturity_date: Optional[date] = None
    next_payment_date: Optional[date] = None
    payments_made: int = 0
    total_interest_paid: Decimal = Decimal("0.00")
    payment_schedule: List[LoanPaymentSchedule] = field(default_factory=list)


@dataclass
class Transfer:
    """Transfer record."""
    transfer_id: str
    from_account: str
    to_account: str
    amount: Decimal
    fee: Decimal
    transfer_type: str
    status: TransferStatus
    initiated_date: datetime
    completed_date: Optional[datetime] = None
    reference: str = ""


@dataclass
class Statement:
    """Account statement."""
    statement_id: str
    account_id: str
    period_start: date
    period_end: date
    opening_balance: Decimal
    closing_balance: Decimal
    total_deposits: Decimal
    total_withdrawals: Decimal
    total_fees: Decimal
    total_interest: Decimal
    transactions: List[Transaction] = field(default_factory=list)


# ==================== WORKING STORAGE ====================
@dataclass
class WorkingStorage:
    """COBOL-style working storage area."""
    ws_current_date: int = 0
    ws_current_time: int = 0
    ws_process_date: int = 0
    ws_customer_count: int = 0
    ws_account_count: int = 0
    ws_transaction_count: int = 0
    ws_loan_count: int = 0
    ws_transfer_count: int = 0
    ws_error_count: int = 0
    ws_total_deposits: Decimal = Decimal("0.00")
    ws_total_withdrawals: Decimal = Decimal("0.00")
    ws_total_transfers: Decimal = Decimal("0.00")
    ws_total_interest_paid: Decimal = Decimal("0.00")
    ws_total_interest_earned: Decimal = Decimal("0.00")
    ws_total_fees_collected: Decimal = Decimal("0.00")
    ws_total_loans_disbursed: Decimal = Decimal("0.00")
    ws_total_loan_payments: Decimal = Decimal("0.00")
    ws_batch_id: str = ""
    ws_last_error: str = ""


# ==================== VALIDATORS ====================
class Validator:
    """Input validation utilities."""
    
    @staticmethod
    def validate_amount(amount: Decimal) -> Tuple[bool, str]:
        if amount is None:
            return False, "Amount cannot be null"
        if amount <= 0:
            return False, "Amount must be positive"
        if amount > Decimal("999999999.99"):
            return False, "Amount exceeds maximum limit"
        return True, ""
    
    @staticmethod
    def validate_account_id(account_id: str) -> Tuple[bool, str]:
        if not account_id:
            return False, "Account ID cannot be empty"
        if len(account_id) < 8:
            return False, "Account ID must be at least 8 characters"
        return True, ""
    
    @staticmethod
    def validate_email(email: str) -> Tuple[bool, str]:
        if not email:
            return False, "Email cannot be empty"
        if "@" not in email or "." not in email:
            return False, "Invalid email format"
        return True, ""
    
    @staticmethod
    def validate_phone(phone: str) -> Tuple[bool, str]:
        digits = "".join(c for c in phone if c.isdigit())
        if len(digits) < 10:
            return False, "Phone must have at least 10 digits"
        return True, ""
    
    @staticmethod
    def validate_ssn(ssn: str) -> Tuple[bool, str]:
        digits = "".join(c for c in ssn if c.isdigit())
        if len(digits) != 9:
            return False, "SSN must have 9 digits"
        return True, ""
    
    @staticmethod
    def validate_zip_code(zip_code: str) -> Tuple[bool, str]:
        digits = "".join(c for c in zip_code if c.isdigit())
        if len(digits) not in (5, 9):
            return False, "ZIP code must be 5 or 9 digits"
        return True, ""


# ==================== CALCULATORS ====================
class FinancialCalculator:
    """Financial calculation utilities."""
    
    @staticmethod
    def calculate_simple_interest(
        principal: Decimal, 
        annual_rate: Decimal, 
        days: int
    ) -> Decimal:
        """Calculate simple interest for a period."""
        daily_rate = annual_rate / Decimal("365")
        interest = principal * daily_rate * days
        return interest.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    
    @staticmethod
    def calculate_compound_interest(
        principal: Decimal,
        annual_rate: Decimal,
        periods: int,
        compounds_per_year: int = 12
    ) -> Decimal:
        """Calculate compound interest."""
        rate_per_period = annual_rate / compounds_per_year
        amount = principal * ((1 + rate_per_period) ** periods)
        interest = amount - principal
        return interest.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    
    @staticmethod
    def calculate_monthly_payment(
        principal: Decimal,
        annual_rate: Decimal,
        term_months: int
    ) -> Decimal:
        """Calculate monthly loan payment using amortization formula."""
        if term_months <= 0 or principal <= 0:
            return Decimal("0.00")
        
        monthly_rate = annual_rate / Decimal("12")
        
        if monthly_rate == 0:
            payment = principal / term_months
        else:
            rate_factor = (1 + monthly_rate) ** term_months
            payment = principal * (monthly_rate * rate_factor) / (rate_factor - 1)
        
        return payment.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    
    @staticmethod
    def calculate_loan_payoff(
        remaining_balance: Decimal,
        annual_rate: Decimal,
        days_until_payoff: int
    ) -> Decimal:
        """Calculate loan payoff amount including accrued interest."""
        daily_rate = annual_rate / Decimal("365")
        accrued_interest = remaining_balance * daily_rate * days_until_payoff
        payoff = remaining_balance + accrued_interest
        return payoff.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    
    @staticmethod
    def generate_amortization_schedule(
        principal: Decimal,
        annual_rate: Decimal,
        term_months: int,
        start_date: date
    ) -> List[LoanPaymentSchedule]:
        """Generate complete loan amortization schedule."""
        schedule = []
        monthly_payment = FinancialCalculator.calculate_monthly_payment(
            principal, annual_rate, term_months
        )
        monthly_rate = annual_rate / Decimal("12")
        balance = principal
        current_date = start_date
        
        for i in range(1, term_months + 1):
            interest_amount = (balance * monthly_rate).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            principal_amount = monthly_payment - interest_amount
            
            if i == term_months:
                principal_amount = balance
                monthly_payment = principal_amount + interest_amount
            
            balance -= principal_amount
            if balance < 0:
                balance = Decimal("0.00")
            
            current_date = current_date + timedelta(days=30)
            
            schedule.append(LoanPaymentSchedule(
                payment_number=i,
                due_date=current_date,
                payment_amount=monthly_payment,
                principal_amount=principal_amount,
                interest_amount=interest_amount,
                remaining_balance=balance
            ))
        
        return schedule
    
    @staticmethod
    def calculate_apr(
        principal: Decimal,
        total_interest: Decimal,
        total_fees: Decimal,
        term_years: Decimal
    ) -> Decimal:
        """Calculate Annual Percentage Rate."""
        if term_years <= 0 or principal <= 0:
            return Decimal("0.00")
        
        total_cost = total_interest + total_fees
        apr = (total_cost / principal) / term_years
        return (apr * 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


# ==================== ID GENERATORS ====================
class IDGenerator:
    """Unique ID generation utilities."""
    
    _customer_counter = 0
    _account_counter = 0
    _transaction_counter = 0
    _loan_counter = 0
    _transfer_counter = 0
    
    @classmethod
    def generate_customer_id(cls) -> str:
        cls._customer_counter += 1
        return f"CUST{cls._customer_counter:08d}"
    
    @classmethod
    def generate_account_id(cls, account_type: AccountType) -> str:
        cls._account_counter += 1
        prefix = {
            AccountType.CHECKING: "CHK",
            AccountType.SAVINGS: "SAV",
            AccountType.MONEY_MARKET: "MMK",
            AccountType.CERTIFICATE_OF_DEPOSIT: "CDS"
        }.get(account_type, "ACC")
        return f"{prefix}{cls._account_counter:09d}"
    
    @classmethod
    def generate_transaction_id(cls) -> str:
        cls._transaction_counter += 1
        return f"TXN{cls._transaction_counter:012d}"
    
    @classmethod
    def generate_loan_id(cls, loan_type: LoanType) -> str:
        cls._loan_counter += 1
        prefix = {
            LoanType.PERSONAL: "PL",
            LoanType.MORTGAGE: "MG",
            LoanType.AUTO: "AL",
            LoanType.BUSINESS: "BL",
            LoanType.STUDENT: "SL"
        }.get(loan_type, "LN")
        return f"{prefix}{cls._loan_counter:010d}"
    
    @classmethod
    def generate_transfer_id(cls) -> str:
        cls._transfer_counter += 1
        return f"TRF{cls._transfer_counter:012d}"
    
    @staticmethod
    def generate_statement_id(account_id: str, period_end: date) -> str:
        return f"STM-{account_id}-{period_end.strftime('%Y%m')}"
    
    @staticmethod
    def hash_ssn(ssn: str) -> str:
        clean_ssn = "".join(c for c in ssn if c.isdigit())
        return hashlib.sha256(clean_ssn.encode()).hexdigest()


# ==================== CUSTOMER SERVICE ====================
class CustomerService:
    """Customer management operations."""
    
    def __init__(self, config: SystemConfig, working_storage: WorkingStorage):
        self.config = config
        self.ws = working_storage
        self.customers: Dict[str, Customer] = {}
    
    def create_customer(
        self,
        first_name: str,
        last_name: str,
        email: str,
        phone: str,
        address: Address,
        date_of_birth: date,
        ssn: str
    ) -> Tuple[bool, str, Optional[Customer]]:
        """Create a new customer."""
        # Validate inputs
        valid, msg = Validator.validate_email(email)
        if not valid:
            self.ws.ws_error_count += 1
            self.ws.ws_last_error = msg
            return False, msg, None
        
        valid, msg = Validator.validate_phone(phone)
        if not valid:
            self.ws.ws_error_count += 1
            self.ws.ws_last_error = msg
            return False, msg, None
        
        valid, msg = Validator.validate_ssn(ssn)
        if not valid:
            self.ws.ws_error_count += 1
            self.ws.ws_last_error = msg
            return False, msg, None
        
        valid, msg = Validator.validate_zip_code(address.zip_code)
        if not valid:
            self.ws.ws_error_count += 1
            self.ws.ws_last_error = msg
            return False, msg, None
        
        # Check age
        today = date.today()
        age = today.year - date_of_birth.year
        if age < 18:
            msg = "Customer must be at least 18 years old"
            self.ws.ws_error_count += 1
            self.ws.ws_last_error = msg
            return False, msg, None
        
        # Check for duplicate SSN
        ssn_hash = IDGenerator.hash_ssn(ssn)
        for cust in self.customers.values():
            if cust.ssn_hash == ssn_hash:
                msg = "Customer with this SSN already exists"
                self.ws.ws_error_count += 1
                self.ws.ws_last_error = msg
                return False, msg, None
        
        # Create customer
        customer_id = IDGenerator.generate_customer_id()
        customer = Customer(
            customer_id=customer_id,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            address=address,
            date_of_birth=date_of_birth,
            ssn_hash=ssn_hash
        )
        
        self.customers[customer_id] = customer
        self.ws.ws_customer_count += 1
        
        return True, "Customer created successfully", customer
    
    def get_customer(self, customer_id: str) -> Optional[Customer]:
        """Retrieve customer by ID."""
        return self.customers.get(customer_id)
    
    def update_customer_address(
        self, 
        customer_id: str, 
        new_address: Address
    ) -> Tuple[bool, str]:
        """Update customer address."""
        customer = self.customers.get(customer_id)
        if not customer:
            return False, "Customer not found"
        
        valid, msg = Validator.validate_zip_code(new_address.zip_code)
        if not valid:
            return False, msg
        
        customer.address = new_address
        return True, "Address updated successfully"
    
    def update_customer_contact(
        self,
        customer_id: str,
        email: Optional[str] = None,
        phone: Optional[str] = None
    ) -> Tuple[bool, str]:
        """Update customer contact information."""
        customer = self.customers.get(customer_id)
        if not customer:
            return False, "Customer not found"
        
        if email:
            valid, msg = Validator.validate_email(email)
            if not valid:
                return False, msg
            customer.email = email
        
        if phone:
            valid, msg = Validator.validate_phone(phone)
            if not valid:
                return False, msg
            customer.phone = phone
        
        return True, "Contact updated successfully"
    
    def update_credit_score(
        self, 
        customer_id: str, 
        new_score: int
    ) -> Tuple[bool, str]:
        """Update customer credit score."""
        customer = self.customers.get(customer_id)
        if not customer:
            return False, "Customer not found"
        
        if new_score < 300 or new_score > 850:
            return False, "Credit score must be between 300 and 850"
        
        customer.credit_score = new_score
        return True, "Credit score updated"
    
    def suspend_customer(self, customer_id: str) -> Tuple[bool, str]:
        """Suspend customer account."""
        customer = self.customers.get(customer_id)
        if not customer:
            return False, "Customer not found"
        
        customer.status = CustomerStatus.SUSPENDED
        return True, "Customer suspended"
    
    def activate_customer(self, customer_id: str) -> Tuple[bool, str]:
        """Activate customer account."""
        customer = self.customers.get(customer_id)
        if not customer:
            return False, "Customer not found"
        
        customer.status = CustomerStatus.ACTIVE
        return True, "Customer activated"
    
    def close_customer(self, customer_id: str) -> Tuple[bool, str]:
        """Close customer account."""
        customer = self.customers.get(customer_id)
        if not customer:
            return False, "Customer not found"
        
        customer.status = CustomerStatus.CLOSED
        return True, "Customer closed"
    
    def get_customer_count(self) -> int:
        """Get total customer count."""
        return len(self.customers)
    
    def get_active_customers(self) -> List[Customer]:
        """Get all active customers."""
        return [c for c in self.customers.values() if c.status == CustomerStatus.ACTIVE]


# ==================== ACCOUNT SERVICE ====================
class AccountService:
    """Account management operations."""
    
    def __init__(
        self, 
        config: SystemConfig, 
        working_storage: WorkingStorage,
        customer_service: CustomerService
    ):
        self.config = config
        self.ws = working_storage
        self.customer_service = customer_service
        self.accounts: Dict[str, Account] = {}
        self.transactions: Dict[str, List[Transaction]] = {}
    
    def open_account(
        self,
        customer_id: str,
        account_type: AccountType,
        initial_deposit: Decimal = Decimal("0.00"),
        overdraft_protection: bool = False
    ) -> Tuple[bool, str, Optional[Account]]:
        """Open a new account."""
        # Verify customer exists and is active
        customer = self.customer_service.get_customer(customer_id)
        if not customer:
            return False, "Customer not found", None
        
        if customer.status != CustomerStatus.ACTIVE:
            return False, "Customer is not active", None
        
        # Validate initial deposit
        if initial_deposit < 0:
            return False, "Initial deposit cannot be negative", None
        
        # Check minimum opening deposit
        min_deposit = {
            AccountType.CHECKING: Decimal("25.00"),
            AccountType.SAVINGS: Decimal("100.00"),
            AccountType.MONEY_MARKET: Decimal("1000.00"),
            AccountType.CERTIFICATE_OF_DEPOSIT: Decimal("500.00")
        }.get(account_type, Decimal("0.00"))
        
        if initial_deposit < min_deposit:
            return False, f"Minimum opening deposit is ${min_deposit}", None
        
        # Determine interest rate
        interest_rate = {
            AccountType.CHECKING: self.config.checking_interest_rate,
            AccountType.SAVINGS: self.config.savings_interest_rate,
            AccountType.MONEY_MARKET: self.config.money_market_rate,
            AccountType.CERTIFICATE_OF_DEPOSIT: self.config.cd_rate_12_month
        }.get(account_type, Decimal("0.00"))
        
        # Create account
        account_id = IDGenerator.generate_account_id(account_type)
        account = Account(
            account_id=account_id,
            customer_id=customer_id,
            account_type=account_type,
            balance=initial_deposit,
            available_balance=initial_deposit,
            interest_rate=interest_rate,
            overdraft_protection=overdraft_protection
        )
        
        self.accounts[account_id] = account
        self.transactions[account_id] = []
        self.ws.ws_account_count += 1
        
        # Record initial deposit transaction
        if initial_deposit > 0:
            self._record_transaction(
                account_id,
                TransactionType.DEPOSIT,
                initial_deposit,
                "Initial deposit"
            )
            self.ws.ws_total_deposits += initial_deposit
        
        return True, "Account opened successfully", account
    
    def get_account(self, account_id: str) -> Optional[Account]:
        """Get account by ID."""
        return self.accounts.get(account_id)
    
    def get_balance(self, account_id: str) -> Tuple[bool, Decimal]:
        """Get account balance."""
        account = self.accounts.get(account_id)
        if not account:
            return False, Decimal("-1")
        return True, account.balance
    
    def get_available_balance(self, account_id: str) -> Tuple[bool, Decimal]:
        """Get available balance (may differ due to holds)."""
        account = self.accounts.get(account_id)
        if not account:
            return False, Decimal("-1")
        return True, account.available_balance
    
    def deposit(
        self,
        account_id: str,
        amount: Decimal,
        description: str = "Deposit"
    ) -> Tuple[bool, str]:
        """Make a deposit."""
        valid, msg = Validator.validate_amount(amount)
        if not valid:
            self.ws.ws_error_count += 1
            return False, msg
        
        account = self.accounts.get(account_id)
        if not account:
            self.ws.ws_error_count += 1
            return False, "Account not found"
        
        if not account.is_active:
            self.ws.ws_error_count += 1
            return False, "Account is not active"
        
        account.balance += amount
        account.available_balance += amount
        account.update_activity()
        
        self._record_transaction(
            account_id,
            TransactionType.DEPOSIT,
            amount,
            description
        )
        
        self.ws.ws_total_deposits += amount
        return True, "Deposit successful"
    
    def withdraw(
        self,
        account_id: str,
        amount: Decimal,
        description: str = "Withdrawal"
    ) -> Tuple[bool, str]:
        """Make a withdrawal."""
        valid, msg = Validator.validate_amount(amount)
        if not valid:
            self.ws.ws_error_count += 1
            return False, msg
        
        account = self.accounts.get(account_id)
        if not account:
            self.ws.ws_error_count += 1
            return False, "Account not found"
        
        if not account.is_active:
            self.ws.ws_error_count += 1
            return False, "Account is not active"
        
        # Check daily limit
        if account.daily_withdrawal_used + amount > self.config.daily_withdrawal_limit:
            self.ws.ws_error_count += 1
            return False, "Daily withdrawal limit exceeded"
        
        # Check sufficient funds
        if account.available_balance < amount:
            if account.overdraft_protection and amount <= self.config.max_overdraft_amount:
                # Apply overdraft fee
                account.balance -= self.config.overdraft_fee
                self.ws.ws_total_fees_collected += self.config.overdraft_fee
                self._record_transaction(
                    account_id,
                    TransactionType.FEE_DEBIT,
                    self.config.overdraft_fee,
                    "Overdraft fee"
                )
            else:
                self.ws.ws_error_count += 1
                return False, "Insufficient funds"
        
        account.balance -= amount
        account.available_balance -= amount
        account.daily_withdrawal_used += amount
        account.update_activity()
        
        self._record_transaction(
            account_id,
            TransactionType.WITHDRAWAL,
            amount,
            description
        )
        
        self.ws.ws_total_withdrawals += amount
        return True, "Withdrawal successful"
    
    def transfer(
        self,
        from_account_id: str,
        to_account_id: str,
        amount: Decimal,
        description: str = "Transfer"
    ) -> Tuple[bool, str]:
        """Transfer between accounts."""
        valid, msg = Validator.validate_amount(amount)
        if not valid:
            self.ws.ws_error_count += 1
            return False, msg
        
        from_account = self.accounts.get(from_account_id)
        to_account = self.accounts.get(to_account_id)
        
        if not from_account:
            return False, "Source account not found"
        if not to_account:
            return False, "Destination account not found"
        
        if not from_account.is_active or not to_account.is_active:
            return False, "One or both accounts are not active"
        
        # Check daily transfer limit
        if from_account.daily_transfer_used + amount > self.config.daily_transfer_limit:
            return False, "Daily transfer limit exceeded"
        
        # Check sufficient funds
        if from_account.available_balance < amount:
            return False, "Insufficient funds"
        
        # Execute transfer
        from_account.balance -= amount
        from_account.available_balance -= amount
        from_account.daily_transfer_used += amount
        from_account.update_activity()
        
        to_account.balance += amount
        to_account.available_balance += amount
        to_account.update_activity()
        
        # Record transactions
        self._record_transaction(
            from_account_id,
            TransactionType.TRANSFER_OUT,
            amount,
            f"{description} to {to_account_id}"
        )
        
        self._record_transaction(
            to_account_id,
            TransactionType.TRANSFER_IN,
            amount,
            f"{description} from {from_account_id}"
        )
        
        self.ws.ws_total_transfers += amount
        return True, "Transfer successful"
    
    def apply_interest(self, account_id: str) -> Tuple[bool, Decimal]:
        """Apply monthly interest to account."""
        account = self.accounts.get(account_id)
        if not account:
            return False, Decimal("0")
        
        if account.balance <= 0:
            return True, Decimal("0")
        
        # Calculate monthly interest
        monthly_rate = account.interest_rate / Decimal("12")
        interest = (account.balance * monthly_rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        
        if interest > 0:
            account.balance += interest
            account.available_balance += interest
            
            self._record_transaction(
                account_id,
                TransactionType.INTEREST_CREDIT,
                interest,
                "Monthly interest credit"
            )
            
            self.ws.ws_total_interest_paid += interest
        
        return True, interest
    
    def apply_minimum_balance_fee(self, account_id: str) -> Tuple[bool, bool]:
        """Apply minimum balance fee if applicable."""
        account = self.accounts.get(account_id)
        if not account:
            return False, False
        
        minimum = {
            AccountType.CHECKING: self.config.minimum_balance_checking,
            AccountType.SAVINGS: self.config.minimum_balance_savings,
            AccountType.MONEY_MARKET: self.config.minimum_balance_money_market,
            AccountType.CERTIFICATE_OF_DEPOSIT: Decimal("0")
        }.get(account.account_type, Decimal("0"))
        
        if account.balance < minimum:
            fee = self.config.minimum_balance_fee
            account.balance -= fee
            account.available_balance -= fee
            
            self._record_transaction(
                account_id,
                TransactionType.FEE_DEBIT,
                fee,
                "Minimum balance fee"
            )
            
            self.ws.ws_total_fees_collected += fee
            return True, True
        
        return True, False
    
    def close_account(self, account_id: str) -> Tuple[bool, str, Decimal]:
        """Close an account and return final balance."""
        account = self.accounts.get(account_id)
        if not account:
            return False, "Account not found", Decimal("0")
        
        if account.balance < 0:
            return False, "Account has negative balance", account.balance
        
        final_balance = account.balance
        account.balance = Decimal("0")
        account.available_balance = Decimal("0")
        account.is_active = False
        
        return True, "Account closed", final_balance
    
    def get_transaction_history(
        self,
        account_id: str,
        limit: int = 50
    ) -> List[Transaction]:
        """Get transaction history for account."""
        transactions = self.transactions.get(account_id, [])
        return transactions[-limit:]
    
    def get_customer_accounts(self, customer_id: str) -> List[Account]:
        """Get all accounts for a customer."""
        return [a for a in self.accounts.values() if a.customer_id == customer_id]
    
    def _record_transaction(
        self,
        account_id: str,
        trans_type: TransactionType,
        amount: Decimal,
        description: str,
        reference_id: Optional[str] = None
    ) -> Transaction:
        """Record a transaction."""
        account = self.accounts[account_id]
        
        txn = Transaction(
            transaction_id=IDGenerator.generate_transaction_id(),
            account_id=account_id,
            transaction_type=trans_type,
            amount=amount,
            balance_after=account.balance,
            timestamp=datetime.now(),
            description=description,
            reference_id=reference_id
        )
        
        if account_id not in self.transactions:
            self.transactions[account_id] = []
        self.transactions[account_id].append(txn)
        self.ws.ws_transaction_count += 1
        
        return txn
    
    def reset_daily_limits(self) -> int:
        """Reset daily limits for all accounts."""
        count = 0
        for account in self.accounts.values():
            account.daily_withdrawal_used = Decimal("0")
            account.daily_transfer_used = Decimal("0")
            count += 1
        return count


# ==================== TRANSFER SERVICE ====================
class TransferService:
    """External transfer operations."""
    
    def __init__(
        self,
        config: SystemConfig,
        working_storage: WorkingStorage,
        account_service: AccountService
    ):
        self.config = config
        self.ws = working_storage
        self.account_service = account_service
        self.transfers: Dict[str, Transfer] = {}
    
    def wire_transfer(
        self,
        from_account_id: str,
        external_account: str,
        amount: Decimal,
        reference: str = ""
    ) -> Tuple[bool, str, Optional[str]]:
        """Process wire transfer to external account."""
        valid, msg = Validator.validate_amount(amount)
        if not valid:
            return False, msg, None
        
        account = self.account_service.get_account(from_account_id)
        if not account:
            return False, "Account not found", None
        
        total_debit = amount + self.config.wire_transfer_fee
        
        if account.available_balance < total_debit:
            return False, "Insufficient funds including fee", None
        
        # Debit account
        account.balance -= total_debit
        account.available_balance -= total_debit
        account.update_activity()
        
        # Record transactions
        self.account_service._record_transaction(
            from_account_id,
            TransactionType.WIRE_TRANSFER,
            amount,
            f"Wire transfer to {external_account}"
        )
        
        self.account_service._record_transaction(
            from_account_id,
            TransactionType.FEE_DEBIT,
            self.config.wire_transfer_fee,
            "Wire transfer fee"
        )
        
        # Create transfer record
        transfer_id = IDGenerator.generate_transfer_id()
        transfer = Transfer(
            transfer_id=transfer_id,
            from_account=from_account_id,
            to_account=external_account,
            amount=amount,
            fee=self.config.wire_transfer_fee,
            transfer_type="WIRE",
            status=TransferStatus.COMPLETED,
            initiated_date=datetime.now(),
            completed_date=datetime.now(),
            reference=reference
        )
        
        self.transfers[transfer_id] = transfer
        self.ws.ws_transfer_count += 1
        self.ws.ws_total_transfers += amount
        self.ws.ws_total_fees_collected += self.config.wire_transfer_fee
        
        return True, "Wire transfer completed", transfer_id
    
    def ach_transfer(
        self,
        from_account_id: str,
        external_account: str,
        routing_number: str,
        amount: Decimal,
        reference: str = ""
    ) -> Tuple[bool, str, Optional[str]]:
        """Process ACH transfer."""
        valid, msg = Validator.validate_amount(amount)
        if not valid:
            return False, msg, None
        
        if len(routing_number) != 9:
            return False, "Invalid routing number", None
        
        account = self.account_service.get_account(from_account_id)
        if not account:
            return False, "Account not found", None
        
        total_debit = amount + self.config.ach_transfer_fee
        
        if account.available_balance < total_debit:
            return False, "Insufficient funds including fee", None
        
        # Debit account
        account.balance -= total_debit
        account.available_balance -= total_debit
        account.update_activity()
        
        # Record transactions
        self.account_service._record_transaction(
            from_account_id,
            TransactionType.ACH_TRANSFER,
            amount,
            f"ACH transfer to {external_account}"
        )
        
        self.account_service._record_transaction(
            from_account_id,
            TransactionType.FEE_DEBIT,
            self.config.ach_transfer_fee,
            "ACH transfer fee"
        )
        
        # Create transfer record
        transfer_id = IDGenerator.generate_transfer_id()
        transfer = Transfer(
            transfer_id=transfer_id,
            from_account=from_account_id,
            to_account=f"{routing_number}:{external_account}",
            amount=amount,
            fee=self.config.ach_transfer_fee,
            transfer_type="ACH",
            status=TransferStatus.COMPLETED,
            initiated_date=datetime.now(),
            completed_date=datetime.now(),
            reference=reference
        )
        
        self.transfers[transfer_id] = transfer
        self.ws.ws_transfer_count += 1
        self.ws.ws_total_transfers += amount
        self.ws.ws_total_fees_collected += self.config.ach_transfer_fee
        
        return True, "ACH transfer completed", transfer_id
    
    def get_transfer(self, transfer_id: str) -> Optional[Transfer]:
        """Get transfer by ID."""
        return self.transfers.get(transfer_id)
    
    def get_account_transfers(self, account_id: str) -> List[Transfer]:
        """Get all transfers for an account."""
        return [t for t in self.transfers.values() if t.from_account == account_id]


# ==================== LOAN SERVICE ====================
class LoanService:
    """Loan management operations."""
    
    def __init__(
        self,
        config: SystemConfig,
        working_storage: WorkingStorage,
        account_service: AccountService,
        customer_service: CustomerService
    ):
        self.config = config
        self.ws = working_storage
        self.account_service = account_service
        self.customer_service = customer_service
        self.loans: Dict[str, Loan] = {}
    
    def get_loan_rate(self, loan_type: LoanType) -> Decimal:
        """Get interest rate for loan type."""
        return {
            LoanType.PERSONAL: self.config.personal_loan_rate,
            LoanType.MORTGAGE: self.config.mortgage_rate,
            LoanType.AUTO: self.config.auto_loan_rate,
            LoanType.BUSINESS: self.config.business_loan_rate,
            LoanType.STUDENT: self.config.student_loan_rate
        }.get(loan_type, self.config.personal_loan_rate)
    
    def get_max_term(self, loan_type: LoanType) -> int:
        """Get maximum term for loan type."""
        return {
            LoanType.PERSONAL: self.config.personal_loan_max_term,
            LoanType.MORTGAGE: self.config.mortgage_max_term,
            LoanType.AUTO: self.config.auto_loan_max_term,
            LoanType.BUSINESS: self.config.business_loan_max_term,
            LoanType.STUDENT: self.config.student_loan_max_term
        }.get(loan_type, 60)
    
    def calculate_loan_eligibility(
        self,
        customer_id: str,
        loan_type: LoanType,
        requested_amount: Decimal
    ) -> Tuple[bool, str, Decimal]:
        """Calculate loan eligibility based on credit score."""
        customer = self.customer_service.get_customer(customer_id)
        if not customer:
            return False, "Customer not found", Decimal("0")
        
        credit_score = customer.credit_score
        
        # Minimum score requirements
        min_scores = {
            LoanType.PERSONAL: 580,
            LoanType.MORTGAGE: 620,
            LoanType.AUTO: 550,
            LoanType.BUSINESS: 650,
            LoanType.STUDENT: 500
        }
        
        min_score = min_scores.get(loan_type, 580)
        if credit_score < min_score:
            return False, f"Credit score below minimum of {min_score}", Decimal("0")
        
        # Maximum loan amounts based on credit score
        if credit_score >= 750:
            max_multiplier = Decimal("1.5")
        elif credit_score >= 700:
            max_multiplier = Decimal("1.25")
        elif credit_score >= 650:
            max_multiplier = Decimal("1.0")
        else:
            max_multiplier = Decimal("0.75")
        
        base_limits = {
            LoanType.PERSONAL: Decimal("50000"),
            LoanType.MORTGAGE: Decimal("500000"),
            LoanType.AUTO: Decimal("75000"),
            LoanType.BUSINESS: Decimal("250000"),
            LoanType.STUDENT: Decimal("100000")
        }
        
        max_amount = base_limits.get(loan_type, Decimal("50000")) * max_multiplier
        approved_amount = min(requested_amount, max_amount)
        
        return True, "Eligible", approved_amount
    
    def create_loan(
        self,
        customer_id: str,
        account_id: str,
        loan_type: LoanType,
        principal: Decimal,
        term_months: int,
        interest_rate: Optional[Decimal] = None
    ) -> Tuple[bool, str, Optional[Loan]]:
        """Create a new loan."""
        # Validate customer
        customer = self.customer_service.get_customer(customer_id)
        if not customer:
            return False, "Customer not found", None
        
        if customer.status != CustomerStatus.ACTIVE:
            return False, "Customer is not active", None
        
        # Validate account
        account = self.account_service.get_account(account_id)
        if not account:
            return False, "Account not found", None
        
        if account.customer_id != customer_id:
            return False, "Account does not belong to customer", None
        
        # Validate principal
        if principal <= 0:
            return False, "Principal must be positive", None
        
        # Validate term
        max_term = self.get_max_term(loan_type)
        if term_months <= 0 or term_months > max_term:
            return False, f"Term must be between 1 and {max_term} months", None
        
        # Check eligibility
        eligible, msg, approved_amount = self.calculate_loan_eligibility(
            customer_id, loan_type, principal
        )
        if not eligible:
            return False, msg, None
        
        if approved_amount < principal:
            return False, f"Maximum approved amount is ${approved_amount}", None
        
        # Determine interest rate
        rate = interest_rate or self.get_loan_rate(loan_type)
        
        # Calculate monthly payment
        monthly_payment = FinancialCalculator.calculate_monthly_payment(
            principal, rate, term_months
        )
        
        # Generate amortization schedule
        schedule = FinancialCalculator.generate_amortization_schedule(
            principal, rate, term_months, date.today()
        )
        
        # Create loan
        loan_id = IDGenerator.generate_loan_id(loan_type)
        loan = Loan(
            loan_id=loan_id,
            customer_id=customer_id,
            account_id=account_id,
            loan_type=loan_type,
            principal=principal,
            interest_rate=rate,
            term_months=term_months,
            monthly_payment=monthly_payment,
            remaining_balance=principal,
            status=LoanStatus.APPROVED,
            originated_date=date.today(),
            maturity_date=date.today() + timedelta(days=term_months * 30),
            next_payment_date=date.today() + timedelta(days=30),
            payment_schedule=schedule
        )
        
        self.loans[loan_id] = loan
        self.ws.ws_loan_count += 1
        
        return True, "Loan created successfully", loan
    
    def disburse_loan(self, loan_id: str) -> Tuple[bool, str]:
        """Disburse approved loan to account."""
        loan = self.loans.get(loan_id)
        if not loan:
            return False, "Loan not found"
        
        if loan.status != LoanStatus.APPROVED:
            return False, f"Loan status is {loan.status.value}, cannot disburse"
        
        account = self.account_service.get_account(loan.account_id)
        if not account:
            return False, "Account not found"
        
        # Credit account
        account.balance += loan.principal
        account.available_balance += loan.principal
        
        # Record transaction
        self.account_service._record_transaction(
            loan.account_id,
            TransactionType.LOAN_DISBURSEMENT,
            loan.principal,
            f"Loan disbursement - {loan.loan_id}"
        )
        
        loan.status = LoanStatus.ACTIVE
        self.ws.ws_total_loans_disbursed += loan.principal
        
        return True, "Loan disbursed successfully"
    
    def process_payment(
        self,
        loan_id: str,
        payment_amount: Optional[Decimal] = None
    ) -> Tuple[bool, str, Decimal]:
        """Process loan payment."""
        loan = self.loans.get(loan_id)
        if not loan:
            return False, "Loan not found", Decimal("0")
        
        if loan.status != LoanStatus.ACTIVE:
            return False, f"Loan status is {loan.status.value}", Decimal("0")
        
        account = self.account_service.get_account(loan.account_id)
        if not account:
            return False, "Account not found", Decimal("0")
        
        # Determine payment amount
        amount = payment_amount or loan.monthly_payment
        
        if amount <= 0:
            return False, "Payment amount must be positive", Decimal("0")
        
        if account.available_balance < amount:
            return False, "Insufficient funds", Decimal("0")
        
        # Calculate interest and principal portions
        monthly_rate = loan.interest_rate / Decimal("12")
        interest_portion = (loan.remaining_balance * monthly_rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        principal_portion = amount - interest_portion
        
        if principal_portion < 0:
            principal_portion = Decimal("0")
            interest_portion = amount
        
        # Debit account
        account.balance -= amount
        account.available_balance -= amount
        
        # Update loan
        loan.remaining_balance -= principal_portion
        if loan.remaining_balance < 0:
            loan.remaining_balance = Decimal("0")
        
        loan.payments_made += 1
        loan.total_interest_paid += interest_portion
        loan.next_payment_date = date.today() + timedelta(days=30)
        
        # Update payment schedule
        for payment in loan.payment_schedule:
            if not payment.is_paid and payment.payment_number == loan.payments_made:
                payment.is_paid = True
                payment.paid_date = date.today()
                payment.paid_amount = amount
                break
        
        # Check if paid off
        if loan.remaining_balance <= 0:
            loan.status = LoanStatus.PAID_OFF
            loan.remaining_balance = Decimal("0")
        
        # Record transaction
        self.account_service._record_transaction(
            loan.account_id,
            TransactionType.LOAN_PAYMENT,
            amount,
            f"Loan payment - {loan.loan_id}"
        )
        
        self.ws.ws_total_loan_payments += amount
        self.ws.ws_total_interest_earned += interest_portion
        
        return True, "Payment processed", loan.remaining_balance
    
    def get_loan(self, loan_id: str) -> Optional[Loan]:
        """Get loan by ID."""
        return self.loans.get(loan_id)
    
    def get_loan_balance(self, loan_id: str) -> Decimal:
        """Get remaining loan balance."""
        loan = self.loans.get(loan_id)
        if not loan:
            return Decimal("-1")
        return loan.remaining_balance
    
    def get_payoff_amount(self, loan_id: str) -> Tuple[bool, Decimal]:
        """Calculate current payoff amount."""
        loan = self.loans.get(loan_id)
        if not loan:
            return False, Decimal("0")
        
        if loan.status != LoanStatus.ACTIVE:
            return False, loan.remaining_balance
        
        payoff = FinancialCalculator.calculate_loan_payoff(
            loan.remaining_balance,
            loan.interest_rate,
            10  # 10 days for payoff processing
        )
        
        return True, payoff
    
    def get_customer_loans(self, customer_id: str) -> List[Loan]:
        """Get all loans for a customer."""
        return [l for l in self.loans.values() if l.customer_id == customer_id]
    
    def get_active_loans(self) -> List[Loan]:
        """Get all active loans."""
        return [l for l in self.loans.values() if l.status == LoanStatus.ACTIVE]
    
    def get_total_outstanding(self) -> Decimal:
        """Get total outstanding loan balance."""
        return sum(l.remaining_balance for l in self.loans.values() 
                   if l.status == LoanStatus.ACTIVE)


# ==================== STATEMENT SERVICE ====================
class StatementService:
    """Statement generation operations."""
    
    def __init__(
        self,
        account_service: AccountService
    ):
        self.account_service = account_service
        self.statements: Dict[str, Statement] = {}
    
    def generate_statement(
        self,
        account_id: str,
        period_start: date,
        period_end: date
    ) -> Tuple[bool, str, Optional[Statement]]:
        """Generate account statement for period."""
        account = self.account_service.get_account(account_id)
        if not account:
            return False, "Account not found", None
        
        if period_start >= period_end:
            return False, "Invalid date range", None
        
        # Get transactions in period
        all_transactions = self.account_service.transactions.get(account_id, [])
        period_transactions = [
            t for t in all_transactions
            if period_start <= t.timestamp.date() <= period_end
        ]
        
        # Calculate totals
        total_deposits = Decimal("0")
        total_withdrawals = Decimal("0")
        total_fees = Decimal("0")
        total_interest = Decimal("0")
        
        for t in period_transactions:
            if t.transaction_type == TransactionType.DEPOSIT:
                total_deposits += t.amount
            elif t.transaction_type == TransactionType.WITHDRAWAL:
                total_withdrawals += t.amount
            elif t.transaction_type == TransactionType.FEE_DEBIT:
                total_fees += t.amount
            elif t.transaction_type == TransactionType.INTEREST_CREDIT:
                total_interest += t.amount
        
        # Calculate opening balance
        opening_balance = account.balance
        for t in reversed(period_transactions):
            if t.transaction_type in (TransactionType.DEPOSIT, 
                                       TransactionType.TRANSFER_IN,
                                       TransactionType.INTEREST_CREDIT,
                                       TransactionType.LOAN_DISBURSEMENT):
                opening_balance -= t.amount
            else:
                opening_balance += t.amount
        
        # Create statement
        statement_id = IDGenerator.generate_statement_id(account_id, period_end)
        statement = Statement(
            statement_id=statement_id,
            account_id=account_id,
            period_start=period_start,
            period_end=period_end,
            opening_balance=opening_balance,
            closing_balance=account.balance,
            total_deposits=total_deposits,
            total_withdrawals=total_withdrawals,
            total_fees=total_fees,
            total_interest=total_interest,
            transactions=period_transactions
        )
        
        self.statements[statement_id] = statement
        return True, "Statement generated", statement
    
    def get_statement(self, statement_id: str) -> Optional[Statement]:
        """Get statement by ID."""
        return self.statements.get(statement_id)


# ==================== BATCH PROCESSOR ====================
class BatchProcessor:
    """Batch processing operations."""
    
    def __init__(
        self,
        config: SystemConfig,
        working_storage: WorkingStorage,
        account_service: AccountService,
        loan_service: LoanService
    ):
        self.config = config
        self.ws = working_storage
        self.account_service = account_service
        self.loan_service = loan_service
    
    def run_end_of_day(self) -> Dict[str, Any]:
        """Run end of day batch processing."""
        results = {
            "date": date.today().isoformat(),
            "daily_limits_reset": 0,
            "interest_applied": 0,
            "fees_applied": 0,
            "total_interest": Decimal("0"),
            "total_fees": Decimal("0")
        }
        
        # Reset daily limits
        results["daily_limits_reset"] = self.account_service.reset_daily_limits()
        
        return results
    
    def run_end_of_month(self) -> Dict[str, Any]:
        """Run end of month batch processing."""
        results = {
            "date": date.today().isoformat(),
            "accounts_processed": 0,
            "interest_credited": Decimal("0"),
            "fees_charged": Decimal("0"),
            "loans_processed": 0
        }
        
        # Apply interest to all accounts
        for account_id in self.account_service.accounts:
            success, interest = self.account_service.apply_interest(account_id)
            if success and interest > 0:
                results["interest_credited"] += interest
            results["accounts_processed"] += 1
        
        # Apply minimum balance fees
        for account_id in self.account_service.accounts:
            success, fee_applied = self.account_service.apply_minimum_balance_fee(account_id)
            if fee_applied:
                results["fees_charged"] += self.config.minimum_balance_fee
        
        return results
    
    def process_loan_payments_due(self) -> Dict[str, Any]:
        """Process all loan payments due today."""
        results = {
            "date": date.today().isoformat(),
            "payments_processed": 0,
            "payments_failed": 0,
            "total_collected": Decimal("0")
        }
        
        today = date.today()
        
        for loan in self.loan_service.loans.values():
            if loan.status == LoanStatus.ACTIVE and loan.next_payment_date <= today:
                success, msg, remaining = self.loan_service.process_payment(loan.loan_id)
                if success:
                    results["payments_processed"] += 1
                    results["total_collected"] += loan.monthly_payment
                else:
                    results["payments_failed"] += 1
        
        return results


# ==================== MAIN BANKING SYSTEM ====================
class BankingSystem:
    """Main banking system facade."""
    
    def __init__(self, config: Optional[SystemConfig] = None):
        self.config = config or SystemConfig()
        self.working_storage = WorkingStorage()
        
        # Initialize date
        self.working_storage.ws_current_date = int(date.today().strftime("%Y%m%d"))
        
        # Initialize services
        self.customer_service = CustomerService(self.config, self.working_storage)
        self.account_service = AccountService(
            self.config, self.working_storage, self.customer_service
        )
        self.transfer_service = TransferService(
            self.config, self.working_storage, self.account_service
        )
        self.loan_service = LoanService(
            self.config, self.working_storage, 
            self.account_service, self.customer_service
        )
        self.statement_service = StatementService(self.account_service)
        self.batch_processor = BatchProcessor(
            self.config, self.working_storage,
            self.account_service, self.loan_service
        )
    
    def get_system_stats(self) -> Dict[str, Any]:
        """Get current system statistics."""
        return {
            "date": date.today().isoformat(),
            "customers": self.working_storage.ws_customer_count,
            "accounts": self.working_storage.ws_account_count,
            "transactions": self.working_storage.ws_transaction_count,
            "loans": self.working_storage.ws_loan_count,
            "transfers": self.working_storage.ws_transfer_count,
            "errors": self.working_storage.ws_error_count,
            "total_deposits": str(self.working_storage.ws_total_deposits),
            "total_withdrawals": str(self.working_storage.ws_total_withdrawals),
            "total_transfers": str(self.working_storage.ws_total_transfers),
            "total_interest_paid": str(self.working_storage.ws_total_interest_paid),
            "total_fees_collected": str(self.working_storage.ws_total_fees_collected),
            "total_loans_disbursed": str(self.working_storage.ws_total_loans_disbursed),
            "total_loan_payments": str(self.working_storage.ws_total_loan_payments)
        }


# ==================== TESTS ====================
if __name__ == "__main__":
    # Initialize system
    bank = BankingSystem()
    
    # Create customer
    address = Address("123 Main St", "New York", "NY", "10001")
    success, msg, customer = bank.customer_service.create_customer(
        "John", "Doe", "john@example.com", "212-555-1234",
        address, date(1985, 5, 15), "123-45-6789"
    )
    assert success, msg
    print(f"Customer created: {customer.customer_id}")
    
    # Open checking account
    success, msg, checking = bank.account_service.open_account(
        customer.customer_id, AccountType.CHECKING, Decimal("1000"), True
    )
    assert success, msg
    print(f"Checking account: {checking.account_id}")
    
    # Open savings account
    success, msg, savings = bank.account_service.open_account(
        customer.customer_id, AccountType.SAVINGS, Decimal("5000")
    )
    assert success, msg
    print(f"Savings account: {savings.account_id}")
    
    # Make deposit
    success, msg = bank.account_service.deposit(
        checking.account_id, Decimal("500"), "Payroll deposit"
    )
    assert success
    print(f"Deposit: {msg}")
    
    # Make withdrawal
    success, msg = bank.account_service.withdraw(
        checking.account_id, Decimal("200"), "ATM withdrawal"
    )
    assert success
    print(f"Withdrawal: {msg}")
    
    # Transfer between accounts
    success, msg = bank.account_service.transfer(
        checking.account_id, savings.account_id, Decimal("300")
    )
    assert success
    print(f"Transfer: {msg}")
    
    # Wire transfer
    success, msg, transfer_id = bank.transfer_service.wire_transfer(
        savings.account_id, "EXT123456", Decimal("1000"), "Rent payment"
    )
    assert success
    print(f"Wire transfer: {transfer_id}")
    
    # Create loan
    success, msg, loan = bank.loan_service.create_loan(
        customer.customer_id, checking.account_id,
        LoanType.PERSONAL, Decimal("10000"), 36
    )
    assert success
    print(f"Loan created: {loan.loan_id}")
    
    # Disburse loan
    success, msg = bank.loan_service.disburse_loan(loan.loan_id)
    assert success
    print(f"Loan disbursed: {msg}")
    
    # Process loan payment
    success, msg, remaining = bank.loan_service.process_payment(loan.loan_id)
    assert success
    print(f"Loan payment: remaining balance ${remaining}")
    
    # Apply interest
    success, interest = bank.account_service.apply_interest(savings.account_id)
    print(f"Interest credited: ${interest}")
    
    # Get balances
    _, checking_bal = bank.account_service.get_balance(checking.account_id)
    _, savings_bal = bank.account_service.get_balance(savings.account_id)
    print(f"Checking balance: ${checking_bal}")
    print(f"Savings balance: ${savings_bal}")
    
    # Get system stats
    stats = bank.get_system_stats()
    print("\nSystem Statistics:")
    for key, value in stats.items():
        print(f"  {key}: {value}")
    
    print("\nAll tests passed successfully!")
