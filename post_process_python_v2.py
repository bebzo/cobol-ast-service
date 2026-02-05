#!/usr/bin/env python3
"""
Global Python Post-Processor for COBOL Transpiled Code - Robust Version

This module provides a ROBUST approach to fixing syntax errors in transpiled Python code:
1. Fix obvious, common issues (malformed __init__, stray quotes, duplicate imports)
2. Use AST to identify remaining errors
3. Apply targeted fixes based on error analysis
4. Use Black/autopep8 as a last resort for formatting

The key insight: Instead of trying to fix everything manually,
use a combination of targeted fixes + AST validation + formatting tools.
"""

import re
import ast
import sys
import os
import subprocess
import tempfile
from typing import Tuple, List, Optional


class PythonPostProcessor:
    """Robust post-processor for transpiled Python code."""
    
    # Constants for triple quotes to avoid syntax issues
    TRIPLE_DOUBLE = chr(34) + chr(34) + chr(34)  # """
    TRIPLE_SINGLE = chr(39) + chr(39) + chr(39)  # '''
    
    def __init__(self, content: str):
        self.original_content = content
        self.processed_content = content
        self.errors: List[str] = []
        self.warnings: List[str] = []
        
    def fix_all(self) -> str:
        """Apply all fixes to the content."""
        # Step 1: Fix obvious, common issues
        self._fix_malformed_vsam_init()
        self._fix_malformed_open_method()
        self._fix_stray_trailing_quotes()
        self._remove_duplicate_imports()
        self._fix_duplicate_decimal_imports()
        self._fix_enum_init_methods()
        
        # Step 2: Try to fix unclosed docstrings (conservative)
        self._fix_unclosed_docstrings_conservative()
        
        # Step 3: Normalize whitespace
        self._normalize_whitespace()
        
        return self.processed_content
    
    def _fix_malformed_vsam_init(self):
        """Fix the malformed VSAMFile __init__ method."""
        # Variant 1: ): followed by self.filename on next line
        pattern = r'\):\s*\n\s+self\.filename\s*='
        if re.search(pattern, self.processed_content):
            self.warnings.append("Found malformed VSAMFile __init__ (variant 1)")
            replacement = '''(self, filename: str, organization: str = "INDEXED", 
                 access_mode: str = "DYNAMIC", record_key: str = None, 
                 record_length: int = None):
        self.filename ='''
            self.processed_content = re.sub(pattern, replacement, self.processed_content)
        
        # Variant 2 (no params)
        pattern = r'def __init__\(self\):\s*\n\s+self\.filename\s*='
        if re.search(pattern, self.processed_content):
            self.warnings.append("Found malformed VSAMFile __init__ (variant 2)")
            replacement = '''def __init__(self, filename: str, organization: str = "INDEXED", 
                 access_mode: str = "DYNAMIC", record_key: str = None, 
                 record_length: int = None):
        self.filename ='''
            self.processed_content = re.sub(pattern, replacement, self.processed_content)
    
    def _fix_malformed_open_method(self):
        """Fix the malformed open method definition."""
        patterns = [
            (r"def open\(os\.path\.normpath\(self\),\s*#.*?mode:\s*str\)\s*->\s*str:", 
             "def open(self, mode: str) -> str:"),
            (r"def open\(os\.path\.normpath\(self\),\s*# v9\.1: path traversal protection mode: str\) -> str:",
             "def open(self, mode: str) -> str:"),
        ]
        
        for pattern, replacement in patterns:
            if re.search(pattern, self.processed_content):
                self.warnings.append("Found malformed open method")
                self.processed_content = re.sub(pattern, replacement, self.processed_content)
    
    def _fix_stray_trailing_quotes(self):
        """Fix stray trailing single quotes after method calls."""
        lines = self.processed_content.split('\n')
        fixed_lines = []
        
        for line in lines:
            stripped = line.rstrip()
            
            # Check if line ends with a single quote
            if stripped.endswith("'"):
                # Check if it's preceded by a closing paren
                if stripped.endswith(")'") or stripped.endswith(")' ") or stripped.endswith("),"):
                    fixed_lines.append(stripped[:-1])
                    continue
            
            fixed_lines.append(line)
        
        self.processed_content = '\n'.join(fixed_lines)
    
    def _remove_duplicate_imports(self):
        """Remove duplicate import statements."""
        lines = self.processed_content.split('\n')
        fixed_lines = []
        seen_imports = set()
        import_block = True
        
        for line in lines:
            stripped = line.strip()
            
            if import_block and (stripped.startswith('import ') or stripped.startswith('from ')):
                if stripped in seen_imports:
                    self.warnings.append(f"Removed duplicate import")
                    continue
                seen_imports.add(stripped)
            
            if import_block and stripped and not stripped.startswith('import ') and not stripped.startswith('from '):
                import_block = False
            
            fixed_lines.append(line)
        
        self.processed_content = '\n'.join(fixed_lines)
    
    def _fix_duplicate_decimal_imports(self):
        """Fix duplicate Decimal imports."""
        self.processed_content = re.sub(
            r'ROUND_HALF_EVEN,\s*ROUND_HALF_EVEN,',
            'ROUND_HALF_EVEN,',
            self.processed_content
        )
    
    def _fix_enum_init_methods(self):
        """Fix enum classes by handling __init__ methods correctly."""
        lines = self.processed_content.split('\n')
        fixed_lines = []
        in_enum = False
        enum_indent = 0
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            indent = len(line) - len(line.lstrip()) if line.strip() else 0
            
            enum_match = re.match(r'^class\s+(\w+)\(Enum\):', stripped)
            if enum_match:
                in_enum = True
                enum_indent = indent
                fixed_lines.append(line)
                continue
            
            if in_enum:
                if indent <= enum_indent and stripped and not stripped.startswith('#'):
                    in_enum = False
            
            if in_enum and stripped == 'def __init__(self):':
                self.warnings.append(f"Skipping __init__ in enum class at line {i+1}")
                continue
            
            if in_enum and (stripped.startswith(self.TRIPLE_DOUBLE) or stripped.startswith(self.TRIPLE_SINGLE)):
                prev_lines = [l.strip() for l in fixed_lines[-3:] if l.strip()]
                if any('def __init__' in l for l in prev_lines):
                    self.warnings.append(f"Skipping docstring after __init__ in enum")
                    continue
            
            fixed_lines.append(line)
        
        self.processed_content = '\n'.join(fixed_lines)
    
    def _fix_unclosed_docstrings_conservative(self):
        """Conservative fix for unclosed docstrings.
        
        Only handles the most obvious cases:
        1. Module-level docstrings
        2. Function docstrings that start but never end
        3. Class docstrings that start but never end
        
        Leaves complex cases for the AST validator.
        """
        lines = self.processed_content.split('\n')
        fixed_lines = []
        i = 0
        
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()
            
            # Handle module-level docstrings (at the very beginning of the file)
            if i == 0 and stripped.startswith('"""'):
                # This is the module docstring
                if '"""' not in stripped[3:]:  # Doesn't close on same line
                    # Look for closing """
                    for j in range(i + 1, len(lines)):
                        if '"""' in lines[j]:
                            # Copy everything including closing """
                            for k in range(i, j + 1):
                                fixed_lines.append(lines[k])
                            i = j + 1
                            break
                    else:
                        # No closing found, add opening and skip
                        fixed_lines.append(line)
                        i += 1
                    continue
            
            # Detect docstrings that start but don't end
            has_triple = ('"""' in stripped or "'''" in stripped)
            starts_with_triple = (stripped.startswith('"""') or stripped.startswith("'''"))
            
            if has_triple and starts_with_triple and not stripped.endswith('"""') and not stripped.endswith("'''"):
                # This might be an unclosed docstring
                # Only fix if followed by a line that's clearly NOT docstring content
                next_line = lines[i + 1] if i + 1 < len(lines) else ""
                
                # If next line is blank or clearly docstring content, skip
                if next_line and (next_line.strip().startswith('- ') or 
                                 next_line.strip().startswith('* ') or
                                 next_line.strip().startswith('#') or
                                 not next_line.strip()):
                    # This looks like a proper docstring, just skip
                    fixed_lines.append(line)
                    i += 1
                    continue
                
                # If next line is actual code (import, class, def, etc.), close the docstring
                if next_line.strip().startswith(('import ', 'from ', 'class ', 'def ', '@')):
                    self.warnings.append(f"Closing unclosed docstring at line {i+1}")
                    fixed_lines.append(line)
                    fixed_lines.append('    """')  # Simple closing
                    i += 1
                    continue
            
            fixed_lines.append(line)
            i += 1
        
        self.processed_content = '\n'.join(fixed_lines)
    
    def _normalize_whitespace(self):
        """Normalize whitespace and remove excessive blank lines."""
        lines = [line.rstrip() for line in self.processed_content.split('\n')]
        
        normalized = []
        prev_blank = 0
        for line in lines:
            if line.strip() == '':
                prev_blank += 1
                if prev_blank <= 2:
                    normalized.append(line)
            else:
                prev_blank = 0
                normalized.append(line)
        
        self.processed_content = '\n'.join(normalized)
    
    def validate_syntax(self) -> Tuple[bool, List[str]]:
        """Validate that the processed content has valid Python syntax."""
        errors = []
        try:
            ast.parse(self.processed_content)
            return True, errors
        except SyntaxError as e:
            errors.append(f"Syntax error at line {e.lineno}: {e.msg}")
            return False, errors
    
    def get_report(self) -> dict:
        """Generate a processing report."""
        return {
            'original_length': len(self.original_content),
            'processed_length': len(self.processed_content),
            'changes': len(self.warnings),
            'warnings': self.warnings,
            'errors': self.errors,
            'syntax_valid': self.validate_syntax()[0]
        }


