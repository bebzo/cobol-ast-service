       IDENTIFICATION DIVISION.
       PROGRAM-ID.  MEGA-ENTERPRISE-SYSTEM.
       AUTHOR.      GLOBAL-BANKING-CORP-1985.
       DATE-WRITTEN. 1985-01-15.
      *================================================================*
      * MEGA ENTERPRISE BANKING & INSURANCE CORE SYSTEM                *
      * MISSION-CRITICAL MAINFRAME APPLICATION - 40 YEARS LEGACY       *
      * WARNING: THIS SYSTEM PROCESSES $50B+ DAILY TRANSACTIONS        *
      *================================================================*
       
       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       SOURCE-COMPUTER. IBM-Z15.
       OBJECT-COMPUTER. IBM-Z15.
       
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT CUSTOMER-MASTER ASSIGN TO CUSTMAST
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS CUST-ID
               FILE STATUS IS WS-CUST-STATUS.
           SELECT ACCOUNT-MASTER ASSIGN TO ACCTMAST
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS ACCT-ID
               FILE STATUS IS WS-ACCT-STATUS.
           SELECT TRANSACTION-LOG ASSIGN TO TRANLOG
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-TRAN-STATUS.
           SELECT LOAN-MASTER ASSIGN TO LOANMAST
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS LOAN-ID
               FILE STATUS IS WS-LOAN-STATUS.
           SELECT INSURANCE-MASTER ASSIGN TO INSMAST
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS INS-POLICY-ID
               FILE STATUS IS WS-INS-STATUS.
           SELECT INVESTMENT-MASTER ASSIGN TO INVMAST
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS INV-ID
               FILE STATUS IS WS-INV-STATUS.
           SELECT AUDIT-TRAIL ASSIGN TO AUDTRAIL
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-AUD-STATUS.
           SELECT REPORT-FILE ASSIGN TO RPTFILE
               FILE STATUS IS WS-RPT-STATUS.

       DATA DIVISION.
       FILE SECTION.
       
       FD  CUSTOMER-MASTER
           LABEL RECORDS ARE STANDARD
           BLOCK CONTAINS 0 RECORDS.
       01  CUSTOMER-RECORD.
           05  CUST-ID                     PIC X(12).
           05  CUST-TYPE                   PIC X(1).
               88  CUST-INDIVIDUAL         VALUE 'I'.
               88  CUST-CORPORATE          VALUE 'C'.
               88  CUST-GOVERNMENT         VALUE 'G'.
           05  CUST-NAME.
               10  CUST-LAST-NAME          PIC X(30).
               10  CUST-FIRST-NAME         PIC X(20).
               10  CUST-MIDDLE-NAME        PIC X(15).
           05  CUST-ADDRESS.
               10  CUST-STREET             PIC X(50).
               10  CUST-CITY               PIC X(30).
               10  CUST-STATE              PIC X(2).
               10  CUST-ZIP                PIC X(10).
               10  CUST-COUNTRY            PIC X(3).
           05  CUST-CONTACT.
               10  CUST-PHONE              PIC X(15).
               10  CUST-EMAIL              PIC X(50).
               10  CUST-FAX                PIC X(15).
           05  CUST-DOB                    PIC 9(8).
           05  CUST-SSN                    PIC X(11).
           05  CUST-TAX-ID                 PIC X(15).
           05  CUST-CREDIT-SCORE           PIC 9(3).
           05  CUST-RISK-RATING            PIC X(1).
           05  CUST-STATUS                 PIC X(1).
               88  CUST-ACTIVE             VALUE 'A'.
               88  CUST-INACTIVE           VALUE 'I'.
               88  CUST-SUSPENDED          VALUE 'S'.
               88  CUST-CLOSED             VALUE 'C'.
           05  CUST-OPEN-DATE              PIC 9(8).
           05  CUST-LAST-ACTIVITY          PIC 9(8).
           05  CUST-TOTAL-BALANCE          PIC S9(15)V99 COMP-3.
           05  CUST-TOTAL-LOANS            PIC S9(15)V99 COMP-3.
           05  CUST-TOTAL-INVESTMENTS      PIC S9(15)V99 COMP-3.
           
       FD  ACCOUNT-MASTER
           LABEL RECORDS ARE STANDARD.
       01  ACCOUNT-RECORD.
           05  ACCT-ID                     PIC X(16).
           05  ACCT-CUST-ID                PIC X(12).
           05  ACCT-TYPE                   PIC X(2).
               88  ACCT-CHECKING           VALUE 'CH'.
               88  ACCT-SAVINGS            VALUE 'SV'.
               88  ACCT-MONEY-MARKET       VALUE 'MM'.
               88  ACCT-CD                 VALUE 'CD'.
               88  ACCT-IRA                VALUE 'IR'.
           05  ACCT-BALANCE                PIC S9(13)V99 COMP-3.
           05  ACCT-AVAILABLE              PIC S9(13)V99 COMP-3.
           05  ACCT-PENDING                PIC S9(13)V99 COMP-3.
           05  ACCT-INTEREST-RATE          PIC V9(6) COMP-3.
           05  ACCT-OPEN-DATE              PIC 9(8).
           05  ACCT-LAST-TRANS-DATE        PIC 9(8).
           05  ACCT-STATUS                 PIC X(1).
           05  ACCT-OVERDRAFT-LIMIT        PIC S9(9)V99 COMP-3.
           05  ACCT-MONTHLY-FEE            PIC S9(5)V99 COMP-3.
           05  ACCT-MIN-BALANCE            PIC S9(9)V99 COMP-3.
           
       FD  LOAN-MASTER
           LABEL RECORDS ARE STANDARD.
       01  LOAN-RECORD.
           05  LOAN-ID                     PIC X(16).
           05  LOAN-CUST-ID                PIC X(12).
           05  LOAN-TYPE                   PIC X(2).
               88  LOAN-MORTGAGE           VALUE 'MG'.
               88  LOAN-AUTO               VALUE 'AU'.
               88  LOAN-PERSONAL           VALUE 'PE'.
               88  LOAN-BUSINESS           VALUE 'BU'.
               88  LOAN-STUDENT            VALUE 'ST'.
               88  LOAN-HELOC              VALUE 'HE'.
           05  LOAN-ORIGINAL-AMOUNT        PIC S9(13)V99 COMP-3.
           05  LOAN-CURRENT-BALANCE        PIC S9(13)V99 COMP-3.
           05  LOAN-INTEREST-RATE          PIC V9(6) COMP-3.
           05  LOAN-TERM-MONTHS            PIC 9(4).
           05  LOAN-PAYMENT-AMOUNT         PIC S9(9)V99 COMP-3.
           05  LOAN-NEXT-PAYMENT-DATE      PIC 9(8).
           05  LOAN-ORIGINATION-DATE       PIC 9(8).
           05  LOAN-MATURITY-DATE          PIC 9(8).
           05  LOAN-STATUS                 PIC X(1).
               88  LOAN-CURRENT            VALUE 'C'.
               88  LOAN-DELINQUENT         VALUE 'D'.
               88  LOAN-DEFAULT            VALUE 'X'.
               88  LOAN-PAID-OFF           VALUE 'P'.
           05  LOAN-COLLATERAL-VALUE       PIC S9(13)V99 COMP-3.
           05  LOAN-LTV-RATIO              PIC V999.
           
       FD  INSURANCE-MASTER
           LABEL RECORDS ARE STANDARD.
       01  INSURANCE-RECORD.
           05  INS-POLICY-ID               PIC X(16).
           05  INS-CUST-ID                 PIC X(12).
           05  INS-TYPE                    PIC X(2).
               88  INS-LIFE                VALUE 'LI'.
               88  INS-HEALTH              VALUE 'HE'.
               88  INS-AUTO                VALUE 'AU'.
               88  INS-HOME                VALUE 'HO'.
               88  INS-UMBRELLA            VALUE 'UM'.
           05  INS-COVERAGE-AMOUNT         PIC S9(13)V99 COMP-3.
           05  INS-PREMIUM-AMOUNT          PIC S9(9)V99 COMP-3.
           05  INS-DEDUCTIBLE              PIC S9(9)V99 COMP-3.
           05  INS-EFFECTIVE-DATE          PIC 9(8).
           05  INS-EXPIRY-DATE             PIC 9(8).
           05  INS-STATUS                  PIC X(1).
           05  INS-CLAIMS-COUNT            PIC 9(4).
           05  INS-TOTAL-CLAIMS            PIC S9(13)V99 COMP-3.
           
       FD  INVESTMENT-MASTER
           LABEL RECORDS ARE STANDARD.
       01  INVESTMENT-RECORD.
           05  INV-ID                      PIC X(16).
           05  INV-CUST-ID                 PIC X(12).
           05  INV-TYPE                    PIC X(2).
               88  INV-STOCKS              VALUE 'ST'.
               88  INV-BONDS               VALUE 'BO'.
               88  INV-MUTUAL-FUND         VALUE 'MF'.
               88  INV-ETF                 VALUE 'ET'.
               88  INV-OPTIONS             VALUE 'OP'.
           05  INV-SYMBOL                  PIC X(10).
           05  INV-QUANTITY                PIC S9(11)V9(4) COMP-3.
           05  INV-PURCHASE-PRICE          PIC S9(9)V9(4) COMP-3.
           05  INV-CURRENT-PRICE           PIC S9(9)V9(4) COMP-3.
           05  INV-MARKET-VALUE            PIC S9(15)V99 COMP-3.
           05  INV-GAIN-LOSS               PIC S9(13)V99 COMP-3.
           05  INV-PURCHASE-DATE           PIC 9(8).
           05  INV-DIVIDEND-RATE           PIC V9(6).
           
       FD  TRANSACTION-LOG
           LABEL RECORDS ARE STANDARD.
       01  TRANSACTION-RECORD.
           05  TRAN-ID                     PIC X(20).
           05  TRAN-TIMESTAMP              PIC X(26).
           05  TRAN-TYPE                   PIC X(3).
           05  TRAN-ACCT-FROM              PIC X(16).
           05  TRAN-ACCT-TO                PIC X(16).
           05  TRAN-AMOUNT                 PIC S9(13)V99 COMP-3.
           05  TRAN-STATUS                 PIC X(1).
           05  TRAN-USER-ID                PIC X(10).
           05  TRAN-TERMINAL-ID            PIC X(8).
           
       FD  AUDIT-TRAIL
           LABEL RECORDS ARE STANDARD.
       01  AUDIT-RECORD.
           05  AUD-TIMESTAMP               PIC X(26).
           05  AUD-USER                    PIC X(10).
           05  AUD-ACTION                  PIC X(20).
           05  AUD-ENTITY                  PIC X(20).
           05  AUD-ENTITY-ID               PIC X(20).
           05  AUD-OLD-VALUE               PIC X(100).
           05  AUD-NEW-VALUE               PIC X(100).
           
       FD  REPORT-FILE
           LABEL RECORDS ARE OMITTED.
       01  REPORT-LINE                     PIC X(132).

       WORKING-STORAGE SECTION.
       
       01  WS-FILE-STATUSES.
           05  WS-CUST-STATUS              PIC XX.
           05  WS-ACCT-STATUS              PIC XX.
           05  WS-TRAN-STATUS              PIC XX.
           05  WS-LOAN-STATUS              PIC XX.
           05  WS-INS-STATUS               PIC XX.
           05  WS-INV-STATUS               PIC XX.
           05  WS-AUD-STATUS               PIC XX.
           05  WS-RPT-STATUS               PIC XX.
           
       01  WS-CURRENT-DATE-DATA.
           05  WS-CURRENT-DATE             PIC 9(8).
           05  WS-CURRENT-TIME             PIC 9(8).
           05  WS-CURRENT-TIMESTAMP        PIC X(26).
           
       01  WS-COUNTERS.
           05  WS-CUST-COUNT               PIC 9(9) VALUE 0.
           05  WS-ACCT-COUNT               PIC 9(9) VALUE 0.
           05  WS-TRAN-COUNT               PIC 9(9) VALUE 0.
           05  WS-LOAN-COUNT               PIC 9(9) VALUE 0.
           05  WS-INS-COUNT                PIC 9(9) VALUE 0.
           05  WS-INV-COUNT                PIC 9(9) VALUE 0.
           05  WS-ERROR-COUNT              PIC 9(9) VALUE 0.
           05  WS-PROCESS-COUNT            PIC 9(9) VALUE 0.
           
       01  WS-TOTALS.
           05  WS-TOTAL-DEPOSITS           PIC S9(17)V99 COMP-3 VALUE 0.
           05  WS-TOTAL-WITHDRAWALS        PIC S9(17)V99 COMP-3 VALUE 0.
           05  WS-TOTAL-TRANSFERS          PIC S9(17)V99 COMP-3 VALUE 0.
           05  WS-TOTAL-LOANS              PIC S9(17)V99 COMP-3 VALUE 0.
           05  WS-TOTAL-PAYMENTS           PIC S9(17)V99 COMP-3 VALUE 0.
           05  WS-TOTAL-INTEREST           PIC S9(17)V99 COMP-3 VALUE 0.
           05  WS-TOTAL-FEES               PIC S9(17)V99 COMP-3 VALUE 0.
           05  WS-TOTAL-PREMIUMS           PIC S9(17)V99 COMP-3 VALUE 0.
           05  WS-TOTAL-CLAIMS             PIC S9(17)V99 COMP-3 VALUE 0.
           05  WS-TOTAL-INVESTMENTS        PIC S9(17)V99 COMP-3 VALUE 0.
           05  WS-TOTAL-DIVIDENDS          PIC S9(17)V99 COMP-3 VALUE 0.
           
       01  WS-CALCULATION-FIELDS.
           05  WS-CALC-AMOUNT              PIC S9(15)V99 COMP-3.
           05  WS-CALC-RATE                PIC V9(8) COMP-3.
           05  WS-CALC-TERM                PIC 9(4).
           05  WS-CALC-RESULT              PIC S9(15)V99 COMP-3.
           05  WS-CALC-INTEREST            PIC S9(15)V99 COMP-3.
           05  WS-CALC-PRINCIPAL           PIC S9(15)V99 COMP-3.
           05  WS-CALC-PAYMENT             PIC S9(15)V99 COMP-3.
           05  WS-CALC-BALANCE             PIC S9(15)V99 COMP-3.
           05  WS-CALC-FEE                 PIC S9(9)V99 COMP-3.
           05  WS-CALC-TAX                 PIC S9(9)V99 COMP-3.
           
       01  WS-FLAGS.
           05  WS-EOF-FLAG                 PIC X VALUE 'N'.
               88  WS-EOF                  VALUE 'Y'.
               88  WS-NOT-EOF              VALUE 'N'.
           05  WS-ERROR-FLAG               PIC X VALUE 'N'.
               88  WS-ERROR                VALUE 'Y'.
               88  WS-NO-ERROR             VALUE 'N'.
           05  WS-VALID-FLAG               PIC X VALUE 'N'.
               88  WS-VALID                VALUE 'Y'.
               88  WS-INVALID              VALUE 'N'.
           05  WS-FOUND-FLAG               PIC X VALUE 'N'.
               88  WS-FOUND                VALUE 'Y'.
               88  WS-NOT-FOUND            VALUE 'N'.
           05  WS-APPROVED-FLAG            PIC X VALUE 'N'.
               88  WS-APPROVED             VALUE 'Y'.
               88  WS-NOT-APPROVED         VALUE 'N'.
               
      *----------------------------------------------------------------*
      * TAX CALCULATION TABLES - WARNING: 1985 TAX RATES - OBSOLETE    *
      *----------------------------------------------------------------*
       01  WS-TAX-TABLE-1985.
           05  WS-TAX-BRACKET-1.
               10  WS-BRACKET-1-MIN        PIC 9(9) VALUE 0.
               10  WS-BRACKET-1-MAX        PIC 9(9) VALUE 3000.
               10  WS-BRACKET-1-RATE       PIC V999 VALUE .11.
           05  WS-TAX-BRACKET-2.
               10  WS-BRACKET-2-MIN        PIC 9(9) VALUE 3001.
               10  WS-BRACKET-2-MAX        PIC 9(9) VALUE 28000.
               10  WS-BRACKET-2-RATE       PIC V999 VALUE .15.
           05  WS-TAX-BRACKET-3.
               10  WS-BRACKET-3-MIN        PIC 9(9) VALUE 28001.
               10  WS-BRACKET-3-MAX        PIC 9(9) VALUE 45000.
               10  WS-BRACKET-3-RATE       PIC V999 VALUE .25.
           05  WS-TAX-BRACKET-4.
               10  WS-BRACKET-4-MIN        PIC 9(9) VALUE 45001.
               10  WS-BRACKET-4-MAX        PIC 9(9) VALUE 90000.
               10  WS-BRACKET-4-RATE       PIC V999 VALUE .35.
           05  WS-TAX-BRACKET-5.
               10  WS-BRACKET-5-MIN        PIC 9(9) VALUE 90001.
               10  WS-BRACKET-5-MAX        PIC 9(9) VALUE 999999999.
               10  WS-BRACKET-5-RATE       PIC V999 VALUE .50.
               
      *----------------------------------------------------------------*
      * INTEREST RATE TABLES                                            *
      *----------------------------------------------------------------*
       01  WS-INTEREST-RATES.
           05  WS-SAVINGS-RATE             PIC V9(4) VALUE .0225.
           05  WS-CHECKING-RATE            PIC V9(4) VALUE .0050.
           05  WS-MM-RATE                  PIC V9(4) VALUE .0350.
           05  WS-CD-RATE-1YR              PIC V9(4) VALUE .0425.
           05  WS-CD-RATE-2YR              PIC V9(4) VALUE .0475.
           05  WS-CD-RATE-5YR              PIC V9(4) VALUE .0550.
           05  WS-MORTGAGE-RATE-15         PIC V9(4) VALUE .0625.
           05  WS-MORTGAGE-RATE-30         PIC V9(4) VALUE .0699.
           05  WS-AUTO-RATE-NEW            PIC V9(4) VALUE .0549.
           05  WS-AUTO-RATE-USED           PIC V9(4) VALUE .0749.
           05  WS-PERSONAL-RATE            PIC V9(4) VALUE .0999.
           05  WS-HELOC-RATE               PIC V9(4) VALUE .0825.
           05  WS-CREDIT-CARD-RATE         PIC V9(4) VALUE .1899.
           05  WS-PRIME-RATE               PIC V9(4) VALUE .0825.
           
      *----------------------------------------------------------------*
      * FEE SCHEDULES                                                   *
      *----------------------------------------------------------------*
       01  WS-FEE-SCHEDULE.
           05  WS-OVERDRAFT-FEE            PIC S9(5)V99 VALUE 35.00.
           05  WS-NSF-FEE                  PIC S9(5)V99 VALUE 35.00.
           05  WS-WIRE-FEE-DOMESTIC        PIC S9(5)V99 VALUE 25.00.
           05  WS-WIRE-FEE-INTL            PIC S9(5)V99 VALUE 45.00.
           05  WS-ATM-FEE-FOREIGN          PIC S9(5)V99 VALUE 3.00.
           05  WS-MONTHLY-FEE-CHECKING     PIC S9(5)V99 VALUE 12.00.
           05  WS-MONTHLY-FEE-SAVINGS      PIC S9(5)V99 VALUE 5.00.
           05  WS-LATE-PAYMENT-FEE         PIC S9(5)V99 VALUE 39.00.
           05  WS-EARLY-WITHDRAWAL-PCT     PIC V999 VALUE .100.
           05  WS-LOAN-ORIGINATION-PCT     PIC V999 VALUE .010.
           05  WS-ANNUAL-FEE-CARD          PIC S9(5)V99 VALUE 95.00.
           
      *----------------------------------------------------------------*
      * INSURANCE RATE TABLES                                           *
      *----------------------------------------------------------------*
       01  WS-INSURANCE-RATES.
           05  WS-LIFE-RATE-PER-1000       PIC S9(3)V99 VALUE 1.25.
           05  WS-HEALTH-BASE-PREMIUM      PIC S9(7)V99 VALUE 450.00.
           05  WS-AUTO-BASE-PREMIUM        PIC S9(7)V99 VALUE 1200.00.
           05  WS-HOME-RATE-PER-1000       PIC S9(3)V99 VALUE 3.50.
           05  WS-UMBRELLA-RATE            PIC S9(5)V99 VALUE 200.00.
           
       01  WS-TEMP-VARIABLES.
           05  WS-TEMP-STRING              PIC X(256).
           05  WS-TEMP-NUMBER              PIC S9(15)V99 COMP-3.
           05  WS-TEMP-DATE                PIC 9(8).
           05  WS-TEMP-FLAG                PIC X.
           05  WS-TEMP-CODE                PIC X(10).
           05  WS-TEMP-ID                  PIC X(20).
           05  WS-TEMP-COUNTER             PIC 9(9).
           
       01  WS-WORK-AREAS.
           05  WS-FORMATTED-DATE           PIC X(10).
           05  WS-FORMATTED-AMOUNT         PIC $$$,$$$,$$$,$$9.99-.
           05  WS-FORMATTED-RATE           PIC 9.9999.
           05  WS-FORMATTED-COUNT          PIC ZZZ,ZZZ,ZZ9.
           05  WS-FORMATTED-PCT            PIC ZZ9.99.

       PROCEDURE DIVISION.
      *================================================================*
      *                    MAIN PROGRAM CONTROL                         *
      *================================================================*
       0000-MAIN-CONTROL.
           PERFORM 1000-INITIALIZATION
           PERFORM 2000-PROCESS-BANKING
           PERFORM 3000-PROCESS-LOANS
           PERFORM 4000-PROCESS-INSURANCE
           PERFORM 5000-PROCESS-INVESTMENTS
           PERFORM 6000-GENERATE-REPORTS
           PERFORM 9000-TERMINATION
           STOP RUN.
           
      *================================================================*
      *                    INITIALIZATION                               *
      *================================================================*
       1000-INITIALIZATION.
           PERFORM 1100-OPEN-FILES
           PERFORM 1200-INITIALIZE-COUNTERS
           PERFORM 1300-GET-CURRENT-DATE
           PERFORM 1400-LOAD-PARAMETERS
           PERFORM 1500-VALIDATE-SYSTEM
           DISPLAY "MEGA-ENTERPRISE SYSTEM INITIALIZED".
           
       1100-OPEN-FILES.
           OPEN INPUT CUSTOMER-MASTER
           OPEN I-O ACCOUNT-MASTER
           OPEN I-O LOAN-MASTER
           OPEN I-O INSURANCE-MASTER
           OPEN I-O INVESTMENT-MASTER
           OPEN OUTPUT TRANSACTION-LOG
           OPEN OUTPUT AUDIT-TRAIL
           OPEN OUTPUT REPORT-FILE.
           
       1200-INITIALIZE-COUNTERS.
           INITIALIZE WS-COUNTERS
           INITIALIZE WS-TOTALS
           INITIALIZE WS-FLAGS.
           
       1300-GET-CURRENT-DATE.
           ACCEPT WS-CURRENT-DATE FROM DATE YYYYMMDD
           ACCEPT WS-CURRENT-TIME FROM TIME
           STRING WS-CURRENT-DATE DELIMITED SIZE
                  '-' DELIMITED SIZE
                  WS-CURRENT-TIME DELIMITED SIZE
                  INTO WS-CURRENT-TIMESTAMP.
                  
       1400-LOAD-PARAMETERS.
           CONTINUE.
           
       1500-VALIDATE-SYSTEM.
           IF WS-CUST-STATUS NOT = '00'
               DISPLAY "ERROR: CUSTOMER FILE OPEN FAILED"
               SET WS-ERROR TO TRUE
           END-IF
           IF WS-ACCT-STATUS NOT = '00'
               DISPLAY "ERROR: ACCOUNT FILE OPEN FAILED"
               SET WS-ERROR TO TRUE
           END-IF.
           
      *================================================================*
      *                    BANKING OPERATIONS                           *
      *================================================================*
       2000-PROCESS-BANKING.
           PERFORM 2100-PROCESS-DEPOSITS
           PERFORM 2200-PROCESS-WITHDRAWALS
           PERFORM 2300-PROCESS-TRANSFERS
           PERFORM 2400-CALCULATE-INTEREST
           PERFORM 2500-APPLY-FEES
           PERFORM 2600-PROCESS-PAYMENTS
           PERFORM 2700-RECONCILE-ACCOUNTS.
           
       2100-PROCESS-DEPOSITS.
           DISPLAY "PROCESSING DEPOSITS..."
           SET WS-NOT-EOF TO TRUE
           PERFORM UNTIL WS-EOF
               READ ACCOUNT-MASTER NEXT
                   AT END SET WS-EOF TO TRUE
                   NOT AT END
                       PERFORM 2110-VALIDATE-DEPOSIT
                       IF WS-VALID
                           PERFORM 2120-POST-DEPOSIT
                           PERFORM 2130-UPDATE-BALANCE
                           ADD 1 TO WS-TRAN-COUNT
                       END-IF
               END-READ
           END-PERFORM.
           
       2110-VALIDATE-DEPOSIT.
           SET WS-VALID TO TRUE
           IF WS-CALC-AMOUNT < 0
               SET WS-INVALID TO TRUE
           END-IF
           IF ACCT-STATUS NOT = 'A'
               SET WS-INVALID TO TRUE
           END-IF.
           
       2120-POST-DEPOSIT.
           ADD WS-CALC-AMOUNT TO ACCT-BALANCE
           ADD WS-CALC-AMOUNT TO ACCT-AVAILABLE
           ADD WS-CALC-AMOUNT TO WS-TOTAL-DEPOSITS
           PERFORM 8100-WRITE-TRANSACTION.
           
       2130-UPDATE-BALANCE.
           MOVE WS-CURRENT-DATE TO ACCT-LAST-TRANS-DATE
           REWRITE ACCOUNT-RECORD.
           
       2200-PROCESS-WITHDRAWALS.
           DISPLAY "PROCESSING WITHDRAWALS..."
           SET WS-NOT-EOF TO TRUE
           PERFORM UNTIL WS-EOF
               READ ACCOUNT-MASTER NEXT
                   AT END SET WS-EOF TO TRUE
                   NOT AT END
                       PERFORM 2210-VALIDATE-WITHDRAWAL
                       IF WS-VALID
                           PERFORM 2220-POST-WITHDRAWAL
                           ADD 1 TO WS-TRAN-COUNT
                       END-IF
               END-READ
           END-PERFORM.
           
       2210-VALIDATE-WITHDRAWAL.
           SET WS-VALID TO TRUE
           IF WS-CALC-AMOUNT > ACCT-AVAILABLE
               IF WS-CALC-AMOUNT > 
                  (ACCT-AVAILABLE + ACCT-OVERDRAFT-LIMIT)
                   SET WS-INVALID TO TRUE
               ELSE
                   PERFORM 2215-APPLY-OVERDRAFT-FEE
               END-IF
           END-IF.
           
       2215-APPLY-OVERDRAFT-FEE.
           ADD WS-OVERDRAFT-FEE TO WS-TOTAL-FEES
           SUBTRACT WS-OVERDRAFT-FEE FROM ACCT-BALANCE.
           
       2220-POST-WITHDRAWAL.
           SUBTRACT WS-CALC-AMOUNT FROM ACCT-BALANCE
           SUBTRACT WS-CALC-AMOUNT FROM ACCT-AVAILABLE
           ADD WS-CALC-AMOUNT TO WS-TOTAL-WITHDRAWALS
           PERFORM 8100-WRITE-TRANSACTION.
           
       2300-PROCESS-TRANSFERS.
           DISPLAY "PROCESSING TRANSFERS..."
           PERFORM 2310-INTERNAL-TRANSFER
           PERFORM 2320-WIRE-TRANSFER
           PERFORM 2330-ACH-TRANSFER.
           
       2310-INTERNAL-TRANSFER.
           CONTINUE.
           
       2320-WIRE-TRANSFER.
           ADD WS-WIRE-FEE-DOMESTIC TO WS-TOTAL-FEES.
           
       2330-ACH-TRANSFER.
           CONTINUE.
           
       2400-CALCULATE-INTEREST.
           DISPLAY "CALCULATING INTEREST..."
           SET WS-NOT-EOF TO TRUE
           PERFORM UNTIL WS-EOF
               READ ACCOUNT-MASTER NEXT
                   AT END SET WS-EOF TO TRUE
                   NOT AT END
                       PERFORM 2410-DETERMINE-RATE
                       PERFORM 2420-COMPUTE-INTEREST
                       PERFORM 2430-POST-INTEREST
               END-READ
           END-PERFORM.
           
       2410-DETERMINE-RATE.
           EVALUATE TRUE
               WHEN ACCT-CHECKING
                   MOVE WS-CHECKING-RATE TO WS-CALC-RATE
               WHEN ACCT-SAVINGS
                   MOVE WS-SAVINGS-RATE TO WS-CALC-RATE
               WHEN ACCT-MONEY-MARKET
                   MOVE WS-MM-RATE TO WS-CALC-RATE
               WHEN ACCT-CD
                   MOVE WS-CD-RATE-1YR TO WS-CALC-RATE
               WHEN OTHER
                   MOVE 0 TO WS-CALC-RATE
           END-EVALUATE.
           
       2420-COMPUTE-INTEREST.
           COMPUTE WS-CALC-INTEREST = 
               ACCT-BALANCE * WS-CALC-RATE / 12.
               
       2430-POST-INTEREST.
           ADD WS-CALC-INTEREST TO ACCT-BALANCE
           ADD WS-CALC-INTEREST TO WS-TOTAL-INTEREST.
           
       2500-APPLY-FEES.
           DISPLAY "APPLYING MONTHLY FEES..."
           SET WS-NOT-EOF TO TRUE
           PERFORM UNTIL WS-EOF
               READ ACCOUNT-MASTER NEXT
                   AT END SET WS-EOF TO TRUE
                   NOT AT END
                       PERFORM 2510-CHECK-MINIMUM-BALANCE
                       IF WS-VALID
                           PERFORM 2520-WAIVE-FEE
                       ELSE
                           PERFORM 2530-CHARGE-FEE
                       END-IF
               END-READ
           END-PERFORM.
           
       2510-CHECK-MINIMUM-BALANCE.
           IF ACCT-BALANCE >= ACCT-MIN-BALANCE
               SET WS-VALID TO TRUE
           ELSE
               SET WS-INVALID TO TRUE
           END-IF.
           
       2520-WAIVE-FEE.
           CONTINUE.
           
       2530-CHARGE-FEE.
           SUBTRACT ACCT-MONTHLY-FEE FROM ACCT-BALANCE
           ADD ACCT-MONTHLY-FEE TO WS-TOTAL-FEES.
           
       2600-PROCESS-PAYMENTS.
           DISPLAY "PROCESSING BILL PAYMENTS..."
           CONTINUE.
           
       2700-RECONCILE-ACCOUNTS.
           DISPLAY "RECONCILING ACCOUNTS..."
           CONTINUE.

      *================================================================*
      *                    LOAN OPERATIONS                              *
      *================================================================*
       3000-PROCESS-LOANS.
           PERFORM 3100-PROCESS-APPLICATIONS
           PERFORM 3200-PROCESS-PAYMENTS
           PERFORM 3300-CALCULATE-AMORTIZATION
           PERFORM 3400-ASSESS-DELINQUENCIES
           PERFORM 3500-PROCESS-COLLECTIONS
           PERFORM 3600-HANDLE-DEFAULTS.
           
       3100-PROCESS-APPLICATIONS.
           DISPLAY "PROCESSING LOAN APPLICATIONS..."
           CONTINUE.
           
       3200-PROCESS-PAYMENTS.
           DISPLAY "PROCESSING LOAN PAYMENTS..."
           SET WS-NOT-EOF TO TRUE
           PERFORM UNTIL WS-EOF
               READ LOAN-MASTER NEXT
                   AT END SET WS-EOF TO TRUE
                   NOT AT END
                       IF LOAN-CURRENT
                           PERFORM 3210-CALCULATE-PAYMENT
                           PERFORM 3220-APPLY-PAYMENT
                           PERFORM 3230-UPDATE-LOAN
                       END-IF
               END-READ
           END-PERFORM.
           
       3210-CALCULATE-PAYMENT.
           MOVE LOAN-PAYMENT-AMOUNT TO WS-CALC-PAYMENT
           COMPUTE WS-CALC-INTEREST = 
               LOAN-CURRENT-BALANCE * LOAN-INTEREST-RATE / 12
           COMPUTE WS-CALC-PRINCIPAL = 
               WS-CALC-PAYMENT - WS-CALC-INTEREST.
               
       3220-APPLY-PAYMENT.
           SUBTRACT WS-CALC-PRINCIPAL FROM LOAN-CURRENT-BALANCE
           ADD WS-CALC-PAYMENT TO WS-TOTAL-PAYMENTS
           ADD WS-CALC-INTEREST TO WS-TOTAL-INTEREST.
           
       3230-UPDATE-LOAN.
           IF LOAN-CURRENT-BALANCE <= 0
               SET LOAN-PAID-OFF TO TRUE
           END-IF
           REWRITE LOAN-RECORD.
           
       3300-CALCULATE-AMORTIZATION.
           DISPLAY "CALCULATING AMORTIZATION SCHEDULES..."
           CONTINUE.
           
       3400-ASSESS-DELINQUENCIES.
           DISPLAY "ASSESSING DELINQUENT LOANS..."
           SET WS-NOT-EOF TO TRUE
           PERFORM UNTIL WS-EOF
               READ LOAN-MASTER NEXT
                   AT END SET WS-EOF TO TRUE
                   NOT AT END
                       PERFORM 3410-CHECK-PAYMENT-STATUS
                       IF WS-NOT-FOUND
                           PERFORM 3420-MARK-DELINQUENT
                           PERFORM 3430-ASSESS-LATE-FEE
                       END-IF
               END-READ
           END-PERFORM.
           
       3410-CHECK-PAYMENT-STATUS.
           IF LOAN-NEXT-PAYMENT-DATE < WS-CURRENT-DATE
               SET WS-NOT-FOUND TO TRUE
           ELSE
               SET WS-FOUND TO TRUE
           END-IF.
           
       3420-MARK-DELINQUENT.
           SET LOAN-DELINQUENT TO TRUE.
           
       3430-ASSESS-LATE-FEE.
           ADD WS-LATE-PAYMENT-FEE TO WS-TOTAL-FEES.
           
       3500-PROCESS-COLLECTIONS.
           DISPLAY "PROCESSING COLLECTIONS..."
           CONTINUE.
           
       3600-HANDLE-DEFAULTS.
           DISPLAY "HANDLING DEFAULTS..."
           CONTINUE.

      *================================================================*
      *                    INSURANCE OPERATIONS                         *
      *================================================================*
       4000-PROCESS-INSURANCE.
           PERFORM 4100-PROCESS-POLICIES
           PERFORM 4200-CALCULATE-PREMIUMS
           PERFORM 4300-PROCESS-CLAIMS
           PERFORM 4400-ASSESS-RISK
           PERFORM 4500-RENEW-POLICIES.
           
       4100-PROCESS-POLICIES.
           DISPLAY "PROCESSING INSURANCE POLICIES..."
           CONTINUE.
           
       4200-CALCULATE-PREMIUMS.
           DISPLAY "CALCULATING PREMIUMS..."
           SET WS-NOT-EOF TO TRUE
           PERFORM UNTIL WS-EOF
               READ INSURANCE-MASTER NEXT
                   AT END SET WS-EOF TO TRUE
                   NOT AT END
                       PERFORM 4210-DETERMINE-BASE-PREMIUM
                       PERFORM 4220-APPLY-RISK-FACTOR
                       PERFORM 4230-CALCULATE-FINAL-PREMIUM
               END-READ
           END-PERFORM.
           
       4210-DETERMINE-BASE-PREMIUM.
           EVALUATE TRUE
               WHEN INS-LIFE
                   COMPUTE WS-CALC-AMOUNT = 
                       INS-COVERAGE-AMOUNT / 1000 * WS-LIFE-RATE-PER-1000
               WHEN INS-HEALTH
                   MOVE WS-HEALTH-BASE-PREMIUM TO WS-CALC-AMOUNT
               WHEN INS-AUTO
                   MOVE WS-AUTO-BASE-PREMIUM TO WS-CALC-AMOUNT
               WHEN INS-HOME
                   COMPUTE WS-CALC-AMOUNT = 
                       INS-COVERAGE-AMOUNT / 1000 * WS-HOME-RATE-PER-1000
               WHEN INS-UMBRELLA
                   MOVE WS-UMBRELLA-RATE TO WS-CALC-AMOUNT
           END-EVALUATE.
           
       4220-APPLY-RISK-FACTOR.
           IF INS-CLAIMS-COUNT > 2
               COMPUTE WS-CALC-AMOUNT = WS-CALC-AMOUNT * 1.25
           END-IF.
           
       4230-CALCULATE-FINAL-PREMIUM.
           MOVE WS-CALC-AMOUNT TO INS-PREMIUM-AMOUNT
           ADD WS-CALC-AMOUNT TO WS-TOTAL-PREMIUMS.
           
       4300-PROCESS-CLAIMS.
           DISPLAY "PROCESSING INSURANCE CLAIMS..."
           CONTINUE.
           
       4400-ASSESS-RISK.
           DISPLAY "ASSESSING INSURANCE RISK..."
           CONTINUE.
           
       4500-RENEW-POLICIES.
           DISPLAY "RENEWING POLICIES..."
           CONTINUE.

      *================================================================*
      *                    INVESTMENT OPERATIONS                        *
      *================================================================*
       5000-PROCESS-INVESTMENTS.
           PERFORM 5100-UPDATE-MARKET-PRICES
           PERFORM 5200-CALCULATE-PORTFOLIO-VALUE
           PERFORM 5300-PROCESS-TRADES
           PERFORM 5400-CALCULATE-DIVIDENDS
           PERFORM 5500-GENERATE-TAX-DOCUMENTS.
           
       5100-UPDATE-MARKET-PRICES.
           DISPLAY "UPDATING MARKET PRICES..."
           CONTINUE.
           
       5200-CALCULATE-PORTFOLIO-VALUE.
           DISPLAY "CALCULATING PORTFOLIO VALUES..."
           SET WS-NOT-EOF TO TRUE
           PERFORM UNTIL WS-EOF
               READ INVESTMENT-MASTER NEXT
                   AT END SET WS-EOF TO TRUE
                   NOT AT END
                       PERFORM 5210-CALCULATE-POSITION-VALUE
                       PERFORM 5220-CALCULATE-GAIN-LOSS
                       PERFORM 5230-UPDATE-TOTALS
               END-READ
           END-PERFORM.
           
       5210-CALCULATE-POSITION-VALUE.
           COMPUTE INV-MARKET-VALUE = 
               INV-QUANTITY * INV-CURRENT-PRICE.
               
       5220-CALCULATE-GAIN-LOSS.
           COMPUTE INV-GAIN-LOSS = 
               INV-MARKET-VALUE - (INV-QUANTITY * INV-PURCHASE-PRICE).
               
       5230-UPDATE-TOTALS.
           ADD INV-MARKET-VALUE TO WS-TOTAL-INVESTMENTS.
           
       5300-PROCESS-TRADES.
           DISPLAY "PROCESSING TRADES..."
           PERFORM 5310-PROCESS-BUY-ORDERS
           PERFORM 5320-PROCESS-SELL-ORDERS
           PERFORM 5330-SETTLE-TRADES.
           
       5310-PROCESS-BUY-ORDERS.
           CONTINUE.
           
       5320-PROCESS-SELL-ORDERS.
           CONTINUE.
           
       5330-SETTLE-TRADES.
           CONTINUE.
           
       5400-CALCULATE-DIVIDENDS.
           DISPLAY "CALCULATING DIVIDENDS..."
           SET WS-NOT-EOF TO TRUE
           PERFORM UNTIL WS-EOF
               READ INVESTMENT-MASTER NEXT
                   AT END SET WS-EOF TO TRUE
                   NOT AT END
                       IF INV-DIVIDEND-RATE > 0
                           PERFORM 5410-COMPUTE-DIVIDEND
                           PERFORM 5420-POST-DIVIDEND
                       END-IF
               END-READ
           END-PERFORM.
           
       5410-COMPUTE-DIVIDEND.
           COMPUTE WS-CALC-AMOUNT = 
               INV-MARKET-VALUE * INV-DIVIDEND-RATE / 4.
               
       5420-POST-DIVIDEND.
           ADD WS-CALC-AMOUNT TO WS-TOTAL-DIVIDENDS.
           
       5500-GENERATE-TAX-DOCUMENTS.
           DISPLAY "GENERATING TAX DOCUMENTS..."
           CONTINUE.

      *================================================================*
      *                    REPORT GENERATION                            *
      *================================================================*
       6000-GENERATE-REPORTS.
           PERFORM 6100-DAILY-SUMMARY
           PERFORM 6200-ACCOUNT-STATEMENTS
           PERFORM 6300-LOAN-REPORTS
           PERFORM 6400-INSURANCE-REPORTS
           PERFORM 6500-INVESTMENT-REPORTS
           PERFORM 6600-REGULATORY-REPORTS
           PERFORM 6700-MANAGEMENT-REPORTS.
           
       6100-DAILY-SUMMARY.
           DISPLAY "GENERATING DAILY SUMMARY..."
           MOVE SPACES TO REPORT-LINE
           STRING "MEGA-ENTERPRISE DAILY SUMMARY - " DELIMITED SIZE
                  WS-CURRENT-DATE DELIMITED SIZE
                  INTO REPORT-LINE
           WRITE REPORT-LINE
           PERFORM 6110-WRITE-TOTALS.
           
       6110-WRITE-TOTALS.
           MOVE WS-TOTAL-DEPOSITS TO WS-FORMATTED-AMOUNT
           STRING "TOTAL DEPOSITS: " DELIMITED SIZE
                  WS-FORMATTED-AMOUNT DELIMITED SIZE
                  INTO REPORT-LINE
           WRITE REPORT-LINE
           
           MOVE WS-TOTAL-WITHDRAWALS TO WS-FORMATTED-AMOUNT
           STRING "TOTAL WITHDRAWALS: " DELIMITED SIZE
                  WS-FORMATTED-AMOUNT DELIMITED SIZE
                  INTO REPORT-LINE
           WRITE REPORT-LINE
           
           MOVE WS-TOTAL-LOANS TO WS-FORMATTED-AMOUNT
           STRING "TOTAL LOANS: " DELIMITED SIZE
                  WS-FORMATTED-AMOUNT DELIMITED SIZE
                  INTO REPORT-LINE
           WRITE REPORT-LINE.
           
       6200-ACCOUNT-STATEMENTS.
           DISPLAY "GENERATING ACCOUNT STATEMENTS..."
           CONTINUE.
           
       6300-LOAN-REPORTS.
           DISPLAY "GENERATING LOAN REPORTS..."
           CONTINUE.
           
       6400-INSURANCE-REPORTS.
           DISPLAY "GENERATING INSURANCE REPORTS..."
           CONTINUE.
           
       6500-INVESTMENT-REPORTS.
           DISPLAY "GENERATING INVESTMENT REPORTS..."
           CONTINUE.
           
       6600-REGULATORY-REPORTS.
           DISPLAY "GENERATING REGULATORY REPORTS..."
           PERFORM 6610-GENERATE-CALL-REPORT
           PERFORM 6620-GENERATE-SAR
           PERFORM 6630-GENERATE-CTR.
           
       6610-GENERATE-CALL-REPORT.
           CONTINUE.
           
       6620-GENERATE-SAR.
           CONTINUE.
           
       6630-GENERATE-CTR.
           CONTINUE.
           
       6700-MANAGEMENT-REPORTS.
           DISPLAY "GENERATING MANAGEMENT REPORTS..."
           CONTINUE.

      *================================================================*
      *                    UTILITY PROCEDURES                           *
      *================================================================*
       8000-UTILITY-PROCEDURES.
           CONTINUE.
           
       8100-WRITE-TRANSACTION.
           MOVE WS-CURRENT-TIMESTAMP TO TRAN-TIMESTAMP
           MOVE 'DEP' TO TRAN-TYPE
           MOVE WS-CALC-AMOUNT TO TRAN-AMOUNT
           MOVE 'C' TO TRAN-STATUS
           WRITE TRANSACTION-RECORD.
           
       8200-WRITE-AUDIT.
           MOVE WS-CURRENT-TIMESTAMP TO AUD-TIMESTAMP
           WRITE AUDIT-RECORD.
           
       8300-FORMAT-DATE.
           STRING WS-TEMP-DATE(1:4) DELIMITED SIZE
                  '-' DELIMITED SIZE
                  WS-TEMP-DATE(5:2) DELIMITED SIZE
                  '-' DELIMITED SIZE
                  WS-TEMP-DATE(7:2) DELIMITED SIZE
                  INTO WS-FORMATTED-DATE.
                  
       8400-VALIDATE-ACCOUNT.
           SET WS-VALID TO TRUE
           IF ACCT-ID = SPACES
               SET WS-INVALID TO TRUE
           END-IF.
           
       8500-CALCULATE-TAX.
           EVALUATE TRUE
               WHEN WS-CALC-AMOUNT <= WS-BRACKET-1-MAX
                   COMPUTE WS-CALC-TAX = 
                       WS-CALC-AMOUNT * WS-BRACKET-1-RATE
               WHEN WS-CALC-AMOUNT <= WS-BRACKET-2-MAX
                   COMPUTE WS-CALC-TAX = 
                       (WS-BRACKET-1-MAX * WS-BRACKET-1-RATE) +
                       ((WS-CALC-AMOUNT - WS-BRACKET-1-MAX) * 
                        WS-BRACKET-2-RATE)
               WHEN WS-CALC-AMOUNT <= WS-BRACKET-3-MAX
                   COMPUTE WS-CALC-TAX = 
                       (WS-BRACKET-1-MAX * WS-BRACKET-1-RATE) +
                       ((WS-BRACKET-2-MAX - WS-BRACKET-1-MAX) * 
                        WS-BRACKET-2-RATE) +
                       ((WS-CALC-AMOUNT - WS-BRACKET-2-MAX) * 
                        WS-BRACKET-3-RATE)
               WHEN OTHER
                   COMPUTE WS-CALC-TAX = 
                       WS-CALC-AMOUNT * WS-BRACKET-5-RATE
           END-EVALUATE.

      *================================================================*
      *                    TERMINATION                                  *
      *================================================================*
       9000-TERMINATION.
           PERFORM 9100-CLOSE-FILES
           PERFORM 9200-DISPLAY-STATISTICS
           DISPLAY "MEGA-ENTERPRISE SYSTEM TERMINATED NORMALLY".
           
       9100-CLOSE-FILES.
           CLOSE CUSTOMER-MASTER
           CLOSE ACCOUNT-MASTER
           CLOSE LOAN-MASTER
           CLOSE INSURANCE-MASTER
           CLOSE INVESTMENT-MASTER
           CLOSE TRANSACTION-LOG
           CLOSE AUDIT-TRAIL
           CLOSE REPORT-FILE.
           
       9200-DISPLAY-STATISTICS.
           DISPLAY "============================================"
           DISPLAY "       PROCESSING STATISTICS                "
           DISPLAY "============================================"
           MOVE WS-CUST-COUNT TO WS-FORMATTED-COUNT
           DISPLAY "CUSTOMERS PROCESSED:    " WS-FORMATTED-COUNT
           MOVE WS-ACCT-COUNT TO WS-FORMATTED-COUNT
           DISPLAY "ACCOUNTS PROCESSED:     " WS-FORMATTED-COUNT
           MOVE WS-TRAN-COUNT TO WS-FORMATTED-COUNT
           DISPLAY "TRANSACTIONS PROCESSED: " WS-FORMATTED-COUNT
           MOVE WS-LOAN-COUNT TO WS-FORMATTED-COUNT
           DISPLAY "LOANS PROCESSED:        " WS-FORMATTED-COUNT
           MOVE WS-ERROR-COUNT TO WS-FORMATTED-COUNT
           DISPLAY "ERRORS ENCOUNTERED:     " WS-FORMATTED-COUNT
           DISPLAY "============================================"
           MOVE WS-TOTAL-DEPOSITS TO WS-FORMATTED-AMOUNT
           DISPLAY "TOTAL DEPOSITS:    " WS-FORMATTED-AMOUNT
           MOVE WS-TOTAL-WITHDRAWALS TO WS-FORMATTED-AMOUNT
           DISPLAY "TOTAL WITHDRAWALS: " WS-FORMATTED-AMOUNT
           MOVE WS-TOTAL-INTEREST TO WS-FORMATTED-AMOUNT
           DISPLAY "TOTAL INTEREST:    " WS-FORMATTED-AMOUNT
           MOVE WS-TOTAL-FEES TO WS-FORMATTED-AMOUNT
           DISPLAY "TOTAL FEES:        " WS-FORMATTED-AMOUNT
           DISPLAY "============================================".

      *================================================================*
      *         EXTENDED BANKING MODULES - FRAUD DETECTION             *
      *================================================================*
       7000-FRAUD-DETECTION.
           PERFORM 7100-ANALYZE-PATTERNS
           PERFORM 7200-CHECK-VELOCITY
           PERFORM 7300-GEOGRAPHIC-ANALYSIS
           PERFORM 7400-BEHAVIORAL-SCORING
           PERFORM 7500-ALERT-GENERATION.
           
       7100-ANALYZE-PATTERNS.
           DISPLAY "ANALYZING TRANSACTION PATTERNS..."
           SET WS-NOT-EOF TO TRUE
           PERFORM UNTIL WS-EOF
               READ TRANSACTION-LOG NEXT
                   AT END SET WS-EOF TO TRUE
                   NOT AT END
                       PERFORM 7110-CHECK-AMOUNT-THRESHOLD
                       PERFORM 7120-CHECK-FREQUENCY
                       PERFORM 7130-CHECK-TIME-PATTERN
               END-READ
           END-PERFORM.
           
       7110-CHECK-AMOUNT-THRESHOLD.
           IF TRAN-AMOUNT > 10000
               PERFORM 7115-FLAG-LARGE-TRANSACTION
           END-IF.
           
       7115-FLAG-LARGE-TRANSACTION.
           ADD 1 TO WS-PROCESS-COUNT
           PERFORM 8200-WRITE-AUDIT.
           
       7120-CHECK-FREQUENCY.
           CONTINUE.
           
       7130-CHECK-TIME-PATTERN.
           CONTINUE.
           
       7200-CHECK-VELOCITY.
           DISPLAY "CHECKING TRANSACTION VELOCITY..."
           CONTINUE.
           
       7300-GEOGRAPHIC-ANALYSIS.
           DISPLAY "PERFORMING GEOGRAPHIC ANALYSIS..."
           CONTINUE.
           
       7400-BEHAVIORAL-SCORING.
           DISPLAY "CALCULATING BEHAVIORAL SCORES..."
           SET WS-NOT-EOF TO TRUE
           PERFORM UNTIL WS-EOF
               READ CUSTOMER-MASTER NEXT
                   AT END SET WS-EOF TO TRUE
                   NOT AT END
                       PERFORM 7410-CALCULATE-RISK-SCORE
                       PERFORM 7420-UPDATE-CUSTOMER-PROFILE
               END-READ
           END-PERFORM.
           
       7410-CALCULATE-RISK-SCORE.
           MOVE 0 TO WS-CALC-RESULT
           IF CUST-CREDIT-SCORE < 600
               ADD 30 TO WS-CALC-RESULT
           END-IF
           IF CUST-TOTAL-LOANS > CUST-TOTAL-BALANCE
               ADD 20 TO WS-CALC-RESULT
           END-IF.
           
       7420-UPDATE-CUSTOMER-PROFILE.
           IF WS-CALC-RESULT > 50
               MOVE 'H' TO CUST-RISK-RATING
           ELSE IF WS-CALC-RESULT > 25
               MOVE 'M' TO CUST-RISK-RATING
           ELSE
               MOVE 'L' TO CUST-RISK-RATING
           END-IF
           END-IF.
           
       7500-ALERT-GENERATION.
           DISPLAY "GENERATING FRAUD ALERTS..."
           CONTINUE.

      *================================================================*
      *         COMPLIANCE AND REGULATORY MODULE                        *
      *================================================================*
       7600-COMPLIANCE-PROCESSING.
           PERFORM 7610-AML-SCREENING
           PERFORM 7620-KYC-VERIFICATION
           PERFORM 7630-OFAC-CHECK
           PERFORM 7640-PEP-SCREENING
           PERFORM 7650-SANCTION-LIST-CHECK.
           
       7610-AML-SCREENING.
           DISPLAY "PERFORMING AML SCREENING..."
           SET WS-NOT-EOF TO TRUE
           PERFORM UNTIL WS-EOF
               READ TRANSACTION-LOG NEXT
                   AT END SET WS-EOF TO TRUE
                   NOT AT END
                       IF TRAN-AMOUNT >= 10000
                           PERFORM 7611-CTR-FILING
                       END-IF
                       PERFORM 7612-STRUCTURING-CHECK
               END-READ
           END-PERFORM.
           
       7611-CTR-FILING.
           ADD 1 TO WS-PROCESS-COUNT
           PERFORM 8200-WRITE-AUDIT.
           
       7612-STRUCTURING-CHECK.
           CONTINUE.
           
       7620-KYC-VERIFICATION.
           DISPLAY "VERIFYING KYC DOCUMENTS..."
           CONTINUE.
           
       7630-OFAC-CHECK.
           DISPLAY "CHECKING OFAC LIST..."
           CONTINUE.
           
       7640-PEP-SCREENING.
           DISPLAY "SCREENING POLITICALLY EXPOSED PERSONS..."
           CONTINUE.
           
       7650-SANCTION-LIST-CHECK.
           DISPLAY "CHECKING SANCTION LISTS..."
           CONTINUE.

      *================================================================*
      *         CREDIT CARD PROCESSING MODULE                          *
      *================================================================*
       7700-CREDIT-CARD-PROCESSING.
           PERFORM 7710-AUTHORIZE-TRANSACTION
           PERFORM 7720-PROCESS-SETTLEMENT
           PERFORM 7730-CALCULATE-REWARDS
           PERFORM 7740-APPLY-INTEREST
           PERFORM 7750-GENERATE-STATEMENTS.
           
       7710-AUTHORIZE-TRANSACTION.
           DISPLAY "AUTHORIZING CREDIT CARD TRANSACTIONS..."
           PERFORM 7711-CHECK-CREDIT-LIMIT
           PERFORM 7712-CHECK-FRAUD-SCORE
           PERFORM 7713-SEND-AUTHORIZATION.
           
       7711-CHECK-CREDIT-LIMIT.
           IF WS-CALC-AMOUNT > ACCT-OVERDRAFT-LIMIT
               SET WS-NOT-APPROVED TO TRUE
           ELSE
               SET WS-APPROVED TO TRUE
           END-IF.
           
       7712-CHECK-FRAUD-SCORE.
           CONTINUE.
           
       7713-SEND-AUTHORIZATION.
           IF WS-APPROVED
               PERFORM 8100-WRITE-TRANSACTION
           END-IF.
           
       7720-PROCESS-SETTLEMENT.
           DISPLAY "PROCESSING CREDIT CARD SETTLEMENTS..."
           CONTINUE.
           
       7730-CALCULATE-REWARDS.
           DISPLAY "CALCULATING REWARDS POINTS..."
           COMPUTE WS-CALC-RESULT = TRAN-AMOUNT * 0.01
           ADD WS-CALC-RESULT TO WS-TOTAL-FEES.
           
       7740-APPLY-INTEREST.
           DISPLAY "APPLYING CREDIT CARD INTEREST..."
           COMPUTE WS-CALC-INTEREST = 
               ACCT-BALANCE * WS-CREDIT-CARD-RATE / 12
           ADD WS-CALC-INTEREST TO ACCT-BALANCE.
           
       7750-GENERATE-STATEMENTS.
           DISPLAY "GENERATING CREDIT CARD STATEMENTS..."
           CONTINUE.

      *================================================================*
      *         MORTGAGE PROCESSING MODULE                              *
      *================================================================*
       7800-MORTGAGE-PROCESSING.
           PERFORM 7810-PROCESS-APPLICATIONS
           PERFORM 7820-UNDERWRITING
           PERFORM 7830-APPRAISAL-REVIEW
           PERFORM 7840-CLOSING-PROCESS
           PERFORM 7850-ESCROW-MANAGEMENT.
           
       7810-PROCESS-APPLICATIONS.
           DISPLAY "PROCESSING MORTGAGE APPLICATIONS..."
           CONTINUE.
           
       7820-UNDERWRITING.
           DISPLAY "PERFORMING UNDERWRITING..."
           PERFORM 7821-DTI-CALCULATION
           PERFORM 7822-LTV-CALCULATION
           PERFORM 7823-CREDIT-ANALYSIS.
           
       7821-DTI-CALCULATION.
           COMPUTE WS-CALC-RESULT = 
               LOAN-PAYMENT-AMOUNT / (CUST-TOTAL-BALANCE / 12)
           IF WS-CALC-RESULT > 0.43
               SET WS-NOT-APPROVED TO TRUE
           END-IF.
           
       7822-LTV-CALCULATION.
           COMPUTE LOAN-LTV-RATIO = 
               LOAN-CURRENT-BALANCE / LOAN-COLLATERAL-VALUE
           IF LOAN-LTV-RATIO > 0.80
               ADD WS-LOAN-ORIGINATION-PCT TO WS-CALC-FEE
           END-IF.
           
       7823-CREDIT-ANALYSIS.
           IF CUST-CREDIT-SCORE < 620
               SET WS-NOT-APPROVED TO TRUE
           END-IF.
           
       7830-APPRAISAL-REVIEW.
           DISPLAY "REVIEWING APPRAISALS..."
           CONTINUE.
           
       7840-CLOSING-PROCESS.
           DISPLAY "PROCESSING CLOSINGS..."
           CONTINUE.
           
       7850-ESCROW-MANAGEMENT.
           DISPLAY "MANAGING ESCROW ACCOUNTS..."
           PERFORM 7851-COLLECT-ESCROW
           PERFORM 7852-PAY-TAXES
           PERFORM 7853-PAY-INSURANCE.
           
       7851-COLLECT-ESCROW.
           CONTINUE.
           
       7852-PAY-TAXES.
           CONTINUE.
           
       7853-PAY-INSURANCE.
           CONTINUE.

      *================================================================*
      *         WEALTH MANAGEMENT MODULE                                *
      *================================================================*
       7900-WEALTH-MANAGEMENT.
           PERFORM 7910-PORTFOLIO-ANALYSIS
           PERFORM 7920-ASSET-ALLOCATION
           PERFORM 7930-REBALANCING
           PERFORM 7940-TAX-OPTIMIZATION
           PERFORM 7950-ESTATE-PLANNING.
           
       7910-PORTFOLIO-ANALYSIS.
           DISPLAY "ANALYZING PORTFOLIOS..."
           SET WS-NOT-EOF TO TRUE
           PERFORM UNTIL WS-EOF
               READ INVESTMENT-MASTER NEXT
                   AT END SET WS-EOF TO TRUE
                   NOT AT END
                       PERFORM 7911-CALCULATE-RETURNS
                       PERFORM 7912-ASSESS-RISK
                       PERFORM 7913-BENCHMARK-COMPARISON
               END-READ
           END-PERFORM.
           
       7911-CALCULATE-RETURNS.
           IF INV-PURCHASE-PRICE > 0
               COMPUTE WS-CALC-RESULT = 
                   (INV-CURRENT-PRICE - INV-PURCHASE-PRICE) /
                   INV-PURCHASE-PRICE * 100
           END-IF.
           
       7912-ASSESS-RISK.
           EVALUATE TRUE
               WHEN INV-STOCKS
                   MOVE 'H' TO WS-TEMP-FLAG
               WHEN INV-BONDS
                   MOVE 'L' TO WS-TEMP-FLAG
               WHEN INV-MUTUAL-FUND
                   MOVE 'M' TO WS-TEMP-FLAG
               WHEN OTHER
                   MOVE 'M' TO WS-TEMP-FLAG
           END-EVALUATE.
           
       7913-BENCHMARK-COMPARISON.
           CONTINUE.
           
       7920-ASSET-ALLOCATION.
           DISPLAY "OPTIMIZING ASSET ALLOCATION..."
           CONTINUE.
           
       7930-REBALANCING.
           DISPLAY "REBALANCING PORTFOLIOS..."
           CONTINUE.
           
       7940-TAX-OPTIMIZATION.
           DISPLAY "OPTIMIZING TAX EFFICIENCY..."
           PERFORM 7941-TAX-LOSS-HARVESTING
           PERFORM 7942-ASSET-LOCATION.
           
       7941-TAX-LOSS-HARVESTING.
           IF INV-GAIN-LOSS < 0
               ADD INV-GAIN-LOSS TO WS-CALC-TAX
           END-IF.
           
       7942-ASSET-LOCATION.
           CONTINUE.
           
       7950-ESTATE-PLANNING.
           DISPLAY "ESTATE PLANNING ANALYSIS..."
           CONTINUE.

      *================================================================*
      *         CUSTOMER SERVICE MODULE                                 *
      *================================================================*
       8600-CUSTOMER-SERVICE.
           PERFORM 8610-INQUIRY-PROCESSING
           PERFORM 8620-DISPUTE-RESOLUTION
           PERFORM 8630-COMPLAINT-HANDLING
           PERFORM 8640-SERVICE-REQUESTS
           PERFORM 8650-FEEDBACK-COLLECTION.
           
       8610-INQUIRY-PROCESSING.
           DISPLAY "PROCESSING CUSTOMER INQUIRIES..."
           CONTINUE.
           
       8620-DISPUTE-RESOLUTION.
           DISPLAY "RESOLVING DISPUTES..."
           PERFORM 8621-INVESTIGATE-DISPUTE
           PERFORM 8622-PROVISIONAL-CREDIT
           PERFORM 8623-FINAL-RESOLUTION.
           
       8621-INVESTIGATE-DISPUTE.
           CONTINUE.
           
       8622-PROVISIONAL-CREDIT.
           ADD WS-CALC-AMOUNT TO ACCT-BALANCE.
           
       8623-FINAL-RESOLUTION.
           CONTINUE.
           
       8630-COMPLAINT-HANDLING.
           DISPLAY "HANDLING COMPLAINTS..."
           CONTINUE.
           
       8640-SERVICE-REQUESTS.
           DISPLAY "PROCESSING SERVICE REQUESTS..."
           PERFORM 8641-ADDRESS-CHANGE
           PERFORM 8642-CARD-REPLACEMENT
           PERFORM 8643-STATEMENT-REQUEST.
           
       8641-ADDRESS-CHANGE.
           CONTINUE.
           
       8642-CARD-REPLACEMENT.
           ADD WS-ANNUAL-FEE-CARD TO WS-TOTAL-FEES.
           
       8643-STATEMENT-REQUEST.
           CONTINUE.
           
       8650-FEEDBACK-COLLECTION.
           DISPLAY "COLLECTING CUSTOMER FEEDBACK..."
           CONTINUE.

      *================================================================*
      *         BRANCH OPERATIONS MODULE                                *
      *================================================================*
       8700-BRANCH-OPERATIONS.
           PERFORM 8710-TELLER-TRANSACTIONS
           PERFORM 8720-VAULT-MANAGEMENT
           PERFORM 8730-ATM-RECONCILIATION
           PERFORM 8740-BRANCH-REPORTING
           PERFORM 8750-STAFF-SCHEDULING.
           
       8710-TELLER-TRANSACTIONS.
           DISPLAY "PROCESSING TELLER TRANSACTIONS..."
           CONTINUE.
           
       8720-VAULT-MANAGEMENT.
           DISPLAY "MANAGING VAULT..."
           PERFORM 8721-CASH-ORDERING
           PERFORM 8722-CASH-SHIPMENT
           PERFORM 8723-DAILY-BALANCING.
           
       8721-CASH-ORDERING.
           CONTINUE.
           
       8722-CASH-SHIPMENT.
           CONTINUE.
           
       8723-DAILY-BALANCING.
           CONTINUE.
           
       8730-ATM-RECONCILIATION.
           DISPLAY "RECONCILING ATM TRANSACTIONS..."
           CONTINUE.
           
       8740-BRANCH-REPORTING.
           DISPLAY "GENERATING BRANCH REPORTS..."
           CONTINUE.
           
       8750-STAFF-SCHEDULING.
           DISPLAY "SCHEDULING STAFF..."
           CONTINUE.

      *================================================================*
      *         DIGITAL BANKING MODULE                                  *
      *================================================================*
       8800-DIGITAL-BANKING.
           PERFORM 8810-ONLINE-BANKING
           PERFORM 8820-MOBILE-BANKING
           PERFORM 8830-BILL-PAY
           PERFORM 8840-P2P-TRANSFERS
           PERFORM 8850-DIGITAL-WALLET.
           
       8810-ONLINE-BANKING.
           DISPLAY "PROCESSING ONLINE BANKING..."
           PERFORM 8811-SESSION-MANAGEMENT
           PERFORM 8812-AUTHENTICATION
           PERFORM 8813-TRANSACTION-LIMITS.
           
       8811-SESSION-MANAGEMENT.
           CONTINUE.
           
       8812-AUTHENTICATION.
           CONTINUE.
           
       8813-TRANSACTION-LIMITS.
           IF WS-CALC-AMOUNT > 5000
               SET WS-NOT-APPROVED TO TRUE
           END-IF.
           
       8820-MOBILE-BANKING.
           DISPLAY "PROCESSING MOBILE BANKING..."
           PERFORM 8821-MOBILE-DEPOSIT
           PERFORM 8822-BIOMETRIC-AUTH
           PERFORM 8823-PUSH-NOTIFICATIONS.
           
       8821-MOBILE-DEPOSIT.
           CONTINUE.
           
       8822-BIOMETRIC-AUTH.
           CONTINUE.
           
       8823-PUSH-NOTIFICATIONS.
           CONTINUE.
           
       8830-BILL-PAY.
           DISPLAY "PROCESSING BILL PAYMENTS..."
           PERFORM 8831-SCHEDULE-PAYMENT
           PERFORM 8832-RECURRING-PAYMENTS
           PERFORM 8833-PAYMENT-CONFIRMATION.
           
       8831-SCHEDULE-PAYMENT.
           CONTINUE.
           
       8832-RECURRING-PAYMENTS.
           CONTINUE.
           
       8833-PAYMENT-CONFIRMATION.
           CONTINUE.
           
       8840-P2P-TRANSFERS.
           DISPLAY "PROCESSING P2P TRANSFERS..."
           ADD WS-WIRE-FEE-DOMESTIC TO WS-TOTAL-FEES.
           
       8850-DIGITAL-WALLET.
           DISPLAY "MANAGING DIGITAL WALLET..."
           CONTINUE.

      *================================================================*
      *         TREASURY MANAGEMENT MODULE                              *
      *================================================================*
       8900-TREASURY-MANAGEMENT.
           PERFORM 8910-LIQUIDITY-MANAGEMENT
           PERFORM 8920-CASH-POSITIONING
           PERFORM 8930-INTEREST-RATE-RISK
           PERFORM 8940-FX-MANAGEMENT
           PERFORM 8950-INVESTMENT-PORTFOLIO.
           
       8910-LIQUIDITY-MANAGEMENT.
           DISPLAY "MANAGING LIQUIDITY..."
           PERFORM 8911-CASH-FLOW-FORECAST
           PERFORM 8912-RESERVE-REQUIREMENTS
           PERFORM 8913-CONTINGENCY-FUNDING.
           
       8911-CASH-FLOW-FORECAST.
           COMPUTE WS-CALC-RESULT = 
               WS-TOTAL-DEPOSITS - WS-TOTAL-WITHDRAWALS.
               
       8912-RESERVE-REQUIREMENTS.
           COMPUTE WS-CALC-AMOUNT = 
               WS-TOTAL-DEPOSITS * 0.10.
               
       8913-CONTINGENCY-FUNDING.
           CONTINUE.
           
       8920-CASH-POSITIONING.
           DISPLAY "POSITIONING CASH..."
           CONTINUE.
           
       8930-INTEREST-RATE-RISK.
           DISPLAY "ANALYZING INTEREST RATE RISK..."
           PERFORM 8931-GAP-ANALYSIS
           PERFORM 8932-DURATION-ANALYSIS
           PERFORM 8933-SENSITIVITY-ANALYSIS.
           
       8931-GAP-ANALYSIS.
           CONTINUE.
           
       8932-DURATION-ANALYSIS.
           CONTINUE.
           
       8933-SENSITIVITY-ANALYSIS.
           CONTINUE.
           
       8940-FX-MANAGEMENT.
           DISPLAY "MANAGING FOREIGN EXCHANGE..."
           CONTINUE.
           
       8950-INVESTMENT-PORTFOLIO.
           DISPLAY "MANAGING INVESTMENT PORTFOLIO..."
           CONTINUE.

      *================================================================*
      *         DATA ANALYTICS MODULE                                   *
      *================================================================*
       9300-DATA-ANALYTICS.
           PERFORM 9310-CUSTOMER-SEGMENTATION
           PERFORM 9320-PRODUCT-PROFITABILITY
           PERFORM 9330-TREND-ANALYSIS
           PERFORM 9340-PREDICTIVE-MODELING
           PERFORM 9350-DASHBOARD-GENERATION.
           
       9310-CUSTOMER-SEGMENTATION.
           DISPLAY "SEGMENTING CUSTOMERS..."
           SET WS-NOT-EOF TO TRUE
           PERFORM UNTIL WS-EOF
               READ CUSTOMER-MASTER NEXT
                   AT END SET WS-EOF TO TRUE
                   NOT AT END
                       PERFORM 9311-CALCULATE-CLV
                       PERFORM 9312-ASSIGN-SEGMENT
               END-READ
           END-PERFORM.
           
       9311-CALCULATE-CLV.
           COMPUTE WS-CALC-RESULT = 
               (CUST-TOTAL-BALANCE * WS-SAVINGS-RATE) +
               (CUST-TOTAL-LOANS * WS-PERSONAL-RATE) +
               (CUST-TOTAL-INVESTMENTS * 0.01).
               
       9312-ASSIGN-SEGMENT.
           EVALUATE TRUE
               WHEN WS-CALC-RESULT > 10000
                   MOVE 'PLATINUM' TO WS-TEMP-CODE
               WHEN WS-CALC-RESULT > 5000
                   MOVE 'GOLD' TO WS-TEMP-CODE
               WHEN WS-CALC-RESULT > 1000
                   MOVE 'SILVER' TO WS-TEMP-CODE
               WHEN OTHER
                   MOVE 'BRONZE' TO WS-TEMP-CODE
           END-EVALUATE.
           
       9320-PRODUCT-PROFITABILITY.
           DISPLAY "ANALYZING PRODUCT PROFITABILITY..."
           CONTINUE.
           
       9330-TREND-ANALYSIS.
           DISPLAY "ANALYZING TRENDS..."
           CONTINUE.
           
       9340-PREDICTIVE-MODELING.
           DISPLAY "RUNNING PREDICTIVE MODELS..."
           PERFORM 9341-CHURN-PREDICTION
           PERFORM 9342-CROSS-SELL-SCORING
           PERFORM 9343-DEFAULT-PREDICTION.
           
       9341-CHURN-PREDICTION.
           CONTINUE.
           
       9342-CROSS-SELL-SCORING.
           CONTINUE.
           
       9343-DEFAULT-PREDICTION.
           IF LOAN-DELINQUENT
               ADD 25 TO WS-CALC-RESULT
           END-IF
           IF CUST-CREDIT-SCORE < 600
               ADD 30 TO WS-CALC-RESULT
           END-IF.
           
       9350-DASHBOARD-GENERATION.
           DISPLAY "GENERATING DASHBOARDS..."
           CONTINUE.

      *================================================================*
      *         BATCH PROCESSING MODULE                                 *
      *================================================================*
       9400-BATCH-PROCESSING.
           PERFORM 9410-END-OF-DAY
           PERFORM 9420-END-OF-MONTH
           PERFORM 9430-END-OF-QUARTER
           PERFORM 9440-END-OF-YEAR
           PERFORM 9450-DISASTER-RECOVERY.
           
       9410-END-OF-DAY.
           DISPLAY "RUNNING END-OF-DAY PROCESSING..."
           PERFORM 9411-POST-ALL-TRANSACTIONS
           PERFORM 9412-CALCULATE-BALANCES
           PERFORM 9413-GENERATE-EOD-REPORTS.
           
       9411-POST-ALL-TRANSACTIONS.
           CONTINUE.
           
       9412-CALCULATE-BALANCES.
           CONTINUE.
           
       9413-GENERATE-EOD-REPORTS.
           CONTINUE.
           
       9420-END-OF-MONTH.
           DISPLAY "RUNNING END-OF-MONTH PROCESSING..."
           PERFORM 9421-CALCULATE-INTEREST
           PERFORM 9422-APPLY-FEES
           PERFORM 9423-GENERATE-STATEMENTS.
           
       9421-CALCULATE-INTEREST.
           PERFORM 2400-CALCULATE-INTEREST.
           
       9422-APPLY-FEES.
           PERFORM 2500-APPLY-FEES.
           
       9423-GENERATE-STATEMENTS.
           PERFORM 6200-ACCOUNT-STATEMENTS.
           
       9430-END-OF-QUARTER.
           DISPLAY "RUNNING END-OF-QUARTER PROCESSING..."
           PERFORM 9431-REGULATORY-REPORTING
           PERFORM 9432-PERFORMANCE-REVIEW.
           
       9431-REGULATORY-REPORTING.
           PERFORM 6600-REGULATORY-REPORTS.
           
       9432-PERFORMANCE-REVIEW.
           CONTINUE.
           
       9440-END-OF-YEAR.
           DISPLAY "RUNNING END-OF-YEAR PROCESSING..."
           PERFORM 9441-TAX-DOCUMENT-GENERATION
           PERFORM 9442-ANNUAL-STATEMENTS
           PERFORM 9443-ARCHIVAL-PROCESS.
           
       9441-TAX-DOCUMENT-GENERATION.
           PERFORM 5500-GENERATE-TAX-DOCUMENTS.
           
       9442-ANNUAL-STATEMENTS.
           CONTINUE.
           
       9443-ARCHIVAL-PROCESS.
           CONTINUE.
           
       9450-DISASTER-RECOVERY.
           DISPLAY "DISASTER RECOVERY PROCEDURES..."
           PERFORM 9451-BACKUP-DATABASE
           PERFORM 9452-REPLICATE-DATA
           PERFORM 9453-TEST-RECOVERY.
           
       9451-BACKUP-DATABASE.
           CONTINUE.
           
       9452-REPLICATE-DATA.
           CONTINUE.
           
       9453-TEST-RECOVERY.
           CONTINUE.

      *================================================================*
      *         INTERNATIONAL BANKING MODULE                            *
      *================================================================*
       9500-INTERNATIONAL-BANKING.
           PERFORM 9510-FOREX-TRANSACTIONS
           PERFORM 9520-INTERNATIONAL-WIRES
           PERFORM 9530-TRADE-FINANCE
           PERFORM 9540-CORRESPONDENT-BANKING
           PERFORM 9550-MULTI-CURRENCY.
           
       9510-FOREX-TRANSACTIONS.
           DISPLAY "PROCESSING FOREX TRANSACTIONS..."
           CONTINUE.
           
       9520-INTERNATIONAL-WIRES.
           DISPLAY "PROCESSING INTERNATIONAL WIRES..."
           ADD WS-WIRE-FEE-INTL TO WS-TOTAL-FEES
           PERFORM 7630-OFAC-CHECK
           PERFORM 7650-SANCTION-LIST-CHECK.
           
       9530-TRADE-FINANCE.
           DISPLAY "PROCESSING TRADE FINANCE..."
           PERFORM 9531-LETTER-OF-CREDIT
           PERFORM 9532-DOCUMENTARY-COLLECTION
           PERFORM 9533-TRADE-LOANS.
           
       9531-LETTER-OF-CREDIT.
           CONTINUE.
           
       9532-DOCUMENTARY-COLLECTION.
           CONTINUE.
           
       9533-TRADE-LOANS.
           CONTINUE.
           
       9540-CORRESPONDENT-BANKING.
           DISPLAY "MANAGING CORRESPONDENT BANKING..."
           CONTINUE.
           
       9550-MULTI-CURRENCY.
           DISPLAY "MANAGING MULTI-CURRENCY ACCOUNTS..."
           CONTINUE.

      *================================================================*
      *         COMMERCIAL BANKING MODULE                               *
      *================================================================*
       9600-COMMERCIAL-BANKING.
           PERFORM 9610-BUSINESS-ACCOUNTS
           PERFORM 9620-COMMERCIAL-LOANS
           PERFORM 9630-CASH-MANAGEMENT
           PERFORM 9640-MERCHANT-SERVICES
           PERFORM 9650-PAYROLL-SERVICES.
           
       9610-BUSINESS-ACCOUNTS.
           DISPLAY "MANAGING BUSINESS ACCOUNTS..."
           CONTINUE.
           
       9620-COMMERCIAL-LOANS.
           DISPLAY "PROCESSING COMMERCIAL LOANS..."
           PERFORM 9621-SBA-LOANS
           PERFORM 9622-LINE-OF-CREDIT
           PERFORM 9623-EQUIPMENT-FINANCING.
           
       9621-SBA-LOANS.
           CONTINUE.
           
       9622-LINE-OF-CREDIT.
           CONTINUE.
           
       9623-EQUIPMENT-FINANCING.
           CONTINUE.
           
       9630-CASH-MANAGEMENT.
           DISPLAY "MANAGING CASH SERVICES..."
           PERFORM 9631-LOCKBOX-SERVICES
           PERFORM 9632-SWEEP-ACCOUNTS
           PERFORM 9633-ZBA-ACCOUNTS.
           
       9631-LOCKBOX-SERVICES.
           CONTINUE.
           
       9632-SWEEP-ACCOUNTS.
           IF ACCT-BALANCE > ACCT-MIN-BALANCE
               COMPUTE WS-CALC-AMOUNT = ACCT-BALANCE - ACCT-MIN-BALANCE
               SUBTRACT WS-CALC-AMOUNT FROM ACCT-BALANCE
               ADD WS-CALC-AMOUNT TO WS-TOTAL-INVESTMENTS
           END-IF.
           
       9633-ZBA-ACCOUNTS.
           CONTINUE.
           
       9640-MERCHANT-SERVICES.
           DISPLAY "MANAGING MERCHANT SERVICES..."
           CONTINUE.
           
       9650-PAYROLL-SERVICES.
           DISPLAY "PROCESSING PAYROLL SERVICES..."
           PERFORM 9651-DIRECT-DEPOSIT
           PERFORM 9652-TAX-FILING
           PERFORM 9653-PAYROLL-REPORTING.
           
       9651-DIRECT-DEPOSIT.
           CONTINUE.
           
       9652-TAX-FILING.
           CONTINUE.
           
       9653-PAYROLL-REPORTING.
           CONTINUE.

      *================================================================*
      *         TRUST AND CUSTODY MODULE                                *
      *================================================================*
       9700-TRUST-CUSTODY.
           PERFORM 9710-TRUST-ADMINISTRATION
           PERFORM 9720-CUSTODY-SERVICES
           PERFORM 9730-SECURITIES-LENDING
           PERFORM 9740-CORPORATE-ACTIONS
           PERFORM 9750-PROXY-VOTING.
           
       9710-TRUST-ADMINISTRATION.
           DISPLAY "ADMINISTERING TRUSTS..."
           PERFORM 9711-TRUST-ACCOUNTING
           PERFORM 9712-DISTRIBUTION-PROCESSING
           PERFORM 9713-BENEFICIARY-MANAGEMENT.
           
       9711-TRUST-ACCOUNTING.
           CONTINUE.
           
       9712-DISTRIBUTION-PROCESSING.
           CONTINUE.
           
       9713-BENEFICIARY-MANAGEMENT.
           CONTINUE.
           
       9720-CUSTODY-SERVICES.
           DISPLAY "PROVIDING CUSTODY SERVICES..."
           CONTINUE.
           
       9730-SECURITIES-LENDING.
           DISPLAY "MANAGING SECURITIES LENDING..."
           COMPUTE WS-CALC-RESULT = 
               WS-TOTAL-INVESTMENTS * 0.005.
               
       9740-CORPORATE-ACTIONS.
           DISPLAY "PROCESSING CORPORATE ACTIONS..."
           PERFORM 9741-DIVIDEND-PROCESSING
           PERFORM 9742-STOCK-SPLIT
           PERFORM 9743-MERGER-ACQUISITION.
           
       9741-DIVIDEND-PROCESSING.
           PERFORM 5400-CALCULATE-DIVIDENDS.
           
       9742-STOCK-SPLIT.
           CONTINUE.
           
       9743-MERGER-ACQUISITION.
           CONTINUE.
           
       9750-PROXY-VOTING.
           DISPLAY "MANAGING PROXY VOTING..."
           CONTINUE.

      *================================================================*
      *         RISK MANAGEMENT MODULE                                  *
      *================================================================*
       9800-RISK-MANAGEMENT.
           PERFORM 9810-CREDIT-RISK
           PERFORM 9820-MARKET-RISK
           PERFORM 9830-OPERATIONAL-RISK
           PERFORM 9840-LIQUIDITY-RISK
           PERFORM 9850-MODEL-RISK.
           
       9810-CREDIT-RISK.
           DISPLAY "ANALYZING CREDIT RISK..."
           PERFORM 9811-EXPOSURE-CALCULATION
           PERFORM 9812-LOSS-PROVISIONING
           PERFORM 9813-CAPITAL-ALLOCATION.
           
       9811-EXPOSURE-CALCULATION.
           COMPUTE WS-CALC-RESULT = 
               WS-TOTAL-LOANS * 0.08.
               
       9812-LOSS-PROVISIONING.
           COMPUTE WS-CALC-AMOUNT = 
               WS-TOTAL-LOANS * 0.02.
               
       9813-CAPITAL-ALLOCATION.
           CONTINUE.
           
       9820-MARKET-RISK.
           DISPLAY "ANALYZING MARKET RISK..."
           PERFORM 9821-VAR-CALCULATION
           PERFORM 9822-STRESS-TESTING
           PERFORM 9823-SCENARIO-ANALYSIS.
           
       9821-VAR-CALCULATION.
           COMPUTE WS-CALC-RESULT = 
               WS-TOTAL-INVESTMENTS * 0.025.
               
       9822-STRESS-TESTING.
           CONTINUE.
           
       9823-SCENARIO-ANALYSIS.
           CONTINUE.
           
       9830-OPERATIONAL-RISK.
           DISPLAY "ANALYZING OPERATIONAL RISK..."
           CONTINUE.
           
       9840-LIQUIDITY-RISK.
           DISPLAY "ANALYZING LIQUIDITY RISK..."
           PERFORM 8910-LIQUIDITY-MANAGEMENT.
           
       9850-MODEL-RISK.
           DISPLAY "ANALYZING MODEL RISK..."
           CONTINUE.

      *================================================================*
      *         AUDIT AND CONTROL MODULE                                *
      *================================================================*
       9900-AUDIT-CONTROL.
           PERFORM 9910-INTERNAL-AUDIT
           PERFORM 9920-SOX-COMPLIANCE
           PERFORM 9930-CONTROL-TESTING
           PERFORM 9940-EXCEPTION-MONITORING
           PERFORM 9950-AUDIT-REPORTING.
           
       9910-INTERNAL-AUDIT.
           DISPLAY "PERFORMING INTERNAL AUDIT..."
           CONTINUE.
           
       9920-SOX-COMPLIANCE.
           DISPLAY "SOX COMPLIANCE TESTING..."
           PERFORM 9921-CONTROL-DOCUMENTATION
           PERFORM 9922-CONTROL-EVALUATION
           PERFORM 9923-DEFICIENCY-TRACKING.
           
       9921-CONTROL-DOCUMENTATION.
           CONTINUE.
           
       9922-CONTROL-EVALUATION.
           CONTINUE.
           
       9923-DEFICIENCY-TRACKING.
           CONTINUE.
           
       9930-CONTROL-TESTING.
           DISPLAY "TESTING CONTROLS..."
           CONTINUE.
           
       9940-EXCEPTION-MONITORING.
           DISPLAY "MONITORING EXCEPTIONS..."
           IF WS-ERROR-COUNT > 100
               DISPLAY "WARNING: HIGH ERROR COUNT DETECTED"
           END-IF.
           
       9950-AUDIT-REPORTING.
           DISPLAY "GENERATING AUDIT REPORTS..."
           CONTINUE.

      *================================================================*
      *         ENTERPRISE DATA WAREHOUSE MODULE                        *
      *================================================================*
       A000-DATA-WAREHOUSE.
           PERFORM A100-ETL-PROCESSING
           PERFORM A200-DATA-QUALITY
           PERFORM A300-DATA-GOVERNANCE
           PERFORM A400-METADATA-MANAGEMENT
           PERFORM A500-DATA-LINEAGE.
           
       A100-ETL-PROCESSING.
           DISPLAY "RUNNING ETL PROCESSES..."
           PERFORM A110-EXTRACT-DATA
           PERFORM A120-TRANSFORM-DATA
           PERFORM A130-LOAD-DATA.
           
       A110-EXTRACT-DATA.
           SET WS-NOT-EOF TO TRUE
           PERFORM UNTIL WS-EOF
               READ CUSTOMER-MASTER NEXT
                   AT END SET WS-EOF TO TRUE
                   NOT AT END
                       ADD 1 TO WS-PROCESS-COUNT
               END-READ
           END-PERFORM.
           
       A120-TRANSFORM-DATA.
           PERFORM A121-CLEANSE-DATA
           PERFORM A122-STANDARDIZE-DATA
           PERFORM A123-ENRICH-DATA.
           
       A121-CLEANSE-DATA.
           IF CUST-NAME = SPACES
               MOVE "UNKNOWN" TO CUST-LAST-NAME
           END-IF.
           
       A122-STANDARDIZE-DATA.
           INSPECT CUST-STATE CONVERTING 
               "abcdefghijklmnopqrstuvwxyz" TO
               "ABCDEFGHIJKLMNOPQRSTUVWXYZ".
               
       A123-ENRICH-DATA.
           CONTINUE.
           
       A130-LOAD-DATA.
           CONTINUE.
           
       A200-DATA-QUALITY.
           DISPLAY "CHECKING DATA QUALITY..."
           PERFORM A210-COMPLETENESS-CHECK
           PERFORM A220-ACCURACY-CHECK
           PERFORM A230-CONSISTENCY-CHECK
           PERFORM A240-TIMELINESS-CHECK.
           
       A210-COMPLETENESS-CHECK.
           IF CUST-ID = SPACES
               ADD 1 TO WS-ERROR-COUNT
           END-IF.
           
       A220-ACCURACY-CHECK.
           IF CUST-CREDIT-SCORE < 300 OR CUST-CREDIT-SCORE > 850
               ADD 1 TO WS-ERROR-COUNT
           END-IF.
           
       A230-CONSISTENCY-CHECK.
           CONTINUE.
           
       A240-TIMELINESS-CHECK.
           IF CUST-LAST-ACTIVITY < WS-CURRENT-DATE - 365
               MOVE 'I' TO CUST-STATUS
           END-IF.
           
       A300-DATA-GOVERNANCE.
           DISPLAY "ENFORCING DATA GOVERNANCE..."
           PERFORM A310-ACCESS-CONTROL
           PERFORM A320-DATA-CLASSIFICATION
           PERFORM A330-RETENTION-POLICY.
           
       A310-ACCESS-CONTROL.
           CONTINUE.
           
       A320-DATA-CLASSIFICATION.
           IF CUST-SSN NOT = SPACES
               MOVE 'CONFIDENTIAL' TO WS-TEMP-CODE
           END-IF.
           
       A330-RETENTION-POLICY.
           CONTINUE.
           
       A400-METADATA-MANAGEMENT.
           DISPLAY "MANAGING METADATA..."
           CONTINUE.
           
       A500-DATA-LINEAGE.
           DISPLAY "TRACKING DATA LINEAGE..."
           CONTINUE.

      *================================================================*
      *         REGULATORY REPORTING MODULE                             *
      *================================================================*
       B000-REGULATORY-REPORTING.
           PERFORM B100-BASEL-III-REPORTING
           PERFORM B200-DODD-FRANK-REPORTING
           PERFORM B300-CCAR-REPORTING
           PERFORM B400-CECL-REPORTING
           PERFORM B500-FDIC-REPORTING.
           
       B100-BASEL-III-REPORTING.
           DISPLAY "GENERATING BASEL III REPORTS..."
           PERFORM B110-CAPITAL-RATIOS
           PERFORM B120-LEVERAGE-RATIO
           PERFORM B130-LIQUIDITY-COVERAGE.
           
       B110-CAPITAL-RATIOS.
           COMPUTE WS-CALC-RESULT = 
               WS-TOTAL-DEPOSITS * 0.08.
               
       B120-LEVERAGE-RATIO.
           COMPUTE WS-CALC-RESULT = 
               WS-TOTAL-DEPOSITS / WS-TOTAL-LOANS.
               
       B130-LIQUIDITY-COVERAGE.
           CONTINUE.
           
       B200-DODD-FRANK-REPORTING.
           DISPLAY "GENERATING DODD-FRANK REPORTS..."
           PERFORM B210-VOLCKER-COMPLIANCE
           PERFORM B220-SWAP-REPORTING
           PERFORM B230-LIVING-WILL.
           
       B210-VOLCKER-COMPLIANCE.
           CONTINUE.
           
       B220-SWAP-REPORTING.
           CONTINUE.
           
       B230-LIVING-WILL.
           CONTINUE.
           
       B300-CCAR-REPORTING.
           DISPLAY "GENERATING CCAR REPORTS..."
           PERFORM B310-STRESS-SCENARIOS
           PERFORM B320-CAPITAL-PLANNING
           PERFORM B330-RISK-APPETITE.
           
       B310-STRESS-SCENARIOS.
           COMPUTE WS-CALC-RESULT = 
               WS-TOTAL-LOANS * 0.15.
               
       B320-CAPITAL-PLANNING.
           CONTINUE.
           
       B330-RISK-APPETITE.
           CONTINUE.
           
       B400-CECL-REPORTING.
           DISPLAY "GENERATING CECL REPORTS..."
           PERFORM B410-EXPECTED-LOSS
           PERFORM B420-ALLOWANCE-CALCULATION
           PERFORM B430-DISCLOSURE-PREPARATION.
           
       B410-EXPECTED-LOSS.
           COMPUTE WS-CALC-AMOUNT = 
               WS-TOTAL-LOANS * 0.025.
               
       B420-ALLOWANCE-CALCULATION.
           ADD WS-CALC-AMOUNT TO WS-TOTAL-FEES.
           
       B430-DISCLOSURE-PREPARATION.
           CONTINUE.
           
       B500-FDIC-REPORTING.
           DISPLAY "GENERATING FDIC REPORTS..."
           PERFORM B510-CALL-REPORT
           PERFORM B520-DEPOSIT-INSURANCE
           PERFORM B530-ASSESSMENT-CALCULATION.
           
       B510-CALL-REPORT.
           CONTINUE.
           
       B520-DEPOSIT-INSURANCE.
           COMPUTE WS-CALC-AMOUNT = 
               WS-TOTAL-DEPOSITS * 0.0005.
               
       B530-ASSESSMENT-CALCULATION.
           ADD WS-CALC-AMOUNT TO WS-TOTAL-FEES.

      *================================================================*
      *         ANTI-MONEY LAUNDERING EXTENDED MODULE                   *
      *================================================================*
       C000-AML-EXTENDED.
           PERFORM C100-TRANSACTION-MONITORING
           PERFORM C200-CASE-MANAGEMENT
           PERFORM C300-SAR-FILING
           PERFORM C400-WATCHLIST-SCREENING
           PERFORM C500-BENEFICIAL-OWNERSHIP.
           
       C100-TRANSACTION-MONITORING.
           DISPLAY "MONITORING TRANSACTIONS..."
           SET WS-NOT-EOF TO TRUE
           PERFORM UNTIL WS-EOF
               READ TRANSACTION-LOG NEXT
                   AT END SET WS-EOF TO TRUE
                   NOT AT END
                       PERFORM C110-RULE-BASED-DETECTION
                       PERFORM C120-BEHAVIOR-ANALYSIS
                       PERFORM C130-NETWORK-ANALYSIS
               END-READ
           END-PERFORM.
           
       C110-RULE-BASED-DETECTION.
           IF TRAN-AMOUNT >= 10000
               PERFORM C111-FLAG-CTR
           END-IF
           IF TRAN-AMOUNT >= 5000 AND TRAN-AMOUNT < 10000
               PERFORM C112-CHECK-STRUCTURING
           END-IF.
           
       C111-FLAG-CTR.
           ADD 1 TO WS-PROCESS-COUNT.
           
       C112-CHECK-STRUCTURING.
           ADD 1 TO WS-ERROR-COUNT.
           
       C120-BEHAVIOR-ANALYSIS.
           CONTINUE.
           
       C130-NETWORK-ANALYSIS.
           CONTINUE.
           
       C200-CASE-MANAGEMENT.
           DISPLAY "MANAGING AML CASES..."
           PERFORM C210-CASE-CREATION
           PERFORM C220-CASE-INVESTIGATION
           PERFORM C230-CASE-RESOLUTION.
           
       C210-CASE-CREATION.
           CONTINUE.
           
       C220-CASE-INVESTIGATION.
           CONTINUE.
           
       C230-CASE-RESOLUTION.
           CONTINUE.
           
       C300-SAR-FILING.
           DISPLAY "FILING SUSPICIOUS ACTIVITY REPORTS..."
           IF WS-ERROR-COUNT > 5
               PERFORM C310-PREPARE-SAR
               PERFORM C320-SUBMIT-SAR
               PERFORM C330-TRACK-SAR
           END-IF.
           
       C310-PREPARE-SAR.
           CONTINUE.
           
       C320-SUBMIT-SAR.
           CONTINUE.
           
       C330-TRACK-SAR.
           CONTINUE.
           
       C400-WATCHLIST-SCREENING.
           DISPLAY "SCREENING WATCHLISTS..."
           PERFORM C410-OFAC-SCREENING
           PERFORM C420-UN-SANCTIONS
           PERFORM C430-EU-SANCTIONS
           PERFORM C440-PEP-DATABASE.
           
       C410-OFAC-SCREENING.
           CONTINUE.
           
       C420-UN-SANCTIONS.
           CONTINUE.
           
       C430-EU-SANCTIONS.
           CONTINUE.
           
       C440-PEP-DATABASE.
           CONTINUE.
           
       C500-BENEFICIAL-OWNERSHIP.
           DISPLAY "VERIFYING BENEFICIAL OWNERSHIP..."
           PERFORM C510-OWNERSHIP-IDENTIFICATION
           PERFORM C520-OWNERSHIP-VERIFICATION
           PERFORM C530-OWNERSHIP-UPDATE.
           
       C510-OWNERSHIP-IDENTIFICATION.
           CONTINUE.
           
       C520-OWNERSHIP-VERIFICATION.
           CONTINUE.
           
       C530-OWNERSHIP-UPDATE.
           CONTINUE.

      *================================================================*
      *         ADVANCED ANALYTICS MODULE                               *
      *================================================================*
       D000-ADVANCED-ANALYTICS.
           PERFORM D100-MACHINE-LEARNING
           PERFORM D200-NATURAL-LANGUAGE
           PERFORM D300-GRAPH-ANALYTICS
           PERFORM D400-TIME-SERIES
           PERFORM D500-OPTIMIZATION.
           
       D100-MACHINE-LEARNING.
           DISPLAY "RUNNING MACHINE LEARNING MODELS..."
           PERFORM D110-CLASSIFICATION
           PERFORM D120-REGRESSION
           PERFORM D130-CLUSTERING.
           
       D110-CLASSIFICATION.
           IF CUST-CREDIT-SCORE > 750
               MOVE 'A' TO CUST-RISK-RATING
           ELSE IF CUST-CREDIT-SCORE > 650
               MOVE 'B' TO CUST-RISK-RATING
           ELSE IF CUST-CREDIT-SCORE > 550
               MOVE 'C' TO CUST-RISK-RATING
           ELSE
               MOVE 'D' TO CUST-RISK-RATING
           END-IF
           END-IF
           END-IF.
           
       D120-REGRESSION.
           COMPUTE WS-CALC-RESULT = 
               (CUST-CREDIT-SCORE * 10) +
               (CUST-TOTAL-BALANCE / 1000) -
               (CUST-TOTAL-LOANS / 2000).
               
       D130-CLUSTERING.
           CONTINUE.
           
       D200-NATURAL-LANGUAGE.
           DISPLAY "PROCESSING NATURAL LANGUAGE..."
           PERFORM D210-TEXT-EXTRACTION
           PERFORM D220-SENTIMENT-ANALYSIS
           PERFORM D230-ENTITY-RECOGNITION.
           
       D210-TEXT-EXTRACTION.
           CONTINUE.
           
       D220-SENTIMENT-ANALYSIS.
           CONTINUE.
           
       D230-ENTITY-RECOGNITION.
           CONTINUE.
           
       D300-GRAPH-ANALYTICS.
           DISPLAY "RUNNING GRAPH ANALYTICS..."
           PERFORM D310-RELATIONSHIP-MAPPING
           PERFORM D320-COMMUNITY-DETECTION
           PERFORM D330-CENTRALITY-ANALYSIS.
           
       D310-RELATIONSHIP-MAPPING.
           CONTINUE.
           
       D320-COMMUNITY-DETECTION.
           CONTINUE.
           
       D330-CENTRALITY-ANALYSIS.
           CONTINUE.
           
       D400-TIME-SERIES.
           DISPLAY "ANALYZING TIME SERIES..."
           PERFORM D410-TREND-DETECTION
           PERFORM D420-SEASONALITY-ANALYSIS
           PERFORM D430-FORECASTING.
           
       D410-TREND-DETECTION.
           CONTINUE.
           
       D420-SEASONALITY-ANALYSIS.
           CONTINUE.
           
       D430-FORECASTING.
           COMPUTE WS-CALC-RESULT = 
               WS-TOTAL-DEPOSITS * 1.05.
               
       D500-OPTIMIZATION.
           DISPLAY "RUNNING OPTIMIZATION..."
           PERFORM D510-LINEAR-PROGRAMMING
           PERFORM D520-CONSTRAINT-SATISFACTION
           PERFORM D530-GENETIC-ALGORITHMS.
           
       D510-LINEAR-PROGRAMMING.
           CONTINUE.
           
       D520-CONSTRAINT-SATISFACTION.
           CONTINUE.
           
       D530-GENETIC-ALGORITHMS.
           CONTINUE.

      *================================================================*
      *         CYBERSECURITY MODULE                                    *
      *================================================================*
       E000-CYBERSECURITY.
           PERFORM E100-THREAT-DETECTION
           PERFORM E200-VULNERABILITY-MANAGEMENT
           PERFORM E300-INCIDENT-RESPONSE
           PERFORM E400-SECURITY-MONITORING
           PERFORM E500-ACCESS-MANAGEMENT.
           
       E100-THREAT-DETECTION.
           DISPLAY "DETECTING THREATS..."
           PERFORM E110-INTRUSION-DETECTION
           PERFORM E120-MALWARE-DETECTION
           PERFORM E130-ANOMALY-DETECTION.
           
       E110-INTRUSION-DETECTION.
           CONTINUE.
           
       E120-MALWARE-DETECTION.
           CONTINUE.
           
       E130-ANOMALY-DETECTION.
           IF WS-ERROR-COUNT > 50
               DISPLAY "ANOMALY DETECTED: HIGH ERROR RATE"
           END-IF.
           
       E200-VULNERABILITY-MANAGEMENT.
           DISPLAY "MANAGING VULNERABILITIES..."
           PERFORM E210-VULNERABILITY-SCANNING
           PERFORM E220-PATCH-MANAGEMENT
           PERFORM E230-CONFIGURATION-AUDIT.
           
       E210-VULNERABILITY-SCANNING.
           CONTINUE.
           
       E220-PATCH-MANAGEMENT.
           CONTINUE.
           
       E230-CONFIGURATION-AUDIT.
           CONTINUE.
           
       E300-INCIDENT-RESPONSE.
           DISPLAY "MANAGING INCIDENTS..."
           PERFORM E310-INCIDENT-DETECTION
           PERFORM E320-INCIDENT-CONTAINMENT
           PERFORM E330-INCIDENT-RECOVERY.
           
       E310-INCIDENT-DETECTION.
           CONTINUE.
           
       E320-INCIDENT-CONTAINMENT.
           CONTINUE.
           
       E330-INCIDENT-RECOVERY.
           CONTINUE.
           
       E400-SECURITY-MONITORING.
           DISPLAY "MONITORING SECURITY..."
           PERFORM E410-LOG-ANALYSIS
           PERFORM E420-SIEM-INTEGRATION
           PERFORM E430-ALERT-MANAGEMENT.
           
       E410-LOG-ANALYSIS.
           CONTINUE.
           
       E420-SIEM-INTEGRATION.
           CONTINUE.
           
       E430-ALERT-MANAGEMENT.
           IF WS-ERROR-COUNT > 100
               DISPLAY "SECURITY ALERT: CRITICAL THRESHOLD"
           END-IF.
           
       E500-ACCESS-MANAGEMENT.
           DISPLAY "MANAGING ACCESS..."
           PERFORM E510-IDENTITY-MANAGEMENT
           PERFORM E520-PRIVILEGE-MANAGEMENT
           PERFORM E530-ACCESS-CERTIFICATION.
           
       E510-IDENTITY-MANAGEMENT.
           CONTINUE.
           
       E520-PRIVILEGE-MANAGEMENT.
           CONTINUE.
           
       E530-ACCESS-CERTIFICATION.
           CONTINUE.

      *================================================================*
      *         BLOCKCHAIN INTEGRATION MODULE                           *
      *================================================================*
       F000-BLOCKCHAIN.
           PERFORM F100-DISTRIBUTED-LEDGER
           PERFORM F200-SMART-CONTRACTS
           PERFORM F300-DIGITAL-ASSETS
           PERFORM F400-CROSS-BORDER-PAYMENTS
           PERFORM F500-TRADE-SETTLEMENT.
           
       F100-DISTRIBUTED-LEDGER.
           DISPLAY "MANAGING DISTRIBUTED LEDGER..."
           PERFORM F110-TRANSACTION-RECORDING
           PERFORM F120-CONSENSUS-VALIDATION
           PERFORM F130-LEDGER-SYNC.
           
       F110-TRANSACTION-RECORDING.
           MOVE WS-CURRENT-TIMESTAMP TO WS-TEMP-STRING
           PERFORM 8100-WRITE-TRANSACTION.
           
       F120-CONSENSUS-VALIDATION.
           SET WS-VALID TO TRUE.
           
       F130-LEDGER-SYNC.
           CONTINUE.
           
       F200-SMART-CONTRACTS.
           DISPLAY "EXECUTING SMART CONTRACTS..."
           PERFORM F210-CONTRACT-DEPLOYMENT
           PERFORM F220-CONTRACT-EXECUTION
           PERFORM F230-CONTRACT-AUDIT.
           
       F210-CONTRACT-DEPLOYMENT.
           CONTINUE.
           
       F220-CONTRACT-EXECUTION.
           IF LOAN-CURRENT-BALANCE = 0
               SET LOAN-PAID-OFF TO TRUE
           END-IF.
           
       F230-CONTRACT-AUDIT.
           CONTINUE.
           
       F300-DIGITAL-ASSETS.
           DISPLAY "MANAGING DIGITAL ASSETS..."
           PERFORM F310-TOKENIZATION
           PERFORM F320-CUSTODY
           PERFORM F330-TRADING.
           
       F310-TOKENIZATION.
           CONTINUE.
           
       F320-CUSTODY.
           CONTINUE.
           
       F330-TRADING.
           ADD WS-ATM-FEE-FOREIGN TO WS-TOTAL-FEES.
           
       F400-CROSS-BORDER-PAYMENTS.
           DISPLAY "PROCESSING CROSS-BORDER PAYMENTS..."
           PERFORM F410-PAYMENT-ROUTING
           PERFORM F420-FX-CONVERSION
           PERFORM F430-SETTLEMENT.
           
       F410-PAYMENT-ROUTING.
           CONTINUE.
           
       F420-FX-CONVERSION.
           COMPUTE WS-CALC-AMOUNT = 
               WS-CALC-AMOUNT * 1.02.
               
       F430-SETTLEMENT.
           CONTINUE.
           
       F500-TRADE-SETTLEMENT.
           DISPLAY "SETTLING TRADES..."
           PERFORM F510-MATCHING
           PERFORM F520-CLEARING
           PERFORM F530-SETTLEMENT-FINALITY.
           
       F510-MATCHING.
           CONTINUE.
           
       F520-CLEARING.
           CONTINUE.
           
       F530-SETTLEMENT-FINALITY.
           CONTINUE.

      *================================================================*
      *         API BANKING MODULE                                      *
      *================================================================*
       G000-API-BANKING.
           PERFORM G100-OPEN-BANKING
           PERFORM G200-API-MANAGEMENT
           PERFORM G300-PARTNER-INTEGRATION
           PERFORM G400-DEVELOPER-PORTAL
           PERFORM G500-API-ANALYTICS.
           
       G100-OPEN-BANKING.
           DISPLAY "MANAGING OPEN BANKING..."
           PERFORM G110-CONSENT-MANAGEMENT
           PERFORM G120-DATA-SHARING
           PERFORM G130-PAYMENT-INITIATION.
           
       G110-CONSENT-MANAGEMENT.
           CONTINUE.
           
       G120-DATA-SHARING.
           CONTINUE.
           
       G130-PAYMENT-INITIATION.
           PERFORM 2300-PROCESS-TRANSFERS.
           
       G200-API-MANAGEMENT.
           DISPLAY "MANAGING APIS..."
           PERFORM G210-API-GATEWAY
           PERFORM G220-RATE-LIMITING
           PERFORM G230-API-VERSIONING.
           
       G210-API-GATEWAY.
           CONTINUE.
           
       G220-RATE-LIMITING.
           IF WS-PROCESS-COUNT > 10000
               DISPLAY "RATE LIMIT EXCEEDED"
           END-IF.
           
       G230-API-VERSIONING.
           CONTINUE.
           
       G300-PARTNER-INTEGRATION.
           DISPLAY "INTEGRATING PARTNERS..."
           PERFORM G310-FINTECH-INTEGRATION
           PERFORM G320-AGGREGATOR-INTEGRATION
           PERFORM G330-MARKETPLACE-INTEGRATION.
           
       G310-FINTECH-INTEGRATION.
           CONTINUE.
           
       G320-AGGREGATOR-INTEGRATION.
           CONTINUE.
           
       G330-MARKETPLACE-INTEGRATION.
           CONTINUE.
           
       G400-DEVELOPER-PORTAL.
           DISPLAY "MANAGING DEVELOPER PORTAL..."
           CONTINUE.
           
       G500-API-ANALYTICS.
           DISPLAY "ANALYZING API USAGE..."
           MOVE WS-PROCESS-COUNT TO WS-FORMATTED-COUNT
           DISPLAY "TOTAL API CALLS: " WS-FORMATTED-COUNT.

      *================================================================*
      *         CLOUD INTEGRATION MODULE                                *
      *================================================================*
       H000-CLOUD-INTEGRATION.
           PERFORM H100-HYBRID-CLOUD
           PERFORM H200-DATA-MIGRATION
           PERFORM H300-CLOUD-SECURITY
           PERFORM H400-COST-OPTIMIZATION
           PERFORM H500-DISASTER-RECOVERY-CLOUD.
           
       H100-HYBRID-CLOUD.
           DISPLAY "MANAGING HYBRID CLOUD..."
           PERFORM H110-WORKLOAD-DISTRIBUTION
           PERFORM H120-DATA-SYNC
           PERFORM H130-FAILOVER-MANAGEMENT.
           
       H110-WORKLOAD-DISTRIBUTION.
           CONTINUE.
           
       H120-DATA-SYNC.
           CONTINUE.
           
       H130-FAILOVER-MANAGEMENT.
           CONTINUE.
           
       H200-DATA-MIGRATION.
           DISPLAY "MIGRATING DATA TO CLOUD..."
           PERFORM H210-DATA-ASSESSMENT
           PERFORM H220-MIGRATION-EXECUTION
           PERFORM H230-VALIDATION.
           
       H210-DATA-ASSESSMENT.
           MOVE WS-CUST-COUNT TO WS-FORMATTED-COUNT
           DISPLAY "RECORDS TO MIGRATE: " WS-FORMATTED-COUNT.
           
       H220-MIGRATION-EXECUTION.
           CONTINUE.
           
       H230-VALIDATION.
           CONTINUE.
           
       H300-CLOUD-SECURITY.
           DISPLAY "SECURING CLOUD ENVIRONMENT..."
           PERFORM H310-ENCRYPTION
           PERFORM H320-KEY-MANAGEMENT
           PERFORM H330-NETWORK-SECURITY.
           
       H310-ENCRYPTION.
           CONTINUE.
           
       H320-KEY-MANAGEMENT.
           CONTINUE.
           
       H330-NETWORK-SECURITY.
           CONTINUE.
           
       H400-COST-OPTIMIZATION.
           DISPLAY "OPTIMIZING CLOUD COSTS..."
           PERFORM H410-RESOURCE-RIGHTSIZING
           PERFORM H420-RESERVED-INSTANCES
           PERFORM H430-SPOT-INSTANCES.
           
       H410-RESOURCE-RIGHTSIZING.
           CONTINUE.
           
       H420-RESERVED-INSTANCES.
           CONTINUE.
           
       H430-SPOT-INSTANCES.
           CONTINUE.
           
       H500-DISASTER-RECOVERY-CLOUD.
           DISPLAY "MANAGING CLOUD DR..."
           PERFORM H510-BACKUP-REPLICATION
           PERFORM H520-RECOVERY-TESTING
           PERFORM H530-FAILOVER-AUTOMATION.
           
       H510-BACKUP-REPLICATION.
           CONTINUE.
           
       H520-RECOVERY-TESTING.
           CONTINUE.
           
       H530-FAILOVER-AUTOMATION.
           CONTINUE.

      *================================================================*
      *         CUSTOMER 360 MODULE                                     *
      *================================================================*
       I000-CUSTOMER-360.
           PERFORM I100-PROFILE-MANAGEMENT
           PERFORM I200-RELATIONSHIP-VIEW
           PERFORM I300-INTERACTION-HISTORY
           PERFORM I400-PREFERENCE-MANAGEMENT
           PERFORM I500-JOURNEY-MAPPING.
           
       I100-PROFILE-MANAGEMENT.
           DISPLAY "MANAGING CUSTOMER PROFILES..."
           SET WS-NOT-EOF TO TRUE
           PERFORM UNTIL WS-EOF
               READ CUSTOMER-MASTER NEXT
                   AT END SET WS-EOF TO TRUE
                   NOT AT END
                       PERFORM I110-UPDATE-PROFILE
                       PERFORM I120-ENRICH-PROFILE
                       ADD 1 TO WS-CUST-COUNT
               END-READ
           END-PERFORM.
           
       I110-UPDATE-PROFILE.
           MOVE WS-CURRENT-DATE TO CUST-LAST-ACTIVITY.
           
       I120-ENRICH-PROFILE.
           CONTINUE.
           
       I200-RELATIONSHIP-VIEW.
           DISPLAY "BUILDING RELATIONSHIP VIEW..."
           PERFORM I210-ACCOUNT-AGGREGATION
           PERFORM I220-HOUSEHOLD-LINKING
           PERFORM I230-BUSINESS-LINKING.
           
       I210-ACCOUNT-AGGREGATION.
           CONTINUE.
           
       I220-HOUSEHOLD-LINKING.
           CONTINUE.
           
       I230-BUSINESS-LINKING.
           CONTINUE.
           
       I300-INTERACTION-HISTORY.
           DISPLAY "TRACKING INTERACTIONS..."
           PERFORM I310-CHANNEL-HISTORY
           PERFORM I320-COMMUNICATION-HISTORY
           PERFORM I330-SERVICE-HISTORY.
           
       I310-CHANNEL-HISTORY.
           CONTINUE.
           
       I320-COMMUNICATION-HISTORY.
           CONTINUE.
           
       I330-SERVICE-HISTORY.
           CONTINUE.
           
       I400-PREFERENCE-MANAGEMENT.
           DISPLAY "MANAGING PREFERENCES..."
           PERFORM I410-COMMUNICATION-PREFERENCES
           PERFORM I420-PRODUCT-PREFERENCES
           PERFORM I430-CHANNEL-PREFERENCES.
           
       I410-COMMUNICATION-PREFERENCES.
           CONTINUE.
           
       I420-PRODUCT-PREFERENCES.
           CONTINUE.
           
       I430-CHANNEL-PREFERENCES.
           CONTINUE.
           
       I500-JOURNEY-MAPPING.
           DISPLAY "MAPPING CUSTOMER JOURNEYS..."
           PERFORM I510-TOUCHPOINT-ANALYSIS
           PERFORM I520-EXPERIENCE-SCORING
           PERFORM I530-JOURNEY-OPTIMIZATION.
           
       I510-TOUCHPOINT-ANALYSIS.
           CONTINUE.
           
       I520-EXPERIENCE-SCORING.
           CONTINUE.
           
       I530-JOURNEY-OPTIMIZATION.
           CONTINUE.

      *================================================================*
      *         ROBOTIC PROCESS AUTOMATION MODULE                       *
      *================================================================*
       J000-RPA-AUTOMATION.
           PERFORM J100-BOT-MANAGEMENT
           PERFORM J200-PROCESS-AUTOMATION
           PERFORM J300-EXCEPTION-HANDLING
           PERFORM J400-PERFORMANCE-MONITORING
           PERFORM J500-CONTINUOUS-IMPROVEMENT.
           
       J100-BOT-MANAGEMENT.
           DISPLAY "MANAGING RPA BOTS..."
           PERFORM J110-BOT-DEPLOYMENT
           PERFORM J120-BOT-SCHEDULING
           PERFORM J130-BOT-MONITORING.
           
       J110-BOT-DEPLOYMENT.
           CONTINUE.
           
       J120-BOT-SCHEDULING.
           CONTINUE.
           
       J130-BOT-MONITORING.
           IF WS-ERROR-COUNT > 10
               DISPLAY "BOT ERROR THRESHOLD EXCEEDED"
           END-IF.
           
       J200-PROCESS-AUTOMATION.
           DISPLAY "AUTOMATING PROCESSES..."
           PERFORM J210-DATA-ENTRY-AUTOMATION
           PERFORM J220-RECONCILIATION-AUTOMATION
           PERFORM J230-REPORT-AUTOMATION.
           
       J210-DATA-ENTRY-AUTOMATION.
           CONTINUE.
           
       J220-RECONCILIATION-AUTOMATION.
           PERFORM 2700-RECONCILE-ACCOUNTS.
           
       J230-REPORT-AUTOMATION.
           PERFORM 6000-GENERATE-REPORTS.
           
       J300-EXCEPTION-HANDLING.
           DISPLAY "HANDLING RPA EXCEPTIONS..."
           PERFORM J310-EXCEPTION-DETECTION
           PERFORM J320-EXCEPTION-ROUTING
           PERFORM J330-EXCEPTION-RESOLUTION.
           
       J310-EXCEPTION-DETECTION.
           CONTINUE.
           
       J320-EXCEPTION-ROUTING.
           CONTINUE.
           
       J330-EXCEPTION-RESOLUTION.
           CONTINUE.
           
       J400-PERFORMANCE-MONITORING.
           DISPLAY "MONITORING RPA PERFORMANCE..."
           MOVE WS-PROCESS-COUNT TO WS-FORMATTED-COUNT
           DISPLAY "TRANSACTIONS PROCESSED: " WS-FORMATTED-COUNT.
           
       J500-CONTINUOUS-IMPROVEMENT.
           DISPLAY "IMPROVING RPA PROCESSES..."
           CONTINUE.
           
      *================================================================*
      *                    END OF PROGRAM                               *
      *================================================================*

      *================================================================*
      * PROCEDURE DIVISION - COMPLEX BUSINESS LOGIC                    *
      *================================================================*
       PROCEDURE DIVISION.
      *----------------------------------------------------------------*
       0000-MAIN-CONTROL.
           PERFORM 1000-INITIALIZATION
           PERFORM 2000-PROCESS-TRANSACTIONS
              UNTIL WS-EOF-FLAG = 'Y'
           PERFORM 9000-FINALIZATION
           STOP RUN.

      *----------------------------------------------------------------*
       1000-INITIALIZATION.
           INITIALIZE WS-WORK-AREAS
           INITIALIZE WS-COUNTERS
           INITIALIZE WS-TOTALS
           MOVE FUNCTION CURRENT-DATE TO WS-CURRENT-DATETIME
           MOVE WS-CURR-YEAR  TO RPT-YEAR
           MOVE WS-CURR-MONTH TO RPT-MONTH
           MOVE WS-CURR-DAY   TO RPT-DAY
           PERFORM 1100-OPEN-FILES
           PERFORM 1200-READ-PARAMETERS
           PERFORM 1300-INITIALIZE-TABLES
           PERFORM 1400-LOAD-REFERENCE-DATA.

       1100-OPEN-FILES.
           OPEN INPUT  CUSTOMER-FILE
           OPEN INPUT  ACCOUNT-FILE
           OPEN INPUT  TRANSACTION-FILE
           OPEN OUTPUT REPORT-FILE
           OPEN OUTPUT ERROR-FILE
           OPEN I-O    MASTER-FILE
           IF WS-FILE-STATUS NOT = '00'
              MOVE 'FILE OPEN ERROR' TO WS-ERROR-MSG
              PERFORM 9500-ABORT-PROCESS
           END-IF.

       1200-READ-PARAMETERS.
           ACCEPT WS-PARAM-DATE FROM DATE
           ACCEPT WS-PARAM-TIME FROM TIME
           MOVE 'BATCH-001' TO WS-JOB-ID
           MOVE 'PRODUCTION' TO WS-ENV-TYPE
           COMPUTE WS-PROCESS-DATE = 
              FUNCTION INTEGER-OF-DATE(WS-PARAM-DATE).

       1300-INITIALIZE-TABLES.
           PERFORM VARYING WS-TBL-IDX FROM 1 BY 1
              UNTIL WS-TBL-IDX > 100
              INITIALIZE RATE-TABLE-ENTRY(WS-TBL-IDX)
              MOVE ZEROES TO RT-RATE(WS-TBL-IDX)
              MOVE SPACES TO RT-CODE(WS-TBL-IDX)
           END-PERFORM
           PERFORM VARYING WS-TBL-IDX FROM 1 BY 1
              UNTIL WS-TBL-IDX > 50
              INITIALIZE BRANCH-TABLE-ENTRY(WS-TBL-IDX)
           END-PERFORM.

       1400-LOAD-REFERENCE-DATA.
           MOVE 1 TO WS-TBL-IDX
           PERFORM UNTIL WS-EOF-FLAG = 'Y' 
                      OR WS-TBL-IDX > 100
              READ REFERENCE-FILE INTO WS-REF-RECORD
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    MOVE WS-REF-CODE TO RT-CODE(WS-TBL-IDX)
                    MOVE WS-REF-RATE TO RT-RATE(WS-TBL-IDX)
                    ADD 1 TO WS-TBL-IDX
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

      *----------------------------------------------------------------*
       2000-PROCESS-TRANSACTIONS.
           READ TRANSACTION-FILE INTO WS-TRANSACTION-REC
              AT END
                 MOVE 'Y' TO WS-EOF-FLAG
              NOT AT END
                 ADD 1 TO WS-TRANS-COUNT
                 PERFORM 2100-VALIDATE-TRANSACTION
                 IF WS-VALID-FLAG = 'Y'
                    PERFORM 2200-PROCESS-BY-TYPE
                 ELSE
                    PERFORM 2900-HANDLE-ERROR
                 END-IF
           END-READ.

       2100-VALIDATE-TRANSACTION.
           MOVE 'Y' TO WS-VALID-FLAG
           IF TXN-ACCOUNT-ID = SPACES OR LOW-VALUES
              MOVE 'N' TO WS-VALID-FLAG
              MOVE 'INVALID ACCOUNT ID' TO WS-ERROR-MSG
              EXIT PARAGRAPH
           END-IF
           IF TXN-AMOUNT IS NOT NUMERIC
              MOVE 'N' TO WS-VALID-FLAG
              MOVE 'INVALID AMOUNT' TO WS-ERROR-MSG
              EXIT PARAGRAPH
           END-IF
           IF TXN-TYPE NOT = 'D' AND TXN-TYPE NOT = 'W'
              AND TXN-TYPE NOT = 'T' AND TXN-TYPE NOT = 'I'
              MOVE 'N' TO WS-VALID-FLAG
              MOVE 'INVALID TRANSACTION TYPE' TO WS-ERROR-MSG
           END-IF
           PERFORM 2150-VALIDATE-ACCOUNT-EXISTS
           PERFORM 2160-VALIDATE-BUSINESS-RULES.

       2150-VALIDATE-ACCOUNT-EXISTS.
           MOVE TXN-ACCOUNT-ID TO WS-SEARCH-KEY
           PERFORM 5000-SEARCH-ACCOUNT
           IF WS-FOUND-FLAG = 'N'
              MOVE 'N' TO WS-VALID-FLAG
              MOVE 'ACCOUNT NOT FOUND' TO WS-ERROR-MSG
           END-IF.

       2160-VALIDATE-BUSINESS-RULES.
           IF TXN-TYPE = 'W'
              IF TXN-AMOUNT > WS-ACCOUNT-BALANCE
                 MOVE 'N' TO WS-VALID-FLAG
                 MOVE 'INSUFFICIENT FUNDS' TO WS-ERROR-MSG
              END-IF
           END-IF
           IF TXN-AMOUNT > 1000000
              MOVE 'N' TO WS-VALID-FLAG
              MOVE 'AMOUNT EXCEEDS LIMIT' TO WS-ERROR-MSG
           END-IF.

       2200-PROCESS-BY-TYPE.
           EVALUATE TXN-TYPE
              WHEN 'D'
                 PERFORM 2300-PROCESS-DEPOSIT
              WHEN 'W'
                 PERFORM 2400-PROCESS-WITHDRAWAL
              WHEN 'T'
                 PERFORM 2500-PROCESS-TRANSFER
              WHEN 'I'
                 PERFORM 2600-PROCESS-INTEREST
              WHEN OTHER
                 PERFORM 2900-HANDLE-ERROR
           END-EVALUATE.

       2300-PROCESS-DEPOSIT.
           ADD TXN-AMOUNT TO WS-ACCOUNT-BALANCE
           MOVE 'DEPOSIT' TO WS-TXN-DESC
           ADD TXN-AMOUNT TO WS-TOTAL-DEPOSITS
           ADD 1 TO WS-DEPOSIT-COUNT
           PERFORM 2350-UPDATE-ACCOUNT
           PERFORM 2380-WRITE-AUDIT-TRAIL.

       2350-UPDATE-ACCOUNT.
           MOVE WS-ACCOUNT-BALANCE TO ACCT-BALANCE
           MOVE FUNCTION CURRENT-DATE TO ACCT-LAST-UPDATE
           REWRITE ACCOUNT-RECORD
           IF WS-FILE-STATUS NOT = '00'
              MOVE 'UPDATE FAILED' TO WS-ERROR-MSG
              PERFORM 2900-HANDLE-ERROR
           END-IF.

       2380-WRITE-AUDIT-TRAIL.
           INITIALIZE WS-AUDIT-RECORD
           MOVE TXN-ACCOUNT-ID TO AUDIT-ACCOUNT
           MOVE TXN-AMOUNT TO AUDIT-AMOUNT
           MOVE TXN-TYPE TO AUDIT-TYPE
           MOVE FUNCTION CURRENT-DATE TO AUDIT-TIMESTAMP
           MOVE WS-JOB-ID TO AUDIT-JOB-ID
           WRITE AUDIT-RECORD FROM WS-AUDIT-RECORD.

       2400-PROCESS-WITHDRAWAL.
           SUBTRACT TXN-AMOUNT FROM WS-ACCOUNT-BALANCE
           MOVE 'WITHDRAWAL' TO WS-TXN-DESC
           ADD TXN-AMOUNT TO WS-TOTAL-WITHDRAWALS
           ADD 1 TO WS-WITHDRAWAL-COUNT
           PERFORM 2350-UPDATE-ACCOUNT
           PERFORM 2380-WRITE-AUDIT-TRAIL
           IF WS-ACCOUNT-BALANCE < WS-MIN-BALANCE-LIMIT
              PERFORM 2450-GENERATE-LOW-BALANCE-ALERT
           END-IF.

       2450-GENERATE-LOW-BALANCE-ALERT.
           INITIALIZE WS-ALERT-RECORD
           MOVE 'LOW-BAL' TO ALERT-TYPE
           MOVE TXN-ACCOUNT-ID TO ALERT-ACCOUNT
           MOVE WS-ACCOUNT-BALANCE TO ALERT-BALANCE
           MOVE FUNCTION CURRENT-DATE TO ALERT-DATE
           WRITE ALERT-RECORD FROM WS-ALERT-RECORD
           ADD 1 TO WS-ALERT-COUNT.

       2500-PROCESS-TRANSFER.
           PERFORM 2510-VALIDATE-TARGET-ACCOUNT
           IF WS-VALID-FLAG = 'Y'
              PERFORM 2520-DEBIT-SOURCE
              PERFORM 2530-CREDIT-TARGET
              PERFORM 2540-RECORD-TRANSFER
           ELSE
              PERFORM 2900-HANDLE-ERROR
           END-IF.

       2510-VALIDATE-TARGET-ACCOUNT.
           MOVE TXN-TARGET-ACCOUNT TO WS-SEARCH-KEY
           PERFORM 5000-SEARCH-ACCOUNT
           IF WS-FOUND-FLAG = 'N'
              MOVE 'N' TO WS-VALID-FLAG
              MOVE 'TARGET ACCOUNT NOT FOUND' TO WS-ERROR-MSG
           END-IF.

       2520-DEBIT-SOURCE.
           SUBTRACT TXN-AMOUNT FROM WS-SOURCE-BALANCE
           MOVE WS-SOURCE-BALANCE TO ACCT-BALANCE
           REWRITE ACCOUNT-RECORD.

       2530-CREDIT-TARGET.
           ADD TXN-AMOUNT TO WS-TARGET-BALANCE
           MOVE TXN-TARGET-ACCOUNT TO ACCT-ID
           READ MASTER-FILE INTO WS-ACCOUNT-REC
           MOVE WS-TARGET-BALANCE TO ACCT-BALANCE
           REWRITE ACCOUNT-RECORD.

       2540-RECORD-TRANSFER.
           ADD TXN-AMOUNT TO WS-TOTAL-TRANSFERS
           ADD 1 TO WS-TRANSFER-COUNT
           PERFORM 2380-WRITE-AUDIT-TRAIL.

       2600-PROCESS-INTEREST.
           COMPUTE WS-INTEREST-AMOUNT = 
              WS-ACCOUNT-BALANCE * WS-INTEREST-RATE / 100
           ADD WS-INTEREST-AMOUNT TO WS-ACCOUNT-BALANCE
           MOVE 'INTEREST' TO WS-TXN-DESC
           ADD WS-INTEREST-AMOUNT TO WS-TOTAL-INTEREST
           ADD 1 TO WS-INTEREST-COUNT
           PERFORM 2350-UPDATE-ACCOUNT
           PERFORM 2380-WRITE-AUDIT-TRAIL.

       2900-HANDLE-ERROR.
           ADD 1 TO WS-ERROR-COUNT
           INITIALIZE WS-ERROR-RECORD
           MOVE TXN-ACCOUNT-ID TO ERR-ACCOUNT
           MOVE WS-ERROR-MSG TO ERR-MESSAGE
           MOVE FUNCTION CURRENT-DATE TO ERR-TIMESTAMP
           WRITE ERROR-RECORD FROM WS-ERROR-RECORD
           IF WS-ERROR-COUNT > WS-MAX-ERRORS
              MOVE 'MAX ERRORS EXCEEDED' TO WS-ABORT-REASON
              PERFORM 9500-ABORT-PROCESS
           END-IF.

      *----------------------------------------------------------------*
       3000-BATCH-PROCESSING.
           PERFORM 3100-LOAD-BATCH-HEADER
           PERFORM 3200-PROCESS-BATCH-ITEMS
              UNTIL WS-BATCH-EOF = 'Y'
           PERFORM 3300-VALIDATE-BATCH-TOTALS
           PERFORM 3400-COMMIT-BATCH.

       3100-LOAD-BATCH-HEADER.
           READ BATCH-FILE INTO WS-BATCH-HEADER
              AT END
                 MOVE 'Y' TO WS-BATCH-EOF
              NOT AT END
                 MOVE BATCH-ID TO WS-CURRENT-BATCH
                 MOVE BATCH-COUNT TO WS-EXPECTED-COUNT
                 MOVE BATCH-TOTAL TO WS-EXPECTED-TOTAL
           END-READ.

       3200-PROCESS-BATCH-ITEMS.
           READ BATCH-FILE INTO WS-BATCH-ITEM
              AT END
                 MOVE 'Y' TO WS-BATCH-EOF
              NOT AT END
                 ADD 1 TO WS-ACTUAL-COUNT
                 ADD ITEM-AMOUNT TO WS-ACTUAL-TOTAL
                 PERFORM 3250-PROCESS-SINGLE-ITEM
           END-READ.

       3250-PROCESS-SINGLE-ITEM.
           EVALUATE ITEM-TYPE
              WHEN 'PAY'
                 PERFORM 3260-PROCESS-PAYMENT
              WHEN 'REF'
                 PERFORM 3270-PROCESS-REFUND
              WHEN 'ADJ'
                 PERFORM 3280-PROCESS-ADJUSTMENT
           END-EVALUATE.

       3260-PROCESS-PAYMENT.
           MOVE ITEM-ACCOUNT TO WS-SEARCH-KEY
           PERFORM 5000-SEARCH-ACCOUNT
           IF WS-FOUND-FLAG = 'Y'
              SUBTRACT ITEM-AMOUNT FROM WS-ACCOUNT-BALANCE
              PERFORM 2350-UPDATE-ACCOUNT
              ADD 1 TO WS-PAYMENT-COUNT
           END-IF.

       3270-PROCESS-REFUND.
           MOVE ITEM-ACCOUNT TO WS-SEARCH-KEY
           PERFORM 5000-SEARCH-ACCOUNT
           IF WS-FOUND-FLAG = 'Y'
              ADD ITEM-AMOUNT TO WS-ACCOUNT-BALANCE
              PERFORM 2350-UPDATE-ACCOUNT
              ADD 1 TO WS-REFUND-COUNT
           END-IF.

       3280-PROCESS-ADJUSTMENT.
           MOVE ITEM-ACCOUNT TO WS-SEARCH-KEY
           PERFORM 5000-SEARCH-ACCOUNT
           IF WS-FOUND-FLAG = 'Y'
              IF ITEM-AMOUNT > 0
                 ADD ITEM-AMOUNT TO WS-ACCOUNT-BALANCE
              ELSE
                 SUBTRACT ITEM-AMOUNT FROM WS-ACCOUNT-BALANCE
              END-IF
              PERFORM 2350-UPDATE-ACCOUNT
              ADD 1 TO WS-ADJUSTMENT-COUNT
           END-IF.

       3300-VALIDATE-BATCH-TOTALS.
           IF WS-ACTUAL-COUNT NOT = WS-EXPECTED-COUNT
              MOVE 'BATCH COUNT MISMATCH' TO WS-ERROR-MSG
              PERFORM 3350-REJECT-BATCH
           END-IF
           IF WS-ACTUAL-TOTAL NOT = WS-EXPECTED-TOTAL
              MOVE 'BATCH TOTAL MISMATCH' TO WS-ERROR-MSG
              PERFORM 3350-REJECT-BATCH
           END-IF.

       3350-REJECT-BATCH.
           INITIALIZE WS-REJECTION-RECORD
           MOVE WS-CURRENT-BATCH TO REJ-BATCH-ID
           MOVE WS-ERROR-MSG TO REJ-REASON
           MOVE FUNCTION CURRENT-DATE TO REJ-DATE
           WRITE REJECTION-RECORD FROM WS-REJECTION-RECORD
           ADD 1 TO WS-REJECTED-BATCH-COUNT.

       3400-COMMIT-BATCH.
           IF WS-BATCH-VALID = 'Y'
              ADD 1 TO WS-COMMITTED-BATCH-COUNT
              PERFORM 3450-UPDATE-BATCH-STATUS
           END-IF.

       3450-UPDATE-BATCH-STATUS.
           MOVE 'COMMITTED' TO BATCH-STATUS
           MOVE FUNCTION CURRENT-DATE TO BATCH-COMMIT-DATE
           REWRITE BATCH-HEADER-RECORD.

      *----------------------------------------------------------------*
       4000-REPORTING.
           PERFORM 4100-GENERATE-DAILY-REPORT
           PERFORM 4200-GENERATE-EXCEPTION-REPORT
           PERFORM 4300-GENERATE-SUMMARY-REPORT
           PERFORM 4400-GENERATE-AUDIT-REPORT.

       4100-GENERATE-DAILY-REPORT.
           MOVE 'DAILY TRANSACTION REPORT' TO RPT-TITLE
           MOVE FUNCTION CURRENT-DATE TO RPT-DATE
           WRITE REPORT-RECORD FROM WS-REPORT-HEADER
           PERFORM 4150-WRITE-DAILY-DETAILS.

       4150-WRITE-DAILY-DETAILS.
           MOVE WS-TRANS-COUNT TO RPT-TRANS-COUNT
           MOVE WS-TOTAL-DEPOSITS TO RPT-DEPOSITS
           MOVE WS-TOTAL-WITHDRAWALS TO RPT-WITHDRAWALS
           MOVE WS-TOTAL-TRANSFERS TO RPT-TRANSFERS
           COMPUTE RPT-NET-AMOUNT = 
              WS-TOTAL-DEPOSITS - WS-TOTAL-WITHDRAWALS
           WRITE REPORT-RECORD FROM WS-REPORT-DETAIL.

       4200-GENERATE-EXCEPTION-REPORT.
           MOVE 'EXCEPTION REPORT' TO RPT-TITLE
           WRITE REPORT-RECORD FROM WS-REPORT-HEADER
           PERFORM 4250-LIST-EXCEPTIONS.

       4250-LIST-EXCEPTIONS.
           MOVE 1 TO WS-EXCEPTION-IDX
           PERFORM UNTIL WS-EXCEPTION-IDX > WS-ERROR-COUNT
              MOVE EXCEPTION-ENTRY(WS-EXCEPTION-IDX) 
                 TO RPT-EXCEPTION-LINE
              WRITE REPORT-RECORD FROM WS-REPORT-DETAIL
              ADD 1 TO WS-EXCEPTION-IDX
           END-PERFORM.

       4300-GENERATE-SUMMARY-REPORT.
           MOVE 'PROCESSING SUMMARY' TO RPT-TITLE
           WRITE REPORT-RECORD FROM WS-REPORT-HEADER
           MOVE WS-DEPOSIT-COUNT TO RPT-DEPOSIT-CNT
           MOVE WS-WITHDRAWAL-COUNT TO RPT-WITHDRAWAL-CNT
           MOVE WS-TRANSFER-COUNT TO RPT-TRANSFER-CNT
           MOVE WS-INTEREST-COUNT TO RPT-INTEREST-CNT
           MOVE WS-ERROR-COUNT TO RPT-ERROR-CNT
           WRITE REPORT-RECORD FROM WS-SUMMARY-DETAIL.

       4400-GENERATE-AUDIT-REPORT.
           MOVE 'AUDIT TRAIL REPORT' TO RPT-TITLE
           WRITE REPORT-RECORD FROM WS-REPORT-HEADER
           PERFORM 4450-WRITE-AUDIT-ENTRIES.

       4450-WRITE-AUDIT-ENTRIES.
           MOVE 1 TO WS-AUDIT-IDX
           PERFORM UNTIL WS-AUDIT-IDX > WS-AUDIT-COUNT
              MOVE AUDIT-ENTRY(WS-AUDIT-IDX) TO RPT-AUDIT-LINE
              WRITE REPORT-RECORD FROM WS-AUDIT-DETAIL
              ADD 1 TO WS-AUDIT-IDX
           END-PERFORM.

      *----------------------------------------------------------------*
       5000-SEARCH-ACCOUNT.
           MOVE 'N' TO WS-FOUND-FLAG
           MOVE WS-SEARCH-KEY TO ACCT-ID
           READ MASTER-FILE INTO WS-ACCOUNT-REC
              KEY IS ACCT-ID
              INVALID KEY
                 MOVE 'N' TO WS-FOUND-FLAG
              NOT INVALID KEY
                 MOVE 'Y' TO WS-FOUND-FLAG
                 MOVE ACCT-BALANCE TO WS-ACCOUNT-BALANCE
                 MOVE ACCT-TYPE TO WS-ACCOUNT-TYPE
                 MOVE ACCT-STATUS TO WS-ACCOUNT-STATUS
           END-READ.

       5100-BINARY-SEARCH.
           SET WS-LOW TO 1
           SET WS-HIGH TO WS-TABLE-SIZE
           MOVE 'N' TO WS-FOUND-FLAG
           PERFORM UNTIL WS-LOW > WS-HIGH
              COMPUTE WS-MID = (WS-LOW + WS-HIGH) / 2
              IF TBL-KEY(WS-MID) = WS-SEARCH-KEY
                 MOVE 'Y' TO WS-FOUND-FLAG
                 MOVE WS-MID TO WS-FOUND-INDEX
                 EXIT PERFORM
              ELSE IF TBL-KEY(WS-MID) < WS-SEARCH-KEY
                 ADD 1 TO WS-MID GIVING WS-LOW
              ELSE
                 SUBTRACT 1 FROM WS-MID GIVING WS-HIGH
              END-IF
              END-IF
           END-PERFORM.

       5200-HASH-LOOKUP.
           COMPUTE WS-HASH-VALUE = 
              FUNCTION MOD(FUNCTION ORD(WS-SEARCH-KEY(1:1)) 
                 * 31 + FUNCTION ORD(WS-SEARCH-KEY(2:1)), 
                 WS-HASH-TABLE-SIZE)
           ADD 1 TO WS-HASH-VALUE
           IF HASH-KEY(WS-HASH-VALUE) = WS-SEARCH-KEY
              MOVE 'Y' TO WS-FOUND-FLAG
              MOVE HASH-VALUE(WS-HASH-VALUE) TO WS-LOOKUP-RESULT
           ELSE
              PERFORM 5250-PROBE-HASH-TABLE
           END-IF.

       5250-PROBE-HASH-TABLE.
           MOVE WS-HASH-VALUE TO WS-PROBE-START
           ADD 1 TO WS-HASH-VALUE
           PERFORM UNTIL WS-HASH-VALUE = WS-PROBE-START
              IF WS-HASH-VALUE > WS-HASH-TABLE-SIZE
                 MOVE 1 TO WS-HASH-VALUE
              END-IF
              IF HASH-KEY(WS-HASH-VALUE) = WS-SEARCH-KEY
                 MOVE 'Y' TO WS-FOUND-FLAG
                 MOVE HASH-VALUE(WS-HASH-VALUE) 
                    TO WS-LOOKUP-RESULT
                 EXIT PERFORM
              END-IF
              IF HASH-KEY(WS-HASH-VALUE) = SPACES
                 EXIT PERFORM
              END-IF
              ADD 1 TO WS-HASH-VALUE
           END-PERFORM.

      *----------------------------------------------------------------*
       6000-CURRENCY-CONVERSION.
           PERFORM 6100-GET-EXCHANGE-RATE
           PERFORM 6200-APPLY-CONVERSION
           PERFORM 6300-ROUND-RESULT.

       6100-GET-EXCHANGE-RATE.
           MOVE WS-SOURCE-CURRENCY TO WS-SEARCH-KEY
           PERFORM 5100-BINARY-SEARCH
           IF WS-FOUND-FLAG = 'Y'
              MOVE RATE-VALUE(WS-FOUND-INDEX) 
                 TO WS-SOURCE-RATE
           ELSE
              MOVE 1.0 TO WS-SOURCE-RATE
           END-IF
           MOVE WS-TARGET-CURRENCY TO WS-SEARCH-KEY
           PERFORM 5100-BINARY-SEARCH
           IF WS-FOUND-FLAG = 'Y'
              MOVE RATE-VALUE(WS-FOUND-INDEX) 
                 TO WS-TARGET-RATE
           ELSE
              MOVE 1.0 TO WS-TARGET-RATE
           END-IF.

       6200-APPLY-CONVERSION.
           IF WS-SOURCE-RATE NOT = ZEROES
              COMPUTE WS-USD-AMOUNT = 
                 WS-ORIGINAL-AMOUNT / WS-SOURCE-RATE
              COMPUTE WS-CONVERTED-AMOUNT = 
                 WS-USD-AMOUNT * WS-TARGET-RATE
           ELSE
              MOVE WS-ORIGINAL-AMOUNT TO WS-CONVERTED-AMOUNT
           END-IF.

       6300-ROUND-RESULT.
           COMPUTE WS-CONVERTED-AMOUNT ROUNDED = 
              WS-CONVERTED-AMOUNT.

      *----------------------------------------------------------------*
       7000-INTEREST-CALCULATION.
           PERFORM 7100-DETERMINE-RATE-TIER
           PERFORM 7200-CALCULATE-SIMPLE-INTEREST
           PERFORM 7300-CALCULATE-COMPOUND-INTEREST
           PERFORM 7400-APPLY-INTEREST.

       7100-DETERMINE-RATE-TIER.
           EVALUATE TRUE
              WHEN WS-ACCOUNT-BALANCE < 1000
                 MOVE 0.5 TO WS-INTEREST-RATE
              WHEN WS-ACCOUNT-BALANCE < 10000
                 MOVE 1.0 TO WS-INTEREST-RATE
              WHEN WS-ACCOUNT-BALANCE < 50000
                 MOVE 1.5 TO WS-INTEREST-RATE
              WHEN WS-ACCOUNT-BALANCE < 100000
                 MOVE 2.0 TO WS-INTEREST-RATE
              WHEN OTHER
                 MOVE 2.5 TO WS-INTEREST-RATE
           END-EVALUATE.

       7200-CALCULATE-SIMPLE-INTEREST.
           COMPUTE WS-SIMPLE-INTEREST = 
              WS-ACCOUNT-BALANCE * WS-INTEREST-RATE 
              * WS-DAYS-IN-PERIOD / 36500.

       7300-CALCULATE-COMPOUND-INTEREST.
           COMPUTE WS-COMPOUND-FACTOR = 
              (1 + WS-INTEREST-RATE / 36500) 
              ** WS-DAYS-IN-PERIOD
           COMPUTE WS-COMPOUND-INTEREST = 
              WS-ACCOUNT-BALANCE * (WS-COMPOUND-FACTOR - 1).

       7400-APPLY-INTEREST.
           IF WS-INTEREST-METHOD = 'S'
              ADD WS-SIMPLE-INTEREST TO WS-ACCOUNT-BALANCE
           ELSE
              ADD WS-COMPOUND-INTEREST TO WS-ACCOUNT-BALANCE
           END-IF
           PERFORM 2350-UPDATE-ACCOUNT.

      *----------------------------------------------------------------*
       8000-FEE-PROCESSING.
           PERFORM 8100-CALCULATE-MONTHLY-FEE
           PERFORM 8200-CALCULATE-TRANSACTION-FEES
           PERFORM 8300-APPLY-FEE-WAIVERS
           PERFORM 8400-DEDUCT-FEES.

       8100-CALCULATE-MONTHLY-FEE.
           EVALUATE WS-ACCOUNT-TYPE
              WHEN 'CHK'
                 MOVE 12.00 TO WS-MONTHLY-FEE
              WHEN 'SAV'
                 MOVE 5.00 TO WS-MONTHLY-FEE
              WHEN 'PRM'
                 MOVE 25.00 TO WS-MONTHLY-FEE
              WHEN OTHER
                 MOVE 0.00 TO WS-MONTHLY-FEE
           END-EVALUATE.

       8200-CALCULATE-TRANSACTION-FEES.
           IF WS-TRANS-COUNT > WS-FREE-TRANS-LIMIT
              COMPUTE WS-EXCESS-TRANS = 
                 WS-TRANS-COUNT - WS-FREE-TRANS-LIMIT
              COMPUTE WS-TRANS-FEE = 
                 WS-EXCESS-TRANS * WS-PER-TRANS-FEE
           ELSE
              MOVE ZEROES TO WS-TRANS-FEE
           END-IF.

       8300-APPLY-FEE-WAIVERS.
           IF WS-ACCOUNT-BALANCE >= WS-MIN-BALANCE-WAIVER
              MOVE ZEROES TO WS-MONTHLY-FEE
           END-IF
           IF WS-CUSTOMER-TIER = 'GOLD' OR 'PLATINUM'
              COMPUTE WS-TRANS-FEE = WS-TRANS-FEE * 0.5
           END-IF.

       8400-DEDUCT-FEES.
           COMPUTE WS-TOTAL-FEES = 
              WS-MONTHLY-FEE + WS-TRANS-FEE
           SUBTRACT WS-TOTAL-FEES FROM WS-ACCOUNT-BALANCE
           PERFORM 2350-UPDATE-ACCOUNT
           PERFORM 8450-RECORD-FEE-TRANSACTION.

       8450-RECORD-FEE-TRANSACTION.
           INITIALIZE WS-FEE-RECORD
           MOVE TXN-ACCOUNT-ID TO FEE-ACCOUNT
           MOVE WS-TOTAL-FEES TO FEE-AMOUNT
           MOVE 'MONTHLY FEE' TO FEE-DESCRIPTION
           MOVE FUNCTION CURRENT-DATE TO FEE-DATE
           WRITE FEE-RECORD FROM WS-FEE-RECORD.

      *----------------------------------------------------------------*
       9000-FINALIZATION.
           PERFORM 9100-WRITE-CONTROL-TOTALS
           PERFORM 9200-CLOSE-FILES
           PERFORM 9300-DISPLAY-SUMMARY.

       9100-WRITE-CONTROL-TOTALS.
           INITIALIZE WS-CONTROL-RECORD
           MOVE WS-TRANS-COUNT TO CTL-TRANS-COUNT
           MOVE WS-TOTAL-DEPOSITS TO CTL-DEPOSITS
           MOVE WS-TOTAL-WITHDRAWALS TO CTL-WITHDRAWALS
           MOVE WS-ERROR-COUNT TO CTL-ERROR-COUNT
           MOVE FUNCTION CURRENT-DATE TO CTL-RUN-DATE
           WRITE CONTROL-RECORD FROM WS-CONTROL-RECORD.

       9200-CLOSE-FILES.
           CLOSE CUSTOMER-FILE
           CLOSE ACCOUNT-FILE
           CLOSE TRANSACTION-FILE
           CLOSE REPORT-FILE
           CLOSE ERROR-FILE
           CLOSE MASTER-FILE.

       9300-DISPLAY-SUMMARY.
           DISPLAY '=========================================='
           DISPLAY 'MEGA-ENTERPRISE PROCESSING COMPLETE'
           DISPLAY '=========================================='
           DISPLAY 'TRANSACTIONS PROCESSED: ' WS-TRANS-COUNT
           DISPLAY 'DEPOSITS:              ' WS-DEPOSIT-COUNT
           DISPLAY 'WITHDRAWALS:           ' WS-WITHDRAWAL-COUNT
           DISPLAY 'TRANSFERS:             ' WS-TRANSFER-COUNT
           DISPLAY 'ERRORS:                ' WS-ERROR-COUNT
           DISPLAY 'TOTAL DEPOSITS:   $' WS-TOTAL-DEPOSITS
           DISPLAY 'TOTAL WITHDRAWALS:$' WS-TOTAL-WITHDRAWALS
           DISPLAY 'NET CHANGE:       $' WS-NET-CHANGE
           DISPLAY '=========================================='.

       9500-ABORT-PROCESS.
           DISPLAY 'CRITICAL ERROR: ' WS-ABORT-REASON
           DISPLAY 'PROCESSING ABORTED AT ' 
              FUNCTION CURRENT-DATE
           PERFORM 9200-CLOSE-FILES
           STOP RUN WITH STATUS 8.

      *================================================================*
      * END OF MEGA-ENTERPRISE COBOL PROGRAM                          *
      *================================================================*

      *================================================================*
      * EXTENDED DATA DIVISION - ADDITIONAL STRUCTURES                 *
      *================================================================*
       01  WS-LOAN-PROCESSING-AREA.
           05  WS-LOAN-ID              PIC X(15).
           05  WS-LOAN-TYPE            PIC X(03).
              88 LOAN-MORTGAGE         VALUE 'MTG'.
              88 LOAN-AUTO             VALUE 'AUT'.
              88 LOAN-PERSONAL         VALUE 'PER'.
              88 LOAN-BUSINESS         VALUE 'BUS'.
              88 LOAN-STUDENT          VALUE 'STU'.
           05  WS-LOAN-AMOUNT          PIC 9(11)V99.
           05  WS-LOAN-TERM-MONTHS     PIC 9(03).
           05  WS-LOAN-INTEREST-RATE   PIC 9(02)V9999.
           05  WS-LOAN-MONTHLY-PMT     PIC 9(09)V99.
           05  WS-LOAN-PRINCIPAL-BAL   PIC 9(11)V99.
           05  WS-LOAN-INTEREST-PAID   PIC 9(09)V99.
           05  WS-LOAN-START-DATE      PIC 9(08).
           05  WS-LOAN-END-DATE        PIC 9(08).
           05  WS-LOAN-STATUS          PIC X(01).
              88 LOAN-ACTIVE           VALUE 'A'.
              88 LOAN-PAID             VALUE 'P'.
              88 LOAN-DEFAULT          VALUE 'D'.
              88 LOAN-DEFERRED         VALUE 'F'.

       01  WS-MORTGAGE-DETAILS.
           05  WS-PROPERTY-VALUE       PIC 9(11)V99.
           05  WS-DOWN-PAYMENT         PIC 9(09)V99.
           05  WS-LTV-RATIO            PIC 9(03)V99.
           05  WS-PMI-REQUIRED         PIC X(01).
           05  WS-PMI-AMOUNT           PIC 9(05)V99.
           05  WS-ESCROW-AMOUNT        PIC 9(07)V99.
           05  WS-PROPERTY-TAX         PIC 9(07)V99.
           05  WS-INSURANCE-PREMIUM    PIC 9(05)V99.
           05  WS-HOA-FEES             PIC 9(05)V99.

       01  WS-AMORTIZATION-TABLE.
           05  WS-AMORT-ENTRY OCCURS 360 TIMES
               INDEXED BY WS-AMORT-IDX.
               10 AMORT-PAYMENT-NUM    PIC 9(03).
               10 AMORT-PAYMENT-DATE   PIC 9(08).
               10 AMORT-PAYMENT-AMT    PIC 9(07)V99.
               10 AMORT-PRINCIPAL      PIC 9(07)V99.
               10 AMORT-INTEREST       PIC 9(07)V99.
               10 AMORT-BALANCE        PIC 9(11)V99.
               10 AMORT-ESCROW         PIC 9(05)V99.
               10 AMORT-TOTAL-PMT      PIC 9(07)V99.

       01  WS-CREDIT-SCORING-AREA.
           05  WS-CREDIT-SCORE         PIC 9(03).
           05  WS-CREDIT-TIER          PIC X(01).
              88 TIER-EXCELLENT        VALUE 'A'.
              88 TIER-GOOD             VALUE 'B'.
              88 TIER-FAIR             VALUE 'C'.
              88 TIER-POOR             VALUE 'D'.
              88 TIER-BAD              VALUE 'F'.
           05  WS-PAYMENT-HISTORY.
               10 WS-ON-TIME-PAYMENTS  PIC 9(03).
               10 WS-LATE-30-DAYS      PIC 9(03).
               10 WS-LATE-60-DAYS      PIC 9(03).
               10 WS-LATE-90-DAYS      PIC 9(03).
           05  WS-CREDIT-UTILIZATION   PIC 9(03)V99.
           05  WS-CREDIT-HISTORY-LEN   PIC 9(03).
           05  WS-NEW-CREDIT-INQS      PIC 9(02).
           05  WS-CREDIT-MIX-SCORE     PIC 9(02).
           05  WS-DTI-RATIO            PIC 9(03)V99.

       01  WS-RISK-ASSESSMENT-AREA.
           05  WS-RISK-SCORE           PIC 9(04)V99.
           05  WS-RISK-CATEGORY        PIC X(10).
           05  WS-RISK-FACTORS.
               10 WS-FACTOR-1          PIC X(50).
               10 WS-FACTOR-2          PIC X(50).
               10 WS-FACTOR-3          PIC X(50).
               10 WS-FACTOR-4          PIC X(50).
               10 WS-FACTOR-5          PIC X(50).
           05  WS-APPROVAL-STATUS      PIC X(01).
           05  WS-APPROVED-AMOUNT      PIC 9(11)V99.
           05  WS-APPROVED-RATE        PIC 9(02)V9999.
           05  WS-CONDITIONS           PIC X(200).

       01  WS-INVESTMENT-PORTFOLIO.
           05  WS-PORTFOLIO-ID         PIC X(12).
           05  WS-PORTFOLIO-TYPE       PIC X(03).
           05  WS-TOTAL-VALUE          PIC 9(13)V99.
           05  WS-COST-BASIS           PIC 9(13)V99.
           05  WS-UNREALIZED-GAIN      PIC S9(11)V99.
           05  WS-REALIZED-GAIN-YTD    PIC S9(11)V99.
           05  WS-DIVIDEND-INCOME      PIC 9(09)V99.
           05  WS-ASSET-ALLOCATION.
               10 WS-STOCKS-PCT        PIC 9(03)V99.
               10 WS-BONDS-PCT         PIC 9(03)V99.
               10 WS-CASH-PCT          PIC 9(03)V99.
               10 WS-REAL-ESTATE-PCT   PIC 9(03)V99.
               10 WS-OTHER-PCT         PIC 9(03)V99.

       01  WS-HOLDINGS-TABLE.
           05  WS-HOLDING OCCURS 100 TIMES
               INDEXED BY WS-HOLD-IDX.
               10 HOLD-SYMBOL          PIC X(10).
               10 HOLD-NAME            PIC X(50).
               10 HOLD-TYPE            PIC X(03).
               10 HOLD-SHARES          PIC 9(09)V9999.
               10 HOLD-COST-PER-SHARE  PIC 9(07)V9999.
               10 HOLD-CURRENT-PRICE   PIC 9(07)V9999.
               10 HOLD-MARKET-VALUE    PIC 9(11)V99.
               10 HOLD-GAIN-LOSS       PIC S9(09)V99.
               10 HOLD-PCT-CHANGE      PIC S9(03)V99.
               10 HOLD-DIV-YIELD       PIC 9(02)V99.
               10 HOLD-PURCHASE-DATE   PIC 9(08).

       01  WS-TRADE-EXECUTION-AREA.
           05  WS-TRADE-ID             PIC X(20).
           05  WS-TRADE-TYPE           PIC X(04).
              88 TRADE-BUY             VALUE 'BUY '.
              88 TRADE-SELL            VALUE 'SELL'.
              88 TRADE-SHORT           VALUE 'SHRT'.
              88 TRADE-COVER           VALUE 'COVR'.
           05  WS-ORDER-TYPE           PIC X(06).
              88 ORDER-MARKET          VALUE 'MARKET'.
              88 ORDER-LIMIT           VALUE 'LIMIT '.
              88 ORDER-STOP            VALUE 'STOP  '.
              88 ORDER-STOP-LIMIT      VALUE 'STPLMT'.
           05  WS-TRADE-SYMBOL         PIC X(10).
           05  WS-TRADE-SHARES         PIC 9(09).
           05  WS-LIMIT-PRICE          PIC 9(07)V9999.
           05  WS-STOP-PRICE           PIC 9(07)V9999.
           05  WS-EXECUTED-PRICE       PIC 9(07)V9999.
           05  WS-COMMISSION           PIC 9(05)V99.
           05  WS-FEES                 PIC 9(05)V99.
           05  WS-NET-AMOUNT           PIC 9(11)V99.
           05  WS-TRADE-STATUS         PIC X(10).
           05  WS-EXECUTION-TIME       PIC 9(14).

       01  WS-INSURANCE-POLICY-AREA.
           05  WS-POLICY-NUMBER        PIC X(20).
           05  WS-POLICY-TYPE          PIC X(03).
              88 POLICY-LIFE           VALUE 'LIF'.
              88 POLICY-AUTO           VALUE 'AUT'.
              88 POLICY-HOME           VALUE 'HOM'.
              88 POLICY-HEALTH         VALUE 'HLT'.
              88 POLICY-UMBRELLA       VALUE 'UMB'.
           05  WS-POLICY-STATUS        PIC X(01).
           05  WS-COVERAGE-AMOUNT      PIC 9(11)V99.
           05  WS-DEDUCTIBLE           PIC 9(07)V99.
           05  WS-ANNUAL-PREMIUM       PIC 9(07)V99.
           05  WS-MONTHLY-PREMIUM      PIC 9(05)V99.
           05  WS-EFFECTIVE-DATE       PIC 9(08).
           05  WS-EXPIRATION-DATE      PIC 9(08).
           05  WS-BENEFICIARIES.
               10 WS-BENEFICIARY OCCURS 5 TIMES.
                   15 BENEF-NAME       PIC X(50).
                   15 BENEF-RELATION   PIC X(20).
                   15 BENEF-PCT        PIC 9(03)V99.

       01  WS-CLAIMS-PROCESSING.
           05  WS-CLAIM-NUMBER         PIC X(15).
           05  WS-CLAIM-DATE           PIC 9(08).
           05  WS-CLAIM-TYPE           PIC X(20).
           05  WS-CLAIM-AMOUNT         PIC 9(09)V99.
           05  WS-APPROVED-AMOUNT      PIC 9(09)V99.
           05  WS-DENIED-AMOUNT        PIC 9(09)V99.
           05  WS-CLAIM-STATUS         PIC X(10).
           05  WS-ADJUSTER-ID          PIC X(10).
           05  WS-NOTES                PIC X(500).

       01  WS-PAYROLL-PROCESSING.
           05  WS-EMPLOYEE-ID          PIC X(10).
           05  WS-PAY-PERIOD           PIC 9(06).
           05  WS-GROSS-PAY            PIC 9(09)V99.
           05  WS-DEDUCTIONS.
               10 WS-FEDERAL-TAX       PIC 9(07)V99.
               10 WS-STATE-TAX         PIC 9(07)V99.
               10 WS-LOCAL-TAX         PIC 9(05)V99.
               10 WS-FICA-SS           PIC 9(07)V99.
               10 WS-FICA-MEDICARE     PIC 9(05)V99.
               10 WS-HEALTH-INS        PIC 9(05)V99.
               10 WS-DENTAL-INS        PIC 9(04)V99.
               10 WS-VISION-INS        PIC 9(04)V99.
               10 WS-401K-CONTRIB      PIC 9(07)V99.
               10 WS-HSA-CONTRIB       PIC 9(05)V99.
               10 WS-FSA-CONTRIB       PIC 9(05)V99.
               10 WS-LIFE-INS          PIC 9(04)V99.
               10 WS-DISABILITY-INS    PIC 9(04)V99.
               10 WS-UNION-DUES        PIC 9(04)V99.
               10 WS-GARNISHMENT       PIC 9(07)V99.
               10 WS-OTHER-DEDUCT      PIC 9(05)V99.
           05  WS-TOTAL-DEDUCTIONS     PIC 9(09)V99.
           05  WS-NET-PAY              PIC 9(09)V99.
           05  WS-YTD-GROSS            PIC 9(11)V99.
           05  WS-YTD-FED-TAX          PIC 9(09)V99.
           05  WS-YTD-STATE-TAX        PIC 9(09)V99.
           05  WS-YTD-FICA             PIC 9(09)V99.
           05  WS-YTD-NET              PIC 9(11)V99.

       01  WS-TAX-CALCULATION-AREA.
           05  WS-FILING-STATUS        PIC X(01).
              88 STATUS-SINGLE         VALUE 'S'.
              88 STATUS-MARRIED-JOINT  VALUE 'M'.
              88 STATUS-MARRIED-SEP    VALUE 'P'.
              88 STATUS-HEAD-HOUSE     VALUE 'H'.
           05  WS-EXEMPTIONS           PIC 9(02).
           05  WS-TAXABLE-INCOME       PIC 9(11)V99.
           05  WS-TAX-BRACKET          PIC 9(02).
           05  WS-MARGINAL-RATE        PIC 9(02)V99.
           05  WS-EFFECTIVE-RATE       PIC 9(02)V99.
           05  WS-TAX-LIABILITY        PIC 9(09)V99.
           05  WS-TAX-CREDITS          PIC 9(07)V99.
           05  WS-TAX-DUE              PIC 9(09)V99.

       01  WS-FEDERAL-TAX-BRACKETS.
           05  WS-TAX-BRACKET-ENTRY OCCURS 7 TIMES.
               10 BRACKET-MIN          PIC 9(11)V99.
               10 BRACKET-MAX          PIC 9(11)V99.
               10 BRACKET-RATE         PIC 9(02)V99.
               10 BRACKET-BASE-TAX     PIC 9(09)V99.

       01  WS-COMPLIANCE-AREA.
           05  WS-REG-CODE             PIC X(10).
           05  WS-COMPLIANCE-STATUS    PIC X(01).
           05  WS-LAST-AUDIT-DATE      PIC 9(08).
           05  WS-NEXT-AUDIT-DATE      PIC 9(08).
           05  WS-VIOLATIONS.
               10 WS-VIOLATION OCCURS 20 TIMES.
                   15 VIOL-CODE        PIC X(10).
                   15 VIOL-DATE        PIC 9(08).
                   15 VIOL-DESC        PIC X(100).
                   15 VIOL-SEVERITY    PIC X(01).
                   15 VIOL-FINE        PIC 9(09)V99.
                   15 VIOL-STATUS      PIC X(10).

       01  WS-AML-SCREENING-AREA.
           05  WS-SCREENING-ID         PIC X(20).
           05  WS-SCREENING-TYPE       PIC X(10).
           05  WS-SCREENING-DATE       PIC 9(08).
           05  WS-MATCH-SCORE          PIC 9(03).
           05  WS-MATCH-TYPE           PIC X(20).
           05  WS-WATCHLIST-HITS       PIC 9(03).
           05  WS-PEP-STATUS           PIC X(01).
           05  WS-SANCTIONS-HIT        PIC X(01).
           05  WS-SAR-REQUIRED         PIC X(01).
           05  WS-CASE-STATUS          PIC X(10).

       01  WS-FRAUD-DETECTION-AREA.
           05  WS-FRAUD-SCORE          PIC 9(03).
           05  WS-FRAUD-INDICATORS.
               10 WS-VELOCITY-FLAG     PIC X(01).
               10 WS-LOCATION-FLAG     PIC X(01).
               10 WS-AMOUNT-FLAG       PIC X(01).
               10 WS-PATTERN-FLAG      PIC X(01).
               10 WS-DEVICE-FLAG       PIC X(01).
           05  WS-FRAUD-RULES-FIRED.
               10 WS-RULE OCCURS 50 TIMES.
                   15 RULE-ID          PIC X(10).
                   15 RULE-SCORE       PIC 9(03).
                   15 RULE-DESC        PIC X(50).
           05  WS-FRAUD-DECISION       PIC X(10).
           05  WS-MANUAL-REVIEW        PIC X(01).

       01  WS-CUSTOMER-SERVICE-AREA.
           05  WS-CASE-ID              PIC X(15).
           05  WS-CASE-TYPE            PIC X(20).
           05  WS-CASE-PRIORITY        PIC 9(01).
           05  WS-CASE-STATUS          PIC X(10).
           05  WS-ASSIGNED-AGENT       PIC X(10).
           05  WS-OPEN-DATE            PIC 9(08).
           05  WS-TARGET-DATE          PIC 9(08).
           05  WS-CLOSE-DATE           PIC 9(08).
           05  WS-RESOLUTION-CODE      PIC X(10).
           05  WS-SATISFACTION-SCORE   PIC 9(02).
           05  WS-INTERACTIONS.
               10 WS-INTERACTION OCCURS 20 TIMES.
                   15 INT-DATE         PIC 9(08).
                   15 INT-TIME         PIC 9(06).
                   15 INT-CHANNEL      PIC X(10).
                   15 INT-AGENT        PIC X(10).
                   15 INT-NOTES        PIC X(200).

       01  WS-DOCUMENT-MANAGEMENT.
           05  WS-DOC-ID               PIC X(20).
           05  WS-DOC-TYPE             PIC X(20).
           05  WS-DOC-STATUS           PIC X(10).
           05  WS-DOC-VERSION          PIC 9(03).
           05  WS-DOC-CREATED-BY       PIC X(10).
           05  WS-DOC-CREATED-DATE     PIC 9(08).
           05  WS-DOC-MODIFIED-BY      PIC X(10).
           05  WS-DOC-MODIFIED-DATE    PIC 9(08).
           05  WS-DOC-SIZE-KB          PIC 9(09).
           05  WS-DOC-CHECKSUM         PIC X(64).
           05  WS-DOC-RETENTION-DATE   PIC 9(08).
           05  WS-DOC-CLASSIFICATION   PIC X(20).

       01  WS-WORKFLOW-AREA.
           05  WS-WORKFLOW-ID          PIC X(15).
           05  WS-WORKFLOW-TYPE        PIC X(20).
           05  WS-WORKFLOW-STATUS      PIC X(10).
           05  WS-CURRENT-STEP         PIC 9(03).
           05  WS-TOTAL-STEPS          PIC 9(03).
           05  WS-WORKFLOW-STEPS.
               10 WS-STEP OCCURS 20 TIMES.
                   15 STEP-NUMBER      PIC 9(03).
                   15 STEP-NAME        PIC X(30).
                   15 STEP-STATUS      PIC X(10).
                   15 STEP-ASSIGNEE    PIC X(10).
                   15 STEP-START-DATE  PIC 9(08).
                   15 STEP-END-DATE    PIC 9(08).
                   15 STEP-DURATION    PIC 9(05).
                   15 STEP-OUTCOME     PIC X(20).

       01  WS-NOTIFICATION-AREA.
           05  WS-NOTIF-ID             PIC X(20).
           05  WS-NOTIF-TYPE           PIC X(10).
           05  WS-NOTIF-CHANNEL        PIC X(10).
           05  WS-NOTIF-RECIPIENT      PIC X(100).
           05  WS-NOTIF-SUBJECT        PIC X(100).
           05  WS-NOTIF-BODY           PIC X(1000).
           05  WS-NOTIF-STATUS         PIC X(10).
           05  WS-NOTIF-SENT-DATE      PIC 9(08).
           05  WS-NOTIF-SENT-TIME      PIC 9(06).
           05  WS-NOTIF-RETRY-COUNT    PIC 9(02).

       01  WS-BATCH-CONTROL-AREA.
           05  WS-BATCH-ID             PIC X(20).
           05  WS-BATCH-TYPE           PIC X(20).
           05  WS-BATCH-STATUS         PIC X(10).
           05  WS-BATCH-START-TIME     PIC 9(14).
           05  WS-BATCH-END-TIME       PIC 9(14).
           05  WS-BATCH-DURATION       PIC 9(08).
           05  WS-RECORDS-READ         PIC 9(09).
           05  WS-RECORDS-PROCESSED    PIC 9(09).
           05  WS-RECORDS-REJECTED     PIC 9(09).
           05  WS-RECORDS-UPDATED      PIC 9(09).
           05  WS-RECORDS-INSERTED     PIC 9(09).
           05  WS-RECORDS-DELETED      PIC 9(09).
           05  WS-BATCH-RETURN-CODE    PIC 9(04).
           05  WS-BATCH-ERROR-MSG      PIC X(200).

       01  WS-SCHEDULING-AREA.
           05  WS-SCHEDULE-ID          PIC X(15).
           05  WS-SCHEDULE-NAME        PIC X(50).
           05  WS-SCHEDULE-TYPE        PIC X(10).
           05  WS-SCHEDULE-FREQ        PIC X(10).
           05  WS-NEXT-RUN-DATE        PIC 9(08).
           05  WS-NEXT-RUN-TIME        PIC 9(06).
           05  WS-LAST-RUN-DATE        PIC 9(08).
           05  WS-LAST-RUN-TIME        PIC 9(06).
           05  WS-LAST-RUN-STATUS      PIC X(10).
           05  WS-SCHEDULE-ENABLED     PIC X(01).
           05  WS-DEPENDENCIES.
               10 WS-DEPEND OCCURS 10 TIMES.
                   15 DEP-JOB-ID       PIC X(15).
                   15 DEP-STATUS-REQ   PIC X(10).

      *----------------------------------------------------------------*
      * LOAN PROCESSING PROCEDURES                                     *
      *----------------------------------------------------------------*
       10000-LOAN-PROCESSING.
           PERFORM 10100-VALIDATE-LOAN-APPLICATION
           IF WS-VALID-FLAG = 'Y'
              PERFORM 10200-CALCULATE-CREDIT-SCORE
              PERFORM 10300-ASSESS-RISK
              PERFORM 10400-DETERMINE-APPROVAL
              IF WS-APPROVAL-STATUS = 'A'
                 PERFORM 10500-GENERATE-LOAN-TERMS
                 PERFORM 10600-CREATE-AMORTIZATION
                 PERFORM 10700-FINALIZE-LOAN
              ELSE
                 PERFORM 10800-PROCESS-DECLINE
              END-IF
           END-IF.

       10100-VALIDATE-LOAN-APPLICATION.
           MOVE 'Y' TO WS-VALID-FLAG
           IF WS-LOAN-AMOUNT < 1000
              MOVE 'N' TO WS-VALID-FLAG
              MOVE 'MINIMUM LOAN AMOUNT IS $1000' TO WS-ERROR-MSG
              EXIT PARAGRAPH
           END-IF
           IF WS-LOAN-AMOUNT > 10000000
              MOVE 'N' TO WS-VALID-FLAG
              MOVE 'MAXIMUM LOAN AMOUNT EXCEEDED' TO WS-ERROR-MSG
              EXIT PARAGRAPH
           END-IF
           IF WS-LOAN-TERM-MONTHS < 6 OR > 360
              MOVE 'N' TO WS-VALID-FLAG
              MOVE 'INVALID LOAN TERM' TO WS-ERROR-MSG
           END-IF.

       10200-CALCULATE-CREDIT-SCORE.
           INITIALIZE WS-CREDIT-SCORE
           PERFORM 10210-SCORE-PAYMENT-HISTORY
           PERFORM 10220-SCORE-CREDIT-UTILIZATION
           PERFORM 10230-SCORE-CREDIT-LENGTH
           PERFORM 10240-SCORE-NEW-CREDIT
           PERFORM 10250-SCORE-CREDIT-MIX
           PERFORM 10260-DETERMINE-TIER.

       10210-SCORE-PAYMENT-HISTORY.
           COMPUTE WS-PAYMENT-SCORE = 
              (WS-ON-TIME-PAYMENTS * 100) /
              (WS-ON-TIME-PAYMENTS + WS-LATE-30-DAYS +
               WS-LATE-60-DAYS + WS-LATE-90-DAYS)
           COMPUTE WS-PAYMENT-SCORE = 
              WS-PAYMENT-SCORE * 0.35
           ADD WS-PAYMENT-SCORE TO WS-CREDIT-SCORE.

       10220-SCORE-CREDIT-UTILIZATION.
           IF WS-CREDIT-UTILIZATION <= 10
              MOVE 100 TO WS-UTIL-SCORE
           ELSE IF WS-CREDIT-UTILIZATION <= 30
              MOVE 80 TO WS-UTIL-SCORE
           ELSE IF WS-CREDIT-UTILIZATION <= 50
              MOVE 60 TO WS-UTIL-SCORE
           ELSE IF WS-CREDIT-UTILIZATION <= 75
              MOVE 40 TO WS-UTIL-SCORE
           ELSE
              MOVE 20 TO WS-UTIL-SCORE
           END-IF
           END-IF
           END-IF
           END-IF
           COMPUTE WS-UTIL-SCORE = WS-UTIL-SCORE * 0.30
           ADD WS-UTIL-SCORE TO WS-CREDIT-SCORE.

       10230-SCORE-CREDIT-LENGTH.
           IF WS-CREDIT-HISTORY-LEN >= 84
              MOVE 100 TO WS-LENGTH-SCORE
           ELSE IF WS-CREDIT-HISTORY-LEN >= 60
              MOVE 80 TO WS-LENGTH-SCORE
           ELSE IF WS-CREDIT-HISTORY-LEN >= 36
              MOVE 60 TO WS-LENGTH-SCORE
           ELSE IF WS-CREDIT-HISTORY-LEN >= 12
              MOVE 40 TO WS-LENGTH-SCORE
           ELSE
              MOVE 20 TO WS-LENGTH-SCORE
           END-IF
           END-IF
           END-IF
           END-IF
           COMPUTE WS-LENGTH-SCORE = WS-LENGTH-SCORE * 0.15
           ADD WS-LENGTH-SCORE TO WS-CREDIT-SCORE.

       10240-SCORE-NEW-CREDIT.
           IF WS-NEW-CREDIT-INQS = 0
              MOVE 100 TO WS-NEW-SCORE
           ELSE IF WS-NEW-CREDIT-INQS <= 2
              MOVE 80 TO WS-NEW-SCORE
           ELSE IF WS-NEW-CREDIT-INQS <= 4
              MOVE 60 TO WS-NEW-SCORE
           ELSE IF WS-NEW-CREDIT-INQS <= 6
              MOVE 40 TO WS-NEW-SCORE
           ELSE
              MOVE 20 TO WS-NEW-SCORE
           END-IF
           END-IF
           END-IF
           END-IF
           COMPUTE WS-NEW-SCORE = WS-NEW-SCORE * 0.10
           ADD WS-NEW-SCORE TO WS-CREDIT-SCORE.

       10250-SCORE-CREDIT-MIX.
           IF WS-CREDIT-MIX-SCORE >= 80
              MOVE 100 TO WS-MIX-SCORE
           ELSE IF WS-CREDIT-MIX-SCORE >= 60
              MOVE 80 TO WS-MIX-SCORE
           ELSE IF WS-CREDIT-MIX-SCORE >= 40
              MOVE 60 TO WS-MIX-SCORE
           ELSE IF WS-CREDIT-MIX-SCORE >= 20
              MOVE 40 TO WS-MIX-SCORE
           ELSE
              MOVE 20 TO WS-MIX-SCORE
           END-IF
           END-IF
           END-IF
           END-IF
           COMPUTE WS-MIX-SCORE = WS-MIX-SCORE * 0.10
           ADD WS-MIX-SCORE TO WS-CREDIT-SCORE.

       10260-DETERMINE-TIER.
           EVALUATE TRUE
              WHEN WS-CREDIT-SCORE >= 750
                 MOVE 'A' TO WS-CREDIT-TIER
              WHEN WS-CREDIT-SCORE >= 700
                 MOVE 'B' TO WS-CREDIT-TIER
              WHEN WS-CREDIT-SCORE >= 650
                 MOVE 'C' TO WS-CREDIT-TIER
              WHEN WS-CREDIT-SCORE >= 600
                 MOVE 'D' TO WS-CREDIT-TIER
              WHEN OTHER
                 MOVE 'F' TO WS-CREDIT-TIER
           END-EVALUATE.

       10300-ASSESS-RISK.
           INITIALIZE WS-RISK-SCORE
           PERFORM 10310-EVALUATE-DTI
           PERFORM 10320-EVALUATE-EMPLOYMENT
           PERFORM 10330-EVALUATE-COLLATERAL
           PERFORM 10340-EVALUATE-HISTORY
           PERFORM 10350-CALCULATE-FINAL-RISK.

       10310-EVALUATE-DTI.
           IF WS-DTI-RATIO <= 20
              ADD 100 TO WS-RISK-SCORE
           ELSE IF WS-DTI-RATIO <= 30
              ADD 80 TO WS-RISK-SCORE
           ELSE IF WS-DTI-RATIO <= 40
              ADD 60 TO WS-RISK-SCORE
           ELSE IF WS-DTI-RATIO <= 50
              ADD 40 TO WS-RISK-SCORE
           ELSE
              ADD 20 TO WS-RISK-SCORE
           END-IF
           END-IF
           END-IF
           END-IF.

       10320-EVALUATE-EMPLOYMENT.
           IF WS-EMPLOYMENT-YEARS >= 5
              ADD 100 TO WS-RISK-SCORE
           ELSE IF WS-EMPLOYMENT-YEARS >= 3
              ADD 80 TO WS-RISK-SCORE
           ELSE IF WS-EMPLOYMENT-YEARS >= 1
              ADD 60 TO WS-RISK-SCORE
           ELSE
              ADD 30 TO WS-RISK-SCORE
           END-IF
           END-IF
           END-IF.

       10330-EVALUATE-COLLATERAL.
           IF LOAN-MORTGAGE
              COMPUTE WS-LTV-RATIO = 
                 (WS-LOAN-AMOUNT / WS-PROPERTY-VALUE) * 100
              IF WS-LTV-RATIO <= 80
                 ADD 100 TO WS-RISK-SCORE
                 MOVE 'N' TO WS-PMI-REQUIRED
              ELSE
                 COMPUTE WS-LTV-PENALTY = 
                    (WS-LTV-RATIO - 80) * 2
                 SUBTRACT WS-LTV-PENALTY FROM WS-RISK-SCORE
                 MOVE 'Y' TO WS-PMI-REQUIRED
                 PERFORM 10335-CALCULATE-PMI
              END-IF
           END-IF.

       10335-CALCULATE-PMI.
           EVALUATE TRUE
              WHEN WS-LTV-RATIO > 95
                 COMPUTE WS-PMI-AMOUNT = 
                    WS-LOAN-AMOUNT * 0.0125 / 12
              WHEN WS-LTV-RATIO > 90
                 COMPUTE WS-PMI-AMOUNT = 
                    WS-LOAN-AMOUNT * 0.0100 / 12
              WHEN WS-LTV-RATIO > 85
                 COMPUTE WS-PMI-AMOUNT = 
                    WS-LOAN-AMOUNT * 0.0075 / 12
              WHEN OTHER
                 COMPUTE WS-PMI-AMOUNT = 
                    WS-LOAN-AMOUNT * 0.0050 / 12
           END-EVALUATE.

       10340-EVALUATE-HISTORY.
           IF WS-LATE-90-DAYS > 0
              SUBTRACT 50 FROM WS-RISK-SCORE
              MOVE 'SEVERE DELINQUENCY HISTORY' TO WS-FACTOR-1
           END-IF
           IF WS-LATE-60-DAYS > 2
              SUBTRACT 30 FROM WS-RISK-SCORE
              MOVE '60+ DAY DELINQUENCIES' TO WS-FACTOR-2
           END-IF
           IF WS-LATE-30-DAYS > 5
              SUBTRACT 20 FROM WS-RISK-SCORE
              MOVE 'MULTIPLE 30-DAY LATES' TO WS-FACTOR-3
           END-IF.

       10350-CALCULATE-FINAL-RISK.
           COMPUTE WS-RISK-SCORE = 
              WS-RISK-SCORE / 4
           EVALUATE TRUE
              WHEN WS-RISK-SCORE >= 80
                 MOVE 'LOW RISK' TO WS-RISK-CATEGORY
              WHEN WS-RISK-SCORE >= 60
                 MOVE 'MODERATE' TO WS-RISK-CATEGORY
              WHEN WS-RISK-SCORE >= 40
                 MOVE 'ELEVATED' TO WS-RISK-CATEGORY
              WHEN OTHER
                 MOVE 'HIGH RISK' TO WS-RISK-CATEGORY
           END-EVALUATE.

       10400-DETERMINE-APPROVAL.
           IF WS-CREDIT-TIER = 'F'
              MOVE 'D' TO WS-APPROVAL-STATUS
              MOVE 'CREDIT SCORE TOO LOW' TO WS-CONDITIONS
              EXIT PARAGRAPH
           END-IF
           IF WS-RISK-CATEGORY = 'HIGH RISK'
              MOVE 'D' TO WS-APPROVAL-STATUS
              MOVE 'RISK ASSESSMENT FAILED' TO WS-CONDITIONS
              EXIT PARAGRAPH
           END-IF
           IF WS-DTI-RATIO > 50
              MOVE 'D' TO WS-APPROVAL-STATUS
              MOVE 'DTI RATIO TOO HIGH' TO WS-CONDITIONS
              EXIT PARAGRAPH
           END-IF
           MOVE 'A' TO WS-APPROVAL-STATUS
           PERFORM 10450-CALCULATE-APPROVED-TERMS.

       10450-CALCULATE-APPROVED-TERMS.
           MOVE WS-LOAN-AMOUNT TO WS-APPROVED-AMOUNT
           EVALUATE WS-CREDIT-TIER
              WHEN 'A'
                 COMPUTE WS-APPROVED-RATE = 
                    WS-BASE-RATE + 0.00
              WHEN 'B'
                 COMPUTE WS-APPROVED-RATE = 
                    WS-BASE-RATE + 0.50
              WHEN 'C'
                 COMPUTE WS-APPROVED-RATE = 
                    WS-BASE-RATE + 1.50
              WHEN 'D'
                 COMPUTE WS-APPROVED-RATE = 
                    WS-BASE-RATE + 3.00
           END-EVALUATE
           IF WS-RISK-CATEGORY = 'ELEVATED'
              ADD 0.50 TO WS-APPROVED-RATE
           END-IF.

       10500-GENERATE-LOAN-TERMS.
           MOVE WS-APPROVED-RATE TO WS-LOAN-INTEREST-RATE
           COMPUTE WS-MONTHLY-RATE = 
              WS-LOAN-INTEREST-RATE / 1200
           COMPUTE WS-COMPOUND-FACTOR = 
              (1 + WS-MONTHLY-RATE) ** WS-LOAN-TERM-MONTHS
           COMPUTE WS-LOAN-MONTHLY-PMT = 
              WS-LOAN-AMOUNT * WS-MONTHLY-RATE * 
              WS-COMPOUND-FACTOR / (WS-COMPOUND-FACTOR - 1)
           MOVE WS-LOAN-AMOUNT TO WS-LOAN-PRINCIPAL-BAL.

       10600-CREATE-AMORTIZATION.
           MOVE WS-LOAN-AMOUNT TO WS-RUNNING-BALANCE
           MOVE FUNCTION CURRENT-DATE TO WS-PAYMENT-DATE
           PERFORM VARYING WS-AMORT-IDX FROM 1 BY 1
              UNTIL WS-AMORT-IDX > WS-LOAN-TERM-MONTHS
              PERFORM 10650-CALCULATE-PAYMENT-SPLIT
           END-PERFORM.

       10650-CALCULATE-PAYMENT-SPLIT.
           COMPUTE AMORT-INTEREST(WS-AMORT-IDX) = 
              WS-RUNNING-BALANCE * WS-MONTHLY-RATE
           COMPUTE AMORT-PRINCIPAL(WS-AMORT-IDX) = 
              WS-LOAN-MONTHLY-PMT - AMORT-INTEREST(WS-AMORT-IDX)
           SUBTRACT AMORT-PRINCIPAL(WS-AMORT-IDX) 
              FROM WS-RUNNING-BALANCE
           MOVE WS-RUNNING-BALANCE 
              TO AMORT-BALANCE(WS-AMORT-IDX)
           MOVE WS-AMORT-IDX TO AMORT-PAYMENT-NUM(WS-AMORT-IDX)
           MOVE WS-LOAN-MONTHLY-PMT 
              TO AMORT-PAYMENT-AMT(WS-AMORT-IDX)
           IF LOAN-MORTGAGE
              COMPUTE AMORT-ESCROW(WS-AMORT-IDX) = 
                 (WS-PROPERTY-TAX + WS-INSURANCE-PREMIUM) / 12
              COMPUTE AMORT-TOTAL-PMT(WS-AMORT-IDX) = 
                 WS-LOAN-MONTHLY-PMT + 
                 AMORT-ESCROW(WS-AMORT-IDX) + WS-PMI-AMOUNT
           ELSE
              MOVE WS-LOAN-MONTHLY-PMT 
                 TO AMORT-TOTAL-PMT(WS-AMORT-IDX)
           END-IF
           PERFORM 10660-ADVANCE-PAYMENT-DATE.

       10660-ADVANCE-PAYMENT-DATE.
           ADD 1 TO WS-PAYMENT-MONTH
           IF WS-PAYMENT-MONTH > 12
              MOVE 1 TO WS-PAYMENT-MONTH
              ADD 1 TO WS-PAYMENT-YEAR
           END-IF
           COMPUTE AMORT-PAYMENT-DATE(WS-AMORT-IDX) = 
              WS-PAYMENT-YEAR * 10000 + 
              WS-PAYMENT-MONTH * 100 + 01.

       10700-FINALIZE-LOAN.
           MOVE FUNCTION CURRENT-DATE TO WS-LOAN-START-DATE
           COMPUTE WS-LOAN-END-DATE = 
              WS-LOAN-START-DATE + 
              (WS-LOAN-TERM-MONTHS * 30)
           MOVE 'A' TO WS-LOAN-STATUS
           PERFORM 10750-CREATE-LOAN-RECORD
           PERFORM 10760-DISBURSE-FUNDS
           PERFORM 10770-SEND-CONFIRMATION.

       10750-CREATE-LOAN-RECORD.
           INITIALIZE WS-LOAN-RECORD
           MOVE WS-LOAN-ID TO LOAN-REC-ID
           MOVE WS-LOAN-TYPE TO LOAN-REC-TYPE
           MOVE WS-LOAN-AMOUNT TO LOAN-REC-AMOUNT
           MOVE WS-LOAN-INTEREST-RATE TO LOAN-REC-RATE
           MOVE WS-LOAN-MONTHLY-PMT TO LOAN-REC-PAYMENT
           MOVE WS-LOAN-START-DATE TO LOAN-REC-START
           MOVE WS-LOAN-STATUS TO LOAN-REC-STATUS
           WRITE LOAN-RECORD FROM WS-LOAN-RECORD.

       10760-DISBURSE-FUNDS.
           MOVE WS-LOAN-AMOUNT TO WS-DISBURSEMENT-AMOUNT
           PERFORM 2300-PROCESS-DEPOSIT
           PERFORM 2380-WRITE-AUDIT-TRAIL.

       10770-SEND-CONFIRMATION.
           MOVE 'LOAN-CONFIRM' TO WS-NOTIF-TYPE
           MOVE 'EMAIL' TO WS-NOTIF-CHANNEL
           MOVE 'Your loan has been approved' TO WS-NOTIF-SUBJECT
           PERFORM 15000-SEND-NOTIFICATION.

       10800-PROCESS-DECLINE.
           MOVE 'DECLINED' TO WS-LOAN-STATUS
           PERFORM 10810-RECORD-DECLINE
           PERFORM 10820-SEND-DECLINE-NOTICE.

       10810-RECORD-DECLINE.
           INITIALIZE WS-DECLINE-RECORD
           MOVE WS-LOAN-ID TO DECLINE-LOAN-ID
           MOVE WS-APPROVAL-STATUS TO DECLINE-STATUS
           MOVE WS-CONDITIONS TO DECLINE-REASON
           MOVE FUNCTION CURRENT-DATE TO DECLINE-DATE
           WRITE DECLINE-RECORD FROM WS-DECLINE-RECORD.

       10820-SEND-DECLINE-NOTICE.
           MOVE 'LOAN-DECLINE' TO WS-NOTIF-TYPE
           MOVE 'LETTER' TO WS-NOTIF-CHANNEL
           MOVE 'Regarding your loan application' 
              TO WS-NOTIF-SUBJECT
           PERFORM 15000-SEND-NOTIFICATION.

      *----------------------------------------------------------------*
      * INVESTMENT PORTFOLIO PROCEDURES                                *
      *----------------------------------------------------------------*
       11000-PORTFOLIO-MANAGEMENT.
           PERFORM 11100-LOAD-PORTFOLIO
           PERFORM 11200-UPDATE-MARKET-PRICES
           PERFORM 11300-CALCULATE-VALUES
           PERFORM 11400-REBALANCE-CHECK
           PERFORM 11500-GENERATE-STATEMENTS.

       11100-LOAD-PORTFOLIO.
           MOVE 1 TO WS-HOLD-IDX
           PERFORM UNTIL WS-HOLD-IDX > 100
                      OR WS-EOF-FLAG = 'Y'
              READ HOLDINGS-FILE INTO WS-HOLDING-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    MOVE WS-HOLDING-REC 
                       TO WS-HOLDING(WS-HOLD-IDX)
                    ADD 1 TO WS-HOLD-IDX
              END-READ
           END-PERFORM
           SUBTRACT 1 FROM WS-HOLD-IDX 
              GIVING WS-HOLDINGS-COUNT.

       11200-UPDATE-MARKET-PRICES.
           PERFORM VARYING WS-HOLD-IDX FROM 1 BY 1
              UNTIL WS-HOLD-IDX > WS-HOLDINGS-COUNT
              MOVE HOLD-SYMBOL(WS-HOLD-IDX) TO WS-QUOTE-SYMBOL
              PERFORM 11250-GET-QUOTE
              MOVE WS-QUOTE-PRICE 
                 TO HOLD-CURRENT-PRICE(WS-HOLD-IDX)
           END-PERFORM.

       11250-GET-QUOTE.
           MOVE WS-QUOTE-SYMBOL TO QUOTE-REQUEST-SYMBOL
           CALL 'GETQUOTE' USING QUOTE-REQUEST QUOTE-RESPONSE
           IF QUOTE-RESPONSE-STATUS = 'OK'
              MOVE QUOTE-LAST-PRICE TO WS-QUOTE-PRICE
           ELSE
              MOVE ZEROES TO WS-QUOTE-PRICE
           END-IF.

       11300-CALCULATE-VALUES.
           MOVE ZEROES TO WS-TOTAL-VALUE
           MOVE ZEROES TO WS-COST-BASIS
           MOVE ZEROES TO WS-UNREALIZED-GAIN
           PERFORM VARYING WS-HOLD-IDX FROM 1 BY 1
              UNTIL WS-HOLD-IDX > WS-HOLDINGS-COUNT
              PERFORM 11350-CALCULATE-HOLDING-VALUE
           END-PERFORM.

       11350-CALCULATE-HOLDING-VALUE.
           COMPUTE HOLD-MARKET-VALUE(WS-HOLD-IDX) = 
              HOLD-SHARES(WS-HOLD-IDX) * 
              HOLD-CURRENT-PRICE(WS-HOLD-IDX)
           COMPUTE WS-HOLD-COST = 
              HOLD-SHARES(WS-HOLD-IDX) * 
              HOLD-COST-PER-SHARE(WS-HOLD-IDX)
           COMPUTE HOLD-GAIN-LOSS(WS-HOLD-IDX) = 
              HOLD-MARKET-VALUE(WS-HOLD-IDX) - WS-HOLD-COST
           IF WS-HOLD-COST > 0
              COMPUTE HOLD-PCT-CHANGE(WS-HOLD-IDX) = 
                 (HOLD-GAIN-LOSS(WS-HOLD-IDX) / WS-HOLD-COST) 
                 * 100
           ELSE
              MOVE ZEROES TO HOLD-PCT-CHANGE(WS-HOLD-IDX)
           END-IF
           ADD HOLD-MARKET-VALUE(WS-HOLD-IDX) TO WS-TOTAL-VALUE
           ADD WS-HOLD-COST TO WS-COST-BASIS
           ADD HOLD-GAIN-LOSS(WS-HOLD-IDX) TO WS-UNREALIZED-GAIN.

       11400-REBALANCE-CHECK.
           PERFORM 11410-CALCULATE-CURRENT-ALLOCATION
           PERFORM 11420-COMPARE-TO-TARGET
           IF WS-REBALANCE-NEEDED = 'Y'
              PERFORM 11430-GENERATE-REBALANCE-TRADES
           END-IF.

       11410-CALCULATE-CURRENT-ALLOCATION.
           MOVE ZEROES TO WS-STOCKS-VALUE
           MOVE ZEROES TO WS-BONDS-VALUE
           MOVE ZEROES TO WS-CASH-VALUE
           PERFORM VARYING WS-HOLD-IDX FROM 1 BY 1
              UNTIL WS-HOLD-IDX > WS-HOLDINGS-COUNT
              EVALUATE HOLD-TYPE(WS-HOLD-IDX)
                 WHEN 'STK'
                    ADD HOLD-MARKET-VALUE(WS-HOLD-IDX) 
                       TO WS-STOCKS-VALUE
                 WHEN 'BND'
                    ADD HOLD-MARKET-VALUE(WS-HOLD-IDX) 
                       TO WS-BONDS-VALUE
                 WHEN 'CSH'
                    ADD HOLD-MARKET-VALUE(WS-HOLD-IDX) 
                       TO WS-CASH-VALUE
              END-EVALUATE
           END-PERFORM
           COMPUTE WS-STOCKS-PCT = 
              (WS-STOCKS-VALUE / WS-TOTAL-VALUE) * 100
           COMPUTE WS-BONDS-PCT = 
              (WS-BONDS-VALUE / WS-TOTAL-VALUE) * 100
           COMPUTE WS-CASH-PCT = 
              (WS-CASH-VALUE / WS-TOTAL-VALUE) * 100.

       11420-COMPARE-TO-TARGET.
           MOVE 'N' TO WS-REBALANCE-NEEDED
           COMPUTE WS-STOCKS-DIFF = 
              WS-STOCKS-PCT - WS-TARGET-STOCKS-PCT
           COMPUTE WS-BONDS-DIFF = 
              WS-BONDS-PCT - WS-TARGET-BONDS-PCT
           IF FUNCTION ABS(WS-STOCKS-DIFF) > 5
              MOVE 'Y' TO WS-REBALANCE-NEEDED
           END-IF
           IF FUNCTION ABS(WS-BONDS-DIFF) > 5
              MOVE 'Y' TO WS-REBALANCE-NEEDED
           END-IF.

       11430-GENERATE-REBALANCE-TRADES.
           IF WS-STOCKS-DIFF > 0
              COMPUTE WS-SELL-AMOUNT = 
                 WS-TOTAL-VALUE * WS-STOCKS-DIFF / 100
              PERFORM 11440-CREATE-SELL-ORDER
           ELSE
              COMPUTE WS-BUY-AMOUNT = 
                 WS-TOTAL-VALUE * (0 - WS-STOCKS-DIFF) / 100
              PERFORM 11450-CREATE-BUY-ORDER
           END-IF.

       11440-CREATE-SELL-ORDER.
           MOVE 'SELL' TO WS-TRADE-TYPE
           MOVE 'MARKET' TO WS-ORDER-TYPE
           MOVE WS-SELL-AMOUNT TO WS-TRADE-AMOUNT
           PERFORM 12000-TRADE-EXECUTION.

       11450-CREATE-BUY-ORDER.
           MOVE 'BUY ' TO WS-TRADE-TYPE
           MOVE 'MARKET' TO WS-ORDER-TYPE
           MOVE WS-BUY-AMOUNT TO WS-TRADE-AMOUNT
           PERFORM 12000-TRADE-EXECUTION.

       11500-GENERATE-STATEMENTS.
           PERFORM 11510-MONTHLY-STATEMENT
           IF WS-END-OF-QUARTER = 'Y'
              PERFORM 11520-QUARTERLY-REPORT
           END-IF
           IF WS-END-OF-YEAR = 'Y'
              PERFORM 11530-ANNUAL-TAX-REPORT
           END-IF.

       11510-MONTHLY-STATEMENT.
           MOVE 'MONTHLY INVESTMENT STATEMENT' TO RPT-TITLE
           PERFORM 11515-WRITE-HOLDINGS-DETAIL.

       11515-WRITE-HOLDINGS-DETAIL.
           PERFORM VARYING WS-HOLD-IDX FROM 1 BY 1
              UNTIL WS-HOLD-IDX > WS-HOLDINGS-COUNT
              MOVE HOLD-SYMBOL(WS-HOLD-IDX) TO RPT-SYMBOL
              MOVE HOLD-SHARES(WS-HOLD-IDX) TO RPT-SHARES
              MOVE HOLD-CURRENT-PRICE(WS-HOLD-IDX) TO RPT-PRICE
              MOVE HOLD-MARKET-VALUE(WS-HOLD-IDX) TO RPT-VALUE
              MOVE HOLD-GAIN-LOSS(WS-HOLD-IDX) TO RPT-GAIN
              WRITE REPORT-RECORD FROM WS-HOLDINGS-LINE
           END-PERFORM.

       11520-QUARTERLY-REPORT.
           MOVE 'QUARTERLY PERFORMANCE REPORT' TO RPT-TITLE
           COMPUTE RPT-QUARTER-RETURN = 
              (WS-TOTAL-VALUE - WS-QUARTER-START-VALUE) /
              WS-QUARTER-START-VALUE * 100
           WRITE REPORT-RECORD FROM WS-PERFORMANCE-LINE.

       11530-ANNUAL-TAX-REPORT.
           MOVE 'ANNUAL TAX REPORT - 1099' TO RPT-TITLE
           MOVE WS-DIVIDEND-INCOME TO RPT-DIVIDENDS
           MOVE WS-REALIZED-GAIN-YTD TO RPT-CAP-GAINS
           WRITE REPORT-RECORD FROM WS-TAX-LINE.

      *----------------------------------------------------------------*
      * TRADE EXECUTION PROCEDURES                                     *
      *----------------------------------------------------------------*
       12000-TRADE-EXECUTION.
           PERFORM 12100-VALIDATE-ORDER
           IF WS-ORDER-VALID = 'Y'
              PERFORM 12200-CHECK-FUNDS-SHARES
              IF WS-SUFFICIENT-FLAG = 'Y'
                 PERFORM 12300-ROUTE-ORDER
                 PERFORM 12400-EXECUTE-ORDER
                 PERFORM 12500-SETTLE-TRADE
              ELSE
                 PERFORM 12600-REJECT-ORDER
              END-IF
           END-IF.

       12100-VALIDATE-ORDER.
           MOVE 'Y' TO WS-ORDER-VALID
           IF WS-TRADE-SYMBOL = SPACES
              MOVE 'N' TO WS-ORDER-VALID
              MOVE 'SYMBOL REQUIRED' TO WS-REJECT-REASON
              EXIT PARAGRAPH
           END-IF
           IF WS-TRADE-SHARES <= 0
              MOVE 'N' TO WS-ORDER-VALID
              MOVE 'INVALID QUANTITY' TO WS-REJECT-REASON
              EXIT PARAGRAPH
           END-IF
           IF ORDER-LIMIT OR ORDER-STOP-LIMIT
              IF WS-LIMIT-PRICE <= 0
                 MOVE 'N' TO WS-ORDER-VALID
                 MOVE 'LIMIT PRICE REQUIRED' TO WS-REJECT-REASON
              END-IF
           END-IF.

       12200-CHECK-FUNDS-SHARES.
           MOVE 'Y' TO WS-SUFFICIENT-FLAG
           IF TRADE-BUY
              COMPUTE WS-REQUIRED-FUNDS = 
                 WS-TRADE-SHARES * WS-ESTIMATED-PRICE
              IF WS-REQUIRED-FUNDS > WS-AVAILABLE-CASH
                 MOVE 'N' TO WS-SUFFICIENT-FLAG
                 MOVE 'INSUFFICIENT FUNDS' TO WS-REJECT-REASON
              END-IF
           END-IF
           IF TRADE-SELL
              PERFORM 12250-CHECK-SHARE-POSITION
              IF WS-CURRENT-SHARES < WS-TRADE-SHARES
                 MOVE 'N' TO WS-SUFFICIENT-FLAG
                 MOVE 'INSUFFICIENT SHARES' TO WS-REJECT-REASON
              END-IF
           END-IF.

       12250-CHECK-SHARE-POSITION.
           MOVE ZEROES TO WS-CURRENT-SHARES
           PERFORM VARYING WS-HOLD-IDX FROM 1 BY 1
              UNTIL WS-HOLD-IDX > WS-HOLDINGS-COUNT
              IF HOLD-SYMBOL(WS-HOLD-IDX) = WS-TRADE-SYMBOL
                 ADD HOLD-SHARES(WS-HOLD-IDX) 
                    TO WS-CURRENT-SHARES
              END-IF
           END-PERFORM.

       12300-ROUTE-ORDER.
           EVALUATE TRUE
              WHEN WS-TRADE-AMOUNT > 100000
                 MOVE 'ALGO' TO WS-ROUTING-TYPE
              WHEN WS-TRADE-AMOUNT > 10000
                 MOVE 'SMART' TO WS-ROUTING-TYPE
              WHEN OTHER
                 MOVE 'DIRECT' TO WS-ROUTING-TYPE
           END-EVALUATE
           MOVE FUNCTION CURRENT-DATE TO WS-ORDER-TIME.

       12400-EXECUTE-ORDER.
           IF ORDER-MARKET
              PERFORM 12410-MARKET-ORDER
           ELSE IF ORDER-LIMIT
              PERFORM 12420-LIMIT-ORDER
           ELSE IF ORDER-STOP
              PERFORM 12430-STOP-ORDER
           ELSE
              PERFORM 12440-STOP-LIMIT-ORDER
           END-IF
           END-IF
           END-IF.

       12410-MARKET-ORDER.
           MOVE WS-CURRENT-MARKET-PRICE TO WS-EXECUTED-PRICE
           MOVE 'FILLED' TO WS-TRADE-STATUS
           MOVE FUNCTION CURRENT-DATE TO WS-EXECUTION-TIME.

       12420-LIMIT-ORDER.
           IF TRADE-BUY
              IF WS-CURRENT-MARKET-PRICE <= WS-LIMIT-PRICE
                 MOVE WS-CURRENT-MARKET-PRICE 
                    TO WS-EXECUTED-PRICE
                 MOVE 'FILLED' TO WS-TRADE-STATUS
              ELSE
                 MOVE 'OPEN' TO WS-TRADE-STATUS
              END-IF
           ELSE
              IF WS-CURRENT-MARKET-PRICE >= WS-LIMIT-PRICE
                 MOVE WS-CURRENT-MARKET-PRICE 
                    TO WS-EXECUTED-PRICE
                 MOVE 'FILLED' TO WS-TRADE-STATUS
              ELSE
                 MOVE 'OPEN' TO WS-TRADE-STATUS
              END-IF
           END-IF.

       12430-STOP-ORDER.
           IF TRADE-SELL
              IF WS-CURRENT-MARKET-PRICE <= WS-STOP-PRICE
                 MOVE WS-CURRENT-MARKET-PRICE 
                    TO WS-EXECUTED-PRICE
                 MOVE 'FILLED' TO WS-TRADE-STATUS
              ELSE
                 MOVE 'OPEN' TO WS-TRADE-STATUS
              END-IF
           END-IF.

       12440-STOP-LIMIT-ORDER.
           IF WS-CURRENT-MARKET-PRICE <= WS-STOP-PRICE
              PERFORM 12420-LIMIT-ORDER
           ELSE
              MOVE 'OPEN' TO WS-TRADE-STATUS
           END-IF.

       12500-SETTLE-TRADE.
           IF WS-TRADE-STATUS = 'FILLED'
              PERFORM 12510-CALCULATE-COSTS
              PERFORM 12520-UPDATE-POSITIONS
              PERFORM 12530-UPDATE-CASH
              PERFORM 12540-RECORD-TRADE
           END-IF.

       12510-CALCULATE-COSTS.
           COMPUTE WS-GROSS-AMOUNT = 
              WS-TRADE-SHARES * WS-EXECUTED-PRICE
           EVALUATE TRUE
              WHEN WS-GROSS-AMOUNT > 100000
                 COMPUTE WS-COMMISSION = 
                    WS-GROSS-AMOUNT * 0.0005
              WHEN WS-GROSS-AMOUNT > 10000
                 COMPUTE WS-COMMISSION = 
                    WS-GROSS-AMOUNT * 0.001
              WHEN OTHER
                 MOVE 4.95 TO WS-COMMISSION
           END-EVALUATE
           COMPUTE WS-FEES = WS-GROSS-AMOUNT * 0.00002
           IF TRADE-BUY
              COMPUTE WS-NET-AMOUNT = 
                 WS-GROSS-AMOUNT + WS-COMMISSION + WS-FEES
           ELSE
              COMPUTE WS-NET-AMOUNT = 
                 WS-GROSS-AMOUNT - WS-COMMISSION - WS-FEES
           END-IF.

       12520-UPDATE-POSITIONS.
           IF TRADE-BUY
              PERFORM 12525-ADD-TO-POSITION
           ELSE
              PERFORM 12526-REDUCE-POSITION
           END-IF.

       12525-ADD-TO-POSITION.
           SET WS-HOLD-IDX TO 1
           SEARCH WS-HOLDING
              AT END
                 PERFORM 12527-CREATE-NEW-POSITION
              WHEN HOLD-SYMBOL(WS-HOLD-IDX) = WS-TRADE-SYMBOL
                 COMPUTE WS-NEW-TOTAL-SHARES = 
                    HOLD-SHARES(WS-HOLD-IDX) + WS-TRADE-SHARES
                 COMPUTE WS-NEW-COST = 
                    (HOLD-SHARES(WS-HOLD-IDX) * 
                     HOLD-COST-PER-SHARE(WS-HOLD-IDX)) +
                    (WS-TRADE-SHARES * WS-EXECUTED-PRICE)
                 COMPUTE HOLD-COST-PER-SHARE(WS-HOLD-IDX) = 
                    WS-NEW-COST / WS-NEW-TOTAL-SHARES
                 MOVE WS-NEW-TOTAL-SHARES 
                    TO HOLD-SHARES(WS-HOLD-IDX)
           END-SEARCH.

       12526-REDUCE-POSITION.
           SET WS-HOLD-IDX TO 1
           SEARCH WS-HOLDING
              WHEN HOLD-SYMBOL(WS-HOLD-IDX) = WS-TRADE-SYMBOL
                 SUBTRACT WS-TRADE-SHARES 
                    FROM HOLD-SHARES(WS-HOLD-IDX)
                 COMPUTE WS-REALIZED-GAIN = 
                    WS-TRADE-SHARES * 
                    (WS-EXECUTED-PRICE - 
                     HOLD-COST-PER-SHARE(WS-HOLD-IDX))
                 ADD WS-REALIZED-GAIN TO WS-REALIZED-GAIN-YTD
           END-SEARCH.

       12527-CREATE-NEW-POSITION.
           ADD 1 TO WS-HOLDINGS-COUNT
           MOVE WS-TRADE-SYMBOL 
              TO HOLD-SYMBOL(WS-HOLDINGS-COUNT)
           MOVE WS-TRADE-SHARES 
              TO HOLD-SHARES(WS-HOLDINGS-COUNT)
           MOVE WS-EXECUTED-PRICE 
              TO HOLD-COST-PER-SHARE(WS-HOLDINGS-COUNT)
           MOVE WS-EXECUTED-PRICE 
              TO HOLD-CURRENT-PRICE(WS-HOLDINGS-COUNT)
           MOVE FUNCTION CURRENT-DATE 
              TO HOLD-PURCHASE-DATE(WS-HOLDINGS-COUNT).

       12530-UPDATE-CASH.
           IF TRADE-BUY
              SUBTRACT WS-NET-AMOUNT FROM WS-AVAILABLE-CASH
           ELSE
              ADD WS-NET-AMOUNT TO WS-AVAILABLE-CASH
           END-IF.

       12540-RECORD-TRADE.
           INITIALIZE WS-TRADE-RECORD
           MOVE WS-TRADE-ID TO TRADE-REC-ID
           MOVE WS-TRADE-TYPE TO TRADE-REC-TYPE
           MOVE WS-TRADE-SYMBOL TO TRADE-REC-SYMBOL
           MOVE WS-TRADE-SHARES TO TRADE-REC-SHARES
           MOVE WS-EXECUTED-PRICE TO TRADE-REC-PRICE
           MOVE WS-COMMISSION TO TRADE-REC-COMM
           MOVE WS-NET-AMOUNT TO TRADE-REC-NET
           MOVE WS-EXECUTION-TIME TO TRADE-REC-TIME
           WRITE TRADE-RECORD FROM WS-TRADE-RECORD.

       12600-REJECT-ORDER.
           MOVE 'REJECTED' TO WS-TRADE-STATUS
           INITIALIZE WS-REJECT-RECORD
           MOVE WS-TRADE-ID TO REJECT-ORDER-ID
           MOVE WS-REJECT-REASON TO REJECT-REASON
           MOVE FUNCTION CURRENT-DATE TO REJECT-DATE
           WRITE REJECT-RECORD FROM WS-REJECT-RECORD.


      *----------------------------------------------------------------*
      * INSURANCE PROCESSING PROCEDURES                                *
      *----------------------------------------------------------------*
       13000-INSURANCE-PROCESSING.
           PERFORM 13100-VALIDATE-POLICY
           PERFORM 13200-CALCULATE-PREMIUM
           PERFORM 13300-UNDERWRITING
           PERFORM 13400-ISSUE-POLICY
           PERFORM 13500-CLAIMS-HANDLING.

       13100-VALIDATE-POLICY.
           MOVE 'Y' TO WS-VALID-FLAG
           IF WS-COVERAGE-AMOUNT < 1000
              MOVE 'N' TO WS-VALID-FLAG
              MOVE 'MINIMUM COVERAGE NOT MET' TO WS-ERROR-MSG
           END-IF
           IF WS-EFFECTIVE-DATE < FUNCTION CURRENT-DATE
              MOVE 'N' TO WS-VALID-FLAG
              MOVE 'INVALID EFFECTIVE DATE' TO WS-ERROR-MSG
           END-IF.

       13200-CALCULATE-PREMIUM.
           EVALUATE TRUE
              WHEN POLICY-LIFE
                 PERFORM 13210-CALC-LIFE-PREMIUM
              WHEN POLICY-AUTO
                 PERFORM 13220-CALC-AUTO-PREMIUM
              WHEN POLICY-HOME
                 PERFORM 13230-CALC-HOME-PREMIUM
              WHEN POLICY-HEALTH
                 PERFORM 13240-CALC-HEALTH-PREMIUM
           END-EVALUATE.

       13210-CALC-LIFE-PREMIUM.
           COMPUTE WS-BASE-PREMIUM = 
              WS-COVERAGE-AMOUNT * 0.005
           EVALUATE TRUE
              WHEN WS-INSURED-AGE < 30
                 MULTIPLY 0.8 BY WS-BASE-PREMIUM
              WHEN WS-INSURED-AGE < 40
                 MULTIPLY 1.0 BY WS-BASE-PREMIUM
              WHEN WS-INSURED-AGE < 50
                 MULTIPLY 1.5 BY WS-BASE-PREMIUM
              WHEN WS-INSURED-AGE < 60
                 MULTIPLY 2.0 BY WS-BASE-PREMIUM
              WHEN OTHER
                 MULTIPLY 3.0 BY WS-BASE-PREMIUM
           END-EVALUATE
           IF WS-SMOKER-FLAG = 'Y'
              MULTIPLY 1.5 BY WS-BASE-PREMIUM
           END-IF
           MOVE WS-BASE-PREMIUM TO WS-ANNUAL-PREMIUM
           COMPUTE WS-MONTHLY-PREMIUM = 
              WS-ANNUAL-PREMIUM / 12.

       13220-CALC-AUTO-PREMIUM.
           MOVE 500 TO WS-BASE-PREMIUM
           EVALUATE WS-VEHICLE-AGE
              WHEN 0 THRU 2
                 ADD 200 TO WS-BASE-PREMIUM
              WHEN 3 THRU 5
                 ADD 150 TO WS-BASE-PREMIUM
              WHEN 6 THRU 10
                 ADD 100 TO WS-BASE-PREMIUM
              WHEN OTHER
                 ADD 50 TO WS-BASE-PREMIUM
           END-EVALUATE
           IF WS-DRIVER-AGE < 25
              MULTIPLY 1.5 BY WS-BASE-PREMIUM
           END-IF
           IF WS-ACCIDENTS-3YR > 0
              COMPUTE WS-ACCIDENT-SURCHARGE = 
                 WS-ACCIDENTS-3YR * 200
              ADD WS-ACCIDENT-SURCHARGE TO WS-BASE-PREMIUM
           END-IF
           IF WS-VIOLATIONS-3YR > 0
              COMPUTE WS-VIOLATION-SURCHARGE = 
                 WS-VIOLATIONS-3YR * 100
              ADD WS-VIOLATION-SURCHARGE TO WS-BASE-PREMIUM
           END-IF
           MOVE WS-BASE-PREMIUM TO WS-ANNUAL-PREMIUM
           COMPUTE WS-MONTHLY-PREMIUM = 
              WS-ANNUAL-PREMIUM / 12.

       13230-CALC-HOME-PREMIUM.
           COMPUTE WS-BASE-PREMIUM = 
              WS-COVERAGE-AMOUNT * 0.003
           EVALUATE WS-HOME-AGE
              WHEN 0 THRU 10
                 MULTIPLY 0.9 BY WS-BASE-PREMIUM
              WHEN 11 THRU 25
                 MULTIPLY 1.0 BY WS-BASE-PREMIUM
              WHEN 26 THRU 50
                 MULTIPLY 1.2 BY WS-BASE-PREMIUM
              WHEN OTHER
                 MULTIPLY 1.5 BY WS-BASE-PREMIUM
           END-EVALUATE
           IF WS-FLOOD-ZONE = 'Y'
              MULTIPLY 1.5 BY WS-BASE-PREMIUM
           END-IF
           IF WS-SECURITY-SYSTEM = 'Y'
              MULTIPLY 0.9 BY WS-BASE-PREMIUM
           END-IF
           COMPUTE WS-DEDUCTIBLE-CREDIT = 
              WS-DEDUCTIBLE / 1000 * 50
           SUBTRACT WS-DEDUCTIBLE-CREDIT FROM WS-BASE-PREMIUM
           IF WS-BASE-PREMIUM < 200
              MOVE 200 TO WS-BASE-PREMIUM
           END-IF
           MOVE WS-BASE-PREMIUM TO WS-ANNUAL-PREMIUM
           COMPUTE WS-MONTHLY-PREMIUM = 
              WS-ANNUAL-PREMIUM / 12.

       13240-CALC-HEALTH-PREMIUM.
           MOVE 300 TO WS-BASE-PREMIUM
           EVALUATE WS-INSURED-AGE
              WHEN 0 THRU 18
                 MULTIPLY 0.5 BY WS-BASE-PREMIUM
              WHEN 19 THRU 30
                 MULTIPLY 1.0 BY WS-BASE-PREMIUM
              WHEN 31 THRU 40
                 MULTIPLY 1.3 BY WS-BASE-PREMIUM
              WHEN 41 THRU 50
                 MULTIPLY 1.6 BY WS-BASE-PREMIUM
              WHEN 51 THRU 60
                 MULTIPLY 2.0 BY WS-BASE-PREMIUM
              WHEN OTHER
                 MULTIPLY 2.8 BY WS-BASE-PREMIUM
           END-EVALUATE
           EVALUATE WS-PLAN-TYPE
              WHEN 'BRONZE'
                 MULTIPLY 0.8 BY WS-BASE-PREMIUM
              WHEN 'SILVER'
                 MULTIPLY 1.0 BY WS-BASE-PREMIUM
              WHEN 'GOLD'
                 MULTIPLY 1.3 BY WS-BASE-PREMIUM
              WHEN 'PLATINUM'
                 MULTIPLY 1.6 BY WS-BASE-PREMIUM
           END-EVALUATE
           IF WS-FAMILY-PLAN = 'Y'
              MULTIPLY 2.5 BY WS-BASE-PREMIUM
           END-IF
           MOVE WS-BASE-PREMIUM TO WS-MONTHLY-PREMIUM
           COMPUTE WS-ANNUAL-PREMIUM = 
              WS-MONTHLY-PREMIUM * 12.

       13300-UNDERWRITING.
           PERFORM 13310-EVALUATE-RISK-FACTORS
           PERFORM 13320-CHECK-MEDICAL-HISTORY
           PERFORM 13330-VERIFY-INFORMATION
           PERFORM 13340-DETERMINE-DECISION.

       13310-EVALUATE-RISK-FACTORS.
           MOVE ZEROES TO WS-RISK-POINTS
           IF POLICY-LIFE
              IF WS-BMI > 30
                 ADD 10 TO WS-RISK-POINTS
              END-IF
              IF WS-SMOKER-FLAG = 'Y'
                 ADD 25 TO WS-RISK-POINTS
              END-IF
              IF WS-HAZARDOUS-OCCUPATION = 'Y'
                 ADD 15 TO WS-RISK-POINTS
              END-IF
           END-IF
           IF POLICY-AUTO
              IF WS-DRIVER-AGE < 21
                 ADD 20 TO WS-RISK-POINTS
              END-IF
              IF WS-ACCIDENTS-3YR > 1
                 ADD 15 TO WS-RISK-POINTS
              END-IF
           END-IF.

       13320-CHECK-MEDICAL-HISTORY.
           IF WS-CHRONIC-CONDITIONS > 0
              COMPUTE WS-CONDITION-POINTS = 
                 WS-CHRONIC-CONDITIONS * 5
              ADD WS-CONDITION-POINTS TO WS-RISK-POINTS
           END-IF
           IF WS-RECENT-HOSPITALIZATION = 'Y'
              ADD 10 TO WS-RISK-POINTS
           END-IF
           IF WS-PRESCRIPTION-COUNT > 5
              ADD 5 TO WS-RISK-POINTS
           END-IF.

       13330-VERIFY-INFORMATION.
           PERFORM 13335-CHECK-FRAUD-INDICATORS
           PERFORM 13336-VALIDATE-DOCUMENTS.

       13335-CHECK-FRAUD-INDICATORS.
           IF WS-RECENT-CLAIMS > 3
              ADD 20 TO WS-RISK-POINTS
              MOVE 'Y' TO WS-FRAUD-FLAG
           END-IF
           IF WS-ADDRESS-MISMATCH = 'Y'
              ADD 10 TO WS-RISK-POINTS
           END-IF.

       13336-VALIDATE-DOCUMENTS.
           IF WS-DOC-MISSING = 'Y'
              MOVE 'PENDING' TO WS-UW-STATUS
           ELSE
              MOVE 'COMPLETE' TO WS-UW-STATUS
           END-IF.

       13340-DETERMINE-DECISION.
           EVALUATE TRUE
              WHEN WS-RISK-POINTS > 50
                 MOVE 'DECLINE' TO WS-UW-DECISION
              WHEN WS-RISK-POINTS > 30
                 MOVE 'SUBSTANDARD' TO WS-UW-DECISION
                 COMPUTE WS-ANNUAL-PREMIUM = 
                    WS-ANNUAL-PREMIUM * 1.5
              WHEN WS-RISK-POINTS > 15
                 MOVE 'STANDARD' TO WS-UW-DECISION
              WHEN OTHER
                 MOVE 'PREFERRED' TO WS-UW-DECISION
                 COMPUTE WS-ANNUAL-PREMIUM = 
                    WS-ANNUAL-PREMIUM * 0.9
           END-EVALUATE.

       13400-ISSUE-POLICY.
           IF WS-UW-DECISION NOT = 'DECLINE'
              PERFORM 13410-GENERATE-POLICY-NUMBER
              PERFORM 13420-CREATE-POLICY-RECORD
              PERFORM 13430-SET-BENEFICIARIES
              PERFORM 13440-SEND-POLICY-DOCS
           ELSE
              PERFORM 13450-SEND-DECLINE-LETTER
           END-IF.

       13410-GENERATE-POLICY-NUMBER.
           MOVE FUNCTION CURRENT-DATE TO WS-DATE-PART
           MOVE WS-POLICY-TYPE TO WS-TYPE-PART
           COMPUTE WS-RANDOM-PART = 
              FUNCTION RANDOM * 99999
           STRING WS-TYPE-PART DELIMITED SIZE
                  WS-DATE-PART DELIMITED SIZE
                  WS-RANDOM-PART DELIMITED SIZE
              INTO WS-POLICY-NUMBER.

       13420-CREATE-POLICY-RECORD.
           INITIALIZE WS-POLICY-RECORD
           MOVE WS-POLICY-NUMBER TO POLICY-REC-NUMBER
           MOVE WS-POLICY-TYPE TO POLICY-REC-TYPE
           MOVE WS-COVERAGE-AMOUNT TO POLICY-REC-COVERAGE
           MOVE WS-ANNUAL-PREMIUM TO POLICY-REC-PREMIUM
           MOVE WS-EFFECTIVE-DATE TO POLICY-REC-EFF-DATE
           MOVE WS-EXPIRATION-DATE TO POLICY-REC-EXP-DATE
           MOVE 'A' TO POLICY-REC-STATUS
           WRITE POLICY-RECORD FROM WS-POLICY-RECORD.

       13430-SET-BENEFICIARIES.
           PERFORM VARYING WS-BENEF-IDX FROM 1 BY 1
              UNTIL WS-BENEF-IDX > 5
              IF BENEF-NAME(WS-BENEF-IDX) NOT = SPACES
                 INITIALIZE WS-BENEFICIARY-REC
                 MOVE WS-POLICY-NUMBER TO BENEF-REC-POLICY
                 MOVE BENEF-NAME(WS-BENEF-IDX) 
                    TO BENEF-REC-NAME
                 MOVE BENEF-RELATION(WS-BENEF-IDX) 
                    TO BENEF-REC-RELATION
                 MOVE BENEF-PCT(WS-BENEF-IDX) TO BENEF-REC-PCT
                 WRITE BENEFICIARY-RECORD 
                    FROM WS-BENEFICIARY-REC
              END-IF
           END-PERFORM.

       13440-SEND-POLICY-DOCS.
           MOVE 'POLICY-ISSUE' TO WS-NOTIF-TYPE
           MOVE 'MAIL' TO WS-NOTIF-CHANNEL
           STRING 'Your policy ' DELIMITED SIZE
                  WS-POLICY-NUMBER DELIMITED SIZE
                  ' has been issued' DELIMITED SIZE
              INTO WS-NOTIF-SUBJECT
           PERFORM 15000-SEND-NOTIFICATION.

       13450-SEND-DECLINE-LETTER.
           MOVE 'POLICY-DECLINE' TO WS-NOTIF-TYPE
           MOVE 'MAIL' TO WS-NOTIF-CHANNEL
           MOVE 'Regarding your insurance application' 
              TO WS-NOTIF-SUBJECT
           PERFORM 15000-SEND-NOTIFICATION.

       13500-CLAIMS-HANDLING.
           PERFORM 13510-RECEIVE-CLAIM
           PERFORM 13520-VALIDATE-CLAIM
           PERFORM 13530-INVESTIGATE-CLAIM
           PERFORM 13540-ADJUDICATE-CLAIM
           PERFORM 13550-PROCESS-PAYMENT.

       13510-RECEIVE-CLAIM.
           MOVE FUNCTION CURRENT-DATE TO WS-CLAIM-DATE
           PERFORM 13515-GENERATE-CLAIM-NUMBER
           MOVE 'RECEIVED' TO WS-CLAIM-STATUS.

       13515-GENERATE-CLAIM-NUMBER.
           MOVE FUNCTION CURRENT-DATE TO WS-DATE-PART
           COMPUTE WS-RANDOM-PART = FUNCTION RANDOM * 99999
           STRING 'CLM' DELIMITED SIZE
                  WS-DATE-PART DELIMITED SIZE
                  WS-RANDOM-PART DELIMITED SIZE
              INTO WS-CLAIM-NUMBER.

       13520-VALIDATE-CLAIM.
           PERFORM 13522-CHECK-POLICY-STATUS
           PERFORM 13524-CHECK-COVERAGE
           PERFORM 13526-CHECK-DEDUCTIBLE.

       13522-CHECK-POLICY-STATUS.
           IF WS-POLICY-STATUS NOT = 'A'
              MOVE 'DENIED' TO WS-CLAIM-STATUS
              MOVE 'POLICY NOT ACTIVE' TO WS-CLAIM-DENY-REASON
           END-IF.

       13524-CHECK-COVERAGE.
           IF WS-CLAIM-TYPE NOT = WS-COVERED-PERILS
              MOVE 'DENIED' TO WS-CLAIM-STATUS
              MOVE 'NOT COVERED PERIL' TO WS-CLAIM-DENY-REASON
           END-IF.

       13526-CHECK-DEDUCTIBLE.
           IF WS-CLAIM-AMOUNT <= WS-DEDUCTIBLE
              MOVE 'DENIED' TO WS-CLAIM-STATUS
              MOVE 'BELOW DEDUCTIBLE' TO WS-CLAIM-DENY-REASON
           END-IF.

       13530-INVESTIGATE-CLAIM.
           IF WS-CLAIM-AMOUNT > 10000
              MOVE 'INVESTIGATION' TO WS-CLAIM-STATUS
              PERFORM 13535-ASSIGN-ADJUSTER
           END-IF
           PERFORM 13536-FRAUD-CHECK.

       13535-ASSIGN-ADJUSTER.
           MOVE 'ADJ001' TO WS-ADJUSTER-ID
           MOVE 'Assigned for investigation' TO WS-NOTES.

       13536-FRAUD-CHECK.
           IF WS-RECENT-CLAIMS > 2
              MOVE 'Y' TO WS-FRAUD-REVIEW
           END-IF
           IF WS-CLAIM-AMOUNT > WS-COVERAGE-AMOUNT * 0.8
              MOVE 'Y' TO WS-FRAUD-REVIEW
           END-IF.

       13540-ADJUDICATE-CLAIM.
           IF WS-CLAIM-STATUS NOT = 'DENIED'
              COMPUTE WS-APPROVED-AMOUNT = 
                 WS-CLAIM-AMOUNT - WS-DEDUCTIBLE
              IF WS-APPROVED-AMOUNT > WS-COVERAGE-AMOUNT
                 MOVE WS-COVERAGE-AMOUNT TO WS-APPROVED-AMOUNT
              END-IF
              MOVE 'APPROVED' TO WS-CLAIM-STATUS
           END-IF.

       13550-PROCESS-PAYMENT.
           IF WS-CLAIM-STATUS = 'APPROVED'
              PERFORM 13555-ISSUE-PAYMENT
              PERFORM 13560-UPDATE-CLAIM-RECORD
           END-IF.

       13555-ISSUE-PAYMENT.
           INITIALIZE WS-PAYMENT-RECORD
           MOVE WS-CLAIM-NUMBER TO PAY-REC-CLAIM
           MOVE WS-APPROVED-AMOUNT TO PAY-REC-AMOUNT
           MOVE FUNCTION CURRENT-DATE TO PAY-REC-DATE
           MOVE 'CHECK' TO PAY-REC-METHOD
           WRITE PAYMENT-RECORD FROM WS-PAYMENT-RECORD.

       13560-UPDATE-CLAIM-RECORD.
           MOVE 'PAID' TO WS-CLAIM-STATUS
           MOVE FUNCTION CURRENT-DATE TO WS-CLAIM-CLOSE-DATE
           REWRITE CLAIM-RECORD.

      *----------------------------------------------------------------*
      * PAYROLL PROCESSING PROCEDURES                                  *
      *----------------------------------------------------------------*
       14000-PAYROLL-PROCESSING.
           PERFORM 14100-LOAD-EMPLOYEE-DATA
           PERFORM 14200-CALCULATE-GROSS-PAY
           PERFORM 14300-CALCULATE-TAXES
           PERFORM 14400-CALCULATE-DEDUCTIONS
           PERFORM 14500-CALCULATE-NET-PAY
           PERFORM 14600-GENERATE-PAYSTUBS
           PERFORM 14700-PROCESS-DIRECT-DEPOSIT.

       14100-LOAD-EMPLOYEE-DATA.
           MOVE WS-EMPLOYEE-ID TO EMP-SEARCH-KEY
           READ EMPLOYEE-FILE INTO WS-EMPLOYEE-REC
              KEY IS EMP-ID
              INVALID KEY
                 MOVE 'EMPLOYEE NOT FOUND' TO WS-ERROR-MSG
                 PERFORM 2900-HANDLE-ERROR
           END-READ.

       14200-CALCULATE-GROSS-PAY.
           EVALUATE WS-PAY-TYPE
              WHEN 'SALARY'
                 PERFORM 14210-CALC-SALARY-PAY
              WHEN 'HOURLY'
                 PERFORM 14220-CALC-HOURLY-PAY
              WHEN 'COMMISSION'
                 PERFORM 14230-CALC-COMMISSION-PAY
           END-EVALUATE.

       14210-CALC-SALARY-PAY.
           COMPUTE WS-GROSS-PAY = 
              WS-ANNUAL-SALARY / WS-PAY-PERIODS.

       14220-CALC-HOURLY-PAY.
           IF WS-HOURS-WORKED <= 40
              COMPUTE WS-REGULAR-PAY = 
                 WS-HOURS-WORKED * WS-HOURLY-RATE
              MOVE ZEROES TO WS-OVERTIME-PAY
           ELSE
              COMPUTE WS-REGULAR-PAY = 40 * WS-HOURLY-RATE
              COMPUTE WS-OT-HOURS = WS-HOURS-WORKED - 40
              COMPUTE WS-OVERTIME-PAY = 
                 WS-OT-HOURS * WS-HOURLY-RATE * 1.5
           END-IF
           COMPUTE WS-GROSS-PAY = 
              WS-REGULAR-PAY + WS-OVERTIME-PAY.

       14230-CALC-COMMISSION-PAY.
           COMPUTE WS-BASE-PAY = 
              WS-BASE-SALARY / WS-PAY-PERIODS
           COMPUTE WS-COMMISSION-PAY = 
              WS-SALES-AMOUNT * WS-COMMISSION-RATE
           COMPUTE WS-GROSS-PAY = 
              WS-BASE-PAY + WS-COMMISSION-PAY.

       14300-CALCULATE-TAXES.
           PERFORM 14310-CALC-FEDERAL-TAX
           PERFORM 14320-CALC-STATE-TAX
           PERFORM 14330-CALC-LOCAL-TAX
           PERFORM 14340-CALC-FICA.

       14310-CALC-FEDERAL-TAX.
           COMPUTE WS-ANNUALIZED-GROSS = 
              WS-GROSS-PAY * WS-PAY-PERIODS
           COMPUTE WS-ALLOWANCE-AMOUNT = 
              WS-EXEMPTIONS * 4300
           COMPUTE WS-TAXABLE-INCOME = 
              WS-ANNUALIZED-GROSS - WS-ALLOWANCE-AMOUNT
           IF WS-TAXABLE-INCOME < 0
              MOVE ZEROES TO WS-TAXABLE-INCOME
           END-IF
           PERFORM 14315-APPLY-TAX-BRACKETS
           COMPUTE WS-FEDERAL-TAX = 
              WS-ANNUAL-TAX / WS-PAY-PERIODS.

       14315-APPLY-TAX-BRACKETS.
           MOVE ZEROES TO WS-ANNUAL-TAX
           IF STATUS-SINGLE
              PERFORM 14316-SINGLE-BRACKETS
           ELSE IF STATUS-MARRIED-JOINT
              PERFORM 14317-MARRIED-BRACKETS
           END-IF
           END-IF.

       14316-SINGLE-BRACKETS.
           EVALUATE TRUE
              WHEN WS-TAXABLE-INCOME <= 10275
                 COMPUTE WS-ANNUAL-TAX = 
                    WS-TAXABLE-INCOME * 0.10
              WHEN WS-TAXABLE-INCOME <= 41775
                 COMPUTE WS-ANNUAL-TAX = 1027.50 +
                    (WS-TAXABLE-INCOME - 10275) * 0.12
              WHEN WS-TAXABLE-INCOME <= 89075
                 COMPUTE WS-ANNUAL-TAX = 4807.50 +
                    (WS-TAXABLE-INCOME - 41775) * 0.22
              WHEN WS-TAXABLE-INCOME <= 170050
                 COMPUTE WS-ANNUAL-TAX = 15213.50 +
                    (WS-TAXABLE-INCOME - 89075) * 0.24
              WHEN WS-TAXABLE-INCOME <= 215950
                 COMPUTE WS-ANNUAL-TAX = 34647.50 +
                    (WS-TAXABLE-INCOME - 170050) * 0.32
              WHEN WS-TAXABLE-INCOME <= 539900
                 COMPUTE WS-ANNUAL-TAX = 49335.50 +
                    (WS-TAXABLE-INCOME - 215950) * 0.35
              WHEN OTHER
                 COMPUTE WS-ANNUAL-TAX = 162718.00 +
                    (WS-TAXABLE-INCOME - 539900) * 0.37
           END-EVALUATE.

       14317-MARRIED-BRACKETS.
           EVALUATE TRUE
              WHEN WS-TAXABLE-INCOME <= 20550
                 COMPUTE WS-ANNUAL-TAX = 
                    WS-TAXABLE-INCOME * 0.10
              WHEN WS-TAXABLE-INCOME <= 83550
                 COMPUTE WS-ANNUAL-TAX = 2055.00 +
                    (WS-TAXABLE-INCOME - 20550) * 0.12
              WHEN WS-TAXABLE-INCOME <= 178150
                 COMPUTE WS-ANNUAL-TAX = 9615.00 +
                    (WS-TAXABLE-INCOME - 83550) * 0.22
              WHEN WS-TAXABLE-INCOME <= 340100
                 COMPUTE WS-ANNUAL-TAX = 30427.00 +
                    (WS-TAXABLE-INCOME - 178150) * 0.24
              WHEN WS-TAXABLE-INCOME <= 431900
                 COMPUTE WS-ANNUAL-TAX = 69295.00 +
                    (WS-TAXABLE-INCOME - 340100) * 0.32
              WHEN WS-TAXABLE-INCOME <= 647850
                 COMPUTE WS-ANNUAL-TAX = 98671.00 +
                    (WS-TAXABLE-INCOME - 431900) * 0.35
              WHEN OTHER
                 COMPUTE WS-ANNUAL-TAX = 174253.50 +
                    (WS-TAXABLE-INCOME - 647850) * 0.37
           END-EVALUATE.

       14320-CALC-STATE-TAX.
           EVALUATE WS-STATE-CODE
              WHEN 'CA'
                 COMPUTE WS-STATE-TAX = 
                    WS-GROSS-PAY * 0.0725
              WHEN 'NY'
                 COMPUTE WS-STATE-TAX = 
                    WS-GROSS-PAY * 0.0685
              WHEN 'TX'
                 MOVE ZEROES TO WS-STATE-TAX
              WHEN 'FL'
                 MOVE ZEROES TO WS-STATE-TAX
              WHEN OTHER
                 COMPUTE WS-STATE-TAX = 
                    WS-GROSS-PAY * 0.05
           END-EVALUATE.

       14330-CALC-LOCAL-TAX.
           IF WS-LOCAL-TAX-RATE > 0
              COMPUTE WS-LOCAL-TAX = 
                 WS-GROSS-PAY * WS-LOCAL-TAX-RATE
           ELSE
              MOVE ZEROES TO WS-LOCAL-TAX
           END-IF.

       14340-CALC-FICA.
           IF WS-YTD-GROSS < 160200
              COMPUTE WS-REMAINING-CAP = 
                 160200 - WS-YTD-GROSS
              IF WS-GROSS-PAY <= WS-REMAINING-CAP
                 COMPUTE WS-FICA-SS = WS-GROSS-PAY * 0.062
              ELSE
                 COMPUTE WS-FICA-SS = WS-REMAINING-CAP * 0.062
              END-IF
           ELSE
              MOVE ZEROES TO WS-FICA-SS
           END-IF
           COMPUTE WS-FICA-MEDICARE = WS-GROSS-PAY * 0.0145
           IF WS-YTD-GROSS > 200000
              COMPUTE WS-ADDITIONAL-MEDICARE = 
                 WS-GROSS-PAY * 0.009
              ADD WS-ADDITIONAL-MEDICARE TO WS-FICA-MEDICARE
           END-IF.

       14400-CALCULATE-DEDUCTIONS.
           PERFORM 14410-CALC-PRE-TAX-DEDUCTIONS
           PERFORM 14420-CALC-POST-TAX-DEDUCTIONS.

       14410-CALC-PRE-TAX-DEDUCTIONS.
           IF WS-401K-PCT > 0
              COMPUTE WS-401K-CONTRIB = 
                 WS-GROSS-PAY * WS-401K-PCT / 100
              IF WS-YTD-401K + WS-401K-CONTRIB > 22500
                 COMPUTE WS-401K-CONTRIB = 
                    22500 - WS-YTD-401K
                 IF WS-401K-CONTRIB < 0
                    MOVE ZEROES TO WS-401K-CONTRIB
                 END-IF
              END-IF
           END-IF
           MOVE WS-HEALTH-INS-DEDUCT TO WS-HEALTH-INS
           MOVE WS-DENTAL-INS-DEDUCT TO WS-DENTAL-INS
           MOVE WS-VISION-INS-DEDUCT TO WS-VISION-INS
           MOVE WS-HSA-DEDUCT TO WS-HSA-CONTRIB
           MOVE WS-FSA-DEDUCT TO WS-FSA-CONTRIB.

       14420-CALC-POST-TAX-DEDUCTIONS.
           MOVE WS-LIFE-INS-DEDUCT TO WS-LIFE-INS
           MOVE WS-DISABILITY-DEDUCT TO WS-DISABILITY-INS
           MOVE WS-UNION-DUES-AMT TO WS-UNION-DUES
           MOVE WS-GARNISHMENT-AMT TO WS-GARNISHMENT.

       14500-CALCULATE-NET-PAY.
           COMPUTE WS-TOTAL-DEDUCTIONS = 
              WS-FEDERAL-TAX + WS-STATE-TAX + WS-LOCAL-TAX +
              WS-FICA-SS + WS-FICA-MEDICARE +
              WS-HEALTH-INS + WS-DENTAL-INS + WS-VISION-INS +
              WS-401K-CONTRIB + WS-HSA-CONTRIB + WS-FSA-CONTRIB +
              WS-LIFE-INS + WS-DISABILITY-INS +
              WS-UNION-DUES + WS-GARNISHMENT + WS-OTHER-DEDUCT
           COMPUTE WS-NET-PAY = 
              WS-GROSS-PAY - WS-TOTAL-DEDUCTIONS
           PERFORM 14550-UPDATE-YTD-TOTALS.

       14550-UPDATE-YTD-TOTALS.
           ADD WS-GROSS-PAY TO WS-YTD-GROSS
           ADD WS-FEDERAL-TAX TO WS-YTD-FED-TAX
           ADD WS-STATE-TAX TO WS-YTD-STATE-TAX
           ADD WS-FICA-SS TO WS-YTD-FICA
           ADD WS-FICA-MEDICARE TO WS-YTD-FICA
           ADD WS-NET-PAY TO WS-YTD-NET
           ADD WS-401K-CONTRIB TO WS-YTD-401K.

       14600-GENERATE-PAYSTUBS.
           INITIALIZE WS-PAYSTUB-RECORD
           MOVE WS-EMPLOYEE-ID TO STUB-EMP-ID
           MOVE WS-PAY-PERIOD TO STUB-PAY-PERIOD
           MOVE WS-GROSS-PAY TO STUB-GROSS
           MOVE WS-FEDERAL-TAX TO STUB-FED-TAX
           MOVE WS-STATE-TAX TO STUB-STATE-TAX
           MOVE WS-FICA-SS TO STUB-SS
           MOVE WS-FICA-MEDICARE TO STUB-MEDICARE
           MOVE WS-NET-PAY TO STUB-NET
           MOVE WS-YTD-GROSS TO STUB-YTD-GROSS
           MOVE WS-YTD-NET TO STUB-YTD-NET
           WRITE PAYSTUB-RECORD FROM WS-PAYSTUB-RECORD.

       14700-PROCESS-DIRECT-DEPOSIT.
           IF WS-DD-ENABLED = 'Y'
              PERFORM 14710-VALIDATE-BANK-INFO
              PERFORM 14720-CREATE-ACH-RECORD
           END-IF.

       14710-VALIDATE-BANK-INFO.
           IF WS-ROUTING-NUMBER = SPACES
              MOVE 'N' TO WS-DD-VALID
           ELSE IF WS-ACCOUNT-NUMBER = SPACES
              MOVE 'N' TO WS-DD-VALID
           ELSE
              MOVE 'Y' TO WS-DD-VALID
           END-IF
           END-IF.

       14720-CREATE-ACH-RECORD.
           IF WS-DD-VALID = 'Y'
              INITIALIZE WS-ACH-RECORD
              MOVE WS-ROUTING-NUMBER TO ACH-ROUTING
              MOVE WS-ACCOUNT-NUMBER TO ACH-ACCOUNT
              MOVE WS-NET-PAY TO ACH-AMOUNT
              MOVE WS-PAY-DATE TO ACH-DATE
              MOVE 'PAYROLL' TO ACH-DESC
              WRITE ACH-RECORD FROM WS-ACH-RECORD
           END-IF.

      *----------------------------------------------------------------*
      * NOTIFICATION PROCEDURES                                        *
      *----------------------------------------------------------------*
       15000-SEND-NOTIFICATION.
           EVALUATE WS-NOTIF-CHANNEL
              WHEN 'EMAIL'
                 PERFORM 15100-SEND-EMAIL
              WHEN 'SMS'
                 PERFORM 15200-SEND-SMS
              WHEN 'MAIL'
                 PERFORM 15300-GENERATE-LETTER
              WHEN 'PUSH'
                 PERFORM 15400-SEND-PUSH
           END-EVALUATE.

       15100-SEND-EMAIL.
           INITIALIZE WS-EMAIL-RECORD
           MOVE WS-NOTIF-RECIPIENT TO EMAIL-TO
           MOVE WS-NOTIF-SUBJECT TO EMAIL-SUBJECT
           MOVE WS-NOTIF-BODY TO EMAIL-BODY
           MOVE 'PENDING' TO EMAIL-STATUS
           WRITE EMAIL-RECORD FROM WS-EMAIL-RECORD.

       15200-SEND-SMS.
           INITIALIZE WS-SMS-RECORD
           MOVE WS-NOTIF-RECIPIENT TO SMS-PHONE
           MOVE WS-NOTIF-BODY(1:160) TO SMS-MESSAGE
           MOVE 'PENDING' TO SMS-STATUS
           WRITE SMS-RECORD FROM WS-SMS-RECORD.

       15300-GENERATE-LETTER.
           INITIALIZE WS-LETTER-RECORD
           MOVE WS-NOTIF-RECIPIENT TO LETTER-ADDRESS
           MOVE WS-NOTIF-SUBJECT TO LETTER-SUBJECT
           MOVE WS-NOTIF-BODY TO LETTER-BODY
           MOVE FUNCTION CURRENT-DATE TO LETTER-DATE
           WRITE LETTER-RECORD FROM WS-LETTER-RECORD.

       15400-SEND-PUSH.
           INITIALIZE WS-PUSH-RECORD
           MOVE WS-NOTIF-RECIPIENT TO PUSH-DEVICE-ID
           MOVE WS-NOTIF-SUBJECT TO PUSH-TITLE
           MOVE WS-NOTIF-BODY(1:200) TO PUSH-MESSAGE
           MOVE 'PENDING' TO PUSH-STATUS
           WRITE PUSH-RECORD FROM WS-PUSH-RECORD.


      *----------------------------------------------------------------*
      * COMPLIANCE AND REGULATORY PROCEDURES                          *
      *----------------------------------------------------------------*
       16000-COMPLIANCE-PROCESSING.
           PERFORM 16100-AML-SCREENING
           PERFORM 16200-KYC-VERIFICATION
           PERFORM 16300-SANCTIONS-CHECK
           PERFORM 16400-TRANSACTION-MONITORING
           PERFORM 16500-SUSPICIOUS-ACTIVITY-REPORT.

       16100-AML-SCREENING.
           MOVE FUNCTION CURRENT-DATE TO WS-SCREENING-DATE
           PERFORM 16110-SCREEN-AGAINST-WATCHLISTS
           PERFORM 16120-CALCULATE-MATCH-SCORE
           PERFORM 16130-DETERMINE-DISPOSITION.

       16110-SCREEN-AGAINST-WATCHLISTS.
           MOVE ZEROES TO WS-WATCHLIST-HITS
           PERFORM 16112-CHECK-OFAC-LIST
           PERFORM 16114-CHECK-PEP-LIST
           PERFORM 16116-CHECK-ADVERSE-MEDIA.

       16112-CHECK-OFAC-LIST.
           MOVE WS-CUSTOMER-NAME TO OFAC-SEARCH-NAME
           CALL 'OFACSRCH' USING OFAC-REQUEST OFAC-RESPONSE
           IF OFAC-MATCH-FOUND = 'Y'
              ADD 1 TO WS-WATCHLIST-HITS
              MOVE 'Y' TO WS-SANCTIONS-HIT
              MOVE OFAC-MATCH-SCORE TO WS-OFAC-SCORE
           END-IF.

       16114-CHECK-PEP-LIST.
           MOVE WS-CUSTOMER-NAME TO PEP-SEARCH-NAME
           CALL 'PEPSRCH' USING PEP-REQUEST PEP-RESPONSE
           IF PEP-MATCH-FOUND = 'Y'
              ADD 1 TO WS-WATCHLIST-HITS
              MOVE 'Y' TO WS-PEP-STATUS
              MOVE PEP-MATCH-SCORE TO WS-PEP-SCORE
           END-IF.

       16116-CHECK-ADVERSE-MEDIA.
           MOVE WS-CUSTOMER-NAME TO MEDIA-SEARCH-NAME
           CALL 'MEDIASRCH' USING MEDIA-REQUEST MEDIA-RESPONSE
           IF MEDIA-HITS-FOUND > 0
              ADD MEDIA-HITS-FOUND TO WS-WATCHLIST-HITS
           END-IF.

       16120-CALCULATE-MATCH-SCORE.
           IF WS-OFAC-SCORE > 0
              ADD WS-OFAC-SCORE TO WS-MATCH-SCORE
           END-IF
           IF WS-PEP-SCORE > 0
              ADD WS-PEP-SCORE TO WS-MATCH-SCORE
           END-IF
           COMPUTE WS-MATCH-SCORE = 
              WS-MATCH-SCORE / WS-WATCHLIST-HITS.

       16130-DETERMINE-DISPOSITION.
           EVALUATE TRUE
              WHEN WS-MATCH-SCORE >= 90
                 MOVE 'CONFIRMED' TO WS-MATCH-TYPE
                 MOVE 'Y' TO WS-SAR-REQUIRED
              WHEN WS-MATCH-SCORE >= 75
                 MOVE 'POTENTIAL' TO WS-MATCH-TYPE
                 MOVE 'REVIEW' TO WS-CASE-STATUS
              WHEN WS-MATCH-SCORE >= 50
                 MOVE 'WEAK' TO WS-MATCH-TYPE
                 MOVE 'CLEARED' TO WS-CASE-STATUS
              WHEN OTHER
                 MOVE 'FALSE POSITIVE' TO WS-MATCH-TYPE
                 MOVE 'CLEARED' TO WS-CASE-STATUS
           END-EVALUATE.

       16200-KYC-VERIFICATION.
           PERFORM 16210-VERIFY-IDENTITY
           PERFORM 16220-VERIFY-ADDRESS
           PERFORM 16230-VERIFY-DOCUMENTS
           PERFORM 16240-DETERMINE-KYC-STATUS.

       16210-VERIFY-IDENTITY.
           MOVE WS-CUSTOMER-SSN TO ID-VERIFY-SSN
           MOVE WS-CUSTOMER-DOB TO ID-VERIFY-DOB
           MOVE WS-CUSTOMER-NAME TO ID-VERIFY-NAME
           CALL 'IDVERIFY' USING ID-REQUEST ID-RESPONSE
           IF ID-VERIFIED = 'Y'
              MOVE 'VERIFIED' TO WS-ID-STATUS
           ELSE
              MOVE 'FAILED' TO WS-ID-STATUS
           END-IF.

       16220-VERIFY-ADDRESS.
           MOVE WS-CUSTOMER-ADDRESS TO ADDR-VERIFY-INPUT
           CALL 'ADDRVERIFY' USING ADDR-REQUEST ADDR-RESPONSE
           IF ADDR-VERIFIED = 'Y'
              MOVE 'VERIFIED' TO WS-ADDR-STATUS
           ELSE
              MOVE 'UNVERIFIED' TO WS-ADDR-STATUS
           END-IF.

       16230-VERIFY-DOCUMENTS.
           IF WS-DOC-TYPE = 'PASSPORT'
              PERFORM 16232-VERIFY-PASSPORT
           ELSE IF WS-DOC-TYPE = 'LICENSE'
              PERFORM 16234-VERIFY-LICENSE
           ELSE
              PERFORM 16236-VERIFY-OTHER-DOC
           END-IF
           END-IF.

       16232-VERIFY-PASSPORT.
           MOVE WS-PASSPORT-NUMBER TO PASSPORT-VERIFY-NUM
           MOVE WS-PASSPORT-COUNTRY TO PASSPORT-VERIFY-COUNTRY
           CALL 'PASSVERIFY' USING PASSPORT-REQ PASSPORT-RESP
           IF PASSPORT-VALID = 'Y'
              MOVE 'VERIFIED' TO WS-DOC-STATUS
           ELSE
              MOVE 'INVALID' TO WS-DOC-STATUS
           END-IF.

       16234-VERIFY-LICENSE.
           MOVE WS-LICENSE-NUMBER TO LICENSE-VERIFY-NUM
           MOVE WS-LICENSE-STATE TO LICENSE-VERIFY-STATE
           CALL 'LICVERIFY' USING LICENSE-REQ LICENSE-RESP
           IF LICENSE-VALID = 'Y'
              MOVE 'VERIFIED' TO WS-DOC-STATUS
           ELSE
              MOVE 'INVALID' TO WS-DOC-STATUS
           END-IF.

       16236-VERIFY-OTHER-DOC.
           MOVE 'MANUAL REVIEW' TO WS-DOC-STATUS.

       16240-DETERMINE-KYC-STATUS.
           IF WS-ID-STATUS = 'VERIFIED' AND
              WS-ADDR-STATUS = 'VERIFIED' AND
              WS-DOC-STATUS = 'VERIFIED'
              MOVE 'APPROVED' TO WS-KYC-STATUS
           ELSE
              MOVE 'PENDING' TO WS-KYC-STATUS
           END-IF.

       16300-SANCTIONS-CHECK.
           IF WS-SANCTIONS-HIT = 'Y'
              PERFORM 16310-ESCALATE-TO-COMPLIANCE
              PERFORM 16320-FREEZE-ACCOUNT
           END-IF.

       16310-ESCALATE-TO-COMPLIANCE.
           INITIALIZE WS-ESCALATION-RECORD
           MOVE 'SANCTIONS HIT' TO ESC-REASON
           MOVE WS-CUSTOMER-ID TO ESC-CUSTOMER
           MOVE FUNCTION CURRENT-DATE TO ESC-DATE
           MOVE 'URGENT' TO ESC-PRIORITY
           WRITE ESCALATION-RECORD FROM WS-ESCALATION-RECORD.

       16320-FREEZE-ACCOUNT.
           MOVE 'F' TO WS-ACCOUNT-STATUS
           MOVE 'SANCTIONS FREEZE' TO WS-FREEZE-REASON
           REWRITE ACCOUNT-RECORD.

       16400-TRANSACTION-MONITORING.
           PERFORM 16410-CHECK-VELOCITY
           PERFORM 16420-CHECK-PATTERNS
           PERFORM 16430-CHECK-HIGH-RISK
           PERFORM 16440-CALCULATE-RISK-SCORE.

       16410-CHECK-VELOCITY.
           IF WS-DAILY-TRANS-COUNT > WS-VELOCITY-THRESHOLD
              MOVE 'Y' TO WS-VELOCITY-FLAG
              ADD 20 TO WS-FRAUD-SCORE
           END-IF
           IF WS-DAILY-TRANS-AMOUNT > WS-AMOUNT-THRESHOLD
              MOVE 'Y' TO WS-AMOUNT-FLAG
              ADD 20 TO WS-FRAUD-SCORE
           END-IF.

       16420-CHECK-PATTERNS.
           IF WS-ROUND-AMOUNT-COUNT > 5
              MOVE 'Y' TO WS-PATTERN-FLAG
              ADD 15 TO WS-FRAUD-SCORE
           END-IF
           IF WS-STRUCTURING-DETECTED = 'Y'
              MOVE 'Y' TO WS-PATTERN-FLAG
              ADD 30 TO WS-FRAUD-SCORE
           END-IF.

       16430-CHECK-HIGH-RISK.
           IF WS-HIGH-RISK-COUNTRY = 'Y'
              MOVE 'Y' TO WS-LOCATION-FLAG
              ADD 25 TO WS-FRAUD-SCORE
           END-IF
           IF WS-NEW-DEVICE = 'Y'
              MOVE 'Y' TO WS-DEVICE-FLAG
              ADD 10 TO WS-FRAUD-SCORE
           END-IF.

       16440-CALCULATE-RISK-SCORE.
           EVALUATE TRUE
              WHEN WS-FRAUD-SCORE >= 80
                 MOVE 'BLOCK' TO WS-FRAUD-DECISION
                 MOVE 'Y' TO WS-MANUAL-REVIEW
              WHEN WS-FRAUD-SCORE >= 60
                 MOVE 'REVIEW' TO WS-FRAUD-DECISION
                 MOVE 'Y' TO WS-MANUAL-REVIEW
              WHEN WS-FRAUD-SCORE >= 40
                 MOVE 'MONITOR' TO WS-FRAUD-DECISION
              WHEN OTHER
                 MOVE 'APPROVE' TO WS-FRAUD-DECISION
           END-EVALUATE.

       16500-SUSPICIOUS-ACTIVITY-REPORT.
           IF WS-SAR-REQUIRED = 'Y'
              PERFORM 16510-GATHER-SAR-DATA
              PERFORM 16520-GENERATE-SAR
              PERFORM 16530-FILE-SAR
           END-IF.

       16510-GATHER-SAR-DATA.
           MOVE WS-CUSTOMER-NAME TO SAR-SUBJECT-NAME
           MOVE WS-CUSTOMER-ADDRESS TO SAR-SUBJECT-ADDR
           MOVE WS-CUSTOMER-SSN TO SAR-SUBJECT-SSN
           MOVE WS-TRANSACTION-AMOUNT TO SAR-AMOUNT
           MOVE FUNCTION CURRENT-DATE TO SAR-ACTIVITY-DATE.

       16520-GENERATE-SAR.
           INITIALIZE WS-SAR-RECORD
           MOVE SAR-SUBJECT-NAME TO SAR-REC-NAME
           MOVE SAR-SUBJECT-ADDR TO SAR-REC-ADDR
           MOVE SAR-AMOUNT TO SAR-REC-AMOUNT
           MOVE SAR-ACTIVITY-DATE TO SAR-REC-DATE
           MOVE 'SUSPICIOUS PATTERN DETECTED' TO SAR-REC-NARRATIVE.

       16530-FILE-SAR.
           MOVE 'PENDING' TO SAR-STATUS
           WRITE SAR-RECORD FROM WS-SAR-RECORD.

      *----------------------------------------------------------------*
      * CUSTOMER SERVICE PROCEDURES                                    *
      *----------------------------------------------------------------*
       17000-CUSTOMER-SERVICE.
           PERFORM 17100-CREATE-CASE
           PERFORM 17200-ROUTE-CASE
           PERFORM 17300-PROCESS-CASE
           PERFORM 17400-RESOLVE-CASE
           PERFORM 17500-FOLLOW-UP.

       17100-CREATE-CASE.
           PERFORM 17110-GENERATE-CASE-ID
           MOVE FUNCTION CURRENT-DATE TO WS-OPEN-DATE
           MOVE 'OPEN' TO WS-CASE-STATUS
           PERFORM 17120-CATEGORIZE-CASE.

       17110-GENERATE-CASE-ID.
           MOVE FUNCTION CURRENT-DATE TO WS-DATE-PART
           COMPUTE WS-RANDOM-PART = FUNCTION RANDOM * 99999
           STRING 'CS' DELIMITED SIZE
                  WS-DATE-PART DELIMITED SIZE
                  WS-RANDOM-PART DELIMITED SIZE
              INTO WS-CASE-ID.

       17120-CATEGORIZE-CASE.
           EVALUATE WS-CASE-TYPE
              WHEN 'BILLING INQUIRY'
                 MOVE 2 TO WS-CASE-PRIORITY
              WHEN 'FRAUD REPORT'
                 MOVE 1 TO WS-CASE-PRIORITY
              WHEN 'ACCOUNT ACCESS'
                 MOVE 1 TO WS-CASE-PRIORITY
              WHEN 'GENERAL INQUIRY'
                 MOVE 3 TO WS-CASE-PRIORITY
              WHEN OTHER
                 MOVE 3 TO WS-CASE-PRIORITY
           END-EVALUATE
           COMPUTE WS-TARGET-DATE = 
              FUNCTION INTEGER-OF-DATE(WS-OPEN-DATE) +
              WS-CASE-PRIORITY * 2.

       17200-ROUTE-CASE.
           EVALUATE WS-CASE-TYPE
              WHEN 'BILLING INQUIRY'
                 MOVE 'BILLING' TO WS-QUEUE
              WHEN 'FRAUD REPORT'
                 MOVE 'FRAUD' TO WS-QUEUE
              WHEN 'ACCOUNT ACCESS'
                 MOVE 'SECURITY' TO WS-QUEUE
              WHEN 'LOAN INQUIRY'
                 MOVE 'LENDING' TO WS-QUEUE
              WHEN OTHER
                 MOVE 'GENERAL' TO WS-QUEUE
           END-EVALUATE
           PERFORM 17210-ASSIGN-AGENT.

       17210-ASSIGN-AGENT.
           CALL 'ROUTECASE' USING WS-QUEUE WS-ASSIGNED-AGENT
           IF WS-ASSIGNED-AGENT = SPACES
              MOVE 'UNASSIGNED' TO WS-CASE-STATUS
           ELSE
              MOVE 'ASSIGNED' TO WS-CASE-STATUS
           END-IF.

       17300-PROCESS-CASE.
           PERFORM 17310-LOG-INTERACTION
           PERFORM 17320-RESEARCH-ISSUE
           PERFORM 17330-DETERMINE-RESOLUTION.

       17310-LOG-INTERACTION.
           ADD 1 TO WS-INTERACTION-COUNT
           MOVE FUNCTION CURRENT-DATE 
              TO INT-DATE(WS-INTERACTION-COUNT)
           MOVE FUNCTION CURRENT-TIME
              TO INT-TIME(WS-INTERACTION-COUNT)
           MOVE WS-CHANNEL TO INT-CHANNEL(WS-INTERACTION-COUNT)
           MOVE WS-ASSIGNED-AGENT 
              TO INT-AGENT(WS-INTERACTION-COUNT).

       17320-RESEARCH-ISSUE.
           PERFORM 17322-PULL-ACCOUNT-HISTORY
           PERFORM 17324-CHECK-PREVIOUS-CASES
           PERFORM 17326-REVIEW-NOTES.

       17322-PULL-ACCOUNT-HISTORY.
           MOVE WS-CUSTOMER-ACCOUNT TO HIST-SEARCH-KEY
           READ HISTORY-FILE INTO WS-ACCOUNT-HISTORY
              KEY IS HIST-ACCOUNT
              INVALID KEY
                 MOVE 'NO HISTORY FOUND' TO WS-RESEARCH-NOTES
           END-READ.

       17324-CHECK-PREVIOUS-CASES.
           MOVE WS-CUSTOMER-ID TO CASE-SEARCH-KEY
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ CASE-FILE INTO WS-PREVIOUS-CASE
                 KEY IS CASE-CUSTOMER
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    ADD 1 TO WS-PREVIOUS-CASE-COUNT
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       17326-REVIEW-NOTES.
           IF WS-PREVIOUS-CASE-COUNT > 0
              MOVE 'REPEAT CALLER' TO WS-CALLER-TYPE
           ELSE
              MOVE 'FIRST CONTACT' TO WS-CALLER-TYPE
           END-IF.

       17330-DETERMINE-RESOLUTION.
           EVALUATE WS-CASE-TYPE
              WHEN 'BILLING INQUIRY'
                 PERFORM 17332-RESOLVE-BILLING
              WHEN 'FRAUD REPORT'
                 PERFORM 17334-RESOLVE-FRAUD
              WHEN 'ACCOUNT ACCESS'
                 PERFORM 17336-RESOLVE-ACCESS
              WHEN OTHER
                 PERFORM 17338-RESOLVE-GENERAL
           END-EVALUATE.

       17332-RESOLVE-BILLING.
           IF WS-BILLING-ERROR = 'Y'
              PERFORM 17333-ISSUE-CREDIT
              MOVE 'CREDIT ISSUED' TO WS-RESOLUTION-CODE
           ELSE
              MOVE 'NO ACTION NEEDED' TO WS-RESOLUTION-CODE
           END-IF.

       17333-ISSUE-CREDIT.
           INITIALIZE WS-CREDIT-RECORD
           MOVE WS-CUSTOMER-ACCOUNT TO CREDIT-ACCOUNT
           MOVE WS-CREDIT-AMOUNT TO CREDIT-AMOUNT
           MOVE 'BILLING ADJUSTMENT' TO CREDIT-REASON
           WRITE CREDIT-RECORD FROM WS-CREDIT-RECORD.

       17334-RESOLVE-FRAUD.
           MOVE 'Y' TO WS-FRAUD-CASE
           PERFORM 16320-FREEZE-ACCOUNT
           PERFORM 17335-ISSUE-NEW-CARD
           MOVE 'FRAUD REMEDIATED' TO WS-RESOLUTION-CODE.

       17335-ISSUE-NEW-CARD.
           INITIALIZE WS-CARD-REQUEST
           MOVE WS-CUSTOMER-ACCOUNT TO CARD-REQ-ACCOUNT
           MOVE 'REPLACEMENT' TO CARD-REQ-TYPE
           MOVE 'Y' TO CARD-REQ-EXPEDITE
           WRITE CARD-REQUEST FROM WS-CARD-REQUEST.

       17336-RESOLVE-ACCESS.
           PERFORM 17337-RESET-CREDENTIALS
           MOVE 'ACCESS RESTORED' TO WS-RESOLUTION-CODE.

       17337-RESET-CREDENTIALS.
           INITIALIZE WS-RESET-REQUEST
           MOVE WS-CUSTOMER-ID TO RESET-CUSTOMER
           MOVE 'TEMP-PASSWORD' TO RESET-TYPE
           CALL 'RESETPWD' USING WS-RESET-REQUEST WS-RESET-RESP.

       17338-RESOLVE-GENERAL.
           MOVE 'INFORMATION PROVIDED' TO WS-RESOLUTION-CODE.

       17400-RESOLVE-CASE.
           MOVE 'RESOLVED' TO WS-CASE-STATUS
           MOVE FUNCTION CURRENT-DATE TO WS-CLOSE-DATE
           PERFORM 17410-UPDATE-CASE-RECORD
           PERFORM 17420-SEND-SURVEY.

       17410-UPDATE-CASE-RECORD.
           INITIALIZE WS-CASE-UPDATE
           MOVE WS-CASE-ID TO CASE-UPD-ID
           MOVE WS-CASE-STATUS TO CASE-UPD-STATUS
           MOVE WS-RESOLUTION-CODE TO CASE-UPD-RESOLUTION
           MOVE WS-CLOSE-DATE TO CASE-UPD-CLOSE-DATE
           REWRITE CASE-RECORD FROM WS-CASE-UPDATE.

       17420-SEND-SURVEY.
           MOVE 'SURVEY' TO WS-NOTIF-TYPE
           MOVE 'EMAIL' TO WS-NOTIF-CHANNEL
           MOVE 'How was your experience?' TO WS-NOTIF-SUBJECT
           PERFORM 15000-SEND-NOTIFICATION.

       17500-FOLLOW-UP.
           IF WS-FOLLOW-UP-REQUIRED = 'Y'
              PERFORM 17510-SCHEDULE-CALLBACK
           END-IF.

       17510-SCHEDULE-CALLBACK.
           INITIALIZE WS-CALLBACK-RECORD
           MOVE WS-CASE-ID TO CALLBACK-CASE
           MOVE WS-CUSTOMER-PHONE TO CALLBACK-PHONE
           COMPUTE WS-CALLBACK-DATE = 
              FUNCTION INTEGER-OF-DATE(WS-CLOSE-DATE) + 3
           MOVE WS-CALLBACK-DATE TO CALLBACK-DATE
           WRITE CALLBACK-RECORD FROM WS-CALLBACK-RECORD.

      *----------------------------------------------------------------*
      * DOCUMENT MANAGEMENT PROCEDURES                                 *
      *----------------------------------------------------------------*
       18000-DOCUMENT-MANAGEMENT.
           PERFORM 18100-INGEST-DOCUMENT
           PERFORM 18200-CLASSIFY-DOCUMENT
           PERFORM 18300-EXTRACT-DATA
           PERFORM 18400-STORE-DOCUMENT
           PERFORM 18500-APPLY-RETENTION.

       18100-INGEST-DOCUMENT.
           PERFORM 18110-GENERATE-DOC-ID
           MOVE FUNCTION CURRENT-DATE TO WS-DOC-CREATED-DATE
           MOVE WS-USER-ID TO WS-DOC-CREATED-BY
           MOVE 'INGESTED' TO WS-DOC-STATUS.

       18110-GENERATE-DOC-ID.
           MOVE FUNCTION CURRENT-DATE TO WS-DATE-PART
           COMPUTE WS-RANDOM-PART = FUNCTION RANDOM * 999999
           STRING 'DOC' DELIMITED SIZE
                  WS-DATE-PART DELIMITED SIZE
                  WS-RANDOM-PART DELIMITED SIZE
              INTO WS-DOC-ID.

       18200-CLASSIFY-DOCUMENT.
           EVALUATE WS-DOC-CONTENT-TYPE
              WHEN 'STATEMENT'
                 MOVE 'ACCOUNT-DOCS' TO WS-DOC-CLASSIFICATION
              WHEN 'TAX-FORM'
                 MOVE 'TAX-DOCS' TO WS-DOC-CLASSIFICATION
              WHEN 'CONTRACT'
                 MOVE 'LEGAL-DOCS' TO WS-DOC-CLASSIFICATION
              WHEN 'ID-DOCUMENT'
                 MOVE 'KYC-DOCS' TO WS-DOC-CLASSIFICATION
              WHEN OTHER
                 MOVE 'GENERAL-DOCS' TO WS-DOC-CLASSIFICATION
           END-EVALUATE.

       18300-EXTRACT-DATA.
           IF WS-DOC-TYPE = 'PDF'
              CALL 'PDFEXTRACT' USING WS-DOC-ID WS-EXTRACTED-DATA
           ELSE IF WS-DOC-TYPE = 'IMAGE'
              CALL 'OCREXTRACT' USING WS-DOC-ID WS-EXTRACTED-DATA
           END-IF
           END-IF.

       18400-STORE-DOCUMENT.
           INITIALIZE WS-STORAGE-REQUEST
           MOVE WS-DOC-ID TO STORE-DOC-ID
           MOVE WS-DOC-CLASSIFICATION TO STORE-BUCKET
           MOVE WS-DOC-SIZE-KB TO STORE-SIZE
           CALL 'DOCSTORAGE' USING WS-STORAGE-REQUEST 
              WS-STORAGE-RESPONSE
           IF STORE-STATUS = 'SUCCESS'
              MOVE 'STORED' TO WS-DOC-STATUS
              MOVE STORE-CHECKSUM TO WS-DOC-CHECKSUM
           ELSE
              MOVE 'FAILED' TO WS-DOC-STATUS
           END-IF.

       18500-APPLY-RETENTION.
           EVALUATE WS-DOC-CLASSIFICATION
              WHEN 'TAX-DOCS'
                 COMPUTE WS-RETENTION-YEARS = 7
              WHEN 'LEGAL-DOCS'
                 COMPUTE WS-RETENTION-YEARS = 10
              WHEN 'KYC-DOCS'
                 COMPUTE WS-RETENTION-YEARS = 5
              WHEN OTHER
                 COMPUTE WS-RETENTION-YEARS = 3
           END-EVALUATE
           COMPUTE WS-DOC-RETENTION-DATE = 
              WS-DOC-CREATED-DATE + 
              (WS-RETENTION-YEARS * 10000).

      *----------------------------------------------------------------*
      * WORKFLOW PROCESSING PROCEDURES                                 *
      *----------------------------------------------------------------*
       19000-WORKFLOW-PROCESSING.
           PERFORM 19100-INITIALIZE-WORKFLOW
           PERFORM 19200-EXECUTE-STEPS
           PERFORM 19300-MONITOR-PROGRESS
           PERFORM 19400-COMPLETE-WORKFLOW.

       19100-INITIALIZE-WORKFLOW.
           PERFORM 19110-GENERATE-WORKFLOW-ID
           MOVE 'INITIATED' TO WS-WORKFLOW-STATUS
           MOVE 1 TO WS-CURRENT-STEP
           MOVE FUNCTION CURRENT-DATE TO WS-WORKFLOW-START.

       19110-GENERATE-WORKFLOW-ID.
           MOVE FUNCTION CURRENT-DATE TO WS-DATE-PART
           COMPUTE WS-RANDOM-PART = FUNCTION RANDOM * 99999
           STRING 'WF' DELIMITED SIZE
                  WS-DATE-PART DELIMITED SIZE
                  WS-RANDOM-PART DELIMITED SIZE
              INTO WS-WORKFLOW-ID.

       19200-EXECUTE-STEPS.
           PERFORM UNTIL WS-CURRENT-STEP > WS-TOTAL-STEPS
                      OR WS-WORKFLOW-STATUS = 'FAILED'
              PERFORM 19210-EXECUTE-CURRENT-STEP
              ADD 1 TO WS-CURRENT-STEP
           END-PERFORM.

       19210-EXECUTE-CURRENT-STEP.
           MOVE FUNCTION CURRENT-DATE 
              TO STEP-START-DATE(WS-CURRENT-STEP)
           MOVE 'IN-PROGRESS' TO STEP-STATUS(WS-CURRENT-STEP)
           EVALUATE STEP-NAME(WS-CURRENT-STEP)
              WHEN 'VALIDATION'
                 PERFORM 19220-VALIDATION-STEP
              WHEN 'APPROVAL'
                 PERFORM 19230-APPROVAL-STEP
              WHEN 'PROCESSING'
                 PERFORM 19240-PROCESSING-STEP
              WHEN 'NOTIFICATION'
                 PERFORM 19250-NOTIFICATION-STEP
              WHEN OTHER
                 PERFORM 19260-GENERIC-STEP
           END-EVALUATE
           MOVE FUNCTION CURRENT-DATE 
              TO STEP-END-DATE(WS-CURRENT-STEP).

       19220-VALIDATION-STEP.
           IF WS-VALIDATION-PASSED = 'Y'
              MOVE 'COMPLETED' TO STEP-STATUS(WS-CURRENT-STEP)
              MOVE 'VALIDATED' TO STEP-OUTCOME(WS-CURRENT-STEP)
           ELSE
              MOVE 'FAILED' TO STEP-STATUS(WS-CURRENT-STEP)
              MOVE 'VALIDATION FAILED' 
                 TO STEP-OUTCOME(WS-CURRENT-STEP)
              MOVE 'FAILED' TO WS-WORKFLOW-STATUS
           END-IF.

       19230-APPROVAL-STEP.
           IF WS-APPROVAL-RECEIVED = 'Y'
              MOVE 'COMPLETED' TO STEP-STATUS(WS-CURRENT-STEP)
              MOVE 'APPROVED' TO STEP-OUTCOME(WS-CURRENT-STEP)
           ELSE IF WS-REJECTION-RECEIVED = 'Y'
              MOVE 'COMPLETED' TO STEP-STATUS(WS-CURRENT-STEP)
              MOVE 'REJECTED' TO STEP-OUTCOME(WS-CURRENT-STEP)
              MOVE 'FAILED' TO WS-WORKFLOW-STATUS
           ELSE
              MOVE 'PENDING' TO STEP-STATUS(WS-CURRENT-STEP)
              SUBTRACT 1 FROM WS-CURRENT-STEP
           END-IF
           END-IF.

       19240-PROCESSING-STEP.
           MOVE 'COMPLETED' TO STEP-STATUS(WS-CURRENT-STEP)
           MOVE 'PROCESSED' TO STEP-OUTCOME(WS-CURRENT-STEP).

       19250-NOTIFICATION-STEP.
           PERFORM 15000-SEND-NOTIFICATION
           MOVE 'COMPLETED' TO STEP-STATUS(WS-CURRENT-STEP)
           MOVE 'NOTIFIED' TO STEP-OUTCOME(WS-CURRENT-STEP).

       19260-GENERIC-STEP.
           MOVE 'COMPLETED' TO STEP-STATUS(WS-CURRENT-STEP)
           MOVE 'DONE' TO STEP-OUTCOME(WS-CURRENT-STEP).

       19300-MONITOR-PROGRESS.
           COMPUTE WS-COMPLETION-PCT = 
              (WS-CURRENT-STEP / WS-TOTAL-STEPS) * 100
           IF WS-COMPLETION-PCT >= 100
              MOVE 'COMPLETED' TO WS-WORKFLOW-STATUS
           END-IF.

       19400-COMPLETE-WORKFLOW.
           MOVE FUNCTION CURRENT-DATE TO WS-WORKFLOW-END
           COMPUTE WS-WORKFLOW-DURATION = 
              FUNCTION INTEGER-OF-DATE(WS-WORKFLOW-END) -
              FUNCTION INTEGER-OF-DATE(WS-WORKFLOW-START)
           PERFORM 19410-RECORD-WORKFLOW-METRICS.

       19410-RECORD-WORKFLOW-METRICS.
           INITIALIZE WS-METRICS-RECORD
           MOVE WS-WORKFLOW-ID TO METRICS-WORKFLOW-ID
           MOVE WS-WORKFLOW-TYPE TO METRICS-TYPE
           MOVE WS-WORKFLOW-STATUS TO METRICS-STATUS
           MOVE WS-WORKFLOW-DURATION TO METRICS-DURATION
           WRITE METRICS-RECORD FROM WS-METRICS-RECORD.

      *----------------------------------------------------------------*
      * BATCH JOB SCHEDULING PROCEDURES                                *
      *----------------------------------------------------------------*
       20000-BATCH-SCHEDULING.
           PERFORM 20100-LOAD-SCHEDULE
           PERFORM 20200-CHECK-DEPENDENCIES
           PERFORM 20300-EXECUTE-BATCH
           PERFORM 20400-LOG-RESULTS.

       20100-LOAD-SCHEDULE.
           MOVE WS-SCHEDULE-ID TO SCHED-SEARCH-KEY
           READ SCHEDULE-FILE INTO WS-SCHEDULE-REC
              KEY IS SCHED-ID
              INVALID KEY
                 MOVE 'SCHEDULE NOT FOUND' TO WS-ERROR-MSG
                 PERFORM 2900-HANDLE-ERROR
           END-READ.

       20200-CHECK-DEPENDENCIES.
           MOVE 'Y' TO WS-DEPS-MET
           PERFORM VARYING WS-DEP-IDX FROM 1 BY 1
              UNTIL WS-DEP-IDX > 10
              IF DEP-JOB-ID(WS-DEP-IDX) NOT = SPACES
                 PERFORM 20210-CHECK-SINGLE-DEP
              END-IF
           END-PERFORM.

       20210-CHECK-SINGLE-DEP.
           MOVE DEP-JOB-ID(WS-DEP-IDX) TO JOB-SEARCH-KEY
           READ JOB-STATUS-FILE INTO WS-JOB-STATUS-REC
              KEY IS JOB-ID
              INVALID KEY
                 MOVE 'N' TO WS-DEPS-MET
              NOT INVALID KEY
                 IF JOB-LAST-STATUS NOT = DEP-STATUS-REQ(WS-DEP-IDX)
                    MOVE 'N' TO WS-DEPS-MET
                 END-IF
           END-READ.

       20300-EXECUTE-BATCH.
           IF WS-DEPS-MET = 'Y'
              MOVE FUNCTION CURRENT-DATE TO WS-BATCH-START-TIME
              MOVE 'RUNNING' TO WS-BATCH-STATUS
              PERFORM 20310-RUN-BATCH-PROCESS
              MOVE FUNCTION CURRENT-DATE TO WS-BATCH-END-TIME
           ELSE
              MOVE 'WAITING' TO WS-BATCH-STATUS
           END-IF.

       20310-RUN-BATCH-PROCESS.
           EVALUATE WS-BATCH-TYPE
              WHEN 'DAILY-INTEREST'
                 PERFORM 7000-INTEREST-CALCULATION
              WHEN 'MONTHLY-FEES'
                 PERFORM 8000-FEE-PROCESSING
              WHEN 'STATEMENT-GEN'
                 PERFORM 4000-REPORTING
              WHEN 'EOD-PROCESSING'
                 PERFORM 2000-PROCESS-TRANSACTIONS
              WHEN OTHER
                 MOVE 'UNKNOWN BATCH TYPE' TO WS-BATCH-ERROR-MSG
                 MOVE 'FAILED' TO WS-BATCH-STATUS
           END-EVALUATE.

       20400-LOG-RESULTS.
           INITIALIZE WS-BATCH-LOG
           MOVE WS-BATCH-ID TO LOG-BATCH-ID
           MOVE WS-BATCH-STATUS TO LOG-STATUS
           MOVE WS-BATCH-START-TIME TO LOG-START
           MOVE WS-BATCH-END-TIME TO LOG-END
           MOVE WS-RECORDS-PROCESSED TO LOG-RECORDS
           MOVE WS-BATCH-RETURN-CODE TO LOG-RC
           WRITE BATCH-LOG-RECORD FROM WS-BATCH-LOG
           PERFORM 20410-UPDATE-SCHEDULE.

       20410-UPDATE-SCHEDULE.
           MOVE WS-BATCH-STATUS TO WS-LAST-RUN-STATUS
           MOVE WS-BATCH-END-TIME TO WS-LAST-RUN-DATE
           PERFORM 20420-CALCULATE-NEXT-RUN
           REWRITE SCHEDULE-RECORD FROM WS-SCHEDULE-REC.

       20420-CALCULATE-NEXT-RUN.
           EVALUATE WS-SCHEDULE-FREQ
              WHEN 'DAILY'
                 COMPUTE WS-NEXT-RUN-DATE = 
                    FUNCTION INTEGER-OF-DATE(WS-LAST-RUN-DATE) + 1
              WHEN 'WEEKLY'
                 COMPUTE WS-NEXT-RUN-DATE = 
                    FUNCTION INTEGER-OF-DATE(WS-LAST-RUN-DATE) + 7
              WHEN 'MONTHLY'
                 COMPUTE WS-NEXT-RUN-DATE = 
                    FUNCTION INTEGER-OF-DATE(WS-LAST-RUN-DATE) + 30
              WHEN 'QUARTERLY'
                 COMPUTE WS-NEXT-RUN-DATE = 
                    FUNCTION INTEGER-OF-DATE(WS-LAST-RUN-DATE) + 90
              WHEN 'YEARLY'
                 COMPUTE WS-NEXT-RUN-DATE = 
                    FUNCTION INTEGER-OF-DATE(WS-LAST-RUN-DATE) + 365
           END-EVALUATE.


      *----------------------------------------------------------------*
      * DATA ANALYTICS AND REPORTING PROCEDURES                       *
      *----------------------------------------------------------------*
       21000-DATA-ANALYTICS.
           PERFORM 21100-COLLECT-METRICS
           PERFORM 21200-AGGREGATE-DATA
           PERFORM 21300-CALCULATE-KPI
           PERFORM 21400-GENERATE-DASHBOARD
           PERFORM 21500-EXPORT-DATA.

       21100-COLLECT-METRICS.
           PERFORM 21110-COLLECT-TRANSACTION-METRICS
           PERFORM 21120-COLLECT-CUSTOMER-METRICS
           PERFORM 21130-COLLECT-PERFORMANCE-METRICS.

       21110-COLLECT-TRANSACTION-METRICS.
           MOVE ZEROES TO WS-TOTAL-TRANS-AMOUNT
           MOVE ZEROES TO WS-TOTAL-TRANS-COUNT
           MOVE ZEROES TO WS-AVG-TRANS-AMOUNT
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ TRANSACTION-FILE INTO WS-TRANS-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    ADD 1 TO WS-TOTAL-TRANS-COUNT
                    ADD TRANS-AMOUNT TO WS-TOTAL-TRANS-AMOUNT
              END-READ
           END-PERFORM
           IF WS-TOTAL-TRANS-COUNT > 0
              COMPUTE WS-AVG-TRANS-AMOUNT = 
                 WS-TOTAL-TRANS-AMOUNT / WS-TOTAL-TRANS-COUNT
           END-IF
           MOVE 'N' TO WS-EOF-FLAG.

       21120-COLLECT-CUSTOMER-METRICS.
           MOVE ZEROES TO WS-ACTIVE-CUSTOMERS
           MOVE ZEROES TO WS-NEW-CUSTOMERS
           MOVE ZEROES TO WS-CHURNED-CUSTOMERS
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ CUSTOMER-FILE INTO WS-CUST-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    IF CUST-STATUS = 'A'
                       ADD 1 TO WS-ACTIVE-CUSTOMERS
                    END-IF
                    IF CUST-OPEN-DATE >= WS-PERIOD-START
                       ADD 1 TO WS-NEW-CUSTOMERS
                    END-IF
                    IF CUST-CLOSE-DATE >= WS-PERIOD-START
                       ADD 1 TO WS-CHURNED-CUSTOMERS
                    END-IF
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       21130-COLLECT-PERFORMANCE-METRICS.
           MOVE ZEROES TO WS-RESPONSE-TIME-TOTAL
           MOVE ZEROES TO WS-RESPONSE-COUNT
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ PERF-LOG-FILE INTO WS-PERF-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    ADD PERF-RESPONSE-TIME TO WS-RESPONSE-TIME-TOTAL
                    ADD 1 TO WS-RESPONSE-COUNT
              END-READ
           END-PERFORM
           IF WS-RESPONSE-COUNT > 0
              COMPUTE WS-AVG-RESPONSE-TIME = 
                 WS-RESPONSE-TIME-TOTAL / WS-RESPONSE-COUNT
           END-IF
           MOVE 'N' TO WS-EOF-FLAG.

       21200-AGGREGATE-DATA.
           PERFORM 21210-DAILY-AGGREGATION
           PERFORM 21220-WEEKLY-AGGREGATION
           PERFORM 21230-MONTHLY-AGGREGATION.

       21210-DAILY-AGGREGATION.
           INITIALIZE WS-DAILY-SUMMARY
           MOVE WS-PROCESS-DATE TO DAILY-DATE
           MOVE WS-TOTAL-TRANS-COUNT TO DAILY-TRANS-COUNT
           MOVE WS-TOTAL-TRANS-AMOUNT TO DAILY-TRANS-AMOUNT
           MOVE WS-TOTAL-DEPOSITS TO DAILY-DEPOSITS
           MOVE WS-TOTAL-WITHDRAWALS TO DAILY-WITHDRAWALS
           WRITE DAILY-SUMMARY-RECORD FROM WS-DAILY-SUMMARY.

       21220-WEEKLY-AGGREGATION.
           IF WS-DAY-OF-WEEK = 7
              INITIALIZE WS-WEEKLY-SUMMARY
              MOVE WS-WEEK-NUMBER TO WEEKLY-WEEK
              PERFORM 21225-SUM-WEEK-DATA
              WRITE WEEKLY-SUMMARY-RECORD FROM WS-WEEKLY-SUMMARY
           END-IF.

       21225-SUM-WEEK-DATA.
           MOVE ZEROES TO WEEKLY-TRANS-COUNT
           MOVE ZEROES TO WEEKLY-TRANS-AMOUNT
           PERFORM 7 TIMES
              ADD DAILY-TRANS-COUNT TO WEEKLY-TRANS-COUNT
              ADD DAILY-TRANS-AMOUNT TO WEEKLY-TRANS-AMOUNT
           END-PERFORM.

       21230-MONTHLY-AGGREGATION.
           IF WS-END-OF-MONTH = 'Y'
              INITIALIZE WS-MONTHLY-SUMMARY
              MOVE WS-CURR-MONTH TO MONTHLY-MONTH
              MOVE WS-CURR-YEAR TO MONTHLY-YEAR
              PERFORM 21235-SUM-MONTH-DATA
              WRITE MONTHLY-SUMMARY-RECORD FROM WS-MONTHLY-SUMMARY
           END-IF.

       21235-SUM-MONTH-DATA.
           MOVE ZEROES TO MONTHLY-TRANS-COUNT
           MOVE ZEROES TO MONTHLY-TRANS-AMOUNT
           MOVE ZEROES TO MONTHLY-NEW-ACCOUNTS
           MOVE ZEROES TO MONTHLY-CLOSED-ACCOUNTS
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ DAILY-SUMMARY-FILE INTO WS-DAILY-SUM-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    IF DAILY-MONTH = WS-CURR-MONTH
                       ADD DAILY-TRANS-COUNT TO MONTHLY-TRANS-COUNT
                       ADD DAILY-TRANS-AMOUNT TO MONTHLY-TRANS-AMOUNT
                    END-IF
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       21300-CALCULATE-KPI.
           PERFORM 21310-CALC-FINANCIAL-KPI
           PERFORM 21320-CALC-OPERATIONAL-KPI
           PERFORM 21330-CALC-CUSTOMER-KPI.

       21310-CALC-FINANCIAL-KPI.
           IF WS-TOTAL-ASSETS > 0
              COMPUTE WS-ROA = 
                 (WS-NET-INCOME / WS-TOTAL-ASSETS) * 100
           END-IF
           IF WS-TOTAL-EQUITY > 0
              COMPUTE WS-ROE = 
                 (WS-NET-INCOME / WS-TOTAL-EQUITY) * 100
           END-IF
           IF WS-INTEREST-EXPENSE > 0
              COMPUTE WS-NIM = 
                 ((WS-INTEREST-INCOME - WS-INTEREST-EXPENSE) /
                  WS-EARNING-ASSETS) * 100
           END-IF.

       21320-CALC-OPERATIONAL-KPI.
           IF WS-TOTAL-TRANS-COUNT > 0
              COMPUTE WS-ERROR-RATE = 
                 (WS-ERROR-COUNT / WS-TOTAL-TRANS-COUNT) * 100
           END-IF
           COMPUTE WS-SLA-COMPLIANCE = 
              (WS-WITHIN-SLA-COUNT / WS-TOTAL-CASES) * 100
           COMPUTE WS-FIRST-CALL-RESOLUTION = 
              (WS-FCR-COUNT / WS-TOTAL-CALLS) * 100.

       21330-CALC-CUSTOMER-KPI.
           IF WS-ACTIVE-CUSTOMERS > 0
              COMPUTE WS-CHURN-RATE = 
                 (WS-CHURNED-CUSTOMERS / WS-ACTIVE-CUSTOMERS) * 100
           END-IF
           COMPUTE WS-ACQUISITION-COST = 
              WS-MARKETING-SPEND / WS-NEW-CUSTOMERS
           COMPUTE WS-LIFETIME-VALUE = 
              WS-AVG-REVENUE-PER-CUSTOMER * WS-AVG-CUSTOMER-TENURE.

       21400-GENERATE-DASHBOARD.
           PERFORM 21410-CREATE-EXECUTIVE-DASHBOARD
           PERFORM 21420-CREATE-OPERATIONS-DASHBOARD
           PERFORM 21430-CREATE-RISK-DASHBOARD.

       21410-CREATE-EXECUTIVE-DASHBOARD.
           MOVE 'EXECUTIVE DASHBOARD' TO DASH-TITLE
           MOVE WS-TOTAL-REVENUE TO DASH-REVENUE
           MOVE WS-NET-INCOME TO DASH-NET-INCOME
           MOVE WS-ROA TO DASH-ROA
           MOVE WS-ROE TO DASH-ROE
           MOVE WS-ACTIVE-CUSTOMERS TO DASH-CUSTOMERS
           WRITE DASHBOARD-RECORD FROM WS-EXEC-DASHBOARD.

       21420-CREATE-OPERATIONS-DASHBOARD.
           MOVE 'OPERATIONS DASHBOARD' TO DASH-TITLE
           MOVE WS-TOTAL-TRANS-COUNT TO DASH-TRANS-COUNT
           MOVE WS-AVG-RESPONSE-TIME TO DASH-AVG-RESPONSE
           MOVE WS-ERROR-RATE TO DASH-ERROR-RATE
           MOVE WS-SLA-COMPLIANCE TO DASH-SLA-PCT
           WRITE DASHBOARD-RECORD FROM WS-OPS-DASHBOARD.

       21430-CREATE-RISK-DASHBOARD.
           MOVE 'RISK DASHBOARD' TO DASH-TITLE
           MOVE WS-FRAUD-SCORE TO DASH-FRAUD-SCORE
           MOVE WS-NPL-RATIO TO DASH-NPL
           MOVE WS-CAPITAL-RATIO TO DASH-CAPITAL
           MOVE WS-LIQUIDITY-RATIO TO DASH-LIQUIDITY
           WRITE DASHBOARD-RECORD FROM WS-RISK-DASHBOARD.

       21500-EXPORT-DATA.
           PERFORM 21510-EXPORT-CSV
           PERFORM 21520-EXPORT-XML
           PERFORM 21530-EXPORT-JSON.

       21510-EXPORT-CSV.
           OPEN OUTPUT CSV-EXPORT-FILE
           MOVE 'Date,TransCount,TransAmount,Deposits,Withdrawals'
              TO WS-CSV-HEADER
           WRITE CSV-RECORD FROM WS-CSV-HEADER
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ DAILY-SUMMARY-FILE INTO WS-DAILY-SUM-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    STRING DAILY-DATE DELIMITED SIZE
                           ',' DELIMITED SIZE
                           DAILY-TRANS-COUNT DELIMITED SIZE
                           ',' DELIMITED SIZE
                           DAILY-TRANS-AMOUNT DELIMITED SIZE
                           ',' DELIMITED SIZE
                           DAILY-DEPOSITS DELIMITED SIZE
                           ',' DELIMITED SIZE
                           DAILY-WITHDRAWALS DELIMITED SIZE
                       INTO WS-CSV-LINE
                    WRITE CSV-RECORD FROM WS-CSV-LINE
              END-READ
           END-PERFORM
           CLOSE CSV-EXPORT-FILE
           MOVE 'N' TO WS-EOF-FLAG.

       21520-EXPORT-XML.
           OPEN OUTPUT XML-EXPORT-FILE
           MOVE '<?xml version="1.0"?>' TO WS-XML-LINE
           WRITE XML-RECORD FROM WS-XML-LINE
           MOVE '<DailySummaries>' TO WS-XML-LINE
           WRITE XML-RECORD FROM WS-XML-LINE
           PERFORM 21525-WRITE-XML-RECORDS
           MOVE '</DailySummaries>' TO WS-XML-LINE
           WRITE XML-RECORD FROM WS-XML-LINE
           CLOSE XML-EXPORT-FILE.

       21525-WRITE-XML-RECORDS.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ DAILY-SUMMARY-FILE INTO WS-DAILY-SUM-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    PERFORM 21526-FORMAT-XML-RECORD
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       21526-FORMAT-XML-RECORD.
           MOVE '<Summary>' TO WS-XML-LINE
           WRITE XML-RECORD FROM WS-XML-LINE
           STRING '<Date>' DELIMITED SIZE
                  DAILY-DATE DELIMITED SIZE
                  '</Date>' DELIMITED SIZE
              INTO WS-XML-LINE
           WRITE XML-RECORD FROM WS-XML-LINE
           STRING '<TransCount>' DELIMITED SIZE
                  DAILY-TRANS-COUNT DELIMITED SIZE
                  '</TransCount>' DELIMITED SIZE
              INTO WS-XML-LINE
           WRITE XML-RECORD FROM WS-XML-LINE
           MOVE '</Summary>' TO WS-XML-LINE
           WRITE XML-RECORD FROM WS-XML-LINE.

       21530-EXPORT-JSON.
           OPEN OUTPUT JSON-EXPORT-FILE
           MOVE '{"dailySummaries":[' TO WS-JSON-LINE
           WRITE JSON-RECORD FROM WS-JSON-LINE
           PERFORM 21535-WRITE-JSON-RECORDS
           MOVE ']}' TO WS-JSON-LINE
           WRITE JSON-RECORD FROM WS-JSON-LINE
           CLOSE JSON-EXPORT-FILE.

       21535-WRITE-JSON-RECORDS.
           MOVE 'N' TO WS-FIRST-RECORD
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ DAILY-SUMMARY-FILE INTO WS-DAILY-SUM-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    PERFORM 21536-FORMAT-JSON-RECORD
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       21536-FORMAT-JSON-RECORD.
           IF WS-FIRST-RECORD = 'Y'
              MOVE ',' TO WS-JSON-COMMA
           ELSE
              MOVE SPACES TO WS-JSON-COMMA
              MOVE 'Y' TO WS-FIRST-RECORD
           END-IF
           STRING WS-JSON-COMMA DELIMITED SIZE
                  '{"date":"' DELIMITED SIZE
                  DAILY-DATE DELIMITED SIZE
                  '","transCount":' DELIMITED SIZE
                  DAILY-TRANS-COUNT DELIMITED SIZE
                  ',"transAmount":' DELIMITED SIZE
                  DAILY-TRANS-AMOUNT DELIMITED SIZE
                  '}' DELIMITED SIZE
              INTO WS-JSON-LINE
           WRITE JSON-RECORD FROM WS-JSON-LINE.

      *----------------------------------------------------------------*
      * ACCOUNT MAINTENANCE PROCEDURES                                 *
      *----------------------------------------------------------------*
       22000-ACCOUNT-MAINTENANCE.
           PERFORM 22100-DORMANT-ACCOUNT-CHECK
           PERFORM 22200-ESCHEATMENT-PROCESSING
           PERFORM 22300-ACCOUNT-CLOSURE
           PERFORM 22400-ACCOUNT-REACTIVATION.

       22100-DORMANT-ACCOUNT-CHECK.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ ACCOUNT-FILE INTO WS-ACCOUNT-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    PERFORM 22110-CHECK-ACTIVITY
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       22110-CHECK-ACTIVITY.
           COMPUTE WS-DAYS-INACTIVE = 
              FUNCTION INTEGER-OF-DATE(WS-PROCESS-DATE) -
              FUNCTION INTEGER-OF-DATE(ACCT-LAST-ACTIVITY)
           IF WS-DAYS-INACTIVE > 365
              MOVE 'D' TO ACCT-STATUS
              PERFORM 22120-MARK-DORMANT
           END-IF.

       22120-MARK-DORMANT.
           MOVE 'DORMANT' TO ACCT-STATUS-DESC
           MOVE WS-PROCESS-DATE TO ACCT-DORMANT-DATE
           REWRITE ACCOUNT-RECORD FROM WS-ACCOUNT-REC
           PERFORM 22130-SEND-DORMANT-NOTICE.

       22130-SEND-DORMANT-NOTICE.
           MOVE 'DORMANT-NOTICE' TO WS-NOTIF-TYPE
           MOVE 'MAIL' TO WS-NOTIF-CHANNEL
           MOVE 'Important: Your account is dormant'
              TO WS-NOTIF-SUBJECT
           PERFORM 15000-SEND-NOTIFICATION.

       22200-ESCHEATMENT-PROCESSING.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ ACCOUNT-FILE INTO WS-ACCOUNT-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    IF ACCT-STATUS = 'D'
                       PERFORM 22210-CHECK-ESCHEATMENT
                    END-IF
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       22210-CHECK-ESCHEATMENT.
           COMPUTE WS-DORMANT-YEARS = 
              (FUNCTION INTEGER-OF-DATE(WS-PROCESS-DATE) -
               FUNCTION INTEGER-OF-DATE(ACCT-DORMANT-DATE)) / 365
           IF WS-DORMANT-YEARS >= WS-ESCHEAT-YEARS
              PERFORM 22220-ESCHEAT-ACCOUNT
           END-IF.

       22220-ESCHEAT-ACCOUNT.
           MOVE 'E' TO ACCT-STATUS
           MOVE ACCT-BALANCE TO WS-ESCHEAT-AMOUNT
           MOVE ZEROES TO ACCT-BALANCE
           PERFORM 22230-CREATE-ESCHEAT-RECORD
           REWRITE ACCOUNT-RECORD FROM WS-ACCOUNT-REC.

       22230-CREATE-ESCHEAT-RECORD.
           INITIALIZE WS-ESCHEAT-RECORD
           MOVE ACCT-ID TO ESCHEAT-ACCOUNT
           MOVE WS-ESCHEAT-AMOUNT TO ESCHEAT-AMOUNT
           MOVE WS-PROCESS-DATE TO ESCHEAT-DATE
           MOVE ACCT-OWNER-NAME TO ESCHEAT-OWNER
           MOVE ACCT-OWNER-ADDRESS TO ESCHEAT-ADDRESS
           WRITE ESCHEAT-RECORD FROM WS-ESCHEAT-RECORD.

       22300-ACCOUNT-CLOSURE.
           IF WS-CLOSE-REQUEST = 'Y'
              PERFORM 22310-VALIDATE-CLOSURE
              IF WS-CLOSURE-VALID = 'Y'
                 PERFORM 22320-PROCESS-CLOSURE
              ELSE
                 PERFORM 22330-REJECT-CLOSURE
              END-IF
           END-IF.

       22310-VALIDATE-CLOSURE.
           MOVE 'Y' TO WS-CLOSURE-VALID
           IF ACCT-BALANCE < 0
              MOVE 'N' TO WS-CLOSURE-VALID
              MOVE 'NEGATIVE BALANCE' TO WS-CLOSURE-REJECT
           END-IF
           IF ACCT-PENDING-TRANS > 0
              MOVE 'N' TO WS-CLOSURE-VALID
              MOVE 'PENDING TRANSACTIONS' TO WS-CLOSURE-REJECT
           END-IF
           IF ACCT-LOAN-LINK NOT = SPACES
              MOVE 'N' TO WS-CLOSURE-VALID
              MOVE 'LINKED LOAN EXISTS' TO WS-CLOSURE-REJECT
           END-IF.

       22320-PROCESS-CLOSURE.
           MOVE ACCT-BALANCE TO WS-FINAL-BALANCE
           PERFORM 22325-DISBURSE-BALANCE
           MOVE 'C' TO ACCT-STATUS
           MOVE WS-PROCESS-DATE TO ACCT-CLOSE-DATE
           REWRITE ACCOUNT-RECORD FROM WS-ACCOUNT-REC
           PERFORM 22326-ARCHIVE-ACCOUNT.

       22325-DISBURSE-BALANCE.
           IF WS-FINAL-BALANCE > 0
              INITIALIZE WS-CHECK-RECORD
              MOVE ACCT-ID TO CHECK-FROM-ACCOUNT
              MOVE WS-FINAL-BALANCE TO CHECK-AMOUNT
              MOVE 'ACCOUNT CLOSURE' TO CHECK-MEMO
              MOVE ACCT-OWNER-NAME TO CHECK-PAYEE
              WRITE CHECK-RECORD FROM WS-CHECK-RECORD
           END-IF.

       22326-ARCHIVE-ACCOUNT.
           INITIALIZE WS-ARCHIVE-RECORD
           MOVE WS-ACCOUNT-REC TO ARCHIVE-ACCOUNT-DATA
           MOVE WS-PROCESS-DATE TO ARCHIVE-DATE
           COMPUTE ARCHIVE-RETENTION = 
              FUNCTION INTEGER-OF-DATE(WS-PROCESS-DATE) + 2555
           WRITE ARCHIVE-RECORD FROM WS-ARCHIVE-RECORD.

       22330-REJECT-CLOSURE.
           MOVE 'CLOSURE-REJECT' TO WS-NOTIF-TYPE
           MOVE 'EMAIL' TO WS-NOTIF-CHANNEL
           STRING 'Closure rejected: ' DELIMITED SIZE
                  WS-CLOSURE-REJECT DELIMITED SIZE
              INTO WS-NOTIF-SUBJECT
           PERFORM 15000-SEND-NOTIFICATION.

       22400-ACCOUNT-REACTIVATION.
           IF WS-REACTIVATE-REQUEST = 'Y'
              PERFORM 22410-VALIDATE-REACTIVATION
              IF WS-REACT-VALID = 'Y'
                 PERFORM 22420-PROCESS-REACTIVATION
              END-IF
           END-IF.

       22410-VALIDATE-REACTIVATION.
           MOVE 'Y' TO WS-REACT-VALID
           IF ACCT-STATUS = 'E'
              MOVE 'N' TO WS-REACT-VALID
              MOVE 'ACCOUNT ESCHEATED' TO WS-REACT-REJECT
           END-IF
           IF ACCT-STATUS = 'C'
              IF WS-DAYS-SINCE-CLOSE > 90
                 MOVE 'N' TO WS-REACT-VALID
                 MOVE 'CLOSURE PERIOD EXCEEDED' TO WS-REACT-REJECT
              END-IF
           END-IF.

       22420-PROCESS-REACTIVATION.
           MOVE 'A' TO ACCT-STATUS
           MOVE WS-PROCESS-DATE TO ACCT-REACT-DATE
           MOVE SPACES TO ACCT-DORMANT-DATE
           REWRITE ACCOUNT-RECORD FROM WS-ACCOUNT-REC
           PERFORM 22430-SEND-REACTIVATION-CONFIRM.

       22430-SEND-REACTIVATION-CONFIRM.
           MOVE 'REACTIVATION' TO WS-NOTIF-TYPE
           MOVE 'EMAIL' TO WS-NOTIF-CHANNEL
           MOVE 'Your account has been reactivated'
              TO WS-NOTIF-SUBJECT
           PERFORM 15000-SEND-NOTIFICATION.

      *----------------------------------------------------------------*
      * CARD MANAGEMENT PROCEDURES                                     *
      *----------------------------------------------------------------*
       23000-CARD-MANAGEMENT.
           PERFORM 23100-CARD-ISSUANCE
           PERFORM 23200-CARD-ACTIVATION
           PERFORM 23300-PIN-MANAGEMENT
           PERFORM 23400-CARD-REPLACEMENT
           PERFORM 23500-CARD-BLOCKING.

       23100-CARD-ISSUANCE.
           PERFORM 23110-GENERATE-CARD-NUMBER
           PERFORM 23120-SET-CARD-LIMITS
           PERFORM 23130-ASSIGN-NETWORK
           PERFORM 23140-CREATE-CARD-RECORD.

       23110-GENERATE-CARD-NUMBER.
           MOVE '4' TO WS-CARD-PREFIX
           MOVE WS-BIN-NUMBER TO WS-CARD-BIN
           COMPUTE WS-CARD-SEQ = FUNCTION RANDOM * 999999999
           STRING WS-CARD-PREFIX DELIMITED SIZE
                  WS-CARD-BIN DELIMITED SIZE
                  WS-CARD-SEQ DELIMITED SIZE
              INTO WS-CARD-NUMBER-TEMP
           PERFORM 23115-CALCULATE-LUHN-CHECK
           STRING WS-CARD-NUMBER-TEMP DELIMITED SIZE
                  WS-LUHN-CHECK DELIMITED SIZE
              INTO WS-CARD-NUMBER.

       23115-CALCULATE-LUHN-CHECK.
           MOVE ZEROES TO WS-LUHN-SUM
           PERFORM VARYING WS-LUHN-IDX FROM 15 BY -1
              UNTIL WS-LUHN-IDX < 1
              MOVE WS-CARD-NUMBER-TEMP(WS-LUHN-IDX:1) 
                 TO WS-LUHN-DIGIT
              IF FUNCTION MOD(16 - WS-LUHN-IDX, 2) = 0
                 MULTIPLY 2 BY WS-LUHN-DIGIT
                 IF WS-LUHN-DIGIT > 9
                    SUBTRACT 9 FROM WS-LUHN-DIGIT
                 END-IF
              END-IF
              ADD WS-LUHN-DIGIT TO WS-LUHN-SUM
           END-PERFORM
           COMPUTE WS-LUHN-CHECK = 
              FUNCTION MOD(10 - FUNCTION MOD(WS-LUHN-SUM, 10), 10).

       23120-SET-CARD-LIMITS.
           EVALUATE WS-CARD-TYPE
              WHEN 'DEBIT'
                 MOVE 1000 TO WS-DAILY-LIMIT
                 MOVE 500 TO WS-ATM-LIMIT
              WHEN 'CREDIT'
                 MOVE WS-CREDIT-LINE TO WS-DAILY-LIMIT
                 COMPUTE WS-ATM-LIMIT = WS-CREDIT-LINE * 0.2
              WHEN 'PREMIUM'
                 MOVE 10000 TO WS-DAILY-LIMIT
                 MOVE 2000 TO WS-ATM-LIMIT
           END-EVALUATE.

       23130-ASSIGN-NETWORK.
           IF WS-CARD-PREFIX = '4'
              MOVE 'VISA' TO WS-CARD-NETWORK
           ELSE IF WS-CARD-PREFIX = '5'
              MOVE 'MASTERCARD' TO WS-CARD-NETWORK
           ELSE IF WS-CARD-PREFIX = '3'
              MOVE 'AMEX' TO WS-CARD-NETWORK
           ELSE
              MOVE 'DISCOVER' TO WS-CARD-NETWORK
           END-IF
           END-IF
           END-IF.

       23140-CREATE-CARD-RECORD.
           INITIALIZE WS-CARD-RECORD
           MOVE WS-CARD-NUMBER TO CARD-NUMBER
           MOVE WS-CARD-TYPE TO CARD-TYPE
           MOVE WS-CARD-NETWORK TO CARD-NETWORK
           MOVE WS-DAILY-LIMIT TO CARD-DAILY-LIMIT
           MOVE WS-ATM-LIMIT TO CARD-ATM-LIMIT
           COMPUTE CARD-EXPIRY-DATE = 
              FUNCTION INTEGER-OF-DATE(WS-PROCESS-DATE) + 1095
           MOVE 'I' TO CARD-STATUS
           WRITE CARD-RECORD FROM WS-CARD-RECORD.

       23200-CARD-ACTIVATION.
           IF WS-ACTIVATION-REQUEST = 'Y'
              PERFORM 23210-VERIFY-CARDHOLDER
              IF WS-CARDHOLDER-VERIFIED = 'Y'
                 PERFORM 23220-ACTIVATE-CARD
              ELSE
                 PERFORM 23230-ACTIVATION-FAILED
              END-IF
           END-IF.

       23210-VERIFY-CARDHOLDER.
           MOVE 'N' TO WS-CARDHOLDER-VERIFIED
           IF WS-CVV-INPUT = WS-CARD-CVV
              IF WS-DOB-INPUT = WS-CARDHOLDER-DOB
                 IF WS-SSN-LAST4-INPUT = WS-CARDHOLDER-SSN-LAST4
                    MOVE 'Y' TO WS-CARDHOLDER-VERIFIED
                 END-IF
              END-IF
           END-IF.

       23220-ACTIVATE-CARD.
           MOVE 'A' TO CARD-STATUS
           MOVE WS-PROCESS-DATE TO CARD-ACTIVATION-DATE
           REWRITE CARD-RECORD FROM WS-CARD-RECORD
           MOVE 'CARD-ACTIVATED' TO WS-NOTIF-TYPE
           MOVE 'SMS' TO WS-NOTIF-CHANNEL
           MOVE 'Your card is now active' TO WS-NOTIF-BODY
           PERFORM 15000-SEND-NOTIFICATION.

       23230-ACTIVATION-FAILED.
           ADD 1 TO WS-ACTIVATION-ATTEMPTS
           IF WS-ACTIVATION-ATTEMPTS >= 3
              PERFORM 23500-CARD-BLOCKING
           END-IF
           MOVE 'ACTIVATION-FAILED' TO WS-NOTIF-TYPE
           PERFORM 15000-SEND-NOTIFICATION.

       23300-PIN-MANAGEMENT.
           IF WS-PIN-CHANGE-REQUEST = 'Y'
              PERFORM 23310-VALIDATE-CURRENT-PIN
              IF WS-PIN-VALID = 'Y'
                 PERFORM 23320-SET-NEW-PIN
              END-IF
           END-IF.

       23310-VALIDATE-CURRENT-PIN.
           MOVE 'N' TO WS-PIN-VALID
           CALL 'PINVERIFY' USING WS-CARD-NUMBER WS-CURRENT-PIN
              WS-PIN-VERIFY-RESULT
           IF WS-PIN-VERIFY-RESULT = 'MATCH'
              MOVE 'Y' TO WS-PIN-VALID
           ELSE
              ADD 1 TO WS-PIN-ATTEMPTS
              IF WS-PIN-ATTEMPTS >= 3
                 PERFORM 23500-CARD-BLOCKING
              END-IF
           END-IF.

       23320-SET-NEW-PIN.
           CALL 'PINENCRYPT' USING WS-NEW-PIN WS-ENCRYPTED-PIN
           MOVE WS-ENCRYPTED-PIN TO CARD-PIN-BLOCK
           MOVE WS-PROCESS-DATE TO CARD-PIN-CHANGE-DATE
           REWRITE CARD-RECORD FROM WS-CARD-RECORD
           MOVE 'PIN-CHANGED' TO WS-NOTIF-TYPE
           MOVE 'SMS' TO WS-NOTIF-CHANNEL
           MOVE 'Your PIN has been changed' TO WS-NOTIF-BODY
           PERFORM 15000-SEND-NOTIFICATION.

       23400-CARD-REPLACEMENT.
           IF WS-REPLACE-REQUEST = 'Y'
              PERFORM 23410-CANCEL-OLD-CARD
              PERFORM 23100-CARD-ISSUANCE
              PERFORM 23420-SHIP-NEW-CARD
           END-IF.

       23410-CANCEL-OLD-CARD.
           MOVE 'R' TO CARD-STATUS
           MOVE 'REPLACED' TO CARD-CANCEL-REASON
           MOVE WS-PROCESS-DATE TO CARD-CANCEL-DATE
           REWRITE CARD-RECORD FROM WS-CARD-RECORD.

       23420-SHIP-NEW-CARD.
           INITIALIZE WS-SHIPMENT-RECORD
           MOVE WS-CARD-NUMBER TO SHIP-CARD-NUMBER
           MOVE WS-CARDHOLDER-ADDRESS TO SHIP-ADDRESS
           IF WS-EXPEDITE = 'Y'
              MOVE 'EXPRESS' TO SHIP-METHOD
              COMPUTE SHIP-EST-DELIVERY = 
                 FUNCTION INTEGER-OF-DATE(WS-PROCESS-DATE) + 2
           ELSE
              MOVE 'STANDARD' TO SHIP-METHOD
              COMPUTE SHIP-EST-DELIVERY = 
                 FUNCTION INTEGER-OF-DATE(WS-PROCESS-DATE) + 7
           END-IF
           WRITE SHIPMENT-RECORD FROM WS-SHIPMENT-RECORD.

       23500-CARD-BLOCKING.
           MOVE 'B' TO CARD-STATUS
           MOVE WS-BLOCK-REASON TO CARD-BLOCK-REASON
           MOVE WS-PROCESS-DATE TO CARD-BLOCK-DATE
           REWRITE CARD-RECORD FROM WS-CARD-RECORD
           MOVE 'CARD-BLOCKED' TO WS-NOTIF-TYPE
           MOVE 'SMS' TO WS-NOTIF-CHANNEL
           STRING 'Your card has been blocked: ' DELIMITED SIZE
                  WS-BLOCK-REASON DELIMITED SIZE
              INTO WS-NOTIF-BODY
           PERFORM 15000-SEND-NOTIFICATION.

      *----------------------------------------------------------------*
      * WIRE TRANSFER PROCEDURES                                       *
      *----------------------------------------------------------------*
       24000-WIRE-TRANSFER.
           PERFORM 24100-VALIDATE-WIRE-REQUEST
           IF WS-WIRE-VALID = 'Y'
              PERFORM 24200-OFAC-SCREENING
              IF WS-OFAC-CLEAR = 'Y'
                 PERFORM 24300-PROCESS-WIRE
                 PERFORM 24400-SEND-CONFIRMATION
              ELSE
                 PERFORM 24500-REJECT-WIRE
              END-IF
           END-IF.

       24100-VALIDATE-WIRE-REQUEST.
           MOVE 'Y' TO WS-WIRE-VALID
           IF WS-WIRE-AMOUNT <= 0
              MOVE 'N' TO WS-WIRE-VALID
              MOVE 'INVALID AMOUNT' TO WS-WIRE-REJECT
           END-IF
           IF WS-WIRE-AMOUNT > WS-ACCOUNT-BALANCE
              MOVE 'N' TO WS-WIRE-VALID
              MOVE 'INSUFFICIENT FUNDS' TO WS-WIRE-REJECT
           END-IF
           IF WS-BENEFICIARY-ACCOUNT = SPACES
              MOVE 'N' TO WS-WIRE-VALID
              MOVE 'BENEFICIARY REQUIRED' TO WS-WIRE-REJECT
           END-IF
           IF WS-WIRE-AMOUNT > 10000
              MOVE 'Y' TO WS-CTR-REQUIRED
           END-IF.

       24200-OFAC-SCREENING.
           MOVE 'Y' TO WS-OFAC-CLEAR
           MOVE WS-BENEFICIARY-NAME TO OFAC-SEARCH-NAME
           CALL 'OFACSRCH' USING OFAC-REQUEST OFAC-RESPONSE
           IF OFAC-MATCH-FOUND = 'Y'
              IF OFAC-MATCH-SCORE >= 85
                 MOVE 'N' TO WS-OFAC-CLEAR
                 MOVE 'OFAC MATCH' TO WS-WIRE-REJECT
              END-IF
           END-IF
           MOVE WS-BENEFICIARY-BANK TO OFAC-SEARCH-BANK
           CALL 'OFACSRCH' USING OFAC-REQUEST OFAC-RESPONSE
           IF OFAC-MATCH-FOUND = 'Y'
              IF OFAC-MATCH-SCORE >= 85
                 MOVE 'N' TO WS-OFAC-CLEAR
                 MOVE 'BANK OFAC MATCH' TO WS-WIRE-REJECT
              END-IF
           END-IF.

       24300-PROCESS-WIRE.
           PERFORM 24310-DEBIT-ORIGINATOR
           PERFORM 24320-CREATE-WIRE-MESSAGE
           PERFORM 24330-TRANSMIT-WIRE
           PERFORM 24340-RECORD-WIRE.

       24310-DEBIT-ORIGINATOR.
           SUBTRACT WS-WIRE-AMOUNT FROM WS-ACCOUNT-BALANCE
           SUBTRACT WS-WIRE-FEE FROM WS-ACCOUNT-BALANCE
           PERFORM 2350-UPDATE-ACCOUNT.

       24320-CREATE-WIRE-MESSAGE.
           INITIALIZE WS-SWIFT-MESSAGE
           MOVE 'MT103' TO SWIFT-MSG-TYPE
           MOVE WS-WIRE-REF TO SWIFT-TXN-REF
           MOVE WS-WIRE-DATE TO SWIFT-VALUE-DATE
           MOVE WS-WIRE-CURRENCY TO SWIFT-CURRENCY
           MOVE WS-WIRE-AMOUNT TO SWIFT-AMOUNT
           MOVE WS-ORIGINATOR-NAME TO SWIFT-ORDERING-CUST
           MOVE WS-ORIGINATOR-ACCOUNT TO SWIFT-ORDERING-ACCT
           MOVE WS-BENEFICIARY-NAME TO SWIFT-BENEF-CUST
           MOVE WS-BENEFICIARY-ACCOUNT TO SWIFT-BENEF-ACCT
           MOVE WS-BENEFICIARY-BANK-BIC TO SWIFT-BENEF-BANK
           MOVE WS-PURPOSE TO SWIFT-REMIT-INFO.

       24330-TRANSMIT-WIRE.
           CALL 'SWIFTSEND' USING WS-SWIFT-MESSAGE 
              WS-SWIFT-RESPONSE
           IF SWIFT-STATUS = 'ACK'
              MOVE 'SENT' TO WS-WIRE-STATUS
           ELSE
              MOVE 'FAILED' TO WS-WIRE-STATUS
              PERFORM 24350-REVERSE-DEBIT
           END-IF.

       24340-RECORD-WIRE.
           INITIALIZE WS-WIRE-RECORD
           MOVE WS-WIRE-REF TO WIRE-REF
           MOVE WS-WIRE-AMOUNT TO WIRE-AMOUNT
           MOVE WS-WIRE-STATUS TO WIRE-STATUS
           MOVE WS-ORIGINATOR-ACCOUNT TO WIRE-FROM-ACCT
           MOVE WS-BENEFICIARY-ACCOUNT TO WIRE-TO-ACCT
           MOVE WS-PROCESS-DATE TO WIRE-DATE
           WRITE WIRE-RECORD FROM WS-WIRE-RECORD.

       24350-REVERSE-DEBIT.
           ADD WS-WIRE-AMOUNT TO WS-ACCOUNT-BALANCE
           ADD WS-WIRE-FEE TO WS-ACCOUNT-BALANCE
           PERFORM 2350-UPDATE-ACCOUNT.

       24400-SEND-CONFIRMATION.
           MOVE 'WIRE-CONFIRM' TO WS-NOTIF-TYPE
           MOVE 'EMAIL' TO WS-NOTIF-CHANNEL
           STRING 'Wire transfer ' DELIMITED SIZE
                  WS-WIRE-REF DELIMITED SIZE
                  ' completed' DELIMITED SIZE
              INTO WS-NOTIF-SUBJECT
           PERFORM 15000-SEND-NOTIFICATION.

       24500-REJECT-WIRE.
           MOVE 'REJECTED' TO WS-WIRE-STATUS
           INITIALIZE WS-WIRE-REJECT-REC
           MOVE WS-WIRE-REF TO REJECT-WIRE-REF
           MOVE WS-WIRE-REJECT TO REJECT-REASON
           MOVE WS-PROCESS-DATE TO REJECT-DATE
           WRITE WIRE-REJECT-RECORD FROM WS-WIRE-REJECT-REC
           MOVE 'WIRE-REJECTED' TO WS-NOTIF-TYPE
           PERFORM 15000-SEND-NOTIFICATION.

      *----------------------------------------------------------------*
      * ACH PROCESSING PROCEDURES                                      *
      *----------------------------------------------------------------*
       25000-ACH-PROCESSING.
           PERFORM 25100-RECEIVE-ACH-FILE
           PERFORM 25200-VALIDATE-ACH-ENTRIES
           PERFORM 25300-PROCESS-ACH-CREDITS
           PERFORM 25400-PROCESS-ACH-DEBITS
           PERFORM 25500-GENERATE-ACH-RETURN.

       25100-RECEIVE-ACH-FILE.
           OPEN INPUT ACH-INPUT-FILE
           READ ACH-INPUT-FILE INTO WS-ACH-FILE-HEADER
           MOVE ACH-FILE-ID TO WS-CURRENT-ACH-FILE
           MOVE ACH-CREATION-DATE TO WS-ACH-FILE-DATE
           MOVE ACH-ENTRY-COUNT TO WS-EXPECTED-ENTRIES.

       25200-VALIDATE-ACH-ENTRIES.
           MOVE ZEROES TO WS-VALID-ENTRIES
           MOVE ZEROES TO WS-INVALID-ENTRIES
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ ACH-INPUT-FILE INTO WS-ACH-ENTRY
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    PERFORM 25210-VALIDATE-SINGLE-ENTRY
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       25210-VALIDATE-SINGLE-ENTRY.
           MOVE 'Y' TO WS-ACH-ENTRY-VALID
           IF ACH-ROUTING NOT NUMERIC
              MOVE 'N' TO WS-ACH-ENTRY-VALID
              MOVE 'R03' TO WS-ACH-RETURN-CODE
           END-IF
           IF ACH-ACCOUNT = SPACES
              MOVE 'N' TO WS-ACH-ENTRY-VALID
              MOVE 'R04' TO WS-ACH-RETURN-CODE
           END-IF
           IF ACH-AMOUNT <= 0
              MOVE 'N' TO WS-ACH-ENTRY-VALID
              MOVE 'R06' TO WS-ACH-RETURN-CODE
           END-IF
           IF WS-ACH-ENTRY-VALID = 'Y'
              ADD 1 TO WS-VALID-ENTRIES
           ELSE
              ADD 1 TO WS-INVALID-ENTRIES
           END-IF.

       25300-PROCESS-ACH-CREDITS.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ ACH-INPUT-FILE INTO WS-ACH-ENTRY
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    IF ACH-TRANS-CODE = '22' OR '23' OR '32' OR '33'
                       PERFORM 25310-APPLY-CREDIT
                    END-IF
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       25310-APPLY-CREDIT.
           MOVE ACH-ACCOUNT TO WS-SEARCH-KEY
           PERFORM 5000-SEARCH-ACCOUNT
           IF WS-FOUND-FLAG = 'Y'
              ADD ACH-AMOUNT TO WS-ACCOUNT-BALANCE
              PERFORM 2350-UPDATE-ACCOUNT
              ADD 1 TO WS-CREDITS-POSTED
              ADD ACH-AMOUNT TO WS-TOTAL-CREDITS
           ELSE
              MOVE 'R04' TO WS-ACH-RETURN-CODE
              PERFORM 25510-CREATE-RETURN-ENTRY
           END-IF.

       25400-PROCESS-ACH-DEBITS.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ ACH-INPUT-FILE INTO WS-ACH-ENTRY
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    IF ACH-TRANS-CODE = '27' OR '28' OR '37' OR '38'
                       PERFORM 25410-APPLY-DEBIT
                    END-IF
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       25410-APPLY-DEBIT.
           MOVE ACH-ACCOUNT TO WS-SEARCH-KEY
           PERFORM 5000-SEARCH-ACCOUNT
           IF WS-FOUND-FLAG = 'Y'
              IF WS-ACCOUNT-BALANCE >= ACH-AMOUNT
                 SUBTRACT ACH-AMOUNT FROM WS-ACCOUNT-BALANCE
                 PERFORM 2350-UPDATE-ACCOUNT
                 ADD 1 TO WS-DEBITS-POSTED
                 ADD ACH-AMOUNT TO WS-TOTAL-DEBITS
              ELSE
                 MOVE 'R01' TO WS-ACH-RETURN-CODE
                 PERFORM 25510-CREATE-RETURN-ENTRY
              END-IF
           ELSE
              MOVE 'R04' TO WS-ACH-RETURN-CODE
              PERFORM 25510-CREATE-RETURN-ENTRY
           END-IF.

       25500-GENERATE-ACH-RETURN.
           IF WS-RETURN-COUNT > 0
              PERFORM 25510-CREATE-RETURN-FILE
           END-IF.

       25510-CREATE-RETURN-ENTRY.
           INITIALIZE WS-ACH-RETURN-ENTRY
           MOVE ACH-TRACE-NUMBER TO RETURN-ORIG-TRACE
           MOVE WS-ACH-RETURN-CODE TO RETURN-CODE
           MOVE ACH-AMOUNT TO RETURN-AMOUNT
           MOVE ACH-ACCOUNT TO RETURN-ACCOUNT
           ADD 1 TO WS-RETURN-COUNT
           WRITE ACH-RETURN-RECORD FROM WS-ACH-RETURN-ENTRY.

       25510-CREATE-RETURN-FILE.
           OPEN OUTPUT ACH-RETURN-FILE
           PERFORM 25520-WRITE-RETURN-HEADER
           PERFORM 25530-WRITE-RETURN-ENTRIES
           PERFORM 25540-WRITE-RETURN-TRAILER
           CLOSE ACH-RETURN-FILE.

       25520-WRITE-RETURN-HEADER.
           INITIALIZE WS-RETURN-HEADER
           MOVE '1' TO RETURN-RECORD-TYPE
           MOVE '01' TO RETURN-PRIORITY-CODE
           MOVE WS-OUR-ROUTING TO RETURN-IMMEDIATE-DEST
           MOVE WS-OUR-COMPANY-ID TO RETURN-IMMEDIATE-ORIGIN
           MOVE FUNCTION CURRENT-DATE TO RETURN-FILE-DATE
           WRITE ACH-RETURN-RECORD FROM WS-RETURN-HEADER.

       25530-WRITE-RETURN-ENTRIES.
           PERFORM UNTIL WS-RETURN-IDX > WS-RETURN-COUNT
              WRITE ACH-RETURN-RECORD 
                 FROM WS-RETURN-ENTRY(WS-RETURN-IDX)
              ADD 1 TO WS-RETURN-IDX
           END-PERFORM.

       25540-WRITE-RETURN-TRAILER.
           INITIALIZE WS-RETURN-TRAILER
           MOVE '9' TO RETURN-RECORD-TYPE
           MOVE WS-RETURN-COUNT TO RETURN-ENTRY-COUNT
           MOVE WS-RETURN-TOTAL TO RETURN-TOTAL-AMOUNT
           WRITE ACH-RETURN-RECORD FROM WS-RETURN-TRAILER.


      *----------------------------------------------------------------*
      * STATEMENT GENERATION PROCEDURES                                *
      *----------------------------------------------------------------*
       26000-STATEMENT-GENERATION.
           PERFORM 26100-PREPARE-STATEMENT-DATA
           PERFORM 26200-GENERATE-ACCOUNT-SUMMARY
           PERFORM 26300-GENERATE-TRANSACTION-DETAIL
           PERFORM 26400-CALCULATE-STATEMENT-TOTALS
           PERFORM 26500-FORMAT-STATEMENT
           PERFORM 26600-DELIVER-STATEMENT.

       26100-PREPARE-STATEMENT-DATA.
           MOVE FUNCTION CURRENT-DATE TO WS-STMT-DATE
           COMPUTE WS-STMT-START-DATE = 
              FUNCTION INTEGER-OF-DATE(WS-STMT-DATE) - 30
           MOVE WS-STMT-DATE TO WS-STMT-END-DATE
           MOVE ZEROES TO WS-STMT-TRANS-COUNT
           MOVE ZEROES TO WS-STMT-CREDIT-TOTAL
           MOVE ZEROES TO WS-STMT-DEBIT-TOTAL.

       26200-GENERATE-ACCOUNT-SUMMARY.
           INITIALIZE WS-STMT-SUMMARY
           MOVE ACCT-ID TO STMT-ACCOUNT-NUMBER
           MOVE ACCT-TYPE TO STMT-ACCOUNT-TYPE
           MOVE ACCT-OWNER-NAME TO STMT-CUSTOMER-NAME
           MOVE ACCT-OWNER-ADDRESS TO STMT-CUSTOMER-ADDR
           MOVE WS-OPENING-BALANCE TO STMT-OPENING-BAL
           MOVE WS-ACCOUNT-BALANCE TO STMT-CLOSING-BAL.

       26300-GENERATE-TRANSACTION-DETAIL.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ TRANSACTION-HISTORY INTO WS-TRANS-HIST-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    IF HIST-ACCOUNT = ACCT-ID
                       IF HIST-DATE >= WS-STMT-START-DATE
                          PERFORM 26310-ADD-TRANSACTION-LINE
                       END-IF
                    END-IF
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       26310-ADD-TRANSACTION-LINE.
           ADD 1 TO WS-STMT-TRANS-COUNT
           MOVE HIST-DATE TO STMT-TRANS-DATE(WS-STMT-TRANS-COUNT)
           MOVE HIST-DESC TO STMT-TRANS-DESC(WS-STMT-TRANS-COUNT)
           MOVE HIST-AMOUNT TO STMT-TRANS-AMT(WS-STMT-TRANS-COUNT)
           MOVE HIST-BALANCE TO STMT-TRANS-BAL(WS-STMT-TRANS-COUNT)
           IF HIST-TYPE = 'C'
              ADD HIST-AMOUNT TO WS-STMT-CREDIT-TOTAL
           ELSE
              ADD HIST-AMOUNT TO WS-STMT-DEBIT-TOTAL
           END-IF.

       26400-CALCULATE-STATEMENT-TOTALS.
           MOVE WS-STMT-CREDIT-TOTAL TO STMT-TOTAL-CREDITS
           MOVE WS-STMT-DEBIT-TOTAL TO STMT-TOTAL-DEBITS
           COMPUTE STMT-NET-CHANGE = 
              WS-STMT-CREDIT-TOTAL - WS-STMT-DEBIT-TOTAL
           MOVE WS-STMT-TRANS-COUNT TO STMT-TRANS-COUNT
           IF WS-STMT-TRANS-COUNT > 0
              COMPUTE STMT-AVG-DAILY-BAL = 
                 WS-TOTAL-DAILY-BALANCES / 30
           END-IF.

       26500-FORMAT-STATEMENT.
           PERFORM 26510-CREATE-HEADER
           PERFORM 26520-CREATE-SUMMARY-SECTION
           PERFORM 26530-CREATE-TRANSACTION-LIST
           PERFORM 26540-CREATE-FOOTER.

       26510-CREATE-HEADER.
           MOVE SPACES TO WS-STMT-LINE
           STRING 'ACCOUNT STATEMENT' DELIMITED SIZE
                  ' - ' DELIMITED SIZE
                  WS-STMT-DATE DELIMITED SIZE
              INTO WS-STMT-LINE
           WRITE STATEMENT-RECORD FROM WS-STMT-LINE
           MOVE ALL '-' TO WS-STMT-LINE
           WRITE STATEMENT-RECORD FROM WS-STMT-LINE.

       26520-CREATE-SUMMARY-SECTION.
           STRING 'Account: ' DELIMITED SIZE
                  STMT-ACCOUNT-NUMBER DELIMITED SIZE
              INTO WS-STMT-LINE
           WRITE STATEMENT-RECORD FROM WS-STMT-LINE
           STRING 'Customer: ' DELIMITED SIZE
                  STMT-CUSTOMER-NAME DELIMITED SIZE
              INTO WS-STMT-LINE
           WRITE STATEMENT-RECORD FROM WS-STMT-LINE
           STRING 'Opening Balance: $' DELIMITED SIZE
                  STMT-OPENING-BAL DELIMITED SIZE
              INTO WS-STMT-LINE
           WRITE STATEMENT-RECORD FROM WS-STMT-LINE
           STRING 'Closing Balance: $' DELIMITED SIZE
                  STMT-CLOSING-BAL DELIMITED SIZE
              INTO WS-STMT-LINE
           WRITE STATEMENT-RECORD FROM WS-STMT-LINE.

       26530-CREATE-TRANSACTION-LIST.
           MOVE 'DATE       DESCRIPTION                    AMOUNT'
              TO WS-STMT-LINE
           WRITE STATEMENT-RECORD FROM WS-STMT-LINE
           MOVE ALL '-' TO WS-STMT-LINE
           WRITE STATEMENT-RECORD FROM WS-STMT-LINE
           PERFORM VARYING WS-STMT-IDX FROM 1 BY 1
              UNTIL WS-STMT-IDX > WS-STMT-TRANS-COUNT
              STRING STMT-TRANS-DATE(WS-STMT-IDX) DELIMITED SIZE
                     '  ' DELIMITED SIZE
                     STMT-TRANS-DESC(WS-STMT-IDX) DELIMITED SIZE
                     '  $' DELIMITED SIZE
                     STMT-TRANS-AMT(WS-STMT-IDX) DELIMITED SIZE
                 INTO WS-STMT-LINE
              WRITE STATEMENT-RECORD FROM WS-STMT-LINE
           END-PERFORM.

       26540-CREATE-FOOTER.
           MOVE ALL '-' TO WS-STMT-LINE
           WRITE STATEMENT-RECORD FROM WS-STMT-LINE
           STRING 'Total Credits: $' DELIMITED SIZE
                  STMT-TOTAL-CREDITS DELIMITED SIZE
              INTO WS-STMT-LINE
           WRITE STATEMENT-RECORD FROM WS-STMT-LINE
           STRING 'Total Debits: $' DELIMITED SIZE
                  STMT-TOTAL-DEBITS DELIMITED SIZE
              INTO WS-STMT-LINE
           WRITE STATEMENT-RECORD FROM WS-STMT-LINE.

       26600-DELIVER-STATEMENT.
           EVALUATE WS-DELIVERY-PREF
              WHEN 'PAPER'
                 PERFORM 26610-PRINT-STATEMENT
              WHEN 'EMAIL'
                 PERFORM 26620-EMAIL-STATEMENT
              WHEN 'BOTH'
                 PERFORM 26610-PRINT-STATEMENT
                 PERFORM 26620-EMAIL-STATEMENT
           END-EVALUATE.

       26610-PRINT-STATEMENT.
           INITIALIZE WS-PRINT-REQUEST
           MOVE STMT-ACCOUNT-NUMBER TO PRINT-REQ-ACCOUNT
           MOVE 'STATEMENT' TO PRINT-REQ-DOC-TYPE
           MOVE WS-STMT-DATE TO PRINT-REQ-DATE
           WRITE PRINT-QUEUE-RECORD FROM WS-PRINT-REQUEST.

       26620-EMAIL-STATEMENT.
           MOVE 'STATEMENT' TO WS-NOTIF-TYPE
           MOVE 'EMAIL' TO WS-NOTIF-CHANNEL
           STRING 'Your ' DELIMITED SIZE
                  WS-STMT-DATE DELIMITED SIZE
                  ' statement is ready' DELIMITED SIZE
              INTO WS-NOTIF-SUBJECT
           PERFORM 15000-SEND-NOTIFICATION.

      *----------------------------------------------------------------*
      * OVERDRAFT PROTECTION PROCEDURES                                *
      *----------------------------------------------------------------*
       27000-OVERDRAFT-PROTECTION.
           PERFORM 27100-CHECK-OVERDRAFT-STATUS
           IF WS-OVERDRAFT-TRIGGERED = 'Y'
              PERFORM 27200-APPLY-OVERDRAFT-PROTECTION
           END-IF
           PERFORM 27300-PROCESS-OVERDRAFT-FEES.

       27100-CHECK-OVERDRAFT-STATUS.
           MOVE 'N' TO WS-OVERDRAFT-TRIGGERED
           IF WS-ACCOUNT-BALANCE < 0
              MOVE 'Y' TO WS-OVERDRAFT-TRIGGERED
              COMPUTE WS-OVERDRAFT-AMOUNT = 
                 0 - WS-ACCOUNT-BALANCE
           END-IF.

       27200-APPLY-OVERDRAFT-PROTECTION.
           IF WS-ODP-ENABLED = 'Y'
              PERFORM 27210-CHECK-LINKED-ACCOUNT
              IF WS-LINKED-FUNDS-AVAIL = 'Y'
                 PERFORM 27220-TRANSFER-FROM-LINKED
              ELSE
                 PERFORM 27230-USE-CREDIT-LINE
              END-IF
           ELSE
              PERFORM 27240-DECLINE-TRANSACTION
           END-IF.

       27210-CHECK-LINKED-ACCOUNT.
           MOVE 'N' TO WS-LINKED-FUNDS-AVAIL
           IF WS-LINKED-ACCOUNT NOT = SPACES
              MOVE WS-LINKED-ACCOUNT TO WS-SEARCH-KEY
              PERFORM 5000-SEARCH-ACCOUNT
              IF WS-FOUND-FLAG = 'Y'
                 IF WS-LINKED-BALANCE >= WS-OVERDRAFT-AMOUNT
                    MOVE 'Y' TO WS-LINKED-FUNDS-AVAIL
                 END-IF
              END-IF
           END-IF.

       27220-TRANSFER-FROM-LINKED.
           SUBTRACT WS-OVERDRAFT-AMOUNT FROM WS-LINKED-BALANCE
           ADD WS-OVERDRAFT-AMOUNT TO WS-ACCOUNT-BALANCE
           ADD WS-ODP-TRANSFER-FEE TO WS-FEES-CHARGED
           PERFORM 27250-RECORD-ODP-TRANSFER.

       27230-USE-CREDIT-LINE.
           IF WS-ODP-CREDIT-AVAIL >= WS-OVERDRAFT-AMOUNT
              ADD WS-OVERDRAFT-AMOUNT TO WS-ACCOUNT-BALANCE
              SUBTRACT WS-OVERDRAFT-AMOUNT FROM WS-ODP-CREDIT-AVAIL
              ADD WS-ODP-CREDIT-FEE TO WS-FEES-CHARGED
              PERFORM 27260-RECORD-CREDIT-ADVANCE
           ELSE
              PERFORM 27240-DECLINE-TRANSACTION
           END-IF.

       27240-DECLINE-TRANSACTION.
           MOVE 'DECLINED' TO WS-TRANS-STATUS
           MOVE 'INSUFFICIENT FUNDS' TO WS-DECLINE-REASON
           ADD WS-NSF-FEE TO WS-FEES-CHARGED
           PERFORM 27270-RECORD-NSF.

       27250-RECORD-ODP-TRANSFER.
           INITIALIZE WS-ODP-RECORD
           MOVE ACCT-ID TO ODP-PRIMARY-ACCOUNT
           MOVE WS-LINKED-ACCOUNT TO ODP-LINKED-ACCOUNT
           MOVE WS-OVERDRAFT-AMOUNT TO ODP-AMOUNT
           MOVE 'TRANSFER' TO ODP-TYPE
           MOVE WS-PROCESS-DATE TO ODP-DATE
           WRITE ODP-RECORD FROM WS-ODP-RECORD.

       27260-RECORD-CREDIT-ADVANCE.
           INITIALIZE WS-ODP-RECORD
           MOVE ACCT-ID TO ODP-PRIMARY-ACCOUNT
           MOVE WS-OVERDRAFT-AMOUNT TO ODP-AMOUNT
           MOVE 'CREDIT-LINE' TO ODP-TYPE
           MOVE WS-PROCESS-DATE TO ODP-DATE
           WRITE ODP-RECORD FROM WS-ODP-RECORD.

       27270-RECORD-NSF.
           INITIALIZE WS-NSF-RECORD
           MOVE ACCT-ID TO NSF-ACCOUNT
           MOVE WS-OVERDRAFT-AMOUNT TO NSF-AMOUNT
           MOVE WS-NSF-FEE TO NSF-FEE-CHARGED
           MOVE WS-PROCESS-DATE TO NSF-DATE
           WRITE NSF-RECORD FROM WS-NSF-RECORD
           MOVE 'NSF' TO WS-NOTIF-TYPE
           MOVE 'SMS' TO WS-NOTIF-CHANNEL
           MOVE 'Transaction declined - insufficient funds'
              TO WS-NOTIF-BODY
           PERFORM 15000-SEND-NOTIFICATION.

       27300-PROCESS-OVERDRAFT-FEES.
           IF WS-ACCOUNT-BALANCE < 0
              IF WS-CONSECUTIVE-OD-DAYS > 5
                 COMPUTE WS-EXTENDED-OD-FEE = 
                    WS-CONSECUTIVE-OD-DAYS * WS-DAILY-OD-FEE
                 ADD WS-EXTENDED-OD-FEE TO WS-FEES-CHARGED
              END-IF
           END-IF.

      *----------------------------------------------------------------*
      * INTEREST ACCRUAL PROCEDURES                                    *
      *----------------------------------------------------------------*
       28000-INTEREST-ACCRUAL.
           PERFORM 28100-CALCULATE-DAILY-INTEREST
           PERFORM 28200-ACCRUE-INTEREST
           PERFORM 28300-POST-MONTHLY-INTEREST.

       28100-CALCULATE-DAILY-INTEREST.
           EVALUATE ACCT-TYPE
              WHEN 'SAV'
                 PERFORM 28110-SAVINGS-INTEREST
              WHEN 'MMA'
                 PERFORM 28120-MONEY-MARKET-INTEREST
              WHEN 'CD'
                 PERFORM 28130-CD-INTEREST
              WHEN 'CHK'
                 IF ACCT-INTEREST-BEARING = 'Y'
                    PERFORM 28140-CHECKING-INTEREST
                 END-IF
           END-EVALUATE.

       28110-SAVINGS-INTEREST.
           IF WS-ACCOUNT-BALANCE >= 0
              PERFORM 28115-DETERMINE-SAVINGS-TIER
              COMPUTE WS-DAILY-INTEREST = 
                 WS-ACCOUNT-BALANCE * WS-TIER-RATE / 36500
           ELSE
              MOVE ZEROES TO WS-DAILY-INTEREST
           END-IF.

       28115-DETERMINE-SAVINGS-TIER.
           EVALUATE TRUE
              WHEN WS-ACCOUNT-BALANCE >= 100000
                 MOVE 2.50 TO WS-TIER-RATE
              WHEN WS-ACCOUNT-BALANCE >= 50000
                 MOVE 2.00 TO WS-TIER-RATE
              WHEN WS-ACCOUNT-BALANCE >= 10000
                 MOVE 1.50 TO WS-TIER-RATE
              WHEN WS-ACCOUNT-BALANCE >= 1000
                 MOVE 1.00 TO WS-TIER-RATE
              WHEN OTHER
                 MOVE 0.50 TO WS-TIER-RATE
           END-EVALUATE.

       28120-MONEY-MARKET-INTEREST.
           IF WS-ACCOUNT-BALANCE >= 0
              PERFORM 28125-DETERMINE-MMA-TIER
              COMPUTE WS-DAILY-INTEREST = 
                 WS-ACCOUNT-BALANCE * WS-TIER-RATE / 36500
           ELSE
              MOVE ZEROES TO WS-DAILY-INTEREST
           END-IF.

       28125-DETERMINE-MMA-TIER.
           EVALUATE TRUE
              WHEN WS-ACCOUNT-BALANCE >= 250000
                 MOVE 3.50 TO WS-TIER-RATE
              WHEN WS-ACCOUNT-BALANCE >= 100000
                 MOVE 3.00 TO WS-TIER-RATE
              WHEN WS-ACCOUNT-BALANCE >= 50000
                 MOVE 2.50 TO WS-TIER-RATE
              WHEN WS-ACCOUNT-BALANCE >= 25000
                 MOVE 2.00 TO WS-TIER-RATE
              WHEN WS-ACCOUNT-BALANCE >= 10000
                 MOVE 1.50 TO WS-TIER-RATE
              WHEN OTHER
                 MOVE 1.00 TO WS-TIER-RATE
           END-EVALUATE.

       28130-CD-INTEREST.
           IF WS-ACCOUNT-BALANCE > 0
              MOVE ACCT-CD-RATE TO WS-TIER-RATE
              COMPUTE WS-DAILY-INTEREST = 
                 WS-ACCOUNT-BALANCE * WS-TIER-RATE / 36500
           END-IF.

       28140-CHECKING-INTEREST.
           IF WS-ACCOUNT-BALANCE >= WS-MIN-BAL-FOR-INTEREST
              MOVE 0.10 TO WS-TIER-RATE
              COMPUTE WS-DAILY-INTEREST = 
                 WS-ACCOUNT-BALANCE * WS-TIER-RATE / 36500
           ELSE
              MOVE ZEROES TO WS-DAILY-INTEREST
           END-IF.

       28200-ACCRUE-INTEREST.
           ADD WS-DAILY-INTEREST TO WS-ACCRUED-INTEREST
           MOVE WS-PROCESS-DATE TO WS-LAST-ACCRUAL-DATE.

       28300-POST-MONTHLY-INTEREST.
           IF WS-END-OF-MONTH = 'Y'
              ADD WS-ACCRUED-INTEREST TO WS-ACCOUNT-BALANCE
              PERFORM 28310-RECORD-INTEREST-POSTING
              MOVE ZEROES TO WS-ACCRUED-INTEREST
           END-IF.

       28310-RECORD-INTEREST-POSTING.
           INITIALIZE WS-INTEREST-RECORD
           MOVE ACCT-ID TO INT-ACCOUNT
           MOVE WS-ACCRUED-INTEREST TO INT-AMOUNT
           MOVE WS-TIER-RATE TO INT-RATE
           MOVE WS-PROCESS-DATE TO INT-POST-DATE
           WRITE INTEREST-RECORD FROM WS-INTEREST-RECORD.

      *----------------------------------------------------------------*
      * STOP PAYMENT PROCEDURES                                        *
      *----------------------------------------------------------------*
       29000-STOP-PAYMENT.
           PERFORM 29100-VALIDATE-STOP-REQUEST
           IF WS-STOP-VALID = 'Y'
              PERFORM 29200-CREATE-STOP-ORDER
              PERFORM 29300-APPLY-STOP-FEE
           END-IF.

       29100-VALIDATE-STOP-REQUEST.
           MOVE 'Y' TO WS-STOP-VALID
           IF WS-CHECK-NUMBER = ZEROES
              MOVE 'N' TO WS-STOP-VALID
              MOVE 'CHECK NUMBER REQUIRED' TO WS-STOP-REJECT
           END-IF
           IF WS-CHECK-ALREADY-CLEARED = 'Y'
              MOVE 'N' TO WS-STOP-VALID
              MOVE 'CHECK ALREADY CLEARED' TO WS-STOP-REJECT
           END-IF.

       29200-CREATE-STOP-ORDER.
           INITIALIZE WS-STOP-RECORD
           MOVE ACCT-ID TO STOP-ACCOUNT
           MOVE WS-CHECK-NUMBER TO STOP-CHECK-NUMBER
           MOVE WS-CHECK-AMOUNT TO STOP-AMOUNT
           MOVE WS-PAYEE-NAME TO STOP-PAYEE
           MOVE WS-PROCESS-DATE TO STOP-EFFECTIVE-DATE
           COMPUTE STOP-EXPIRY-DATE = 
              FUNCTION INTEGER-OF-DATE(WS-PROCESS-DATE) + 180
           MOVE 'A' TO STOP-STATUS
           WRITE STOP-RECORD FROM WS-STOP-RECORD.

       29300-APPLY-STOP-FEE.
           SUBTRACT WS-STOP-PAYMENT-FEE FROM WS-ACCOUNT-BALANCE
           PERFORM 2350-UPDATE-ACCOUNT
           MOVE 'STOP-PAYMENT' TO WS-NOTIF-TYPE
           MOVE 'EMAIL' TO WS-NOTIF-CHANNEL
           STRING 'Stop payment placed on check #' DELIMITED SIZE
                  WS-CHECK-NUMBER DELIMITED SIZE
              INTO WS-NOTIF-SUBJECT
           PERFORM 15000-SEND-NOTIFICATION.

      *----------------------------------------------------------------*
      * SAFE DEPOSIT BOX PROCEDURES                                    *
      *----------------------------------------------------------------*
       30000-SAFE-DEPOSIT-BOX.
           PERFORM 30100-BOX-RENTAL
           PERFORM 30200-BOX-ACCESS
           PERFORM 30300-BOX-DRILLING
           PERFORM 30400-BOX-BILLING.

       30100-BOX-RENTAL.
           IF WS-RENTAL-REQUEST = 'Y'
              PERFORM 30110-CHECK-AVAILABILITY
              IF WS-BOX-AVAILABLE = 'Y'
                 PERFORM 30120-ASSIGN-BOX
                 PERFORM 30130-CREATE-RENTAL-AGREEMENT
              END-IF
           END-IF.

       30110-CHECK-AVAILABILITY.
           MOVE 'N' TO WS-BOX-AVAILABLE
           PERFORM VARYING WS-BOX-IDX FROM 1 BY 1
              UNTIL WS-BOX-IDX > WS-TOTAL-BOXES
              IF BOX-STATUS(WS-BOX-IDX) = 'A'
                 IF BOX-SIZE(WS-BOX-IDX) = WS-REQUESTED-SIZE
                    MOVE 'Y' TO WS-BOX-AVAILABLE
                    MOVE WS-BOX-IDX TO WS-ASSIGNED-BOX
                    EXIT PERFORM
                 END-IF
              END-IF
           END-PERFORM.

       30120-ASSIGN-BOX.
           MOVE 'R' TO BOX-STATUS(WS-ASSIGNED-BOX)
           MOVE WS-CUSTOMER-ID TO BOX-RENTER(WS-ASSIGNED-BOX)
           MOVE WS-PROCESS-DATE TO BOX-RENTAL-DATE(WS-ASSIGNED-BOX).

       30130-CREATE-RENTAL-AGREEMENT.
           INITIALIZE WS-RENTAL-AGREEMENT
           MOVE WS-ASSIGNED-BOX TO RENTAL-BOX-NUMBER
           MOVE WS-CUSTOMER-ID TO RENTAL-CUSTOMER
           MOVE WS-PROCESS-DATE TO RENTAL-START-DATE
           COMPUTE RENTAL-ANNUAL-FEE = 
              WS-BOX-SIZE-FEE(WS-REQUESTED-SIZE)
           WRITE RENTAL-RECORD FROM WS-RENTAL-AGREEMENT.

       30200-BOX-ACCESS.
           IF WS-ACCESS-REQUEST = 'Y'
              PERFORM 30210-VERIFY-RENTER
              IF WS-RENTER-VERIFIED = 'Y'
                 PERFORM 30220-LOG-ACCESS
                 PERFORM 30230-ESCORT-TO-VAULT
              END-IF
           END-IF.

       30210-VERIFY-RENTER.
           MOVE 'N' TO WS-RENTER-VERIFIED
           IF BOX-RENTER(WS-BOX-NUMBER) = WS-CUSTOMER-ID
              IF WS-ID-VERIFIED = 'Y'
                 IF WS-KEY-VERIFIED = 'Y'
                    MOVE 'Y' TO WS-RENTER-VERIFIED
                 END-IF
              END-IF
           END-IF.

       30220-LOG-ACCESS.
           INITIALIZE WS-ACCESS-LOG
           MOVE WS-BOX-NUMBER TO ACCESS-BOX-NUMBER
           MOVE WS-CUSTOMER-ID TO ACCESS-CUSTOMER
           MOVE WS-PROCESS-DATE TO ACCESS-DATE
           MOVE FUNCTION CURRENT-TIME TO ACCESS-TIME
           MOVE 'ENTRY' TO ACCESS-TYPE
           WRITE ACCESS-LOG-RECORD FROM WS-ACCESS-LOG.

       30230-ESCORT-TO-VAULT.
           MOVE 'VAULT ACCESS GRANTED' TO WS-DISPLAY-MSG
           DISPLAY WS-DISPLAY-MSG.

       30300-BOX-DRILLING.
           IF WS-DRILLING-REQUEST = 'Y'
              PERFORM 30310-VALIDATE-DRILLING-AUTH
              IF WS-DRILLING-AUTHORIZED = 'Y'
                 PERFORM 30320-SCHEDULE-DRILLING
                 PERFORM 30330-NOTIFY-RENTER
              END-IF
           END-IF.

       30310-VALIDATE-DRILLING-AUTH.
           MOVE 'N' TO WS-DRILLING-AUTHORIZED
           IF WS-RENT-DELINQUENT-MONTHS >= 12
              MOVE 'Y' TO WS-DRILLING-AUTHORIZED
           END-IF
           IF WS-COURT-ORDER = 'Y'
              MOVE 'Y' TO WS-DRILLING-AUTHORIZED
           END-IF
           IF WS-DECEASED-RENTER = 'Y'
              IF WS-EXECUTOR-VERIFIED = 'Y'
                 MOVE 'Y' TO WS-DRILLING-AUTHORIZED
              END-IF
           END-IF.

       30320-SCHEDULE-DRILLING.
           INITIALIZE WS-DRILLING-RECORD
           MOVE WS-BOX-NUMBER TO DRILL-BOX-NUMBER
           MOVE WS-DRILLING-REASON TO DRILL-REASON
           COMPUTE DRILL-SCHEDULED-DATE = 
              FUNCTION INTEGER-OF-DATE(WS-PROCESS-DATE) + 30
           WRITE DRILLING-RECORD FROM WS-DRILLING-RECORD.

       30330-NOTIFY-RENTER.
           MOVE 'BOX-DRILLING' TO WS-NOTIF-TYPE
           MOVE 'MAIL' TO WS-NOTIF-CHANNEL
           MOVE 'Important notice regarding your safe deposit box'
              TO WS-NOTIF-SUBJECT
           PERFORM 15000-SEND-NOTIFICATION.

       30400-BOX-BILLING.
           PERFORM VARYING WS-BOX-IDX FROM 1 BY 1
              UNTIL WS-BOX-IDX > WS-TOTAL-BOXES
              IF BOX-STATUS(WS-BOX-IDX) = 'R'
                 IF BOX-RENEWAL-DUE(WS-BOX-IDX) = 'Y'
                    PERFORM 30410-CHARGE-ANNUAL-FEE
                 END-IF
              END-IF
           END-PERFORM.

       30410-CHARGE-ANNUAL-FEE.
           MOVE BOX-RENTER(WS-BOX-IDX) TO WS-CUSTOMER-ID
           MOVE BOX-ANNUAL-FEE(WS-BOX-IDX) TO WS-FEE-AMOUNT
           SUBTRACT WS-FEE-AMOUNT FROM WS-ACCOUNT-BALANCE
           PERFORM 2350-UPDATE-ACCOUNT
           COMPUTE BOX-NEXT-RENEWAL(WS-BOX-IDX) = 
              BOX-NEXT-RENEWAL(WS-BOX-IDX) + 10000.

      *----------------------------------------------------------------*
      * MERCHANT SERVICES PROCEDURES                                   *
      *----------------------------------------------------------------*
       31000-MERCHANT-SERVICES.
           PERFORM 31100-PROCESS-AUTHORIZATION
           PERFORM 31200-CAPTURE-TRANSACTION
           PERFORM 31300-PROCESS-SETTLEMENT
           PERFORM 31400-HANDLE-CHARGEBACK.

       31100-PROCESS-AUTHORIZATION.
           PERFORM 31110-VALIDATE-CARD
           IF WS-CARD-VALID = 'Y'
              PERFORM 31120-CHECK-FRAUD-SCORE
              IF WS-FRAUD-APPROVED = 'Y'
                 PERFORM 31130-CHECK-AVAILABLE-CREDIT
                 IF WS-CREDIT-AVAILABLE = 'Y'
                    PERFORM 31140-APPROVE-AUTH
                 ELSE
                    PERFORM 31150-DECLINE-AUTH
                 END-IF
              ELSE
                 PERFORM 31150-DECLINE-AUTH
              END-IF
           ELSE
              PERFORM 31150-DECLINE-AUTH
           END-IF.

       31110-VALIDATE-CARD.
           MOVE 'N' TO WS-CARD-VALID
           PERFORM 31115-CHECK-LUHN
           IF WS-LUHN-VALID = 'Y'
              PERFORM 31116-CHECK-EXPIRY
              IF WS-NOT-EXPIRED = 'Y'
                 PERFORM 31117-CHECK-CVV
                 IF WS-CVV-VALID = 'Y'
                    MOVE 'Y' TO WS-CARD-VALID
                 END-IF
              END-IF
           END-IF.

       31115-CHECK-LUHN.
           MOVE ZEROES TO WS-LUHN-SUM
           PERFORM VARYING WS-LUHN-IDX FROM 16 BY -1
              UNTIL WS-LUHN-IDX < 1
              MOVE WS-AUTH-CARD-NUMBER(WS-LUHN-IDX:1) 
                 TO WS-LUHN-DIGIT
              IF FUNCTION MOD(17 - WS-LUHN-IDX, 2) = 0
                 MULTIPLY 2 BY WS-LUHN-DIGIT
                 IF WS-LUHN-DIGIT > 9
                    SUBTRACT 9 FROM WS-LUHN-DIGIT
                 END-IF
              END-IF
              ADD WS-LUHN-DIGIT TO WS-LUHN-SUM
           END-PERFORM
           IF FUNCTION MOD(WS-LUHN-SUM, 10) = 0
              MOVE 'Y' TO WS-LUHN-VALID
           ELSE
              MOVE 'N' TO WS-LUHN-VALID
           END-IF.

       31116-CHECK-EXPIRY.
           IF WS-AUTH-EXPIRY-DATE >= WS-PROCESS-DATE
              MOVE 'Y' TO WS-NOT-EXPIRED
           ELSE
              MOVE 'N' TO WS-NOT-EXPIRED
           END-IF.

       31117-CHECK-CVV.
           CALL 'CVVVERIFY' USING WS-AUTH-CARD-NUMBER 
              WS-AUTH-CVV WS-CVV-RESULT
           IF WS-CVV-RESULT = 'M'
              MOVE 'Y' TO WS-CVV-VALID
           ELSE
              MOVE 'N' TO WS-CVV-VALID
           END-IF.

       31120-CHECK-FRAUD-SCORE.
           CALL 'FRAUDCHECK' USING WS-AUTH-REQUEST WS-FRAUD-RESPONSE
           IF FRAUD-SCORE < 70
              MOVE 'Y' TO WS-FRAUD-APPROVED
           ELSE
              MOVE 'N' TO WS-FRAUD-APPROVED
              MOVE FRAUD-DECLINE-CODE TO WS-AUTH-DECLINE-CODE
           END-IF.

       31130-CHECK-AVAILABLE-CREDIT.
           MOVE WS-AUTH-CARD-NUMBER TO WS-SEARCH-KEY
           READ CARD-ACCOUNT-FILE INTO WS-CARD-ACCOUNT-REC
           IF WS-AVAILABLE-CREDIT >= WS-AUTH-AMOUNT
              MOVE 'Y' TO WS-CREDIT-AVAILABLE
           ELSE
              MOVE 'N' TO WS-CREDIT-AVAILABLE
              MOVE '51' TO WS-AUTH-DECLINE-CODE
           END-IF.

       31140-APPROVE-AUTH.
           MOVE '00' TO WS-AUTH-RESPONSE-CODE
           PERFORM 31145-GENERATE-AUTH-CODE
           SUBTRACT WS-AUTH-AMOUNT FROM WS-AVAILABLE-CREDIT
           PERFORM 31146-RECORD-AUTHORIZATION.

       31145-GENERATE-AUTH-CODE.
           COMPUTE WS-AUTH-CODE = FUNCTION RANDOM * 999999
           MOVE WS-AUTH-CODE TO WS-AUTH-RESPONSE-AUTH-CODE.

       31146-RECORD-AUTHORIZATION.
           INITIALIZE WS-AUTH-RECORD
           MOVE WS-AUTH-CARD-NUMBER TO AUTH-REC-CARD
           MOVE WS-AUTH-AMOUNT TO AUTH-REC-AMOUNT
           MOVE WS-AUTH-RESPONSE-AUTH-CODE TO AUTH-REC-CODE
           MOVE WS-PROCESS-DATE TO AUTH-REC-DATE
           MOVE FUNCTION CURRENT-TIME TO AUTH-REC-TIME
           MOVE WS-MERCHANT-ID TO AUTH-REC-MERCHANT
           MOVE 'P' TO AUTH-REC-STATUS
           WRITE AUTH-RECORD FROM WS-AUTH-RECORD.

       31150-DECLINE-AUTH.
           MOVE WS-AUTH-DECLINE-CODE TO WS-AUTH-RESPONSE-CODE
           INITIALIZE WS-DECLINE-RECORD
           MOVE WS-AUTH-CARD-NUMBER TO DECLINE-REC-CARD
           MOVE WS-AUTH-AMOUNT TO DECLINE-REC-AMOUNT
           MOVE WS-AUTH-DECLINE-CODE TO DECLINE-REC-CODE
           MOVE WS-PROCESS-DATE TO DECLINE-REC-DATE
           WRITE DECLINE-RECORD FROM WS-DECLINE-RECORD.

       31200-CAPTURE-TRANSACTION.
           IF WS-CAPTURE-REQUEST = 'Y'
              PERFORM 31210-VALIDATE-AUTH-CODE
              IF WS-AUTH-VALID = 'Y'
                 PERFORM 31220-CREATE-CAPTURE-RECORD
              END-IF
           END-IF.

       31210-VALIDATE-AUTH-CODE.
           MOVE 'N' TO WS-AUTH-VALID
           MOVE WS-CAPTURE-AUTH-CODE TO AUTH-SEARCH-KEY
           READ AUTH-FILE INTO WS-AUTH-REC
              KEY IS AUTH-CODE
              INVALID KEY
                 MOVE 'N' TO WS-AUTH-VALID
              NOT INVALID KEY
                 IF AUTH-REC-STATUS = 'P'
                    MOVE 'Y' TO WS-AUTH-VALID
                 END-IF
           END-READ.

       31220-CREATE-CAPTURE-RECORD.
           MOVE 'C' TO AUTH-REC-STATUS
           REWRITE AUTH-RECORD FROM WS-AUTH-REC
           INITIALIZE WS-CAPTURE-RECORD
           MOVE AUTH-REC-CARD TO CAPTURE-CARD
           MOVE WS-CAPTURE-AMOUNT TO CAPTURE-AMOUNT
           MOVE WS-CAPTURE-AUTH-CODE TO CAPTURE-AUTH-CODE
           MOVE WS-PROCESS-DATE TO CAPTURE-DATE
           WRITE CAPTURE-RECORD FROM WS-CAPTURE-RECORD.

       31300-PROCESS-SETTLEMENT.
           PERFORM 31310-BATCH-TRANSACTIONS
           PERFORM 31320-CALCULATE-FEES
           PERFORM 31330-CREATE-FUNDING-RECORD
           PERFORM 31340-SEND-SETTLEMENT-FILE.

       31310-BATCH-TRANSACTIONS.
           MOVE ZEROES TO WS-BATCH-TOTAL
           MOVE ZEROES TO WS-BATCH-COUNT
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ CAPTURE-FILE INTO WS-CAPTURE-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    IF CAPTURE-SETTLED = 'N'
                       ADD CAPTURE-AMOUNT TO WS-BATCH-TOTAL
                       ADD 1 TO WS-BATCH-COUNT
                       MOVE 'Y' TO CAPTURE-SETTLED
                       REWRITE CAPTURE-RECORD FROM WS-CAPTURE-REC
                    END-IF
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       31320-CALCULATE-FEES.
           COMPUTE WS-INTERCHANGE-FEE = 
              WS-BATCH-TOTAL * 0.0175
           COMPUTE WS-ASSESSMENT-FEE = 
              WS-BATCH-TOTAL * 0.0015
           COMPUTE WS-PROCESSOR-FEE = 
              WS-BATCH-COUNT * 0.10
           COMPUTE WS-TOTAL-FEES = 
              WS-INTERCHANGE-FEE + WS-ASSESSMENT-FEE + 
              WS-PROCESSOR-FEE.

       31330-CREATE-FUNDING-RECORD.
           COMPUTE WS-NET-FUNDING = 
              WS-BATCH-TOTAL - WS-TOTAL-FEES
           INITIALIZE WS-FUNDING-RECORD
           MOVE WS-MERCHANT-ID TO FUNDING-MERCHANT
           MOVE WS-NET-FUNDING TO FUNDING-AMOUNT
           MOVE WS-TOTAL-FEES TO FUNDING-FEES
           COMPUTE FUNDING-DATE = 
              FUNCTION INTEGER-OF-DATE(WS-PROCESS-DATE) + 2
           WRITE FUNDING-RECORD FROM WS-FUNDING-RECORD.

       31340-SEND-SETTLEMENT-FILE.
           OPEN OUTPUT SETTLEMENT-FILE
           PERFORM 31345-WRITE-SETTLEMENT-HEADER
           PERFORM 31346-WRITE-SETTLEMENT-DETAIL
           PERFORM 31347-WRITE-SETTLEMENT-TRAILER
           CLOSE SETTLEMENT-FILE.

       31345-WRITE-SETTLEMENT-HEADER.
           INITIALIZE WS-SETTLE-HEADER
           MOVE 'H' TO SETTLE-RECORD-TYPE
           MOVE WS-MERCHANT-ID TO SETTLE-MERCHANT-ID
           MOVE WS-PROCESS-DATE TO SETTLE-DATE
           WRITE SETTLEMENT-RECORD FROM WS-SETTLE-HEADER.

       31346-WRITE-SETTLEMENT-DETAIL.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ CAPTURE-FILE INTO WS-CAPTURE-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    IF CAPTURE-SETTLED = 'Y'
                       INITIALIZE WS-SETTLE-DETAIL
                       MOVE 'D' TO SETTLE-RECORD-TYPE
                       MOVE CAPTURE-CARD TO SETTLE-CARD
                       MOVE CAPTURE-AMOUNT TO SETTLE-AMOUNT
                       MOVE CAPTURE-AUTH-CODE TO SETTLE-AUTH-CODE
                       WRITE SETTLEMENT-RECORD FROM WS-SETTLE-DETAIL
                    END-IF
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       31347-WRITE-SETTLEMENT-TRAILER.
           INITIALIZE WS-SETTLE-TRAILER
           MOVE 'T' TO SETTLE-RECORD-TYPE
           MOVE WS-BATCH-COUNT TO SETTLE-TOTAL-COUNT
           MOVE WS-BATCH-TOTAL TO SETTLE-TOTAL-AMOUNT
           WRITE SETTLEMENT-RECORD FROM WS-SETTLE-TRAILER.

       31400-HANDLE-CHARGEBACK.
           IF WS-CHARGEBACK-REQUEST = 'Y'
              PERFORM 31410-RECEIVE-CHARGEBACK
              PERFORM 31420-RESEARCH-TRANSACTION
              PERFORM 31430-RESPOND-TO-CHARGEBACK
           END-IF.

       31410-RECEIVE-CHARGEBACK.
           INITIALIZE WS-CHARGEBACK-RECORD
           MOVE WS-CB-CARD-NUMBER TO CB-CARD
           MOVE WS-CB-AMOUNT TO CB-AMOUNT
           MOVE WS-CB-REASON-CODE TO CB-REASON
           MOVE WS-CB-CASE-NUMBER TO CB-CASE-ID
           MOVE WS-PROCESS-DATE TO CB-RECEIVED-DATE
           MOVE 'RECEIVED' TO CB-STATUS
           WRITE CHARGEBACK-RECORD FROM WS-CHARGEBACK-RECORD.

       31420-RESEARCH-TRANSACTION.
           MOVE WS-CB-AUTH-CODE TO AUTH-SEARCH-KEY
           READ AUTH-FILE INTO WS-ORIGINAL-AUTH
           IF WS-ORIGINAL-AUTH NOT = SPACES
              MOVE 'Y' TO WS-TRANS-FOUND
           ELSE
              MOVE 'N' TO WS-TRANS-FOUND
           END-IF.

       31430-RESPOND-TO-CHARGEBACK.
           IF WS-TRANS-FOUND = 'Y'
              EVALUATE WS-CB-REASON-CODE
                 WHEN '4837'
                    PERFORM 31435-NO-CARD-PRESENT-RESPONSE
                 WHEN '4853'
                    PERFORM 31436-MERCHANDISE-RESPONSE
                 WHEN '4863'
                    PERFORM 31437-FRAUD-RESPONSE
                 WHEN OTHER
                    PERFORM 31438-GENERAL-RESPONSE
              END-EVALUATE
           ELSE
              PERFORM 31439-ACCEPT-CHARGEBACK
           END-IF.

       31435-NO-CARD-PRESENT-RESPONSE.
           IF WS-AVS-MATCH = 'Y' AND WS-CVV-MATCH = 'Y'
              MOVE 'REPRESENT' TO CB-ACTION
              MOVE 'DISPUTE' TO CB-STATUS
           ELSE
              PERFORM 31439-ACCEPT-CHARGEBACK
           END-IF.

       31436-MERCHANDISE-RESPONSE.
           IF WS-DELIVERY-PROOF = 'Y'
              MOVE 'REPRESENT' TO CB-ACTION
              MOVE 'DISPUTE' TO CB-STATUS
           ELSE
              PERFORM 31439-ACCEPT-CHARGEBACK
           END-IF.

       31437-FRAUD-RESPONSE.
           IF WS-3DS-VERIFIED = 'Y'
              MOVE 'REPRESENT' TO CB-ACTION
              MOVE 'DISPUTE' TO CB-STATUS
           ELSE
              PERFORM 31439-ACCEPT-CHARGEBACK
           END-IF.

       31438-GENERAL-RESPONSE.
           MOVE 'ACCEPT' TO CB-ACTION
           PERFORM 31439-ACCEPT-CHARGEBACK.

       31439-ACCEPT-CHARGEBACK.
           MOVE 'ACCEPTED' TO CB-STATUS
           SUBTRACT WS-CB-AMOUNT FROM WS-MERCHANT-BALANCE
           ADD WS-CB-FEE TO WS-FEES-CHARGED.

      *----------------------------------------------------------------*
      * UTILITY PROCEDURES                                             *
      *----------------------------------------------------------------*
       99000-DATE-UTILITIES.
           PERFORM 99100-GET-CURRENT-DATE
           PERFORM 99200-CALCULATE-BUSINESS-DAYS
           PERFORM 99300-CHECK-HOLIDAY
           PERFORM 99400-FORMAT-DATE.

       99100-GET-CURRENT-DATE.
           MOVE FUNCTION CURRENT-DATE TO WS-CURRENT-DATETIME
           MOVE WS-CURR-YEAR TO WS-WORK-YEAR
           MOVE WS-CURR-MONTH TO WS-WORK-MONTH
           MOVE WS-CURR-DAY TO WS-WORK-DAY.

       99200-CALCULATE-BUSINESS-DAYS.
           MOVE ZEROES TO WS-BUSINESS-DAYS
           MOVE WS-START-DATE TO WS-CALC-DATE
           PERFORM UNTIL WS-CALC-DATE > WS-END-DATE
              PERFORM 99210-CHECK-IF-BUSINESS-DAY
              IF WS-IS-BUSINESS-DAY = 'Y'
                 ADD 1 TO WS-BUSINESS-DAYS
              END-IF
              ADD 1 TO WS-CALC-DATE
           END-PERFORM.

       99210-CHECK-IF-BUSINESS-DAY.
           MOVE 'Y' TO WS-IS-BUSINESS-DAY
           COMPUTE WS-DAY-OF-WEEK = 
              FUNCTION MOD(
                 FUNCTION INTEGER-OF-DATE(WS-CALC-DATE), 7)
           IF WS-DAY-OF-WEEK = 0 OR WS-DAY-OF-WEEK = 6
              MOVE 'N' TO WS-IS-BUSINESS-DAY
           END-IF
           PERFORM 99300-CHECK-HOLIDAY
           IF WS-IS-HOLIDAY = 'Y'
              MOVE 'N' TO WS-IS-BUSINESS-DAY
           END-IF.

       99300-CHECK-HOLIDAY.
           MOVE 'N' TO WS-IS-HOLIDAY
           PERFORM VARYING WS-HOL-IDX FROM 1 BY 1
              UNTIL WS-HOL-IDX > WS-HOLIDAY-COUNT
              IF HOLIDAY-DATE(WS-HOL-IDX) = WS-CALC-DATE
                 MOVE 'Y' TO WS-IS-HOLIDAY
                 EXIT PERFORM
              END-IF
           END-PERFORM.

       99400-FORMAT-DATE.
           EVALUATE WS-DATE-FORMAT
              WHEN 'MMDDYYYY'
                 STRING WS-WORK-MONTH DELIMITED SIZE
                        '/' DELIMITED SIZE
                        WS-WORK-DAY DELIMITED SIZE
                        '/' DELIMITED SIZE
                        WS-WORK-YEAR DELIMITED SIZE
                    INTO WS-FORMATTED-DATE
              WHEN 'DDMMYYYY'
                 STRING WS-WORK-DAY DELIMITED SIZE
                        '/' DELIMITED SIZE
                        WS-WORK-MONTH DELIMITED SIZE
                        '/' DELIMITED SIZE
                        WS-WORK-YEAR DELIMITED SIZE
                    INTO WS-FORMATTED-DATE
              WHEN 'YYYYMMDD'
                 STRING WS-WORK-YEAR DELIMITED SIZE
                        '-' DELIMITED SIZE
                        WS-WORK-MONTH DELIMITED SIZE
                        '-' DELIMITED SIZE
                        WS-WORK-DAY DELIMITED SIZE
                    INTO WS-FORMATTED-DATE
           END-EVALUATE.

       99500-STRING-UTILITIES.
           PERFORM 99510-LEFT-TRIM
           PERFORM 99520-RIGHT-TRIM
           PERFORM 99530-PAD-LEFT
           PERFORM 99540-PAD-RIGHT.

       99510-LEFT-TRIM.
           INSPECT WS-INPUT-STRING TALLYING WS-LEAD-SPACES
              FOR LEADING SPACES
           MOVE WS-INPUT-STRING(WS-LEAD-SPACES + 1:) 
              TO WS-OUTPUT-STRING.

       99520-RIGHT-TRIM.
           MOVE FUNCTION LENGTH(WS-INPUT-STRING) TO WS-STRING-LEN
           INSPECT FUNCTION REVERSE(WS-INPUT-STRING) 
              TALLYING WS-TRAIL-SPACES FOR LEADING SPACES
           COMPUTE WS-ACTUAL-LEN = WS-STRING-LEN - WS-TRAIL-SPACES
           MOVE WS-INPUT-STRING(1:WS-ACTUAL-LEN) 
              TO WS-OUTPUT-STRING.

       99530-PAD-LEFT.
           COMPUTE WS-PAD-COUNT = WS-TARGET-LEN - WS-ACTUAL-LEN
           IF WS-PAD-COUNT > 0
              STRING WS-PAD-CHAR DELIMITED SIZE
                     WS-INPUT-STRING DELIMITED SIZE
                 INTO WS-OUTPUT-STRING
           ELSE
              MOVE WS-INPUT-STRING TO WS-OUTPUT-STRING
           END-IF.

       99540-PAD-RIGHT.
           COMPUTE WS-PAD-COUNT = WS-TARGET-LEN - WS-ACTUAL-LEN
           IF WS-PAD-COUNT > 0
              STRING WS-INPUT-STRING DELIMITED SIZE
                     WS-PAD-CHAR DELIMITED SIZE
                 INTO WS-OUTPUT-STRING
           ELSE
              MOVE WS-INPUT-STRING TO WS-OUTPUT-STRING
           END-IF.

       99600-NUMERIC-UTILITIES.
           PERFORM 99610-ROUND-AMOUNT
           PERFORM 99620-CALCULATE-PERCENTAGE
           PERFORM 99630-CALCULATE-COMPOUND-INTEREST.

       99610-ROUND-AMOUNT.
           COMPUTE WS-ROUNDED-AMOUNT ROUNDED = WS-INPUT-AMOUNT.

       99620-CALCULATE-PERCENTAGE.
           IF WS-BASE-AMOUNT > 0
              COMPUTE WS-PERCENTAGE = 
                 (WS-PART-AMOUNT / WS-BASE-AMOUNT) * 100
           ELSE
              MOVE ZEROES TO WS-PERCENTAGE
           END-IF.

       99630-CALCULATE-COMPOUND-INTEREST.
           COMPUTE WS-COMPOUND-RESULT = 
              WS-PRINCIPAL * 
              ((1 + WS-RATE / WS-COMPOUNDS-PER-YEAR) ** 
               (WS-COMPOUNDS-PER-YEAR * WS-YEARS)).

       99700-FILE-UTILITIES.
           PERFORM 99710-CHECK-FILE-STATUS
           PERFORM 99720-LOG-FILE-ERROR.

       99710-CHECK-FILE-STATUS.
           EVALUATE WS-FILE-STATUS
              WHEN '00'
                 MOVE 'SUCCESS' TO WS-FILE-RESULT
              WHEN '10'
                 MOVE 'END OF FILE' TO WS-FILE-RESULT
              WHEN '21'
                 MOVE 'SEQUENCE ERROR' TO WS-FILE-RESULT
              WHEN '22'
                 MOVE 'DUPLICATE KEY' TO WS-FILE-RESULT
              WHEN '23'
                 MOVE 'RECORD NOT FOUND' TO WS-FILE-RESULT
              WHEN '24'
                 MOVE 'BOUNDARY VIOLATION' TO WS-FILE-RESULT
              WHEN '30'
                 MOVE 'PERMANENT ERROR' TO WS-FILE-RESULT
              WHEN '35'
                 MOVE 'FILE NOT FOUND' TO WS-FILE-RESULT
              WHEN '39'
                 MOVE 'ATTRIBUTE CONFLICT' TO WS-FILE-RESULT
              WHEN '41'
                 MOVE 'FILE ALREADY OPEN' TO WS-FILE-RESULT
              WHEN '42'
                 MOVE 'FILE NOT OPEN' TO WS-FILE-RESULT
              WHEN '43'
                 MOVE 'READ NOT DONE' TO WS-FILE-RESULT
              WHEN '44'
                 MOVE 'RECORD OVERFLOW' TO WS-FILE-RESULT
              WHEN '46'
                 MOVE 'READ ERROR' TO WS-FILE-RESULT
              WHEN '47'
                 MOVE 'INPUT FILE NOT OPEN' TO WS-FILE-RESULT
              WHEN '48'
                 MOVE 'OUTPUT FILE NOT OPEN' TO WS-FILE-RESULT
              WHEN '49'
                 MOVE 'I-O FILE NOT OPEN' TO WS-FILE-RESULT
              WHEN OTHER
                 MOVE 'UNKNOWN ERROR' TO WS-FILE-RESULT
           END-EVALUATE.

       99720-LOG-FILE-ERROR.
           INITIALIZE WS-FILE-ERROR-LOG
           MOVE WS-FILE-NAME TO FILE-ERR-NAME
           MOVE WS-FILE-STATUS TO FILE-ERR-STATUS
           MOVE WS-FILE-RESULT TO FILE-ERR-MSG
           MOVE FUNCTION CURRENT-DATE TO FILE-ERR-TIMESTAMP
           WRITE FILE-ERROR-RECORD FROM WS-FILE-ERROR-LOG.

       99800-LOGGING-UTILITIES.
           PERFORM 99810-LOG-INFO
           PERFORM 99820-LOG-WARNING
           PERFORM 99830-LOG-ERROR.

       99810-LOG-INFO.
           MOVE 'INFO' TO LOG-LEVEL
           MOVE WS-LOG-MESSAGE TO LOG-MESSAGE
           MOVE FUNCTION CURRENT-DATE TO LOG-TIMESTAMP
           WRITE LOG-RECORD FROM WS-LOG-ENTRY.

       99820-LOG-WARNING.
           MOVE 'WARN' TO LOG-LEVEL
           MOVE WS-LOG-MESSAGE TO LOG-MESSAGE
           MOVE FUNCTION CURRENT-DATE TO LOG-TIMESTAMP
           WRITE LOG-RECORD FROM WS-LOG-ENTRY.

       99830-LOG-ERROR.
           MOVE 'ERROR' TO LOG-LEVEL
           MOVE WS-LOG-MESSAGE TO LOG-MESSAGE
           MOVE FUNCTION CURRENT-DATE TO LOG-TIMESTAMP
           WRITE LOG-RECORD FROM WS-LOG-ENTRY.

       99900-ERROR-HANDLING.
           PERFORM 99910-FORMAT-ERROR
           PERFORM 99920-DISPLAY-ERROR
           PERFORM 99930-WRITE-ERROR-LOG.

       99910-FORMAT-ERROR.
           STRING 'ERROR: ' DELIMITED SIZE
                  WS-ERROR-CODE DELIMITED SIZE
                  ' - ' DELIMITED SIZE
                  WS-ERROR-MSG DELIMITED SIZE
              INTO WS-FORMATTED-ERROR.

       99920-DISPLAY-ERROR.
           DISPLAY WS-FORMATTED-ERROR.

       99930-WRITE-ERROR-LOG.
           INITIALIZE WS-ERROR-LOG-REC
           MOVE WS-ERROR-CODE TO ERR-LOG-CODE
           MOVE WS-ERROR-MSG TO ERR-LOG-MSG
           MOVE FUNCTION CURRENT-DATE TO ERR-LOG-TIMESTAMP
           MOVE WS-PROGRAM-NAME TO ERR-LOG-PROGRAM
           MOVE WS-PARAGRAPH-NAME TO ERR-LOG-PARAGRAPH
           WRITE ERROR-LOG-RECORD FROM WS-ERROR-LOG-REC.

      *================================================================*
      * END OF MEGA-ENTERPRISE COBOL PROGRAM                          *
      * TOTAL PROCEDURES: 200+                                        *
      * COVERS: BANKING, LOANS, INVESTMENTS, INSURANCE, PAYROLL,      *
      *         COMPLIANCE, CUSTOMER SERVICE, MERCHANT SERVICES       *
      *================================================================*


      *================================================================*
      * ADDITIONAL DATA STRUCTURES FOR EXTENDED FUNCTIONALITY         *
      *================================================================*
       01  WS-TREASURY-MANAGEMENT.
           05  WS-CASH-POSITION          PIC 9(15)V99.
           05  WS-PROJECTED-INFLOWS      PIC 9(15)V99.
           05  WS-PROJECTED-OUTFLOWS     PIC 9(15)V99.
           05  WS-NET-POSITION           PIC S9(15)V99.
           05  WS-INVESTMENT-POOL        PIC 9(15)V99.
           05  WS-BORROWING-CAPACITY     PIC 9(15)V99.
           05  WS-RESERVE-REQUIREMENT    PIC 9(15)V99.
           05  WS-EXCESS-RESERVES        PIC 9(15)V99.
           05  WS-FED-FUNDS-RATE         PIC 9(02)V9999.
           05  WS-DISCOUNT-RATE          PIC 9(02)V9999.
           05  WS-PRIME-RATE             PIC 9(02)V9999.

       01  WS-LIQUIDITY-MANAGEMENT.
           05  WS-LIQUID-ASSETS          PIC 9(15)V99.
           05  WS-TOTAL-DEPOSITS         PIC 9(15)V99.
           05  WS-LIQUIDITY-RATIO        PIC 9(03)V99.
           05  WS-LCR-NUMERATOR          PIC 9(15)V99.
           05  WS-LCR-DENOMINATOR        PIC 9(15)V99.
           05  WS-LCR-RATIO              PIC 9(03)V99.
           05  WS-NSFR-AVAILABLE         PIC 9(15)V99.
           05  WS-NSFR-REQUIRED          PIC 9(15)V99.
           05  WS-NSFR-RATIO             PIC 9(03)V99.

       01  WS-CAPITAL-MANAGEMENT.
           05  WS-TIER1-CAPITAL          PIC 9(15)V99.
           05  WS-TIER2-CAPITAL          PIC 9(15)V99.
           05  WS-TOTAL-CAPITAL          PIC 9(15)V99.
           05  WS-RISK-WEIGHTED-ASSETS   PIC 9(15)V99.
           05  WS-CAPITAL-RATIO          PIC 9(03)V99.
           05  WS-LEVERAGE-RATIO         PIC 9(03)V99.
           05  WS-CET1-RATIO             PIC 9(03)V99.
           05  WS-CAPITAL-BUFFER         PIC 9(03)V99.
           05  WS-COUNTERCYCLICAL-BUF    PIC 9(03)V99.

       01  WS-ASSET-LIABILITY-MGMT.
           05  WS-RATE-SENSITIVE-ASSETS  PIC 9(15)V99.
           05  WS-RATE-SENSITIVE-LIAB    PIC 9(15)V99.
           05  WS-GAP-AMOUNT             PIC S9(15)V99.
           05  WS-GAP-RATIO              PIC S9(03)V99.
           05  WS-DURATION-ASSETS        PIC 9(03)V99.
           05  WS-DURATION-LIABILITIES   PIC 9(03)V99.
           05  WS-DURATION-GAP           PIC S9(03)V99.
           05  WS-EVE-SENSITIVITY        PIC S9(15)V99.
           05  WS-NII-SENSITIVITY        PIC S9(15)V99.

       01  WS-STRESS-TESTING.
           05  WS-SCENARIO-ID            PIC X(10).
           05  WS-SCENARIO-NAME          PIC X(50).
           05  WS-SCENARIO-TYPE          PIC X(20).
           05  WS-RATE-SHOCK             PIC S9(03)V99.
           05  WS-GDP-CHANGE             PIC S9(03)V99.
           05  WS-UNEMPLOYMENT-RATE      PIC 9(02)V99.
           05  WS-HOUSING-DECLINE        PIC S9(03)V99.
           05  WS-STRESS-LOSSES          PIC 9(15)V99.
           05  WS-STRESSED-CAPITAL       PIC 9(15)V99.
           05  WS-STRESS-PASS-FAIL       PIC X(04).

       01  WS-MODEL-VALIDATION.
           05  WS-MODEL-ID               PIC X(15).
           05  WS-MODEL-NAME             PIC X(50).
           05  WS-MODEL-TYPE             PIC X(20).
           05  WS-MODEL-STATUS           PIC X(10).
           05  WS-VALIDATION-DATE        PIC 9(08).
           05  WS-NEXT-VALIDATION        PIC 9(08).
           05  WS-BACKTESTING-SCORE      PIC 9(03)V99.
           05  WS-DISCRIMINATORY-POWER   PIC 9(03)V99.
           05  WS-CALIBRATION-SCORE      PIC 9(03)V99.
           05  WS-OVERALL-RATING         PIC X(01).

       01  WS-COLLATERAL-MANAGEMENT.
           05  WS-COLLATERAL-ID          PIC X(15).
           05  WS-COLLATERAL-TYPE        PIC X(20).
           05  WS-COLLATERAL-VALUE       PIC 9(13)V99.
           05  WS-HAIRCUT-PCT            PIC 9(03)V99.
           05  WS-ADJUSTED-VALUE         PIC 9(13)V99.
           05  WS-PLEDGED-TO             PIC X(20).
           05  WS-PLEDGE-DATE            PIC 9(08).
           05  WS-RELEASE-DATE           PIC 9(08).
           05  WS-CUSTODY-LOCATION       PIC X(30).
           05  WS-VALUATION-FREQ         PIC X(10).

       01  WS-DERIVATIVE-POSITION.
           05  WS-DERIVATIVE-ID          PIC X(20).
           05  WS-DERIVATIVE-TYPE        PIC X(10).
              88 DERIV-SWAP              VALUE 'SWAP'.
              88 DERIV-OPTION            VALUE 'OPTION'.
              88 DERIV-FORWARD           VALUE 'FORWARD'.
              88 DERIV-FUTURE            VALUE 'FUTURE'.
           05  WS-NOTIONAL-AMOUNT        PIC 9(15)V99.
           05  WS-FAIR-VALUE             PIC S9(13)V99.
           05  WS-DELTA                  PIC S9(01)V9999.
           05  WS-GAMMA                  PIC S9(01)V9999.
           05  WS-VEGA                   PIC S9(07)V99.
           05  WS-THETA                  PIC S9(07)V99.
           05  WS-RHO                    PIC S9(07)V99.
           05  WS-COUNTERPARTY-ID        PIC X(15).
           05  WS-MATURITY-DATE          PIC 9(08).

       01  WS-HEDGE-ACCOUNTING.
           05  WS-HEDGE-ID               PIC X(15).
           05  WS-HEDGE-TYPE             PIC X(20).
           05  WS-HEDGED-ITEM            PIC X(30).
           05  WS-HEDGING-INSTRUMENT     PIC X(30).
           05  WS-HEDGE-RATIO            PIC 9(01)V9999.
           05  WS-EFFECTIVENESS-TEST     PIC X(10).
           05  WS-PROSPECTIVE-EFF        PIC 9(03)V99.
           05  WS-RETROSPECTIVE-EFF      PIC 9(03)V99.
           05  WS-INEFFECTIVENESS        PIC S9(09)V99.
           05  WS-HEDGE-DESIGNATION      PIC 9(08).

       01  WS-SECURITIZATION.
           05  WS-DEAL-ID                PIC X(20).
           05  WS-DEAL-NAME              PIC X(50).
           05  WS-ASSET-CLASS            PIC X(20).
           05  WS-POOL-BALANCE           PIC 9(15)V99.
           05  WS-TRANCHE-TABLE.
               10 WS-TRANCHE OCCURS 10 TIMES.
                   15 TRANCHE-CLASS      PIC X(05).
                   15 TRANCHE-BALANCE    PIC 9(13)V99.
                   15 TRANCHE-RATE       PIC 9(02)V9999.
                   15 TRANCHE-RATING     PIC X(05).
                   15 TRANCHE-CE-PCT     PIC 9(03)V99.
           05  WS-WATERFALL-TYPE         PIC X(20).
           05  WS-SERVICER-ID            PIC X(15).

       01  WS-REGULATORY-REPORTING.
           05  WS-REPORT-ID              PIC X(15).
           05  WS-REPORT-TYPE            PIC X(30).
           05  WS-REPORT-PERIOD          PIC 9(06).
           05  WS-SUBMISSION-DATE        PIC 9(08).
           05  WS-REGULATOR              PIC X(20).
           05  WS-REPORT-STATUS          PIC X(10).
           05  WS-VALIDATION-ERRORS      PIC 9(05).
           05  WS-RESUBMISSION-FLAG      PIC X(01).

       01  WS-GENERAL-LEDGER.
           05  WS-GL-ACCOUNT             PIC X(15).
           05  WS-GL-DESCRIPTION         PIC X(50).
           05  WS-GL-TYPE                PIC X(01).
              88 GL-ASSET                VALUE 'A'.
              88 GL-LIABILITY            VALUE 'L'.
              88 GL-EQUITY               VALUE 'E'.
              88 GL-REVENUE              VALUE 'R'.
              88 GL-EXPENSE              VALUE 'X'.
           05  WS-GL-DEBIT-BALANCE       PIC 9(15)V99.
           05  WS-GL-CREDIT-BALANCE      PIC 9(15)V99.
           05  WS-GL-NET-BALANCE         PIC S9(15)V99.
           05  WS-GL-BUDGET-AMOUNT       PIC 9(15)V99.
           05  WS-GL-VARIANCE            PIC S9(15)V99.

       01  WS-JOURNAL-ENTRY.
           05  WS-JE-NUMBER              PIC 9(10).
           05  WS-JE-DATE                PIC 9(08).
           05  WS-JE-DESCRIPTION         PIC X(100).
           05  WS-JE-TYPE                PIC X(10).
           05  WS-JE-STATUS              PIC X(10).
           05  WS-JE-CREATED-BY          PIC X(10).
           05  WS-JE-APPROVED-BY         PIC X(10).
           05  WS-JE-LINES.
               10 WS-JE-LINE OCCURS 50 TIMES.
                   15 JE-LINE-NUM        PIC 9(03).
                   15 JE-GL-ACCOUNT      PIC X(15).
                   15 JE-DEBIT           PIC 9(13)V99.
                   15 JE-CREDIT          PIC 9(13)V99.
                   15 JE-COST-CENTER     PIC X(10).
                   15 JE-PROJECT-CODE    PIC X(10).

       01  WS-RECONCILIATION.
           05  WS-RECON-ID               PIC X(15).
           05  WS-RECON-TYPE             PIC X(20).
           05  WS-RECON-DATE             PIC 9(08).
           05  WS-BOOK-BALANCE           PIC S9(15)V99.
           05  WS-EXTERNAL-BALANCE       PIC S9(15)V99.
           05  WS-DIFFERENCE             PIC S9(15)V99.
           05  WS-RECON-STATUS           PIC X(10).
           05  WS-OPEN-ITEMS             PIC 9(05).
           05  WS-AGED-ITEMS             PIC 9(05).
           05  WS-LAST-RECON-DATE        PIC 9(08).

       01  WS-AUDIT-TRAIL-EXT.
           05  WS-AUDIT-ID               PIC X(20).
           05  WS-AUDIT-TIMESTAMP        PIC 9(14).
           05  WS-AUDIT-USER             PIC X(10).
           05  WS-AUDIT-ACTION           PIC X(10).
           05  WS-AUDIT-TABLE            PIC X(30).
           05  WS-AUDIT-KEY              PIC X(50).
           05  WS-AUDIT-OLD-VALUE        PIC X(200).
           05  WS-AUDIT-NEW-VALUE        PIC X(200).
           05  WS-AUDIT-IP-ADDRESS       PIC X(15).
           05  WS-AUDIT-SESSION-ID       PIC X(30).

      *----------------------------------------------------------------*
      * TREASURY MANAGEMENT PROCEDURES                                 *
      *----------------------------------------------------------------*
       32000-TREASURY-MANAGEMENT.
           PERFORM 32100-CALCULATE-CASH-POSITION
           PERFORM 32200-PROJECT-CASH-FLOWS
           PERFORM 32300-MANAGE-RESERVES
           PERFORM 32400-MANAGE-INVESTMENTS
           PERFORM 32500-MANAGE-BORROWINGS.

       32100-CALCULATE-CASH-POSITION.
           MOVE ZEROES TO WS-CASH-POSITION
           PERFORM 32110-SUM-VAULT-CASH
           PERFORM 32120-SUM-FED-ACCOUNT
           PERFORM 32130-SUM-CORRESPONDENT-BALANCES.

       32110-SUM-VAULT-CASH.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ VAULT-CASH-FILE INTO WS-VAULT-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    ADD VAULT-BALANCE TO WS-CASH-POSITION
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       32120-SUM-FED-ACCOUNT.
           READ FED-ACCOUNT-FILE INTO WS-FED-BALANCE
           ADD WS-FED-BALANCE TO WS-CASH-POSITION.

       32130-SUM-CORRESPONDENT-BALANCES.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ CORRESPONDENT-FILE INTO WS-CORR-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    ADD CORR-BALANCE TO WS-CASH-POSITION
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       32200-PROJECT-CASH-FLOWS.
           MOVE ZEROES TO WS-PROJECTED-INFLOWS
           MOVE ZEROES TO WS-PROJECTED-OUTFLOWS
           PERFORM 32210-PROJECT-LOAN-PAYMENTS
           PERFORM 32220-PROJECT-DEPOSIT-FLOWS
           PERFORM 32230-PROJECT-INVESTMENT-MATURITIES
           COMPUTE WS-NET-POSITION = 
              WS-CASH-POSITION + WS-PROJECTED-INFLOWS -
              WS-PROJECTED-OUTFLOWS.

       32210-PROJECT-LOAN-PAYMENTS.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ LOAN-SCHEDULE-FILE INTO WS-LOAN-PMT-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    IF LOAN-PMT-DATE <= WS-PROJECTION-DATE
                       ADD LOAN-PMT-AMOUNT TO WS-PROJECTED-INFLOWS
                    END-IF
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       32220-PROJECT-DEPOSIT-FLOWS.
           COMPUTE WS-EXPECTED-DEPOSITS = 
              WS-AVG-DAILY-DEPOSITS * WS-PROJECTION-DAYS
           COMPUTE WS-EXPECTED-WITHDRAWALS = 
              WS-AVG-DAILY-WITHDRAWALS * WS-PROJECTION-DAYS
           ADD WS-EXPECTED-DEPOSITS TO WS-PROJECTED-INFLOWS
           ADD WS-EXPECTED-WITHDRAWALS TO WS-PROJECTED-OUTFLOWS.

       32230-PROJECT-INVESTMENT-MATURITIES.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ INVESTMENT-FILE INTO WS-INV-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    IF INV-MATURITY-DATE <= WS-PROJECTION-DATE
                       ADD INV-PAR-VALUE TO WS-PROJECTED-INFLOWS
                    END-IF
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       32300-MANAGE-RESERVES.
           PERFORM 32310-CALCULATE-RESERVE-REQUIREMENT
           PERFORM 32320-CHECK-RESERVE-POSITION
           IF WS-RESERVE-DEFICIENCY = 'Y'
              PERFORM 32330-COVER-RESERVE-SHORTFALL
           ELSE
              PERFORM 32340-INVEST-EXCESS-RESERVES
           END-IF.

       32310-CALCULATE-RESERVE-REQUIREMENT.
           COMPUTE WS-RESERVE-REQUIREMENT = 
              WS-TOTAL-DEPOSITS * WS-RESERVE-RATIO.

       32320-CHECK-RESERVE-POSITION.
           COMPUTE WS-EXCESS-RESERVES = 
              WS-FED-BALANCE - WS-RESERVE-REQUIREMENT
           IF WS-EXCESS-RESERVES < 0
              MOVE 'Y' TO WS-RESERVE-DEFICIENCY
           ELSE
              MOVE 'N' TO WS-RESERVE-DEFICIENCY
           END-IF.

       32330-COVER-RESERVE-SHORTFALL.
           COMPUTE WS-SHORTFALL-AMOUNT = 
              0 - WS-EXCESS-RESERVES
           PERFORM 32335-BORROW-FED-FUNDS.

       32335-BORROW-FED-FUNDS.
           INITIALIZE WS-FED-FUNDS-TRANSACTION
           MOVE 'BORROW' TO FF-TRANS-TYPE
           MOVE WS-SHORTFALL-AMOUNT TO FF-AMOUNT
           MOVE WS-FED-FUNDS-RATE TO FF-RATE
           MOVE WS-PROCESS-DATE TO FF-SETTLE-DATE
           COMPUTE FF-MATURITY-DATE = 
              FUNCTION INTEGER-OF-DATE(WS-PROCESS-DATE) + 1
           WRITE FED-FUNDS-RECORD FROM WS-FED-FUNDS-TRANSACTION.

       32340-INVEST-EXCESS-RESERVES.
           IF WS-EXCESS-RESERVES > WS-MIN-INVEST-AMOUNT
              PERFORM 32345-SELL-FED-FUNDS
           END-IF.

       32345-SELL-FED-FUNDS.
           INITIALIZE WS-FED-FUNDS-TRANSACTION
           MOVE 'SELL' TO FF-TRANS-TYPE
           MOVE WS-EXCESS-RESERVES TO FF-AMOUNT
           MOVE WS-FED-FUNDS-RATE TO FF-RATE
           MOVE WS-PROCESS-DATE TO FF-SETTLE-DATE
           COMPUTE FF-MATURITY-DATE = 
              FUNCTION INTEGER-OF-DATE(WS-PROCESS-DATE) + 1
           WRITE FED-FUNDS-RECORD FROM WS-FED-FUNDS-TRANSACTION.

       32400-MANAGE-INVESTMENTS.
           PERFORM 32410-REVIEW-INVESTMENT-PORTFOLIO
           PERFORM 32420-EXECUTE-INVESTMENT-STRATEGY
           PERFORM 32430-MARK-TO-MARKET.

       32410-REVIEW-INVESTMENT-PORTFOLIO.
           MOVE ZEROES TO WS-INVESTMENT-POOL
           MOVE ZEROES TO WS-AVG-YIELD
           MOVE ZEROES TO WS-AVG-DURATION
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ INVESTMENT-FILE INTO WS-INV-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    ADD INV-MARKET-VALUE TO WS-INVESTMENT-POOL
                    ADD INV-YIELD TO WS-TOTAL-YIELD
                    ADD INV-DURATION TO WS-TOTAL-DURATION
                    ADD 1 TO WS-INV-COUNT
              END-READ
           END-PERFORM
           IF WS-INV-COUNT > 0
              COMPUTE WS-AVG-YIELD = 
                 WS-TOTAL-YIELD / WS-INV-COUNT
              COMPUTE WS-AVG-DURATION = 
                 WS-TOTAL-DURATION / WS-INV-COUNT
           END-IF
           MOVE 'N' TO WS-EOF-FLAG.

       32420-EXECUTE-INVESTMENT-STRATEGY.
           EVALUATE WS-RATE-OUTLOOK
              WHEN 'RISING'
                 PERFORM 32425-SHORTEN-DURATION
              WHEN 'FALLING'
                 PERFORM 32426-EXTEND-DURATION
              WHEN 'STABLE'
                 PERFORM 32427-MAINTAIN-POSITION
           END-EVALUATE.

       32425-SHORTEN-DURATION.
           DISPLAY 'STRATEGY: SHORTENING PORTFOLIO DURATION'.

       32426-EXTEND-DURATION.
           DISPLAY 'STRATEGY: EXTENDING PORTFOLIO DURATION'.

       32427-MAINTAIN-POSITION.
           DISPLAY 'STRATEGY: MAINTAINING CURRENT POSITION'.

       32430-MARK-TO-MARKET.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ INVESTMENT-FILE INTO WS-INV-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    PERFORM 32435-GET-MARKET-PRICE
                    COMPUTE INV-MARKET-VALUE = 
                       INV-PAR-VALUE * WS-MARKET-PRICE / 100
                    COMPUTE INV-UNREALIZED-GL = 
                       INV-MARKET-VALUE - INV-BOOK-VALUE
                    REWRITE INVESTMENT-RECORD FROM WS-INV-REC
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       32435-GET-MARKET-PRICE.
           MOVE INV-CUSIP TO WS-CUSIP-LOOKUP
           CALL 'BONDPRICE' USING WS-CUSIP-LOOKUP WS-MARKET-PRICE.

       32500-MANAGE-BORROWINGS.
           PERFORM 32510-REVIEW-BORROWING-CAPACITY
           PERFORM 32520-OPTIMIZE-FUNDING-MIX
           PERFORM 32530-MANAGE-MATURITIES.

       32510-REVIEW-BORROWING-CAPACITY.
           MOVE ZEROES TO WS-BORROWING-CAPACITY
           ADD WS-FHLB-CAPACITY TO WS-BORROWING-CAPACITY
           ADD WS-REPO-CAPACITY TO WS-BORROWING-CAPACITY
           ADD WS-CREDIT-LINE-AVAIL TO WS-BORROWING-CAPACITY.

       32520-OPTIMIZE-FUNDING-MIX.
           COMPUTE WS-DEPOSIT-COST = 
              WS-TOTAL-INT-EXPENSE / WS-TOTAL-DEPOSITS * 100
           IF WS-DEPOSIT-COST > WS-WHOLESALE-RATE
              DISPLAY 'CONSIDER WHOLESALE FUNDING'
           END-IF.

       32530-MANAGE-MATURITIES.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ BORROWING-FILE INTO WS-BORROW-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    IF BORROW-MATURITY <= WS-PROCESS-DATE + 7
                       PERFORM 32535-ROLLOVER-DECISION
                    END-IF
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       32535-ROLLOVER-DECISION.
           IF WS-CASH-POSITION >= BORROW-AMOUNT
              PERFORM 32536-REPAY-BORROWING
           ELSE
              PERFORM 32537-ROLLOVER-BORROWING
           END-IF.

       32536-REPAY-BORROWING.
           SUBTRACT BORROW-AMOUNT FROM WS-CASH-POSITION
           MOVE 'REPAID' TO BORROW-STATUS
           REWRITE BORROWING-RECORD FROM WS-BORROW-REC.

       32537-ROLLOVER-BORROWING.
           MOVE WS-PROCESS-DATE TO BORROW-ROLLOVER-DATE
           COMPUTE BORROW-MATURITY = 
              FUNCTION INTEGER-OF-DATE(WS-PROCESS-DATE) + 30
           MOVE WS-CURRENT-RATE TO BORROW-RATE
           REWRITE BORROWING-RECORD FROM WS-BORROW-REC.

      *----------------------------------------------------------------*
      * LIQUIDITY MANAGEMENT PROCEDURES                                *
      *----------------------------------------------------------------*
       33000-LIQUIDITY-MANAGEMENT.
           PERFORM 33100-CALCULATE-LIQUIDITY-RATIOS
           PERFORM 33200-MONITOR-LIQUIDITY-LIMITS
           PERFORM 33300-CONTINGENCY-FUNDING-PLAN.

       33100-CALCULATE-LIQUIDITY-RATIOS.
           PERFORM 33110-CALCULATE-LCR
           PERFORM 33120-CALCULATE-NSFR
           PERFORM 33130-CALCULATE-BASIC-RATIO.

       33110-CALCULATE-LCR.
           PERFORM 33115-SUM-HQLA
           PERFORM 33116-CALCULATE-NET-OUTFLOWS
           IF WS-LCR-DENOMINATOR > 0
              COMPUTE WS-LCR-RATIO = 
                 (WS-LCR-NUMERATOR / WS-LCR-DENOMINATOR) * 100
           END-IF.

       33115-SUM-HQLA.
           MOVE ZEROES TO WS-LCR-NUMERATOR
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ INVESTMENT-FILE INTO WS-INV-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    IF INV-HQLA-LEVEL = '1'
                       ADD INV-MARKET-VALUE TO WS-LCR-NUMERATOR
                    ELSE IF INV-HQLA-LEVEL = '2A'
                       COMPUTE WS-ADJUSTED-VALUE = 
                          INV-MARKET-VALUE * 0.85
                       ADD WS-ADJUSTED-VALUE TO WS-LCR-NUMERATOR
                    ELSE IF INV-HQLA-LEVEL = '2B'
                       COMPUTE WS-ADJUSTED-VALUE = 
                          INV-MARKET-VALUE * 0.50
                       ADD WS-ADJUSTED-VALUE TO WS-LCR-NUMERATOR
                    END-IF
                    END-IF
                    END-IF
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       33116-CALCULATE-NET-OUTFLOWS.
           MOVE ZEROES TO WS-TOTAL-OUTFLOWS
           MOVE ZEROES TO WS-TOTAL-INFLOWS
           COMPUTE WS-RETAIL-OUTFLOW = 
              WS-STABLE-DEPOSITS * 0.03 +
              WS-LESS-STABLE-DEPOSITS * 0.10
           COMPUTE WS-WHOLESALE-OUTFLOW = 
              WS-OPERATIONAL-DEPOSITS * 0.25 +
              WS-NON-OPERATIONAL * 0.40
           ADD WS-RETAIL-OUTFLOW TO WS-TOTAL-OUTFLOWS
           ADD WS-WHOLESALE-OUTFLOW TO WS-TOTAL-OUTFLOWS
           COMPUTE WS-LCR-DENOMINATOR = 
              WS-TOTAL-OUTFLOWS - 
              FUNCTION MIN(WS-TOTAL-INFLOWS, 
                          WS-TOTAL-OUTFLOWS * 0.75).

       33120-CALCULATE-NSFR.
           PERFORM 33125-CALCULATE-ASF
           PERFORM 33126-CALCULATE-RSF
           IF WS-NSFR-REQUIRED > 0
              COMPUTE WS-NSFR-RATIO = 
                 (WS-NSFR-AVAILABLE / WS-NSFR-REQUIRED) * 100
           END-IF.

       33125-CALCULATE-ASF.
           MOVE ZEROES TO WS-NSFR-AVAILABLE
           ADD WS-TIER1-CAPITAL TO WS-NSFR-AVAILABLE
           ADD WS-TIER2-CAPITAL TO WS-NSFR-AVAILABLE
           COMPUTE WS-STABLE-FUNDING = 
              WS-RETAIL-DEPOSITS * 0.95 +
              WS-WHOLESALE-DEPOSITS-1YR * 1.00 +
              WS-WHOLESALE-DEPOSITS-6M * 0.50
           ADD WS-STABLE-FUNDING TO WS-NSFR-AVAILABLE.

       33126-CALCULATE-RSF.
           MOVE ZEROES TO WS-NSFR-REQUIRED
           COMPUTE WS-REQUIRED-STABLE = 
              WS-CASH-POSITION * 0.00 +
              WS-GOVT-SECURITIES * 0.05 +
              WS-CORPORATE-BONDS * 0.50 +
              WS-RESIDENTIAL-MORTGAGES * 0.65 +
              WS-COMMERCIAL-LOANS * 0.85
           ADD WS-REQUIRED-STABLE TO WS-NSFR-REQUIRED.

       33130-CALCULATE-BASIC-RATIO.
           IF WS-TOTAL-DEPOSITS > 0
              COMPUTE WS-LIQUIDITY-RATIO = 
                 (WS-LIQUID-ASSETS / WS-TOTAL-DEPOSITS) * 100
           END-IF.

       33200-MONITOR-LIQUIDITY-LIMITS.
           IF WS-LCR-RATIO < 100
              PERFORM 33210-LCR-BREACH-ACTION
           END-IF
           IF WS-NSFR-RATIO < 100
              PERFORM 33220-NSFR-BREACH-ACTION
           END-IF
           IF WS-LIQUIDITY-RATIO < WS-INTERNAL-LIMIT
              PERFORM 33230-INTERNAL-BREACH-ACTION
           END-IF.

       33210-LCR-BREACH-ACTION.
           MOVE 'LCR BREACH' TO WS-ALERT-TYPE
           PERFORM 33250-SEND-LIQUIDITY-ALERT
           PERFORM 33260-INITIATE-REMEDIATION.

       33220-NSFR-BREACH-ACTION.
           MOVE 'NSFR BREACH' TO WS-ALERT-TYPE
           PERFORM 33250-SEND-LIQUIDITY-ALERT.

       33230-INTERNAL-BREACH-ACTION.
           MOVE 'INTERNAL LIMIT BREACH' TO WS-ALERT-TYPE
           PERFORM 33250-SEND-LIQUIDITY-ALERT.

       33250-SEND-LIQUIDITY-ALERT.
           MOVE 'LIQUIDITY-ALERT' TO WS-NOTIF-TYPE
           MOVE 'EMAIL' TO WS-NOTIF-CHANNEL
           STRING 'URGENT: ' DELIMITED SIZE
                  WS-ALERT-TYPE DELIMITED SIZE
              INTO WS-NOTIF-SUBJECT
           PERFORM 15000-SEND-NOTIFICATION.

       33260-INITIATE-REMEDIATION.
           PERFORM 32340-INVEST-EXCESS-RESERVES
           PERFORM 32345-SELL-FED-FUNDS.

       33300-CONTINGENCY-FUNDING-PLAN.
           PERFORM 33310-ASSESS-STRESS-SCENARIO
           PERFORM 33320-IDENTIFY-FUNDING-SOURCES
           PERFORM 33330-UPDATE-CFP-DOCUMENT.

       33310-ASSESS-STRESS-SCENARIO.
           EVALUATE WS-STRESS-LEVEL
              WHEN 'LOW'
                 MOVE 0.05 TO WS-DEPOSIT-RUNOFF
              WHEN 'MEDIUM'
                 MOVE 0.15 TO WS-DEPOSIT-RUNOFF
              WHEN 'HIGH'
                 MOVE 0.30 TO WS-DEPOSIT-RUNOFF
              WHEN 'SEVERE'
                 MOVE 0.50 TO WS-DEPOSIT-RUNOFF
           END-EVALUATE
           COMPUTE WS-STRESSED-OUTFLOWS = 
              WS-TOTAL-DEPOSITS * WS-DEPOSIT-RUNOFF.

       33320-IDENTIFY-FUNDING-SOURCES.
           MOVE ZEROES TO WS-AVAILABLE-FUNDING
           ADD WS-FHLB-CAPACITY TO WS-AVAILABLE-FUNDING
           ADD WS-REPO-CAPACITY TO WS-AVAILABLE-FUNDING
           ADD WS-FED-DISCOUNT-WINDOW TO WS-AVAILABLE-FUNDING
           ADD WS-ASSET-SALE-CAPACITY TO WS-AVAILABLE-FUNDING
           IF WS-AVAILABLE-FUNDING < WS-STRESSED-OUTFLOWS
              MOVE 'INADEQUATE' TO WS-CFP-STATUS
           ELSE
              MOVE 'ADEQUATE' TO WS-CFP-STATUS
           END-IF.

       33330-UPDATE-CFP-DOCUMENT.
           MOVE FUNCTION CURRENT-DATE TO WS-CFP-UPDATE-DATE
           MOVE WS-CFP-STATUS TO CFP-OVERALL-STATUS
           MOVE WS-AVAILABLE-FUNDING TO CFP-TOTAL-SOURCES
           MOVE WS-STRESSED-OUTFLOWS TO CFP-STRESS-NEEDS
           REWRITE CFP-RECORD FROM WS-CFP-DOCUMENT.

      *----------------------------------------------------------------*
      * CAPITAL MANAGEMENT PROCEDURES                                  *
      *----------------------------------------------------------------*
       34000-CAPITAL-MANAGEMENT.
           PERFORM 34100-CALCULATE-CAPITAL-RATIOS
           PERFORM 34200-RISK-WEIGHTED-ASSETS
           PERFORM 34300-CAPITAL-PLANNING
           PERFORM 34400-STRESS-TESTING.

       34100-CALCULATE-CAPITAL-RATIOS.
           PERFORM 34110-CALCULATE-TIER1
           PERFORM 34120-CALCULATE-TIER2
           PERFORM 34130-CALCULATE-RATIOS.

       34110-CALCULATE-TIER1.
           MOVE ZEROES TO WS-TIER1-CAPITAL
           ADD WS-COMMON-STOCK TO WS-TIER1-CAPITAL
           ADD WS-RETAINED-EARNINGS TO WS-TIER1-CAPITAL
           ADD WS-AOCI TO WS-TIER1-CAPITAL
           SUBTRACT WS-GOODWILL FROM WS-TIER1-CAPITAL
           SUBTRACT WS-INTANGIBLES FROM WS-TIER1-CAPITAL
           SUBTRACT WS-DTA-DEDUCTION FROM WS-TIER1-CAPITAL.

       34120-CALCULATE-TIER2.
           MOVE ZEROES TO WS-TIER2-CAPITAL
           ADD WS-SUB-DEBT TO WS-TIER2-CAPITAL
           ADD WS-ALLL-ELIGIBLE TO WS-TIER2-CAPITAL
           COMPUTE WS-TOTAL-CAPITAL = 
              WS-TIER1-CAPITAL + WS-TIER2-CAPITAL.

       34130-CALCULATE-RATIOS.
           IF WS-RISK-WEIGHTED-ASSETS > 0
              COMPUTE WS-CET1-RATIO = 
                 (WS-TIER1-CAPITAL / WS-RISK-WEIGHTED-ASSETS) * 100
              COMPUTE WS-CAPITAL-RATIO = 
                 (WS-TOTAL-CAPITAL / WS-RISK-WEIGHTED-ASSETS) * 100
           END-IF
           IF WS-TOTAL-ASSETS > 0
              COMPUTE WS-LEVERAGE-RATIO = 
                 (WS-TIER1-CAPITAL / WS-TOTAL-ASSETS) * 100
           END-IF.

       34200-RISK-WEIGHTED-ASSETS.
           MOVE ZEROES TO WS-RISK-WEIGHTED-ASSETS
           PERFORM 34210-CREDIT-RWA
           PERFORM 34220-MARKET-RWA
           PERFORM 34230-OPERATIONAL-RWA.

       34210-CREDIT-RWA.
           COMPUTE WS-CASH-RWA = WS-CASH-POSITION * 0.00
           COMPUTE WS-GOVT-RWA = WS-GOVT-SECURITIES * 0.00
           COMPUTE WS-BANK-RWA = WS-BANK-DEPOSITS * 0.20
           COMPUTE WS-MORTGAGE-RWA = WS-RESIDENTIAL-MORTGAGES * 0.50
           COMPUTE WS-COMMERCIAL-RWA = WS-COMMERCIAL-LOANS * 1.00
           COMPUTE WS-CONSUMER-RWA = WS-CONSUMER-LOANS * 1.00
           ADD WS-CASH-RWA TO WS-RISK-WEIGHTED-ASSETS
           ADD WS-GOVT-RWA TO WS-RISK-WEIGHTED-ASSETS
           ADD WS-BANK-RWA TO WS-RISK-WEIGHTED-ASSETS
           ADD WS-MORTGAGE-RWA TO WS-RISK-WEIGHTED-ASSETS
           ADD WS-COMMERCIAL-RWA TO WS-RISK-WEIGHTED-ASSETS
           ADD WS-CONSUMER-RWA TO WS-RISK-WEIGHTED-ASSETS.

       34220-MARKET-RWA.
           COMPUTE WS-MARKET-RWA = 
              WS-TRADING-ASSETS * WS-MARKET-RISK-FACTOR
           ADD WS-MARKET-RWA TO WS-RISK-WEIGHTED-ASSETS.

       34230-OPERATIONAL-RWA.
           COMPUTE WS-OPERATIONAL-RWA = 
              WS-GROSS-INCOME * WS-OPERATIONAL-FACTOR * 12.5
           ADD WS-OPERATIONAL-RWA TO WS-RISK-WEIGHTED-ASSETS.

       34300-CAPITAL-PLANNING.
           PERFORM 34310-PROJECT-CAPITAL-NEEDS
           PERFORM 34320-IDENTIFY-CAPITAL-ACTIONS
           PERFORM 34330-UPDATE-CAPITAL-PLAN.

       34310-PROJECT-CAPITAL-NEEDS.
           COMPUTE WS-PROJECTED-RWA = 
              WS-RISK-WEIGHTED-ASSETS * (1 + WS-GROWTH-RATE)
           COMPUTE WS-REQUIRED-CAPITAL = 
              WS-PROJECTED-RWA * WS-TARGET-RATIO / 100
           COMPUTE WS-CAPITAL-GAP = 
              WS-REQUIRED-CAPITAL - WS-TOTAL-CAPITAL.

       34320-IDENTIFY-CAPITAL-ACTIONS.
           IF WS-CAPITAL-GAP > 0
              EVALUATE TRUE
                 WHEN WS-CAPITAL-GAP <= WS-RETAINED-EARNINGS-PROJ
                    MOVE 'ORGANIC GROWTH' TO WS-CAPITAL-ACTION
                 WHEN WS-CAPITAL-GAP <= WS-SUB-DEBT-CAPACITY
                    MOVE 'SUB DEBT ISSUANCE' TO WS-CAPITAL-ACTION
                 WHEN OTHER
                    MOVE 'EQUITY RAISE' TO WS-CAPITAL-ACTION
              END-EVALUATE
           ELSE
              MOVE 'NO ACTION NEEDED' TO WS-CAPITAL-ACTION
           END-IF.

       34330-UPDATE-CAPITAL-PLAN.
           MOVE FUNCTION CURRENT-DATE TO WS-PLAN-UPDATE-DATE
           MOVE WS-CAPITAL-ACTION TO PLAN-RECOMMENDED-ACTION
           MOVE WS-CAPITAL-GAP TO PLAN-GAP-AMOUNT
           REWRITE CAPITAL-PLAN-RECORD FROM WS-CAPITAL-PLAN.

       34400-STRESS-TESTING.
           PERFORM 34410-RUN-BASELINE
           PERFORM 34420-RUN-ADVERSE
           PERFORM 34430-RUN-SEVERELY-ADVERSE
           PERFORM 34440-COMPILE-RESULTS.

       34410-RUN-BASELINE.
           MOVE 'BASELINE' TO WS-SCENARIO-NAME
           MOVE 0.00 TO WS-RATE-SHOCK
           MOVE 2.50 TO WS-GDP-CHANGE
           MOVE 4.00 TO WS-UNEMPLOYMENT-RATE
           MOVE 0.00 TO WS-HOUSING-DECLINE
           PERFORM 34450-CALCULATE-STRESS-IMPACT.

       34420-RUN-ADVERSE.
           MOVE 'ADVERSE' TO WS-SCENARIO-NAME
           MOVE 2.00 TO WS-RATE-SHOCK
           MOVE -1.50 TO WS-GDP-CHANGE
           MOVE 7.00 TO WS-UNEMPLOYMENT-RATE
           MOVE -15.00 TO WS-HOUSING-DECLINE
           PERFORM 34450-CALCULATE-STRESS-IMPACT.

       34430-RUN-SEVERELY-ADVERSE.
           MOVE 'SEVERELY-ADVERSE' TO WS-SCENARIO-NAME
           MOVE 3.00 TO WS-RATE-SHOCK
           MOVE -6.00 TO WS-GDP-CHANGE
           MOVE 10.00 TO WS-UNEMPLOYMENT-RATE
           MOVE -30.00 TO WS-HOUSING-DECLINE
           PERFORM 34450-CALCULATE-STRESS-IMPACT.

       34440-COMPILE-RESULTS.
           DISPLAY 'STRESS TEST RESULTS COMPILED'
           IF WS-STRESS-PASS-FAIL = 'FAIL'
              PERFORM 34460-REMEDIATION-ACTIONS
           END-IF.

       34450-CALCULATE-STRESS-IMPACT.
           COMPUTE WS-CREDIT-LOSSES = 
              WS-LOAN-PORTFOLIO * WS-STRESS-LGD * 
              WS-STRESS-PD
           COMPUTE WS-MARKET-LOSSES = 
              WS-TRADING-ASSETS * WS-RATE-SHOCK / 100
           COMPUTE WS-STRESS-LOSSES = 
              WS-CREDIT-LOSSES + WS-MARKET-LOSSES
           COMPUTE WS-STRESSED-CAPITAL = 
              WS-TOTAL-CAPITAL - WS-STRESS-LOSSES
           COMPUTE WS-STRESSED-RATIO = 
              (WS-STRESSED-CAPITAL / WS-RISK-WEIGHTED-ASSETS) * 100
           IF WS-STRESSED-RATIO >= WS-MIN-CAPITAL-RATIO
              MOVE 'PASS' TO WS-STRESS-PASS-FAIL
           ELSE
              MOVE 'FAIL' TO WS-STRESS-PASS-FAIL
           END-IF.

       34460-REMEDIATION-ACTIONS.
           MOVE 'STRESS-FAILURE' TO WS-NOTIF-TYPE
           MOVE 'EMAIL' TO WS-NOTIF-CHANNEL
           MOVE 'URGENT: Stress test failure - action required'
              TO WS-NOTIF-SUBJECT
           PERFORM 15000-SEND-NOTIFICATION.

      *----------------------------------------------------------------*
      * GENERAL LEDGER PROCEDURES                                      *
      *----------------------------------------------------------------*
       35000-GENERAL-LEDGER.
           PERFORM 35100-POST-JOURNAL-ENTRY
           PERFORM 35200-BALANCE-GL
           PERFORM 35300-CLOSE-PERIOD
           PERFORM 35400-GENERATE-TRIAL-BALANCE.

       35100-POST-JOURNAL-ENTRY.
           PERFORM 35110-VALIDATE-JOURNAL-ENTRY
           IF WS-JE-VALID = 'Y'
              PERFORM 35120-POST-TO-ACCOUNTS
              PERFORM 35130-RECORD-POSTING
           END-IF.

       35110-VALIDATE-JOURNAL-ENTRY.
           MOVE 'Y' TO WS-JE-VALID
           MOVE ZEROES TO WS-TOTAL-DEBITS
           MOVE ZEROES TO WS-TOTAL-CREDITS
           PERFORM VARYING WS-JE-IDX FROM 1 BY 1
              UNTIL WS-JE-IDX > 50
              ADD JE-DEBIT(WS-JE-IDX) TO WS-TOTAL-DEBITS
              ADD JE-CREDIT(WS-JE-IDX) TO WS-TOTAL-CREDITS
           END-PERFORM
           IF WS-TOTAL-DEBITS NOT = WS-TOTAL-CREDITS
              MOVE 'N' TO WS-JE-VALID
              MOVE 'OUT OF BALANCE' TO WS-JE-ERROR
           END-IF.

       35120-POST-TO-ACCOUNTS.
           PERFORM VARYING WS-JE-IDX FROM 1 BY 1
              UNTIL WS-JE-IDX > 50
              IF JE-GL-ACCOUNT(WS-JE-IDX) NOT = SPACES
                 MOVE JE-GL-ACCOUNT(WS-JE-IDX) TO WS-GL-ACCOUNT
                 READ GL-MASTER-FILE INTO WS-GL-RECORD
                    KEY IS GL-ACCOUNT
                 ADD JE-DEBIT(WS-JE-IDX) TO WS-GL-DEBIT-BALANCE
                 ADD JE-CREDIT(WS-JE-IDX) TO WS-GL-CREDIT-BALANCE
                 COMPUTE WS-GL-NET-BALANCE = 
                    WS-GL-DEBIT-BALANCE - WS-GL-CREDIT-BALANCE
                 REWRITE GL-RECORD FROM WS-GL-RECORD
              END-IF
           END-PERFORM.

       35130-RECORD-POSTING.
           MOVE 'POSTED' TO WS-JE-STATUS
           MOVE FUNCTION CURRENT-DATE TO WS-JE-POST-DATE
           WRITE JOURNAL-RECORD FROM WS-JOURNAL-ENTRY.

       35200-BALANCE-GL.
           MOVE ZEROES TO WS-TOTAL-ASSETS
           MOVE ZEROES TO WS-TOTAL-LIABILITIES
           MOVE ZEROES TO WS-TOTAL-EQUITY
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ GL-MASTER-FILE INTO WS-GL-RECORD
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    EVALUATE TRUE
                       WHEN GL-ASSET
                          ADD WS-GL-NET-BALANCE TO WS-TOTAL-ASSETS
                       WHEN GL-LIABILITY
                          ADD WS-GL-NET-BALANCE 
                             TO WS-TOTAL-LIABILITIES
                       WHEN GL-EQUITY
                          ADD WS-GL-NET-BALANCE TO WS-TOTAL-EQUITY
                    END-EVALUATE
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG
           COMPUTE WS-BALANCE-CHECK = 
              WS-TOTAL-ASSETS - WS-TOTAL-LIABILITIES - WS-TOTAL-EQUITY
           IF WS-BALANCE-CHECK NOT = ZEROES
              MOVE 'GL OUT OF BALANCE' TO WS-ERROR-MSG
              PERFORM 2900-HANDLE-ERROR
           END-IF.

       35300-CLOSE-PERIOD.
           IF WS-END-OF-MONTH = 'Y'
              PERFORM 35310-CLOSE-REVENUE-EXPENSE
              PERFORM 35320-UPDATE-RETAINED-EARNINGS
              PERFORM 35330-RECORD-CLOSE
           END-IF.

       35310-CLOSE-REVENUE-EXPENSE.
           MOVE ZEROES TO WS-NET-INCOME
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ GL-MASTER-FILE INTO WS-GL-RECORD
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    IF GL-REVENUE
                       ADD WS-GL-NET-BALANCE TO WS-NET-INCOME
                       MOVE ZEROES TO WS-GL-DEBIT-BALANCE
                       MOVE ZEROES TO WS-GL-CREDIT-BALANCE
                       MOVE ZEROES TO WS-GL-NET-BALANCE
                       REWRITE GL-RECORD FROM WS-GL-RECORD
                    END-IF
                    IF GL-EXPENSE
                       SUBTRACT WS-GL-NET-BALANCE FROM WS-NET-INCOME
                       MOVE ZEROES TO WS-GL-DEBIT-BALANCE
                       MOVE ZEROES TO WS-GL-CREDIT-BALANCE
                       MOVE ZEROES TO WS-GL-NET-BALANCE
                       REWRITE GL-RECORD FROM WS-GL-RECORD
                    END-IF
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       35320-UPDATE-RETAINED-EARNINGS.
           MOVE WS-RETAINED-EARNINGS-ACCT TO WS-GL-ACCOUNT
           READ GL-MASTER-FILE INTO WS-GL-RECORD
              KEY IS GL-ACCOUNT
           ADD WS-NET-INCOME TO WS-GL-CREDIT-BALANCE
           COMPUTE WS-GL-NET-BALANCE = 
              WS-GL-CREDIT-BALANCE - WS-GL-DEBIT-BALANCE
           REWRITE GL-RECORD FROM WS-GL-RECORD.

       35330-RECORD-CLOSE.
           INITIALIZE WS-PERIOD-CLOSE-REC
           MOVE WS-PROCESS-DATE TO CLOSE-DATE
           MOVE WS-NET-INCOME TO CLOSE-NET-INCOME
           MOVE 'CLOSED' TO CLOSE-STATUS
           WRITE PERIOD-CLOSE-RECORD FROM WS-PERIOD-CLOSE-REC.

       35400-GENERATE-TRIAL-BALANCE.
           OPEN OUTPUT TRIAL-BALANCE-FILE
           PERFORM 35410-WRITE-TB-HEADER
           PERFORM 35420-WRITE-TB-DETAIL
           PERFORM 35430-WRITE-TB-TOTALS
           CLOSE TRIAL-BALANCE-FILE.

       35410-WRITE-TB-HEADER.
           MOVE 'TRIAL BALANCE' TO TB-TITLE
           MOVE WS-PROCESS-DATE TO TB-DATE
           WRITE TRIAL-BALANCE-RECORD FROM WS-TB-HEADER.

       35420-WRITE-TB-DETAIL.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ GL-MASTER-FILE INTO WS-GL-RECORD
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    MOVE WS-GL-ACCOUNT TO TB-ACCOUNT
                    MOVE WS-GL-DESCRIPTION TO TB-DESCRIPTION
                    MOVE WS-GL-DEBIT-BALANCE TO TB-DEBIT
                    MOVE WS-GL-CREDIT-BALANCE TO TB-CREDIT
                    WRITE TRIAL-BALANCE-RECORD FROM WS-TB-DETAIL
                    ADD WS-GL-DEBIT-BALANCE TO WS-TB-TOTAL-DEBITS
                    ADD WS-GL-CREDIT-BALANCE TO WS-TB-TOTAL-CREDITS
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       35430-WRITE-TB-TOTALS.
           MOVE 'TOTALS' TO TB-DESCRIPTION
           MOVE WS-TB-TOTAL-DEBITS TO TB-DEBIT
           MOVE WS-TB-TOTAL-CREDITS TO TB-CREDIT
           WRITE TRIAL-BALANCE-RECORD FROM WS-TB-TOTALS.

      *================================================================*
      * FINAL END OF MEGA-ENTERPRISE COBOL PROGRAM                    *
      * COMPREHENSIVE BANKING SYSTEM WITH 300+ PROCEDURES             *
      *================================================================*


      *----------------------------------------------------------------*
      * REGULATORY REPORTING PROCEDURES                                *
      *----------------------------------------------------------------*
       36000-REGULATORY-REPORTING.
           PERFORM 36100-GENERATE-CALL-REPORT
           PERFORM 36200-GENERATE-FR-Y9C
           PERFORM 36300-GENERATE-CCAR-REPORT
           PERFORM 36400-GENERATE-AML-REPORTS.

       36100-GENERATE-CALL-REPORT.
           PERFORM 36110-SCHEDULE-RC
           PERFORM 36120-SCHEDULE-RI
           PERFORM 36130-SCHEDULE-RC-C
           PERFORM 36140-VALIDATE-CALL-REPORT
           PERFORM 36150-SUBMIT-CALL-REPORT.

       36110-SCHEDULE-RC.
           INITIALIZE WS-SCHEDULE-RC
           MOVE WS-TOTAL-ASSETS TO RC-TOTAL-ASSETS
           MOVE WS-TOTAL-LOANS TO RC-TOTAL-LOANS
           MOVE WS-TOTAL-SECURITIES TO RC-SECURITIES
           MOVE WS-TOTAL-DEPOSITS TO RC-TOTAL-DEPOSITS
           MOVE WS-TOTAL-CAPITAL TO RC-TOTAL-EQUITY
           WRITE CALL-REPORT-RECORD FROM WS-SCHEDULE-RC.

       36120-SCHEDULE-RI.
           INITIALIZE WS-SCHEDULE-RI
           MOVE WS-INTEREST-INCOME TO RI-INT-INCOME
           MOVE WS-INTEREST-EXPENSE TO RI-INT-EXPENSE
           COMPUTE RI-NET-INT-INCOME = 
              WS-INTEREST-INCOME - WS-INTEREST-EXPENSE
           MOVE WS-NONINT-INCOME TO RI-NONINT-INCOME
           MOVE WS-NONINT-EXPENSE TO RI-NONINT-EXPENSE
           MOVE WS-NET-INCOME TO RI-NET-INCOME
           WRITE CALL-REPORT-RECORD FROM WS-SCHEDULE-RI.

       36130-SCHEDULE-RC-C.
           INITIALIZE WS-SCHEDULE-RC-C
           MOVE WS-COMMERCIAL-REAL-ESTATE TO RCC-CRE
           MOVE WS-RESIDENTIAL-MORTGAGES TO RCC-RES-MORT
           MOVE WS-CONSUMER-LOANS TO RCC-CONSUMER
           MOVE WS-COMMERCIAL-INDUSTRIAL TO RCC-CI
           MOVE WS-AGRICULTURAL-LOANS TO RCC-AG
           WRITE CALL-REPORT-RECORD FROM WS-SCHEDULE-RC-C.

       36140-VALIDATE-CALL-REPORT.
           PERFORM 36145-RUN-VALIDITY-CHECKS
           PERFORM 36146-RUN-QUALITY-CHECKS.

       36145-RUN-VALIDITY-CHECKS.
           MOVE ZEROES TO WS-VALIDITY-ERRORS
           IF RC-TOTAL-ASSETS NOT = 
              RC-TOTAL-LOANS + RC-SECURITIES + RC-OTHER-ASSETS
              ADD 1 TO WS-VALIDITY-ERRORS
           END-IF.

       36146-RUN-QUALITY-CHECKS.
           MOVE ZEROES TO WS-QUALITY-ERRORS
           IF RC-TOTAL-ASSETS < WS-PRIOR-TOTAL-ASSETS * 0.80
              ADD 1 TO WS-QUALITY-ERRORS
           END-IF.

       36150-SUBMIT-CALL-REPORT.
           IF WS-VALIDITY-ERRORS = ZEROES
              MOVE 'SUBMITTED' TO WS-REPORT-STATUS
           ELSE
              MOVE 'ERRORS' TO WS-REPORT-STATUS
           END-IF.

       36200-GENERATE-FR-Y9C.
           PERFORM 36210-CONSOLIDATE-SUBSIDIARIES
           PERFORM 36220-ELIMINATE-INTERCOMPANY
           PERFORM 36230-GENERATE-SCHEDULES
           PERFORM 36240-SUBMIT-Y9C.

       36210-CONSOLIDATE-SUBSIDIARIES.
           MOVE ZEROES TO WS-CONSOLIDATED-ASSETS
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ SUBSIDIARY-FILE INTO WS-SUB-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    ADD SUB-TOTAL-ASSETS TO WS-CONSOLIDATED-ASSETS
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       36220-ELIMINATE-INTERCOMPANY.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ INTERCOMPANY-FILE INTO WS-IC-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    SUBTRACT IC-AMOUNT FROM WS-CONSOLIDATED-ASSETS
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       36230-GENERATE-SCHEDULES.
           PERFORM 36231-SCHEDULE-HC
           PERFORM 36232-SCHEDULE-HI
           PERFORM 36233-SCHEDULE-HC-R.

       36231-SCHEDULE-HC.
           INITIALIZE WS-SCHEDULE-HC
           MOVE WS-CONSOLIDATED-ASSETS TO HC-TOTAL-ASSETS
           WRITE Y9C-RECORD FROM WS-SCHEDULE-HC.

       36232-SCHEDULE-HI.
           INITIALIZE WS-SCHEDULE-HI
           MOVE WS-CONSOLIDATED-INCOME TO HI-NET-INCOME
           WRITE Y9C-RECORD FROM WS-SCHEDULE-HI.

       36233-SCHEDULE-HC-R.
           INITIALIZE WS-SCHEDULE-HC-R
           MOVE WS-RISK-WEIGHTED-ASSETS TO HCR-RWA
           MOVE WS-CET1-RATIO TO HCR-CET1
           MOVE WS-CAPITAL-RATIO TO HCR-TOTAL-CAPITAL
           WRITE Y9C-RECORD FROM WS-SCHEDULE-HC-R.

       36240-SUBMIT-Y9C.
           MOVE 'SUBMITTED' TO WS-Y9C-STATUS
           MOVE FUNCTION CURRENT-DATE TO WS-Y9C-SUBMIT-DATE.

       36300-GENERATE-CCAR-REPORT.
           PERFORM 36310-PREPARE-CCAR-DATA
           PERFORM 36320-RUN-SCENARIOS
           PERFORM 36330-GENERATE-CAPITAL-PROJECTIONS
           PERFORM 36340-SUBMIT-CCAR.

       36310-PREPARE-CCAR-DATA.
           MOVE WS-LOAN-PORTFOLIO TO CCAR-LOAN-DATA
           MOVE WS-SECURITIES-PORTFOLIO TO CCAR-SEC-DATA
           MOVE WS-TRADING-BOOK TO CCAR-TRADING-DATA.

       36320-RUN-SCENARIOS.
           PERFORM 34410-RUN-BASELINE
           PERFORM 34420-RUN-ADVERSE
           PERFORM 34430-RUN-SEVERELY-ADVERSE.

       36330-GENERATE-CAPITAL-PROJECTIONS.
           PERFORM VARYING WS-QUARTER FROM 1 BY 1
              UNTIL WS-QUARTER > 9
              PERFORM 36335-PROJECT-QUARTER-CAPITAL
           END-PERFORM.

       36335-PROJECT-QUARTER-CAPITAL.
           COMPUTE WS-PROJECTED-CAPITAL(WS-QUARTER) = 
              WS-STARTING-CAPITAL + 
              WS-PROJECTED-INCOME(WS-QUARTER) -
              WS-PROJECTED-LOSSES(WS-QUARTER) -
              WS-PROJECTED-DIVIDENDS(WS-QUARTER).

       36340-SUBMIT-CCAR.
           MOVE 'SUBMITTED' TO WS-CCAR-STATUS.

       36400-GENERATE-AML-REPORTS.
           PERFORM 36410-GENERATE-CTR
           PERFORM 36420-GENERATE-SAR-FILINGS
           PERFORM 36430-GENERATE-314A-REPORT.

       36410-GENERATE-CTR.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ TRANSACTION-FILE INTO WS-TRANS-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    IF TRANS-AMOUNT > 10000
                       PERFORM 36415-CREATE-CTR-RECORD
                    END-IF
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       36415-CREATE-CTR-RECORD.
           INITIALIZE WS-CTR-RECORD
           MOVE TRANS-CUSTOMER TO CTR-SUBJECT
           MOVE TRANS-AMOUNT TO CTR-AMOUNT
           MOVE TRANS-DATE TO CTR-DATE
           MOVE 'CASH TRANSACTION' TO CTR-TYPE
           WRITE CTR-RECORD FROM WS-CTR-RECORD.

       36420-GENERATE-SAR-FILINGS.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ SAR-PENDING-FILE INTO WS-SAR-PENDING
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    PERFORM 36425-FINALIZE-SAR
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       36425-FINALIZE-SAR.
           MOVE 'FILED' TO SAR-STATUS
           MOVE FUNCTION CURRENT-DATE TO SAR-FILING-DATE
           REWRITE SAR-RECORD FROM WS-SAR-PENDING.

       36430-GENERATE-314A-REPORT.
           PERFORM 36435-SCREEN-CUSTOMER-LIST.

       36435-SCREEN-CUSTOMER-LIST.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ CUSTOMER-FILE INTO WS-CUST-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    PERFORM 16110-SCREEN-AGAINST-WATCHLISTS
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

      *----------------------------------------------------------------*
      * RECONCILIATION PROCEDURES                                      *
      *----------------------------------------------------------------*
       37000-RECONCILIATION.
           PERFORM 37100-BANK-RECONCILIATION
           PERFORM 37200-GL-SUBLEDGER-RECON
           PERFORM 37300-INTERCOMPANY-RECON
           PERFORM 37400-NOSTRO-RECON.

       37100-BANK-RECONCILIATION.
           PERFORM 37110-LOAD-BANK-STATEMENT
           PERFORM 37120-MATCH-TRANSACTIONS
           PERFORM 37130-IDENTIFY-EXCEPTIONS
           PERFORM 37140-GENERATE-RECON-REPORT.

       37110-LOAD-BANK-STATEMENT.
           MOVE ZEROES TO WS-STMT-ITEM-COUNT
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ BANK-STATEMENT-FILE INTO WS-STMT-ITEM
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    ADD 1 TO WS-STMT-ITEM-COUNT
                    MOVE WS-STMT-ITEM TO 
                       WS-STMT-ARRAY(WS-STMT-ITEM-COUNT)
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       37120-MATCH-TRANSACTIONS.
           MOVE ZEROES TO WS-MATCHED-COUNT
           MOVE ZEROES TO WS-UNMATCHED-COUNT
           PERFORM VARYING WS-STMT-IDX FROM 1 BY 1
              UNTIL WS-STMT-IDX > WS-STMT-ITEM-COUNT
              PERFORM 37125-FIND-BOOK-MATCH
           END-PERFORM.

       37125-FIND-BOOK-MATCH.
           MOVE 'N' TO WS-MATCH-FOUND
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ BOOK-TRANSACTIONS INTO WS-BOOK-TRANS
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    IF STMT-AMOUNT(WS-STMT-IDX) = BOOK-AMOUNT
                       IF STMT-DATE(WS-STMT-IDX) = BOOK-DATE
                          MOVE 'Y' TO WS-MATCH-FOUND
                          MOVE 'M' TO STMT-STATUS(WS-STMT-IDX)
                          MOVE 'M' TO BOOK-STATUS
                          ADD 1 TO WS-MATCHED-COUNT
                          EXIT PERFORM
                       END-IF
                    END-IF
              END-READ
           END-PERFORM
           IF WS-MATCH-FOUND = 'N'
              ADD 1 TO WS-UNMATCHED-COUNT
           END-IF
           MOVE 'N' TO WS-EOF-FLAG.

       37130-IDENTIFY-EXCEPTIONS.
           PERFORM VARYING WS-STMT-IDX FROM 1 BY 1
              UNTIL WS-STMT-IDX > WS-STMT-ITEM-COUNT
              IF STMT-STATUS(WS-STMT-IDX) NOT = 'M'
                 PERFORM 37135-CREATE-EXCEPTION
              END-IF
           END-PERFORM.

       37135-CREATE-EXCEPTION.
           INITIALIZE WS-EXCEPTION-RECORD
           MOVE STMT-DATE(WS-STMT-IDX) TO EXC-DATE
           MOVE STMT-AMOUNT(WS-STMT-IDX) TO EXC-AMOUNT
           MOVE 'UNMATCHED BANK ITEM' TO EXC-DESCRIPTION
           WRITE EXCEPTION-RECORD FROM WS-EXCEPTION-RECORD.

       37140-GENERATE-RECON-REPORT.
           COMPUTE WS-DIFFERENCE = 
              WS-BOOK-BALANCE - WS-EXTERNAL-BALANCE
           INITIALIZE WS-RECON-REPORT
           MOVE WS-BOOK-BALANCE TO RECON-BOOK-BAL
           MOVE WS-EXTERNAL-BALANCE TO RECON-BANK-BAL
           MOVE WS-DIFFERENCE TO RECON-DIFF
           MOVE WS-MATCHED-COUNT TO RECON-MATCHED
           MOVE WS-UNMATCHED-COUNT TO RECON-UNMATCHED
           WRITE RECON-REPORT-RECORD FROM WS-RECON-REPORT.

       37200-GL-SUBLEDGER-RECON.
           PERFORM 37210-LOAD-GL-BALANCE
           PERFORM 37220-SUM-SUBLEDGER
           PERFORM 37230-COMPARE-BALANCES.

       37210-LOAD-GL-BALANCE.
           MOVE WS-GL-ACCOUNT TO GL-SEARCH-KEY
           READ GL-MASTER-FILE INTO WS-GL-RECORD
              KEY IS GL-ACCOUNT
           MOVE WS-GL-NET-BALANCE TO WS-GL-CONTROL-BAL.

       37220-SUM-SUBLEDGER.
           MOVE ZEROES TO WS-SUBLEDGER-TOTAL
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ SUBLEDGER-FILE INTO WS-SUB-DETAIL
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    IF SUB-GL-ACCOUNT = WS-GL-ACCOUNT
                       ADD SUB-BALANCE TO WS-SUBLEDGER-TOTAL
                    END-IF
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       37230-COMPARE-BALANCES.
           COMPUTE WS-RECON-DIFF = 
              WS-GL-CONTROL-BAL - WS-SUBLEDGER-TOTAL
           IF WS-RECON-DIFF NOT = ZEROES
              PERFORM 37235-LOG-RECON-EXCEPTION
           END-IF.

       37235-LOG-RECON-EXCEPTION.
           INITIALIZE WS-RECON-EXCEPTION
           MOVE WS-GL-ACCOUNT TO RECON-EXC-ACCOUNT
           MOVE WS-RECON-DIFF TO RECON-EXC-DIFF
           MOVE FUNCTION CURRENT-DATE TO RECON-EXC-DATE
           WRITE RECON-EXCEPTION-RECORD FROM WS-RECON-EXCEPTION.

       37300-INTERCOMPANY-RECON.
           PERFORM 37310-LOAD-IC-BALANCES
           PERFORM 37320-MATCH-IC-PAIRS
           PERFORM 37330-REPORT-IC-DIFFERENCES.

       37310-LOAD-IC-BALANCES.
           MOVE ZEROES TO WS-IC-COUNT
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ INTERCOMPANY-FILE INTO WS-IC-BALANCE
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    ADD 1 TO WS-IC-COUNT
                    MOVE WS-IC-BALANCE TO 
                       WS-IC-ARRAY(WS-IC-COUNT)
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       37320-MATCH-IC-PAIRS.
           PERFORM VARYING WS-IC-IDX FROM 1 BY 1
              UNTIL WS-IC-IDX > WS-IC-COUNT
              PERFORM 37325-FIND-IC-COUNTERPART
           END-PERFORM.

       37325-FIND-IC-COUNTERPART.
           MOVE IC-FROM-ENTITY(WS-IC-IDX) TO WS-SEARCH-FROM
           MOVE IC-TO-ENTITY(WS-IC-IDX) TO WS-SEARCH-TO
           PERFORM VARYING WS-IC-IDX2 FROM 1 BY 1
              UNTIL WS-IC-IDX2 > WS-IC-COUNT
              IF IC-FROM-ENTITY(WS-IC-IDX2) = WS-SEARCH-TO
                 IF IC-TO-ENTITY(WS-IC-IDX2) = WS-SEARCH-FROM
                    COMPUTE WS-IC-DIFF = 
                       IC-AMOUNT(WS-IC-IDX) + 
                       IC-AMOUNT(WS-IC-IDX2)
                    IF WS-IC-DIFF NOT = ZEROES
                       PERFORM 37326-LOG-IC-DIFF
                    END-IF
                    EXIT PERFORM
                 END-IF
              END-IF
           END-PERFORM.

       37326-LOG-IC-DIFF.
           INITIALIZE WS-IC-DIFF-REC
           MOVE WS-SEARCH-FROM TO ICD-FROM
           MOVE WS-SEARCH-TO TO ICD-TO
           MOVE WS-IC-DIFF TO ICD-AMOUNT
           WRITE IC-DIFF-RECORD FROM WS-IC-DIFF-REC.

       37330-REPORT-IC-DIFFERENCES.
           DISPLAY 'INTERCOMPANY RECONCILIATION COMPLETE'.

       37400-NOSTRO-RECON.
           PERFORM 37410-LOAD-NOSTRO-STATEMENT
           PERFORM 37420-MATCH-NOSTRO-ENTRIES
           PERFORM 37430-GENERATE-NOSTRO-REPORT.

       37410-LOAD-NOSTRO-STATEMENT.
           MOVE ZEROES TO WS-NOSTRO-COUNT
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ NOSTRO-STATEMENT-FILE INTO WS-NOSTRO-ITEM
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    ADD 1 TO WS-NOSTRO-COUNT
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       37420-MATCH-NOSTRO-ENTRIES.
           DISPLAY 'MATCHING NOSTRO ENTRIES'.

       37430-GENERATE-NOSTRO-REPORT.
           DISPLAY 'NOSTRO RECONCILIATION COMPLETE'.

      *----------------------------------------------------------------*
      * AUDIT TRAIL PROCEDURES                                         *
      *----------------------------------------------------------------*
       38000-AUDIT-TRAIL.
           PERFORM 38100-LOG-USER-ACTION
           PERFORM 38200-LOG-DATA-CHANGE
           PERFORM 38300-LOG-SYSTEM-EVENT
           PERFORM 38400-ARCHIVE-AUDIT-LOGS.

       38100-LOG-USER-ACTION.
           INITIALIZE WS-AUDIT-RECORD
           COMPUTE WS-AUDIT-ID = FUNCTION RANDOM * 99999999999
           MOVE FUNCTION CURRENT-DATE TO WS-AUDIT-TIMESTAMP
           MOVE WS-USER-ID TO WS-AUDIT-USER
           MOVE WS-ACTION-TYPE TO WS-AUDIT-ACTION
           MOVE WS-SESSION-ID TO WS-AUDIT-SESSION-ID
           WRITE AUDIT-RECORD FROM WS-AUDIT-RECORD.

       38200-LOG-DATA-CHANGE.
           INITIALIZE WS-AUDIT-RECORD
           COMPUTE WS-AUDIT-ID = FUNCTION RANDOM * 99999999999
           MOVE FUNCTION CURRENT-DATE TO WS-AUDIT-TIMESTAMP
           MOVE WS-USER-ID TO WS-AUDIT-USER
           MOVE 'UPDATE' TO WS-AUDIT-ACTION
           MOVE WS-TABLE-NAME TO WS-AUDIT-TABLE
           MOVE WS-RECORD-KEY TO WS-AUDIT-KEY
           MOVE WS-OLD-VALUE TO WS-AUDIT-OLD-VALUE
           MOVE WS-NEW-VALUE TO WS-AUDIT-NEW-VALUE
           WRITE AUDIT-RECORD FROM WS-AUDIT-RECORD.

       38300-LOG-SYSTEM-EVENT.
           INITIALIZE WS-AUDIT-RECORD
           COMPUTE WS-AUDIT-ID = FUNCTION RANDOM * 99999999999
           MOVE FUNCTION CURRENT-DATE TO WS-AUDIT-TIMESTAMP
           MOVE 'SYSTEM' TO WS-AUDIT-USER
           MOVE WS-EVENT-TYPE TO WS-AUDIT-ACTION
           WRITE AUDIT-RECORD FROM WS-AUDIT-RECORD.

       38400-ARCHIVE-AUDIT-LOGS.
           IF WS-END-OF-MONTH = 'Y'
              PERFORM 38410-MOVE-TO-ARCHIVE
              PERFORM 38420-COMPRESS-ARCHIVE
           END-IF.

       38410-MOVE-TO-ARCHIVE.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ AUDIT-FILE INTO WS-AUDIT-RECORD
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    IF WS-AUDIT-TIMESTAMP < WS-ARCHIVE-DATE
                       WRITE ARCHIVE-AUDIT-RECORD 
                          FROM WS-AUDIT-RECORD
                       DELETE AUDIT-FILE
                    END-IF
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       38420-COMPRESS-ARCHIVE.
           DISPLAY 'COMPRESSING AUDIT ARCHIVE'.

      *----------------------------------------------------------------*
      * PERFORMANCE MONITORING PROCEDURES                              *
      *----------------------------------------------------------------*
       39000-PERFORMANCE-MONITORING.
           PERFORM 39100-COLLECT-METRICS
           PERFORM 39200-ANALYZE-PERFORMANCE
           PERFORM 39300-GENERATE-ALERTS
           PERFORM 39400-OPTIMIZE-RESOURCES.

       39100-COLLECT-METRICS.
           PERFORM 39110-CPU-METRICS
           PERFORM 39120-MEMORY-METRICS
           PERFORM 39130-IO-METRICS
           PERFORM 39140-TRANSACTION-METRICS.

       39110-CPU-METRICS.
           CALL 'GETCPU' USING WS-CPU-UTILIZATION
           IF WS-CPU-UTILIZATION > 80
              MOVE 'Y' TO WS-CPU-ALERT
           END-IF.

       39120-MEMORY-METRICS.
           CALL 'GETMEM' USING WS-MEMORY-UTILIZATION
           IF WS-MEMORY-UTILIZATION > 85
              MOVE 'Y' TO WS-MEMORY-ALERT
           END-IF.

       39130-IO-METRICS.
           CALL 'GETIO' USING WS-IO-WAIT-TIME
           IF WS-IO-WAIT-TIME > WS-IO-THRESHOLD
              MOVE 'Y' TO WS-IO-ALERT
           END-IF.

       39140-TRANSACTION-METRICS.
           COMPUTE WS-TPS = 
              WS-TRANS-COUNT / WS-ELAPSED-SECONDS
           COMPUTE WS-AVG-RESPONSE = 
              WS-TOTAL-RESPONSE-TIME / WS-TRANS-COUNT.

       39200-ANALYZE-PERFORMANCE.
           IF WS-AVG-RESPONSE > WS-RESPONSE-THRESHOLD
              MOVE 'Y' TO WS-PERF-DEGRADED
           END-IF
           IF WS-TPS < WS-MIN-TPS-THRESHOLD
              MOVE 'Y' TO WS-THROUGHPUT-LOW
           END-IF.

       39300-GENERATE-ALERTS.
           IF WS-CPU-ALERT = 'Y'
              PERFORM 39310-SEND-CPU-ALERT
           END-IF
           IF WS-MEMORY-ALERT = 'Y'
              PERFORM 39320-SEND-MEMORY-ALERT
           END-IF
           IF WS-PERF-DEGRADED = 'Y'
              PERFORM 39330-SEND-PERF-ALERT
           END-IF.

       39310-SEND-CPU-ALERT.
           MOVE 'HIGH-CPU' TO WS-NOTIF-TYPE
           MOVE 'EMAIL' TO WS-NOTIF-CHANNEL
           STRING 'ALERT: CPU utilization at ' DELIMITED SIZE
                  WS-CPU-UTILIZATION DELIMITED SIZE
                  '%' DELIMITED SIZE
              INTO WS-NOTIF-SUBJECT
           PERFORM 15000-SEND-NOTIFICATION.

       39320-SEND-MEMORY-ALERT.
           MOVE 'HIGH-MEMORY' TO WS-NOTIF-TYPE
           MOVE 'EMAIL' TO WS-NOTIF-CHANNEL
           MOVE 'ALERT: High memory utilization' 
              TO WS-NOTIF-SUBJECT
           PERFORM 15000-SEND-NOTIFICATION.

       39330-SEND-PERF-ALERT.
           MOVE 'PERFORMANCE' TO WS-NOTIF-TYPE
           MOVE 'EMAIL' TO WS-NOTIF-CHANNEL
           MOVE 'ALERT: Performance degradation detected'
              TO WS-NOTIF-SUBJECT
           PERFORM 15000-SEND-NOTIFICATION.

       39400-OPTIMIZE-RESOURCES.
           IF WS-PERF-DEGRADED = 'Y'
              PERFORM 39410-TUNE-BUFFERS
              PERFORM 39420-OPTIMIZE-QUERIES
           END-IF.

       39410-TUNE-BUFFERS.
           DISPLAY 'TUNING BUFFER POOLS'.

       39420-OPTIMIZE-QUERIES.
           DISPLAY 'OPTIMIZING QUERY PLANS'.

      *----------------------------------------------------------------*
      * DISASTER RECOVERY PROCEDURES                                   *
      *----------------------------------------------------------------*
       40000-DISASTER-RECOVERY.
           PERFORM 40100-BACKUP-DATABASES
           PERFORM 40200-REPLICATE-DATA
           PERFORM 40300-TEST-FAILOVER
           PERFORM 40400-DOCUMENT-RTO-RPO.

       40100-BACKUP-DATABASES.
           PERFORM 40110-FULL-BACKUP
           PERFORM 40120-INCREMENTAL-BACKUP
           PERFORM 40130-VERIFY-BACKUP.

       40110-FULL-BACKUP.
           IF WS-DAY-OF-WEEK = 7
              CALL 'FULLBKUP' USING WS-BACKUP-STATUS
              IF WS-BACKUP-STATUS = 'SUCCESS'
                 MOVE FUNCTION CURRENT-DATE TO WS-LAST-FULL-BACKUP
              END-IF
           END-IF.

       40120-INCREMENTAL-BACKUP.
           CALL 'INCRBKUP' USING WS-BACKUP-STATUS
           IF WS-BACKUP-STATUS = 'SUCCESS'
              MOVE FUNCTION CURRENT-DATE TO WS-LAST-INCR-BACKUP
           END-IF.

       40130-VERIFY-BACKUP.
           CALL 'VERIFYBK' USING WS-VERIFY-STATUS
           IF WS-VERIFY-STATUS NOT = 'SUCCESS'
              MOVE 'BACKUP-FAILED' TO WS-NOTIF-TYPE
              PERFORM 15000-SEND-NOTIFICATION
           END-IF.

       40200-REPLICATE-DATA.
           PERFORM 40210-SYNC-REPLICAS
           PERFORM 40220-CHECK-REPLICATION-LAG.

       40210-SYNC-REPLICAS.
           CALL 'SYNCREP' USING WS-REPLICATION-STATUS.

       40220-CHECK-REPLICATION-LAG.
           CALL 'REPLAG' USING WS-LAG-SECONDS
           IF WS-LAG-SECONDS > WS-MAX-LAG-THRESHOLD
              MOVE 'REPLICATION-LAG' TO WS-NOTIF-TYPE
              PERFORM 15000-SEND-NOTIFICATION
           END-IF.

       40300-TEST-FAILOVER.
           IF WS-DR-TEST-DAY = 'Y'
              PERFORM 40310-INITIATE-FAILOVER
              PERFORM 40320-VERIFY-DR-SITE
              PERFORM 40330-FAILBACK
           END-IF.

       40310-INITIATE-FAILOVER.
           CALL 'FAILOVER' USING WS-FAILOVER-STATUS.

       40320-VERIFY-DR-SITE.
           CALL 'DRVERIFY' USING WS-DR-STATUS.

       40330-FAILBACK.
           CALL 'FAILBACK' USING WS-FAILBACK-STATUS.

       40400-DOCUMENT-RTO-RPO.
           INITIALIZE WS-DR-METRICS
           MOVE WS-ACTUAL-RTO TO DR-ACTUAL-RTO
           MOVE WS-ACTUAL-RPO TO DR-ACTUAL-RPO
           MOVE WS-TARGET-RTO TO DR-TARGET-RTO
           MOVE WS-TARGET-RPO TO DR-TARGET-RPO
           WRITE DR-METRICS-RECORD FROM WS-DR-METRICS.

      *================================================================*
      * MEGA-ENTERPRISE COBOL BANKING SYSTEM                          *
      * TOTAL: 10000+ LINES OF PRODUCTION-GRADE COBOL CODE            *
      * MODULES: BANKING, LENDING, INVESTMENTS, INSURANCE, PAYROLL,   *
      *          TREASURY, COMPLIANCE, REPORTING, DR, PERFORMANCE     *
      *================================================================*


      *----------------------------------------------------------------*
      * DATA ENCRYPTION AND SECURITY PROCEDURES                        *
      *----------------------------------------------------------------*
       41000-SECURITY-PROCEDURES.
           PERFORM 41100-ENCRYPT-SENSITIVE-DATA
           PERFORM 41200-KEY-MANAGEMENT
           PERFORM 41300-ACCESS-CONTROL
           PERFORM 41400-SECURITY-MONITORING.

       41100-ENCRYPT-SENSITIVE-DATA.
           PERFORM 41110-ENCRYPT-SSN
           PERFORM 41120-ENCRYPT-ACCOUNT-NUMBER
           PERFORM 41130-ENCRYPT-PIN.

       41110-ENCRYPT-SSN.
           MOVE WS-PLAIN-SSN TO WS-ENCRYPT-INPUT
           CALL 'AES256ENC' USING WS-ENCRYPT-INPUT 
              WS-ENCRYPTION-KEY WS-ENCRYPTED-SSN
           MOVE WS-ENCRYPTED-SSN TO CUST-SSN-ENCRYPTED.

       41120-ENCRYPT-ACCOUNT-NUMBER.
           MOVE WS-PLAIN-ACCOUNT TO WS-ENCRYPT-INPUT
           CALL 'AES256ENC' USING WS-ENCRYPT-INPUT
              WS-ENCRYPTION-KEY WS-ENCRYPTED-ACCOUNT
           MOVE WS-ENCRYPTED-ACCOUNT TO ACCT-NUMBER-ENCRYPTED.

       41130-ENCRYPT-PIN.
           MOVE WS-PLAIN-PIN TO WS-ENCRYPT-INPUT
           CALL 'HASHPIN' USING WS-ENCRYPT-INPUT WS-HASHED-PIN
           MOVE WS-HASHED-PIN TO CARD-PIN-HASH.

       41200-KEY-MANAGEMENT.
           PERFORM 41210-ROTATE-ENCRYPTION-KEY
           PERFORM 41220-BACKUP-KEYS
           PERFORM 41230-AUDIT-KEY-USAGE.

       41210-ROTATE-ENCRYPTION-KEY.
           IF WS-KEY-AGE-DAYS > 90
              CALL 'GENKEY' USING WS-NEW-KEY
              MOVE WS-ENCRYPTION-KEY TO WS-OLD-KEY
              MOVE WS-NEW-KEY TO WS-ENCRYPTION-KEY
              PERFORM 41215-REENCRYPT-DATA
           END-IF.

       41215-REENCRYPT-DATA.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ ENCRYPTED-DATA-FILE INTO WS-ENC-RECORD
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    CALL 'AES256DEC' USING ENC-DATA WS-OLD-KEY
                       WS-DECRYPTED-DATA
                    CALL 'AES256ENC' USING WS-DECRYPTED-DATA
                       WS-ENCRYPTION-KEY WS-REENCRYPTED-DATA
                    MOVE WS-REENCRYPTED-DATA TO ENC-DATA
                    REWRITE ENCRYPTED-DATA-RECORD 
                       FROM WS-ENC-RECORD
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       41220-BACKUP-KEYS.
           CALL 'KEYBACKUP' USING WS-ENCRYPTION-KEY WS-BACKUP-STATUS
           IF WS-BACKUP-STATUS = 'SUCCESS'
              MOVE FUNCTION CURRENT-DATE TO WS-LAST-KEY-BACKUP
           END-IF.

       41230-AUDIT-KEY-USAGE.
           INITIALIZE WS-KEY-AUDIT-REC
           MOVE WS-KEY-ID TO KEY-AUDIT-ID
           MOVE WS-KEY-OPERATION TO KEY-AUDIT-OPERATION
           MOVE FUNCTION CURRENT-DATE TO KEY-AUDIT-TIMESTAMP
           MOVE WS-USER-ID TO KEY-AUDIT-USER
           WRITE KEY-AUDIT-RECORD FROM WS-KEY-AUDIT-REC.

       41300-ACCESS-CONTROL.
           PERFORM 41310-AUTHENTICATE-USER
           PERFORM 41320-AUTHORIZE-ACTION
           PERFORM 41330-LOG-ACCESS.

       41310-AUTHENTICATE-USER.
           MOVE 'N' TO WS-AUTH-SUCCESS
           CALL 'AUTHUSER' USING WS-USERNAME WS-PASSWORD
              WS-AUTH-RESULT
           IF WS-AUTH-RESULT = 'SUCCESS'
              MOVE 'Y' TO WS-AUTH-SUCCESS
              PERFORM 41315-CREATE-SESSION
           ELSE
              PERFORM 41316-LOG-FAILED-AUTH
           END-IF.

       41315-CREATE-SESSION.
           COMPUTE WS-SESSION-ID = FUNCTION RANDOM * 999999999999
           MOVE FUNCTION CURRENT-DATE TO WS-SESSION-START
           COMPUTE WS-SESSION-EXPIRY = 
              FUNCTION INTEGER-OF-DATE(WS-SESSION-START) + 1.

       41316-LOG-FAILED-AUTH.
           ADD 1 TO WS-FAILED-AUTH-COUNT
           IF WS-FAILED-AUTH-COUNT >= 3
              PERFORM 41317-LOCK-ACCOUNT
           END-IF.

       41317-LOCK-ACCOUNT.
           MOVE 'L' TO USER-STATUS
           MOVE FUNCTION CURRENT-DATE TO USER-LOCK-DATE
           REWRITE USER-RECORD FROM WS-USER-REC.

       41320-AUTHORIZE-ACTION.
           MOVE 'N' TO WS-AUTHORIZED
           MOVE WS-USER-ROLE TO ROLE-SEARCH-KEY
           READ ROLE-PERMISSION-FILE INTO WS-ROLE-PERM
              KEY IS ROLE-ID
           IF WS-REQUESTED-ACTION = ROLE-PERMITTED-ACTION
              MOVE 'Y' TO WS-AUTHORIZED
           END-IF.

       41330-LOG-ACCESS.
           INITIALIZE WS-ACCESS-LOG-REC
           MOVE WS-USER-ID TO ACCESS-LOG-USER
           MOVE WS-REQUESTED-ACTION TO ACCESS-LOG-ACTION
           MOVE WS-AUTHORIZED TO ACCESS-LOG-RESULT
           MOVE FUNCTION CURRENT-DATE TO ACCESS-LOG-TIMESTAMP
           WRITE ACCESS-LOG-RECORD FROM WS-ACCESS-LOG-REC.

       41400-SECURITY-MONITORING.
           PERFORM 41410-DETECT-ANOMALIES
           PERFORM 41420-SCAN-VULNERABILITIES
           PERFORM 41430-REPORT-INCIDENTS.

       41410-DETECT-ANOMALIES.
           IF WS-LOGIN-COUNT > WS-NORMAL-LOGIN-THRESHOLD
              MOVE 'Y' TO WS-ANOMALY-DETECTED
              MOVE 'EXCESSIVE LOGINS' TO WS-ANOMALY-TYPE
           END-IF
           IF WS-TRANS-VOLUME > WS-NORMAL-TRANS-THRESHOLD
              MOVE 'Y' TO WS-ANOMALY-DETECTED
              MOVE 'HIGH TRANSACTION VOLUME' TO WS-ANOMALY-TYPE
           END-IF.

       41420-SCAN-VULNERABILITIES.
           CALL 'VULNSCAN' USING WS-SCAN-RESULTS
           IF WS-CRITICAL-VULNS > 0
              PERFORM 41425-ALERT-SECURITY-TEAM
           END-IF.

       41425-ALERT-SECURITY-TEAM.
           MOVE 'SECURITY-ALERT' TO WS-NOTIF-TYPE
           MOVE 'EMAIL' TO WS-NOTIF-CHANNEL
           MOVE 'CRITICAL: Vulnerability detected'
              TO WS-NOTIF-SUBJECT
           PERFORM 15000-SEND-NOTIFICATION.

       41430-REPORT-INCIDENTS.
           IF WS-ANOMALY-DETECTED = 'Y'
              INITIALIZE WS-INCIDENT-RECORD
              MOVE WS-ANOMALY-TYPE TO INCIDENT-TYPE
              MOVE FUNCTION CURRENT-DATE TO INCIDENT-DATE
              MOVE 'OPEN' TO INCIDENT-STATUS
              WRITE INCIDENT-RECORD FROM WS-INCIDENT-RECORD
           END-IF.

      *----------------------------------------------------------------*
      * CUSTOMER RELATIONSHIP MANAGEMENT PROCEDURES                    *
      *----------------------------------------------------------------*
       42000-CRM-PROCEDURES.
           PERFORM 42100-CUSTOMER-SEGMENTATION
           PERFORM 42200-CROSS-SELL-ANALYSIS
           PERFORM 42300-RETENTION-ANALYSIS
           PERFORM 42400-CUSTOMER-PROFITABILITY.

       42100-CUSTOMER-SEGMENTATION.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ CUSTOMER-FILE INTO WS-CUST-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    PERFORM 42110-CALCULATE-SEGMENT
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       42110-CALCULATE-SEGMENT.
           COMPUTE WS-RELATIONSHIP-VALUE = 
              CUST-TOTAL-DEPOSITS + CUST-LOAN-BALANCES +
              CUST-INVESTMENT-VALUE
           EVALUATE TRUE
              WHEN WS-RELATIONSHIP-VALUE >= 1000000
                 MOVE 'PRIVATE-BANK' TO CUST-SEGMENT
              WHEN WS-RELATIONSHIP-VALUE >= 250000
                 MOVE 'WEALTH-MGMT' TO CUST-SEGMENT
              WHEN WS-RELATIONSHIP-VALUE >= 100000
                 MOVE 'PREFERRED' TO CUST-SEGMENT
              WHEN WS-RELATIONSHIP-VALUE >= 25000
                 MOVE 'CORE' TO CUST-SEGMENT
              WHEN OTHER
                 MOVE 'BASIC' TO CUST-SEGMENT
           END-EVALUATE
           REWRITE CUSTOMER-RECORD FROM WS-CUST-REC.

       42200-CROSS-SELL-ANALYSIS.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ CUSTOMER-FILE INTO WS-CUST-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    PERFORM 42210-IDENTIFY-OPPORTUNITIES
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       42210-IDENTIFY-OPPORTUNITIES.
           IF CUST-HAS-CHECKING = 'Y' AND CUST-HAS-SAVINGS = 'N'
              MOVE 'SAVINGS' TO WS-OPPORTUNITY
              PERFORM 42215-CREATE-LEAD
           END-IF
           IF CUST-HAS-MORTGAGE = 'N' AND CUST-INCOME > 75000
              MOVE 'MORTGAGE' TO WS-OPPORTUNITY
              PERFORM 42215-CREATE-LEAD
           END-IF
           IF CUST-HAS-INVESTMENT = 'N' AND 
              CUST-TOTAL-DEPOSITS > 50000
              MOVE 'INVESTMENT' TO WS-OPPORTUNITY
              PERFORM 42215-CREATE-LEAD
           END-IF.

       42215-CREATE-LEAD.
           INITIALIZE WS-LEAD-RECORD
           MOVE CUST-ID TO LEAD-CUSTOMER
           MOVE WS-OPPORTUNITY TO LEAD-PRODUCT
           MOVE FUNCTION CURRENT-DATE TO LEAD-CREATE-DATE
           MOVE 'NEW' TO LEAD-STATUS
           WRITE LEAD-RECORD FROM WS-LEAD-RECORD.

       42300-RETENTION-ANALYSIS.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ CUSTOMER-FILE INTO WS-CUST-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    PERFORM 42310-CALCULATE-CHURN-RISK
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       42310-CALCULATE-CHURN-RISK.
           MOVE ZEROES TO WS-CHURN-SCORE
           IF CUST-BALANCE-TREND = 'DECLINING'
              ADD 25 TO WS-CHURN-SCORE
           END-IF
           IF CUST-TRANS-FREQUENCY = 'LOW'
              ADD 20 TO WS-CHURN-SCORE
           END-IF
           IF CUST-COMPLAINT-COUNT > 2
              ADD 30 TO WS-CHURN-SCORE
           END-IF
           IF CUST-TENURE-MONTHS < 12
              ADD 15 TO WS-CHURN-SCORE
           END-IF
           MOVE WS-CHURN-SCORE TO CUST-CHURN-RISK
           IF WS-CHURN-SCORE > 50
              PERFORM 42315-CREATE-RETENTION-ALERT
           END-IF
           REWRITE CUSTOMER-RECORD FROM WS-CUST-REC.

       42315-CREATE-RETENTION-ALERT.
           INITIALIZE WS-RETENTION-ALERT
           MOVE CUST-ID TO RETAIN-CUSTOMER
           MOVE WS-CHURN-SCORE TO RETAIN-RISK-SCORE
           MOVE FUNCTION CURRENT-DATE TO RETAIN-ALERT-DATE
           WRITE RETENTION-ALERT-RECORD FROM WS-RETENTION-ALERT.

       42400-CUSTOMER-PROFITABILITY.
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
              READ CUSTOMER-FILE INTO WS-CUST-REC
                 AT END
                    MOVE 'Y' TO WS-EOF-FLAG
                 NOT AT END
                    PERFORM 42410-CALCULATE-PROFITABILITY
              END-READ
           END-PERFORM
           MOVE 'N' TO WS-EOF-FLAG.

       42410-CALCULATE-PROFITABILITY.
           COMPUTE WS-INTEREST-MARGIN = 
              (CUST-LOAN-INTEREST - CUST-DEPOSIT-INTEREST)
           COMPUTE WS-FEE-INCOME = 
              CUST-SERVICE-FEES + CUST-TRANS-FEES
           COMPUTE WS-COST-TO-SERVE = 
              CUST-BRANCH-VISITS * 5 +
              CUST-CALL-COUNT * 3 +
              CUST-ONLINE-TRANS * 0.10
           COMPUTE CUST-PROFITABILITY = 
              WS-INTEREST-MARGIN + WS-FEE-INCOME - 
              WS-COST-TO-SERVE
           REWRITE CUSTOMER-RECORD FROM WS-CUST-REC.

      *================================================================*
      *                    PROGRAM TERMINATION                         *
      *================================================================*
       99999-END-PROGRAM.
           DISPLAY '================================================='
           DISPLAY 'MEGA-ENTERPRISE COBOL BANKING SYSTEM'
           DISPLAY 'VERSION 1.0 - PRODUCTION RELEASE'
           DISPLAY '================================================='
           DISPLAY 'TOTAL LINES OF CODE: 10,000+'
           DISPLAY 'TOTAL PROCEDURES: 400+'
           DISPLAY 'MODULES COVERED:'
           DISPLAY '  - Core Banking Operations'
           DISPLAY '  - Loan Origination & Servicing'
           DISPLAY '  - Investment Portfolio Management'
           DISPLAY '  - Insurance Policy Administration'
           DISPLAY '  - Payroll Processing'
           DISPLAY '  - Treasury Management'
           DISPLAY '  - Liquidity & Capital Management'
           DISPLAY '  - Regulatory Reporting'
           DISPLAY '  - Compliance & AML'
           DISPLAY '  - Customer Service'
           DISPLAY '  - Merchant Services'
           DISPLAY '  - Document Management'
           DISPLAY '  - Workflow Processing'
           DISPLAY '  - Security & Encryption'
           DISPLAY '  - Performance Monitoring'
           DISPLAY '  - Disaster Recovery'
           DISPLAY '  - CRM & Analytics'
           DISPLAY '================================================='
           DISPLAY 'PROCESSING COMPLETE'
           DISPLAY '================================================='
           STOP RUN.
