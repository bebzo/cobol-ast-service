#!/usr/bin/env python3
"""Debug to find where self.avec is generated."""

import sys
sys.path.insert(0, '/workspace')

from api.transpile import filter_non_cobol_content, generate_python_code

filepath = '/workspace/user_input_files/pasted-text-2026-01-12T16-26-02.txt'

with open(filepath, 'r', encoding='utf-8') as f:
    cobol_content = f.read()

filtered = filter_non_cobol_content(cobol_content)

result = generate_python_code(filtered, enhance=False)

if 'python_code' in result:
    code = result['python_code']
    
    # Find all occurrences of "self.avec"
    import re
    matches = list(re.finditer(r'self\.avec', code, re.IGNORECASE))
    
    if matches:
        print(f"Found {len(matches)} occurrences of 'self.avec':\n")
        for m in matches[:5]:  # Show first 5
            start = max(0, m.start() - 50)
            end = min(len(code), m.end() + 100)
            context = code[start:end]
            print(f"...{context}...")
            print()
    else:
        print("No occurrences of 'self.avec' found in generated code")
    
    # Also check for "avec" without self.
    matches2 = list(re.finditer(r'\bavec\b', code, re.IGNORECASE))
    print(f"\nFound {len(matches2)} occurrences of 'avec' as word:")
    for m in matches2[:5]:
        start = max(0, m.start() - 50)
        end = min(len(code), m.end() + 100)
        context = code[start:end]
        print(f"...{context}...")
        print()
