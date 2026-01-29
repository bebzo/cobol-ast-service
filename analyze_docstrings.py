#!/usr/bin/env python3
"""
Script to analyze the docstring detection logic and identify what's being flagged.
"""

import re

# Simulate the _check_strings logic
def check_docstrings_logic(lines):
    """Replicate the _check_strings logic to see what it flags."""
    flagged_lines = []

    in_class = False
    class_indent = 0

    for line_num, line in enumerate(lines, start=1):
        stripped = line.strip()

        # Detect class start
        class_match = re.match(r'^class\s+(\w+)', stripped)
        if class_match:
            in_class = True
            class_indent = len(line) - len(line.lstrip())
            continue

        # Check if we're still in class
        if in_class:
            current_indent = len(line) - len(line.lstrip())
            if current_indent <= class_indent and stripped:
                in_class = False

        # Check docstrings
        docstring_match = re.search(r'"""[^"]*$', stripped)
        if docstring_match and not re.search(r'"""[^"]*"""', stripped):
            flagged_lines.append({
                'line_num': line_num,
                'content': stripped,
                'reason': 'Line ends with """ but no complete docstring on line'
            })

    return flagged_lines

# Read the generated file
with open('/workspace/test_generated_output.py', 'r') as f:
    lines = f.readlines()

print("Analyzing docstring detection in generated file...\n")
flagged = check_docstrings_logic(lines)

print(f"Total lines flagged: {len(flagged)}\n")
print("First 20 flagged lines:")
print("=" * 80)

for item in flagged[:20]:
    print(f"Line {item['line_num']}: {item['content'][:80]}")
    print(f"  Reason: {item['reason']}\n")

# Let's also analyze what these lines actually contain
print("\n" + "=" * 80)
print("Analyzing the nature of flagged lines:")
print("=" * 80)

content_analysis = {
    'has_closing_docstring': 0,
    'is_multiline_start': 0,
    'is_multiline_continuation': 0,
    'is_attribute_definition': 0,
    'other': 0
}

for item in flagged:
    content = item['content']
    if '"""' in content and content.count('"""') >= 2:
        content_analysis['has_closing_docstring'] += 1
    elif re.match(r'^\w+\s*=\s*"""', content):
        content_analysis['is_attribute_definition'] += 1
    elif re.match(r'^\s+"""', content) and not content.endswith('"""'):
        content_analysis['is_multiline_start'] += 1
    elif re.match(r'^\s+\w+', content) and '"""' in content:
        content_analysis['is_multiline_continuation'] += 1
    else:
        content_analysis['other'] += 1

for category, count in content_analysis.items():
    print(f"{category}: {count}")

# Show examples of each category
print("\n" + "=" * 80)
print("Examples of each category:")
print("=" * 80)

for category, count in content_analysis.items():
    if count > 0:
        print(f"\n{category.upper()} examples:")
        shown = 0
        for item in flagged:
            content = item['content']
            if category == 'has_closing_docstring' and '"""' in content and content.count('"""') >= 2:
                print(f"  Line {item['line_num']}: {content[:70]}")
                shown += 1
            elif category == 'is_attribute_definition' and re.match(r'^\w+\s*=\s*"""', content):
                print(f"  Line {item['line_num']}: {content[:70]}")
                shown += 1
            elif category == 'is_multiline_start' and re.match(r'^\s+"""', content) and not content.endswith('"""'):
                print(f"  Line {item['line_num']}: {content[:70]}")
                shown += 1
            elif category == 'is_multiline_continuation' and re.match(r'^\s+\w+', content) and '"""' in content:
                print(f"  Line {item['line_num']}: {content[:70]}")
                shown += 1
            elif category == 'other':
                print(f"  Line {item['line_num']}: {content[:70]}")
                shown += 1
            if shown >= 3:
                break
