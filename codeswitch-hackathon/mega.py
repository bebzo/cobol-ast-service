import dataclasses
from dataclasses import dataclass


@dataclass
class CustomerRecord:
    cust_id: str
    cust_type: str
    cust_last_name: str
    cust_first_name: str
    cust_middle_name: str
    cust_street: str
    cust_city: str
    cust_state: str
    cust_zip: str
    cust_country: str
    cust_phone: str
    cust_email: str
    cust_fax: str
    cust_dob: int
    cust_ssn: str
    cust_tax_id: str
    cust_credit_score: int
    cust_risk_rating: str
    cust_status: str
    cust_open_date: int
    cust_last_activity: int
    cust_total_balance: int
    cust_total_loans: int
    cust_total_investments: int


@dataclass
class AccountRecord:
    acct_id: str
    acct_cust_id: str
    acct_type: str
    acct_balance: int
    acct_available: int
    acct_pending: int
    acct_interest_rate: int
    acct_open_date: int
    acct_last_trans_date: int
    acct_status: str
    acct_overdraft_limit: int
    acct_monthly_fee: int
    acct_min_balance: int


@dataclass
class LoanRecord:
    loan_id: str
    loan_cust_id: str
    loan_type: str
    loan_original_amount: int
    loan_current_balance: int
    loan_interest_rate: int
    loan_term_months: int
    loan_payment_amount: int
    loan_next_payment_date: int
    loan_origination_date: int
    loan_maturity_date: int
    loan_status: str
    loan_collateral_value: int
    loan_ltv_ratio: int


@dataclass
class InsuranceRecord:
    ins_policy_id: str
    ins_cust_id: str
    ins_type: str
    ins_coverage_amount: int
    ins_premium_amount: int
    ins_deductible: int
    ins_effective_date: int
    ins_expiry_date: int
    ins_status: str
    ins_claims_count: int
    ins_total_claims: int


@dataclass
class InvestmentRecord:
    inv_id: str
    inv_cust_id: str
    inv_type: str
    inv_symbol: str
    inv_quantity: int
    inv_purchase_price: int
    inv_current_price: int
    inv_market_value: int
    inv_gain_loss: int
    inv_purchase_date: int
    inv_dividend_rate: int


@dataclass
class TransactionRecord:
    tran_id: str
    tran_timestamp: str
    tran_type: str
    tran_acct_from: str
    tran_acct_to: str
    tran_amount: int
    tran_status: str
    tran_user_id: str
    tran_terminal_id: str


@dataclass
class AuditRecord:
    aud_timestamp: str
    aud_user: str
    aud_action: str
    aud_entity: str
    aud_entity_id: str
    aud_old_value: str
    aud_new_value: str


@dataclass
class FileStatuses:
    ws_cust_status: str
    ws_acct_status: str
    ws_tran_status: str
    ws_loan_status: str
    ws_ins_status: str
    ws_inv_status: str
    ws_aud_status: str
    ws_rpt_status: str


@dataclass
class CurrentDateData:
    ws_current_date: int
    ws_current_time: int
    ws_current_timestamp: str


@dataclass
class Counters:
    ws_cust_count: int
    ws_acct_count: int
    ws_tran_count: int
    ws_loan_count: int
    ws_ins_count: int
    ws_inv_count: int
    ws_error_count: int
    ws_process_count: int


@dataclass
class Totals:
    ws_total_deposits: int
    ws_total_withdrawals: int
    ws_total_transfers: int
    ws_total_loans: int
    ws_total_payments: int
    ws_total_interest: int
    ws_total_fees: int
    ws_total_premiums: int
    ws_total_claims: int
    ws_total_investments: int
    ws_total_dividends: int


@dataclass
class CalculationFields:
    ws_calc_amount: int
    ws_calc_rate: int
    ws_calc_term: int
    ws_calc_result: int
    ws_calc_interest: int
    ws_calc_principal: int
    ws_calc_payment: int
    ws_calc_balance: int
    ws_calc_fee: int
    ws_calc_tax: int


@dataclass
class Flags:
    ws_eof_flag: str
    ws_error_flag: str
    ws_valid_flag: str
    ws_found_flag: str
    ws_approved_flag: str


@dataclass
class TaxBracket:
    ws_bracket_min: int
    ws_bracket_max: int
    ws_bracket_rate: float


