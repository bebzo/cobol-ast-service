"""Test Intégration Enterprise: CICS + SQL + COPY"""
from api.transpile import preprocess_copybooks, generate_python_code

print("=" * 70)
print("TEST ENTERPRISE: COBOL avec CICS + SQL + COPYBOOK")
print("=" * 70)

# Programme COBOL Enterprise typique
enterprise_cobol = """
       IDENTIFICATION DIVISION.
       PROGRAM-ID. CUST-INQUIRY.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       COPY SQLCA.
       COPY DFHAID.
       01 WS-CUSTOMER-ID     PIC X(10).
       01 WS-CUSTOMER-NAME   PIC X(30).
       01 WS-BALANCE         PIC 9(9)V99.
       01 WS-RESPONSE        PIC X(80).
       PROCEDURE DIVISION.
       0000-MAIN.
           EXEC CICS RECEIVE MAP('CUSTINQ')
                     MAPSET('CUSTSET')
                     INTO(WS-MAP-DATA)
           END-EXEC.
           PERFORM 1000-READ-CUSTOMER.
           PERFORM 2000-SEND-RESPONSE.
           EXEC CICS RETURN END-EXEC.
           STOP RUN.

       1000-READ-CUSTOMER.
           EXEC SQL
               SELECT CUST_NAME, BALANCE
               INTO :WS-CUSTOMER-NAME, :WS-BALANCE
               FROM CUSTOMER_MASTER
               WHERE CUST_ID = :WS-CUSTOMER-ID
           END-EXEC.
           IF SQLCODE = 100
               MOVE 'CUSTOMER NOT FOUND' TO WS-RESPONSE
           ELSE IF SQLCODE NOT = 0
               MOVE 'DATABASE ERROR' TO WS-RESPONSE
           ELSE
               MOVE WS-CUSTOMER-NAME TO WS-RESPONSE
           END-IF.

       2000-SEND-RESPONSE.
           EXEC CICS SEND MAP('CUSTINQ')
                     MAPSET('CUSTSET')
                     FROM(WS-MAP-DATA)
           END-EXEC.
"""

# Copybooks simulés
copybooks = {
    "SQLCA": """
       01 SQLCA.
          05 SQLCODE    PIC S9(9) COMP VALUE 0.
          05 SQLSTATE   PIC X(5) VALUE SPACES.
          05 SQLERRM    PIC X(70) VALUE SPACES.
    """,
    "DFHAID": """
       01 DFHAID.
          05 DFHENTER   PIC X VALUE 'E'.
          05 DFHCLEAR   PIC X VALUE 'C'.
          05 DFHPF1     PIC X VALUE '1'.
    """
}

# Préprocesser les copybooks
expanded_cobol, cb_stats = preprocess_copybooks(enterprise_cobol, copybooks)
print(f"   Copybooks résolus: {cb_stats['copybooks_resolved']}")

# Transpiler
result = generate_python_code(expanded_cobol)

# Vérifications
assert result['success'], f"Erreur: {result.get('error')}"
print(f"   Version: {result['version']}")
print(f"   Variables: {result['stats']['variables']}")
print(f"   Paragraphs: {result['stats']['paragraphs']}")
print(f"   CICS Commands: {result['stats']['cics_commands']}")
print(f"   SQL Commands: {result['stats']['sql_commands']}")
print(f"   has_cics: {result['stats']['has_cics']}")
print(f"   has_sql: {result['stats']['has_sql']}")

# Vérifier les features
python_code = result['python_code']
assert 'CICSContext' in python_code, "CICSContext manquant!"
assert 'SQLContext' in python_code, "SQLContext manquant!"
assert 'sqlcode' in python_code.lower(), "sqlcode manquant!"
assert 'Decimal' in python_code, "Decimal manquant!"
print("   ✓ CICSContext présent")
print("   ✓ SQLContext présent")
print("   ✓ SQLCODE présent")
print("   ✓ Decimal présent")

# Vérifier que le code compile
compile(python_code, '<generated>', 'exec')
print("   ✓ Code Python valide")

# Vérifier les tests générés
unit_tests = result.get('unit_tests', '')
assert len(unit_tests) > 100, "Tests trop courts"
print(f"   ✓ Tests générés: {len(unit_tests.splitlines())} lignes")

print("\n" + "=" * 70)
print("🎉 TEST ENTERPRISE COMPLET RÉUSSI!")
print("=" * 70)

# Afficher un extrait du code
print("\n--- EXTRAIT DU CODE PYTHON GÉNÉRÉ ---")
lines = python_code.split('\n')
for i, line in enumerate(lines):
    if 'class CICSContext' in line or 'class SQLContext' in line or 'CustInquiry' in line:
        print(f"\n... (ligne {i+1})")
        for j in range(i, min(i+15, len(lines))):
            print(lines[j])
        break
