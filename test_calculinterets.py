       IDENTIFICATION DIVISION.
       PROGRAM-ID. CALCULINTERETS.
       AUTHOR. DEVTEAM.
       DATE-WRITTEN. 2024-01-01.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-SOLDE        PIC 9(7)V99   VALUE 100000.00.
       01 WS-TAUX         PIC 9V999     VALUE 0.025.
       01 WS-INTERETS     PIC 9(7)V99   VALUE 0.
       01 WS-PERIODE      PIC 9(3)      VALUE 365.
       01 WS-JOURS        PIC 9(3)      VALUE 365.
       01 WS-NOUVEAU-SOLDE PIC 9(7)V99  VALUE 0.
       01 WS-DISPLAY-SOLDE PIC X(15)    VALUE SPACES.
       01 WS-DISPLAY-INTERETS PIC X(15) VALUE SPACES.

       PROCEDURE DIVISION.
       MAIN-PROCEDURE.
           PERFORM CALCUL-INTERETS-SIMPLE
           PERFORM AFFICHER-RESULTATS
           STOP RUN.

       CALCUL-INTERETS-SIMPLE.
           COMPUTE WS-INTERETS = WS-SOLDE * WS-TAUX * WS-PERIODE / WS-JOURS
           COMPUTE WS-NOUVEAU-SOLDE = WS-SOLDE + WS-INTERETS.

       AFFICHER-RESULTATS.
           MOVE WS-SOLDE TO WS-DISPLAY-SOLDE
           MOVE WS-INTERETS TO WS-DISPLAY-INTERETS
           DISPLAY "================================="
           DISPLAY "CALCUL D'INTERETS BANCAIRES"
           DISPLAY "================================="
           DISPLAY "Solde initial: " WS-DISPLAY-SOLDE
           DISPLAY "Taux annuel: " WS-TAUX
           DISPLAY "Periode: " WS-PERIODE " jours"
           DISPLAY "---------------------------------"
           DISPLAY "Interets calcules: " WS-DISPLAY-INTERETS
           DISPLAY "Nouveau solde: " WS-NOUVEAU-SOLDE
           DISPLAY "=================================".

       END PROGRAM CALCULINTERETS.
