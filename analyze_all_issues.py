#!/usr/bin/env python3
"""
Script to analyze remaining issues in detail.
"""

from transpiler_quality_assurance import TranspilerAudit

def main():
    output_file = '/workspace/test_generated_output.py'
    
    # Run audit
    audit = TranspilerAudit()
    report = audit.validate_file(output_file)
    
    print("=" * 70)
    print("ALL ISSUES ANALYSIS")
    print("=" * 70)
    print(f"Total issues: {len(report.issues)}")
    print()
    
    # Group by type
    by_type = {}
    by_severity = {}
    
    for issue in report.issues:
        issue_type = issue.get('issue_type', 'UNKNOWN')
        severity = issue.get('severity', 'UNKNOWN')
        
        by_type[issue_type] = by_type.get(issue_type, 0) + 1
        by_severity[severity] = by_severity.get(severity, 0) + 1
    
    print("By Type:")
    for k, v in sorted(by_type.items()):
        print(f"  {k}: {v}")
    print()
    
    print("By Severity:")
    for k, v in sorted(by_severity.items()):
        print(f"  {k}: {v}")
    print()
    
    # Show sample of each type
    shown_types = set()
    for issue in report.issues[:50]:
        issue_type = issue.get('issue_type', 'UNKNOWN')
        if issue_type not in shown_types:
            shown_types.add(issue_type)
            print(f"Sample {issue_type}:")
            print(f"  Line: {issue.get('line_number')}")
            print(f"  Message: {issue.get('message')}")
            print(f"  Code: {repr(issue.get('code_snippet', '')[:80])}")
            print()

if __name__ == '__main__':
    main()
