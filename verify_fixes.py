#!/usr/bin/env python3
"""
Test script to verify transpiler fixes are working.
Runs transpiler on a COBOL test file and audits the generated Python code.
"""

import sys
import os
sys.path.insert(0, '/workspace')

from api.transpile import generate_python_code

def main():
    # Read the COBOL test file
    cobol_file = '/workspace/test_cobol_file.cbl'
    with open(cobol_file, 'r') as f:
        cobol_source = f.read()
    
    print("=" * 70)
    print("TRANSPILER FIX VERIFICATION TEST")
    print("=" * 70)
    print(f"COBOL source file: {cobol_file}")
    print(f"COBOL lines: {len(cobol_source.splitlines())}")
    print()
    
    # Run transpiler
    print("Running transpiler...")
    result = generate_python_code(cobol_source, enhance=False)
    
    if not result.get('success'):
        print(f"ERROR: Transpilation failed: {result.get('error')}")
        return 1
    
    python_code = result.get('python_code', '')
    print(f"Generated Python lines: {len(python_code.splitlines())}")
    print()
    
    # Save generated Python code for inspection
    output_file = '/workspace/test_generated_output.py'
    with open(output_file, 'w') as f:
        f.write(python_code)
    print(f"Generated Python code saved to: {output_file}")
    print()
    
    # Run QA audit on the generated code
    print("Running QA audit on generated Python code...")
    from transpiler_quality_assurance import TranspilerAudit
    
    audit = TranspilerAudit()
    report = audit.validate_file(output_file)
    
    # Print summary
    print()
    print("=" * 70)
    print("QA AUDIT SUMMARY")
    print("=" * 70)
    print(f"File: {output_file}")
    print(f"Total lines: {report.total_lines}")
    print(f"Issues found: {report.issues_found}")
    print()
    print("By severity:")
    for severity, count in report.issues_by_severity.items():
        print(f"  {severity}: {count}")
    print()
    print("By type:")
    for issue_type, count in report.issues_by_type.items():
        print(f"  {issue_type}: {count}")
    print()
    
    # Check for critical issues
    critical_count = report.issues_by_severity.get('CRITICAL', 0)
    error_count = report.issues_by_severity.get('ERROR', 0)
    
    if critical_count == 0 and error_count == 0:
        print("✅ SUCCESS: No critical or error-level issues found!")
        print("   The transpiler fixes appear to be working correctly.")
        return 0
    else:
        print("❌ FAILURE: Critical or error-level issues still present.")
        print("   The fixes may need additional work.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
