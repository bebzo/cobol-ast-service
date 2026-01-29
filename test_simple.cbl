       IDENTIFICATION DIVISION.
       PROGRAM-ID. TESTPROG.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-COUNTER         PIC 9(3) VALUE 0.
       
       PROCEDURE DIVISION.
       0000-MAIN.
           MOVE 0 TO WS-COUNTER.
           PERFORM 1000-INCREMENT.
           DISPLAY "Counter: " WS-COUNTER.
           STOP RUN.
       
       1000-INCREMENT.
           ADD 1 TO WS-COUNTER.
