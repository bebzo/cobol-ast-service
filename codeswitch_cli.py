#!/usr/bin/env python3
"""
CodeSwitch CLI - COBOL to Python Transpiler
Usage:
    python codeswitch_cli.py <input.cbl> [options]

Examples:
    # Basic transpilation
    python codeswitch_cli.py program.cbl
    
    # With output directory
    python codeswitch_cli.py program.cbl -o ./output
    
    # Generate all artifacts
    python codeswitch_cli.py program.cbl --full
    
    # Production mode (minified)
    python codeswitch_cli.py program.cbl --minified
"""

import argparse
import sys
import os
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(
        description='CodeSwitch - COBOL to Python Transpiler v6.0.0',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s program.cbl                    Basic transpilation
  %(prog)s program.cbl -o ./output        Specify output directory
  %(prog)s program.cbl --full             Generate all artifacts
  %(prog)s program.cbl --minified         Production mode (no comments)
        """
    )
    
    parser.add_argument('input', help='COBOL source file (.cbl, .cob, .txt)')
    parser.add_argument('-o', '--output', default='./output', help='Output directory (default: ./output)')
    parser.add_argument('--full', action='store_true', help='Generate all artifacts (tests, config, template)')
    parser.add_argument('--minified', action='store_true', help='Production mode without traceability comments')
    parser.add_argument('--config', action='store_true', help='Generate config.yaml template')
    parser.add_argument('--tests', action='store_true', help='Generate equivalence tests')
    parser.add_argument('--template', action='store_true', help='Generate external calls template')
    parser.add_argument('--quiet', '-q', action='store_true', help='Minimal output')
    parser.add_argument('--version', action='version', version='CodeSwitch v6.0.0')
    
    args = parser.parse_args()
    
    # Validate input file
    if not os.path.exists(args.input):
        print(f"❌ Error: File not found: {args.input}")
        sys.exit(1)
    
    # Create output directory
    os.makedirs(args.output, exist_ok=True)
    
    # Read COBOL source
    with open(args.input, 'r', encoding='utf-8', errors='replace') as f:
        cobol_source = f.read()
    
    if not args.quiet:
        print("=" * 60)
        print("🔄 CodeSwitch v6.0.0 - COBOL to Python Transpiler")
        print("=" * 60)
        print(f"📂 Input: {args.input}")
        print(f"📂 Output: {args.output}")
    
    # Import transpiler
    try:
        from api.transpile import generate_python_code
        from api.v6_features import (
            generate_config_yaml_template,
            generate_external_call_template,
            generate_equivalence_tests,
            generate_migration_report,
        )
    except ImportError:
        # Try relative import
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from api.transpile import generate_python_code
        from api.v6_features import (
            generate_config_yaml_template,
            generate_external_call_template,
            generate_equivalence_tests,
            generate_migration_report,
        )
    
    # Transpile
    if not args.quiet:
        print("\n⚙️  Transpiling...")
    
    result = generate_python_code(cobol_source, minified_mode=args.minified)
    
    if not result.get('success'):
        print(f"❌ Transpilation failed: {result.get('error', 'Unknown error')}")
        sys.exit(1)
    
    # Extract info
    python_code = result['python_code']
    stats = result.get('stats', {})
    class_name = stats.get('program_id', 'Program').replace('-', '')
    
    # Collect external calls
    import re
    external_calls = list(set(re.findall(r'CALL\s+["\'"]([A-Z0-9-]+)["\'"]', cobol_source, re.IGNORECASE)))
    
    # Save Python code
    output_name = Path(args.input).stem.lower().replace('-', '_')
    python_file = os.path.join(args.output, f"{output_name}.py")
    with open(python_file, 'w') as f:
        f.write(python_code)
    
    if not args.quiet:
        print(f"✅ Python code: {python_file}")
    
    # Generate additional artifacts
    if args.full or args.config:
        config_file = os.path.join(args.output, "config.yaml")
        with open(config_file, 'w') as f:
            f.write(generate_config_yaml_template(class_name, external_calls))
        if not args.quiet:
            print(f"✅ Config template: {config_file}")
    
    if args.full or args.template:
        template_file = os.path.join(args.output, "external_calls_template.py")
        with open(template_file, 'w') as f:
            f.write(generate_external_call_template(external_calls))
        if not args.quiet:
            print(f"✅ External calls template: {template_file}")
    
    if args.full or args.tests:
        tests_file = os.path.join(args.output, f"test_{output_name}.py")
        with open(tests_file, 'w') as f:
            f.write(generate_equivalence_tests(cobol_source, class_name))
        if not args.quiet:
            print(f"✅ Equivalence tests: {tests_file}")
    
    if args.full:
        report_file = os.path.join(args.output, "MIGRATION_REPORT.md")
        with open(report_file, 'w') as f:
            f.write(generate_migration_report(cobol_source, class_name, external_calls, stats))
        if not args.quiet:
            print(f"✅ Migration report: {report_file}")
    
    # Summary
    if not args.quiet:
        print("\n" + "=" * 60)
        print("📊 SUMMARY")
        print("=" * 60)
        print(f"   COBOL Lines: {len(cobol_source.splitlines())}")
        print(f"   Python Methods: {stats.get('python_methods', 'N/A')}")
        print(f"   External CALLs: {len(external_calls)}")
        print(f"   88-level Conditions: {stats.get('conditions_88', 'N/A')}")
        print("=" * 60)
        print("\n🚀 Next steps:")
        print("   1. Review generated Python code")
        print("   2. Implement external CALLs (if any)")
        print("   3. Run: python", python_file)
        print()
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