@dataclass
class TaxTable1985:
    ws_tax_bracket_1: TaxBracket
    ws_tax_bracket_2: TaxBracket
    ws_tax_bracket_3: TaxBracket
    ws_tax_bracket_4: TaxBracket
    ws_tax_bracket_5: TaxBracket


@dataclass
class InterestRates:
    ws_savings_rate: float
    ws_checking_rate: float
    ws_mm_rate: float
    ws_cd_rate_1yr: float
    ws_cd_rate_2yr: float
    ws_cd_rate_5yr: float
    ws_mortgage_rate_15: float
    ws_mortgage_rate_30: float
    ws_auto_rate_new: float
    ws_auto_rate_used: float
    ws_personal_rate: float
    ws_heloc_rate: float
    ws_credit_card_rate: float
    ws_prime_rate: float


@dataclass
class FeeSchedule:
    ws_overdraft_fee: float
    ws_nsf_fee: float
    ws_wire_fee_domestic: float
    ws_wire_fee_intl: float
    ws_atm_fee_foreign: float
    ws_monthly_fee_checking: float
    ws_monthly_fee_savings: float
    ws_late_payment_fee: float
    ws_early_withdrawal_pct: float
    ws_loan_origination_pct: float
    ws_annual_fee_card: float


@dataclass
class InsuranceRates:
    ws_life_rate_per_1000: float
    ws_health_base_premium: float
    ws_auto_base_premium: float
    ws_home_rate_per_1000: float
    ws_umbrella_rate: float


@dataclass
class TempVariables:
    ws_temp_string: str
    ws_temp_number: int
    ws_temp_date: int
    ws_temp_flag: str
    ws_temp_code: str
    ws_temp_id: str
    ws_temp_counter: int


@dataclass
class WorkAreas:
    ws_formatted_date: str
    ws_formatted_amount: str
    ws_formatted_rate: float
    ws_formatted_count: str
    ws_formatted_pct: str


def main_control():
    initialization()
    process_banking()
    process_loans()
    process_insurance()
    process_investments()
    generate_reports()
    termination()
    print("STOP RUN")


def initialization():
    open_files()
    initialize_counters()
    get_current_date()
    load_parameters()
    validate_system()
    print("MEGA-ENTERPRISE SYSTEM INITIALIZED")


def open_files():
    print("OPEN INPUT CUSTOMER-MASTER\nOPEN I-O ACCOUNT-MASTER\nOPEN I-O LOAN-MASTER\nOPEN I-O INSURANCE-MASTER\nOPEN I-O INVESTMENT-MASTER\nOPEN OUTPUT TRANSACTION-LOG\nOPEN OUTPUT AUDIT-TRAIL\nOPEN OUTPUT REPORT-FILE")


def initialize_counters():
    print("INITIALIZE WS-COUNTERS\nINITIALIZE WS-TOTALS\nINITIALIZE WS-FLAGS")


def get_current_date():
    print("ACCEPT WS-CURRENT-DATE FROM DATE YYYYMMDD\nACCEPT WS-CURRENT-TIME FROM TIME\nSTRING WS-CURRENT-DATE DELIMITED SIZE\n       '-' DELIMITED SIZE\n       WS-CURRENT-TIME DELIMITED SIZE\n       INTO WS-CURRENT-TIMESTAMP")


def load_parameters():
    pass


def validate_system():
    print("IF WS-CUST-STATUS NOT = '00'\n    DISPLAY \"ERROR: CUSTOMER FILE OPEN FAILED\"\n    SET WS-ERROR TO TRUE\nEND-IF\nIF WS-ACCT-STATUS NOT = '00'\n    DISPLAY \"ERROR: ACCOUNT FILE OPEN FAILED\"\n    SET WS-ERROR TO TRUE\nEND-IF")


def process_banking():
    process_deposits()
    process_withdrawals()
    process_transfers()
    calculate_interest()
    apply_fees()
    process_payments()
    reconcile_accounts()


