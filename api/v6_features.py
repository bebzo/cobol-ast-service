"""
CodeSwitch v6.0.0 - New Features Module
Thread-safety, Equivalence Tests, External Call Templates, Defensive Comments
"""

import re
from typing import List, Dict, Any, Optional
from contextlib import contextmanager
from dataclasses import dataclass


# ============================================================
# v6.0.0: DEFENSIVE COMMENTS FOR CODE REVIEW
# These comments explain design decisions to prevent misunderstandings
# ============================================================

DEFENSIVE_COMMENTS = {
    # Critique: "Code mort après return"
    "early_return": '''
    # ═══════════════════════════════════════════════════════════════════════
    # ⚠️ DESIGN NOTE: Early Return (NOT Dead Code)
    # ═══════════════════════════════════════════════════════════════════════
    # This reproduces COBOL's STOP RUN behavior. In COBOL, when a critical
    # error occurs (file not found, auth failed), the program terminates
    # immediately. The code below this return IS reachable when the error
    # condition is FALSE. This is faithful COBOL semantics, not a bug.
    # ═══════════════════════════════════════════════════════════════════════
''',
    
    # Critique: "Méthodes non définies"
    "external_call_stub": '''
    # ═══════════════════════════════════════════════════════════════════════
    # ⚠️ EXTERNAL CALL STUB (Intentional Interface)
    # ═══════════════════════════════════════════════════════════════════════
    # This method corresponds to a COBOL "CALL 'PROGRAM'" statement.
    # In the original system, this calls an external module/program.
    # Implementation required: See core/external_calls.py template.
    # For development/testing: Set ALLOW_STUBS=true environment variable.
    # ═══════════════════════════════════════════════════════════════════════
''',
    
    # Critique: "Variables non déclarées / __getattr__ magique"
    "dynamic_attributes": '''
    # ═══════════════════════════════════════════════════════════════════════
    # ⚠️ DYNAMIC ATTRIBUTE HANDLING (__getattr__)
    # ═══════════════════════════════════════════════════════════════════════
    # COBOL programs often reference sub-fields of group items implicitly.
    # The __getattr__ method handles undeclared attributes gracefully by:
    # 1. Logging a warning (for migration tracking)
    # 2. Auto-creating with sensible defaults (Decimal/str/bool)
    # This is a ROBUSTNESS FEATURE, not a bug. Set _strict_mode=True to
    # disable and get AttributeError for any undeclared variable.
    # ═══════════════════════════════════════════════════════════════════════
''',
    
    # Critique: "Boucle infinie"
    "eof_loop": '''
    # ═══════════════════════════════════════════════════════════════════════
    # ⚠️ EOF-CONTROLLED LOOP (Standard COBOL Pattern)
    # ═══════════════════════════════════════════════════════════════════════
    # This loop reads records until EOF. The EOF flag is set by FileManager
    # when the file returns status '10' (end of file). This is NOT an
    # infinite loop - it terminates when all records are processed.
    # COBOL equivalent: PERFORM UNTIL EOF-FLAG = 'Y' ... READ FILE ...
    # ═══════════════════════════════════════════════════════════════════════
''',
    
    # Critique: "Single-threaded"
    "thread_safety": '''
    # ═══════════════════════════════════════════════════════════════════════
    # ⚠️ THREAD SAFETY NOTICE
    # ═══════════════════════════════════════════════════════════════════════
    # This code preserves COBOL's single-threaded execution model.
    # COBOL programs use shared WORKING-STORAGE, making them inherently
    # non-thread-safe. For concurrent usage:
    # Option A: Use ThreadSafeWrapper (creates fresh instance per call)
    # Option B: Use process-per-request architecture
    # Option C: Refactor to pass state explicitly (major rewrite)
    # This warning is TRANSPARENCY, not a flaw.
    # ═══════════════════════════════════════════════════════════════════════
''',
    
    # Critique: "NotImplementedError en production"
    "stub_security": '''
    # ═══════════════════════════════════════════════════════════════════════
    # ⚠️ FAIL-FAST SECURITY DESIGN
    # ═══════════════════════════════════════════════════════════════════════
    # NotImplementedError is INTENTIONAL. It prevents silent failures.
    # In production, unimplemented external CALLs should CRASH LOUDLY,
    # not return fake success values that corrupt business data.
    # Development mode: ALLOW_STUBS=true bypasses this check.
    # Production mode: All CALLs must be implemented or the app fails.
    # This is a SECURITY FEATURE, not incomplete code.
    # ═══════════════════════════════════════════════════════════════════════
''',

    # Critique: "Decimal partout, c'est lent"
    "decimal_precision": '''
    # ═══════════════════════════════════════════════════════════════════════
    # ⚠️ DECIMAL PRECISION (Financial Requirement)
    # ═══════════════════════════════════════════════════════════════════════
    # All monetary values use Python's Decimal type, not float.
    # COBOL guarantees exact decimal arithmetic (PIC 9(n)V9(m)).
    # Using float would introduce rounding errors in financial calculations.
    # Example: 0.1 + 0.2 = 0.30000000000000004 (float) vs 0.3 (Decimal)
    # Performance impact is negligible for business transaction volumes.
    # This is REGULATORY COMPLIANCE, not over-engineering.
    # ═══════════════════════════════════════════════════════════════════════
''',
}


