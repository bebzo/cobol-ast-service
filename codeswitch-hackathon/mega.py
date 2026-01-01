import datetime
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
    cust_total_balance: float
    cust_total_loans: float
    cust_total_investments: float


@dataclass
class AccountRecord:
    acct_id: str
    acct_cust_id: str
    acct_type: str
    acct_balance: float
    acct_available: float
    acct_pending: float
    acct_interest_rate: float
    acct_open_date: int
    acct_last_trans_date: int
    acct_status: str
    acct_overdraft_limit: float
    acct_monthly_fee: float
    acct_min_balance: float


@dataclass
class LoanRecord:
    loan_id: str
    loan_cust_id: str
    loan_type: str
    loan_original_amount: float
    loan_current_balance: float
    loan_interest_rate: float
    loan_term_months: int
    loan_payment_amount: float
    loan_next_payment_date: int
    loan_origination_date: int
    loan_maturity_date: int
    loan_status: str
    loan_collateral_value: float
    loan_ltv_ratio: float


@dataclass
class InsuranceRecord:
    ins_policy_id: str
    ins_cust_id: str
    ins_type: str
    ins_coverage_amount: float
    ins_premium_amount: float
    ins_deductible: float
    ins_effective_date: int
    ins_expiry_date: int
    ins_status: str
    ins_claims_count: int
    ins_total_claims: float


@dataclass
class InvestmentRecord:
    inv_id: str
    inv_cust_id: str
    inv_type: str
    inv_symbol: str
    inv_quantity: float
    inv_purchase_price: float
    inv_current_price: float
    inv_market_value: float
    inv_gain_loss: float
    inv_purchase_date: int
    inv_dividend_rate: float


@dataclass
class TransactionRecord:
    tran_id: str
    tran_timestamp: str
    tran_type: str
    tran_acct_from: str
    tran_acct_to: str
    tran_amount: float
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
class WsFileStatuses:
    ws_cust_status: str
    ws_acct_status: str
    ws_tran_status: str
    ws_loan_status: str
    ws_ins_status: str
    ws_inv_status: str
    ws_aud_status: str
    ws_rpt_status: str


@dataclass
class WsCurrentDateData:
    ws_current_date: int
    ws_current_time: int
    ws_current_timestamp: str


@dataclass
class WsCounters:
    ws_cust_count: int = 0
    ws_acct_count: int = 0
    ws_tran_count: int = 0
    ws_loan_count: int = 0
    ws_ins_count: int = 0
    ws_inv_count: int = 0
    ws_error_count: int = 0
    ws_process_count: int = 0


@dataclass
class WsTotals:
    ws_total_deposits: float = 0
    ws_total_withdrawals: float = 0
    ws_total_transfers: float = 0
    ws_total_loans: float = 0
    ws_total_payments: float = 0
    ws_total_interest: float = 0
    ws_total_fees: float = 0
    ws_total_premiums: float = 0
    ws_total_claims: float = 0
    ws_total_investments: float = 0
    ws_total_dividends: float = 0


@dataclass
class WsCalculationFields:
    ws_calc_amount: float = 0
    ws_calc_rate: float = 0
    ws_calc_term: int = 0
    ws_calc_result: float = 0
    ws_calc_interest: float = 0
    ws_calc_principal: float = 0
    ws_calc_payment: float = 0
    ws_calc_balance: float = 0
    ws_calc_fee: float = 0
    ws_calc_tax: float = 0


@dataclass
class WsFlags:
    ws_eof_flag: str = 'N'
    ws_error_flag: str = 'N'
    ws_valid_flag: str = 'N'
    ws_found_flag: str = 'N'
    ws_approved_flag: str = 'N'


@dataclass
class WsTaxBracket:
    ws_bracket_min: int
    ws_bracket_max: int
    ws_bracket_rate: float


@dataclass
class WsTaxTable1985:
    ws_tax_bracket_1: WsTaxBracket
    ws_tax_bracket_2: WsTaxBracket
    ws_tax_bracket_3: WsTaxBracket
    ws_tax_bracket_4: WsTaxBracket
    ws_tax_bracket_5: WsTaxBracket


@dataclass
class WsInterestRates:
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
class WsFeeSchedule:
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
class WsInsuranceRates:
    ws_life_rate_per_1000: float
    ws_health_base_premium: float
    ws_auto_base_premium: float
    ws_home_rate_per_1000: float
    ws_umbrella_rate: float


@dataclass
class WsTempVariables:
    ws_temp_string: str = ''
    ws_temp_number: float = 0
    ws_temp_date: int = 0
    ws_temp_flag: str = ''
    ws_temp_code: str = ''
    ws_temp_id: str = ''
    ws_temp_counter: int = 0


