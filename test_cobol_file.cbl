       IDENTIFICATION DIVISION.
       PROGRAM-ID. TEST-PROGRAM.
       AUTHOR. TEST-AUTHOR.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-COUNTER            PIC 9(3) VALUE 0.
       01  WS-NAME               PIC X(30) VALUE SPACES.
       01  WS-AMOUNT             PIC 9(7)V99 VALUE 0.
       01  WS-FLAG               PIC X VALUE 'N'.
           88  WS-FLAG-YES       VALUE 'Y'.
           88  WS-FLAG-NO        VALUE 'N'.
       
       PROCEDURE DIVISION.
       MAIN-LOGIC.
           DISPLAY "Starting test program".
           
           PERFORM 100-INITIALIZE.
           
           PERFORM 200-PROCESS.
           
           PERFORM 300-FINALIZE.
           
           STOP RUN.
           
       100-INITIALIZE.
           MOVE 0 TO WS-COUNTER.
           MOVE "Test Name" TO WS-NAME.
           MOVE 100.50 TO WS-AMOUNT.
           MOVE 'N' TO WS-FLAG.
           DISPLAY "Initialization complete".
           
       200-PROCESS.
           ADD 1 TO WS-COUNTER.
           IF WS-COUNTER > 0
               DISPLAY "Counter is positive"
           ELSE
               DISPLAY "Counter is zero or negative".
               
           IF WS-FLAG-YES
               DISPLAY "Flag is YES"
           ELSE
               DISPLAY "Flag is NO".
               
           COMPUTE WS-AMOUNT = WS-AMOUNT + 50.25.
           DISPLAY "Amount: " WS-AMOUNT.
           
       300-FINALIZE.
           DISPLAY "Final counter: " WS-COUNTER.
           DISPLAY "Test program complete".