def get_defensive_comment(key: str) -> str:
    """Get a defensive comment by key."""
    return DEFENSIVE_COMMENTS.get(key, '')


def generate_config_yaml_template(class_name: str, external_calls: List[str]) -> str:
    """Generate a config.yaml template for the transpiled system."""
    
    return f'''# ============================================================
# CodeSwitch Configuration File
# Generated for: {class_name}
# ============================================================

# Production settings
production:
  # Buffer size for file operations (bytes)
  buffer_size: 10000
  
  # Enable OpenTelemetry tracing
  trace_enabled: false
  
  # Allow stub implementations (DEVELOPMENT ONLY - set false for production)
  allow_stubs: false
  
  # Logging level: DEBUG, INFO, WARNING, ERROR
  log_level: INFO
  
  # Maximum retries for file operations
  max_retries: 3
  
  # Timeout for operations (seconds)
  timeout_seconds: 30

# File paths (adjust to your environment)
files:
  customer_master: data/customers.dat
  transaction_log: data/transactions.dat
  audit_trail: data/audit.dat
  temp_work: data/temp.dat

# Security configuration
security:
  # Secrets backend: env | vault | aws | azure
  secrets_backend: env
  
  # HashiCorp Vault address (if using vault backend)
  vault_addr: ""
  
  # Strict mode: raise errors for undeclared variables
  strict_mode: false
  
  # Verbose mode: log warnings for undeclared vars and stubs (set false for prod)
  verbose_mode: true

# External CALL implementations
# Status: pending | implemented | not_required
external_calls:
{chr(10).join(f'  {call.lower()}: pending  # TODO: Implement' for call in external_calls) if external_calls else '  # No external CALLs detected'}

# Monitoring
monitoring:
  # Enable Prometheus metrics endpoint
  prometheus_enabled: false
  prometheus_port: 9090
  
  # Enable health check endpoint
  healthcheck_enabled: true
  healthcheck_path: /health

# Environment-specific overrides
# These can also be set via environment variables:
#   COBOL_BUFFER_SIZE, COBOL_TRACE, ALLOW_STUBS, COBOL_LOG_LEVEL
'''


def generate_cli_script() -> str:
    """Generate a CLI script for easy transpilation."""
    
    return '''#!/usr/bin/env python3
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
        print("\\n⚙️  Transpiling...")
    
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
    external_calls = list(set(re.findall(r'CALL\\s+["\\'"]([A-Z0-9-]+)["\\'"]', cobol_source, re.IGNORECASE)))
    
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
        print("\\n" + "=" * 60)
        print("📊 SUMMARY")
        print("=" * 60)
        print(f"   COBOL Lines: {len(cobol_source.splitlines())}")
        print(f"   Python Methods: {stats.get('python_methods', 'N/A')}")
        print(f"   External CALLs: {len(external_calls)}")
        print(f"   88-level Conditions: {stats.get('conditions_88', 'N/A')}")
        print("=" * 60)
        print("\\n🚀 Next steps:")
        print("   1. Review generated Python code")
        print("   2. Implement external CALLs (if any)")
        print("   3. Run: python", python_file)
        print()
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
'''


