#!/usr/bin/env python3
"""Search for all potential vulnerable patterns in transpile.py"""

import sys
sys.path.insert(0, '/workspace')

# Read the transpile.py file
with open('/workspace/api/transpile.py', 'r') as f:
    content = f.read()

import re

print("Searching for potential vulnerable patterns:")
print("="*60)

# Pattern 1: f-strings with Decimal and embedded quotes
pattern1 = re.compile(r'f["\']Decimal\([^)]*["\'][^)]*\)')
matches1 = list(pattern1.finditer(content))
print(f"\n1. f-string Decimal patterns with quotes: {len(matches1)}")
for m in matches1[:5]:
    start = max(0, m.start() - 20)
    end = min(len(content), m.end() + 20)
    print(f"   ...{content[start:end]}...")

# Pattern 2: re.sub with Decimal and quote patterns
pattern2 = re.compile(r"re\.sub\([^)]*['\"][^)]*Decimal\([^)]*['\"]")
matches2 = list(pattern2.finditer(content))
print(f"\n2. re.sub with Decimal and quotes: {len(matches2)}")
for m in matches2[:5]:
    start = max(0, m.start() - 20)
    end = min(len(content), m.end() + 20)
    print(f"   ...{content[start:end]}...")

# Pattern 3: format_88_value_for_comparison usage
pattern3 = re.compile(r'format_88_value_for_comparison\([^)]+\)')
matches3 = list(pattern3.finditer(content))
print(f"\n3. format_88_value_for_comparison calls: {len(matches3)}")

# Pattern 4: Check the function definition
if 'def format_88_value_for_comparison' in content:
    print("\n4. format_88_value_for_comparison function found")
    match = re.search(r'def format_88_value_for_comparison[^:]*:(.*?)(?=\n    def |\n\ndef |\nclass |\Z)', content, re.DOTALL)
    if match:
        func_body = match.group(0)
        # Check if it uses f-string with quotes
        if "f\"Decimal('{") in func_body or "f'Decimal('" in func_body:
            print("   WARNING: Function uses vulnerable f-string pattern!")
            print(func_body[:500])
        elif 'repr(' in func_body:
            print("   OK: Function uses repr() for safe escaping")
        else:
            print("   Function body:")
            print(func_body[:300])

# Pattern 5: Look for _generate_88_level_properties_v2
if '_generate_88_level_properties_v2' in content:
    print("\n5. _generate_88_level_properties_v2 function found")
    # Find the function
    match = re.search(r'def _generate_88_level_properties_v2[^:]*:(.*?)(?=\n    def |\n\ndef |\nclass |\Z)', content, re.DOTALL)
    if match:
        func_body = match.group(0)
        if "Decimal('{") in func_body or "Decimal('" in func_body.replace('repr(', ''):
            print("   WARNING: Function may use vulnerable patterns!")
        elif 'repr(' in func_body:
            print("   OK: Function uses repr() for safe escaping")
