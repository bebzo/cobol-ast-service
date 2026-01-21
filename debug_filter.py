#!/usr/bin/env python3
"""Debug filter output."""

import sys
sys.path.insert(0, '/workspace')

from api.transpile import filter_non_cobol_content

filepath = '/workspace/user_input_files/pasted-text-2026-01-12T16-26-02.txt'

with open(filepath, 'r', encoding='utf-8') as f:
    cobol_content = f.read()

print("Original first 10 lines:")
for i, line in enumerate(cobol_content.split('\n')[:10], 1):
    print(f"{i}: '{line}'")

print("\n" + "="*60 + "\n")

filtered = filter_non_cobol_content(cobol_content)

print("Filtered first 10 lines:")
for i, line in enumerate(filtered.split('\n')[:10], 1):
    print(f"{i}: '{line}'")

print("\n" + "="*60 + "\n")

print(f"Original line count: {len(cobol_content.split(chr(10)))}")
print(f"Filtered line count: {len(filtered.split(chr(10)))}")

# Check if "avec" is in the filtered content
if 'avec' in filtered.lower():
    print("\n❌ 'avec' found in filtered content!")
    lines = filtered.split('\n')
    for i, line in enumerate(lines, 1):
        if 'avec' in line.lower():
            print(f"  Line {i}: '{line}'")
else:
    print("\n✅ 'avec' NOT found in filtered content")
