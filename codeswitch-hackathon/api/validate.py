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
    
    for i in range(max_iterations):
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