@dataclass
class WsWorkAreas:
    ws_formatted_date: str = ''
    ws_formatted_amount: str = ''
    ws_formatted_rate: str = ''
    ws_formatted_count: str = ''
    ws_formatted_pct: str = ''


report_line = ""
customer_record = CustomerRecord("", "", "", "", "", "", "", "", "", "", "", "", "", 0, "", "", 0, "", "", 0, 0, 0, 0)
account_record = AccountRecord("", "", "", 0, 0, 0, 0, 0, 0, "", 0, 0, 0)
loan_record = LoanRecord("", "", "", 0, 0, 0, 0, 0, 0, 0, 0, "", 0, 0)
insurance_record = InsuranceRecord("", "", "", 0, 0, 0, 0, 0, "", 0, 0)
investment_record = InvestmentRecord("", "", "", "", 0, 0, 0, 0, 0, 0, 0)
transaction_record = TransactionRecord("", "", "", "", "", 0, "", "", "")
audit_record = AuditRecord("", "", "", "", "", "", "")
ws_file_statuses = WsFileStatuses("", "", "", "", "", "", "", "")
ws_current_date_data = WsCurrentDateData(0, 0, "")
ws_counters = WsCounters()
ws_totals = WsTotals()
ws_calculation_fields = WsCalculationFields()
ws_flags = WsFlags()
ws_tax_table_1985 = WsTaxTable1985(
    WsTaxBracket(0, 3000, 0.11),
    WsTaxBracket(3001, 28000, 0.15),
    WsTaxBracket(28001, 45000, 0.25),
    WsTaxBracket(45001, 90000, 0.35),
    WsTaxBracket(90001, 999999999, 0.50)
)
ws_interest_rates = WsInterestRates(
    0.0225,
    0.0050,
    0.0350,
    0.0425,
    0.0475,
    0.0550,
    0.0625,
    0.0699,
    0.0549,
    0.0749,
    0.0999,
    0.0825,
    0.1899,
     0.0825)
ws_fee_schedule = WsFeeSchedule(35.00, 35.00, 25.00, 45.00, 3.00, 12.00, 5.00, 39.00, 0.100, 0.010, 95.00)
ws_insurance_rates = WsInsuranceRates(1.25, 450.00, 1200.00, 3.50, 200.00)
ws_temp_variables = WsTempVariables()
ws_work_areas = WsWorkAreas()


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
    global ws_counters, ws_totals, ws_flags
    ws_counters = WsCounters()
    ws_totals = WsTotals()
    ws_flags = WsFlags()


def get_current_date():
    global ws_current_date_data
    today = datetime.datetime.now()
    ws_current_date_data = WsCurrentDateData(
        int(today.strftime("%Y%m%d")),
        int(today.strftime("%H%M%S%f")[:8]),
        today.strftime("%Y%m%d-%H%M%S%f")[:26]
    )


def load_parameters():
    pass


def validate_system():
    global ws_flags
    if ws_file_statuses.ws_cust_status != '00':
        print("ERROR: CUSTOMER FILE OPEN FAILED")
        ws_flags.ws_error_flag = 'Y'
    if ws_file_statuses.ws_acct_status != '00':
        print("ERROR: ACCOUNT FILE OPEN FAILED")
        ws_flags.ws_error_flag = 'Y'


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
    ws_flags.ws_eof_flag = 'N'
    while ws_flags.ws_eof_flag == 'N':
        validate_deposit()
        if ws_flags.ws_valid_flag == 'Y':
            post_deposit()
            update_balance()
            ws_counters.ws_tran_count += 1
        ws_flags.ws_eof_flag = 'Y'


def validate_deposit():
    global ws_flags
    ws_flags.ws_valid_flag = 'Y'
    if ws_calculation_fields.ws_calc_amount < 0:
        ws_flags.ws_valid_flag = 'N'
    if account_record.acct_status != 'A':
        ws_flags.ws_valid_flag = 'N'


def post_deposit():
    global account_record, ws_totals
    account_record.acct_balance += ws_calculation_fields.ws_calc_amount
    account_record.acct_available += ws_calculation_fields.ws_calc_amount
    ws_totals.ws_total_deposits += ws_calculation_fields.ws_calc_amount
    write_transaction()


def update_balance():
    global account_record, ws_current_date_data
    account_record.acct_last_trans_date = ws_current_date_data.ws_current_date
    print("REWRITE ACCOUNT-RECORD")


