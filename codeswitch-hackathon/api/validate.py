"""Python validation endpoint - ensures code compiles with aggressive fixes."""
from http.server import BaseHTTPRequestHandler
import json
import ast
import re

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(body)
            python_code = data.get('code', '')
            result = validate_and_fix(python_code)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()


def validate_and_fix(code: str) -> dict:
    """Validate Python code and fix ALL errors aggressively."""
    original_lines = len(code.split('\n'))
    fixes_applied = 0
    
    # === PHASE 1: Pre-processing fixes ===
    
    # Fix unbalanced triple quotes (must be even)
    if code.count('"""') % 2 == 1:
        code += '\n"""'
        fixes_applied += 1
    
    # Fix truncated function definitions
    lines = code.split('\n')
    for i, line in enumerate(lines):
        s = line.rstrip()
        if s.startswith('def ') and '(' in s:
            if not s.endswith(':'):
                if ')' not in s:
                    lines[i] = s + ') -> None:'
                else:
                    lines[i] = s + ':'
                fixes_applied += 1
    code = '\n'.join(lines)
    
    # Fix truncated class definitions
    code = re.sub(r'^(class\s+\w+)\s*$', r'\1:', code, flags=re.MULTILINE)
    
    # Fix broken docstrings on multiple lines
    code = re.sub(r'"""([^"]*)\n([^"]*representing[^"]*""")', r'"""\1 \2', code)
    
    # Remove orphaned docstring fragments
    code = re.sub(r'^\s*[a-z_]+\s+representing\s+\w+\.\s*"""', '', code, flags=re.MULTILINE)
    
    # Fix unclosed parentheses in function calls (line ends with comma or open paren)
    lines = code.split('\n')
    for i, line in enumerate(lines):
        s = line.rstrip()
        if s.endswith(',') and i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            if next_line.startswith('def ') or next_line.startswith('class ') or next_line == '':
                lines[i] = s[:-1] + ')'
                fixes_applied += 1
    code = '\n'.join(lines)
    
    # === PHASE 2: Iterative AST-based fixing ===
    max_iterations = 200
    fixed_lines_set = set()
    
    for iteration in range(max_iterations):
        try:
            ast.parse(code)
            return {
                'valid': True,
                'code': code,
                'fixes': fixes_applied,
                'lines': len(code.split('\n')),
                'original_lines': original_lines
            }
        except SyntaxError as e:
            line_num = e.lineno or 1
            lines = code.split('\n')
            
            if line_num > len(lines):
                # EOF error - likely unclosed string/paren
                code += '\n"""'
                fixes_applied += 1
                continue
            
            error_line = lines[line_num - 1]
            error_msg = str(e.msg).lower() if e.msg else ''
            
            # Already tried this line - remove it entirely
            if line_num in fixed_lines_set:
                lines[line_num - 1] = ''
                code = '\n'.join(lines)
                fixes_applied += 1
                continue
            
            fixed_lines_set.add(line_num)
            
            # Specific error handlers
            if 'unterminated string' in error_msg or 'unterminated triple' in error_msg:
                # Try closing the string
                if '"""' in error_line:
                    lines[line_num - 1] = error_line + '"""'
                elif "'''" in error_line:
                    lines[line_num - 1] = error_line + "'''"
                elif '"' in error_line:
                    lines[line_num - 1] = error_line + '"'
                elif "'" in error_line:
                    lines[line_num - 1] = error_line + "'"
                else:
                    lines[line_num - 1] = '# ' + error_line
                fixes_applied += 1
            
            elif 'expected an indented block' in error_msg or 'indent' in error_msg:
                # Add pass statement to empty block
                # Find the previous line that needs a body
                indent = len(error_line) - len(error_line.lstrip())
                lines.insert(line_num - 1, ' ' * (indent + 4) + 'pass')
                fixes_applied += 1
            
            elif 'was never closed' in error_msg:
                # Unclosed paren/bracket
                if '(' in error_line and ')' not in error_line:
                    lines[line_num - 1] = error_line.rstrip() + ')'
                elif '[' in error_line and ']' not in error_line:
                    lines[line_num - 1] = error_line.rstrip() + ']'
                elif '{' in error_line and '}' not in error_line:
                    lines[line_num - 1] = error_line.rstrip() + '}'
                else:
                    lines[line_num - 1] = '# ' + error_line
                fixes_applied += 1
            
            elif 'invalid syntax' in error_msg or 'expected' in error_msg:
                # Comment out the line
                lines[line_num - 1] = '# SYNTAX: ' + error_line
                fixes_applied += 1
            
            else:
                # Generic: comment out
                lines[line_num - 1] = '# ERROR: ' + error_line
                fixes_applied += 1
            
            code = '\n'.join(lines)
    
    # Max iterations - force compile by removing all error lines
    return {
        'valid': False,
        'code': code,
        'fixes': fixes_applied,
        'lines': len(code.split('\n')),
        'original_lines': original_lines,
        'error': 'Max iterations reached'
    }
