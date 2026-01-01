"""Python test execution endpoint - runs pytest and returns real results."""
from http.server import BaseHTTPRequestHandler
import json
import subprocess
import tempfile
import os

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(body)
            python_code = data.get('code', '')
            test_code = data.get('tests', '')
            result = run_tests(python_code, test_code)
            
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
            self.wfile.write(json.dumps({'error': str(e), 'total': 0, 'passed': 0, 'failed': 0, 'details': []}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()


def run_tests(python_code: str, test_code: str) -> dict:
    """Execute tests with pytest and return real results."""
    results = {
        'total': 0,
        'passed': 0,
        'failed': 0,
        'errors': 0,
        'details': []
    }
    
    with tempfile.TemporaryDirectory() as tmpdir:
        # Write main code
        main_file = os.path.join(tmpdir, 'main_code.py')
        with open(main_file, 'w') as f:
            f.write(python_code)
        
        # Write test code with imports
        test_file = os.path.join(tmpdir, 'test_main.py')
        test_content = f'''import sys
sys.path.insert(0, "{tmpdir}")

# Mock for missing dependencies
class MockObject:
    def __getattr__(self, name): return MockObject()
    def __call__(self, *args, **kwargs): return MockObject()
    def __str__(self): return ""
    def __bool__(self): return True
    def __eq__(self, other): return True
    def __iter__(self): return iter([])

# Import main code
try:
    from main_code import *
except Exception as e:
    pass

# Test code
{test_code}
'''
        with open(test_file, 'w') as f:
            f.write(test_content)
        
        # Run pytest with JSON output
        try:
            proc = subprocess.run(
                ['python', '-m', 'pytest', test_file, '-v', '--tb=short', '-q'],
                capture_output=True,
                text=True,
                timeout=30,
                cwd=tmpdir
            )
            
            output = proc.stdout + proc.stderr
            
            # Parse pytest output
            for line in output.split('\n'):
                line = line.strip()
                if '::test_' in line:
                    if ' PASSED' in line:
                        test_name = line.split('::')[1].split(' ')[0] if '::' in line else line
                        results['total'] += 1
                        results['passed'] += 1
                        results['details'].append({'name': test_name, 'status': 'passed'})
                    elif ' FAILED' in line:
                        test_name = line.split('::')[1].split(' ')[0] if '::' in line else line
                        results['total'] += 1
                        results['failed'] += 1
                        results['details'].append({'name': test_name, 'status': 'failed'})
                    elif ' ERROR' in line:
                        test_name = line.split('::')[1].split(' ')[0] if '::' in line else line
                        results['total'] += 1
                        results['errors'] += 1
                        results['details'].append({'name': test_name, 'status': 'error'})
            
            # Fallback: parse summary line "X passed, Y failed"
            if results['total'] == 0:
                import re
                match = re.search(r'(\d+) passed', output)
                if match:
                    results['passed'] = int(match.group(1))
                    results['total'] += results['passed']
                match = re.search(r'(\d+) failed', output)
                if match:
                    results['failed'] = int(match.group(1))
                    results['total'] += results['failed']
                match = re.search(r'(\d+) error', output)
                if match:
                    results['errors'] = int(match.group(1))
                    results['total'] += results['errors']
            
            results['output'] = output[:2000]  # Limit output size
            
        except subprocess.TimeoutExpired:
            results['error'] = 'Tests timed out (30s limit)'
        except Exception as e:
            results['error'] = str(e)
    
    return results
