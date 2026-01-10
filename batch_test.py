#!/usr/bin/env python3
"""Batch test COBOL files against production API"""
import subprocess
import json
import sys

API_URL = "https://cobol-ast-service.vercel.app/api/analyse"

TEST_FILES = [
    "cobol-ast-service/test.cbl",
    "cobol-fix/mega.cbl",
    "cobol-fix/test_large.cbl",
    "cobol-fix/test-patterns.cbl",
    "ENTERPRISE-BANKING.cbl",
]

def test_file(filepath):
    try:
        with open(filepath, 'r') as f:
            cobol_code = f.read()
    except FileNotFoundError:
        return {"file": filepath, "status": "SKIP", "reason": "File not found"}
    
    lines = cobol_code.split('\n')
    if len(lines) > 300:
        cobol_code = '\n'.join(lines[:300])
    
    payload = json.dumps({"cobolCode": cobol_code, "options": {"target": "python"}})
    
    result = subprocess.run(
        ["curl", "-s", "-X", "POST", API_URL,
         "-H", "Content-Type: application/json",
         "-d", payload],
        capture_output=True, text=True, timeout=120
    )
    
    if result.returncode != 0:
        return {"file": filepath, "status": "FAIL", "reason": "curl error"}
    
    try:
        response = json.loads(result.stdout)
    except json.JSONDecodeError:
        return {"file": filepath, "status": "FAIL", "reason": "Invalid JSON"}
    
    if "error" in response:
        return {"file": filepath, "status": "FAIL", "reason": response.get("error")}
    
    python_code = response.get("python_code", "")
    if not python_code:
        return {"file": filepath, "status": "FAIL", "reason": "No Python code"}
    
    # Write to temp file for syntax check (avoids quote escaping issues)
    with open('/tmp/test_code.py', 'w') as f:
        f.write(python_code)
    
    syntax_check = subprocess.run(
        ["python3", "-m", "py_compile", "/tmp/test_code.py"],
        capture_output=True, text=True
    )
    
    if syntax_check.returncode == 0:
        return {"file": filepath, "status": "PASS", "lines": len(python_code.split('\n'))}
    else:
        error = syntax_check.stderr.split('\n')[0] if syntax_check.stderr else "Syntax error"
        return {"file": filepath, "status": "FAIL", "reason": error[:80]}

print("=" * 60)
print("BATCH TEST: COBOL → Python Syntax Validation")
print("=" * 60)

passed = failed = skipped = 0

for filepath in TEST_FILES:
    print(f"\n📄 Testing: {filepath}")
    result = test_file(filepath)
    
    if result["status"] == "PASS":
        print(f"   ✅ PASS - {result.get('lines', '?')} lines")
        passed += 1
    elif result["status"] == "SKIP":
        print(f"   ⏭️  SKIP - {result.get('reason')}")
        skipped += 1
    else:
        print(f"   ❌ FAIL - {result.get('reason')}")
        failed += 1

print("\n" + "=" * 60)
print(f"RESULTS: {passed} passed, {failed} failed, {skipped} skipped")
print("=" * 60)
