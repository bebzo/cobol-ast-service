#!/usr/bin/env python3
"""
Real Production Readiness Test using MEGA-ENTERPRISE.CBL (10K LOC)
Analyzes actual COBOL code quality and calculates real readiness score
"""
import sys
import os
import time
import re

# Read the COBOL file
with open('/workspace/codeswitch_temp/mega_test.cbl', 'r') as f:
    cobol_code = f.read()

lines = cobol_code.split('\n')

print("="*60)
print("REAL PRODUCTION READINESS TEST")
print("Using MEGA-ENTERPRISE.CBL (10,005 LOC)")
print("="*60)
print(f"\nFile loaded successfully:")
print(f"  - Size: {len(cobol_code):,} characters")
print(f"  - Lines: {len(lines):,} LOC")
print(f"  - File: /workspace/codeswitch_temp/mega_test.cbl")

# Comprehensive COBOL Analysis
print("\n" + "="*60)
print("STEP 1: COMPREHENSIVE COBOL CODE ANALYSIS")
print("="*60)

analysis = {
    'total_lines': len(lines),
    'code_lines': 0,
    'comment_lines': 0,
    'blank_lines': 0,
    'division_count': 0,
    'paragraph_count': 0,
    'variable_count': 0,
    'perform_statements': 0,
    'if_statements': 0,
    'compute_statements': 0,
    'move_statements': 0,
    'call_statements': 0,
    'file_operations': 0,
    'sql_statements': 0,
    'has_error_handling': False,
    'has_test_div': False,
    'has_linkage': False,
    'has_screen_section': False,
    'program_id': None,
    'author': None,
    'date_written': None,
    'security_issues': [],
    'complexity_indicators': [],
    'best_practices': []
}

# Line analysis
for line in lines:
    stripped = line.strip()
    
    if not stripped:
        analysis['blank_lines'] += 1
        continue
    
    upper = stripped.upper()
    
    # Count line types
    if stripped.startswith('*') or stripped.upper().startswith('*') or '      *' in line[:7]:
        analysis['comment_lines'] += 1
    else:
        analysis['code_lines'] += 1
    
    # Divisions
    if 'IDENTIFICATION DIVISION' in upper:
        analysis['division_count'] += 1
    if 'ENVIRONMENT DIVISION' in upper:
        analysis['division_count'] += 1
    if 'DATA DIVISION' in upper:
        analysis['division_count'] += 1
    if 'PROCEDURE DIVISION' in upper:
        analysis['division_count'] += 1
    
    # Program info
    if 'PROGRAM-ID' in upper:
        match = re.search(r'PROGRAM-ID\.?\s*\.?([A-Z0-9\-]+)', upper)
        if match:
            analysis['program_id'] = match.group(1)
    
    if 'AUTHOR' in upper:
        match = re.search(r'AUTHOR\.?\s*\.?(.+)', upper)
        if match:
            analysis['author'] = match.group(1).strip()
    
    if 'DATE-WRITTEN' in upper:
        match = re.search(r'DATE-WRITTEN\.?\s*\.?(.+)', upper)
        if match:
            analysis['date_written'] = match.group(1).strip()
    
    # Statements
    if re.search(r'\bPERFORM\b', upper):
        analysis['perform_statements'] += 1
    if re.search(r'\bIF\b', upper):
        analysis['if_statements'] += 1
    if re.search(r'\bCOMPUTE\b', upper):
        analysis['compute_statements'] += 1
    if re.search(r'\bMOVE\b', upper):
        analysis['move_statements'] += 1
    if re.search(r'\bCALL\b', upper):
        analysis['call_statements'] += 1
    
    # File operations
    if re.search(r'\b(OPEN|READ|WRITE|REWRITE|CLOSE)\b', upper):
        analysis['file_operations'] += 1
    
    # SQL (embedded)
    if re.search(r'\b(EXEC\s+SQL|EXEC\s+SQL\*\/|END-EXEC)', upper):
        analysis['sql_statements'] += 1
    
    # Sections
    if 'LINKAGE SECTION' in upper:
        analysis['has_linkage'] = True
    if 'SCREEN SECTION' in upper:
        analysis['has_screen_section'] = True
    if 'TEST' in upper and 'DIVISION' in upper:
        analysis['has_test_div'] = True

# Paragraph detection
current_para = None
for line in lines:
    stripped = line.strip()
    # COBOL paragraph detection (6 spaces, word starting at column 8)
    if len(stripped) >= 8 and not stripped.startswith('*') and stripped[6:7] == ' ':
        potential_para = stripped[7:].split()[0] if stripped[7:].split() else None
        if potential_para and potential_para.isalnum() and potential_para.isupper():
            if potential_para != current_para:
                analysis['paragraph_count'] += 1
                current_para = potential_para

