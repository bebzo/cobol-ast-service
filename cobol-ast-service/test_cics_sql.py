"""Test CICS and SQL Support"""
from api.transpile import preprocess_cics, preprocess_sql, generate_python_code

# Test 1: CICS Preprocessing
print("=" * 60)
print("TEST 1: CICS Preprocessing")
print("=" * 60)

cics_cobol = """
       IDENTIFICATION DIVISION.
       PROGRAM-ID. CICS-DEMO.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-MAP-DATA    PIC X(100).
       01 WS-CUSTOMER-ID PIC X(10).
       PROCEDURE DIVISION.
       0000-MAIN.
           EXEC CICS SEND MAP('MAP001')
                     MAPSET('MAPSET1')
                     FROM(WS-MAP-DATA)
           END-EXEC.
           EXEC CICS RECEIVE MAP('MAP001')
                     MAPSET('MAPSET1')
                     INTO(WS-MAP-DATA)
           END-EXEC.
           EXEC CICS READ FILE('CUSTFILE')
                     INTO(WS-CUSTOMER)
                     RIDFLD(WS-CUSTOMER-ID)
           END-EXEC.
           EXEC CICS SYNCPOINT END-EXEC.
           EXEC CICS RETURN END-EXEC.
           STOP RUN.
"""

modified, commands, stats = preprocess_cics(cics_cobol)

print(f"   CICS Commands trouvées: {stats['cics_commands_found']}")
print(f"   Types: {stats['cics_types']}")
assert stats['cics_commands_found'] == 5, f"Attendu 5, trouvé {stats['cics_commands_found']}"
assert 'SEND' in stats['cics_types']
assert 'RECEIVE' in stats['cics_types']
assert 'READ' in stats['cics_types']
print("✅ TEST 1 PASSED\n")

# Test 2: SQL Preprocessing
print("=" * 60)
print("TEST 2: SQL Preprocessing")
print("=" * 60)

sql_cobol = """
       IDENTIFICATION DIVISION.
       PROGRAM-ID. SQL-DEMO.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-CUSTOMER-ID   PIC X(10).
       01 WS-CUSTOMER-NAME PIC X(30).
       01 WS-BALANCE       PIC 9(9)V99.
           EXEC SQL INCLUDE SQLCA END-EXEC.
       PROCEDURE DIVISION.
       0000-MAIN.
           EXEC SQL
               SELECT NAME, BALANCE
               INTO :WS-CUSTOMER-NAME, :WS-BALANCE
               FROM CUSTOMER
               WHERE ID = :WS-CUSTOMER-ID
           END-EXEC.
           IF SQLCODE = 0
               DISPLAY 'FOUND: ' WS-CUSTOMER-NAME
           END-IF.
           EXEC SQL
               UPDATE CUSTOMER
               SET BALANCE = :WS-BALANCE
               WHERE ID = :WS-CUSTOMER-ID
           END-EXEC.
           EXEC SQL COMMIT END-EXEC.
           STOP RUN.
"""

modified, commands, stats = preprocess_sql(sql_cobol)

print(f"   SQL Commands trouvées: {stats['sql_commands_found']}")
print(f"   Types: {stats['sql_types']}")
print(f"   Tables: {stats['tables_referenced']}")
assert stats['sql_commands_found'] == 4, f"Attendu 4, trouvé {stats['sql_commands_found']}"
assert 'SELECT' in stats['sql_types']
assert 'UPDATE' in stats['sql_types']
assert 'CUSTOMER' in stats['tables_referenced']
print("✅ TEST 2 PASSED\n")

# Test 3: Full transpilation with CICS
print("=" * 60)
print("TEST 3: Transpilation complète avec CICS")
print("=" * 60)

result = generate_python_code(cics_cobol)

assert result['success'], f"Erreur: {result.get('error')}"
assert result['stats']['has_cics'] == True
assert 'CICSContext' in result['python_code']
assert 'send_data' in result['python_code'] or 'CICS' in result['python_code']
print(f"   Version: {result['version']}")
print(f"   CICS commands: {result['stats']['cics_commands']}")
print("✅ TEST 3 PASSED\n")

# Test 4: Full transpilation with SQL
print("=" * 60)
print("TEST 4: Transpilation complète avec SQL")
print("=" * 60)

result = generate_python_code(sql_cobol)

assert result['success'], f"Erreur: {result.get('error')}"
assert result['stats']['has_sql'] == True
assert 'SQLContext' in result['python_code']
assert 'sqlcode' in result['python_code'].lower() or 'SQL' in result['python_code']
print(f"   Version: {result['version']}")
print(f"   SQL commands: {result['stats']['sql_commands']}")
print("✅ TEST 4 PASSED\n")

# Test 5: Code Python valide
print("=" * 60)
print("TEST 5: Validation syntaxe Python")
print("=" * 60)

try:
    compile(result['python_code'], '<generated>', 'exec')
    print("   Code compile sans erreur ✓")
    print("✅ TEST 5 PASSED\n")
except SyntaxError as e:
    print(f"❌ Erreur syntaxe: {e}")
    exit(1)

print("=" * 60)
print("🎉 TOUS LES TESTS CICS/SQL PASSENT!")
print("=" * 60)
