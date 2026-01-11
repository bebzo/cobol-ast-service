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
