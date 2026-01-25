       IDENTIFICATION DIVISION.
       PROGRAM-ID. BUG-FIX-TEST.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-AMOUNT          PIC 9(6)V99 VALUE 1234,56.
       01 WS-LIMIT           PIC 9(5)V99 VALUE 10000,00.
       01 WS-FACTOR          PIC 9(3)V99 VALUE 0,50.
       01 WS-INPUT           PIC X(50) VALUE "A|B|C|D".
       01 WS-OUTPUT          PIC X(50).
       01 WS-PTR             PIC 9(2) VALUE 0.
       01 WS-CREDIT-SCORE    PIC 9(3) VALUE 450.
       01 WS-STATUS          PIC X VALUE 'A'.
       01 WS-RESULT          PIC X(100).

       PROCEDURE DIVISION.
       MAIN-PARA.
           * Bug #3: DISPLAY UPON SYSOUT test
           DISPLAY "MEGA-ENTERPRISE-BEAST STARTING..." UPON SYSOUT.

           * Bug #1, #2, #8: Decimal comma handling
           MOVE 9999,99 TO WS-AMOUNT.
           COMPUTE WS-LIMIT = 5000,00 * 1,5.

           * Bug #6: UNSTRING WITH POINTER test
           UNSTRING WS-INPUT DELIMITED BY '|' INTO
               WS-OUTPUT WITH POINTER WS-PTR.

           * Bug #7: THRU range test
           EVALUATE TRUE
               WHEN WS-CREDIT-SCORE >= 300 THRU 579
                   MOVE "POOR" TO WS-RESULT
               WHEN WS-CREDIT-SCORE >= 580 THRU 669
                   MOVE "FAIR" TO WS-RESULT
               WHEN OTHER
                   MOVE "UNKNOWN" TO WS-RESULT
           END-EVALUATE.

           * Bug #4: EVALUATE TRUE with AND/OR
           EVALUATE TRUE
               WHEN WS-STATUS = 'A' AND WS-AMOUNT > 1000
                   DISPLAY "ACTIVE HIGH VALUE"
               WHEN WS-STATUS = 'A' OR WS-STATUS = 'N'
                   DISPLAY "ACTIVE OR NEW"
           END-EVALUATE.

           STOP RUN.
