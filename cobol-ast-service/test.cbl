       IDENTIFICATION DIVISION.
       PROGRAM-ID.  PAYROLL01.
       AUTHOR.      MAINFRAME-LEGACY-1987.
       DATE-WRITTEN. 1987-03-15.
       DATE-COMPILED.
      *================================================================*
      * SYSTEME DE PAIE ENTREPRISE - MODULE CALCUL BRUT/NET           *
      * VERSION: 2.3.1 - DERNIERE MODIFICATION: 1995                  *
      * ATTENTION: CONTIENT TAUX FISCAUX DE 1995 - OBSOLETE           *
      *================================================================*
       
       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       SOURCE-COMPUTER. IBM-3090.
       OBJECT-COMPUTER. IBM-3090.
       
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT EMPLOYEE-FILE ASSIGN TO UT-S-EMPFILE
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS EMP-ID
               FILE STATUS IS WS-FILE-STATUS.
           SELECT PAYROLL-REPORT ASSIGN TO UT-S-PAYRPT.
       
       DATA DIVISION.
       FILE SECTION.
       
       FD  EMPLOYEE-FILE
           LABEL RECORDS ARE STANDARD
           BLOCK CONTAINS 0 RECORDS.
       01  EMPLOYEE-RECORD.
           05  EMP-ID                  PIC X(10).
           05  EMP-NAME.
               10  EMP-LAST-NAME       PIC X(20).
               10  EMP-FIRST-NAME      PIC X(15).
           05  EMP-HIRE-DATE.
               10  EMP-HIRE-YEAR       PIC 9(4).
               10  EMP-HIRE-MONTH      PIC 9(2).
               10  EMP-HIRE-DAY        PIC 9(2).
           05  EMP-DEPARTMENT          PIC X(4).
           05  EMP-STATUS              PIC X(1).
               88  EMP-ACTIVE          VALUE 'A'.
               88  EMP-TERMINATED      VALUE 'T'.
               88  EMP-ON-LEAVE        VALUE 'L'.
           05  EMP-PAY-GRADE           PIC 9(2).
           05  EMP-HOURLY-RATE         PIC S9(5)V99 COMP-3.
           05  EMP-YTD-GROSS           PIC S9(9)V99 COMP-3.
           05  EMP-YTD-TAX             PIC S9(7)V99 COMP-3.
           05  EMP-DEDUCTIONS.
               10  EMP-401K-PCT        PIC V99 COMP-3.
               10  EMP-INSURANCE       PIC S9(5)V99 COMP-3.
               10  EMP-UNION-DUES      PIC S9(3)V99 COMP-3.
       
       FD  PAYROLL-REPORT
           LABEL RECORDS ARE OMITTED.
       01  REPORT-LINE                 PIC X(132).
       
       WORKING-STORAGE SECTION.
       
