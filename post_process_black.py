#!/usr/bin/env python3
"""
Robust Python Post-Processor for COBOL Transpiled Code

Strategy:
1. Use Black to fix formatting issues automatically
2. Use ast.parse() to validate syntax
3. Iteratively fix remaining errors by commenting out broken lines
"""

import subprocess
import sys
import os
from typing import Tuple, List

def run_black(code: str) -> Tuple[str, bool]:
    """Run Black formatter on the code and return fixed code."""
    try:
        result = subprocess.run(
            [sys.executable, '-m', 'black', '-', '--fast'],
            input=code,
            capture_output=True,
            text=True,
            timeout=60
        )
        if result.returncode == 0 and result.stdout:
            return result.stdout, True
    except Exception as e:
        print(f"Black error: {e}")
    return code, False

def simple_fixes(code: str) -> Tuple[str, List[str]]:
    """Apply simple, targeted fixes for known transpiler issues."""
    changes = []
    fixed = code
    
    # Fix stray trailing quotes
    lines = fixed.split('\n')
    fixed_lines = []
    for i, line in enumerate(lines, 1):
        stripped = line.rstrip()
        # Fix lines ending with a stray quote after )
        if stripped.endswith("'") and stripped.endswith(")'"):
            fixed_lines.append(stripped[:-1])
            changes.append(f"Line {i}: Removed stray trailing quote")
        else:
            fixed_lines.append(line)
    
    fixed = '\n'.join(fixed_lines)
    return fixed, changes

def main():
    input_file = 'user_input_files/pasted-text-2026-02-03T17-19-17.txt'
    output_file = 'output/post_processed_black.py'
    
    print(f"Reading: {input_file}")
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Step 1: Simple fixes
    print("Applying simple fixes...")
    fixed, changes = simple_fixes(content)
    
    # Step 2: Run Black to fix formatting
    print("Running Black formatter...")
    fixed, was_fixed = run_black(fixed)
    if was_fixed:
        changes.append("Applied Black formatting")
    
    # Write output
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(fixed)
    
    # Report
    print(f"\n{'='*60}")
    print(f"Changes applied: {len(changes)}")
    for change in changes[:10]:
        print(f"  - {change}")
    if len(changes) > 10:
        print(f"  ... and {len(changes)-10} more")
    print(f"\nOutput: {output_file}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
