#!/usr/bin/env python3
"""
Robust post-processor using regex to find and close unclosed docstrings
"""

import re
import subprocess
import sys
import os

def fix_unclosed_docstrings(code: str) -> str:
    """Find and close all unclosed docstrings using regex."""
    lines = code.split('\n')
    fixed_lines = []
    in_docstring = False
    docstring_indent = 0
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        indent = len(line) - len(line.lstrip())
        
        # Check if this line starts a docstring
        if '"""' in line:
            count = line.count('"""')
            
            if count == 1 and not in_docstring:
                # Opening a docstring
                in_docstring = True
                docstring_indent = indent
                fixed_lines.append(line)
            elif count == 1 and in_docstring and indent == docstring_indent:
                # Closing the docstring we opened
                in_docstring = False
                fixed_lines.append(line)
            elif count == 2:
                # Line with both opening and closing - not an unclosed docstring
                fixed_lines.append(line)
            else:
                fixed_lines.append(line)
        elif in_docstring:
            # Check if we've exited the docstring (code at same or lower indent)
            if stripped and not stripped.startswith('#'):
                # Close the docstring
                fixed_lines.append(' ' * docstring_indent + '"""')
                in_docstring = False
                fixed_lines.append(line)
            else:
                fixed_lines.append(line)
        else:
            fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)

def run_black(code: str) -> str:
    """Run Black formatter."""
    try:
        result = subprocess.run(
            [sys.executable, '-m', 'black', '-', '--fast'],
            input=code,
            capture_output=True,
            text=True,
            timeout=60
        )
        if result.returncode == 0 and result.stdout:
            return result.stdout
    except Exception as e:
        print(f"Black error: {e}")
    return code

def main():
    input_file = 'user_input_files/pasted-text-2026-02-03T17-19-17.txt'
    output_file = 'output/post_processed_regex.py'
    
    print(f"Reading: {input_file}")
    with open(input_file, 'r') as f:
        code = f.read()
    
    # Step 1: Fix unclosed docstrings
    print("Step 1: Fixing unclosed docstrings...")
    code = fix_unclosed_docstrings(code)
    
    # Step 2: Run Black
    print("Step 2: Running Black...")
    code = run_black(code)
    
    # Write output
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w') as f:
        f.write(code)
    
    print(f"\nOutput: {output_file}")
    
    # Check syntax
    try:
        compile(code, output_file, 'exec')
        print("SUCCESS: Code is valid!")
        return 0
    except SyntaxError as e:
        print(f"WARNING: Still has syntax errors at line {e.lineno}")
        print(f"Error: {e.msg}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