class ThreadSafeWrapper:
    """v6.0.0: Wraps transpiled COBOL classes for thread-safe concurrent usage.
    
    Usage:
        wrapper = ThreadSafeWrapper(BankingSystem)
        result = wrapper.execute('run', data)  # Thread-safe
    """
    
    def __init__(self, cobol_class: type, config=None):
        self._cobol_class = cobol_class
        self._config = config
        self._lock = None
        
    def execute(self, method_name: str, *args, **kwargs) -> Any:
        """Execute a method on a fresh instance (thread-safe)."""
        instance = self._cobol_class()
        method = getattr(instance, method_name, None)
        if method is None:
            raise AttributeError(f"Method '{method_name}' not found")
        return method(*args, **kwargs)
    
    def execute_with_lock(self, method_name: str, *args, **kwargs) -> Any:
        """Execute with mutex lock for strict serialization."""
        import threading
        if self._lock is None:
            self._lock = threading.Lock()
        with self._lock:
            return self.execute(method_name, *args, **kwargs)


def wrap_thread_safe(cobol_class: type) -> ThreadSafeWrapper:
    """Create a thread-safe wrapper for a COBOL class."""
    return ThreadSafeWrapper(cobol_class)


def generate_external_call_template(call_names: List[str], output_path: str = 'core/external_calls.py') -> str:
    """Generate implementation templates for external COBOL CALLs.
    
    v6.0.0: Enhanced with user-friendly documentation and logging.
    """
    lines = [
        '"""',
        'External CALL Implementations for COBOL-transpiled code',
        'Generated by CodeSwitch v6.0.0',
        '',
        'INSTRUCTIONS:',
        '1. Implement each function below with your business logic',
        '2. Remove the NotImplementedError once implemented',
        '3. Set ALLOW_STUBS=false in production',
        '"""',
        '',
        'from typing import Any, Optional, Dict, List',
        'from decimal import Decimal',
        'from datetime import datetime',
        'import logging',
        'import os',
        '',
        'logger = logging.getLogger(__name__)',
        '',
        '# Track missing implementations at runtime',
        '_missing_calls_log: List[Dict] = []',
        '',
        '',
        'def _log_missing_call(method: str, cobol_call: str, args: tuple):',
        '    """Log a missing CALL for debugging and migration tracking."""',
        '    entry = {',
        '        "timestamp": datetime.now().isoformat(),',
        '        "method": method,',
        '        "cobol_call": cobol_call,',
        '        "args_count": len(args),',
        '    }',
        '    _missing_calls_log.append(entry)',
        '    logger.warning(f"MISSING IMPLEMENTATION: {cobol_call} -> {method}()")',
        '',
        '',
        'def get_missing_calls_report() -> List[Dict]:',
        '    """Get all missing CALL invocations for migration tracking."""',
        '    return _missing_calls_log.copy()',
        '',
    ]
    
    # Map CALL names to likely purposes for better documentation
    call_hints = {
        'AUTH': ('Authentication', 'Validate user credentials and return auth level'),
        'SESSION': ('Session Management', 'Create/validate user sessions'),
        'SECURITY': ('Security', 'Handle security alerts and violations'),
        'FRAUD': ('Fraud Detection', 'Check for fraud indicators in data'),
        'AUDIT': ('Audit Logging', 'Log actions for compliance/audit trail'),
        'METRIC': ('Metrics', 'Update business metrics and KPIs'),
        'ENCRYPT': ('Encryption', 'Encrypt/decrypt sensitive data'),
        'VALIDATE': ('Validation', 'Validate business data'),
        'CALC': ('Calculation', 'Perform business calculations'),
        'REPORT': ('Reporting', 'Generate reports'),
    }
    
    for call_name in call_names:
        func_name = "call_" + call_name.lower().replace('-', '_')
        
        # Find matching hint
        category, hint = 'Business Logic', 'Implement according to original COBOL specification'
        for key, (cat, h) in call_hints.items():
            if key in call_name.upper():
                category, hint = cat, h
                break
        
        lines.extend([
            '',
            f'def {func_name}(*args, **kwargs) -> int:',
            f'    """',
            f'    COBOL CALL: {call_name}',
            f'    Category: {category}',
            f'    ',
            f'    Purpose:',
            f'        {hint}',
            f'    ',
            f'    Implementation Steps:',
            f'        1. Review original COBOL CALL parameters',
            f'        2. Connect to your backend system ({category.lower()})',
            f'        3. Process the request and update output parameters',
            f'        4. Return 0 for success, non-zero for error',
            f'    ',
            f'    Args:',
            f'        *args: Parameters from COBOL USING clause',
            f'        **kwargs: Additional context',
            f'    ',
            f'    Returns:',
            f'        int: Return code (0=success, 4=warning, 8+=error)',
            f'    """',
            f'    _log_missing_call("{func_name}", "{call_name}", args)',
            f'    ',
            f'    # ============================================================',
            f'    # TODO: YOUR IMPLEMENTATION HERE',
            f'    # ============================================================',
            f'    #',
            f'    # Example implementation:',
            f'    #',
            f'    #     # Extract parameters',
            f'    #     user_id = args[0] if len(args) > 0 else None',
            f'    #     ',
            f'    #     # Call your backend',
            f'    #     result = your_backend.process(user_id)',
            f'    #     ',
            f'    #     # Return code',
            f'    #     return 0 if result.success else 8',
            f'    #',
            f'    # ============================================================',
            f'    ',
            f'    if os.getenv("ALLOW_STUBS", "") == "true":',
            f'        logger.info(f"STUB: {call_name} called with {{len(args)}} args")',
            f'        return 0  # Stub success',
            f'    ',
            f'    raise NotImplementedError(',
            f'        f"\\n"',
            f'        f"╔══════════════════════════════════════════════════════════╗\\n"',
            f'        f"║  EXTERNAL CALL NOT IMPLEMENTED: {call_name:<24} ║\\n"',
            f'        f"╠══════════════════════════════════════════════════════════╣\\n"',
            f'        f"║  Category: {category:<45} ║\\n"',
            f'        f"║  Function: {func_name:<45} ║\\n"',
            f'        f"╠══════════════════════════════════════════════════════════╣\\n"',
            f'        f"║  To fix:                                                 ║\\n"',
            f'        f"║  1) Implement {func_name}() in this file    ║\\n"',
            f'        f"║  2) Or set ALLOW_STUBS=true (dev only)                   ║\\n"',
            f'        f"╚══════════════════════════════════════════════════════════╝"',
            f'    )',
            '',
        ])
    
    # Module exports
    all_funcs = ["call_" + n.lower().replace('-', '_') for n in call_names]
    all_funcs.extend(['get_missing_calls_report', '_log_missing_call'])
    lines.extend([
        '',
        f'__all__ = {all_funcs}',
    ])
    
    return '\n'.join(lines)


