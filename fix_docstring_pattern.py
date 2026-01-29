#!/usr/bin/env python3
"""Fix the malformed docstring pattern."""

with open('/workspace/transpiler_quality_assurance.py', 'r') as f:
    content = f.read()

# Find and replace the pattern
# Current: r'"""[^"]*"""[^"]+'  (matches newlines)
# Fixed: r'"""[^"]*"""\s+[^\s"]'  (requires actual content after)

old = r"'pattern': r'\"\"\"[^\\\"]*\"\"\"[^\\\"]+',"
new = r"'pattern': r'\"\"\"[^\\\"]*\"\"\"\\s+[^\\s\\\"]',"

if old in content:
    content = content.replace(old, new)
    with open('/workspace/transpiler_quality_assurance.py', 'w') as f:
        f.write(content)
    print("✅ Pattern fixed successfully!")
else:
    print("Old pattern not found")
    # Try another approach
    import re
    # Look for the line
    match = re.search(r"('pattern': r)'\"\"\"[^\\\"]*\"\"\"[^\\\"]+'", content)
    if match:
        print(f"Found pattern at: {match.group()}")
