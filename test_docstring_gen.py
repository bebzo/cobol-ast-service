#!/usr/bin/env python3
"""Test script to understand how docstrings are generated."""

import sys
sys.path.insert(0, '/workspace/api')
sys.path.insert(0, '/workspace/api/modules')

from modules.ast_processor import _create_docstring, _escape_for_docstring
import ast

# Test 1: Simple docstring
print("=== Test 1: Simple docstring ===")
docstring = _create_docstring("This is a test docstring")
code1 = ast.unparse(docstring)
print(f"Generated code:\n{code1}")
print()

# Test 2: Multi-line docstring
print("=== Test 2: Multi-line docstring ===")
multiline = """Line 1
Line 2
Line 3"""
docstring2 = _create_docstring(multiline)
code2 = ast.unparse(docstring2)
print(f"Generated code:\n{code2}")
print()

# Test 3: Check what _escape_for_docstring does
print("=== Test 3: _escape_for_docstring ===")
test_text = 'Contains "quotes" and \'single\' and triple """quotes"""'
escaped = _escape_for_docstring(test_text)
print(f"Original: {test_text}")
print(f"Escaped: {escaped}")
print()

# Test 4: Module-level docstring simulation
print("=== Test 4: Module-level docstring ===")
class_name = "TestClass"
module_doc = f"""{class_name} - Clean Architecture Python Code
Auto-transpiled from COBOL

Line 1
Line 2
"""
print(f"Module doc content:\n{module_doc}")
print(f"Contains opening triple quote: {'\"\"\"' in module_doc}")
print(f"Contains closing triple quote: {module_doc.rstrip().endswith('\"\"\"')}")

# Create AST Module with docstring
module_body = [
    ast.Expr(value=ast.Constant(value=module_doc)),
    ast.Pass()
]
module_ast = ast.Module(body=module_body, type_ignores=[])
try:
    code4 = ast.unparse(module_ast)
    print(f"\nGenerated module code:\n{code4}")
except SyntaxError as e:
    print(f"\nSyntaxError: {e}")
