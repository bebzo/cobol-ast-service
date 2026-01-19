       IDENTIFICATION DIVISION.
       PROGRAM-ID. ULTRA-INSECURE-BANKING.
       AUTHOR. VULNERABILITY-TESTER.
       DATE-WRITTEN. 2024-01-15.
      *=============================================================
      * ULTRA INSECURE TEST FILE - Maximum Vulnerabilities
      * For testing security hardening module
      *=============================================================
       
       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       REPOSITORY.
           FUNCTION ALL INTRINSIC.
       
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT CUSTOMER-FILE ASSIGN TO 'CUST.DAT'
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS CUST-ID.
           SELECT TRANSACTION-FILE ASSIGN TO 'TRANS.DAT'.
           SELECT AUDIT-LOG ASSIGN TO 'AUDIT.LOG'.
           SELECT ERROR-FILE ASSIGN TO 'ERRORS.DAT'.
       
       DATA DIVISION.
       FILE SECTION.
       FD CUSTOMER-FILE.
       01 CUSTOMER-REC.
           05 CUST-ID                  PIC X(10).
           05 CUST-FULL-NAME           PIC X(50).
           05 CUST-SSN                 PIC 9(9).
           05 CUST-SSN-FORMATTED       PIC X(11).
           05 CUST-DATE-OF-BIRTH       PIC 9(8).
           05 CUST-TAX-ID              PIC X(11).
           05 CUST-DRIVERS-LICENSE     PIC X(20).
           05 CUST-PASSPORT-NUM        PIC X(15).
           05 CUST-CREDIT-CARD-NUM     PIC X(16).
           05 CUST-CARD-CVV            PIC 9(4).
           05 CUST-CARD-EXPIRY         PIC X(5).
           05 CUST-BANK-ACCOUNT        PIC X(20).
           05 CUST-ROUTING-NUM         PIC 9(9).
           05 CUST-PIN-CODE            PIC 9(6).
           05 CUST-PHONE-NUMBER        PIC X(15).
           05 CUST-EMAIL-ADDRESS       PIC X(100).
           05 CUST-HOME-ADDRESS        PIC X(200).
           05 CUST-MEDICAL-ID          PIC X(20).
           05 CUST-BIOMETRIC-DATA      PIC X(500).
       
       WORKING-STORAGE SECTION.
      *=============================================================
      * HARDCODED CREDENTIALS - CRITICAL VULNERABILITIES
      *=============================================================
       01 WS-DATABASE-CREDENTIALS.
           05 WS-DB-HOST               PIC X(50) VALUE 'prod-db.internal.com'.
           05 WS-DB-PORT               PIC 9(5) VALUE 5432.
           05 WS-DB-NAME               PIC X(20) VALUE 'banking_prod'.
           05 WS-DB-USER               PIC X(20) VALUE 'admin_root'.
           05 WS-DB-PASSWORD           PIC X(30) VALUE 'Pr0d_P@ssw0rd_2024!'.
           05 WS-DB-CONNECTION-STRING  PIC X(200) VALUE 
               'postgres://admin:SuperSecret@prod-db:5432/bank'.
       
       01 WS-API-CREDENTIALS.
           05 WS-API-KEY               PIC X(50) VALUE 
               'sk-prod-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'.
           05 WS-API-SECRET            PIC X(64) VALUE 
               'secret_key_xYz123AbC456DeF789GhI012JkL345MnO'.
           05 WS-BEARER-TOKEN          PIC X(100) VALUE
               'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3'.
           05 WS-OAUTH-CLIENT-ID       PIC X(40) VALUE 
               'client_id_production_12345678'.
           05 WS-OAUTH-CLIENT-SECRET   PIC X(50) VALUE 
               'client_secret_super_secure_production_key'.
       
       01 WS-ENCRYPTION-KEYS.
           05 WS-AES-KEY               PIC X(32) VALUE 
               'AES256_PRODUCTION_KEY_12345678'.
           05 WS-RSA-PRIVATE-KEY       PIC X(100) VALUE 
               'MIIEvgIBADANBgkqhkiG9w0BAQEFA'.
           05 WS-SIGNING-KEY           PIC X(50) VALUE 
               'HMAC_SIGNING_KEY_PRODUCTION_2024'.
           05 WS-ENCRYPTION-IV         PIC X(16) VALUE 
               'InitVector123456'.
       
       01 WS-THIRD-PARTY-KEYS.
           05 WS-AWS-ACCESS-KEY        PIC X(20) VALUE 
               'AKIAIOSFODNN7EXAMPLE'.
           05 WS-AWS-SECRET-KEY        PIC X(40) VALUE 
               'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'.
           05 WS-STRIPE-KEY            PIC X(50) VALUE 
               'sk_live_51ABC123DEF456GHI789JKL'.
           05 WS-TWILIO-AUTH-TOKEN     PIC X(32) VALUE 
               'twilio_auth_token_abc123def456'.
           05 WS-SENDGRID-API-KEY      PIC X(60) VALUE 
               'SG.abcdef123456.ghijklmnopqrstuvwxyz'.
           05 WS-GITHUB-TOKEN          PIC X(40) VALUE 
               'ghp_1234567890abcdefghijABCDEFGHIJ12'.
       
      *=============================================================
      * PII DATA FIELDS - HIGH RISK
      *=============================================================
       01 WS-CUSTOMER-PII.
           05 WS-SSN                   PIC 9(9).
           05 WS-SSN-DISPLAY           PIC X(11).
           05 WS-SOCIAL-SECURITY-NUM   PIC X(11).
           05 WS-TAX-ID-NUMBER         PIC X(11).
           05 WS-DATE-OF-BIRTH         PIC 9(8).
           05 WS-DOB-FORMATTED         PIC X(10).
           05 WS-PASSPORT-NUMBER       PIC X(15).
           05 WS-DRIVERS-LICENSE-NUM   PIC X(20).
           05 WS-NATIONAL-ID           PIC X(20).
       
       01 WS-FINANCIAL-PII.
           05 WS-CREDIT-CARD-NUMBER    PIC X(16).
           05 WS-CARD-CVV-CODE         PIC 9(4).
           05 WS-CARD-PIN              PIC 9(6).
           05 WS-BANK-ACCOUNT-NUM      PIC X(20).
           05 WS-ROUTING-NUMBER        PIC 9(9).
           05 WS-SWIFT-CODE            PIC X(11).
           05 WS-IBAN-NUMBER           PIC X(34).
       
       01 WS-CONTACT-PII.
           05 WS-PHONE-NUMBER          PIC X(15).
           05 WS-MOBILE-NUMBER         PIC X(15).
           05 WS-EMAIL-ADDRESS         PIC X(100).
           05 WS-HOME-ADDRESS          PIC X(200).
           05 WS-MAILING-ADDRESS       PIC X(200).
       
       01 WS-HEALTH-PII.
           05 WS-MEDICAL-RECORD-NUM    PIC X(20).
           05 WS-HEALTH-INSURANCE-ID   PIC X(20).
           05 WS-BIOMETRIC-HASH        PIC X(64).
       
      *=============================================================
      * HARDCODED TEST DATA WITH REAL-LOOKING VALUES
      *=============================================================
       01 WS-TEST-SSN                  PIC X(11) VALUE '123-45-6789'.
       01 WS-TEST-CREDIT-CARD          PIC X(16) VALUE '4532015112830366'.
       01 WS-TEST-CVV                  PIC 9(3) VALUE 123.
       01 WS-TEST-PIN                  PIC 9(4) VALUE 1234.
       01 WS-TEST-ACCOUNT              PIC X(12) VALUE '123456789012'.
       
      *=============================================================
      * SQL QUERY BUILDING - INJECTION VULNERABILITIES
      *=============================================================
       01 WS-SQL-QUERIES.
           05 WS-SELECT-QUERY          PIC X(500).
           05 WS-INSERT-QUERY          PIC X(500).
           05 WS-UPDATE-QUERY          PIC X(500).
           05 WS-DELETE-QUERY          PIC X(500).
           05 WS-USER-INPUT            PIC X(200).
           05 WS-SEARCH-TERM           PIC X(100).
       
      *=============================================================
      * FINANCIAL CALCULATIONS - OVERFLOW RISKS
      *=============================================================
       01 WS-AMOUNTS.
           05 WS-PRINCIPAL             PIC 9(15)V99.
           05 WS-INTEREST-RATE         PIC V9(6).
           05 WS-COMPOUND-FACTOR       PIC 9(10)V9(8).
           05 WS-TOTAL-INTEREST        PIC 9(15)V99.
           05 WS-FUTURE-VALUE          PIC 9(18)V99.
           05 WS-PAYMENT-AMOUNT        PIC 9(12)V99.
           05 WS-BALANCE               PIC S9(15)V99.
           05 WS-DAILY-LIMIT           PIC 9(12)V99 VALUE 999999999.99.
           05 WS-TRANSACTION-TOTAL     PIC 9(18)V99.
       
       01 WS-COUNTERS.
           05 WS-LOOP-CTR              PIC 9(10).
           05 WS-ITERATIONS            PIC 9(8).
           05 WS-RECORD-COUNT          PIC 9(10).
       
       01 WS-FLAGS.
           05 WS-EOF-FLAG              PIC X VALUE 'N'.
               88 END-OF-FILE          VALUE 'Y'.
           05 WS-ERROR-FLAG            PIC X VALUE 'N'.
               88 HAS-ERROR            VALUE 'Y'.
           05 WS-VALID-FLAG            PIC X VALUE 'N'.
               88 IS-VALID             VALUE 'Y'.
       
       PROCEDURE DIVISION.
       
       0000-MAIN-PROCESS.
           PERFORM 1000-INITIALIZE
           PERFORM 2000-PROCESS-TRANSACTIONS UNTIL END-OF-FILE
           PERFORM 3000-GENERATE-REPORTS
           PERFORM 8000-SQL-OPERATIONS
           PERFORM 9000-TERMINATE
           STOP RUN.
       
       1000-INITIALIZE.
      *--- Initialize with hardcoded credentials ---
           MOVE 'Pr0d_P@ssw0rd_2024!' TO WS-DB-PASSWORD
           MOVE 'sk-prod-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6' TO WS-API-KEY
           MOVE 'AKIAIOSFODNN7EXAMPLE' TO WS-AWS-ACCESS-KEY
           
           DISPLAY '=== SYSTEM INITIALIZATION ==='
           DISPLAY 'Database Password: ' WS-DB-PASSWORD
           DISPLAY 'API Key: ' WS-API-KEY
           DISPLAY 'AWS Key: ' WS-AWS-ACCESS-KEY
           DISPLAY 'Stripe Key: ' WS-STRIPE-KEY
           
           OPEN INPUT CUSTOMER-FILE
           OPEN I-O TRANSACTION-FILE
           OPEN OUTPUT AUDIT-LOG
           OPEN OUTPUT ERROR-FILE.
       
       2000-PROCESS-TRANSACTIONS.
           READ CUSTOMER-FILE INTO CUSTOMER-REC
               AT END SET END-OF-FILE TO TRUE
               NOT AT END PERFORM 2100-PROCESS-CUSTOMER
           END-READ.
       
       2100-PROCESS-CUSTOMER.
      *--- Process PII without any protection ---
           MOVE CUST-SSN TO WS-SSN
           MOVE CUST-DATE-OF-BIRTH TO WS-DATE-OF-BIRTH
           MOVE CUST-TAX-ID TO WS-TAX-ID-NUMBER
           MOVE CUST-CREDIT-CARD-NUM TO WS-CREDIT-CARD-NUMBER
           MOVE CUST-CARD-CVV TO WS-CARD-CVV-CODE
           MOVE CUST-PIN-CODE TO WS-CARD-PIN
           MOVE CUST-BANK-ACCOUNT TO WS-BANK-ACCOUNT-NUM
           MOVE CUST-ROUTING-NUM TO WS-ROUTING-NUMBER
           MOVE CUST-PASSPORT-NUM TO WS-PASSPORT-NUMBER
           MOVE CUST-MEDICAL-ID TO WS-MEDICAL-RECORD-NUM
           
      *--- Log sensitive data unmasked ---
           DISPLAY 'Processing Customer: ' CUST-FULL-NAME
           DISPLAY 'SSN: ' WS-SSN
           DISPLAY 'DOB: ' WS-DATE-OF-BIRTH
           DISPLAY 'Credit Card: ' WS-CREDIT-CARD-NUMBER
           DISPLAY 'CVV: ' WS-CARD-CVV-CODE
           DISPLAY 'PIN: ' WS-CARD-PIN
           DISPLAY 'Bank Account: ' WS-BANK-ACCOUNT-NUM
           DISPLAY 'Passport: ' WS-PASSPORT-NUMBER
           
           PERFORM 2200-CALCULATE-FINANCES
           PERFORM 2300-BUILD-SQL-QUERIES.
       
       2200-CALCULATE-FINANCES.
      *--- Arithmetic without overflow protection ---
           ADD 1000000.00 TO WS-PRINCIPAL
           ADD 999999.99 TO WS-BALANCE
           MULTIPLY WS-PRINCIPAL BY WS-INTEREST-RATE 
               GIVING WS-TOTAL-INTEREST
           COMPUTE WS-FUTURE-VALUE = WS-PRINCIPAL * 
               (1 + WS-INTEREST-RATE) ** 360
           COMPUTE WS-COMPOUND-FACTOR = 
               (1 + WS-INTEREST-RATE / 12) ** (12 * 30)
           DIVIDE WS-FUTURE-VALUE BY 12 GIVING WS-PAYMENT-AMOUNT
           COMPUTE WS-TRANSACTION-TOTAL = 
               WS-BALANCE * WS-COMPOUND-FACTOR + WS-TOTAL-INTEREST
           
      *--- More risky calculations ---
           ADD WS-TRANSACTION-TOTAL TO WS-DAILY-LIMIT
           MULTIPLY WS-DAILY-LIMIT BY 1000 GIVING WS-FUTURE-VALUE
           COMPUTE WS-BALANCE = WS-BALANCE + WS-FUTURE-VALUE - 
               WS-PAYMENT-AMOUNT * WS-COMPOUND-FACTOR.
       
       2300-BUILD-SQL-QUERIES.
      *--- SQL Injection vulnerabilities ---
           STRING 'SELECT * FROM customers WHERE id = '''
                  CUST-ID
                  ''' AND ssn = '''
                  WS-SSN
                  ''''
                  DELIMITED BY SIZE INTO WS-SELECT-QUERY
           END-STRING
           
           STRING 'INSERT INTO audit_log VALUES ('''
                  CUST-ID ''', '''
                  WS-CREDIT-CARD-NUMBER ''', '''
                  WS-SSN ''', '''
                  WS-DB-PASSWORD
                  ''')'
                  DELIMITED BY SIZE INTO WS-INSERT-QUERY
           END-STRING
           
           STRING 'UPDATE accounts SET balance = '
                  WS-BALANCE
                  ' WHERE account_num = '''
                  WS-BANK-ACCOUNT-NUM
                  ''' AND pin = '''
                  WS-CARD-PIN
                  ''''
                  DELIMITED BY SIZE INTO WS-UPDATE-QUERY
           END-STRING
           
           STRING 'DELETE FROM customers WHERE search_term LIKE ''%'
                  WS-USER-INPUT
                  '%'''
                  DELIMITED BY SIZE INTO WS-DELETE-QUERY
           END-STRING
           
           DISPLAY 'Executing: ' WS-SELECT-QUERY
           DISPLAY 'Executing: ' WS-INSERT-QUERY.
       
       3000-GENERATE-REPORTS.
      *--- Generate reports with exposed credentials ---
           DISPLAY '=== DAILY REPORT ==='
           DISPLAY 'Generated with API Key: ' WS-API-KEY
           DISPLAY 'Database: ' WS-DB-CONNECTION-STRING
           DISPLAY 'Signed with: ' WS-SIGNING-KEY
           DISPLAY 'AWS Credentials: ' WS-AWS-ACCESS-KEY ' / ' 
               WS-AWS-SECRET-KEY.
       
       8000-SQL-OPERATIONS.
      *--- Direct SQL without prepared statements ---
           EXEC SQL
               SELECT * FROM customers 
               WHERE name = :WS-USER-INPUT
           END-EXEC
           
           EXEC SQL
               INSERT INTO transactions (card, cvv, pin)
               VALUES (:WS-CREDIT-CARD-NUMBER, :WS-CARD-CVV-CODE, 
                       :WS-CARD-PIN)
           END-EXEC.
       
       9000-TERMINATE.
           CLOSE CUSTOMER-FILE
           CLOSE TRANSACTION-FILE
           CLOSE AUDIT-LOG
           CLOSE ERROR-FILE
           
           DISPLAY '=== SESSION TERMINATED ==='
           DISPLAY 'Cleanup with password: ' WS-DB-PASSWORD
           DISPLAY 'OAuth Secret: ' WS-OAUTH-CLIENT-SECRET
           DISPLAY 'Bearer Token: ' WS-BEARER-TOKEN
           STOP RUN.
