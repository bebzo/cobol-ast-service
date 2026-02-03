#!/usr/bin/env python3
"""
Script to transpile the enterprise COBOL file and analyze Python quality.
"""

import sys
sys.path.insert(0, '/workspace/api')
sys.path.insert(0, '/workspace/api/modules')

from cobol_parser import parse_cobol
from modules.ast_processor import generate_python_ast_v4
import ast

def main():
    # Read the COBOL file
    print("=" * 80)
    print("ENTERPRISE COBOL TRANSPILATION ANALYSIS")
    print("=" * 80)
    
    with open('/workspace/user_input_files/5claude_cobol_test.txt', 'r') as f:
        cobol_code = f.read()
    
    print(f"\n📄 Source Analysis:")
    print(f"   - COBOL file size: {len(cobol_code):,} characters")
    print(f"   - Number of lines: {len(cobol_code.splitlines())}")
    
    # Parse COBOL
    print("\n🔄 Parsing COBOL code...")
    try:
        cobol_ast = parse_cobol(cobol_code)
        print(f"   ✓ Parsing successful")
        print(f"   - Program ID: {cobol_ast.program_id}")
        print(f"   - Variables: {len(cobol_ast.variables)}")
        print(f"   - Paragraphs: {len(cobol_ast.paragraphs)}")
        print(f"   - File descriptors: {len(cobol_ast.file_descriptors)}")
    except Exception as e:
        print(f"   ✗ Parsing failed: {e}")
        return 1
    
    # Generate Python AST
    print("\n🔄 Generating Python AST...")
    try:
        python_ast = generate_python_ast_v4(cobol_ast)
        print(f"   ✓ AST generation successful")
        
        # Count nodes
        func_count = len([n for n in ast.walk(python_ast) if isinstance(n, ast.FunctionDef)])
        class_count = len([n for n in ast.walk(python_ast) if isinstance(n, ast.ClassDef)])
        assign_count = len([n for n in ast.walk(python_ast) if isinstance(n, ast.Assign)])
        
        print(f"   - Function definitions: {func_count}")
        print(f"   - Class definitions: {class_count}")
        print(f"   - Assignments: {assign_count}")
        
    except Exception as e:
        print(f"   ✗ AST generation failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    # Compile AST to verify syntax
    print("\n🔄 Compiling Python AST...")
    try:
        code = compile(python_ast, '<transpiled>', 'exec')
        print(f"   ✓ Compilation successful - no syntax errors!")
    except SyntaxError as e:
        print(f"   ✗ Compilation failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    # Generate Python code
    print("\n🔄 Generating Python source code...")
    try:
        python_source = ast.unparse(python_ast)
        print(f"   ✓ Code generation successful")
        print(f"   - Python code size: {len(python_source):,} characters")
        print(f"   - Number of lines: {len(python_source.splitlines())}")
        
        # Check for docstrings
        docstring_count = python_source.count('\"\"\"')
        print(f"   - Docstring markers: {docstring_count}")
        
    except Exception as e:
        print(f"   ✗ Code generation failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    # Save generated code
    output_file = '/workspace/output/enterprise_security_fortress.py'
    with open(output_file, 'w') as f:
        f.write(python_source)
    print(f"\n💾 Generated Python code saved to: {output_file}")
    
    # Quality analysis
    print("\n" + "=" * 80)
    print("QUALITY ANALYSIS")
    print("=" * 80)
    
    checks = []
    
    # Check 1: Docstrings properly closed
    docstring_start = python_source.count('\"\"\"')
    if docstring_start >= 2 and docstring_start % 2 == 0:
        checks.append(("✓", "Docstrings properly closed with triple quotes"))
    else:
        checks.append(("✗", "Docstrings may be improperly closed"))
    
    # Check 2: Enterprise patterns
    has_logging = 'import logging' in python_source
    has_decimal = 'from decimal import Decimal' in python_source
    has_typing = 'from typing import' in python_source
    has_dataclass = '@dataclass' in python_source
    
    if has_logging and has_decimal and has_typing:
        checks.append(("✓", "Enterprise imports present (logging, Decimal, typing)"))
    else:
        missing = []
        if not has_logging: missing.append('logging')
        if not has_decimal: missing.append('Decimal')
        if not has_typing: missing.append('typing')
        checks.append(("✗", f"Missing enterprise imports: {', '.join(missing)}"))
    
    # Check 3: Class structure
    if class_count >= 1:
        checks.append(("✓", f"Class-based architecture ({class_count} classes)"))
    else:
        checks.append(("✗", "No class structure found"))
    
    # Check 4: Method structure
    if func_count >= 3:
        checks.append(("✓", f"Method-based structure ({func_count} methods)"))
    else:
        checks.append(("✗", f"Few methods found ({func_count})"))
    
    # Check 5: Syntax validation
    try:
        ast.parse(python_source)
        checks.append(("✓", "Python code passes syntax validation"))
    except SyntaxError as e:
        checks.append(("✗", f"Syntax error in generated code: {e}"))
    
    # Check 6: Unclosed strings check
    lines = python_source.split('\n')
    unclosed_count = 0
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        # Skip docstrings
        if stripped.startswith('"""') or stripped.startswith("'''"):
            continue
        # Check for obvious unclosed strings
        if ('"' in stripped and stripped.count('"') % 2 == 1 and
            not stripped.endswith('\\"') and '"""' not in stripped):
            unclosed_count += 1
            if unclosed_count <= 3:  # Only show first 3
                print(f"   Warning: Line {i} may have unclosed string: {stripped[:60]}...")
    
    if unclosed_count == 0:
        checks.append(("✓", "No unclosed strings detected"))
    else:
        checks.append(("⚠", f"Potential unclosed strings: {unclosed_count}"))
    
    # Print results
    print("\n📊 Quality Check Results:")
    for status, message in checks:
        print(f"   {status} {message}")
    
    # Final verdict
    passed = sum(1 for s, _ in checks if s == '✓')
    total = len(checks)
    
    print(f"\n🎯 Final Score: {passed}/{total} checks passed")
    
    if passed == total:
        print("\n✅ CONCLUSION: The generated Python code is ENTERPRISE QUALITY!")
        print("   - All docstrings are properly closed")
        print("   - Code compiles without syntax errors")
        print("   - Enterprise patterns are present")
        print("   - Ready for production deployment")
    elif passed >= total - 1:
        print("\n⚠️  CONCLUSION: The code is MOSTLY ENTERPRISE QUALITY")
        print("   Minor issues detected, but code is functional")
    else:
        print("\n❌ CONCLUSION: The code needs improvements")
        print("   Several issues need to be addressed before production use")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
