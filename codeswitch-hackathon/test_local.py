#!/usr/bin/env python3
"""Local test script for COBOL->Python analysis with test execution."""
import os
import requests
import sys
import io
import contextlib
from api.validate import validate_and_fix

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyCQlSmH7aD8DnqnS6H4oYgjA7_2tscJ11Y')

CODE_PROMPT = """Convert this COBOL code to Python. Output ONLY valid Python code.

RULES:
1. Each COBOL paragraph -> Python function. Use pass if empty.
2. Each 01-level data structure -> @dataclass.
3. ALL strings on single lines. Use \\n for newlines.
4. ALL imports at top of file.
5. Proper 4-space indentation.

COBOL:
"""

TEST_PROMPT = """Generate pytest unit tests for this Python code. Output ONLY valid Python test code.

RULES:
1. Import the functions/classes being tested
2. Each test function starts with test_
3. Use simple assertions
4. NO external dependencies

Python code:
"""

def call_gemini(prompt: str) -> str:
    """Call Gemini API."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 8192}
    }
    resp = requests.post(url, json=payload, timeout=60)
    data = resp.json()
    text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
    
    # Clean markdown
    if '```python' in text:
        text = text.split('```python')[1].split('```')[0]
    elif '```' in text:
        text = text.split('```')[1].split('```')[0]
    return text.strip()

def run_tests(python_code: str, test_code: str) -> dict:
    """Run tests and return results."""
    # Create mock environment
    mock_code = '''
class MockObject:
    def __init__(self, name="mock"):
        self._name = name
    def __getattr__(self, name):
        return MockObject(f"{self._name}.{name}")
    def __call__(self, *args, **kwargs):
        return MockObject(f"{self._name}()")
    def __repr__(self):
        return f"<Mock:{self._name}>"
    def __str__(self):
        return ""
    def __int__(self):
        return 0
    def __float__(self):
        return 0.0
    def __bool__(self):
        return True
    def __iter__(self):
        return iter([])

class AutoMockDict(dict):
    def __missing__(self, key):
        self[key] = MockObject(key)
        return self[key]
'''
    
    full_code = mock_code + "\n\n" + python_code + "\n\n" + test_code
    
    # Find test functions
    test_funcs = [line.split('def ')[1].split('(')[0] 
                  for line in test_code.split('\n') 
                  if line.strip().startswith('def test_')]
    
    results = {'total': len(test_funcs), 'passed': 0, 'failed': 0, 'details': []}
    
    # Execute in isolated namespace
    namespace = {}
    
    try:
        exec(compile(full_code, '<test>', 'exec'), namespace)
    except Exception as e:
        results['details'].append({'name': 'compile', 'status': 'error', 'error': str(e)})
        return results
    
    # Run each test
    for func_name in test_funcs:
        try:
            if func_name in namespace:
                namespace[func_name]()
                results['passed'] += 1
                results['details'].append({'name': func_name, 'status': 'passed'})
        except AssertionError as e:
            results['failed'] += 1
            results['details'].append({'name': func_name, 'status': 'failed', 'error': str(e)})
        except Exception as e:
            results['failed'] += 1
            results['details'].append({'name': func_name, 'status': 'error', 'error': str(e)})
    
    return results

def analyze_and_test(cobol_code: str) -> dict:
    """Full analysis: COBOL -> Python -> Tests -> Execute."""
    # Step 1: Convert COBOL to Python
    python_raw = call_gemini(CODE_PROMPT + cobol_code)
    python_result = validate_and_fix(python_raw)
    python_code = python_result['code']
    
    # Step 2: Generate tests
    test_raw = call_gemini(TEST_PROMPT + python_code)
    test_result = validate_and_fix(test_raw)
    test_code = test_result['code']
    
    # Step 3: Compile check
    compile_ok = False
    try:
        compile(python_code, '<main>', 'exec')
        compile(test_code, '<test>', 'exec')
        compile_ok = True
    except SyntaxError as e:
        pass
    
    # Step 4: Run tests
    test_results = run_tests(python_code, test_code) if compile_ok else {'total': 0, 'passed': 0, 'failed': 0, 'details': []}
    
    return {
        'python_valid': python_result['valid'],
        'python_fixes': python_result['fixes'],
        'test_valid': test_result['valid'],
        'test_fixes': test_result['fixes'],
        'compile_ok': compile_ok,
        'tests': test_results,
        'python_code': python_code,
        'test_code': test_code
    }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python test_local.py <cobol_file> [iterations]")
        sys.exit(1)
    
    with open(sys.argv[1], 'r') as f:
        cobol = f.read()
    
    iterations = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    
    for i in range(iterations):
        print(f"\n{'='*60}")
        print(f"Test {i+1}/{iterations}")
        print('='*60)
        
        result = analyze_and_test(cobol)
        
        print(f"Python: Valid={result['python_valid']}, Fixes={result['python_fixes']}")
        print(f"Tests:  Valid={result['test_valid']}, Fixes={result['test_fixes']}")
        print(f"Compile: {'✓ OK' if result['compile_ok'] else '✗ FAIL'}")
        print(f"Tests:   {result['tests']['passed']}/{result['tests']['total']} passed")
        
        if result['tests']['failed'] > 0:
            for d in result['tests']['details']:
                if d['status'] != 'passed':
                    print(f"  - {d['name']}: {d['status']} - {d.get('error', '')[:50]}")
    
    # Save last result
    with open('output_code.py', 'w') as f:
        f.write(result['python_code'])
    with open('output_tests.py', 'w') as f:
        f.write(result['test_code'])
    print(f"\nSaved: output_code.py, output_tests.py")
