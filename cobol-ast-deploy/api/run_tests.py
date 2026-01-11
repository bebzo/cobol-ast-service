import json
import sys
import io
import traceback
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)
            
            python_code = data.get('python_code', '')
            test_code = data.get('test_code', '')
            
            if not python_code or not test_code:
                self._send_response(400, {'error': 'Missing python_code or test_code'})
                return
            
            # Execute tests
            results = self._run_tests(python_code, test_code)
            self._send_response(200, results)
            
        except Exception as e:
            self._send_response(500, {'error': str(e)})
    
    def _send_response(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def _run_tests(self, python_code, test_code):
        """Execute tests and return results"""
        results = {
            'total': 0,
            'passed': 0,
            'failed': 0,
            'errors': [],
            'details': []
        }
        
        # Create a namespace for execution
        namespace = {'__name__': '__main__'}
        
        # First, execute the main code to define classes/functions
        try:
            exec(compile(python_code, '<main>', 'exec'), namespace)
        except Exception as e:
            results['errors'].append(f"Main code error: {str(e)}")
            return results
        
        # Parse test functions from test_code
        test_functions = []
        lines = test_code.split('\n')
        current_test = []
        current_name = None
        indent_level = 0
        
        for line in lines:
            if line.strip().startswith('def test_'):
                if current_name and current_test:
                    test_functions.append((current_name, '\n'.join(current_test)))
                current_name = line.strip().split('(')[0].replace('def ', '')
                current_test = [line]
                indent_level = len(line) - len(line.lstrip())
            elif current_name:
                if line.strip() == '' or line.startswith(' ' * (indent_level + 1)) or line.startswith('\t'):
                    current_test.append(line)
                elif line.strip().startswith('def ') or line.strip().startswith('class '):
                    test_functions.append((current_name, '\n'.join(current_test)))
                    current_name = None
                    current_test = []
        
        if current_name and current_test:
            test_functions.append((current_name, '\n'.join(current_test)))
        
        results['total'] = len(test_functions)
        
        # Run each test
        for test_name, test_body in test_functions:
            test_result = {'name': test_name, 'status': 'passed', 'error': None}
            
            # Capture stdout
            old_stdout = sys.stdout
            sys.stdout = io.StringIO()
            
            try:
                # Execute the test function definition and call it
                test_namespace = namespace.copy()
                exec(compile(test_body, f'<{test_name}>', 'exec'), test_namespace)
                # Call the test function
                if test_name in test_namespace:
                    test_namespace[test_name]()
                results['passed'] += 1
            except AssertionError as e:
                test_result['status'] = 'failed'
                test_result['error'] = f"Assertion failed: {str(e)}"
                results['failed'] += 1
            except Exception as e:
                test_result['status'] = 'error'
                test_result['error'] = f"{type(e).__name__}: {str(e)}"
                results['failed'] += 1
            finally:
                sys.stdout = old_stdout
            
            results['details'].append(test_result)
        
        return results
