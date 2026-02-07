#!/usr/bin/env python3
"""Test to understand the exact issue with module docstrings."""

import sys
sys.path.insert(0, '/workspace/api')
sys.path.insert(0, '/workspace/api/modules')

import ast

# Simulate what the transpiler does
class_name = "EnterpriseSecurityFortress"

# This is what the transpiler does (lines 5769-5844)
docstring_value = f"""{class_name} - Clean Architecture Python Code
Auto-transpiled from COBOL [AST Transpiler v11.0]

Architecture:
- SupabaseDataAccessLayer with PostgreSQL backend

CODE REVIEWER NOTES:
* "Dead code after return" -> COBOL STOP RUN behavior
* "Decimal everywhere" -> Financial precision requirement
"""

print("=== Docstring value analysis ===")
print(f"First 100 chars: {repr(docstring_value[:100])}")
print(f"Last 50 chars: {repr(docstring_value[-50:])}")
print(f"Ends with newline: {docstring_value.endswith(chr(10))}")
print()

# Create AST Module like the transpiler does
body = []
body.append(ast.Expr(value=ast.Constant(value=docstring_value)))
body.append(ast.ImportFrom(module='__future__', names=[ast.alias(name='annotations')], level=0))

module_ast = ast.Module(body=body, type_ignores=[])
ast.fix_missing_locations(module_ast)

# Compile to check syntax
try:
    code = compile(module_ast, '<test>', 'exec')
    print("=== Compilation successful ===")
except SyntaxError as e:
    print(f"=== Compilation failed: {e} ===")

# Unparse to see the output
unparsed = ast.unparse(module_ast)
print("\n=== Unparsed code ===")
print(unparsed)
print()

# Check for triple quotes
lines = unparsed.split('\n')
print("=== Line analysis ===")
for i, line in enumerate(lines[:10], 1):
    has_triple = '"""' in line
    print(f"Line {i}: {repr(line[:60])}... Triple quotes: {has_triple}")
