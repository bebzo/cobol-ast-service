#!/usr/bin/env python3
"""
Simple, Robust Python Post-Processor for COBOL Transpiled Code

Philosophy: Fix obvious issues, use tools for the rest.
- Regex fixes for common transpiler bugs
- Black for formatting and syntax fixes  
- AST validation to report remaining issues
"""

import re
import ast
import sys
import os
import subprocess
from typing import Tuple, List


def simple_fixes(code: str) -> Tuple[str, List[str]]:
    """
    Apply simple, targeted regex fixes for known transpiler issues.
    Returns (fixed_code, list_of_changes).
    """
    changes = []
    fixed = code
    
    # Fix unclosed docstrings (both module-level and class-level)
    # Pattern: Docstring starts with """ but never closes
    # Solution: Close it right before real code begins at the same indentation level
    lines = fixed.split('\n')
    fixed_lines = []
    
    # Track docstring state per indentation level
    # {indent_level: [start_line_index, was_closing_found]}
    docstring_state = {}
    
    # Real Python code markers that indicate end of documentation
    code_markers = [
        'from __future__',
        'from decimal',
        'from dataclasses',
        'from typing',
        'from datetime',
        'from enum',
        'import decimal',
        'import re',
        'import logging',
        'import os',
        'import sys',
        'from functools',
        'from abc',
        'class ',
        'def ',
        '@',
        'if __name__',
        '# v',  # Version comments after imports
    ]
    
    def is_real_code(line: str) -> bool:
        """Check if a line looks like actual Python code, not documentation."""
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            return False
        if any(stripped.startswith(marker) for marker in code_markers):
            return True
        if 'import ' in stripped and ('from ' in stripped or stripped.startswith('import ')):
            return True
        # Class variable pattern: NAME = VALUE
        if '=' in stripped and not '==' in stripped:
            parts = stripped.split('=')
            if len(parts) >= 2:
                left = parts[0].strip()
                # Check if left side is a valid identifier (not a sentence)
                if left.replace('_', '').replace(' ', '').isalnum():
                    return True
        return False
    
    for i, line in enumerate(lines):
        stripped = line.rstrip()
        indent = len(line) - len(line.lstrip())
        
        # Check if we're starting a docstring (opening """ not followed by closing """ on same line)
        # We detect opening by looking for """ at the start, but NOT a line that is JUST """
        is_opening = (stripped.startswith('"""') and 
                      not stripped.strip() == '"""' and
                      stripped.count('"""') == 1)
        
        if is_opening:
            print(f"DEBUG LINE {i+1}: Opening docstring at indent {indent}: {stripped[:50]}")
            docstring_state[indent] = [i, False]  # [start_line, has_closing]
            fixed_lines.append(line)
            continue
        
        # Check if we're at the end of a docstring at this indentation level
        # A real closing is a line that is JUST """ (possibly with whitespace)
        if indent in docstring_state and not docstring_state[indent][1]:
            # DEBUG
            check_val = stripped.strip()
            equals_val = check_val == '"""'
            print(f"DEBUG LINE {i+1}: stripped='{check_val}', equals={equals_val}")
            if equals_val:
                print(f"DEBUG LINE {i+1}: Closing docstring at indent {indent}")
                docstring_state[indent][1] = True
        
        # Check if we're encountering code at a level where we're in an unclosed docstring
        for doc_indent, (start_line, has_closing) in list(docstring_state.items()):
            if not has_closing and indent == doc_indent and is_real_code(stripped):
                print(f"DEBUG LINE {i+1}: Closing docstring before code at indent {doc_indent}: {stripped[:50]}")
                # Close the docstring before this code
                if fixed_lines and fixed_lines[-1].rstrip().endswith('.'):
                    fixed_lines[-1] = fixed_lines[-1].rstrip() + '"""'
                else:
                    fixed_lines.append('"""')
                docstring_state[doc_indent][1] = True
                changes.append(f"Line {i+1}: Closed unterminated docstring (indent={doc_indent})")
                break
        
        fixed_lines.append(line)
    
    fixed = '\n'.join(fixed_lines)
    
    # Fix stray trailing quotes (e.g., sanitized = sanitized.replace("'", "''")')
    for i, line in enumerate(fixed.split('\n'), 1):
        stripped = line.rstrip()
        if stripped.endswith("'") and stripped.endswith(")'"):
            fixed = fixed.replace(line, stripped[:-1])
            changes.append(f"Line {i}: Removed stray trailing quote")
    
    # Fix malformed VSAMFile __init__
    patterns = [
        (r'\):\s*\n\s+self\.filename\s*=', 
         '''(self, filename: str, organization: str = "INDEXED", 
                 access_mode: str = "DYNAMIC", record_key: str = None, 
                 record_length: int = None):
        self.filename ='''),
        (r'def __init__\(self\):\s*\n\s+self\.filename\s*=',
         '''def __init__(self, filename: str, organization: str = "INDEXED", 
                 access_mode: str = "DYNAMIC", record_key: str = None, 
                 record_length: int = None):
        self.filename ='''),
    ]
    
    for pattern, replacement in patterns:
        if re.search(pattern, fixed):
            fixed = re.sub(pattern, replacement, fixed)
            changes.append("Fixed malformed VSAMFile __init__")
    
    # Fix malformed open method
    open_patterns = [
        (r"def open\(os\.path\.normpath\(self\),\s*#.*?mode:\s*str\)\s*->\s*str:", 
         "def open(self, mode: str) -> str:"),
    ]
    
    for pattern, replacement in open_patterns:
        if re.search(pattern, fixed):
            fixed = re.sub(pattern, replacement, fixed)
            changes.append("Fixed malformed open method")
    
    # Remove duplicate imports
    lines = fixed.split('\n')
    seen_imports = set()
    import_block = True
    new_lines = []
    
    for line in lines:
        stripped = line.strip()
        if import_block and (stripped.startswith('import ') or stripped.startswith('from ')):
            if stripped in seen_imports:
                changes.append(f"Removed duplicate: {stripped[:50]}...")
                continue
            seen_imports.add(stripped)
        if import_block and stripped and not stripped.startswith('import ') and not stripped.startswith('from '):
            import_block = False
        new_lines.append(line)
    
    fixed = '\n'.join(new_lines)
    
    # Fix duplicate ROUND_HALF_EVEN
    fixed = re.sub(r'ROUND_HALF_EVEN,\s*ROUND_HALF_EVEN,', 'ROUND_HALF_EVEN,', fixed)
    
    return fixed, changes