def process_deposits():
    print("PROCESSING DEPOSITS...")
    print("SET WS-NOT-EOF TO TRUE\nPERFORM UNTIL WS-EOF\n    READ ACCOUNT-MASTER NEXT\n        AT END SET WS-EOF TO TRUE\n        NOT AT END\n            PERFORM 2110-VALIDATE-DEPOSIT\n            IF WS-VALID\n                PERFORM 2120-POST-DEPOSIT\n                PERFORM 2130-UPDATE-BALANCE\n                ADD 1 TO WS-TRAN-COUNT\n            END-IF\n    END-READ\nEND-PERFORM")


def validate_deposit():
    print("SET WS-VALID TO TRUE\nIF WS-CALC-AMOUNT < 0\n    SET WS-INVALID TO TRUE\nEND-IF\nIF ACCT-STATUS NOT = 'A'\n    SET WS-INVALID TO TRUE\nEND-IF")


def post_deposit():
    print("ADD WS-CALC-AMOUNT TO ACCT-BALANCE\nADD WS-CALC-AMOUNT TO ACCT-AVAILABLE\nADD WS-CALC-AMOUNT TO WS-TOTAL-DEPOSITS\nPERFORM 8100-WRITE-TRANSACTION")


def update_balance():
    print("MOVE WS-CURRENT-DATE TO ACCT-LAST-TRANS-DATE\nREWRITE ACCOUNT-RECORD")


def process_withdrawals():
    print("PROCESSING WITHDRAWALS...")
    print("SET WS-NOT-EOF TO TRUE\nPERFORM UNTIL WS-EOF\n    READ ACCOUNT-MASTER NEXT\n        AT END SET WS-EOF TO TRUE\n        NOT AT END\n            PERFORM 2210-VALIDATE-WITHDRAWAL\n            IF WS-VALID\n                PERFORM 2220-POST-WITHDRAWAL\n                ADD 1 TO WS-TRAN-COUNT\n            END-IF\n    END-READ\nEND-PERFORM")


def validate_withdrawal():
    print("SET WS-VALID TO TRUE\nIF WS-CALC-AMOUNT > ACCT-AVAILABLE\n    IF WS-CALC-AMOUNT > \n       (ACCT-AVAILABLE + ACCT-OVERDRAFT-LIMIT)\n        SET WS-INVALID TO TRUE\n    ELSE\n        PERFORM 2215-APPLY-OVERDRAFT-FEE\n    END-IF\nEND-IF")


def apply_overdraft_fee():
    print("ADD WS-OVERDRAFT-FEE TO WS-TOTAL-FEES\nSUBTRACT WS-OVERDRAFT-FEE FROM ACCT-BALANCE")


def post_withdrawal():
    print("SUBTRACT WS-CALC-AMOUNT FROM ACCT-BALANCE\nSUBTRACT WS-CALC-AMOUNT FROM ACCT-AVAILABLE\nADD WS-CALC-AMOUNT TO WS-TOTAL-WITHDRAWALS\nPERFORM 8100-WRITE-TRANSACTION")


def process_transfers():
    print("PROCESSING TRANSFERS...")
    internal_transfer()
    wire_transfer()
    ach_transfer()


def internal_transfer():
    pass


def wire_transfer():
    print("ADD WS-WIRE-FEE-DOMESTIC TO WS-TOTAL-FEES")


def ach_transfer():
    pass


def calculate_interest():
    print("CALCULATING INTEREST...")
    print("SET WS-NOT-EOF TO TRUE\nPERFORM UNTIL WS-EOF\n    READ ACCOUNT-MASTER NEXT\n        AT END SET WS-EOF TO TRUE\n        NOT AT END\n            PERFORM 2410-DETERMINE-RATE\n            PERFORM 2420-COMPUTE-INTEREST\n            PERFORM 2430-POST-INTEREST\n    END-READ\nEND-PERFORM")


def determine_rate():
    print("EVALUATE TRUE\n    WHEN ACCT-CHECKING\n        MOVE WS-CHECKING-RATE TO WS-CALC-RATE\n    WHEN ACCT-SAVINGS\n        MOVE WS-SAVINGS-RATE TO WS-CALC-RATE\n    WHEN ACCT-MONEY-MARKET\n        MOVE WS-MM-RATE TO WS-CALC-RATE\n    WHEN ACCT-CD\n        MOVE WS-CD-RATE-1YR TO WS-CALC-RATE\n    WHEN OTHER\n        MOVE 0 TO WS-CALC-RATE\nEND-EVALUATE")


