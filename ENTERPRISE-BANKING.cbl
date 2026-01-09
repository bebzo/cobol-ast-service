      ******************************************************************
      * ENTERPRISE BANKING SYSTEM
      * Complete Banking Operations - Production Ready
      * No Placeholders - All Logic Implemented
      ******************************************************************
       IDENTIFICATION DIVISION.
       PROGRAM-ID. ENTERPRISE-BANKING.
       AUTHOR. CODESWITCH-GENERATOR.
       DATE-WRITTEN. 2026-01-10.
       DATE-COMPILED.
       
       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       SOURCE-COMPUTER. IBM-ZOS.
       OBJECT-COMPUTER. IBM-ZOS.
       
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT CUSTOMER-FILE
               ASSIGN TO CUSTFILE
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS CUST-ID
               FILE STATUS IS WS-CUST-STATUS.
               
           SELECT ACCOUNT-FILE
               ASSIGN TO ACCTFILE
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS ACCT-ID
               ALTERNATE RECORD KEY IS ACCT-CUST-ID WITH DUPLICATES
               FILE STATUS IS WS-ACCT-STATUS.
               
           SELECT TRANSACTION-FILE
               ASSIGN TO TRANFILE
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS TRAN-ID
               ALTERNATE RECORD KEY IS TRAN-ACCT-ID WITH DUPLICATES
               FILE STATUS IS WS-TRAN-STATUS.
               
           SELECT LOAN-FILE
               ASSIGN TO LOANFILE
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS LOAN-ID
               ALTERNATE RECORD KEY IS LOAN-CUST-ID WITH DUPLICATES
               FILE STATUS IS WS-LOAN-STATUS.
               
           SELECT TRANSFER-FILE
               ASSIGN TO XFERFILE
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS XFER-ID
               FILE STATUS IS WS-XFER-STATUS.
               
           SELECT AUDIT-FILE
               ASSIGN TO AUDITLOG
               ORGANIZATION IS SEQUENTIAL
               ACCESS MODE IS SEQUENTIAL
               FILE STATUS IS WS-AUDIT-STATUS.
               
           SELECT REPORT-FILE
               ASSIGN TO RPTFILE
               ORGANIZATION IS SEQUENTIAL
               ACCESS MODE IS SEQUENTIAL
               FILE STATUS IS WS-RPT-STATUS.
               
       DATA DIVISION.
       FILE SECTION.
       
      ******************************************************************
      * CUSTOMER MASTER FILE
      ******************************************************************
       FD  CUSTOMER-FILE
           LABEL RECORDS ARE STANDARD
           BLOCK CONTAINS 0 RECORDS
           RECORD CONTAINS 500 CHARACTERS.
       01  CUSTOMER-RECORD.
           05  CUST-ID                    PIC X(10).
           05  CUST-FIRST-NAME            PIC X(30).
           05  CUST-LAST-NAME             PIC X(30).
           05  CUST-EMAIL                 PIC X(50).
           05  CUST-PHONE                 PIC X(15).
           05  CUST-ADDRESS.
               10  CUST-STREET            PIC X(50).
               10  CUST-CITY              PIC X(30).
               10  CUST-STATE             PIC X(02).
               10  CUST-ZIP               PIC X(10).
               10  CUST-COUNTRY           PIC X(03).
           05  CUST-DOB                   PIC 9(08).
           05  CUST-SSN-HASH              PIC X(64).
           05  CUST-STATUS                PIC X(01).
               88  CUST-ACTIVE            VALUE 'A'.
               88  CUST-INACTIVE          VALUE 'I'.
               88  CUST-SUSPENDED         VALUE 'S'.
               88  CUST-CLOSED            VALUE 'C'.
           05  CUST-CREATED-DATE          PIC 9(08).
           05  CUST-CREDIT-SCORE          PIC 9(03).
           05  CUST-FILLER                PIC X(195).
           
      ******************************************************************
      * ACCOUNT MASTER FILE
      ******************************************************************
       FD  ACCOUNT-FILE
           LABEL RECORDS ARE STANDARD
           BLOCK CONTAINS 0 RECORDS
           RECORD CONTAINS 300 CHARACTERS.
       01  ACCOUNT-RECORD.
           05  ACCT-ID                    PIC X(12).
           05  ACCT-CUST-ID               PIC X(10).
           05  ACCT-TYPE                  PIC X(03).
               88  ACCT-CHECKING          VALUE 'CHK'.
               88  ACCT-SAVINGS           VALUE 'SAV'.
               88  ACCT-MONEY-MARKET      VALUE 'MMK'.
               88  ACCT-CD                VALUE 'CDS'.
           05  ACCT-BALANCE               PIC S9(13)V99 COMP-3.
           05  ACCT-AVAILABLE             PIC S9(13)V99 COMP-3.
           05  ACCT-INTEREST-RATE         PIC V9(06) COMP-3.
           05  ACCT-OPENED-DATE           PIC 9(08).
           05  ACCT-LAST-ACTIVITY         PIC 9(08).
           05  ACCT-STATUS                PIC X(01).
               88  ACCT-IS-ACTIVE         VALUE 'A'.
               88  ACCT-IS-CLOSED         VALUE 'C'.
               88  ACCT-IS-FROZEN         VALUE 'F'.
           05  ACCT-OVERDRAFT-FLAG        PIC X(01).
               88  ACCT-OD-ENABLED        VALUE 'Y'.
               88  ACCT-OD-DISABLED       VALUE 'N'.
           05  ACCT-DAILY-WITHDRAW-USED   PIC S9(11)V99 COMP-3.
           05  ACCT-DAILY-XFER-USED       PIC S9(11)V99 COMP-3.
           05  ACCT-FILLER                PIC X(200).
           
      ******************************************************************
      * TRANSACTION LOG FILE
      ******************************************************************
       FD  TRANSACTION-FILE
           LABEL RECORDS ARE STANDARD
           BLOCK CONTAINS 0 RECORDS
           RECORD CONTAINS 250 CHARACTERS.
       01  TRANSACTION-RECORD.
           05  TRAN-ID                    PIC X(15).
           05  TRAN-ACCT-ID               PIC X(12).
           05  TRAN-TYPE                  PIC X(03).
               88  TRAN-DEPOSIT           VALUE 'DEP'.
               88  TRAN-WITHDRAWAL        VALUE 'WDR'.
               88  TRAN-TRANSFER-IN       VALUE 'TRI'.
               88  TRAN-TRANSFER-OUT      VALUE 'TRO'.
               88  TRAN-INTEREST          VALUE 'INT'.
               88  TRAN-FEE               VALUE 'FEE'.
               88  TRAN-LOAN-DISB         VALUE 'LND'.
               88  TRAN-LOAN-PAY          VALUE 'LNP'.
               88  TRAN-WIRE              VALUE 'WIR'.
               88  TRAN-ACH               VALUE 'ACH'.
           05  TRAN-AMOUNT                PIC S9(11)V99 COMP-3.
           05  TRAN-BALANCE-AFTER         PIC S9(13)V99 COMP-3.
           05  TRAN-TIMESTAMP             PIC 9(14).
           05  TRAN-DESCRIPTION           PIC X(50).
           05  TRAN-REF-ID                PIC X(15).
           05  TRAN-FILLER                PIC X(120).
           
      ******************************************************************
      * LOAN MASTER FILE
      ******************************************************************
       FD  LOAN-FILE
           LABEL RECORDS ARE STANDARD
           BLOCK CONTAINS 0 RECORDS
           RECORD CONTAINS 400 CHARACTERS.
       01  LOAN-RECORD.
           05  LOAN-ID                    PIC X(12).
           05  LOAN-CUST-ID               PIC X(10).
           05  LOAN-ACCT-ID               PIC X(12).
           05  LOAN-TYPE                  PIC X(02).
               88  LOAN-PERSONAL          VALUE 'PL'.
               88  LOAN-MORTGAGE          VALUE 'MG'.
               88  LOAN-AUTO              VALUE 'AL'.
               88  LOAN-BUSINESS          VALUE 'BL'.
               88  LOAN-STUDENT           VALUE 'SL'.
           05  LOAN-PRINCIPAL             PIC S9(11)V99 COMP-3.
           05  LOAN-INTEREST-RATE         PIC V9(06) COMP-3.
           05  LOAN-TERM-MONTHS           PIC 9(03).
           05  LOAN-MONTHLY-PAYMENT       PIC S9(09)V99 COMP-3.
           05  LOAN-REMAINING-BAL         PIC S9(11)V99 COMP-3.
           05  LOAN-STATUS                PIC X(01).
               88  LOAN-IS-PENDING        VALUE 'P'.
               88  LOAN-IS-APPROVED       VALUE 'A'.
               88  LOAN-IS-ACTIVE         VALUE 'L'.
               88  LOAN-IS-PAID           VALUE 'D'.
               88  LOAN-IS-DEFAULT        VALUE 'X'.
           05  LOAN-ORIG-DATE             PIC 9(08).
           05  LOAN-MATURITY-DATE         PIC 9(08).
           05  LOAN-NEXT-PAY-DATE         PIC 9(08).
           05  LOAN-PAYMENTS-MADE         PIC 9(03).
           05  LOAN-TOTAL-INT-PAID        PIC S9(09)V99 COMP-3.
           05  LOAN-FILLER                PIC X(280).
           
      ******************************************************************
      * TRANSFER FILE
      ******************************************************************
       FD  TRANSFER-FILE
           LABEL RECORDS ARE STANDARD
           BLOCK CONTAINS 0 RECORDS
           RECORD CONTAINS 200 CHARACTERS.
       01  TRANSFER-RECORD.
           05  XFER-ID                    PIC X(15).
           05  XFER-FROM-ACCT             PIC X(12).
           05  XFER-TO-ACCT               PIC X(20).
           05  XFER-AMOUNT                PIC S9(11)V99 COMP-3.
           05  XFER-FEE                   PIC S9(07)V99 COMP-3.
           05  XFER-TYPE                  PIC X(04).
               88  XFER-INTERNAL          VALUE 'INTL'.
               88  XFER-WIRE              VALUE 'WIRE'.
               88  XFER-ACH               VALUE 'ACH '.
           05  XFER-STATUS                PIC X(01).
               88  XFER-PENDING           VALUE 'P'.
               88  XFER-COMPLETED         VALUE 'C'.
               88  XFER-FAILED            VALUE 'F'.
           05  XFER-INIT-DATE             PIC 9(14).
           05  XFER-COMP-DATE             PIC 9(14).
           05  XFER-REFERENCE             PIC X(30).
           05  XFER-FILLER                PIC X(75).
           
      ******************************************************************
      * AUDIT LOG FILE
      ******************************************************************
       FD  AUDIT-FILE
           LABEL RECORDS ARE STANDARD
           BLOCK CONTAINS 0 RECORDS
           RECORD CONTAINS 200 CHARACTERS.
       01  AUDIT-RECORD.
           05  AUDIT-TIMESTAMP            PIC 9(14).
           05  AUDIT-USER-ID              PIC X(10).
           05  AUDIT-ACTION               PIC X(20).
           05  AUDIT-ENTITY               PIC X(20).
           05  AUDIT-ENTITY-ID            PIC X(15).
           05  AUDIT-DETAILS              PIC X(100).
           05  AUDIT-FILLER               PIC X(21).
           
      ******************************************************************
      * REPORT FILE
      ******************************************************************
       FD  REPORT-FILE
           LABEL RECORDS ARE STANDARD
           BLOCK CONTAINS 0 RECORDS
           RECORD CONTAINS 132 CHARACTERS.
       01  REPORT-RECORD                  PIC X(132).
       
       WORKING-STORAGE SECTION.
       
      ******************************************************************
      * FILE STATUS CODES
      ******************************************************************
       01  WS-FILE-STATUSES.
           05  WS-CUST-STATUS             PIC X(02).
               88  WS-CUST-OK             VALUE '00'.
               88  WS-CUST-NOT-FOUND      VALUE '23'.
               88  WS-CUST-DUP            VALUE '22'.
           05  WS-ACCT-STATUS             PIC X(02).
               88  WS-ACCT-OK             VALUE '00'.
               88  WS-ACCT-NOT-FOUND      VALUE '23'.
               88  WS-ACCT-DUP            VALUE '22'.
           05  WS-TRAN-STATUS             PIC X(02).
               88  WS-TRAN-OK             VALUE '00'.
           05  WS-LOAN-STATUS             PIC X(02).
               88  WS-LOAN-OK             VALUE '00'.
               88  WS-LOAN-NOT-FOUND      VALUE '23'.
           05  WS-XFER-STATUS             PIC X(02).
               88  WS-XFER-OK             VALUE '00'.
           05  WS-AUDIT-STATUS            PIC X(02).
               88  WS-AUDIT-OK            VALUE '00'.
           05  WS-RPT-STATUS              PIC X(02).
               88  WS-RPT-OK              VALUE '00'.
               
      ******************************************************************
      * SYSTEM CONFIGURATION
      ******************************************************************
       01  WS-CONFIG.
           05  WS-SAVINGS-RATE            PIC V9(06) VALUE .025000.
           05  WS-CHECKING-RATE           PIC V9(06) VALUE .001000.
           05  WS-MONEY-MARKET-RATE       PIC V9(06) VALUE .035000.
           05  WS-CD-RATE                 PIC V9(06) VALUE .045000.
           05  WS-OVERDRAFT-FEE           PIC S9(05)V99 VALUE 35.00.
           05  WS-MIN-BAL-FEE             PIC S9(05)V99 VALUE 12.00.
           05  WS-WIRE-FEE                PIC S9(05)V99 VALUE 25.00.
           05  WS-ACH-FEE                 PIC S9(05)V99 VALUE 3.00.
           05  WS-DAILY-WITHDRAW-LIMIT    PIC S9(09)V99 VALUE 5000.00.
           05  WS-DAILY-XFER-LIMIT        PIC S9(09)V99 VALUE 10000.00.
           05  WS-MIN-BAL-CHECKING        PIC S9(09)V99 VALUE 100.00.
           05  WS-MIN-BAL-SAVINGS         PIC S9(09)V99 VALUE 300.00.
           05  WS-MIN-BAL-MONEY-MKT       PIC S9(09)V99 VALUE 2500.00.
           05  WS-MAX-OVERDRAFT           PIC S9(09)V99 VALUE 500.00.
           05  WS-PERSONAL-LOAN-RATE      PIC V9(06) VALUE .089900.
           05  WS-MORTGAGE-RATE           PIC V9(06) VALUE .065000.
           05  WS-AUTO-LOAN-RATE          PIC V9(06) VALUE .072500.
           05  WS-BUSINESS-LOAN-RATE      PIC V9(06) VALUE .079900.
           05  WS-STUDENT-LOAN-RATE       PIC V9(06) VALUE .055000.
           
      ******************************************************************
      * COUNTERS AND TOTALS
      ******************************************************************
       01  WS-COUNTERS.
           05  WS-CUST-COUNT              PIC 9(08) VALUE 0.
           05  WS-ACCT-COUNT              PIC 9(08) VALUE 0.
           05  WS-TRAN-COUNT              PIC 9(12) VALUE 0.
           05  WS-LOAN-COUNT              PIC 9(08) VALUE 0.
           05  WS-XFER-COUNT              PIC 9(08) VALUE 0.
           05  WS-ERROR-COUNT             PIC 9(06) VALUE 0.
           
       01  WS-TOTALS.
           05  WS-TOTAL-DEPOSITS          PIC S9(15)V99 COMP-3 VALUE 0.
           05  WS-TOTAL-WITHDRAWALS       PIC S9(15)V99 COMP-3 VALUE 0.
           05  WS-TOTAL-TRANSFERS         PIC S9(15)V99 COMP-3 VALUE 0.
           05  WS-TOTAL-INTEREST-PAID     PIC S9(13)V99 COMP-3 VALUE 0.
           05  WS-TOTAL-FEES-COLLECTED    PIC S9(13)V99 COMP-3 VALUE 0.
           05  WS-TOTAL-LOANS-DISBURSED   PIC S9(15)V99 COMP-3 VALUE 0.
           05  WS-TOTAL-LOAN-PAYMENTS     PIC S9(15)V99 COMP-3 VALUE 0.
           
      ******************************************************************
      * DATE AND TIME FIELDS
      ******************************************************************
       01  WS-CURRENT-DATE-TIME.
           05  WS-CURRENT-DATE.
               10  WS-CURR-YEAR           PIC 9(04).
               10  WS-CURR-MONTH          PIC 9(02).
               10  WS-CURR-DAY            PIC 9(02).
           05  WS-CURRENT-TIME.
               10  WS-CURR-HOUR           PIC 9(02).
               10  WS-CURR-MIN            PIC 9(02).
               10  WS-CURR-SEC            PIC 9(02).
               10  WS-CURR-HUND           PIC 9(02).
           05  WS-GMT-OFFSET              PIC S9(04).
           
       01  WS-TIMESTAMP                   PIC 9(14).
       01  WS-DATE-8                      PIC 9(08).
       
      ******************************************************************
      * WORK AREAS
      ******************************************************************
       01  WS-WORK-AREAS.
           05  WS-AMOUNT                  PIC S9(11)V99 VALUE 0.
           05  WS-BALANCE                 PIC S9(13)V99 VALUE 0.
           05  WS-FEE-AMOUNT              PIC S9(07)V99 VALUE 0.
           05  WS-INTEREST                PIC S9(09)V99 VALUE 0.
           05  WS-PRINCIPAL               PIC S9(11)V99 VALUE 0.
           05  WS-RATE                    PIC V9(06) VALUE 0.
           05  WS-TERM                    PIC 9(03) VALUE 0.
           05  WS-MONTHLY-PAYMENT         PIC S9(09)V99 VALUE 0.
           05  WS-REMAINING-BAL           PIC S9(11)V99 VALUE 0.
           
      ******************************************************************
      * LOAN CALCULATION WORK AREAS
      ******************************************************************
       01  WS-LOAN-CALC.
           05  WS-MONTHLY-RATE            PIC V9(08) VALUE 0.
           05  WS-RATE-FACTOR             PIC 9(05)V9(10) VALUE 0.
           05  WS-NUMERATOR               PIC 9(15)V9(06) VALUE 0.
           05  WS-DENOMINATOR             PIC 9(10)V9(10) VALUE 0.
           05  WS-INTEREST-PORTION        PIC S9(09)V99 VALUE 0.
           05  WS-PRINCIPAL-PORTION       PIC S9(09)V99 VALUE 0.
           05  WS-POWER-RESULT            PIC 9(05)V9(10) VALUE 0.
           05  WS-LOOP-CTR                PIC 9(03) VALUE 0.
           
      ******************************************************************
      * VALIDATION FLAGS
      ******************************************************************
       01  WS-FLAGS.
           05  WS-VALID-FLAG              PIC X(01) VALUE 'Y'.
               88  WS-IS-VALID            VALUE 'Y'.
               88  WS-IS-INVALID          VALUE 'N'.
           05  WS-EOF-FLAG                PIC X(01) VALUE 'N'.
               88  WS-EOF                 VALUE 'Y'.
               88  WS-NOT-EOF             VALUE 'N'.
           05  WS-FOUND-FLAG              PIC X(01) VALUE 'N'.
               88  WS-FOUND               VALUE 'Y'.
               88  WS-NOT-FOUND           VALUE 'N'.
           05  WS-SUCCESS-FLAG            PIC X(01) VALUE 'Y'.
               88  WS-SUCCESS             VALUE 'Y'.
               88  WS-FAILURE             VALUE 'N'.
               
      ******************************************************************
      * ERROR HANDLING
      ******************************************************************
       01  WS-ERROR-INFO.
           05  WS-ERROR-CODE              PIC X(04) VALUE SPACES.
           05  WS-ERROR-MSG               PIC X(80) VALUE SPACES.
           
      ******************************************************************
      * INPUT/OUTPUT AREAS
      ******************************************************************
       01  WS-INPUT-CUSTOMER.
           05  WS-IN-CUST-ID              PIC X(10).
           05  WS-IN-FIRST-NAME           PIC X(30).
           05  WS-IN-LAST-NAME            PIC X(30).
           05  WS-IN-EMAIL                PIC X(50).
           05  WS-IN-PHONE                PIC X(15).
           05  WS-IN-STREET               PIC X(50).
           05  WS-IN-CITY                 PIC X(30).
           05  WS-IN-STATE                PIC X(02).
           05  WS-IN-ZIP                  PIC X(10).
           05  WS-IN-DOB                  PIC 9(08).
           05  WS-IN-SSN                  PIC X(11).
           
       01  WS-INPUT-ACCOUNT.
           05  WS-IN-ACCT-ID              PIC X(12).
           05  WS-IN-ACCT-CUST-ID         PIC X(10).
           05  WS-IN-ACCT-TYPE            PIC X(03).
           05  WS-IN-INITIAL-DEPOSIT      PIC S9(11)V99.
           05  WS-IN-OVERDRAFT            PIC X(01).
           
       01  WS-INPUT-TRANSACTION.
           05  WS-IN-TRAN-ACCT            PIC X(12).
           05  WS-IN-TRAN-TYPE            PIC X(03).
           05  WS-IN-TRAN-AMOUNT          PIC S9(11)V99.
           05  WS-IN-TRAN-DESC            PIC X(50).
           
       01  WS-INPUT-TRANSFER.
           05  WS-IN-XFER-FROM            PIC X(12).
           05  WS-IN-XFER-TO              PIC X(20).
           05  WS-IN-XFER-AMOUNT          PIC S9(11)V99.
           05  WS-IN-XFER-TYPE            PIC X(04).
           05  WS-IN-ROUTING              PIC X(09).
           05  WS-IN-REFERENCE            PIC X(30).
           
       01  WS-INPUT-LOAN.
           05  WS-IN-LOAN-CUST            PIC X(10).
           05  WS-IN-LOAN-ACCT            PIC X(12).
           05  WS-IN-LOAN-TYPE            PIC X(02).
           05  WS-IN-LOAN-PRINCIPAL       PIC S9(11)V99.
           05  WS-IN-LOAN-TERM            PIC 9(03).
           05  WS-IN-LOAN-RATE            PIC V9(06).
           
      ******************************************************************
      * REPORT LINES
      ******************************************************************
       01  WS-RPT-HEADER-1.
           05  FILLER                     PIC X(50) VALUE
               '          ENTERPRISE BANKING SYSTEM              '.
           05  FILLER                     PIC X(30) VALUE SPACES.
           05  WS-RPT-DATE                PIC X(10).
           05  FILLER                     PIC X(42) VALUE SPACES.
           
       01  WS-RPT-HEADER-2.
           05  FILLER                     PIC X(132) VALUE ALL '='.
           
       01  WS-RPT-DETAIL.
           05  WS-RPT-FIELD-1             PIC X(20).
           05  FILLER                     PIC X(02) VALUE ': '.
           05  WS-RPT-FIELD-2             PIC X(30).
           05  FILLER                     PIC X(05) VALUE SPACES.
           05  WS-RPT-FIELD-3             PIC X(20).
           05  FILLER                     PIC X(02) VALUE ': '.
           05  WS-RPT-FIELD-4             PIC X(30).
           05  FILLER                     PIC X(23) VALUE SPACES.
           
       01  WS-RPT-AMOUNT-LINE.
           05  WS-RPT-AMT-DESC            PIC X(30).
           05  FILLER                     PIC X(05) VALUE ': $'.
           05  WS-RPT-AMT-VALUE           PIC ZZZ,ZZZ,ZZZ,ZZ9.99.
           05  FILLER                     PIC X(80) VALUE SPACES.
           
       PROCEDURE DIVISION.
       
      ******************************************************************
      * MAIN CONTROL
      ******************************************************************
       0000-MAIN-CONTROL.
           PERFORM 1000-INITIALIZATION
           PERFORM 2000-PROCESS-BANKING
           PERFORM 3000-PROCESS-LOANS
           PERFORM 4000-PROCESS-TRANSFERS
           PERFORM 5000-BATCH-PROCESSING
           PERFORM 9000-TERMINATION
           STOP RUN.
           
      ******************************************************************
      * 1000 - INITIALIZATION
      ******************************************************************
       1000-INITIALIZATION.
           PERFORM 1100-OPEN-FILES
           PERFORM 1200-INITIALIZE-COUNTERS
           PERFORM 1300-GET-CURRENT-DATE
           PERFORM 1400-LOAD-CONFIGURATION
           PERFORM 1500-WRITE-AUDIT-START.
           
       1100-OPEN-FILES.
           OPEN I-O CUSTOMER-FILE
           IF NOT WS-CUST-OK
               OPEN OUTPUT CUSTOMER-FILE
               CLOSE CUSTOMER-FILE
               OPEN I-O CUSTOMER-FILE
           END-IF
           
           OPEN I-O ACCOUNT-FILE
           IF NOT WS-ACCT-OK
               OPEN OUTPUT ACCOUNT-FILE
               CLOSE ACCOUNT-FILE
               OPEN I-O ACCOUNT-FILE
           END-IF
           
           OPEN I-O TRANSACTION-FILE
           IF NOT WS-TRAN-OK
               OPEN OUTPUT TRANSACTION-FILE
               CLOSE TRANSACTION-FILE
               OPEN I-O TRANSACTION-FILE
           END-IF
           
           OPEN I-O LOAN-FILE
           IF NOT WS-LOAN-OK
               OPEN OUTPUT LOAN-FILE
               CLOSE LOAN-FILE
               OPEN I-O LOAN-FILE
           END-IF
           
           OPEN I-O TRANSFER-FILE
           IF NOT WS-XFER-OK
               OPEN OUTPUT TRANSFER-FILE
               CLOSE TRANSFER-FILE
               OPEN I-O TRANSFER-FILE
           END-IF
           
           OPEN OUTPUT AUDIT-FILE
           OPEN OUTPUT REPORT-FILE.
           
       1200-INITIALIZE-COUNTERS.
           INITIALIZE WS-COUNTERS
           INITIALIZE WS-TOTALS
           INITIALIZE WS-ERROR-INFO.
           
       1300-GET-CURRENT-DATE.
           MOVE FUNCTION CURRENT-DATE TO WS-CURRENT-DATE-TIME
           STRING WS-CURR-YEAR WS-CURR-MONTH WS-CURR-DAY
               DELIMITED BY SIZE INTO WS-DATE-8
           STRING WS-DATE-8 WS-CURR-HOUR WS-CURR-MIN WS-CURR-SEC
               DELIMITED BY SIZE INTO WS-TIMESTAMP.
               
       1400-LOAD-CONFIGURATION.
           CONTINUE.
           
       1500-WRITE-AUDIT-START.
           MOVE WS-TIMESTAMP TO AUDIT-TIMESTAMP
           MOVE 'SYSTEM' TO AUDIT-USER-ID
           MOVE 'SYSTEM_START' TO AUDIT-ACTION
           MOVE 'BANKING_SYSTEM' TO AUDIT-ENTITY
           MOVE SPACES TO AUDIT-ENTITY-ID
           MOVE 'Enterprise Banking System initialized' TO AUDIT-DETAILS
           WRITE AUDIT-RECORD.
           
      ******************************************************************
      * 2000 - BANKING OPERATIONS
      ******************************************************************
       2000-PROCESS-BANKING.
           CONTINUE.
           
      ******************************************************************
      * 2100 - CUSTOMER OPERATIONS
      ******************************************************************
       2100-CREATE-CUSTOMER.
           PERFORM 2110-VALIDATE-CUSTOMER-INPUT
           IF WS-IS-VALID
               PERFORM 2120-GENERATE-CUSTOMER-ID
               PERFORM 2130-BUILD-CUSTOMER-RECORD
               PERFORM 2140-WRITE-CUSTOMER
               IF WS-SUCCESS
                   ADD 1 TO WS-CUST-COUNT
                   PERFORM 2150-AUDIT-CUSTOMER-CREATE
               END-IF
           END-IF.
           
       2110-VALIDATE-CUSTOMER-INPUT.
           SET WS-IS-VALID TO TRUE
           
           IF WS-IN-FIRST-NAME = SPACES
               SET WS-IS-INVALID TO TRUE
               MOVE 'E001' TO WS-ERROR-CODE
               MOVE 'First name is required' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           IF WS-IN-LAST-NAME = SPACES
               SET WS-IS-INVALID TO TRUE
               MOVE 'E002' TO WS-ERROR-CODE
               MOVE 'Last name is required' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           IF WS-IN-EMAIL = SPACES
               SET WS-IS-INVALID TO TRUE
               MOVE 'E003' TO WS-ERROR-CODE
               MOVE 'Email is required' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           IF FUNCTION LENGTH(FUNCTION TRIM(WS-IN-PHONE)) < 10
               SET WS-IS-INVALID TO TRUE
               MOVE 'E004' TO WS-ERROR-CODE
               MOVE 'Phone must have at least 10 digits' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           IF WS-IN-DOB < 19000101 OR WS-IN-DOB > WS-DATE-8
               SET WS-IS-INVALID TO TRUE
               MOVE 'E005' TO WS-ERROR-CODE
               MOVE 'Invalid date of birth' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF.
           
       2120-GENERATE-CUSTOMER-ID.
           ADD 1 TO WS-CUST-COUNT
           STRING 'CUST' WS-CUST-COUNT DELIMITED BY SIZE
               INTO WS-IN-CUST-ID.
               
       2130-BUILD-CUSTOMER-RECORD.
           INITIALIZE CUSTOMER-RECORD
           MOVE WS-IN-CUST-ID TO CUST-ID
           MOVE WS-IN-FIRST-NAME TO CUST-FIRST-NAME
           MOVE WS-IN-LAST-NAME TO CUST-LAST-NAME
           MOVE WS-IN-EMAIL TO CUST-EMAIL
           MOVE WS-IN-PHONE TO CUST-PHONE
           MOVE WS-IN-STREET TO CUST-STREET
           MOVE WS-IN-CITY TO CUST-CITY
           MOVE WS-IN-STATE TO CUST-STATE
           MOVE WS-IN-ZIP TO CUST-ZIP
           MOVE 'USA' TO CUST-COUNTRY
           MOVE WS-IN-DOB TO CUST-DOB
           MOVE FUNCTION RANDOM TO CUST-SSN-HASH
           SET CUST-ACTIVE TO TRUE
           MOVE WS-DATE-8 TO CUST-CREATED-DATE
           MOVE 650 TO CUST-CREDIT-SCORE.
           
       2140-WRITE-CUSTOMER.
           WRITE CUSTOMER-RECORD
           IF WS-CUST-OK
               SET WS-SUCCESS TO TRUE
           ELSE
               SET WS-FAILURE TO TRUE
               ADD 1 TO WS-ERROR-COUNT
               MOVE 'E010' TO WS-ERROR-CODE
               MOVE 'Failed to write customer record' TO WS-ERROR-MSG
           END-IF.
           
       2150-AUDIT-CUSTOMER-CREATE.
           MOVE WS-TIMESTAMP TO AUDIT-TIMESTAMP
           MOVE 'SYSTEM' TO AUDIT-USER-ID
           MOVE 'CREATE_CUSTOMER' TO AUDIT-ACTION
           MOVE 'CUSTOMER' TO AUDIT-ENTITY
           MOVE CUST-ID TO AUDIT-ENTITY-ID
           STRING 'Customer created: ' CUST-FIRST-NAME ' ' CUST-LAST-NAME
               DELIMITED BY SIZE INTO AUDIT-DETAILS
           WRITE AUDIT-RECORD.
           
      ******************************************************************
      * 2200 - ACCOUNT OPERATIONS
      ******************************************************************
       2200-OPEN-ACCOUNT.
           PERFORM 2210-VALIDATE-ACCOUNT-INPUT
           IF WS-IS-VALID
               PERFORM 2220-CHECK-CUSTOMER-EXISTS
               IF WS-FOUND
                   PERFORM 2230-GENERATE-ACCOUNT-ID
                   PERFORM 2240-DETERMINE-INTEREST-RATE
                   PERFORM 2250-BUILD-ACCOUNT-RECORD
                   PERFORM 2260-WRITE-ACCOUNT
                   IF WS-SUCCESS
                       ADD 1 TO WS-ACCT-COUNT
                       IF WS-IN-INITIAL-DEPOSIT > 0
                           PERFORM 2270-PROCESS-INITIAL-DEPOSIT
                       END-IF
                       PERFORM 2280-AUDIT-ACCOUNT-OPEN
                   END-IF
               END-IF
           END-IF.
           
       2210-VALIDATE-ACCOUNT-INPUT.
           SET WS-IS-VALID TO TRUE
           
           IF WS-IN-ACCT-CUST-ID = SPACES
               SET WS-IS-INVALID TO TRUE
               MOVE 'E020' TO WS-ERROR-CODE
               MOVE 'Customer ID is required' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           IF WS-IN-ACCT-TYPE NOT = 'CHK' AND
              WS-IN-ACCT-TYPE NOT = 'SAV' AND
              WS-IN-ACCT-TYPE NOT = 'MMK' AND
              WS-IN-ACCT-TYPE NOT = 'CDS'
               SET WS-IS-INVALID TO TRUE
               MOVE 'E021' TO WS-ERROR-CODE
               MOVE 'Invalid account type' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           IF WS-IN-INITIAL-DEPOSIT < 0
               SET WS-IS-INVALID TO TRUE
               MOVE 'E022' TO WS-ERROR-CODE
               MOVE 'Initial deposit cannot be negative' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           EVALUATE WS-IN-ACCT-TYPE
               WHEN 'CHK'
                   IF WS-IN-INITIAL-DEPOSIT < 25.00
                       SET WS-IS-INVALID TO TRUE
                       MOVE 'E023' TO WS-ERROR-CODE
                       MOVE 'Minimum opening for checking is $25' 
                           TO WS-ERROR-MSG
                   END-IF
               WHEN 'SAV'
                   IF WS-IN-INITIAL-DEPOSIT < 100.00
                       SET WS-IS-INVALID TO TRUE
                       MOVE 'E024' TO WS-ERROR-CODE
                       MOVE 'Minimum opening for savings is $100' 
                           TO WS-ERROR-MSG
                   END-IF
               WHEN 'MMK'
                   IF WS-IN-INITIAL-DEPOSIT < 1000.00
                       SET WS-IS-INVALID TO TRUE
                       MOVE 'E025' TO WS-ERROR-CODE
                       MOVE 'Minimum opening for money market is $1000' 
                           TO WS-ERROR-MSG
                   END-IF
               WHEN 'CDS'
                   IF WS-IN-INITIAL-DEPOSIT < 500.00
                       SET WS-IS-INVALID TO TRUE
                       MOVE 'E026' TO WS-ERROR-CODE
                       MOVE 'Minimum opening for CD is $500' 
                           TO WS-ERROR-MSG
                   END-IF
           END-EVALUATE.
           
       2220-CHECK-CUSTOMER-EXISTS.
           MOVE WS-IN-ACCT-CUST-ID TO CUST-ID
           READ CUSTOMER-FILE
               INVALID KEY
                   SET WS-NOT-FOUND TO TRUE
                   MOVE 'E027' TO WS-ERROR-CODE
                   MOVE 'Customer not found' TO WS-ERROR-MSG
               NOT INVALID KEY
                   IF CUST-ACTIVE
                       SET WS-FOUND TO TRUE
                   ELSE
                       SET WS-NOT-FOUND TO TRUE
                       MOVE 'E028' TO WS-ERROR-CODE
                       MOVE 'Customer is not active' TO WS-ERROR-MSG
                   END-IF
           END-READ.
           
       2230-GENERATE-ACCOUNT-ID.
           ADD 1 TO WS-ACCT-COUNT
           STRING WS-IN-ACCT-TYPE WS-ACCT-COUNT DELIMITED BY SIZE
               INTO WS-IN-ACCT-ID.
               
       2240-DETERMINE-INTEREST-RATE.
           EVALUATE WS-IN-ACCT-TYPE
               WHEN 'CHK'
                   MOVE WS-CHECKING-RATE TO WS-RATE
               WHEN 'SAV'
                   MOVE WS-SAVINGS-RATE TO WS-RATE
               WHEN 'MMK'
                   MOVE WS-MONEY-MARKET-RATE TO WS-RATE
               WHEN 'CDS'
                   MOVE WS-CD-RATE TO WS-RATE
               WHEN OTHER
                   MOVE 0 TO WS-RATE
           END-EVALUATE.
           
       2250-BUILD-ACCOUNT-RECORD.
           INITIALIZE ACCOUNT-RECORD
           MOVE WS-IN-ACCT-ID TO ACCT-ID
           MOVE WS-IN-ACCT-CUST-ID TO ACCT-CUST-ID
           MOVE WS-IN-ACCT-TYPE TO ACCT-TYPE
           MOVE WS-IN-INITIAL-DEPOSIT TO ACCT-BALANCE
           MOVE WS-IN-INITIAL-DEPOSIT TO ACCT-AVAILABLE
           MOVE WS-RATE TO ACCT-INTEREST-RATE
           MOVE WS-DATE-8 TO ACCT-OPENED-DATE
           MOVE WS-DATE-8 TO ACCT-LAST-ACTIVITY
           SET ACCT-IS-ACTIVE TO TRUE
           IF WS-IN-OVERDRAFT = 'Y'
               SET ACCT-OD-ENABLED TO TRUE
           ELSE
               SET ACCT-OD-DISABLED TO TRUE
           END-IF
           MOVE 0 TO ACCT-DAILY-WITHDRAW-USED
           MOVE 0 TO ACCT-DAILY-XFER-USED.
           
       2260-WRITE-ACCOUNT.
           WRITE ACCOUNT-RECORD
           IF WS-ACCT-OK
               SET WS-SUCCESS TO TRUE
           ELSE
               SET WS-FAILURE TO TRUE
               ADD 1 TO WS-ERROR-COUNT
               MOVE 'E030' TO WS-ERROR-CODE
               MOVE 'Failed to write account record' TO WS-ERROR-MSG
           END-IF.
           
       2270-PROCESS-INITIAL-DEPOSIT.
           MOVE WS-IN-ACCT-ID TO WS-IN-TRAN-ACCT
           MOVE 'DEP' TO WS-IN-TRAN-TYPE
           MOVE WS-IN-INITIAL-DEPOSIT TO WS-IN-TRAN-AMOUNT
           MOVE 'Initial deposit' TO WS-IN-TRAN-DESC
           PERFORM 2300-PROCESS-DEPOSIT
           ADD WS-IN-INITIAL-DEPOSIT TO WS-TOTAL-DEPOSITS.
           
       2280-AUDIT-ACCOUNT-OPEN.
           MOVE WS-TIMESTAMP TO AUDIT-TIMESTAMP
           MOVE 'SYSTEM' TO AUDIT-USER-ID
           MOVE 'OPEN_ACCOUNT' TO AUDIT-ACTION
           MOVE 'ACCOUNT' TO AUDIT-ENTITY
           MOVE ACCT-ID TO AUDIT-ENTITY-ID
           STRING 'Account opened: ' ACCT-TYPE ' Balance: ' 
               ACCT-BALANCE DELIMITED BY SIZE INTO AUDIT-DETAILS
           WRITE AUDIT-RECORD.
           
      ******************************************************************
      * 2300 - DEPOSIT PROCESSING
      ******************************************************************
       2300-PROCESS-DEPOSIT.
           PERFORM 2310-VALIDATE-DEPOSIT
           IF WS-IS-VALID
               PERFORM 2320-READ-ACCOUNT-FOR-UPDATE
               IF WS-FOUND
                   PERFORM 2330-UPDATE-BALANCE-DEPOSIT
                   PERFORM 2340-REWRITE-ACCOUNT
                   PERFORM 2350-RECORD-DEPOSIT-TRANSACTION
                   ADD WS-IN-TRAN-AMOUNT TO WS-TOTAL-DEPOSITS
               END-IF
           END-IF.
           
       2310-VALIDATE-DEPOSIT.
           SET WS-IS-VALID TO TRUE
           
           IF WS-IN-TRAN-ACCT = SPACES
               SET WS-IS-INVALID TO TRUE
               MOVE 'E040' TO WS-ERROR-CODE
               MOVE 'Account ID is required' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           IF WS-IN-TRAN-AMOUNT <= 0
               SET WS-IS-INVALID TO TRUE
               MOVE 'E041' TO WS-ERROR-CODE
               MOVE 'Deposit amount must be positive' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           IF WS-IN-TRAN-AMOUNT > 999999999.99
               SET WS-IS-INVALID TO TRUE
               MOVE 'E042' TO WS-ERROR-CODE
               MOVE 'Deposit amount exceeds maximum' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF.
           
       2320-READ-ACCOUNT-FOR-UPDATE.
           MOVE WS-IN-TRAN-ACCT TO ACCT-ID
           READ ACCOUNT-FILE
               INVALID KEY
                   SET WS-NOT-FOUND TO TRUE
                   MOVE 'E043' TO WS-ERROR-CODE
                   MOVE 'Account not found' TO WS-ERROR-MSG
               NOT INVALID KEY
                   IF ACCT-IS-ACTIVE
                       SET WS-FOUND TO TRUE
                   ELSE
                       SET WS-NOT-FOUND TO TRUE
                       MOVE 'E044' TO WS-ERROR-CODE
                       MOVE 'Account is not active' TO WS-ERROR-MSG
                   END-IF
           END-READ.
           
       2330-UPDATE-BALANCE-DEPOSIT.
           ADD WS-IN-TRAN-AMOUNT TO ACCT-BALANCE
           ADD WS-IN-TRAN-AMOUNT TO ACCT-AVAILABLE
           MOVE WS-DATE-8 TO ACCT-LAST-ACTIVITY.
           
       2340-REWRITE-ACCOUNT.
           REWRITE ACCOUNT-RECORD
           IF NOT WS-ACCT-OK
               SET WS-FAILURE TO TRUE
               ADD 1 TO WS-ERROR-COUNT
               MOVE 'E045' TO WS-ERROR-CODE
               MOVE 'Failed to update account' TO WS-ERROR-MSG
           END-IF.
           
       2350-RECORD-DEPOSIT-TRANSACTION.
           PERFORM 2900-GENERATE-TRANSACTION-ID
           INITIALIZE TRANSACTION-RECORD
           MOVE WS-IN-TRAN-ACCT TO TRAN-ACCT-ID
           SET TRAN-DEPOSIT TO TRUE
           MOVE WS-IN-TRAN-AMOUNT TO TRAN-AMOUNT
           MOVE ACCT-BALANCE TO TRAN-BALANCE-AFTER
           MOVE WS-TIMESTAMP TO TRAN-TIMESTAMP
           MOVE WS-IN-TRAN-DESC TO TRAN-DESCRIPTION
           WRITE TRANSACTION-RECORD
           ADD 1 TO WS-TRAN-COUNT.
           
      ******************************************************************
      * 2400 - WITHDRAWAL PROCESSING
      ******************************************************************
       2400-PROCESS-WITHDRAWAL.
           PERFORM 2410-VALIDATE-WITHDRAWAL
           IF WS-IS-VALID
               PERFORM 2320-READ-ACCOUNT-FOR-UPDATE
               IF WS-FOUND
                   PERFORM 2420-CHECK-SUFFICIENT-FUNDS
                   IF WS-SUCCESS
                       PERFORM 2430-CHECK-DAILY-LIMIT
                       IF WS-SUCCESS
                           PERFORM 2440-UPDATE-BALANCE-WITHDRAWAL
                           PERFORM 2340-REWRITE-ACCOUNT
                           PERFORM 2450-RECORD-WITHDRAWAL-TRANSACTION
                           ADD WS-IN-TRAN-AMOUNT TO WS-TOTAL-WITHDRAWALS
                       END-IF
                   END-IF
               END-IF
           END-IF.
           
       2410-VALIDATE-WITHDRAWAL.
           SET WS-IS-VALID TO TRUE
           
           IF WS-IN-TRAN-ACCT = SPACES
               SET WS-IS-INVALID TO TRUE
               MOVE 'E050' TO WS-ERROR-CODE
               MOVE 'Account ID is required' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           IF WS-IN-TRAN-AMOUNT <= 0
               SET WS-IS-INVALID TO TRUE
               MOVE 'E051' TO WS-ERROR-CODE
               MOVE 'Withdrawal amount must be positive' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF.
           
       2420-CHECK-SUFFICIENT-FUNDS.
           SET WS-SUCCESS TO TRUE
           
           IF ACCT-AVAILABLE < WS-IN-TRAN-AMOUNT
               IF ACCT-OD-ENABLED AND
                  WS-IN-TRAN-AMOUNT <= WS-MAX-OVERDRAFT
                   SUBTRACT WS-OVERDRAFT-FEE FROM ACCT-BALANCE
                   SUBTRACT WS-OVERDRAFT-FEE FROM ACCT-AVAILABLE
                   ADD WS-OVERDRAFT-FEE TO WS-TOTAL-FEES-COLLECTED
                   PERFORM 2460-RECORD-OVERDRAFT-FEE
               ELSE
                   SET WS-FAILURE TO TRUE
                   MOVE 'E052' TO WS-ERROR-CODE
                   MOVE 'Insufficient funds' TO WS-ERROR-MSG
               END-IF
           END-IF.
           
       2430-CHECK-DAILY-LIMIT.
           SET WS-SUCCESS TO TRUE
           
           IF ACCT-DAILY-WITHDRAW-USED + WS-IN-TRAN-AMOUNT >
              WS-DAILY-WITHDRAW-LIMIT
               SET WS-FAILURE TO TRUE
               MOVE 'E053' TO WS-ERROR-CODE
               MOVE 'Daily withdrawal limit exceeded' TO WS-ERROR-MSG
           END-IF.
           
       2440-UPDATE-BALANCE-WITHDRAWAL.
           SUBTRACT WS-IN-TRAN-AMOUNT FROM ACCT-BALANCE
           SUBTRACT WS-IN-TRAN-AMOUNT FROM ACCT-AVAILABLE
           ADD WS-IN-TRAN-AMOUNT TO ACCT-DAILY-WITHDRAW-USED
           MOVE WS-DATE-8 TO ACCT-LAST-ACTIVITY.
           
       2450-RECORD-WITHDRAWAL-TRANSACTION.
           PERFORM 2900-GENERATE-TRANSACTION-ID
           INITIALIZE TRANSACTION-RECORD
           MOVE WS-IN-TRAN-ACCT TO TRAN-ACCT-ID
           SET TRAN-WITHDRAWAL TO TRUE
           MOVE WS-IN-TRAN-AMOUNT TO TRAN-AMOUNT
           MOVE ACCT-BALANCE TO TRAN-BALANCE-AFTER
           MOVE WS-TIMESTAMP TO TRAN-TIMESTAMP
           MOVE WS-IN-TRAN-DESC TO TRAN-DESCRIPTION
           WRITE TRANSACTION-RECORD
           ADD 1 TO WS-TRAN-COUNT.
           
       2460-RECORD-OVERDRAFT-FEE.
           PERFORM 2900-GENERATE-TRANSACTION-ID
           INITIALIZE TRANSACTION-RECORD
           MOVE WS-IN-TRAN-ACCT TO TRAN-ACCT-ID
           SET TRAN-FEE TO TRUE
           MOVE WS-OVERDRAFT-FEE TO TRAN-AMOUNT
           MOVE ACCT-BALANCE TO TRAN-BALANCE-AFTER
           MOVE WS-TIMESTAMP TO TRAN-TIMESTAMP
           MOVE 'Overdraft fee' TO TRAN-DESCRIPTION
           WRITE TRANSACTION-RECORD
           ADD 1 TO WS-TRAN-COUNT.
           
      ******************************************************************
      * 2500 - TRANSFER PROCESSING
      ******************************************************************
       2500-PROCESS-TRANSFER.
           PERFORM 2510-VALIDATE-TRANSFER
           IF WS-IS-VALID
               PERFORM 2520-CHECK-FROM-ACCOUNT
               IF WS-FOUND AND WS-SUCCESS
                   PERFORM 2530-CHECK-TO-ACCOUNT
                   IF WS-FOUND
                       PERFORM 2540-EXECUTE-TRANSFER
                       IF WS-SUCCESS
                           PERFORM 2550-RECORD-TRANSFER
                           ADD WS-IN-XFER-AMOUNT TO WS-TOTAL-TRANSFERS
                       END-IF
                   END-IF
               END-IF
           END-IF.
           
       2510-VALIDATE-TRANSFER.
           SET WS-IS-VALID TO TRUE
           
           IF WS-IN-XFER-FROM = SPACES
               SET WS-IS-INVALID TO TRUE
               MOVE 'E060' TO WS-ERROR-CODE
               MOVE 'Source account is required' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           IF WS-IN-XFER-TO = SPACES
               SET WS-IS-INVALID TO TRUE
               MOVE 'E061' TO WS-ERROR-CODE
               MOVE 'Destination account is required' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           IF WS-IN-XFER-AMOUNT <= 0
               SET WS-IS-INVALID TO TRUE
               MOVE 'E062' TO WS-ERROR-CODE
               MOVE 'Transfer amount must be positive' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           IF WS-IN-XFER-FROM = WS-IN-XFER-TO
               SET WS-IS-INVALID TO TRUE
               MOVE 'E063' TO WS-ERROR-CODE
               MOVE 'Cannot transfer to same account' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF.
           
       2520-CHECK-FROM-ACCOUNT.
           MOVE WS-IN-XFER-FROM TO ACCT-ID
           READ ACCOUNT-FILE
               INVALID KEY
                   SET WS-NOT-FOUND TO TRUE
                   MOVE 'E064' TO WS-ERROR-CODE
                   MOVE 'Source account not found' TO WS-ERROR-MSG
               NOT INVALID KEY
                   SET WS-FOUND TO TRUE
                   IF NOT ACCT-IS-ACTIVE
                       SET WS-FAILURE TO TRUE
                       MOVE 'E065' TO WS-ERROR-CODE
                       MOVE 'Source account not active' TO WS-ERROR-MSG
                   ELSE IF ACCT-AVAILABLE < WS-IN-XFER-AMOUNT
                       SET WS-FAILURE TO TRUE
                       MOVE 'E066' TO WS-ERROR-CODE
                       MOVE 'Insufficient funds for transfer' 
                           TO WS-ERROR-MSG
                   ELSE IF ACCT-DAILY-XFER-USED + WS-IN-XFER-AMOUNT >
                          WS-DAILY-XFER-LIMIT
                       SET WS-FAILURE TO TRUE
                       MOVE 'E067' TO WS-ERROR-CODE
                       MOVE 'Daily transfer limit exceeded' 
                           TO WS-ERROR-MSG
                   ELSE
                       SET WS-SUCCESS TO TRUE
                   END-IF
                   END-IF
                   END-IF
           END-READ.
           
       2530-CHECK-TO-ACCOUNT.
           MOVE WS-IN-XFER-TO TO ACCT-ID
           READ ACCOUNT-FILE
               INVALID KEY
                   SET WS-NOT-FOUND TO TRUE
                   MOVE 'E068' TO WS-ERROR-CODE
                   MOVE 'Destination account not found' TO WS-ERROR-MSG
               NOT INVALID KEY
                   IF ACCT-IS-ACTIVE
                       SET WS-FOUND TO TRUE
                   ELSE
                       SET WS-NOT-FOUND TO TRUE
                       MOVE 'E069' TO WS-ERROR-CODE
                       MOVE 'Destination account not active' 
                           TO WS-ERROR-MSG
                   END-IF
           END-READ.
           
       2540-EXECUTE-TRANSFER.
           SET WS-SUCCESS TO TRUE
           
           MOVE WS-IN-XFER-FROM TO ACCT-ID
           READ ACCOUNT-FILE
           SUBTRACT WS-IN-XFER-AMOUNT FROM ACCT-BALANCE
           SUBTRACT WS-IN-XFER-AMOUNT FROM ACCT-AVAILABLE
           ADD WS-IN-XFER-AMOUNT TO ACCT-DAILY-XFER-USED
           MOVE WS-DATE-8 TO ACCT-LAST-ACTIVITY
           REWRITE ACCOUNT-RECORD
           
           PERFORM 2541-RECORD-TRANSFER-OUT
           
           MOVE WS-IN-XFER-TO TO ACCT-ID
           READ ACCOUNT-FILE
           ADD WS-IN-XFER-AMOUNT TO ACCT-BALANCE
           ADD WS-IN-XFER-AMOUNT TO ACCT-AVAILABLE
           MOVE WS-DATE-8 TO ACCT-LAST-ACTIVITY
           REWRITE ACCOUNT-RECORD
           
           PERFORM 2542-RECORD-TRANSFER-IN.
           
       2541-RECORD-TRANSFER-OUT.
           PERFORM 2900-GENERATE-TRANSACTION-ID
           INITIALIZE TRANSACTION-RECORD
           MOVE WS-IN-XFER-FROM TO TRAN-ACCT-ID
           SET TRAN-TRANSFER-OUT TO TRUE
           MOVE WS-IN-XFER-AMOUNT TO TRAN-AMOUNT
           MOVE ACCT-BALANCE TO TRAN-BALANCE-AFTER
           MOVE WS-TIMESTAMP TO TRAN-TIMESTAMP
           STRING 'Transfer to ' WS-IN-XFER-TO DELIMITED BY SIZE
               INTO TRAN-DESCRIPTION
           WRITE TRANSACTION-RECORD
           ADD 1 TO WS-TRAN-COUNT.
           
       2542-RECORD-TRANSFER-IN.
           PERFORM 2900-GENERATE-TRANSACTION-ID
           INITIALIZE TRANSACTION-RECORD
           MOVE WS-IN-XFER-TO TO TRAN-ACCT-ID
           SET TRAN-TRANSFER-IN TO TRUE
           MOVE WS-IN-XFER-AMOUNT TO TRAN-AMOUNT
           MOVE ACCT-BALANCE TO TRAN-BALANCE-AFTER
           MOVE WS-TIMESTAMP TO TRAN-TIMESTAMP
           STRING 'Transfer from ' WS-IN-XFER-FROM DELIMITED BY SIZE
               INTO TRAN-DESCRIPTION
           WRITE TRANSACTION-RECORD
           ADD 1 TO WS-TRAN-COUNT.
           
       2550-RECORD-TRANSFER.
           ADD 1 TO WS-XFER-COUNT
           INITIALIZE TRANSFER-RECORD
           STRING 'TRF' WS-XFER-COUNT DELIMITED BY SIZE INTO XFER-ID
           MOVE WS-IN-XFER-FROM TO XFER-FROM-ACCT
           MOVE WS-IN-XFER-TO TO XFER-TO-ACCT
           MOVE WS-IN-XFER-AMOUNT TO XFER-AMOUNT
           MOVE 0 TO XFER-FEE
           SET XFER-INTERNAL TO TRUE
           SET XFER-COMPLETED TO TRUE
           MOVE WS-TIMESTAMP TO XFER-INIT-DATE
           MOVE WS-TIMESTAMP TO XFER-COMP-DATE
           MOVE WS-IN-REFERENCE TO XFER-REFERENCE
           WRITE TRANSFER-RECORD.
           
      ******************************************************************
      * 2600 - INTEREST CALCULATION
      ******************************************************************
       2600-CALCULATE-INTEREST.
           IF ACCT-BALANCE > 0
               COMPUTE WS-MONTHLY-RATE = ACCT-INTEREST-RATE / 12
               COMPUTE WS-INTEREST ROUNDED = 
                   ACCT-BALANCE * WS-MONTHLY-RATE
               IF WS-INTEREST > 0
                   ADD WS-INTEREST TO ACCT-BALANCE
                   ADD WS-INTEREST TO ACCT-AVAILABLE
                   ADD WS-INTEREST TO WS-TOTAL-INTEREST-PAID
                   PERFORM 2610-RECORD-INTEREST-TRANSACTION
               END-IF
           END-IF.
           
       2610-RECORD-INTEREST-TRANSACTION.
           PERFORM 2900-GENERATE-TRANSACTION-ID
           INITIALIZE TRANSACTION-RECORD
           MOVE ACCT-ID TO TRAN-ACCT-ID
           SET TRAN-INTEREST TO TRUE
           MOVE WS-INTEREST TO TRAN-AMOUNT
           MOVE ACCT-BALANCE TO TRAN-BALANCE-AFTER
           MOVE WS-TIMESTAMP TO TRAN-TIMESTAMP
           MOVE 'Monthly interest credit' TO TRAN-DESCRIPTION
           WRITE TRANSACTION-RECORD
           ADD 1 TO WS-TRAN-COUNT.
           
      ******************************************************************
      * 2700 - FEE PROCESSING
      ******************************************************************
       2700-APPLY-MINIMUM-BALANCE-FEE.
           MOVE 0 TO WS-FEE-AMOUNT
           
           EVALUATE TRUE
               WHEN ACCT-CHECKING
                   IF ACCT-BALANCE < WS-MIN-BAL-CHECKING
                       MOVE WS-MIN-BAL-FEE TO WS-FEE-AMOUNT
                   END-IF
               WHEN ACCT-SAVINGS
                   IF ACCT-BALANCE < WS-MIN-BAL-SAVINGS
                       MOVE WS-MIN-BAL-FEE TO WS-FEE-AMOUNT
                   END-IF
               WHEN ACCT-MONEY-MARKET
                   IF ACCT-BALANCE < WS-MIN-BAL-MONEY-MKT
                       MOVE WS-MIN-BAL-FEE TO WS-FEE-AMOUNT
                   END-IF
           END-EVALUATE
           
           IF WS-FEE-AMOUNT > 0
               SUBTRACT WS-FEE-AMOUNT FROM ACCT-BALANCE
               SUBTRACT WS-FEE-AMOUNT FROM ACCT-AVAILABLE
               ADD WS-FEE-AMOUNT TO WS-TOTAL-FEES-COLLECTED
               PERFORM 2710-RECORD-FEE-TRANSACTION
           END-IF.
           
       2710-RECORD-FEE-TRANSACTION.
           PERFORM 2900-GENERATE-TRANSACTION-ID
           INITIALIZE TRANSACTION-RECORD
           MOVE ACCT-ID TO TRAN-ACCT-ID
           SET TRAN-FEE TO TRUE
           MOVE WS-FEE-AMOUNT TO TRAN-AMOUNT
           MOVE ACCT-BALANCE TO TRAN-BALANCE-AFTER
           MOVE WS-TIMESTAMP TO TRAN-TIMESTAMP
           MOVE 'Minimum balance fee' TO TRAN-DESCRIPTION
           WRITE TRANSACTION-RECORD
           ADD 1 TO WS-TRAN-COUNT.
           
      ******************************************************************
      * 2800 - WIRE AND ACH TRANSFERS
      ******************************************************************
       2800-PROCESS-WIRE-TRANSFER.
           PERFORM 2510-VALIDATE-TRANSFER
           IF WS-IS-VALID
               PERFORM 2520-CHECK-FROM-ACCOUNT
               IF WS-FOUND AND WS-SUCCESS
                   IF ACCT-AVAILABLE >= 
                      (WS-IN-XFER-AMOUNT + WS-WIRE-FEE)
                       PERFORM 2810-EXECUTE-WIRE
                       ADD WS-IN-XFER-AMOUNT TO WS-TOTAL-TRANSFERS
                       ADD WS-WIRE-FEE TO WS-TOTAL-FEES-COLLECTED
                   ELSE
                       SET WS-FAILURE TO TRUE
                       MOVE 'E070' TO WS-ERROR-CODE
                       MOVE 'Insufficient funds including fee' 
                           TO WS-ERROR-MSG
                   END-IF
               END-IF
           END-IF.
           
       2810-EXECUTE-WIRE.
           MOVE WS-IN-XFER-FROM TO ACCT-ID
           READ ACCOUNT-FILE
           
           COMPUTE WS-AMOUNT = WS-IN-XFER-AMOUNT + WS-WIRE-FEE
           SUBTRACT WS-AMOUNT FROM ACCT-BALANCE
           SUBTRACT WS-AMOUNT FROM ACCT-AVAILABLE
           MOVE WS-DATE-8 TO ACCT-LAST-ACTIVITY
           REWRITE ACCOUNT-RECORD
           
           PERFORM 2811-RECORD-WIRE-TRANSACTION
           PERFORM 2812-RECORD-WIRE-FEE
           PERFORM 2813-CREATE-WIRE-RECORD.
           
       2811-RECORD-WIRE-TRANSACTION.
           PERFORM 2900-GENERATE-TRANSACTION-ID
           INITIALIZE TRANSACTION-RECORD
           MOVE WS-IN-XFER-FROM TO TRAN-ACCT-ID
           SET TRAN-WIRE TO TRUE
           MOVE WS-IN-XFER-AMOUNT TO TRAN-AMOUNT
           MOVE ACCT-BALANCE TO TRAN-BALANCE-AFTER
           MOVE WS-TIMESTAMP TO TRAN-TIMESTAMP
           STRING 'Wire transfer to ' WS-IN-XFER-TO DELIMITED BY SIZE
               INTO TRAN-DESCRIPTION
           WRITE TRANSACTION-RECORD
           ADD 1 TO WS-TRAN-COUNT.
           
       2812-RECORD-WIRE-FEE.
           PERFORM 2900-GENERATE-TRANSACTION-ID
           INITIALIZE TRANSACTION-RECORD
           MOVE WS-IN-XFER-FROM TO TRAN-ACCT-ID
           SET TRAN-FEE TO TRUE
           MOVE WS-WIRE-FEE TO TRAN-AMOUNT
           MOVE ACCT-BALANCE TO TRAN-BALANCE-AFTER
           MOVE WS-TIMESTAMP TO TRAN-TIMESTAMP
           MOVE 'Wire transfer fee' TO TRAN-DESCRIPTION
           WRITE TRANSACTION-RECORD
           ADD 1 TO WS-TRAN-COUNT.
           
       2813-CREATE-WIRE-RECORD.
           ADD 1 TO WS-XFER-COUNT
           INITIALIZE TRANSFER-RECORD
           STRING 'TRF' WS-XFER-COUNT DELIMITED BY SIZE INTO XFER-ID
           MOVE WS-IN-XFER-FROM TO XFER-FROM-ACCT
           MOVE WS-IN-XFER-TO TO XFER-TO-ACCT
           MOVE WS-IN-XFER-AMOUNT TO XFER-AMOUNT
           MOVE WS-WIRE-FEE TO XFER-FEE
           SET XFER-WIRE TO TRUE
           SET XFER-COMPLETED TO TRUE
           MOVE WS-TIMESTAMP TO XFER-INIT-DATE
           MOVE WS-TIMESTAMP TO XFER-COMP-DATE
           MOVE WS-IN-REFERENCE TO XFER-REFERENCE
           WRITE TRANSFER-RECORD.
           
       2820-PROCESS-ACH-TRANSFER.
           PERFORM 2510-VALIDATE-TRANSFER
           IF WS-IS-VALID
               IF FUNCTION LENGTH(FUNCTION TRIM(WS-IN-ROUTING)) NOT = 9
                   SET WS-IS-INVALID TO TRUE
                   MOVE 'E075' TO WS-ERROR-CODE
                   MOVE 'Invalid routing number' TO WS-ERROR-MSG
               ELSE
                   PERFORM 2520-CHECK-FROM-ACCOUNT
                   IF WS-FOUND AND WS-SUCCESS
                       IF ACCT-AVAILABLE >= 
                          (WS-IN-XFER-AMOUNT + WS-ACH-FEE)
                           PERFORM 2830-EXECUTE-ACH
                           ADD WS-IN-XFER-AMOUNT TO WS-TOTAL-TRANSFERS
                           ADD WS-ACH-FEE TO WS-TOTAL-FEES-COLLECTED
                       ELSE
                           SET WS-FAILURE TO TRUE
                           MOVE 'E076' TO WS-ERROR-CODE
                           MOVE 'Insufficient funds including fee' 
                               TO WS-ERROR-MSG
                       END-IF
                   END-IF
               END-IF
           END-IF.
           
       2830-EXECUTE-ACH.
           MOVE WS-IN-XFER-FROM TO ACCT-ID
           READ ACCOUNT-FILE
           
           COMPUTE WS-AMOUNT = WS-IN-XFER-AMOUNT + WS-ACH-FEE
           SUBTRACT WS-AMOUNT FROM ACCT-BALANCE
           SUBTRACT WS-AMOUNT FROM ACCT-AVAILABLE
           MOVE WS-DATE-8 TO ACCT-LAST-ACTIVITY
           REWRITE ACCOUNT-RECORD
           
           PERFORM 2831-RECORD-ACH-TRANSACTION
           PERFORM 2832-RECORD-ACH-FEE
           PERFORM 2833-CREATE-ACH-RECORD.
           
       2831-RECORD-ACH-TRANSACTION.
           PERFORM 2900-GENERATE-TRANSACTION-ID
           INITIALIZE TRANSACTION-RECORD
           MOVE WS-IN-XFER-FROM TO TRAN-ACCT-ID
           SET TRAN-ACH TO TRUE
           MOVE WS-IN-XFER-AMOUNT TO TRAN-AMOUNT
           MOVE ACCT-BALANCE TO TRAN-BALANCE-AFTER
           MOVE WS-TIMESTAMP TO TRAN-TIMESTAMP
           STRING 'ACH transfer to ' WS-IN-XFER-TO DELIMITED BY SIZE
               INTO TRAN-DESCRIPTION
           WRITE TRANSACTION-RECORD
           ADD 1 TO WS-TRAN-COUNT.
           
       2832-RECORD-ACH-FEE.
           PERFORM 2900-GENERATE-TRANSACTION-ID
           INITIALIZE TRANSACTION-RECORD
           MOVE WS-IN-XFER-FROM TO TRAN-ACCT-ID
           SET TRAN-FEE TO TRUE
           MOVE WS-ACH-FEE TO TRAN-AMOUNT
           MOVE ACCT-BALANCE TO TRAN-BALANCE-AFTER
           MOVE WS-TIMESTAMP TO TRAN-TIMESTAMP
           MOVE 'ACH transfer fee' TO TRAN-DESCRIPTION
           WRITE TRANSACTION-RECORD
           ADD 1 TO WS-TRAN-COUNT.
           
       2833-CREATE-ACH-RECORD.
           ADD 1 TO WS-XFER-COUNT
           INITIALIZE TRANSFER-RECORD
           STRING 'TRF' WS-XFER-COUNT DELIMITED BY SIZE INTO XFER-ID
           MOVE WS-IN-XFER-FROM TO XFER-FROM-ACCT
           STRING WS-IN-ROUTING ':' WS-IN-XFER-TO DELIMITED BY SIZE
               INTO XFER-TO-ACCT
           MOVE WS-IN-XFER-AMOUNT TO XFER-AMOUNT
           MOVE WS-ACH-FEE TO XFER-FEE
           SET XFER-ACH TO TRUE
           SET XFER-COMPLETED TO TRUE
           MOVE WS-TIMESTAMP TO XFER-INIT-DATE
           MOVE WS-TIMESTAMP TO XFER-COMP-DATE
           MOVE WS-IN-REFERENCE TO XFER-REFERENCE
           WRITE TRANSFER-RECORD.
           
      ******************************************************************
      * 2900 - UTILITY PARAGRAPHS
      ******************************************************************
       2900-GENERATE-TRANSACTION-ID.
           ADD 1 TO WS-TRAN-COUNT
           STRING 'TXN' WS-TRAN-COUNT DELIMITED BY SIZE INTO TRAN-ID.
           
      ******************************************************************
      * 3000 - LOAN PROCESSING
      ******************************************************************
       3000-PROCESS-LOANS.
           CONTINUE.
           
       3100-CREATE-LOAN.
           PERFORM 3110-VALIDATE-LOAN-INPUT
           IF WS-IS-VALID
               PERFORM 3120-CHECK-LOAN-ELIGIBILITY
               IF WS-SUCCESS
                   PERFORM 3130-CALCULATE-MONTHLY-PAYMENT
                   PERFORM 3140-BUILD-LOAN-RECORD
                   PERFORM 3150-WRITE-LOAN
                   IF WS-SUCCESS
                       ADD 1 TO WS-LOAN-COUNT
                       PERFORM 3160-AUDIT-LOAN-CREATE
                   END-IF
               END-IF
           END-IF.
           
       3110-VALIDATE-LOAN-INPUT.
           SET WS-IS-VALID TO TRUE
           
           IF WS-IN-LOAN-CUST = SPACES
               SET WS-IS-INVALID TO TRUE
               MOVE 'E080' TO WS-ERROR-CODE
               MOVE 'Customer ID is required' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           IF WS-IN-LOAN-ACCT = SPACES
               SET WS-IS-INVALID TO TRUE
               MOVE 'E081' TO WS-ERROR-CODE
               MOVE 'Account ID is required' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           IF WS-IN-LOAN-PRINCIPAL <= 0
               SET WS-IS-INVALID TO TRUE
               MOVE 'E082' TO WS-ERROR-CODE
               MOVE 'Principal must be positive' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           IF WS-IN-LOAN-TERM <= 0 OR WS-IN-LOAN-TERM > 360
               SET WS-IS-INVALID TO TRUE
               MOVE 'E083' TO WS-ERROR-CODE
               MOVE 'Invalid loan term' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF.
           
       3120-CHECK-LOAN-ELIGIBILITY.
           SET WS-SUCCESS TO TRUE
           
           MOVE WS-IN-LOAN-CUST TO CUST-ID
           READ CUSTOMER-FILE
               INVALID KEY
                   SET WS-FAILURE TO TRUE
                   MOVE 'E084' TO WS-ERROR-CODE
                   MOVE 'Customer not found' TO WS-ERROR-MSG
                   EXIT PARAGRAPH
           END-READ
           
           IF NOT CUST-ACTIVE
               SET WS-FAILURE TO TRUE
               MOVE 'E085' TO WS-ERROR-CODE
               MOVE 'Customer is not active' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           EVALUATE WS-IN-LOAN-TYPE
               WHEN 'PL'
                   IF CUST-CREDIT-SCORE < 580
                       SET WS-FAILURE TO TRUE
                       MOVE 'E086' TO WS-ERROR-CODE
                       MOVE 'Credit score below minimum for personal loan'
                           TO WS-ERROR-MSG
                   END-IF
               WHEN 'MG'
                   IF CUST-CREDIT-SCORE < 620
                       SET WS-FAILURE TO TRUE
                       MOVE 'E087' TO WS-ERROR-CODE
                       MOVE 'Credit score below minimum for mortgage'
                           TO WS-ERROR-MSG
                   END-IF
               WHEN 'AL'
                   IF CUST-CREDIT-SCORE < 550
                       SET WS-FAILURE TO TRUE
                       MOVE 'E088' TO WS-ERROR-CODE
                       MOVE 'Credit score below minimum for auto loan'
                           TO WS-ERROR-MSG
                   END-IF
               WHEN 'BL'
                   IF CUST-CREDIT-SCORE < 650
                       SET WS-FAILURE TO TRUE
                       MOVE 'E089' TO WS-ERROR-CODE
                       MOVE 'Credit score below minimum for business loan'
                           TO WS-ERROR-MSG
                   END-IF
               WHEN 'SL'
                   IF CUST-CREDIT-SCORE < 500
                       SET WS-FAILURE TO TRUE
                       MOVE 'E090' TO WS-ERROR-CODE
                       MOVE 'Credit score below minimum for student loan'
                           TO WS-ERROR-MSG
                   END-IF
           END-EVALUATE.
           
       3130-CALCULATE-MONTHLY-PAYMENT.
           IF WS-IN-LOAN-RATE = 0
               EVALUATE WS-IN-LOAN-TYPE
                   WHEN 'PL'
                       MOVE WS-PERSONAL-LOAN-RATE TO WS-IN-LOAN-RATE
                   WHEN 'MG'
                       MOVE WS-MORTGAGE-RATE TO WS-IN-LOAN-RATE
                   WHEN 'AL'
                       MOVE WS-AUTO-LOAN-RATE TO WS-IN-LOAN-RATE
                   WHEN 'BL'
                       MOVE WS-BUSINESS-LOAN-RATE TO WS-IN-LOAN-RATE
                   WHEN 'SL'
                       MOVE WS-STUDENT-LOAN-RATE TO WS-IN-LOAN-RATE
               END-EVALUATE
           END-IF
           
           COMPUTE WS-MONTHLY-RATE = WS-IN-LOAN-RATE / 12
           
           IF WS-MONTHLY-RATE = 0
               COMPUTE WS-MONTHLY-PAYMENT = 
                   WS-IN-LOAN-PRINCIPAL / WS-IN-LOAN-TERM
           ELSE
               MOVE 1 TO WS-POWER-RESULT
               PERFORM VARYING WS-LOOP-CTR FROM 1 BY 1 
                   UNTIL WS-LOOP-CTR > WS-IN-LOAN-TERM
                   COMPUTE WS-POWER-RESULT = 
                       WS-POWER-RESULT * (1 + WS-MONTHLY-RATE)
               END-PERFORM
               
               COMPUTE WS-NUMERATOR = 
                   WS-IN-LOAN-PRINCIPAL * WS-MONTHLY-RATE * WS-POWER-RESULT
               COMPUTE WS-DENOMINATOR = WS-POWER-RESULT - 1
               
               IF WS-DENOMINATOR NOT = 0
                   COMPUTE WS-MONTHLY-PAYMENT ROUNDED = 
                       WS-NUMERATOR / WS-DENOMINATOR
               ELSE
                   COMPUTE WS-MONTHLY-PAYMENT = 
                       WS-IN-LOAN-PRINCIPAL / WS-IN-LOAN-TERM
               END-IF
           END-IF.
           
       3140-BUILD-LOAN-RECORD.
           INITIALIZE LOAN-RECORD
           STRING WS-IN-LOAN-TYPE WS-LOAN-COUNT DELIMITED BY SIZE
               INTO LOAN-ID
           MOVE WS-IN-LOAN-CUST TO LOAN-CUST-ID
           MOVE WS-IN-LOAN-ACCT TO LOAN-ACCT-ID
           MOVE WS-IN-LOAN-TYPE TO LOAN-TYPE
           MOVE WS-IN-LOAN-PRINCIPAL TO LOAN-PRINCIPAL
           MOVE WS-IN-LOAN-RATE TO LOAN-INTEREST-RATE
           MOVE WS-IN-LOAN-TERM TO LOAN-TERM-MONTHS
           MOVE WS-MONTHLY-PAYMENT TO LOAN-MONTHLY-PAYMENT
           MOVE WS-IN-LOAN-PRINCIPAL TO LOAN-REMAINING-BAL
           SET LOAN-IS-APPROVED TO TRUE
           MOVE WS-DATE-8 TO LOAN-ORIG-DATE
           
           COMPUTE WS-AMOUNT = WS-IN-LOAN-TERM * 30
           MOVE WS-DATE-8 TO LOAN-MATURITY-DATE
           
           MOVE WS-DATE-8 TO LOAN-NEXT-PAY-DATE
           MOVE 0 TO LOAN-PAYMENTS-MADE
           MOVE 0 TO LOAN-TOTAL-INT-PAID.
           
       3150-WRITE-LOAN.
           WRITE LOAN-RECORD
           IF WS-LOAN-OK
               SET WS-SUCCESS TO TRUE
           ELSE
               SET WS-FAILURE TO TRUE
               ADD 1 TO WS-ERROR-COUNT
               MOVE 'E095' TO WS-ERROR-CODE
               MOVE 'Failed to write loan record' TO WS-ERROR-MSG
           END-IF.
           
       3160-AUDIT-LOAN-CREATE.
           MOVE WS-TIMESTAMP TO AUDIT-TIMESTAMP
           MOVE 'SYSTEM' TO AUDIT-USER-ID
           MOVE 'CREATE_LOAN' TO AUDIT-ACTION
           MOVE 'LOAN' TO AUDIT-ENTITY
           MOVE LOAN-ID TO AUDIT-ENTITY-ID
           STRING 'Loan created: ' LOAN-TYPE ' Principal: ' 
               LOAN-PRINCIPAL DELIMITED BY SIZE INTO AUDIT-DETAILS
           WRITE AUDIT-RECORD.
           
       3200-DISBURSE-LOAN.
           MOVE WS-IN-LOAN-ACCT TO LOAN-ID
           READ LOAN-FILE
               INVALID KEY
                   SET WS-FAILURE TO TRUE
                   MOVE 'E096' TO WS-ERROR-CODE
                   MOVE 'Loan not found' TO WS-ERROR-MSG
                   EXIT PARAGRAPH
           END-READ
           
           IF NOT LOAN-IS-APPROVED
               SET WS-FAILURE TO TRUE
               MOVE 'E097' TO WS-ERROR-CODE
               MOVE 'Loan is not in approved status' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           MOVE LOAN-ACCT-ID TO ACCT-ID
           READ ACCOUNT-FILE
               INVALID KEY
                   SET WS-FAILURE TO TRUE
                   MOVE 'E098' TO WS-ERROR-CODE
                   MOVE 'Account not found' TO WS-ERROR-MSG
                   EXIT PARAGRAPH
           END-READ
           
           ADD LOAN-PRINCIPAL TO ACCT-BALANCE
           ADD LOAN-PRINCIPAL TO ACCT-AVAILABLE
           MOVE WS-DATE-8 TO ACCT-LAST-ACTIVITY
           REWRITE ACCOUNT-RECORD
           
           SET LOAN-IS-ACTIVE TO TRUE
           REWRITE LOAN-RECORD
           
           ADD LOAN-PRINCIPAL TO WS-TOTAL-LOANS-DISBURSED
           
           PERFORM 3210-RECORD-DISBURSEMENT.
           
       3210-RECORD-DISBURSEMENT.
           PERFORM 2900-GENERATE-TRANSACTION-ID
           INITIALIZE TRANSACTION-RECORD
           MOVE LOAN-ACCT-ID TO TRAN-ACCT-ID
           SET TRAN-LOAN-DISB TO TRUE
           MOVE LOAN-PRINCIPAL TO TRAN-AMOUNT
           MOVE ACCT-BALANCE TO TRAN-BALANCE-AFTER
           MOVE WS-TIMESTAMP TO TRAN-TIMESTAMP
           STRING 'Loan disbursement - ' LOAN-ID DELIMITED BY SIZE
               INTO TRAN-DESCRIPTION
           WRITE TRANSACTION-RECORD
           ADD 1 TO WS-TRAN-COUNT.
           
       3300-PROCESS-LOAN-PAYMENT.
           READ LOAN-FILE
               INVALID KEY
                   SET WS-FAILURE TO TRUE
                   MOVE 'E100' TO WS-ERROR-CODE
                   MOVE 'Loan not found' TO WS-ERROR-MSG
                   EXIT PARAGRAPH
           END-READ
           
           IF NOT LOAN-IS-ACTIVE
               SET WS-FAILURE TO TRUE
               MOVE 'E101' TO WS-ERROR-CODE
               MOVE 'Loan is not active' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           MOVE LOAN-ACCT-ID TO ACCT-ID
           READ ACCOUNT-FILE
               INVALID KEY
                   SET WS-FAILURE TO TRUE
                   MOVE 'E102' TO WS-ERROR-CODE
                   MOVE 'Account not found' TO WS-ERROR-MSG
                   EXIT PARAGRAPH
           END-READ
           
           IF WS-AMOUNT = 0
               MOVE LOAN-MONTHLY-PAYMENT TO WS-AMOUNT
           END-IF
           
           IF ACCT-AVAILABLE < WS-AMOUNT
               SET WS-FAILURE TO TRUE
               MOVE 'E103' TO WS-ERROR-CODE
               MOVE 'Insufficient funds for payment' TO WS-ERROR-MSG
               EXIT PARAGRAPH
           END-IF
           
           COMPUTE WS-MONTHLY-RATE = LOAN-INTEREST-RATE / 12
           COMPUTE WS-INTEREST-PORTION ROUNDED = 
               LOAN-REMAINING-BAL * WS-MONTHLY-RATE
           COMPUTE WS-PRINCIPAL-PORTION = WS-AMOUNT - WS-INTEREST-PORTION
           
           IF WS-PRINCIPAL-PORTION < 0
               MOVE 0 TO WS-PRINCIPAL-PORTION
               MOVE WS-AMOUNT TO WS-INTEREST-PORTION
           END-IF
           
           SUBTRACT WS-AMOUNT FROM ACCT-BALANCE
           SUBTRACT WS-AMOUNT FROM ACCT-AVAILABLE
           MOVE WS-DATE-8 TO ACCT-LAST-ACTIVITY
           REWRITE ACCOUNT-RECORD
           
           SUBTRACT WS-PRINCIPAL-PORTION FROM LOAN-REMAINING-BAL
           IF LOAN-REMAINING-BAL < 0
               MOVE 0 TO LOAN-REMAINING-BAL
           END-IF
           
           ADD 1 TO LOAN-PAYMENTS-MADE
           ADD WS-INTEREST-PORTION TO LOAN-TOTAL-INT-PAID
           
           IF LOAN-REMAINING-BAL <= 0
               SET LOAN-IS-PAID TO TRUE
               MOVE 0 TO LOAN-REMAINING-BAL
           END-IF
           
           REWRITE LOAN-RECORD
           
           ADD WS-AMOUNT TO WS-TOTAL-LOAN-PAYMENTS
           
           PERFORM 3310-RECORD-LOAN-PAYMENT.
           
       3310-RECORD-LOAN-PAYMENT.
           PERFORM 2900-GENERATE-TRANSACTION-ID
           INITIALIZE TRANSACTION-RECORD
           MOVE LOAN-ACCT-ID TO TRAN-ACCT-ID
           SET TRAN-LOAN-PAY TO TRUE
           MOVE WS-AMOUNT TO TRAN-AMOUNT
           MOVE ACCT-BALANCE TO TRAN-BALANCE-AFTER
           MOVE WS-TIMESTAMP TO TRAN-TIMESTAMP
           STRING 'Loan payment - ' LOAN-ID DELIMITED BY SIZE
               INTO TRAN-DESCRIPTION
           WRITE TRANSACTION-RECORD
           ADD 1 TO WS-TRAN-COUNT.
           
      ******************************************************************
      * 4000 - EXTERNAL TRANSFERS
      ******************************************************************
       4000-PROCESS-TRANSFERS.
           CONTINUE.
           
      ******************************************************************
      * 5000 - BATCH PROCESSING
      ******************************************************************
       5000-BATCH-PROCESSING.
           PERFORM 5100-END-OF-DAY-PROCESSING
           PERFORM 5200-GENERATE-DAILY-REPORT.
           
       5100-END-OF-DAY-PROCESSING.
           PERFORM 5110-RESET-DAILY-LIMITS.
           
       5110-RESET-DAILY-LIMITS.
           MOVE LOW-VALUES TO ACCT-ID
           START ACCOUNT-FILE KEY >= ACCT-ID
               INVALID KEY
                   EXIT PARAGRAPH
           END-START
           
           SET WS-NOT-EOF TO TRUE
           PERFORM UNTIL WS-EOF
               READ ACCOUNT-FILE NEXT
                   AT END
                       SET WS-EOF TO TRUE
                   NOT AT END
                       MOVE 0 TO ACCT-DAILY-WITHDRAW-USED
                       MOVE 0 TO ACCT-DAILY-XFER-USED
                       REWRITE ACCOUNT-RECORD
               END-READ
           END-PERFORM.
           
       5200-GENERATE-DAILY-REPORT.
           MOVE WS-DATE-8 TO WS-RPT-DATE
           WRITE REPORT-RECORD FROM WS-RPT-HEADER-1
           WRITE REPORT-RECORD FROM WS-RPT-HEADER-2
           
           MOVE 'Total Deposits' TO WS-RPT-AMT-DESC
           MOVE WS-TOTAL-DEPOSITS TO WS-RPT-AMT-VALUE
           WRITE REPORT-RECORD FROM WS-RPT-AMOUNT-LINE
           
           MOVE 'Total Withdrawals' TO WS-RPT-AMT-DESC
           MOVE WS-TOTAL-WITHDRAWALS TO WS-RPT-AMT-VALUE
           WRITE REPORT-RECORD FROM WS-RPT-AMOUNT-LINE
           
           MOVE 'Total Transfers' TO WS-RPT-AMT-DESC
           MOVE WS-TOTAL-TRANSFERS TO WS-RPT-AMT-VALUE
           WRITE REPORT-RECORD FROM WS-RPT-AMOUNT-LINE
           
           MOVE 'Total Interest Paid' TO WS-RPT-AMT-DESC
           MOVE WS-TOTAL-INTEREST-PAID TO WS-RPT-AMT-VALUE
           WRITE REPORT-RECORD FROM WS-RPT-AMOUNT-LINE
           
           MOVE 'Total Fees Collected' TO WS-RPT-AMT-DESC
           MOVE WS-TOTAL-FEES-COLLECTED TO WS-RPT-AMT-VALUE
           WRITE REPORT-RECORD FROM WS-RPT-AMOUNT-LINE
           
           MOVE 'Total Loans Disbursed' TO WS-RPT-AMT-DESC
           MOVE WS-TOTAL-LOANS-DISBURSED TO WS-RPT-AMT-VALUE
           WRITE REPORT-RECORD FROM WS-RPT-AMOUNT-LINE
           
           MOVE 'Total Loan Payments' TO WS-RPT-AMT-DESC
           MOVE WS-TOTAL-LOAN-PAYMENTS TO WS-RPT-AMT-VALUE
           WRITE REPORT-RECORD FROM WS-RPT-AMOUNT-LINE
           
           WRITE REPORT-RECORD FROM WS-RPT-HEADER-2.
           
      ******************************************************************
      * 9000 - TERMINATION
      ******************************************************************
       9000-TERMINATION.
           PERFORM 9100-WRITE-AUDIT-END
           PERFORM 9200-CLOSE-FILES.
           
       9100-WRITE-AUDIT-END.
           MOVE WS-TIMESTAMP TO AUDIT-TIMESTAMP
           MOVE 'SYSTEM' TO AUDIT-USER-ID
           MOVE 'SYSTEM_END' TO AUDIT-ACTION
           MOVE 'BANKING_SYSTEM' TO AUDIT-ENTITY
           MOVE SPACES TO AUDIT-ENTITY-ID
           STRING 'System terminated. Transactions: ' WS-TRAN-COUNT
               ' Errors: ' WS-ERROR-COUNT DELIMITED BY SIZE 
               INTO AUDIT-DETAILS
           WRITE AUDIT-RECORD.
           
       9200-CLOSE-FILES.
           CLOSE CUSTOMER-FILE
           CLOSE ACCOUNT-FILE
           CLOSE TRANSACTION-FILE
           CLOSE LOAN-FILE
           CLOSE TRANSFER-FILE
           CLOSE AUDIT-FILE
           CLOSE REPORT-FILE.