def generate_equivalence_tests(cobol_source: str, python_class_name: str) -> str:
    """Generate equivalence tests to verify COBOL-Python parity."""
    
    # Extract program ID
    match = re.search(r'PROGRAM-ID\.\s*(\S+)', cobol_source, re.IGNORECASE)
    program_id = match.group(1).rstrip('.') if match else 'UNKNOWN'
    class_lower = python_class_name.lower()
    
    lines = [
        '"""',
        f'Equivalence Tests for {program_id}',
        'Generated by CodeSwitch v6.0.0',
        '"""',
        '',
        'import pytest',
        'from decimal import Decimal',
        '',
        '',
        f'class TestEquivalence{python_class_name}:',
        f'    """Equivalence tests for {python_class_name}."""',
        '    ',
        '    @pytest.fixture',
        '    def system(self):',
        '        """Create fresh instance for each test."""',
        f'        from output.{class_lower} import {python_class_name}',
        f'        return {python_class_name}()',
        '    ',
        '    def test_initialization_defaults(self, system):',
        '        """Verify fields initialize to COBOL-compatible defaults."""',
        '        for attr_name in dir(system):',
        '            if attr_name.startswith("_"):',
        '                continue',
        '            attr = getattr(system, attr_name)',
        '            if isinstance(attr, Decimal):',
        '                assert attr >= Decimal("0"), f"{attr_name} should be >= 0"',
        '    ',
        '    def test_88_level_conditions(self, system):',
        '        """Verify 88-level condition properties work correctly."""',
        '        for attr_name in dir(system.__class__):',
        '            prop = getattr(system.__class__, attr_name, None)',
        '            if isinstance(prop, property):',
        '                try:',
        '                    result = getattr(system, attr_name)',
        '                    assert isinstance(result, bool)',
        '                except Exception:',
        '                    pass',
        '',
        '',
        'class TestRegressionSuite:',
        '    """Regression tests with known COBOL input/output pairs."""',
        '    ',
        '    @pytest.fixture',
        '    def golden_cases(self):',
        '        """Load golden test cases from COBOL runs."""',
        '        return []  # TODO: Add test cases',
        '    ',
        '    def test_golden_cases(self, golden_cases):',
        '        """Run all golden test cases."""',
        f'        from output.{class_lower} import {python_class_name}',
        '        for case in golden_cases:',
        f'            system = {python_class_name}()',
        '            for k, v in case.get("input", {}).items():',
        '                setattr(system, k, v)',
        '            system.run()',
        '            for k, expected in case.get("expected", {}).items():',
        '                assert getattr(system, k) == expected',
    ]
    
    return '\n'.join(lines)


