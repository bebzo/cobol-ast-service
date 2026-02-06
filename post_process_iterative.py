#!/usr/bin/env python3
"""
Robust Python Post-Processor using iterative parsing

Strategy:
1. Try to parse the code with ast.parse()
2. When an error is found, identify the type and fix it
3. Repeat until the code is valid
"""

import ast
import sys
import re
from typing import Tuple, List, Optional

def find_docstring_start(code: str, error_line: int) -> Optional[int]:
    """Find the opening triple quote that corresponds to an unclosed docstring."""
    lines = code.split('\n')
    for i in range(error_line - 1, -1, -1):
        line = lines[i]
        # Look for a line that starts a docstring at the same or lower indentation
        stripped = line.strip()
        if '"""' in line and not stripped.startswith('#'):
            count = line.count('"""')
            if count == 1 and not line.strip().endswith('"""'):
                return i
    return None

def fix_unclosed_docstring(code: str, error_line: int) -> str:
    """Fix an unclosed docstring by adding the closing triple quote."""
    lines = code.split('\n')
    
    # Find the indentation level of the code after the error
    code_indent = 0
    for i in range(error_line, len(lines)):
        line = lines[i]
        stripped = line.strip()
        if stripped and not stripped.startswith('#'):
            code_indent = len(line) - len(line.lstrip())
            break
    
    # Find the docstring start by looking backwards
    docstring_start = find_docstring_start(code, error_line)
    if docstring_start is None:
        return code
    
    # Insert closing triple quote before the error line
    closing = ' ' * code_indent + '"""'
    lines.insert(error_line - 1, closing)
    
    return '\n'.join(lines)

def fix_common_issues(code: str) -> Tuple[str, List[str]]:
    """Apply common fixes for known transpiler issues."""
    changes = []
    lines = code.split('\n')
    fixed_lines = []
    
    for i, line in enumerate(lines, 1):
        stripped = line.rstrip()
        
        # Fix stray trailing quotes
        if stripped.endswith("'") and stripped.endswith(")'"):
            fixed_lines.append(stripped[:-1])
            changes.append(f"Line {i}: Removed stray trailing quote")
        else:
            fixed_lines.append(line)
    
    return '\n'.join(fixed_lines), changes

def process_file(input_file: str, output_file: str) -> dict:
    """Process the file iteratively until all syntax errors are fixed."""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        code = f.read()
    
    # Apply common fixes first
    code, changes = fix_common_issues(code)
    
    iteration = 0
    max_iterations = 100
    
    while iteration < max_iterations:
        iteration += 1
        
        try:
            # Try to parse the code
            ast.parse(code)
            print(f"SUCCESS: Code is valid after {iteration} iteration(s)")
            break
        except SyntaxError as e:
            error_line = e.lineno or 1
            msg = str(e.msg)
            
            # Handle unterminated docstring
            if 'unterminated' in msg or 'string literal' in msg:
                print(f"Iteration {iteration}: Fixing unclosed docstring at line {error_line}")
                code = fix_unclosed_docstring(code, error_line)
                changes.append(f"Iteration {iteration}: Fixed unclosed docstring at line {error_line}")
            else:
                # For other errors, try to comment out the problematic line
                print(f"Iteration {iteration}: Commenting out line {error_line} - {msg}")
                lines = code.split('\n')
                if error_line <= len(lines):
                    lines[error_line - 1] = f"# SYNTAX-ERROR: {lines[error_line - 1]}"
                    code = '\n'.join(lines)
                    changes.append(f"Iteration {iteration}: Commented out line {error_line}")
                else:
                    print(f"Error line {error_line} out of range")
                    break
    
    # Write output
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(code)
    
    return {
        'iterations': iteration,
        'changes': changes,
        'output_file': output_file
    }

if __name__ == '__main__':
    input_file = 'user_input_files/pasted-text-2026-02-03T17-19-17.txt'
    output_file = 'output/post_processed_iterative.py'
    
    print(f"Processing: {input_file}")
    print(f"Output: {output_file}")
    print()
    
    result = process_file(input_file, output_file)
    
    print(f"\n{'='*60}")
    print(f"Iterations: {result['iterations']}")
    print(f"Changes: {len(result['changes'])}")
    for change in result['changes'][:20]:
        print(f"  - {change}")
    if len(result['changes']) > 20:
        print(f"  ... and {len(result['changes'])-20} more")
    print(f"{'='*60}")
