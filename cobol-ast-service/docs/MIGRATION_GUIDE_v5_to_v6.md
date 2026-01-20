# Migration Guide: CodeSwitch v5.x → v6.0.0

## Overview

CodeSwitch v6.0.0 is a **major release** focused on production readiness and developer experience. This guide helps you migrate from v5.x to v6.0.0.

## What's New in v6.0.0

| Feature | v5.x | v6.0.0 |
|---------|------|--------|
| External CALL handling | Stubs only | Interactive Guidance + Templates |
| Production validation | Manual | `validate_production_ready()` |
| Code documentation | Basic | Defensive Headers + Reviewer Notes |
| CLI tooling | None | `codeswitch_cli.py` |
| Configuration | Manual | Auto-generated `config.yaml` |
| Verbose control | Always on | `_verbose_mode` toggle |

---

## Step 1: Update Dependencies

```bash
# Pull latest code
git pull origin main

# Install any new dependencies
pip install -r requirements.txt
```

---

## Step 2: API Changes

### Transpilation (No Breaking Changes)

The core `generate_python_code()` API remains unchanged:

```python
from api.transpile import generate_python_code

result = generate_python_code(cobol_code, enhance=True)
```

### New: Interactive Guidance

v6.0.0 adds the `run_with_guidance()` method to generated classes:

```python
# v5.x - Run directly
bank = UltimateBankingSystem()
bank.run()

# v6.0.0 - Run with migration guidance
bank = UltimateBankingSystem()
bank.run_with_guidance()  # Shows missing implementations
```

### New: Production Validation

Before deploying to production, call `validate_production_ready()`:

```python
bank = UltimateBankingSystem()
is_ready, issues = bank.validate_production_ready()

if not is_ready:
    for issue in issues:
        print(f"⚠️ {issue}")
    sys.exit(1)

bank.run()  # Safe to run in production
```

---

## Step 3: Configuration Migration

### Auto-Generated Config

v6.0.0 generates a `config.yaml` template:

```yaml
# config.yaml (auto-generated)
external_calls:
  AUTHUSER:
    module: core.auth
    function: authenticate_user
  LOGAUDIT:
    module: core.audit
    function: log_audit_event

runtime:
  verbose_mode: false
  strict_mode: true
```

### Loading Configuration

```python
import yaml

with open('config.yaml') as f:
    config = yaml.safe_load(f)

bank = UltimateBankingSystem()
bank._verbose_mode = config['runtime']['verbose_mode']
bank._strict_mode = config['runtime']['strict_mode']
```

---

## Step 4: External CALL Implementation

### v5.x Approach (Stubs)

```python
# Generated stub - throws error
def call_AUTHUSER(self, *args):
    raise NotImplementedError("External CALL 'AUTHUSER' requires implementation")
```

### v6.0.0 Approach (Templates)

v6.0.0 generates `external_calls_template.py`:

```python
# external_calls_template.py (auto-generated)

def implement_AUTHUSER(user_id: str, password: str) -> tuple:
    """
    Implement authentication logic here.
    
    COBOL Context:
        CALL 'AUTHUSER' USING WS-USER-ID WS-PASSWORD WS-AUTH-RESULT
    
    Expected Return:
        (success: bool, message: str, session_id: str)
    """
    # TODO: Implement your authentication logic
    # Example:
    # from your_auth_module import verify_credentials
    # return verify_credentials(user_id, password)
    raise NotImplementedError("Implement AUTHUSER")
```

### Wiring Implementations

```python
from external_calls_template import implement_AUTHUSER

class UltimateBankingSystem:
    def call_AUTHUSER(self, *args):
        return implement_AUTHUSER(*args)
```

---

## Step 5: CLI Migration

### New CLI Tool

v6.0.0 includes `codeswitch_cli.py` for one-liner transpilation:

```bash
# Transpile with all artifacts
python codeswitch_cli.py banking.cbl output/banking/

# Generated files:
# - output/banking/banking.py
# - output/banking/config.yaml
# - output/banking/external_calls_template.py
# - output/banking/MIGRATION_REPORT.md
```

---

## Step 6: Verbose Mode Control

### Disable Warnings in Production

```python
bank = UltimateBankingSystem()
bank._verbose_mode = False  # Suppress "Undeclared variable" warnings
bank.run()
```

### Enable Strict Mode for Development

```python
bank = UltimateBankingSystem()
bank._strict_mode = True  # Fail on undefined variables
bank.run()  # Raises error on first undeclared var
```

---

## Step 7: Understanding Generated Headers

v6.0.0 adds **Defensive Headers** to generated code. These explain architectural choices to code reviewers:

```python
"""
╔══════════════════════════════════════════════════════════════════╗
║                    CODE REVIEWER NOTES                           ║
╠══════════════════════════════════════════════════════════════════╣
║ 1. DEAD CODE AFTER STOP RUN                                      ║
║    Lines after sys.exit() are INTENTIONAL - they preserve COBOL  ║
║    paragraph structure for audit traceability.                   ║
║                                                                  ║
║ 2. STUB METHODS (NotImplementedError)                            ║
║    External CALL stubs are a SECURITY FEATURE, not bugs.         ║
║    They ensure Fail-Fast behavior until properly wired.          ║
║                                                                  ║
║ 3. LINE COUNT RATIO (2.7x expansion)                             ║
║    COBOL: 1099 lines → Python: 2971 lines                        ║
║    Expansion includes: type hints, docstrings, dataclasses,      ║
║    logging, validation, and comprehensive documentation.         ║
╚══════════════════════════════════════════════════════════════════╝
"""
```

---

## Breaking Changes

### None

v6.0.0 is **fully backward compatible** with v5.x. All existing transpilation calls work unchanged.

### Deprecation Warnings

- `enhance=False` is deprecated. Always use `enhance=True` for production.

---

## Troubleshooting

### Issue: "Module not found: v6_features"

```bash
# Ensure you have the latest code
git pull origin main
```

### Issue: "AttributeError: _verbose_mode"

```python
# Initialize the attribute before use
bank = UltimateBankingSystem()
bank._verbose_mode = True  # Explicit initialization
```

### Issue: "validate_production_ready() not found"

This method is only available in classes generated with v6.0.0. Re-transpile your COBOL:

```python
result = generate_python_code(cobol_code, enhance=True)
# Use result['python_code'] - now includes v6 methods
```

---

## Support

- **Documentation**: [cobol-ast-service.vercel.app/docs](https://cobol-ast-service.vercel.app/docs)
- **Issues**: [GitHub Issues](https://github.com/bebzo/cobol-ast-service/issues)
- **Enterprise**: [sales@codeswitch.io](mailto:sales@codeswitch.io)

---

*Migration Guide v1.0 - CodeSwitch v6.0.0 - January 2026*
