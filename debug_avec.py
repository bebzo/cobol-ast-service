#!/usr/bin/env python3
"""Debug to find the exact line with AVEC issue."""

import sys
sys.path.insert(0, '/workspace')

from api.transpile import filter_non_cobol_content, parse_paragraphs

filepath = '/workspace/user_input_files/pasted-text-2026-01-12T16-26-02.txt'

with open(filepath, 'r', encoding='utf-8') as f:
    cobol_content = f.read()

filtered = filter_non_cobol_content(cobol_content)
lines = filtered.split('\n')

# Find lines containing "AVEC" in uppercase form
print("Lines containing 'AVEC' (case insensitive):")
for i, line in enumerate(lines, 1):
    if 'avec' in line.lower():
        # Check if line looks like a paragraph name
        para_match = __import__('re').match(r'^\s*([A-Z0-9][-A-Z0-9_]*)\s*\.\s*$', line, __import__('re').IGNORECASE)
        if para_match:
            print(f"Line {i}: '{line}' -> PARAGRAPH NAME: {para_match.group(1)}")
        else:
            print(f"Line {i}: '{line}'")

print("\n" + "="*60 + "\n")

# Check the parse_paragraphs output
print("Paragraphs found:")
paragraphs = parse_paragraphs(lines)
for p in paragraphs:
    if 'AVEC' in p.name.upper():
        print(f"  ❌ PROBLEM: '{p.name}'")
    else:
        print(f"  OK: '{p.name}'")
