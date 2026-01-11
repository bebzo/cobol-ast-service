       IDENTIFICATION DIVISION.
       PROGRAM-ID. TEST-PATTERNS.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-BALANCE     PIC 9(10)V99 VALUE 1000.00.
       01 WS-AMOUNT      PIC 9(10)V99 VALUE 100.00.
       01 WS-RATE        PIC 9(3)V99  VALUE 5.00.
       01 WS-INTEREST    PIC 9(10)V99 VALUE 0.
       01 WS-STATUS      PIC X(1)     VALUE "A".
       01 WS-COUNT       PIC 9(5)     VALUE 0.
       01 WS-EOF         PIC X(1)     VALUE "N".
       
       PROCEDURE DIVISION.
       
       1000-MAIN-PROCESS.
           PERFORM 2000-INIT-ACCOUNT.
           PERFORM 3000-DEPOSIT.
           PERFORM 4000-CALC-INTEREST.
           PERFORM 5000-CHECK-STATUS.
           STOP RUN.
       
       2000-INIT-ACCOUNT.
           MOVE ZEROS TO WS-BALANCE.
           MOVE SPACES TO WS-STATUS.
           MOVE "A" TO WS-STATUS.
           ADD 1 TO WS-COUNT.
       
       3000-DEPOSIT.
           ADD WS-AMOUNT TO WS-BALANCE.
           SUBTRACT 10 FROM WS-BALANCE.
           MULTIPLY WS-BALANCE BY WS-RATE GIVING WS-INTEREST.
       
       4000-CALC-INTEREST.
           COMPUTE WS-INTEREST = WS-BALANCE * WS-RATE.
           COMPUTE WS-BALANCE = WS-BALANCE + WS-INTEREST.
           IF WS-BALANCE > 5000
               MOVE "H" TO WS-STATUS
           ELSE
               MOVE "L" TO WS-STATUS
           END-IF.
       
       5000-CHECK-STATUS.
           IF WS-STATUS = "A"
               PERFORM 6000-ACTIVE-PROCESS
           END-IF.
           IF WS-STATUS NOT = "A"
               PERFORM 7000-INACTIVE-PROCESS
           END-IF.
           IF WS-BALANCE IS POSITIVE
               ADD 1 TO WS-COUNT
           END-IF.
       
       6000-ACTIVE-PROCESS.
           MOVE "ACTIVE" TO WS-STATUS.
       
       7000-INACTIVE-PROCESS.
           MOVE "CLOSED" TO WS-STATUS.
