#!/usr/bin/env python3
"""
CodeSwitch COBOL Analysis Script
Analyzes COBOL files and generates corrected Python code with tests.
"""

import sys
import os

# Add api directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

from transpile import (
    parse_cobol,
    generate_python_code,
    generate_unit_tests_v4,
    generate_production_tests,
    generate_equivalence_tests
)


def analyze_and_transpile(cobol_code: str) -> dict:
    """Analyze COBOL and generate corrected Python code."""
    
    # Parse the COBOL AST
    cobol_ast = parse_cobol(cobol_code)
    
    # Generate Python code
    result = generate_python_code(cobol_code, enhance=False)
    python_code = result['python_code']
    
    # Generate test class name from program ID
    class_name = "ULTIMATEBANKINGSYSTEM"
    for line in cobol_code.split('\n'):
        if 'PROGRAM-ID' in line.upper():
            prog_id = line.split('.')[0].split()[-1].strip()
            # Remove dashes and create valid Python class name
            class_name = prog_id.replace('-', '').replace('.', '').upper()
            break
    
    # Generate comprehensive tests
    test_code = generate_unit_tests_v4(
        cobol_ast, 
        class_name,
        python_code=python_code,
        include_type_tests=True,
        include_error_handling_tests=True,
        include_logging_tests=True
    )
    
    # Generate production tests
    production_tests = generate_production_tests(cobol_ast, class_name, python_code)
    
    # Generate equivalence tests
    equivalence_tests = generate_equivalence_tests(cobol_code, class_name)
    
    return {
        'python_code': python_code,
        'test_code': test_code,
        'production_tests': production_tests,
        'equivalence_tests': equivalence_tests,
        'class_name': class_name,
        'statistics': result.get('statistics', {})
    }


def main():
    """Main analysis function."""
    if len(sys.argv) < 2:
        print("Usage: python analyze_cobol.py <cobol_file>")
        sys.exit(1)
    
    cobol_file = sys.argv[1]
    
    if not os.path.exists(cobol_file):
        print(f"Error: File {cobol_file} not found")
        sys.exit(1)
    
    # Read COBOL file
    with open(cobol_file, 'r') as f:
        cobol_code = f.read()
    
    print(f"Analyzing COBOL file: {cobol_file}")
    print(f"File size: {len(cobol_code)} characters")
    print("-" * 60)
    
    # Analyze and transpile
    try:
        result = analyze_and_transpile(cobol_code)
        
        # Print statistics
        if result['statistics']:
            print("Transpilation Statistics:")
            for key, value in result['statistics'].items():
                print(f"  {key}: {value}")
            print("-" * 60)
        
        # Save outputs
        output_dir = os.path.dirname(cobol_file)
        if not output_dir:
            output_dir = '.'
        
        base_name = os.path.basename(cobol_file).replace('.cbl', '').replace('.txt', '')
        
        # Save Python code
        python_file = os.path.join(output_dir, f"analyzed_{base_name}.py")
        with open(python_file, 'w') as f:
            f.write(result['python_code'])
        print(f"Generated Python code: {python_file}")
        
        # Save tests
        test_file = os.path.join(output_dir, f"test_analyzed_{base_name}.py")
        with open(test_file, 'w') as f:
            f.write(result['test_code'])
        print(f"Generated tests: {test_file}")
        
        print("\nAnalysis complete!")
        return 0
        
    except Exception as e:
        print(f"Error during analysis: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
