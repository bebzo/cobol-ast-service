#!/usr/bin/env python3
"""
Definitive Python Post-Processor for COBOL Transpiled Code - Conservative Version

This module provides fixes for critical syntax errors in transpiled Python code:
- Fix malformed VSAMFile __init__ method (missing self parameter)
- Fix malformed open method definition
- Fix enum classes with incorrectly placed __init__ methods
- Remove duplicate imports
- Fix duplicate Decimal imports

Usage:
    python post_process_python.py input.py output.py
"""

import re
import ast
import sys
import os
from typing import Tuple, List


class PythonPostProcessor:
    """Conservative post-processor for transpiled Python code."""
    
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
        self._fix_malformed_vsam_init()
        self._fix_malformed_vsam_init_2()
        self._fix_malformed_open_method()
        self._fix_unclosed_docstrings()
        self._fix_enum_init_methods()
        self._remove_duplicate_imports()
        self._fix_duplicate_decimal_imports()
        self._fix_stray_trailing_quotes()
        self._normalize_whitespace()
        return self.processed_content
    
    def _fix_malformed_vsam_init(self):
        """Fix the malformed VSAMFile __init__ method - variant 1."""
        # Match: ): followed by self.filename on next line
        pattern = r'\):\s*\n\s+self\.filename\s*='
        if re.search(pattern, self.processed_content):
            self.warnings.append("Found malformed VSAMFile __init__ (variant 1)")
            replacement = '''(self, filename: str, organization: str = "INDEXED", 
                 access_mode: str = "DYNAMIC", record_key: str = None, 
                 record_length: int = None):
        self.filename ='''
            self.processed_content = re.sub(pattern, replacement, self.processed_content)
    
    def _fix_malformed_vsam_init_2(self):
        """Fix the malformed VSAMFile __init__ method - variant 2 (no params)."""
        # Match: def __init__(self): followed by self.filename
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
        # Match the malformed open method signature
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
    
    def _fix_unclosed_docstrings(self):
        """Fix docstrings that are not properly closed.
        
        This handles the case where a function/class docstring starts but never
        closes. The pattern is:
        - Any line starting with triple quotes that doesn't end with triple quotes
        - Followed by content that should be in the docstring
        - Then followed by actual code (assignments, decorators, etc.)
        
        Also handles the case where a function definition is followed by
        docstring-like content but without opening triple quotes.
        """
        lines = self.processed_content.split('\n')
        fixed_lines = []
        i = 0
        
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()
            
            # Detect any line that starts with triple quotes (potential docstring start)
            has_triple_double = self.TRIPLE_DOUBLE in stripped
            has_triple_single = self.TRIPLE_SINGLE in stripped
            starts_with_triple = (stripped.startswith(self.TRIPLE_DOUBLE) or 
                                 stripped.startswith(self.TRIPLE_SINGLE))
            
            if (has_triple_double or has_triple_single) and starts_with_triple:
                # Determine which quote style is used
                quote_style = 'double' if has_triple_double else 'single'
                triple = self.TRIPLE_DOUBLE if quote_style == 'double' else self.TRIPLE_SINGLE
                
                # Check if docstring closes on the same line
                if stripped.endswith(triple):
                    fixed_lines.append(line)
                    i += 1
                    continue
                
                # Look ahead for closing quote or code
                docstring_closed = False
                code_start_line = None
                
                # Check if we're inside a @contextmanager function (look back)
                is_in_contextmanager = False
                for k in range(max(0, i - 10), i):
                    if lines[k].strip().startswith('@contextmanager'):
                        is_in_contextmanager = True
                        break
                
                for j in range(i + 1, len(lines)):
                    line_j = lines[j]
                    stripped_j = line_j.strip()
                    
                    # Check for closing quote
                    if triple in stripped_j:
                        docstring_closed = True
                        break
                    
                    # Check for next function/class definition
                    if stripped_j.startswith('def ') or stripped_j.startswith('class '):
                        break
                    
                    # Check if this is actual code (not docstring content)
                    is_assignment = ('=' in stripped_j and 
                                   not stripped_j.startswith('#') and
                                   not stripped_j.startswith('-'))
                    
                    is_decorator = stripped_j.startswith('@')
                    
                    is_code_comment = (stripped_j.startswith('#') and 
                                     (stripped_j.startswith('# COBOL') or
                                      stripped_j.startswith('# Original') or
                                      stripped_j.startswith('# v') or
                                      stripped_j.startswith('# Standard') or
                                      stripped_j.startswith('# Priority') or
                                      stripped_j.startswith('# In production')))
                    
                    # Docstring content indicators:
                    is_bullet_point = stripped_j.startswith('- ') or stripped_j.startswith('* ')
                    is_checklist = stripped_j.startswith('[ ]') or stripped_j.startswith('[x]') or stripped_j.startswith('[X]')
                    
                    # Actual code indicators (NOT docstring content):
                    # - Import statements
                    # - Decorators
                    # - Assignments (except in docstrings)
                    is_import = stripped_j.startswith('import ') or stripped_j.startswith('from ')
                    
                    # In @contextmanager functions, 'with' statements are valid code
                    # so we should NOT treat them as docstring content
                    is_with_statement = stripped_j.startswith('with ')
                    
                    # If we find actual code (import, decorator, assignment NOT in list)
                    # OR if we're in a contextmanager and find a 'with' statement
                    if is_import or is_decorator or (is_assignment and not is_bullet_point and not is_checklist):
                        code_start_line = j
                        break
                    
                    if is_code_comment and not is_bullet_point and not is_checklist:
                        code_start_line = j
                        break
                    
                    if is_in_contextmanager and is_with_statement:
                        code_start_line = j
                        break
                
                if code_start_line is not None and not docstring_closed:
                    # Docstring is unclosed - close it
                    self.warnings.append(f"Closing unclosed docstring starting at line {i+1}")
                    fixed_lines.append(line)  # Opening line
                    
                    # Add docstring content up to code start
                    for j in range(i + 1, code_start_line):
                        fixed_lines.append(lines[j])
                    
                    # Determine appropriate indentation for closing quote
                    # Use the indentation of the opening quote line
                    indent = len(line) - len(line.lstrip())
                    
                    fixed_lines.append(' ' * indent + triple)  # Closing line
                    
                    # Process code from code_start_line
                    i = code_start_line
                elif docstring_closed:
                    # Docstring was properly closed - add all content
                    fixed_lines.append(line)
                    for j in range(i + 1, len(lines)):
                        fixed_lines.append(lines[j])
                        if triple in lines[j].strip():
                            i = j + 1
                            break
                    else:
                        i = len(lines)
                else:
                    # Fallback - just add the line
                    fixed_lines.append(line)
                    i += 1
            
            # Handle function definitions followed by docstring-like content (without opening """)
            elif stripped.startswith('def '):
                func_def = line
                i += 1
                fixed_lines.append(func_def)
                
                # Look ahead to see if next lines look like docstring content
                docstring_start = None
                docstring_end = None
                docstring_indent = 4  # Standard indentation for function body
                
                for j in range(i, min(i + 40, len(lines))):
                    line_j = lines[j]
                    stripped_j = line_j.strip()
                    
                    # Stop if we hit another definition
                    if stripped_j.startswith('def ') or stripped_j.startswith('class '):
                        break
                    
                    # Look for actual code that indicates end of docstring
                    # (try, with, return, etc.)
                    is_code_start = (
                        stripped_j.startswith('try:') or
                        stripped_j.startswith('except:') or
                        stripped_j.startswith('with ') or
                        stripped_j.startswith('return ') or
                        stripped_j.startswith('if ') or
                        stripped_j.startswith('for ') or
                        stripped_j.startswith('while ') or
                        stripped_j.startswith('raise ')
                    )
                    
                    # Look for docstring-like content
                    is_docstring_header = (
                        stripped_j.startswith('Args:') or
                        stripped_j.startswith('Returns:') or
                        stripped_j.startswith('Parameters:') or
                        stripped_j.startswith('Raises:') or
                        stripped_j.startswith('Example:') or
                        stripped_j.startswith('Note:') or
                        stripped_j.startswith('Warning:') or
                        stripped_j.startswith('Attributes:') or
                        stripped_j.startswith('Members:')
                    )
                    
                    # Look for indented content that should be in docstring
                    is_indented_content = (
                        line_j.startswith('    ') and  # 4 spaces
                        stripped_j and 
                        not stripped_j.startswith('#') and
                        not is_code_start
                    )
                    
                    if docstring_start is None and (is_docstring_header or is_indented_content):
                        docstring_start = j
                    
                    if docstring_start is not None and is_code_start:
                        docstring_end = j
                        break
                
                if docstring_start is not None and docstring_end is not None:
                    # Add opening triple quote with proper indentation
                    fixed_lines.append(' ' * docstring_indent + triple)
                    
                    # Add all docstring content (from original line after def to before code)
                    for j in range(docstring_start, docstring_end):
                        # Re-indent content to proper docstring indentation
                        orig_line = lines[j]
                        if orig_line.strip():
                            # Keep original indentation or use docstring indent
                            fixed_lines.append(' ' * docstring_indent + orig_line.strip())
                        else:
                            fixed_lines.append('')
                    
                    # Add closing triple quote
                    fixed_lines.append(' ' * docstring_indent + triple)
                    
                    # Skip the docstring content lines and process code
                    i = docstring_end
                continue
            
            else:
                fixed_lines.append(line)
                i += 1
        
        self.processed_content = '\n'.join(fixed_lines)
    
    def _fix_enum_init_methods(self):
        """Fix enum classes by handling __init__ methods correctly."""
        lines = self.processed_content.split('\n')
        fixed_lines = []
        in_enum = False
        enum_indent = 0
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            indent = len(line) - len(line.lstrip()) if line.strip() else 0
            
            # Detect enum class start
            enum_match = re.match(r'^class\s+(\w+)\(Enum\):', stripped)
            if enum_match:
                in_enum = True
                enum_indent = indent
                fixed_lines.append(line)
                continue
            
            # Detect when we leave enum scope
            if in_enum:
                if indent <= enum_indent and stripped and not stripped.startswith('#'):
                    in_enum = False
            
            # Fix __init__ methods in enums - convert to class-level docstring
            if in_enum and stripped == 'def __init__(self):':
                # Skip this line and the docstring that follows
                self.warnings.append(f"Skipping __init__ in enum class at line {i+1}")
                continue
            
            # Also handle the case where __init__ has a docstring after it
            if in_enum and (stripped.startswith(self.TRIPLE_DOUBLE) or stripped.startswith(self.TRIPLE_SINGLE)):
                # Check if this docstring belongs to __init__
                # Look back at previous lines
                prev_lines = [l.strip() for l in fixed_lines[-3:] if l.strip()]
                if any('def __init__' in l for l in prev_lines):
                    self.warnings.append(f"Skipping docstring after __init__ in enum")
                    continue
            
            fixed_lines.append(line)
        
        self.processed_content = '\n'.join(fixed_lines)
    
    def _remove_duplicate_imports(self):
        """Remove duplicate import statements."""
        lines = self.processed_content.split('\n')
        seen_imports = set()
        fixed_lines = []
        import_block = True
        
        for line in lines:
            stripped = line.strip()
            
            # Track imports (only in the import block at the top)
            if import_block and (stripped.startswith('import ') or stripped.startswith('from ')):
                if stripped in seen_imports:
                    self.warnings.append(f"Removed duplicate import")
                    continue
                seen_imports.add(stripped)
            
            # Stop tracking import block after first non-import, non-blank line
            if import_block and stripped and not stripped.startswith('import ') and not stripped.startswith('from '):
                import_block = False
            
            fixed_lines.append(line)
        
        self.processed_content = '\n'.join(fixed_lines)
    
    def _fix_duplicate_decimal_imports(self):
        """Fix duplicate Decimal imports."""
        # Remove inline duplicates of ROUND_HALF_EVEN
        self.processed_content = re.sub(
            r'ROUND_HALF_EVEN,\s*ROUND_HALF_EVEN,',
            'ROUND_HALF_EVEN,',
            self.processed_content
        )
    
    def _fix_stray_trailing_quotes(self):
        """Fix stray trailing single quotes after method calls.
        
        This handles the transpiler bug that generates lines like:
        sanitized = sanitized.replace("'", "''")'
        where there's an extra ' at the end.
        """
        lines = self.processed_content.split('\n')
        fixed_lines = []
        
        for line in lines:
            stripped = line.rstrip()
            
            # Check if line ends with a single quote
            if stripped.endswith("'"):
                # Check if it's preceded by a closing paren
                if stripped.endswith(")'") or stripped.endswith(")' ") or stripped.endswith("),"):
                    # This is likely a stray quote - remove it
                    fixed_lines.append(stripped[:-1])
                    continue
            
            fixed_lines.append(line)
        
        self.processed_content = '\n'.join(fixed_lines)
    
    def _normalize_whitespace(self):
        """Normalize whitespace and remove excessive blank lines."""
        # Remove trailing whitespace
        lines = [line.rstrip() for line in self.processed_content.split('\n')]
        
        # Remove excessive blank lines (more than 2 consecutive)
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


def process_file(input_path: str, output_path: str) -> dict:
    """Process a Python file and write the fixed version."""
    
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")
    
    # Read input
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Process
    processor = PythonPostProcessor(content)
    fixed_content = processor.fix_all()
    
    # Validate syntax
    is_valid, syntax_errors = processor.validate_syntax()
    
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
        print("Usage: python post_process_python.py <input_file> <output_file>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    print(f"Processing: {input_file}")
    print(f"Output: {output_file}")
    print()
    
    report = process_file(input_file, output_file)
    
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
        print("ERROR: Output has syntax errors!")
        sys.exit(1)
    
    print("SUCCESS: File processed and validated")


if __name__ == '__main__':
    main()
