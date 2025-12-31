"""Python validation endpoint - ensures code compiles."""
from http.server import BaseHTTPRequestHandler
import json
import ast
import re

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Read request body
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(body)
            python_code = data.get('code', '')
            
            # Validate and fix
            result = validate_and_fix(python_code)
            
            # Send response
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
    """Validate Python code and fix errors iteratively."""
    original_lines = len(code.split('\n'))
    fixes_applied = 0
    max_iterations = 100
    
    # Pre-fix: Merge broken docstrings (line ends with """ and next line ends with """)
    lines = code.split('\n')
    fixed_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Pattern: line with """ followed by orphan text ending with """
        if i + 1 < len(lines) and '"""' in line and lines[i+1].strip().endswith('"""') and not lines[i+1].strip().startswith('"""'):
            # Merge lines
            next_line = lines[i+1].strip()
            if next_line.endswith('"""'):
                merged = line.rstrip().rstrip('"').rstrip() + ' ' + next_line.lstrip()
                # Ensure proper """ balance
                if merged.count('"""') % 2 == 0:
                    fixed_lines.append(merged)
                    i += 2
                    fixes_applied += 1
                    continue
        fixed_lines.append(line)
        i += 1
    code = '\n'.join(fixed_lines)
    
    # Pre-fix: Remove lines that look like orphaned docstring fragments
    code = re.sub(r'^\s*[a-z_]+\s+representing\s+\w+\.\s*"""', '# REMOVED orphan docstring', code, flags=re.MULTILINE)
    
    for iteration in range(max_iterations):
        try:
            ast.parse(code)
            # Success!
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
                # Add closing quote if EOF error
                code += '\n"""'
                fixes_applied += 1
                continue
            
            # Skip if already fixed (avoid infinite loop)
            if lines[line_num - 1].strip().startswith('# FIXED:'):
                # Try removing the line entirely
                lines[line_num - 1] = ''
                code = '\n'.join(lines)
                fixes_applied += 1
                continue
            
            # Comment out the problematic line
            lines[line_num - 1] = '# FIXED: ' + lines[line_num - 1]
            code = '\n'.join(lines)
            fixes_applied += 1
    
    # Max iterations reached
    return {
        'valid': False,
        'code': code,
        'fixes': fixes_applied,
        'lines': len(code.split('\n')),
        'original_lines': original_lines,
        'error': 'Max iterations reached'
    }
