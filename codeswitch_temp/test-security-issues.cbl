       IDENTIFICATION DIVISION.
       PROGRAM-ID. SECURITY-NIGHTMARE.
       AUTHOR. TEST-VULNERABILITIES.
       DATE-WRITTEN. 2024-01-15.
      *=============================================================
      * TEST FILE: Maximum Security Issues for Testing
      * Contains: Hardcoded credentials, PII, SQL injection, etc.
      *=============================================================
       
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT CUSTOMER-FILE ASSIGN TO 'CUSTOMERS.DAT'.
           SELECT AUDIT-FILE ASSIGN TO 'AUDIT.LOG'.
       
       DATA DIVISION.
       FILE SECTION.
       FD CUSTOMER-FILE.
       01 CUSTOMER-RECORD.
           05 CUST-ID              PIC X(10).
           05 CUST-NAME            PIC X(50).
           05 CUST-SSN             PIC 9(9).
           05 CUST-DOB             PIC 9(8).
           05 CUST-TAX-ID          PIC X(11).
           05 CUST-CREDIT-CARD     PIC X(16).
           05 CUST-CVV             PIC 9(3).
           05 CUST-PHONE           PIC X(15).
           05 CUST-EMAIL           PIC X(50).
       
       WORKING-STORAGE SECTION.
      *--- HARDCODED CREDENTIALS (CRITICAL) ---
       01 WS-DB-PASSWORD           PIC X(20) VALUE 'SuperSecret123!'.
       01 WS-API-KEY               PIC X(40) VALUE 'sk-proj-abcd1234xyz'.
       01 WS-ENCRYPTION-KEY        PIC X(32) VALUE 'AES256SecretKey12345'.
       01 WS-SESSION-TOKEN         PIC X(64) VALUE 'eyJhbGciOiJIUzI1NiJ9'.
       01 WS-AWS-SECRET            PIC X(40) VALUE 'AKIAIOSFODNN7EXAMPLE'.
       
      *--- PII DATA FIELDS (HIGH) ---
       01 WS-CUSTOMER-SSN          PIC 9(9).
       01 WS-SOCIAL-SECURITY-NUM   PIC X(11).
       01 WS-DATE-OF-BIRTH         PIC 9(8).
       01 WS-TAX-ID-NUMBER         PIC X(11).
       01 WS-CREDIT-CARD-NUM       PIC X(16).
       01 WS-ACCOUNT-NUMBER        PIC X(20).
       01 WS-ROUTING-NUMBER        PIC 9(9).
       
      *--- FINANCIAL DATA ---
       01 WS-TRANSACTION-AMT       PIC 9(9)V99.
       01 WS-BALANCE               PIC S9(9)V99.
       01 WS-INTEREST-RATE         PIC V9(4).
       01 WS-DAILY-LIMIT           PIC 9(7)V99 VALUE 10000.00.
       
      *--- SQL QUERY BUILDING (INJECTION RISK) ---
       01 WS-SQL-QUERY             PIC X(500).
       01 WS-USER-INPUT            PIC X(100).
       
      *--- COUNTERS AND FLAGS ---
       01 WS-EOF-FLAG              PIC X VALUE 'N'.
           88 END-OF-FILE          VALUE 'Y'.
       01 WS-ERROR-CODE            PIC 9(4).
       01 WS-LOOP-CTR              PIC 9(5).
       
       PROCEDURE DIVISION.
       
       0000-MAIN-PROCESS.
           PERFORM 1000-INITIALIZE
           PERFORM 2000-PROCESS-CUSTOMERS UNTIL END-OF-FILE
           PERFORM 3000-CALCULATE-TOTALS
           PERFORM 9000-TERMINATE
           STOP RUN.
       
       1000-INITIALIZE.
      *--- Hardcoded connection with password ---
           MOVE 'SuperSecret123!' TO WS-DB-PASSWORD
           MOVE 'sk-proj-abcd1234xyz' TO WS-API-KEY
           DISPLAY 'Connecting with password: ' WS-DB-PASSWORD
           OPEN INPUT CUSTOMER-FILE
           OPEN OUTPUT AUDIT-FILE.
       
       2000-PROCESS-CUSTOMERS.
           READ CUSTOMER-FILE INTO CUSTOMER-RECORD
               AT END SET END-OF-FILE TO TRUE
               NOT AT END PERFORM 2100-VALIDATE-CUSTOMER
           END-READ.
       
       2100-VALIDATE-CUSTOMER.
      *--- Processing PII without encryption ---
           MOVE CUST-SSN TO WS-CUSTOMER-SSN
           MOVE CUST-DOB TO WS-DATE-OF-BIRTH
           MOVE CUST-TAX-ID TO WS-TAX-ID-NUMBER
           MOVE CUST-CREDIT-CARD TO WS-CREDIT-CARD-NUM
           
      *--- SQL Injection vulnerability ---
           STRING 'SELECT * FROM CUSTOMERS WHERE ID = '
                  CUST-ID
                  ' AND SSN = '
                  WS-CUSTOMER-SSN
                  DELIMITED BY SIZE INTO WS-SQL-QUERY
           END-STRING
           
      *--- Displaying sensitive data in logs ---
           DISPLAY 'Processing SSN: ' WS-CUSTOMER-SSN
           DISPLAY 'Credit Card: ' WS-CREDIT-CARD-NUM
           DISPLAY 'Password used: ' WS-DB-PASSWORD
           
           PERFORM 2200-PROCESS-TRANSACTION.
       
       2200-PROCESS-TRANSACTION.
      *--- Arithmetic without overflow protection ---
           ADD 1000.00 TO WS-TRANSACTION-AMT
           COMPUTE WS-BALANCE = WS-BALANCE + WS-TRANSACTION-AMT
           COMPUTE WS-BALANCE = WS-BALANCE * (1 + WS-INTEREST-RATE)
           
      *--- Multiple GO TO statements (complexity) ---
           IF WS-BALANCE > WS-DAILY-LIMIT
               GO TO 2210-LIMIT-EXCEEDED
           END-IF
           IF WS-ERROR-CODE > 0
               GO TO 2220-HANDLE-ERROR
           END-IF
           IF WS-TRANSACTION-AMT < 0
               GO TO 2230-NEGATIVE-AMOUNT
           END-IF
           GO TO 2200-EXIT.
       
       2210-LIMIT-EXCEEDED.
           MOVE 'LIMIT' TO WS-ERROR-CODE
           GO TO 2200-EXIT.
       
       2220-HANDLE-ERROR.
           DISPLAY 'Error occurred with password: ' WS-DB-PASSWORD
           GO TO 2200-EXIT.
       
       2230-NEGATIVE-AMOUNT.
           MOVE 'NEG' TO WS-ERROR-CODE
           GO TO 2200-EXIT.
       
       2200-EXIT.
           EXIT.
       
       3000-CALCULATE-TOTALS.
      *--- More arithmetic without protection ---
           MULTIPLY WS-BALANCE BY WS-INTEREST-RATE 
               GIVING WS-TRANSACTION-AMT
           DIVIDE WS-TRANSACTION-AMT BY 12 
               GIVING WS-TRANSACTION-AMT
           ADD WS-TRANSACTION-AMT TO WS-BALANCE.
       
       9000-TERMINATE.
           CLOSE CUSTOMER-FILE
           CLOSE AUDIT-FILE
           DISPLAY 'Processing complete. API Key: ' WS-API-KEY
           DISPLAY 'Session: ' WS-SESSION-TOKEN
           STOP RUN.
