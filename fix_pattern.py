#!/usr/bin/env python3
"""Fix the broken mixed_indentation pattern in QA file."""

with open('/workspace/transpiler_quality_assurance.py', 'r', encoding='utf-8') as f:
    content = f.read()

# The broken pattern (with the space before |)
old = r"'mixed_indentation': {
            'pattern': r'^\t+ | {1,3}[^\s]',"

# The fixed pattern
new = r"""'mixed_indentation': {
            # Pattern corrigé: détection de tabs au début de ligne
            # ou indentation non standard (1-3 espaces suivi de non-espace)
            'pattern': r'^\t|^\s+[^\s]',"""

if old in content:
    content = content.replace(old, new)
    with open('/workspace/transpiler_quality_assurance.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Pattern fixed successfully!")
else:
    print("❌ Old pattern not found")
    # Try to find it
    import re
    match = re.search(r"'mixed_indentation':\s*\{[^}]+\}", content)
    if match:
        print("Found:")
        print(repr(match.group()[:200]))