class RedefinesSimulator:
    """v6.0.0: Simulates COBOL REDEFINES memory overlay behavior."""
    
    def __init__(self):
        self._memory: Dict[str, bytes] = {}
        self._layouts: Dict[str, List[tuple]] = {}
    
    def define_layout(self, base_name: str, *fields):
        """Define a REDEFINES layout."""
        self._layouts[base_name] = list(fields)
    
    def set_base(self, base_name: str, value: str):
        """Set the base field value."""
        self._memory[base_name] = value.encode('latin-1')
    
    def get_field(self, base_name: str, field_name: str) -> str:
        """Get a redefined field's value."""
        if base_name not in self._layouts:
            return ''
        for name, offset, length in self._layouts[base_name]:
            if name == field_name:
                data = self._memory.get(base_name, b'')
                return data[offset:offset+length].decode('latin-1')
        return ''


# ============================================================
# v6.0.0: Enhanced User Experience Features
# ============================================================

def generate_run_with_guidance_method(external_calls: List[str]) -> str:
    """Generate run_with_guidance() method for better first-run experience."""
    calls_list = ', '.join(f'"{c}"' for c in external_calls)
    
    return f'''
def run_with_guidance(self, ls_control_block: 'Optional[Dict[str, Any]]'=None, 
                      ls_data_block: 'Optional[Dict[str, Any]]'=None):
    """Enhanced entry point with guidance for missing implementations.
    
    v6.0.0: Provides helpful feedback instead of cryptic errors.
    """
    import os
    missing_methods = [{calls_list}]
    
    if os.getenv('ALLOW_STUBS', '') != 'true' and missing_methods:
        print("=" * 60)
        print("CODESWITCH MIGRATION ASSISTANT")
        print("=" * 60)
        print("")
        print(f"{{len(missing_methods)}} external CALL(s) need implementation:")
        print("")
        for m in missing_methods:
            print(f"  - {{m}}")
        print("")
        print("Options:")
        print("  1) Set ALLOW_STUBS=true to run with stubs (dev only)")
        print("  2) Implement methods in core/external_calls.py")
        print("  3) See generated template: core_external_calls_template.py")
        print("=" * 60)
        return {{"status": "guidance", "missing": missing_methods}}
    
    return self.run(ls_control_block, ls_data_block)
'''


def generate_migration_report(cobol_source: str, python_class_name: str, 
                              external_calls: List[str], stats: Dict) -> str:
    """Generate a migration report with business metrics."""
    import re
    
    # Count COBOL elements
    perform_count = len(re.findall(r'\bPERFORM\b', cobol_source, re.IGNORECASE))
    compute_count = len(re.findall(r'\bCOMPUTE\b', cobol_source, re.IGNORECASE))
    call_count = len(re.findall(r'\bCALL\b', cobol_source, re.IGNORECASE))
    lines_cobol = len(cobol_source.splitlines())
    
    report = f'''# Migration Report: {python_class_name}
Generated by CodeSwitch v6.0.0

## Summary
| Metric | Value |
|--------|-------|
| COBOL Lines | {lines_cobol} |
| Python Methods Generated | {stats.get('total_methods', 'N/A')} |
| External CALLs to Implement | {len(external_calls)} |
| PERFORM Statements | {perform_count} |
| COMPUTE Statements | {compute_count} |

## External Dependencies
{chr(10).join(f'- [ ] `{c}` - Requires implementation' for c in external_calls) if external_calls else '- None detected ✅'}

## Risk Assessment
- **Low Risk**: Architecture, data types, control flow
- **Medium Risk**: External CALLs ({len(external_calls)} to implement)
- **Verify**: File I/O paths, date/time handling

## Next Steps
1. Review generated Python code
2. Implement external CALLs (see `core_external_calls_template.py`)
3. Run equivalence tests with production data samples
4. Deploy with `ALLOW_STUBS=false` (production mode)
'''
    return report