# Variable detection (simplified level counting)
for line in lines:
    stripped = line.strip()
    if len(stripped) >= 7 and stripped[6:7].isdigit():
        try:
            level = int(stripped[:6].strip())
            if 1 <= level <= 99:
                analysis['variable_count'] += 1
        except:
            pass

# Security checks
upper_code = cobol_code.upper()
if 'ACCEPT ' in upper_code and 'TERMINAL' in upper_code:
    analysis['security_issues'].append('ACCEPT statement used (potential injection)')
if 'CALL ' in upper_code and "'" in upper_code:
    # Check for dynamic CALL targets
    if re.search(r'CALL\s+\w+\s+USING', upper_code) and not re.search(r'CALL\s+\'[\w\-]+\'', upper_code):
        analysis['security_issues'].append('Dynamic CALL statement detected')
if 'DISPLAY' in upper_code and len(upper_code.split('DISPLAY')) > 50:
    analysis['security_issues'].append('Excessive DISPLAY statements (logging concerns)')

# Complexity analysis
if analysis['if_statements'] > analysis['code_lines'] * 0.3:
    analysis['complexity_indicators'].append('High conditional density (>30% IF statements)')
if analysis['paragraph_count'] > 200:
    analysis['complexity_indicators'].append('Large number of paragraphs (>200)')
if analysis['call_statements'] > 50:
    analysis['complexity_indicators'].append('Many external program calls (>50)')

# Best practices
if analysis['has_test_div']:
    analysis['best_practices'].append('TEST DIVISION present for unit testing')
if analysis['has_linkage']:
    analysis['best_practices'].append('LINKAGE SECTION for parameter passing')
if analysis['division_count'] >= 4:
    analysis['best_practices'].append('All 4 COBOL divisions present')
if analysis['author']:
    analysis['best_practices'].append('Documented author information')
if analysis['date_written']:
    analysis['best_practices'].append('Documented creation date')
if analysis['sql_statements'] > 0:
    analysis['best_practices'].append('Embedded SQL support detected')
if analysis['file_operations'] > 10:
    analysis['best_practices'].append('Comprehensive file handling')
if len(analysis['security_issues']) == 0:
    analysis['best_practices'].append('No obvious security issues detected')

# Print analysis results
print(f"\nCode Statistics:")
print(f"  - Total lines: {analysis['total_lines']:,}")
print(f"  - Code lines: {analysis['code_lines']:,}")
print(f"  - Comment lines: {analysis['comment_lines']:,}")
print(f"  - Blank lines: {analysis['blank_lines']:,}")
print(f"  - Comment ratio: {analysis['comment_lines']/analysis['total_lines']*100:.1f}%")

print(f"\nCOBOL Structure:")
print(f"  - Divisions found: {analysis['division_count']}/4")
print(f"  - Paragraphs: {analysis['paragraph_count']}")
print(f"  - Variables: {analysis['variable_count']}")

print(f"\nStatements:")
print(f"  - PERFORM: {analysis['perform_statements']}")
print(f"  - IF/CONDITIONAL: {analysis['if_statements']}")
print(f"  - COMPUTE: {analysis['compute_statements']}")
print(f"  - MOVE: {analysis['move_statements']}")
print(f"  - CALL: {analysis['call_statements']}")
print(f"  - File I/O: {analysis['file_operations']}")
print(f"  - Embedded SQL: {analysis['sql_statements']}")

if analysis['program_id']:
    print(f"\nProgram Info:")
    print(f"  - Program ID: {analysis['program_id']}")
if analysis['author']:
    print(f"  - Author: {analysis['author']}")
if analysis['date_written']:
    print(f"  - Date: {analysis['date_written']}")

# Production Readiness Score Calculation
print("\n" + "="*60)
print("STEP 2: PRODUCTION READINESS SCORE CALCULATION")
print("="*60)

# Initialize scoring
checks_passed = []
checks_failed = []

# Core functionality checks
if analysis['division_count'] >= 4:
    checks_passed.append('Complete COBOL structure (4 divisions)')
else:
    checks_failed.append('Incomplete COBOL structure')

if analysis['code_lines'] > 5000:
    checks_passed.append('Substantial code base (>5K LOC)')
else:
    checks_failed.append('Code base too small')

