#!/usr/bin/env python3
"""Test Python code detection."""

import sys
sys.path.insert(0, '/workspace')

from api.transpile import validate_cobol_input, detect_python_code

# Test with the problematic file
filepath = '/workspace/user_input_files/pasted-text-2026-01-21T10-14-42.txt'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"File: {filepath}")
print(f"Size: {len(content)} chars")
print(f"First 200 chars: {content[:200]}")
print()

is_python = detect_python_code(content)
print(f"detect_python_code: {is_python}")

is_valid, warnings = validate_cobol_input(content)
print(f"is_valid: {is_valid}")
print(f"warnings: {warnings}")
