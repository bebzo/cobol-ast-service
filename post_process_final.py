#!/usr/bin/env python3
"""
Final pragmatic post-processor using iterative fixing
"""

import subprocess
import sys
import os
import ast

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
        pass
    return code

def simple_fixes(code: str) -> str:
    """Apply simple fixes."""
    lines = code.split('\n')
    fixed = []
    
    for line in lines:
        stripped = line.rstrip()
        # Fix stray quotes
        if stripped.endswith("'") and stripped.endswith(")'"):
            fixed.append(stripped[:-1])
        else:
            fixed.append(line)
    
    return '\n'.join(fixed)

def iterative_fix(code: str, max_iterations: int = 50) -> str:
    """Iteratively fix syntax errors by commenting out problematic lines."""
    
    for iteration in range(max_iterations):
        try:
            ast.parse(code)
            print(f"SUCCESS: Code valid after {iteration} iteration(s)")
            return code
        except SyntaxError as e:
            line_num = e.lineno or 1
            print(f"Iteration {iteration}: Error at line {line_num} - {e.msg}")
            
            lines = code.split('\n')
            if line_num <= len(lines):
                # Comment out the problematic line
                lines[line_num - 1] = f"# SYNTAX-ERROR: {lines[line_num - 1]}"
                code = '\n'.join(lines)
            else:
                print(f"Line {line_num} out of range")
                break
    
    return code

def main():
    input_file = 'user_input_files/pasted-text-2026-02-03T17-19-17.txt'
    output_file = 'output/post_processed_final.py'
    
    print(f"Reading: {input_file}")
    with open(input_file, 'r') as f:
        code = f.read()
    
    print("Step 1: Simple fixes...")
    code = simple_fixes(code)
    
    print("Step 2: Running Black...")
    code = run_black(code)
    
    print("Step 3: Iterative fixing...")
    code = iterative_fix(code)
    
    # Write output
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w') as f:
        f.write(code)
    
    print(f"\nOutput: {output_file}")
    
    # Final check
    try:
        ast.parse(code)
        print("FINAL CHECK: Code is valid!")
    except SyntaxError as e:
        print(f"FINAL CHECK: Still has errors at line {e.lineno}")

if __name__ == '__main__':
    main()