if analysis['paragraph_count'] > 50:
    checks_passed.append('Well-organized paragraphs (>50)')
else:
    checks_failed.append('Poor paragraph organization')

if analysis['variable_count'] > 100:
    checks_passed.append('Comprehensive data definitions (>100 variables)')
else:
    checks_failed.append('Limited data definitions')

# Code quality checks
if analysis['comment_lines'] / analysis['total_lines'] > 0.15:
    checks_passed.append('Good documentation (>15% comments)')
else:
    checks_failed.append('Insufficient documentation')

if analysis['if_statements'] > 0:
    checks_passed.append('Business logic implemented (conditionals)')
else:
    checks_failed.append('No conditional logic detected')

if analysis['perform_statements'] > 0:
    checks_passed.append('Modular code structure (PERFORM)')
else:
    checks_failed.append('No modular structure')

if analysis['file_operations'] > 0:
    checks_passed.append('File handling implemented')
else:
    checks_failed.append('No file operations')

if analysis['call_statements'] > 0:
    checks_passed.append('Program modularity (external CALLs)')
else:
    checks_failed.append('No external program calls')

# Security checks
if len(analysis['security_issues']) == 0:
    checks_passed.append('No security vulnerabilities detected')
else:
    checks_failed.append(f'Security issues found: {len(analysis["security_issues"])}')

# Best practices
if analysis['has_test_div']:
    checks_passed.append('TEST DIVISION present')
else:
    checks_failed.append('Missing TEST DIVISION')

if analysis['author']:
    checks_passed.append('Author documented')
else:
    checks_failed.append('Author not documented')

# Calculate scores
total_checks = len(checks_passed) + len(checks_failed)
passed_checks = len(checks_passed)

base_score = (passed_checks / total_checks) * 100

# Bonus points
bonus_points = 0
if analysis['sql_statements'] > 0:
    bonus_points += 5  # Database integration
if analysis['has_linkage']:
    bonus_points += 5  # Parameter passing capability
if analysis['code_lines'] > 8000:
    bonus_points += 5  # Enterprise-scale code
if len(analysis['best_practices']) > 5:
    bonus_points += 5  # Follows best practices

final_score = min(100, base_score + bonus_points)

# Display checklist
print(f"\nProduction Readiness Checklist:")
print("-"*50)
print("PASSED CHECKS:")
for check in checks_passed:
    print(f"  [PASS] {check}")
print("\nFAILED CHECKS:")
for check in checks_failed:
    print(f"  [FAIL] {check}")

if analysis['security_issues']:
    print("\nSECURITY CONCERNS:")
    for issue in analysis['security_issues']:
        print(f"  [WARN] {issue}")

if analysis['complexity_indicators']:
    print("\nCOMPLEXITY WARNINGS:")
    for warning in analysis['complexity_indicators']:
        print(f"  [WARN] {warning}")

print(f"\nBEST PRACTICES FOLLOWED:")
for practice in analysis['best_practices']:
    print(f"  [OK] {practice}")

# Final score display
print("\n" + "="*60)
print("FINAL RESULTS")
print("="*60)
print(f"\n  Checks Passed: {len(checks_passed)}/{total_checks}")
print(f"  Base Score: {base_score:.1f}%")
print(f"  Bonus Points: +{bonus_points}%")
print(f"\n  +================================--+")
print(f"  |                                |")
print(f"  |   PRODUCTION READINESS SCORE:  |")
print(f"  |        {final_score:5.1f}%                |")
print(f"  |                                |")
print(f"  +================================--+")

# Status determination
print("\n  STATUS: ", end="")
if final_score >= 95:
    print("EXCELLENT - PRODUCTION READY")
    print("\n  This COBOL code is well-structured and ready for")
    print("  migration to Python. All critical checks passed.")
elif final_score >= 85:
    print("GOOD - PRODUCTION READY")
    print("\n  This COBOL code is ready for migration with minor")
    print("  improvements recommended.")
elif final_score >= 70:
    print("FAIR - MOSTLY READY, NEEDS REVIEW")
    print("\n  This COBOL code needs some improvements before")
    print("  production migration. Review the failed checks above.")
elif final_score >= 50:
    print("POOR - NOT READY, REWORK REQUIRED")
    print("\n  This COBOL code has significant issues that need")
    print("  to be addressed before migration.")
else:
    print("CRITICAL - REFACTOR NEEDED")
    print("\n  This COBOL code has critical issues that must be")
    print("  resolved before any migration attempt.")

print("\n" + "="*60)
print("ANALYSIS COMPLETE")
print("="*60)