def compute_interest():
    print("COMPUTE WS-CALC-INTEREST =\n    ACCT-BALANCE * WS-CALC-RATE / 12")


def post_interest():
    print("ADD WS-CALC-INTEREST TO ACCT-BALANCE\nADD WS-CALC-INTEREST TO WS-TOTAL-INTEREST")


def apply_fees():
    print("APPLYING MONTHLY FEES...")
    print("SET WS-NOT-EOF TO TRUE\nPERFORM UNTIL WS-EOF\n    READ ACCOUNT-MASTER NEXT\n        AT END SET WS-EOF TO TRUE\n        NOT AT END\n            PERFORM 2510-CHECK-MINIMUM-BALANCE\n            IF WS-VALID\n                PERFORM 2520-WAIVE-FEE\n            ELSE\n                PERFORM 2530-CHARGE-FEE\n            END-IF\n    END-READ\nEND-PERFORM")


def check_minimum_balance():
    print("IF ACCT-BALANCE >= ACCT-MIN-BALANCE\n    SET WS-VALID TO TRUE\nELSE\n    SET WS-INVALID TO TRUE\nEND-IF")


def waive_fee():
    pass


def charge_fee():
    print("SUBTRACT ACCT-MONTHLY-FEE FROM ACCT-BALANCE\nADD ACCT-MONTHLY-FEE TO WS-TOTAL-FEES")


def process_payments():
    print("PROCESSING BILL PAYMENTS...")
    pass


def reconcile_accounts():
    print("RECONCILING ACCOUNTS...")
    pass


def process_loans():
    process_applications()
    process_payments()
    calculate_amortization()
    assess_delinquencies()
    process_collections()
    handle_defaults()


def process_applications():
    print("PROCESSING LOAN APPLICATIONS...")
    pass


def process_payments():
    print("PROCESSING LOAN PAYMENTS...")
    print("SET WS-NOT-EOF TO TRUE\nPERFORM UNTIL WS-EOF\n    READ LOAN-MASTER NEXT\n        AT END SET WS-EOF TO TRUE\n        NOT AT END\n            IF LOAN-CURRENT\n                PERFORM 3210-CALCULATE-PAYMENT\n                PERFORM 3220-APPLY-PAYMENT\n                PERFORM 3230-UPDATE-LOAN\n            END-IF\n    END-READ\nEND-PERFORM")


def calculate_payment():
    print("MOVE LOAN-PAYMENT-AMOUNT TO WS-CALC-PAYMENT\nCOMPUTE WS-CALC-INTEREST =\n    LOAN-CURRENT-BALANCE * LOAN-INTEREST-RATE / 12\nCOMPUTE WS-CALC-PRINCIPAL =\n    WS-CALC-PAYMENT - WS-CALC-INTEREST")


def apply_payment():
    print("SUBTRACT WS-CALC-PRINCIPAL FROM LOAN-CURRENT-BALANCE\nADD WS-CALC-PAYMENT TO WS-TOTAL-PAYMENTS\nADD WS-CALC-INTEREST TO WS-TOTAL-INTEREST")


def update_loan():
    print("IF LOAN-CURRENT-BALANCE <= 0\n    SET LOAN-PAID-OFF TO TRUE\nEND-IF\nREWRITE LOAN-RECORD")


def calculate_amortization():
    print("CALCULATING AMORTIZATION SCHEDULES...")
    pass


def assess_delinquencies():
    print("ASSESSING DELINQUENT LOANS...")
    print("SET WS-NOT-EOF TO TRUE\nPERFORM UNTIL WS-EOF\n    READ LOAN-MASTER NEXT\n        AT END SET WS-EOF TO TRUE\n        NOT AT END\n            PERFORM 3410-CHECK-PAYMENT-STATUS\n            IF WS-NOT-FOUND\n                PERFORM 3420-MARK-DELINQUENT\n                PERFORM 3430-ASSESS-LATE-FEE\n            END-IF\n    END-READ\nEND-PERFORM")


def check_payment_status():
    print("IF LOAN-NEXT-PAYMENT-DATE < WS-CURRENT-DATE\n    SET WS-NOT-FOUND TO TRUE\nELSE\n    SET WS-FOUND TO TRUE\nEND-IF")


def mark_delinquent():
    print("SET LOAN-DELINQUENT TO TRUE")


