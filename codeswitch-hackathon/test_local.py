#!/usr/bin/env python3
"""Local test script for COBOL->Python analysis."""
import os
import requests
import json
from api.validate import validate_and_fix

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyCQlSmH7aD8DnqnS6H4oYgjA7_2tscJ11Y')

CHUNK_PROMPT = """Convert this COBOL code to Python. Output ONLY valid, single-file Python code.

RULES:
1. Each COBOL paragraph -> Python function. Use pass if empty.
2. Each 01-level data structure -> @dataclass.
3. ALL strings on single lines. Use \\n for newlines.
4. ALL imports at top of file.
5. Proper 4-space indentation.

FORBIDDEN:
- Multi-line strings with +
- Unclosed quotes or parentheses
- Empty class/function bodies

COBOL:
"""

def analyze_cobol(cobol_code: str) -> dict:
    """Analyze COBOL and convert to Python."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    
    payload = {
        "contents": [{"parts": [{"text": CHUNK_PROMPT + cobol_code}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 8192}
    }
    
    resp = requests.post(url, json=payload, timeout=60)
    data = resp.json()
    
    # Extract Python code
    text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
    
    # Clean markdown
    if '```python' in text:
        text = text.split('```python')[1].split('```')[0]
    elif '```' in text:
        text = text.split('```')[1].split('```')[0]
    
    python_code = text.strip()
    
    # Validate and fix
    result = validate_and_fix(python_code)
    
    return {
        'raw': python_code,
        'fixed': result['code'],
        'valid': result['valid'],
        'fixes': result['fixes']
    }

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python test_local.py <cobol_file>")
        sys.exit(1)
    
    with open(sys.argv[1], 'r') as f:
        cobol = f.read()
    
    print(f"Analyzing {sys.argv[1]}...")
    result = analyze_cobol(cobol)
    
    print(f"\n{'='*50}")
    print(f"Valid: {result['valid']}")
    print(f"Fixes applied: {result['fixes']}")
    
    # Test compile
    try:
        compile(result['fixed'], '<test>', 'exec')
        print("✓ Compile OK")
    except SyntaxError as e:
        print(f"✗ Compile error: {e}")
    
    # Save output
    out_file = sys.argv[1].replace('.cbl', '.py').replace('.CBL', '.py')
    with open(out_file, 'w') as f:
        f.write(result['fixed'])
    print(f"\nSaved to: {out_file}")
