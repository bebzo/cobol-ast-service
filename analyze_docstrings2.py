#!/usr/bin/env python3
"""
Analyze MALFORMED_DOCSTRING issues.
"""

from transpiler_quality_assurance import TranspilerAudit

def main():
    output_file = '/workspace/test_generated_output.py'
    
    audit = TranspilerAudit()
    report = audit.validate_file(output_file)
    
    # Get MALFORMED_DOCSTRING issues
    docstring_issues = [i for i in report.issues if i.get('issue_type') == 'MALFORMED_DOCSTRING']
    
    print("=" * 70)
    print("MALFORMED DOCSTRING ANALYSIS")
    print("=" * 70)
    print(f"Total issues: {len(docstring_issues)}")
    print()
    
    # Show unique code snippets
    unique = {}
    for issue in docstring_issues:
        snippet = issue.get('code_snippet', '')[:50]
        unique[snippet] = unique.get(snippet, 0) + 1
    
    print("Unique patterns:")
    for snippet, count in sorted(unique.items(), key=lambda x: -x[1])[:20]:
        print(f"  [{count}x] {repr(snippet)}")
    print()
    
    # Show a few actual examples
    print("Sample issues with line numbers:")
    for issue in docstring_issues[:10]:
        print(f"  Line {issue.get('line_number')}: {repr(issue.get('code_snippet', '')[:60])}")

if __name__ == '__main__':
    main()