def assess_late_fee():
    print("ADD WS-LATE-PAYMENT-FEE TO WS-TOTAL-FEES")


def process_collections():
    print("PROCESSING COLLECTIONS...")
    pass


def handle_defaults():
    print("HANDLING DEFAULTS...")
    pass


def process_insurance():
    process_policies()
    calculate_premiums()
    process_claims()
    assess_risk()
    renew_policies()


def process_policies():
    print("PROCESSING INSURANCE POLICIES...")
    pass


def calculate_premiums():
    print("CALCULATING PREMIUMS...")
    print("SET WS-NOT-EOF TO TRUE\nPERFORM UNTIL WS-EOF\n    READ INSURANCE-MASTER NEXT\n        AT END SET WS-EOF TO TRUE\n        NOT AT END\n            PERFORM 4210-DETERMINE-BASE-PREMIUM\n            PERFORM 4220-APPLY-RISK-FACTOR\n            PERFORM 4230-CALCULATE-FINAL-PREMIUM\n    END-READ\nEND-PERFORM")


def determine_base_premium():
    print("EVALUATE TRUE\n    WHEN INS-LIFE\n        COMPUTE WS-CALC-AMOUNT =\n            INS-COVERAGE-AMOUNT / 1000 * WS-LIFE-RATE-PER-1000\n    WHEN INS-HEALTH\n        MOVE WS-HEALTH-BASE-PREMIUM TO WS-CALC-AMOUNT\n    WHEN INS-AUTO\n        MOVE WS-AUTO-BASE-PREMIUM TO WS-CALC-AMOUNT\n    WHEN INS-HOME\n        COMPUTE WS-CALC-AMOUNT =\n            INS-COVERAGE-AMOUNT / 1000 * WS-HOME-RATE-PER-1000\n    WHEN INS-UMBRELLA\n        MOVE WS-UMBRELLA-RATE TO WS-CALC-AMOUNT\nEND-EVALUATE")


def apply_risk_factor():
    print("IF INS-CLAIMS-COUNT > 2\n    COMPUTE WS-CALC-AMOUNT = WS-CALC-AMOUNT * 1.25\nEND-IF")


def calculate_final_premium():
    print("MOVE WS-CALC-AMOUNT TO INS-PREMIUM-AMOUNT\nADD WS-CALC-AMOUNT TO WS-TOTAL-PREMIUMS")


def process_claims():
    print("PROCESSING INSURANCE CLAIMS...")
    pass


def assess_risk():
    print("ASSESSING INSURANCE RISK...")
    pass


def renew_policies():
    print("RENEWING POLICIES...")
    pass


def process_investments():
    update_market_prices()
    calculate_portfolio_value()
    process_trades()
    calculate_dividends()
    generate_tax_documents()


def update_market_prices():
    print("UPDATING MARKET PRICES...")
    pass


def calculate_portfolio_value():
    print("CALCULATING PORTFOLIO VALUES...")
    print("SET WS-NOT-EOF TO TRUE\nPERFORM UNTIL WS-EOF\n    READ INVESTMENT-MASTER NEXT\n        AT END SET WS-EOF TO TRUE\n        NOT AT END\n            PERFORM 5210-CALCULATE-POSITION-VALUE\n            PERFORM 5220-CALCULATE-GAIN-LOSS\n            PERFORM 5230-UPDATE-TOTALS\n    END-READ\nEND-PERFORM")


def calculate_position_value():
    print("COMPUTE INV-MARKET-VALUE =\n    INV-QUANTITY * INV-CURRENT-PRICE")


def calculate_gain_loss():
    print("COMPUTE INV-GAIN-LOSS =\n    INV-MARKET-VALUE - (INV-QUANTITY * INV-PURCHASE-PRICE)")


def update_totals():
    print("ADD INV-MARKET-VALUE TO WS-TOTAL-INVESTMENTS")


def process_trades():
    print("PROCESSING TRADES...")
    process_buy_orders()
    process_sell_orders()
    settle_trades()


def process_buy_orders():
    pass


def process_sell_orders():
    pass


def settle_trades():
    pass