def process_withdrawals():
    print("PROCESSING WITHDRAWALS...")
    ws_flags.ws_eof_flag = 'N'
    while ws_flags.ws_eof_flag == 'N':
        validate_withdrawal()
        if ws_flags.ws_valid_flag == 'Y':
            post_withdrawal()
            ws_counters.ws_tran_count += 1
        ws_flags.ws_eof_flag = 'Y'


def validate_withdrawal():
    global ws_flags
    ws_flags.ws_valid_flag = 'Y'
    if ws_calculation_fields.ws_calc_amount > account_record.acct_available:
        if ws_calculation_fields.ws_calc_amount > (account_record.acct_available + account_record.acct_overdraft_limit):
            ws_flags.ws_valid_flag = 'N'
        else:
            apply_overdraft_fee()


def apply_overdraft_fee():
    global ws_totals, account_record, ws_fee_schedule
    ws_totals.ws_total_fees += ws_fee_schedule.ws_overdraft_fee
    account_record.acct_balance -= ws_fee_schedule.ws_overdraft_fee


def post_withdrawal():
    global account_record, ws_totals
    account_record.acct_balance -= ws_calculation_fields.ws_calc_amount
    account_record.acct_available -= ws_calculation_fields.ws_calc_amount
    ws_totals.ws_total_withdrawals += ws_calculation_fields.ws_calc_amount
    write_transaction()


def process_transfers():
    print("PROCESSING TRANSFERS...")
    internal_transfer()
    wire_transfer()
    ach_transfer()


def internal_transfer():
    pass


def wire_transfer():
    global ws_totals, ws_fee_schedule
    ws_totals.ws_total_fees += ws_fee_schedule.ws_wire_fee_domestic


def ach_transfer():
    pass


def calculate_interest():
    print("CALCULATING INTEREST...")
    ws_flags.ws_eof_flag = 'N'
    while ws_flags.ws_eof_flag == 'N':
        determine_rate()
        compute_interest()
        post_interest()
        ws_flags.ws_eof_flag = 'Y'


def determine_rate():
    global ws_calculation_fields, account_record, ws_interest_rates
    if account_record.acct_type == 'CH':
        ws_calculation_fields.ws_calc_rate = ws_interest_rates.ws_checking_rate
    elif account_record.acct_type == 'SV':
        ws_calculation_fields.ws_calc_rate = ws_interest_rates.ws_savings_rate
    elif account_record.acct_type == 'MM':
        ws_calculation_fields.ws_calc_rate = ws_interest_rates.ws_mm_rate
    elif account_record.acct_type == 'CD':
        ws_calculation_fields.ws_calc_rate = ws_interest_rates.ws_cd_rate_1yr
    else:
        ws_calculation_fields.ws_calc_rate = 0


def compute_interest():
    global ws_calculation_fields, account_record
    ws_calculation_fields.ws_calc_interest = account_record.acct_balance * ws_calculation_fields.ws_calc_rate / 12


def post_interest():
    global ws_calculation_fields, account_record, ws_totals
    account_record.acct_balance += ws_calculation_fields.ws_calc_interest
    ws_totals.ws_total_interest += ws_calculation_fields.ws_calc_interest


def apply_fees():
    print("APPLYING MONTHLY FEES...")
    ws_flags.ws_eof_flag = 'N'
    while ws_flags.ws_eof_flag == 'N':
        check_minimum_balance()
        if ws_flags.ws_valid_flag == 'Y':
            waive_fee()
        else:
            charge_fee()
        ws_flags.ws_eof_flag = 'Y'


def check_minimum_balance():
    global ws_flags, account_record
    if account_record.acct_balance >= account_record.acct_min_balance:
        ws_flags.ws_valid_flag = 'Y'
    else:
        ws_flags.ws_valid_flag = 'N'


def waive_fee():
    pass


def charge_fee():
    global account_record, ws_totals
    account_record.acct_balance -= account_record.acct_monthly_fee
    ws_totals.ws_total_fees += account_record.acct_monthly_fee


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
    ws_flags.ws_eof_flag = 'N'
    while ws_flags.ws_eof_flag == 'N':
        if loan_record.loan_status == 'C':
            calculate_payment()
            apply_payment()
            update_loan()
        ws_flags.ws_eof_flag = 'Y'


def calculate_payment():
    global ws_calculation_fields, loan_record
    ws_calculation_fields.ws_calc_payment = loan_record.loan_payment_amount
    ws_calculation_fields.ws_calc_interest = loan_record.loan_current_balance * loan_record.loan_interest_rate / 12
    ws_calculation_fields.ws_calc_principal = ws_calculation_fields.ws_calc_payment - ws_calculation_fields.ws_calc_interest


