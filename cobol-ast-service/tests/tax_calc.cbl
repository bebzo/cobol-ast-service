       IDENTIFICATION DIVISION.
       PROGRAM-ID. TAX-CALCULATOR.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-INCOME PIC 9(8)V99 VALUE 75000.00.
       01 WS-TAX PIC 9(8)V99 VALUE 0.
       01 WS-BRACKET PIC 9(2) VALUE 0.
       PROCEDURE DIVISION.
       CALC-TAX.
           IF WS-INCOME > 50000
               COMPUTE WS-TAX = (WS-INCOME - 50000) * 0.30
               ADD 10000 TO WS-TAX
           ELSE IF WS-INCOME > 20000
               COMPUTE WS-TAX = (WS-INCOME - 20000) * 0.20
               ADD 2000 TO WS-TAX
           ELSE
               COMPUTE WS-TAX = WS-INCOME * 0.10
           END-IF
           DISPLAY "Income: " WS-INCOME
           DISPLAY "Tax: " WS-TAX
           STOP RUN.