def calculate_dividends():
    print("CALCULATING DIVIDENDS...")
    print("SET WS-NOT-EOF TO TRUE\nPERFORM UNTIL WS-EOF\n    READ INVESTMENT-MASTER NEXT\n        AT END SET WS-EOF TO TRUE\n        NOT AT END\n            IF INV-DIVIDEND-RATE > 0\n                PERFORM 5410-COMPUTE-DIVIDEND\n                PERFORM 5420-POST-DIVIDEND\n            END-IF\n    END-READ\nEND-PERFORM")


def compute_dividend():
    print("COMPUTE WS-CALC-AMOUNT =\n    INV-MARKET-VALUE * INV-DIVIDEND-RATE / 4")


def post_dividend():
    print("ADD WS-CALC-AMOUNT TO WS-TOTAL-DIVIDENDS")


def generate_tax_documents():
    print("GENERATING TAX DOCUMENTS...")
    pass


def generate_reports():
    daily_summary()
    account_statements()
    loan_reports()
    insurance_reports()
    investment_reports()
    regulatory_reports()
    management_reports()


def daily_summary():
    print("GENERATING DAILY SUMMARY...")
    print("MOVE SPACES TO REPORT-LINE\nSTRING \"MEGA-ENTERPRISE DAILY SUMMARY - \" DELIMITED SIZE\n       WS-CURRENT-DATE DELIMITED SIZE\n       INTO REPORT-LINE\nWRITE REPORT-LINE\nPERFORM 6110-WRITE-TOTALS")


def write_totals():
    print("MOVE WS-TOTAL-DEPOSITS TO WS-FORMATTED-AMOUNT\nSTRING \"TOTAL DEPOSITS: \" DELIMITED SIZE\n       WS-FORMATTED-AMOUNT DELIMITED SIZE\n       INTO REPORT-LINE\nWRITE REPORT-LINE\n\nMOVE WS-TOTAL-WITHDRAWALS TO WS-FORMATTED-AMOUNT\nSTRING \"TOTAL WITHDRAWALS: \" DELIMITED SIZE\n       WS-FORMATTED-AMOUNT DELIMITED SIZE\n       INTO REPORT-LINE\nWRITE REPORT-LINE\n\nMOVE WS-TOTAL-LOANS TO WS-FORMATTED-AMOUNT\nSTRING \"TOTAL LOANS: \" DELIMITED SIZE\n       WS-FORMATTED-AMOUNT DELIMITED SIZE\n       INTO REPORT-LINE\nWRITE REPORT-LINE")


def account_statements():
    print("GENERATING ACCOUNT STATEMENTS...")
    pass


def loan_reports():
    print("GENERATING LOAN REPORTS...")
    pass


def insurance_reports():
    print("GENERATING INSURANCE REPORTS...")
    pass


def investment_reports():
    print("GENERATING INVESTMENT REPORTS...")
    pass


def regulatory_reports():
    print("GENERATING REGULATORY REPORTS...")
    generate_call_report()
    generate_sar()
    generate_ctr()


def generate_call_report():
    pass


def generate_sar():
    pass


def generate_ctr():
    pass


def management_reports():
    print("GENERATING MANAGEMENT REPORTS...")
    pass


def utility_procedures():
    pass


def write_transaction():
    print("MOVE WS-CURRENT-TIMESTAMP TO TRAN-TIMESTAMP\nMOVE 'DEP' TO TRAN-TYPE\nMOVE WS-CALC-AMOUNT TO TRAN-AMOUNT\nMOVE 'C' TO TRAN-STATUS\nWRITE TRANSACTION-RECORD")


def write_audit():
    print("MOVE WS-CURRENT-TIMESTAMP TO AUD-TIMESTAMP\nWRITE AUDIT-RECORD")


def format_date():
    print("STRING WS-TEMP-DATE(1:4) DELIMITED SIZE\n       '-' DELIMITED SIZE\n       WS-TEMP-DATE(5:2) DELIMITED SIZE\n       '-' DELIMITED SIZE\n       WS-TEMP-DATE(7:2) DELIMITED SIZE\n       INTO WS-FORMATTED-DATE")


def validate_account():
    print("SET WS-VALID TO TRUE\nIF ACCT-ID = SPACES\n    SET WS-INVALID TO TRUE\nEND-IF")


