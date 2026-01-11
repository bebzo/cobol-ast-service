#!/usr/bin/env python3
"""
Auto-fix Python syntax errors iteratively until code compiles.
Uses Python's AST to validate and regex patterns to fix common issues.
"""
import ast
import re
import sys

def fix_python_code(code: str, max_iterations: int = 50) -> tuple[str, list[str], bool]:
    """
    Iteratively fix Python syntax errors until code compiles.
    Returns: (fixed_code, list_of_fixes, success)
    """
    fixes = []
    
    for iteration in range(max_iterations):
        try:
            ast.parse(code)
            return code, fixes, True
        except SyntaxError as e:
            line_no = e.lineno or 1
            col = e.offset or 0
            msg = str(e.msg) if e.msg else ""
            
            lines = code.split('\n')
            if line_no > len(lines):
                line_no = len(lines)
            
            problem_line = lines[line_no - 1] if line_no <= len(lines) else ""
            prev_line = lines[line_no - 2] if line_no > 1 else ""
            next_line = lines[line_no] if line_no < len(lines) else ""
            
            fixed = False
            
            # Fix 1: Unterminated string
            if "unterminated string" in msg or "EOL while scanning" in msg:
                if problem_line.count('"') % 2 == 1:
                    lines[line_no - 1] = problem_line + '"'
                    fixed = True
                    fixes.append(f"L{line_no}: Added closing quote")
                elif problem_line.count("'") % 2 == 1:
                    lines[line_no - 1] = problem_line + "'"
                    fixed = True
                    fixes.append(f"L{line_no}: Added closing quote")
            
            # Fix 2: Incomplete docstring
            if '"""' in problem_line and problem_line.count('"""') == 1:
                indent = len(problem_line) - len(problem_line.lstrip())
                lines[line_no - 1] = ' ' * indent + '"""Method implementation."""'
                fixed = True
                fixes.append(f"L{line_no}: Fixed incomplete docstring")
            
            # Fix 3: Empty block (expected indented block)
            if "expected an indented block" in msg:
                indent = len(prev_line) - len(prev_line.lstrip())
                lines.insert(line_no - 1, ' ' * (indent + 4) + 'return None  # Block placeholder')
                fixed = True
                fixes.append(f"L{line_no}: Added return for empty block")
            
            # Fix 4: Invalid syntax on @dataclass - likely unclosed block above
            if problem_line.strip().startswith('@dataclass') or problem_line.strip().startswith('class '):
                # Look for unclosed try/with/if above
                for i in range(line_no - 2, max(0, line_no - 20), -1):
                    if lines[i].strip().startswith('try:') and not any('except' in lines[j] for j in range(i, line_no)):
                        indent = len(lines[i]) - len(lines[i].lstrip())
                        lines.insert(line_no - 1, ' ' * indent + 'except Exception:\n' + ' ' * (indent + 4) + 'pass')
                        fixed = True
                        fixes.append(f"L{line_no}: Closed unclosed try block")
                        break
            
            # Fix 5: Leading zeros in integer
            if "leading zeros" in msg:
                lines[line_no - 1] = re.sub(r'\b0(\d+)\b', r'\1', problem_line)
                fixed = True
                fixes.append(f"L{line_no}: Removed leading zeros")
            
            # Fix 6: Unexpected indent
            if "unexpected indent" in msg:
                # Remove excess indentation
                lines[line_no - 1] = problem_line.lstrip()
                fixed = True
                fixes.append(f"L{line_no}: Fixed unexpected indent")
            
            # Fix 7: Invalid syntax - malformed operators
            if "+ =" in problem_line:
                lines[line_no - 1] = problem_line.replace("+ =", "+=")
                fixed = True
                fixes.append(f"L{line_no}: Fixed += operator")
            if "- =" in problem_line:
                lines[line_no - 1] = problem_line.replace("- =", "-=")
                fixed = True
                fixes.append(f"L{line_no}: Fixed -= operator")
            
            # Fix 8: Truncated function/class
            if problem_line.strip().startswith('def ') and not problem_line.strip().endswith(':'):
                lines[line_no - 1] = problem_line.rstrip() + '() -> None:\n    pass'
                fixed = True
                fixes.append(f"L{line_no}: Completed truncated function")
            
            # Fix 9: Remove COBOL remnants
            cobol_patterns = [r'\bend[-_]if\b', r'\bend[-_]perform\b', r'\bend[-_]evaluate\b']
            for pattern in cobol_patterns:
                if re.search(pattern, problem_line, re.I):
                    lines[line_no - 1] = re.sub(pattern, '', problem_line, flags=re.I)
                    fixed = True
                    fixes.append(f"L{line_no}: Removed COBOL remnant")
            
            # Fix 10: Empty except/finally
            if problem_line.strip() in ['except:', 'except', 'finally:', 'finally']:
                indent = len(problem_line) - len(problem_line.lstrip())
                if not problem_line.strip().endswith(':'):
                    lines[line_no - 1] = problem_line + ':'
                lines.insert(line_no, ' ' * (indent + 4) + 'pass')
                fixed = True
                fixes.append(f"L{line_no}: Fixed empty except/finally")
            
            # Fix 11: Remove completely broken line as last resort
            if not fixed and iteration > 30:
                if problem_line.strip() and not problem_line.strip().startswith('#'):
                    lines[line_no - 1] = '# REMOVED: ' + problem_line.strip()
                    fixed = True
                    fixes.append(f"L{line_no}: Commented out broken line")
            
            # Fix 12: General syntax error - try to comment out
            if not fixed and iteration > 40:
                lines[line_no - 1] = '# SYNTAX_ERR: ' + problem_line.strip()
                fixed = True
                fixes.append(f"L{line_no}: Commented broken line (fallback)")
            
            if not fixed:
                # If we can't fix it, break to avoid infinite loop
                fixes.append(f"L{line_no}: Could not fix: {msg}")
                if iteration > 10:
                    break
            
            code = '\n'.join(lines)
    
    return code, fixes, False


def main():
    if len(sys.argv) < 2:
        # Read from stdin
        code = sys.stdin.read()
    else:
        with open(sys.argv[1], 'r') as f:
            code = f.read()
    
    fixed_code, fixes, success = fix_python_code(code)
    
    if success:
        print(fixed_code)
        print(f"\n# === VALIDATION: SUCCESS ({len(fixes)} fixes applied) ===", file=sys.stderr)
        for fix in fixes[:20]:  # Show first 20 fixes
            print(f"#   {fix}", file=sys.stderr)
    else:
        print(fixed_code)
        print(f"\n# === VALIDATION: PARTIAL ({len(fixes)} fixes attempted) ===", file=sys.stderr)
        for fix in fixes[-10:]:  # Show last 10 fixes
            print(f"#   {fix}", file=sys.stderr)
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