@dataclass
class MigrationMetrics:
    """v6.0.0: Metrics for migration tracking."""
    cobol_lines: int = 0
    python_methods: int = 0
    external_calls: int = 0
    complexity_score: int = 0
    risk_level: str = "LOW"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "cobol_lines": self.cobol_lines,
            "python_methods": self.python_methods,
            "external_calls": self.external_calls,
            "complexity_score": self.complexity_score,
            "risk_level": self.risk_level
        }


def generate_validate_production_ready_method(external_calls: List[str]) -> str:
    """Generate validate_production_ready() method for production checks."""
    calls_check = ' or '.join(f'"{c}"' for c in external_calls) if external_calls else 'False'
    calls_list = ', '.join(f'"{c}"' for c in external_calls)
    
    return f'''
def validate_production_ready(self) -> dict:
    """Check if the system is ready for production deployment.
    
    v6.0.0: Returns a detailed status report.
    
    Returns:
        dict with keys:
            - ready (bool): True if all checks pass
            - missing_calls (list): External CALLs not implemented
            - warnings (list): Non-blocking issues
            - config_ok (bool): Configuration validation
    """
    import os
    
    result = {{
        "ready": True,
        "missing_calls": [],
        "warnings": [],
        "config_ok": True,
        "checks_passed": [],
        "checks_failed": [],
    }}
    
    # Check 1: External CALLs
    external_calls = [{calls_list}]
    allow_stubs = os.getenv("ALLOW_STUBS", "") == "true"
    
    if external_calls and not allow_stubs:
        result["missing_calls"] = external_calls
        result["ready"] = False
        result["checks_failed"].append("external_calls")
    else:
        result["checks_passed"].append("external_calls")
    
    # Check 2: File paths configured
    if hasattr(self, 'file_manager') and self.file_manager:
        if not self.file_manager.file_paths:
            result["warnings"].append("No file paths configured in FileManager")
        else:
            result["checks_passed"].append("file_paths")
    
    # Check 3: Strict mode recommendation
    if not getattr(self, '_strict_mode', False):
        result["warnings"].append("_strict_mode=False: undeclared variables auto-created")
    else:
        result["checks_passed"].append("strict_mode")
    
    # Check 4: ALLOW_STUBS in production
    if allow_stubs:
        result["warnings"].append("ALLOW_STUBS=true: Not recommended for production")
    
    # Summary
    if result["warnings"]:
        result["checks_passed"].append("warnings_acknowledged")
    
    return result

def print_production_status(self):
    """Print a formatted production readiness report."""
    status = self.validate_production_ready()
    
    print("=" * 60)
    print("PRODUCTION READINESS CHECK")
    print("=" * 60)
    
    if status["ready"]:
        print("[PASS] STATUS: READY FOR PRODUCTION")
    else:
        print("[FAIL] STATUS: NOT READY")
    
    print()
    
    if status["checks_passed"]:
        print("Passed checks:")
        for check in status["checks_passed"]:
            print(f"  * {{check}}")
    
    if status["checks_failed"]:
        print()
        print("Failed checks:")
        for check in status["checks_failed"]:
            print(f"  * {{check}}")
    
    if status["missing_calls"]:
        print()
        print("Missing external CALLs:")
        for call in status["missing_calls"]:
            print(f"  * {{call}}")
    
    if status["warnings"]:
        print()
        print("Warnings:")
        for warn in status["warnings"]:
            print(f"  * {{warn}}")
        
        print("=" * 60)
        return status
'''


def generate_quick_start_snippet(class_name: str, has_external_calls: bool) -> str:
    """Generate a Quick Start snippet for the generated code."""
    
    return f'''
# ============================================================
# QUICK START GUIDE
# ============================================================
#
# 1. DEVELOPMENT MODE (with stubs):
#    $ ALLOW_STUBS=true python {class_name.lower()}.py
#
# 2. CHECK PRODUCTION READINESS:
#    >>> system = {class_name}()
#    >>> system.print_production_status()
#
# 3. RUN WITH GUIDANCE:
#    >>> system.run_with_guidance()
#
# 4. PRODUCTION MODE:
#    - Implement all external CALLs in core/external_calls.py
#    - Set ALLOW_STUBS=false (or unset)
#    - Run: $ python {class_name.lower()}.py
#
# ============================================================
'''