def calculate_tax():
    print("EVALUATE TRUE\n    WHEN WS-CALC-AMOUNT <= WS-BRACKET-1-MAX\n        COMPUTE WS-CALC-TAX =\n            WS-CALC-AMOUNT * WS-BRACKET-1-RATE\n    WHEN WS-CALC-AMOUNT <= WS-BRACKET-2-MAX\n        COMPUTE WS-CALC-TAX =\n            (WS-BRACKET-1-MAX * WS-BRACKET-1-RATE) +\n            ((WS-CALC-AMOUNT - WS-BRACKET-1-MAX) *\n             WS-BRACKET-2-RATE)\n    WHEN WS-CALC-AMOUNT <= WS-BRACKET-3-MAX\n        COMPUTE WS-CALC-TAX =\n            (WS-BRACKET-1-MAX * WS-BRACKET-1-RATE) +\n            ((WS-BRACKET-2-MAX - WS-BRACKET-1-MAX) *\n             WS-BRACKET-2-RATE) +\n            ((WS-CALC-AMOUNT - WS-BRACKET-2-MAX) *\n             WS-BRACKET-3-RATE)\n    WHEN OTHER\n        COMPUTE WS-CALC-TAX =\n            WS-CALC-AMOUNT * WS-BRACKET-5-RATE\nEND-EVALUATE")


def termination():
    close_files()
    display_statistics()
    print("MEGA-ENTERPRISE SYSTEM TERMINATED NORMALLY")


def close_files():
    print("CLOSE CUSTOMER-MASTER\nCLOSE ACCOUNT-MASTER\nCLOSE LOAN-MASTER\nCLOSE INSURANCE-MASTER\nCLOSE INVESTMENT-MASTER\nCLOSE TRANSACTION-LOG\nCLOSE AUDIT-TRAIL\nCLOSE REPORT-FILE")


def display_statistics():
    print("DISPLAY \"============================================\"\nDISPLAY \"       PROCESSING STATISTICS                \"\nDISPLAY \"============================================\"\nMOVE WS-CUST-COUNT TO WS-FORMATTED-COUNT\nDISPLAY \"CUSTOMERS PROCESSED:    \" WS-FORMATTED-COUNT\nMOVE WS-ACCT-COUNT TO WS-FORMATTED-COUNT\nDISPLAY \"ACCOUNTS PROCESSED:     \" WS-FORMATTED-COUNT\nMOVE WS-TRAN-COUNT TO WS-FORMATTED-COUNT\nDISPLAY \"TRANSACTIONS PROCESSED: \" WS-FORMATTED-COUNT\nMOVE WS-LOAN-COUNT TO WS-FORMATTED-COUNT\nDISPLAY \"LOANS PROCESSED:        \" WS-FORMATTED-COUNT\nMOVE WS-ERROR-COUNT TO WS-FORMATTED-COUNT\nDISPLAY \"ERRORS ENCOUNTERED:     \" WS-FORMATTED-COUNT\nDISPLAY \"============================================\"\nMOVE WS-TOTAL-DEPOSITS TO WS-FORMATTED-AMOUNT\nDISPLAY \"TOTAL DEPOSITS:    \" WS-FORMATTED-AMOUNT\nMOVE WS-TOTAL-WITHDRAWALS TO WS-FORMATTED-AMOUNT\nDISPLAY \"TOTAL WITHDRAWALS: \" WS-FORMATTED-AMOUNT\nMOVE WS-TOTAL-INTEREST TO WS-FORMATTED-AMOUNT\nDISPLAY \"TOTAL INTEREST:    \" WS-FORMATTED-AMOUNT\nMOVE WS-TOTAL-FEES TO WS-FORMATTED-AMOUNT\nDISPLAY \"TOTAL FEES:        \" WS-FORMATTED-AMOUNT\nDISPLAY \"============================================\"")


def fraud_detection():
    analyze_patterns()
    check_velocity()
    geographic_analysis()
    behavioral_scoring()
    alert_generation()


def analyze_patterns():
    print("ANALYZING TRANSACTION PATTERNS...")
    print("SET WS-NOT-EOF TO TRUE\nPERFORM UNTIL WS-EOF\n    READ TRANSACTION-LOG NEXT\n        AT END SET WS-EOF TO TRUE\n        NOT AT END\n            PERFORM 7110-CHECK-AMOUNT-THRESHOLD\n            PERFORM 7120-CHECK-FREQUENCY\n            PERFORM 7130-CHECK-TIME-PATTERN\n    END-READ\nEND-PERFORM")