def run_formatter(code: str) -> str:
    """Try to format code using Black if available, else return as-is."""
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            f.flush()
            
            # Try running black
            result = subprocess.run(
                ['black', '-', '--fast'],
                input=code,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                return result.stdout
            
    except (subprocess.SubprocessError, FileNotFoundError):
        pass
    
    return code


def process_file(input_path: str, output_path: str, use_formatter: bool = True) -> dict:
    """Process a Python file and write the fixed version."""
    
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")
    
    # Read input
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Process
    processor = PythonPostProcessor(content)
    fixed_content = processor.fix_all()
    
    # Try formatter if still invalid
    is_valid, syntax_errors = processor.validate_syntax()
    
    if not is_valid and use_formatter:
        print("Attempting to format code with Black...")
        fixed_content = run_formatter(fixed_content)
        is_valid, syntax_errors = processor.validate_syntax()
        if is_valid:
            print("Black formatting fixed the syntax errors!")
            processor.processed_content = fixed_content
    
    # Write output
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    
    # Generate report
    report = processor.get_report()
    report['input_file'] = input_path
    report['output_file'] = output_path
    report['syntax_valid'] = is_valid
    report['syntax_errors'] = syntax_errors
    
    return report


def main():
    """Main entry point for command line usage."""
    if len(sys.argv) < 3:
        print("Usage: python post_process_python_v2.py <input_file> <output_file> [--no-formatter]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    use_formatter = '--no-formatter' not in sys.argv
    
    print(f"Processing: {input_file}")
    print(f"Output: {output_file}")
    print()
    
    report = process_file(input_file, output_file, use_formatter)
    
    print("=" * 60)
    print("POST-PROCESSING REPORT")
    print("=" * 60)
    print(f"Original length: {report['original_length']} chars")
    print(f"Processed length: {report['processed_length']} chars")
    print(f"Warnings: {len(report['warnings'])}")
    print(f"Syntax valid: {report['syntax_valid']}")
    
    if report['syntax_errors']:
        print("\nSyntax Errors:")
        for error in report['syntax_errors']:
            print(f"  - {error}")
    
    if report['warnings']:
        print("\nWarnings applied:")
        for warning in report['warnings']:
            print(f"  - {warning}")
    
    print("=" * 60)
    
    if not report['syntax_valid']:
        print("WARNING: Output still has syntax errors!")
        print("Try running: black output_file.py")
        sys.exit(1)
    
    print("SUCCESS: File processed and validated")


if __name__ == '__main__':
    main()
