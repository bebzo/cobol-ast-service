#!/usr/bin/env python3
"""
Test Local Transpilation - Production Readiness Score
Transpile the COBOL banking system and check production readiness.
"""
import sys
import os

# Add the cobol-ast-service to the path
sys.path.insert(0, '/workspace/cobol-ast-service')

from api.transpile import (
    generate_python_code,
    ProductionReadinessMetrics,
    validate_cobol_input
)

def main():
    print("=" * 80)
    print("COBOL TO PYTHON TRANSPILER - LOCAL TEST")
    print("=" * 80)
    
    # Read the COBOL file
    cobol_file = '/workspace/user_input_files/3.deepseek_cobol_20260113_46770a.txt'
    
    print(f"\n📄 Reading COBOL file: {cobol_file}")
    with open(cobol_file, 'r') as f:
        cobol_code = f.read()
    
    print(f"   Lines of COBOL: {len(cobol_code.splitlines())}")
    print(f"   Characters: {len(cobol_code)}")
    
    # Validate input
    print("\n✅ Validating COBOL input...")
    is_valid, warnings = validate_cobol_input(cobol_code)
    if warnings:
        for w in warnings:
            print(f"   ⚠️  {w}")
    print(f"   Validation: {'PASSED' if is_valid else 'FAILED'}")
    
    # Transpile
    print("\n🔄 Transpiling COBOL to Python...")
    result = generate_python_code(cobol_code, enhance=True)
    
    python_code = result.get('python_code', '')
    stats = result.get('stats', {})
    
    print(f"   ✅ Transpilation successful!")
    print(f"   📏 Python code size: {len(python_code)} characters")
    print(f"   📊 Lines of Python: {len(python_code.splitlines())}")
    print(f"   📁 Classes generated: {stats.get('classes', 0)}")
    print(f"   📁 Methods generated: {stats.get('methods', 0)}")
    print(f"   📁 Variables defined: {stats.get('variables', 0)}")
    print(f"   📁 Enums defined: {stats.get('enums', 0)}")
    
    # Calculate production readiness score
    print("\n" + "=" * 80)
    print("PRODUCTION READINESS ANALYSIS")
    print("=" * 80)
    
    metrics_client = ProductionReadinessMetrics()
    readiness = metrics_client.calculate_readiness_score(python_code)
    
    print(f"\n🎯 SCORE: {readiness['score']}/100 (Grade: {readiness['grade']})")
    print(f"   Production Ready: {'✅ YES' if readiness['production_ready'] else '❌ NO'}")
    
    print("\n📊 DETAILED METRICS:")
    print("-" * 50)
    metrics = readiness['metrics']
    print(f"   Functions/Methods:     {metrics['functions']}")
    print(f"   Type Annotations:      {metrics['type_annotated']}")
    print(f"   Docstrings:            {metrics['documented']}")
    print(f"   Error Handlers:        {metrics['error_handled']}")
    print(f"   Try Blocks:            {metrics['try_blocks']}")
    print(f"   Test Functions:        {metrics['test_functions']}")
    print(f"   Logging Statements:    {metrics['logging_statements']}")
    
    # Calculate coverage percentages
    functions = metrics['functions']
    if functions > 0:
        print("\n📈 COVERAGE PERCENTAGES:")
        print("-" * 50)
        type_cov = (metrics['type_annotated'] / functions) * 100
        doc_cov = (metrics['documented'] / functions) * 100
        error_cov = (metrics['error_handled'] / functions) * 100
        test_cov = (metrics['test_functions'] / functions) * 100
        
        print(f"   Type Coverage:         {type_cov:.1f}%")
        print(f"   Documentation:         {doc_cov:.1f}%")
        print(f"   Error Handling:        {error_cov:.1f}%")
        print(f"   Test Coverage:         {test_cov:.1f}%")
        print(f"   Logging:               {'YES' if metrics['logging_statements'] > 0 else 'NO'}")
    
    # Save generated Python code for review
    output_file = '/workspace/ultibank_transpiled.py'
    with open(output_file, 'w') as f:
        f.write(python_code)
    print(f"\n💾 Generated Python code saved to: {output_file}")
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    if readiness['score'] >= 90:
        print("🌟 EXCELLENT: The transpiled code meets production standards!")
    elif readiness['score'] >= 75:
        print("✅ GOOD: The transpiled code is production-ready with minor improvements possible.")
    elif readiness['score'] >= 60:
        print("⚠️  ACCEPTABLE: Some production features are missing.")
    else:
        print("❌ NEEDS IMPROVEMENT: Multiple production features need to be added.")
    
    print(f"\n📝 Next steps:")
    if metrics['type_annotated'] < functions:
        print("   - Add more type annotations to methods")
    if metrics['documented'] < functions:
        print("   - Add docstrings to undocumented methods")
    if metrics['error_handled'] < functions:
        print("   - Add try-except blocks for error handling")
    if metrics['test_functions'] < functions:
        print("   - Generate more unit tests")
    if metrics['logging_statements'] == 0:
        print("   - Add logging statements for observability")
    
    return readiness['score']

if __name__ == '__main__':
    score = main()
    sys.exit(0 if score >= 75 else 1)