def check_amount_threshold():
    print("IF TRAN-AMOUNT > 10000\n    PERFORM 7115-FLAG-LARGE-TRANSACTION\nEND-IF")


def flag_large_transaction():
    print("ADD 1 TO WS-PROCESS-COUNT\nPERFORM 8200-WRITE-AUDIT")


def check_frequency():
    pass


def check_time_pattern():
    pass


def check_velocity():
    print("CHECKING TRANSACTION VELOCITY...")
    pass


def geographic_analysis():
    print("PERFORMING GEOGRAPHIC ANALYSIS...")
    pass


def behavioral_scoring():
    print("CALCULATING BEHAVIORAL SCORES...")
    print("SET WS-NOT-EOF TO TRUE\nPERFORM UNTIL WS-EOF\n    READ CUSTOMER-MASTER NEXT\n        AT END SET WS-EOF TO TRUE\n        NOT AT END\n            PERFORM 7410-CALCULATE-RISK-SCORE\n            PERFORM 7420-UPDATE-CUSTOMER-PROFILE\n    END-READ\nEND-PERFORM")


def calculate_risk_score():
    print("MOVE 0 TO WS-CALC-RESULT\nIF CUST-CREDIT-SCORE < 600\n    ADD 30 TO WS-CALC-RESULT\nEND-IF\nIF CUST-TOTAL-LOANS > CUST-TOTAL-BALANCE\n    ADD 20 TO WS-CALC-RESULT\nEND-IF")


def update_customer_profile():
    print("IF WS-CALC-RESULT > 50\n    MOVE 'H' TO CUST-RISK-RATING\nELSE IF WS-CALC-RESULT > 25\n    MOVE 'M' TO CUST-RISK-RATING\nELSE\n    MOVE 'L' TO CUST-RISK-RATING\nEND-IF\nEND-IF")


def alert_generation():
    print("GENERATING FRAUD ALERTS...")
    pass


def compliance_processing():
    aml_screening()
    kyc_verification()
    ofac_check()
    pep_screening()
    sanction_list_check()


def aml_screening():
    print("PERFORMING AML SCREENING...")
    print("SET WS-NOT-EOF TO TRUE\nPERFORM UNTIL WS-EOF\n    READ TRANSACTION-LOG NEXT\n        AT END SET WS-EOF TO TRUE\n        NOT AT END\n            IF TRAN-AMOUNT >= 10000\n                PERFORM 7611-CTR-FILING\n            END-IF\n            PERFORM 7612-STRUCTURING-CHECK\n    END-READ\nEND-PERFORM")


def ctr_filing():
    print("ADD 1 TO WS-PROCESS-COUNT\nPERFORM 8200-WRITE-AUDIT")


def structuring_check():
    pass


def kyc_verification():
    print("VERIFYING KYC DOCUMENTS...")
    pass


def ofac_check():
    print("CHECKING OFAC LIST...")
    pass


def pep_screening():
    print("SCREENING POLITICALLY EXPOSED PERSONS...")
    pass


def sanction_list_check():
    print("CHECKING SANCTION LISTS...")
    pass


def credit_card_processing():
    authorize_transaction()
    process_settlement()
    calculate_rewards()
    apply_interest()
    generate_statements()


def authorize_transaction():
    print("AUTHORIZING CREDIT CARD TRANSACTIONS...")
    check_credit_limit()
    check_fraud_score()
    send_authorization()


def check_credit_limit():
    print("IF WS-CALC-AMOUNT > ACCT-OVERDRAFT-LIMIT\n    SET WS-NOT-APPROVED TO TRUE\nELSE\n    SET WS-APPROVED TO TRUE\nEND-IF")


def check_fraud_score():
    pass


def send_authorization():
    print("IF WS-APPROVED\n    PERFORM 8100-WRITE-TRANSACTION\nEND-IF")


def process_settlement():
    print("PROCESSING CREDIT CARD SETTLEMENTS...")
    pass


def calculate_rewards():
    print("CALCULATING REWARDS POINTS...")
    print("COMPUTE WS-CALC-RESULT = TRAN-AMOUNT * 0.01\nADD WS-CALC-RESULT TO WS-TOTAL-FEES")
