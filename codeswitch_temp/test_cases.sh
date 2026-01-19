#!/bin/bash
API="https://cobol-ast-service.vercel.app/api/analyse"

# Test 1: Boucle PERFORM UNTIL
echo "=== TEST 1: PERFORM UNTIL inline ==="
curl -s -X POST "$API" -H "Content-Type: application/json" -d '{
  "cobolCode": "       IDENTIFICATION DIVISION.\n       PROGRAM-ID. LOOP-TEST.\n       DATA DIVISION.\n       WORKING-STORAGE SECTION.\n       01 WS-I PIC 9(2) VALUE 0.\n       PROCEDURE DIVISION.\n       MAIN.\n           PERFORM UNTIL WS-I >= 10\n               ADD 1 TO WS-I\n               DISPLAY WS-I\n           END-PERFORM.\n           STOP RUN."
}' | jq -r '.python_code' > test1_loop.py
head -30 test1_loop.py

# Test 2: Calculs financiers
echo -e "\n=== TEST 2: Calculs financiers ==="
curl -s -X POST "$API" -H "Content-Type: application/json" -d '{
  "cobolCode": "       IDENTIFICATION DIVISION.\n       PROGRAM-ID. FINANCE-CALC.\n       DATA DIVISION.\n       WORKING-STORAGE SECTION.\n       01 WS-PRINCIPAL PIC 9(8)V99 VALUE 10000.00.\n       01 WS-RATE PIC 9V9999 VALUE 0.0525.\n       01 WS-YEARS PIC 9(2) VALUE 5.\n       01 WS-INTEREST PIC 9(10)V99 VALUE 0.\n       01 WS-TOTAL PIC 9(10)V99 VALUE 0.\n       PROCEDURE DIVISION.\n       CALC-INTEREST.\n           COMPUTE WS-INTEREST = WS-PRINCIPAL * WS-RATE * WS-YEARS.\n           ADD WS-PRINCIPAL TO WS-INTEREST GIVING WS-TOTAL.\n           DISPLAY \"Total: \" WS-TOTAL.\n           STOP RUN."
}' | jq -r '.python_code' > test2_finance.py
head -30 test2_finance.py

# Test 3: Conditions IF/ELSE
echo -e "\n=== TEST 3: Conditions IF/ELSE ==="
curl -s -X POST "$API" -H "Content-Type: application/json" -d '{
  "cobolCode": "       IDENTIFICATION DIVISION.\n       PROGRAM-ID. GRADE-CALC.\n       DATA DIVISION.\n       WORKING-STORAGE SECTION.\n       01 WS-SCORE PIC 9(3) VALUE 85.\n       01 WS-GRADE PIC X VALUE SPACE.\n       PROCEDURE DIVISION.\n       EVALUATE-GRADE.\n           IF WS-SCORE >= 90\n               MOVE \"A\" TO WS-GRADE\n           ELSE IF WS-SCORE >= 80\n               MOVE \"B\" TO WS-GRADE\n           ELSE IF WS-SCORE >= 70\n               MOVE \"C\" TO WS-GRADE\n           ELSE\n               MOVE \"F\" TO WS-GRADE\n           END-IF\n           DISPLAY \"Grade: \" WS-GRADE.\n           STOP RUN."
}' | jq -r '.python_code' > test3_grades.py
head -35 test3_grades.py
