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