def validate_and_fix(code: str) -> Tuple[str, bool, List[str]]:
    """
    Validate code and attempt to fix errors.
    Returns (code, is_valid, list_of_errors).
    """
    errors = []
    
    # Try to parse
    try:
        ast.parse(code)
        return code, True, []
    except SyntaxError as e:
        errors.append(f"Line {e.lineno}: {e.msg}")
    
    # Try Black if available
    try:
        result = subprocess.run(
            [sys.executable, '-m', 'black', '-', '--fast', '--quiet'],
            input=code,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0 and result.stdout:
            # Black fixed something
            try:
                ast.parse(result.stdout)
                return result.stdout, True, ["Fixed by Black formatter"]
            except SyntaxError:
                pass
                
    except (subprocess.SubprocessError, FileNotFoundError, PermissionError):
        pass
    
    return code, False, errors


def process_file(input_path: str, output_path: str) -> dict:
    """Process a Python file with simple fixes + validation."""
    
    # Read input
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Apply simple fixes
    fixed, changes = simple_fixes(content)
    
    # Try to validate and use Black if needed
    fixed, is_valid, errors = validate_and_fix(fixed)
    
    # Write output
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(fixed)
    
    return {
        'input_file': input_path,
        'output_file': output_path,
        'changes': changes,
        'errors': errors,
        'syntax_valid': is_valid,
        'input_size': len(content),
        'output_size': len(fixed)
    }


def main():
    if len(sys.argv) < 3:
        print("Usage: python post_process_simple.py <input_file> <output_file>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    print(f"Processing: {input_file}")
    print(f"Output: {output_file}")
    print()
    
    report = process_file(input_file, output_file)
    
    print("=" * 60)
    print("REPORT")
    print("=" * 60)
    print(f"Input size: {report['input_size']} chars")
    print(f"Output size: {report['output_size']} chars")
    
    if report['changes']:
        print(f"\nChanges applied ({len(report['changes'])}):")
        for change in report['changes'][:10]:  # Show first 10
            print(f"  - {change}")
        if len(report['changes']) > 10:
            print(f"  ... and {len(report['changes']) - 10} more")
    
    print(f"\nSyntax valid: {report['syntax_valid']}")
    
    if report['errors']:
        print(f"\nRemaining errors ({len(report['errors'])}):")
        for error in report['errors']:
            print(f"  - {error}")
    
    print("=" * 60)
    
    if report['syntax_valid']:
        print("SUCCESS: File is syntactically valid!")
        sys.exit(0)
    else:
        print("WARNING: File still has syntax errors.")
        print("\nTo fix remaining errors, try:")
        print("  1. Install Black: pip install black")
        print("  2. Run: black output_file.py")
        print("  3. Review remaining issues manually")
        sys.exit(1)


if __name__ == '__main__':
    main()