def apply_payment():
    global ws_calculation_fields, loan_record, ws_totals
    loan_record.loan_current_balance -= ws_calculation_fields.ws_calc_principal
    ws_totals.ws_total_payments += ws_calculation_fields.ws_calc_payment
    ws_totals.ws_total_interest += ws_calculation_fields.ws_calc_interest


def update_loan():
    global loan_record
    if loan_record.loan_current_balance <= 0:
        loan_record.loan_status = 'P'
    print("REWRITE LOAN-RECORD")


def calculate_amortization():
    print("CALCULATING AMORTIZATION SCHEDULES...")
    pass


def assess_delinquencies():
    print("ASSESSING DELINQUENT LOANS...")
    ws_flags.ws_eof_flag = 'N'
    while ws_flags.ws_eof_flag == 'N':
        check_payment_status()
        if ws_flags.ws_found_flag == 'N':
            mark_delinquent()
            assess_late_fee()
        ws_flags.ws_eof_flag = 'Y'


def check_payment_status():
    global ws_flags, ws_current_date_data, loan_record
    if loan_record.loan_next_payment_date < ws_current_date_data.ws_current_date:
        ws_flags.ws_found_flag = 'N'
    else:
        ws_flags.ws_found_flag = 'Y'


def mark_delinquent():
    global loan_record
    loan_record.loan_status = 'D'


def assess_late_fee():
    global ws_totals, ws_fee_schedule
    ws_totals.ws_total_fees += ws_fee_schedule.ws_late_payment_fee


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
    ws_flags.ws_eof_flag = 'N'
    while ws_flags.ws_eof_flag == 'N':
        determine_base_premium()
        apply_risk_factor()
        calculate_final_premium()
        ws_flags.ws_eof_flag = 'Y'


def determine_base_premium():
    global ws_calculation_fields, insurance_record, ws_insurance_rates
    if insurance_record.ins_type == 'LI':
        ws_calculation_fields.ws_calc_amount = insurance_record.ins_coverage_amount / 1000 * ws_insurance_rates.ws_life_rate_per_1000
    elif insurance_record.ins_type == 'HE':
        ws_calculation_fields.ws_calc_amount = ws_insurance_rates.ws_health_base_premium
    elif insurance_record.ins_type == 'AU':
        ws_calculation_fields.ws_calc_amount = ws_insurance_rates.ws_auto_base_premium
    elif insurance_record.ins_type == 'HO':
        ws_calculation_fields.ws_calc_amount = insurance_record.ins_coverage_amount / 1000 * ws_insurance_rates.ws_home_rate_per_1000
    elif insurance_record.ins_type == 'UM':
        ws_calculation_fields.ws_calc_amount = ws_insurance_rates.ws_umbrella_rate


def apply_risk_factor():
    global ws_calculation_fields, insurance_record
    if insurance_record.ins_claims_count > 2:
        ws_calculation_fields.ws_calc_amount = ws_calculation_fields.ws_calc_amount * 1.25


def calculate_final_premium():
    global ws_calculation_fields, insurance_record, ws_totals
    insurance_record.ins_premium_amount = ws_calculation_fields.ws_calc_amount
    ws_totals.ws_total_premiums += ws_calculation_fields.ws_calc_amount


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
    ws_flags.ws_eof_flag = 'N'
    while ws_flags.ws_eof_flag == 'N':
        calculate_position_value()
        calculate_gain_loss()
        update_totals()
        ws_flags.ws_eof_flag = 'Y'


def calculate_position_value():
    global investment_record
    investment_record.inv_market_value = investment_record.inv_quantity * investment_record.inv_current_price


def calculate_gain_loss():
    global investment_record
    investment_record.inv_gain_loss = investment_record.inv_market_value - \
        (investment_record.inv_quantity * investment_record.inv_purchase_price)


def update_totals():
    global ws_totals, investment_record
    ws_totals.ws_total_investments += investment_record.inv_market_value


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
    ws_flags.ws_eof_flag = 'N'
    while ws_flags.ws_eof_flag == 'N':
        if investment_record.inv_dividend_rate > 0:
            compute_dividend()
            post_dividend()
        ws_flags.ws_eof_flag = 'Y'


def compute_dividend():
    global ws_calculation_fields, investment_record
    ws_calculation_fields.ws_calc_amount = investment_record.inv_market_value * investment_record.inv_dividend_rate / 4


