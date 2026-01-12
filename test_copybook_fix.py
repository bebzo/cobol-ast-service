"""Test Copybook Resolution Fix"""
import ast as python_ast
from api.transpile import preprocess_copybooks, parse_cobol, generate_python_ast_v4

# Test 1: COPY avec REPLACING
print("=" * 60)
print("TEST 1: COPY avec REPLACING")
print("=" * 60)

cobol_source = """
       IDENTIFICATION DIVISION.
       PROGRAM-ID. TEST-COPY.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       COPY CUSTOMER-REC REPLACING ==:PREFIX:== BY ==WS-==.
       PROCEDURE DIVISION.
           DISPLAY 'HELLO'.
           STOP RUN.
"""

copybooks = {
    "CUSTOMER-REC": """
       01 :PREFIX:CUSTOMER-DATA.
          05 :PREFIX:CUST-ID     PIC X(10).
          05 :PREFIX:BALANCE     PIC 9(7)V99.
"""
}

expanded, stats = preprocess_copybooks(cobol_source, copybooks)

assert stats['copybooks_resolved'] == 1, "Copybook non résolu"
assert "WS-CUSTOMER-DATA" in expanded, "REPLACING n'a pas fonctionné!"
assert ":PREFIX:" not in expanded, "Tags non remplacés!"
print(f"   Résolu: 1, Remplacements: {stats['replacements_applied']}")
print("✅ TEST 1 PASSED\n")

# Test 2: Pipeline complet
print("=" * 60)
print("TEST 2: Pipeline complet avec copybook")
print("=" * 60)

full_cobol = """
       IDENTIFICATION DIVISION.
       PROGRAM-ID. BANK-ACCT.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       COPY ACCT-COPYBOOK.
       PROCEDURE DIVISION.
       0000-MAIN.
           MOVE 1000 TO WS-BALANCE.
           COMPUTE WS-INTEREST = WS-BALANCE * 0.05.
           STOP RUN.
"""

acct_copybook = """
       01 WS-ACCOUNT-REC.
          05 WS-ACCT-ID      PIC X(10).
          05 WS-BALANCE      PIC 9(9)V99 VALUE ZEROS.
          05 WS-INTEREST     PIC 9(7)V99 VALUE ZEROS.
"""

# Préprocesser
expanded_cobol, cb_stats = preprocess_copybooks(full_cobol, {"ACCT-COPYBOOK": acct_copybook})
assert cb_stats['copybooks_resolved'] == 1
print(f"   Copybook résolu: ✓")

# Parser
cobol_ast = parse_cobol(expanded_cobol)
var_names = [v.name for v in cobol_ast.variables]
assert 'WS-BALANCE' in var_names, f"WS-BALANCE manquant! Got: {var_names}"
assert 'WS-INTEREST' in var_names, f"WS-INTEREST manquant! Got: {var_names}"
print(f"   Variables parsées: {len(cobol_ast.variables)} ✓")

# Générer Python
python_module = generate_python_ast_v4(cobol_ast)
python_code = python_ast.unparse(python_module)

# Vérifier que les variables du copybook sont dans le Python
# (WS-BALANCE devient self.balance, WS-INTEREST devient self.interest)
assert 'self.balance' in python_code, "balance manquant dans Python!"
assert 'self.interest' in python_code, "interest manquant dans Python!"
assert 'self.balance = Decimal' in python_code, "Assignation balance manquante!"
print(f"   Python généré: {len(python_code.splitlines())} lignes ✓")
print("✅ TEST 2 PASSED\n")

# Test 3: Multi-copybooks avec manquant
print("=" * 60)
print("TEST 3: Multi-copybooks + manquant")
print("=" * 60)

multi_cobol = """
       IDENTIFICATION DIVISION.
       PROGRAM-ID. MULTI.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       COPY HEADER-REC.
       COPY DETAIL-REC.
       COPY FOOTER-REC.
       PROCEDURE DIVISION.
           STOP RUN.
"""

multi_copybooks = {
    "HEADER-REC": "       01 WS-HEADER PIC X(80).",
    "DETAIL-REC": "       01 WS-DETAIL PIC X(100).",
}

expanded, stats = preprocess_copybooks(multi_cobol, multi_copybooks)

assert stats['copybooks_found'] == 3
assert stats['copybooks_resolved'] == 2
assert 'FOOTER-REC' in stats['copybooks_missing']
print(f"   Trouvés: 3, Résolus: 2, Manquants: ['FOOTER-REC']")
print("✅ TEST 3 PASSED\n")

# Test 4: Code compile
print("=" * 60)
print("TEST 4: Validation syntaxe Python")
print("=" * 60)

compile(python_code, '<generated>', 'exec')
print("   Code compile sans erreur ✓")
print("✅ TEST 4 PASSED\n")

print("=" * 60)
print("🎉 TOUS LES TESTS COPYBOOK PASSENT!")
print("=" * 60)
