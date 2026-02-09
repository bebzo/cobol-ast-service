#!/usr/bin/env python3
"""
Test script to verify COBOL to Python transpilation is working
"""

import requests
import json

# Small COBOL test program
COBOL_TEST = """       IDENTIFICATION DIVISION.
       PROGRAM-ID. HELLO-WORLD.
       AUTHOR. TEST-HACKATHON.
      * Simple Hello World program

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-MESSAGE     PIC X(50) VALUE 'Hello from COBOL!'.

       PROCEDURE DIVISION.
           DISPLAY WS-MESSAGE
           STOP RUN."""

def test_transpiler():
    print("Testing COBOL to Python transpilation...")
    print("=" * 60)
    
    # Test local API
    try:
        response = requests.post(
            "http://localhost:3000/api/transpile",
            json={"cobolCode": COBOL_TEST},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✓ API responded successfully")
            print(f"\nSuccess: {result.get('success', False)}")
            print(f"Python code generated: {len(result.get('python_code', ''))} chars")
            print(f"Unit tests: {len(result.get('unit_tests', ''))} chars")
            
            print("\n" + "=" * 60)
            print("GENERATED PYTHON CODE:")
            print("=" * 60)
            print(result.get('python_code', 'No code generated'))
            
            print("\n" + "=" * 60)
            print("UNIT TESTS:")
            print("=" * 60)
            print(result.get('unit_tests', 'No tests generated'))
            
            # Check for production quality indicators
            python_code = result.get('python_code', '')
            
            quality_checks = {
                "Has dataclass": "dataclass" in python_code,
                "Has type hints": ": str" in python_code or ": int" in python_code,
                "Has Decimal import": "from decimal import" in python_code,
                "Has docstring": '"""' in python_code,
                "Has error handling": "try:" in python_code or "except" in python_code,
                "Has proper main guard": "if __name__" in python_code,
            }
            
            print("\n" + "=" * 60)
            print("PRODUCTION QUALITY CHECKS:")
            print("=" * 60)
            all_passed = True
            for check, passed in quality_checks.items():
                status = "✓" if passed else "✗"
                print(f"  {status} {check}")
                if not passed:
                    all_passed = False
            
            if all_passed:
                print("\n🎉 ALL PRODUCTION QUALITY CHECKS PASSED!")
            else:
                print("\n⚠️ Some production quality checks failed")
            
            return result
        else:
            print(f"✗ API error: {response.status_code}")
            print(response.text)
            return None
            
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to local server")
        print("Make sure the Next.js dev server is running on port 3000")
        return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

if __name__ == "__main__":
    test_transpiler()
