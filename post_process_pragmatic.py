#!/usr/bin/env python3
"""
Simple, pragmatic post-processor using Black + basic fixes
"""

import subprocess
import sys
import os

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

def simple_fixes(code: str) -> str:
    """Apply simple fixes for obvious issues."""
    lines = code.split('\n')
    fixed = []
    
    for line in lines:
        stripped = line.rstrip()
        # Fix stray trailing quotes (line ending with "' after )")
        if stripped.endswith("'") and stripped.endswith(")'"):
            fixed.append(stripped[:-1])
        # Fix stray quote at end of line after )
        elif stripped.endswith(")'") and stripped.count("'") > 2:
            # Line has extra quotes at the end
            # Find the last ) and keep everything up to and including it
            last_paren = stripped.rfind(")")
            if last_paren > 0:
                fixed.append(stripped[:last_paren+1])
            else:
                fixed.append(line)
        else:
            fixed.append(line)
    
    return '\n'.join(fixed)

def main():
    input_file = 'user_input_files/pasted-text-2026-02-03T17-19-17.txt'
    output_file = 'output/post_processed_pragmatic.py'
    
    print(f"Reading: {input_file}")
    with open(input_file, 'r') as f:
        code = f.read()
    
    # Step 1: Simple fixes
    print("Step 1: Simple fixes...")
    code = simple_fixes(code)
    
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
    except SyntaxError as e:
        print(f"WARNING: Still has syntax errors at line {e.lineno}")
        print(f"Error: {e.msg}")

if __name__ == '__main__':
    main()
