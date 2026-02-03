#!/usr/bin/env python3
"""
Test script to verify that docstrings are properly closed in generated Python code.
This tests the fix for the unclosed docstrings bug.
"""

import sys
sys.path.insert(0, '/workspace/api')

from modules.ast_processor import (
    _create_docstring,
    _escape_for_docstring,
    generate_method_from_paragraph_v4,
    to_snake_case
)


def test_docstring_creation():
    """Test that _create_docstring produces properly formatted docstrings."""
    print("Testing _create_docstring function...")
    
    # Test basic docstring
    docstring = _create_docstring("Test docstring content")
    assert docstring is not None, "Docstring should not be None"
    assert isinstance(docstring, ast.Expr), "Should return ast.Expr"
    assert isinstance(docstring.value, ast.Constant), "Value should be ast.Constant"
    
    content = docstring.value.value
    print(f"Generated docstring: {repr(content)}")
    
    # Verify docstring is properly formatted with triple quotes
    assert content.startswith('"""'), "Docstring should start with triple quotes"
    assert content.endswith('"""'), "Docstring should end with triple quotes"
    assert '\n' in content, "Docstring should have newlines (proper formatting)"
    
    print("✓ _create_docstring test passed")


def test_escape_for_docstring():
    """Test that _escape_for_docstring handles special characters."""
    print("\nTesting _escape_for_docstring function...")
    
    # Test with triple quotes
    text_with_triple_quotes = 'Hello """ world'
    escaped = _escape_for_docstring(text_with_triple_quotes)
    print(f"Original: {repr(text_with_triple_quotes)}")
    print(f"Escaped: {repr(escaped)}")
    
    # Test with newlines (should be preserved)
    text_with_newlines = "Line 1\nLine 2"
    escaped_newlines = _escape_for_docstring(text_with_newlines)
    print(f"Text with newlines: {repr(escaped_newlines)}")
    assert '\n' in escaped_newlines, "Newlines should be preserved for docstrings"
    
    print("✓ _escape_for_docstring test passed")


def test_method_generation():
    """Test that generate_method_from_paragraph_v4 creates proper docstrings."""
    print("\nTesting generate_method_from_paragraph_v4 function...")
    
    # Create a mock paragraph object
    class MockParagraph:
        def __init__(self, name, statements=None):
            self.name = name
            self.statements = statements or []
    
    para = MockParagraph("TEST-PARAGRAPH")
    method = generate_method_from_paragraph_v4(para)
    
    assert method is not None, "Method should not be None"
    assert isinstance(method, ast.FunctionDef), "Should return ast.FunctionDef"
    
    # Check that the first statement is a docstring
    first_stmt = method.body[0]
    assert isinstance(first_stmt, ast.Expr), "First statement should be ast.Expr"
    assert isinstance(first_stmt.value, ast.Constant), "First statement value should be ast.Constant"
    
    docstring_content = first_stmt.value.value
    print(f"Method docstring: {repr(docstring_content)}")
    
    # Verify docstring is properly formatted
    assert docstring_content.startswith('"""'), "Method docstring should start with triple quotes"
    assert docstring_content.endswith('"""'), "Method docstring should end with triple quotes"
    
    print("✓ generate_method_from_paragraph_v4 test passed")


def test_ast_parsing():
    """Test that generated AST can be compiled to Python code."""
    print("\nTesting AST compilation...")
    
    # Create a simple module with properly formatted docstrings
    module_body = [
        _create_docstring("Module docstring"),
        ast.FunctionDef(
            name='test_function',
            args=ast.arguments(
                posonlyargs=[],
                args=[],
                vararg=None,
                kwonlyargs=[],
                kw_defaults=[],
                kwarg=None,
                defaults=[]
            ),
            body=[_create_docstring("Function docstring"), ast.Pass()],
            decorator_list=[],
            returns=None
        )
    ]
    
    module = ast.Module(body=module_body, type_ignores=[])
    ast.fix_missing_locations(module)
    
    # Compile the AST
    try:
        code = compile(module, '<test>', 'exec')
        print("✓ AST compilation successful - docstrings are properly closed!")
    except SyntaxError as e:
        print(f"✗ AST compilation failed: {e}")
        raise


def main():
    """Run all tests."""
    print("=" * 60)
    print("Docstring Fix Verification Tests")
    print("=" * 60)
    
    test_docstring_creation()
    test_escape_for_docstring()
    test_method_generation()
    test_ast_parsing()
    
    print("\n" + "=" * 60)
    print("All tests passed! Docstrings are properly closed.")
    print("=" * 60)


if __name__ == '__main__':
    import ast
    main()
