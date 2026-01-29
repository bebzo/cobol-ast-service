#!/usr/bin/env python3
"""
Script to analyze remaining issues in generated Python code.
"""

import json
from transpiler_quality_assurance import TranspilerAudit

def main():
    output_file = '/workspace/test_generated_output.py'
    
    # Run audit
    audit = TranspilerAudit()
    report = audit.validate_file(output_file)
    
    # Get critical issues
    critical_issues = [i for i in report.issues if i.get('severity') == 'CRITICAL']
    
    print("=" * 70)
    print("CRITICAL ISSUES ANALYSIS")
    print("=" * 70)
    print(f"Total critical issues: {len(critical_issues)}")
    print()
    
    for i, issue in enumerate(critical_issues[:10], 1):
        print(f"Issue {i}:")
        print(f"  Type: {issue.get('type')}")
        print(f"  Line: {issue.get('line')}")
        print(f"  Message: {issue.get('message')}")
        print(f"  Code: {issue.get('code', '')[:100]}")
        print()
    
    # Get malformed docstring issues
    docstring_issues = [i for i in report.issues if i.get('type') == 'MALFORMED_DOCSTRING']
    
    print("=" * 70)
    print("MALFORMED DOCSTRING ISSUES (sample)")
    print("=" * 70)
    print(f"Total docstring issues: {len(docstring_issues)}")
    print()
    
    for i, issue in enumerate(docstring_issues[:5], 1):
        print(f"Issue {i}:")
        print(f"  Line: {issue.get('line')}")
        print(f"  Message: {issue.get('message')}")
        print(f"  Code: {issue.get('code', '')[:150]}")
        print()

if __name__ == '__main__':
    main()