def post_dividend():
    global ws_totals, ws_calculation_fields
    ws_totals.ws_total_dividends += ws_calculation_fields.ws_calc_amount


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
    global report_line, ws_current_date_data
    report_line = "MEGA-ENTERPRISE DAILY SUMMARY - " + str(ws_current_date_data.ws_current_date)
    print("WRITE REPORT-LINE")
    write_totals()


def write_totals():
    global report_line, ws_totals, ws_work_areas
    ws_work_areas.ws_formatted_amount = str(ws_totals.ws_total_deposits)
    report_line = "TOTAL DEPOSITS: " + ws_work_areas.ws_formatted_amount
    print("WRITE REPORT-LINE")

    ws_work_areas.ws_formatted_amount = str(ws_totals.ws_total_withdrawals)
    report_line = "TOTAL WITHDRAWALS: " + ws_work_areas.ws_formatted_amount
    print("WRITE REPORT-LINE")

    ws_work_areas.ws_formatted_amount = str(ws_totals.ws_total_loans)
    report_line = "TOTAL LOANS: " + ws_work_areas.ws_formatted_amount
    print("WRITE REPORT-LINE")


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
    global transaction_record, ws_current_date_data, ws_calculation_fields
    transaction_record.tran_timestamp = ws_current_date_data.ws_current_timestamp
    transaction_record.tran_type = 'DEP'
    transaction_record.tran_amount = ws_calculation_fields.ws_calc_amount
    transaction_record.tran_status = 'C'
    print("WRITE TRANSACTION-RECORD")


def write_audit():
    global audit_record, ws_current_date_data
    audit_record.aud_timestamp = ws_current_date_data.ws_current_timestamp
    print("WRITE AUDIT-RECORD")


def format_date():
    global ws_temp_variables, ws_work_areas
    ws_work_areas.ws_formatted_date = str(ws_temp_variables.ws_temp_date)[
                                          :4] + '-' + str(ws_temp_variables.ws_temp_date)[4:6] + '-' + str(ws_temp_variables.ws_temp_date)[6:8]


def validate_account():
    global ws_flags, account_record
    ws_flags.ws_valid_flag = 'Y'
    if account_record.acct_id == '':
        ws_flags.ws_valid_flag = 'N'


def calculate_tax():
    global ws_calculation_fields, ws_tax_table_1985
    if ws_calculation_fields.ws_calc_amount <= ws_tax_table_1985.ws_tax_bracket_1.ws_bracket_max:
        ws_calculation_fields.ws_calc_tax = ws_calculation_fields.ws_calc_amount * ws_tax_table_1985.ws_tax_bracket_1.ws_bracket_rate
    elif ws_calculation_fields.ws_calc_amount <= ws_tax_table_1985.ws_tax_bracket_2.ws_bracket_max:
        ws_calculation_fields.ws_calc_tax = (ws_tax_table_1985.ws_tax_bracket_1.ws_bracket_max * ws_tax_table_1985.ws_tax_bracket_1.ws_bracket_rate) + (
            (ws_calculation_fields.ws_calc_amount - ws_tax_table_1985.ws_tax_bracket_1.ws_bracket_max) * ws_tax_table_1985.ws_tax_bracket_2.ws_bracket_rate)
    elif ws_calculation_fields.ws_calc_amount <= ws_tax_table_1985.ws_tax_bracket_3.ws_bracket_max:
        ws_calculation_fields.ws_calc_tax = (
    ws_tax_table_1985.ws_tax_bracket_1.ws_bracket_max * ws_tax_table_1985.ws_tax_bracket_1.ws_bracket_rate) + (
        (ws_tax_table_1985.ws_tax_bracket_2.ws_bracket_max - ws_tax_table_1985.ws_tax_bracket_1.ws_bracket_max) * ws_tax_table_1985.ws_tax_bracket_2.ws_bracket_rate) + (
            (ws_calculation_fields.ws_calc_amount - ws_tax_table_1985.ws_tax_bracket_2.ws_bracket_max) * ws_tax_table_1985.ws_tax_bracket_3.ws_bracket_rate)
    else:
        ws_calculation_fields.ws_calc_tax = ws_calculation_fields.ws_calc_amount * ws_tax_table_1985.ws_tax_bracket_5.ws_bracket_rate


def termination():
    close_files()
    display_statistics()
    print("MEGA-ENTERPRISE SYSTEM TERMINATED NORMALLY")


def close_files():
    print("CLOSE CUSTOMER-MASTER\nCLOSE ACCOUNT-MASTER\nCLOSE LOAN-MASTER\nCLOSE INSURANCE-MASTER\nCLOSE INVESTMENT-MASTER\nCLOSE TRANSACTION-LOG\nCLOSE AUDIT-TRAIL\n")
