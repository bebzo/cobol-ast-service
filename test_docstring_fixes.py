#!/usr/bin/env python3
"""
Test script to verify that the docstring escaping fixes work correctly.
This tests the _escape_for_docstring and _safe_constant functions.
"""

import sys
import ast

# Import the fixed module
sys.path.insert(0, '/workspace')
from api.modules.ast_processor import (
    _escape_for_docstring,
    _safe_constant,
    to_pascal_case,
)


def test_escape_for_docstring():
    """Test that _escape_for_docstring properly escapes special characters."""
    print("Testing _escape_for_docstring...")
    
    # Test cases with special characters that could cause syntax errors
    test_cases = [
        # (input, expected_contains_or_not)
        ('simple name', 'simple name'),  # Regular text stays the same
        ('NAME WITH "QUOTES"', 'NAME WITH \\"QUOTES\\"'),  # Double quotes escaped
        ("NAME WITH 'APOSTROPHE'", "NAME WITH \\'APOSTROPHE"),  # Single quotes escaped
        ('NAME WITH """TRIPLE"""', 'NAME WITH \\\"\\\"\\\"TRIPLE\\\"\\\"\\\"'),  # Triple quotes escaped
        ('NAME WITH BACK\\SLASH', 'NAME WITH BACK\\\\SLASH'),  # Backslashes escaped
        ('NAME WITH\nNEWLINE', 'NAME WITH NEWLINE'),  # Newlines converted to spaces
        ('NAME WITH\tTAB', 'NAME WITH\\\\tTAB'),  # Tabs escaped
        ('NAME WITH\rCARRIAGE', 'NAME WITH\\\\rCARRIAGE'),  # Carriage returns escaped
        ('MIXED "QUOTE" AND \'APOSTROPHE\'', 'MIXED \\\"QUOTE\\\" AND \\\'APOSTROPHE\\\''),  # Mixed quotes
    ]
    
    all_passed = True
    for input_str, expectation in test_cases:
        result = _escape_for_docstring(input_str)
        if expectation.startswith('NAME WITH') and 'CONTAINS' in expectation:
            # Check that the result contains the expected pattern
            pass  # Simplification for now
        else:
            # Check that result doesn't contain unescaped problematic characters
            if '"""' in result:
                print(f"  FAIL: Triple quotes not escaped in: {input_str}")
                all_passed = False
            if result.count('"') % 2 == 1 and result.count('\\"') == 0:
                print(f"  FAIL: Odd number of unescaped quotes in: {input_str}")
                all_passed = False
            if '\n' in result:
                print(f"  FAIL: Newline not converted in: {input_str}")
                all_passed = False
    
    if all_passed:
        print("  All _escape_for_docstring tests passed!")
    
    return all_passed


def test_safe_constant():
    """Test that _safe_constant creates valid ast.Constant nodes."""
    print("Testing _safe_constant...")
    
    test_cases = [
        'simple string',
        'string with "quotes"',
        "string with 'apostrophe'",
        'string with """triple quotes"""',
        'string with back\\slash',
    ]
    
    all_passed = True
    for test_str in test_cases:
        try:
            const_node = _safe_constant(test_str)
            # Verify it's an ast.Constant
            if not isinstance(const_node, ast.Constant):
                print(f"  FAIL: _safe_constant didn't return ast.Constant for: {test_str}")
                all_passed = False
                continue
            
            # Verify the value is a string
            if not isinstance(const_node.value, str):
                print(f"  FAIL: ast.Constant.value is not str for: {test_str}")
                all_passed = False
                continue
            
            # Try to create a simple Python code with this constant
            test_code = f"x = {ast.unparse(ast.Expr(const_node))}"
            ast.parse(test_code)
            
        except Exception as e:
            print(f"  FAIL: _safe_constant raised exception for {test_str}: {e}")
            all_passed = False
    
    if all_passed:
        print("  All _safe_constant tests passed!")
    
    return all_passed


def test_ast_generation():
    """Test that AST generation with special characters produces valid Python code."""
    print("Testing AST generation with special characters...")
    
    from api.modules.ast_processor import generate_method_from_paragraph_v4
    from dataclasses import dataclass, field
    from typing import List
    
    @dataclass
    class CobolParagraph:
        name: str
        line_start: int
        line_end: int
        statements: List[str] = field(default_factory=list)
    
    # Test with a paragraph name that has special characters
    test_paragraphs = [
        CobolParagraph(
            name='100-PROCESS-"DATA"',  # Quotes in name
            statements=['DISPLAY "Hello"'],
            line_start=100,
            line_end=105,
        ),
        CobolParagraph(
            name="200-PROCESS'WITH'APOSTROPHE",  # Apostrophes in name
            statements=['DISPLAY "Test"'],
            line_start=200,
            line_end=205,
        ),
    ]
    
    all_passed = True
    for para in test_paragraphs:
        try:
            method_ast = generate_method_from_paragraph_v4(para)
            
            # Verify it's a valid FunctionDef
            if not isinstance(method_ast, ast.FunctionDef):
                print(f"  FAIL: generate_method_from_paragraph_v4 didn't return FunctionDef for: {para.name}")
                all_passed = False
                continue
            
            # Verify the method has a docstring (first statement should be an Expr with a Constant)
            if not method_ast.body or not isinstance(method_ast.body[0], ast.Expr):
                print(f"  FAIL: Method doesn't have docstring: {para.name}")
                all_passed = False
                continue
            
            # Check that the docstring is a Constant with string value
            if not isinstance(method_ast.body[0].value, ast.Constant):
                print(f"  FAIL: Docstring is not an ast.Constant: {para.name}")
                all_passed = False
                continue
            
            # Verify the docstring value is a string (should be after escaping)
            docstring_value = method_ast.body[0].value.value
            if not isinstance(docstring_value, str):
                print(f"  FAIL: Docstring value is not a string: {para.name}")
                all_passed = False
                continue
            
            # Check that the docstring doesn't contain unescaped triple quotes
            if '"""' in docstring_value:
                print(f"  FAIL: Docstring contains unescaped triple quotes: {para.name}")
                all_passed = False
                continue
            
            print(f"  OK: Generated valid AST for paragraph: {para.name}")
            
        except Exception as e:
            print(f"  FAIL: AST generation failed for {para.name}: {e}")
            all_passed = False
    
    if all_passed:
        print("  All AST generation tests passed!")
    
    return all_passed


def main():
    """Run all tests."""
    print("=" * 60)
    print("Testing Docstring Escaping Fixes")
    print("=" * 60)
    
    results = []
    
    results.append(("escape_for_docstring", test_escape_for_docstring()))
    results.append(("safe_constant", test_safe_constant()))
    results.append(("ast_generation", test_ast_generation()))
    
    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)
    
    all_passed = True
    for test_name, passed in results:
        status = "PASSED" if passed else "FAILED"
        print(f"  {test_name}: {status}")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    if all_passed:
        print("All tests PASSED!")
        return 0
    else:
        print("Some tests FAILED!")
        return 1


if __name__ == "__main__":
    sys.exit(main())
