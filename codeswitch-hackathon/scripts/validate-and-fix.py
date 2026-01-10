#!/usr/bin/env python3
"""
Automated Python Code Validation and Fix Detection System
Identifies syntax errors and generates fix patterns for postprocess.ts
"""

import ast
import re
import sys
import json
from pathlib import Path
from typing import List, Dict, Tuple, Optional

class SyntaxErrorAnalyzer:
    """Analyzes Python syntax errors and suggests fixes."""
    
    def __init__(self):
        self.known_patterns = []
        self.new_patterns = []
        
    def analyze_code(self, code: str) -> Dict:
        """Analyze code and return detailed error info."""
        result = {
            "valid": False,
            "errors": [],
            "patterns_found": [],
            "suggested_fixes": []
        }
        
        # First, try to parse
        try:
            ast.parse(code)
            result["valid"] = True
            return result
        except SyntaxError as e:
            result["errors"].append({
                "line": e.lineno,
                "offset": e.offset,
                "msg": e.msg,
                "text": e.text
            })
        
        # Analyze the specific error
        lines = code.split('\n')
        for error in result["errors"]:
            line_num = error["line"]
            if line_num and line_num <= len(lines):
                problem_line = lines[line_num - 1]
                
                # Detect known problematic patterns
                patterns = self._detect_patterns(problem_line, lines, line_num)
                result["patterns_found"].extend(patterns)
                
                # Generate suggested fixes
                fixes = self._suggest_fixes(problem_line, patterns)
                result["suggested_fixes"].extend(fixes)
        
        return result
    
    def _detect_patterns(self, line: str, all_lines: List[str], line_num: int) -> List[Dict]:
        """Detect problematic patterns in the error line."""
        patterns = []
        
        # Pattern 1: Concatenated docstrings
        if '"""' in line:
            docstring_count = line.count('"""')
            if docstring_count > 2:
                patterns.append({
                    "type": "concatenated_docstrings",
                    "description": f"Multiple docstrings on same line ({docstring_count} triple quotes)",
                    "line": line[:100],
                    "regex_fix": 'result = result.replace(/"""([^"]+)"""[A-Za-z]+\\."""[^"]*"""/g, \'"""$1"""\');'
                })
        
        # Pattern 2: self. if hasattr
        if 'self. if' in line or 'self.  if' in line:
            patterns.append({
                "type": "self_if_hasattr",
                "description": "Corrupted self. if hasattr pattern",
                "line": line[:100],
                "regex_fix": "result = result.replace(/self\\.\\s+if\\s+hasattr/g, 'if hasattr');"
            })
        
        # Pattern 3: Orphan self. (without attribute)
        if re.search(r'self\.\s*[,)\]]', line):
            patterns.append({
                "type": "orphan_self",
                "description": "self. without attribute before delimiter",
                "line": line[:100],
                "regex_fix": "result = result.replace(/self\\.\\s*([,)\\]])/g, 'None$1');"
            })
        
        # Pattern 4: Incomplete string literals
        quotes = line.count('"') - line.count('"""') * 3
        if quotes % 2 != 0:
            patterns.append({
                "type": "unbalanced_quotes",
                "description": f"Unbalanced double quotes ({quotes} found)",
                "line": line[:100],
                "regex_fix": "// Add quote balancing logic"
            })
        
        # Pattern 5: def/class without colon
        if re.match(r'^\s*(def|class)\s+\w+', line) and not line.rstrip().endswith(':'):
            patterns.append({
                "type": "missing_colon",
                "description": "def/class without trailing colon",
                "line": line[:100],
                "regex_fix": "// Already handled in fixSyntaxErrors"
            })
        
        # Pattern 6: Random text inside code (not comment, not string)
        if re.match(r'^\s*[A-Z][a-z]+\s+[a-z]+\s+[a-z]+', line) and '=' not in line and ':' not in line:
            if not line.strip().startswith('#') and not line.strip().startswith('"'):
                patterns.append({
                    "type": "prose_in_code",
                    "description": "Prose text in code area",
                    "line": line[:100],
                    "regex_fix": "// Convert to comment or remove"
                })
        
        # Pattern 7: Multiple statements badly merged
        if ';' in line and not line.strip().startswith('#'):
            patterns.append({
                "type": "merged_statements",
                "description": "Multiple statements on one line",
                "line": line[:100],
                "regex_fix": "// Split or remove"
            })
        
        # Pattern 8: Docstring with embedded code
        if '"""' in line and ('def ' in line or 'class ' in line or 'return ' in line):
            if not line.strip().startswith('"""') and not line.strip().endswith('"""'):
                patterns.append({
                    "type": "docstring_with_code",
                    "description": "Docstring mixed with code on same line",
                    "line": line[:100],
                    "regex_fix": 'result = result.replace(/"""[^"]*\\b(def|class|return)\\b[^"]*"""/g, \'"""Documentation."""\');'
                })
        
        # Pattern 9: Generated from artifacts
        if 'Generated from' in line or 'Record length:' in line:
            patterns.append({
                "type": "generator_artifact",
                "description": "Generator artifact text in code",
                "line": line[:100],
                "regex_fix": "result = result.replace(/^\\s*.*Generated from.*$/gm, '');"
            })
        
        # Pattern 10: Incomplete method call
        if re.search(r'\.\w+\($', line.rstrip()):
            # Check if next line closes it
            next_idx = all_lines.index(line) + 1 if line in all_lines else -1
            if next_idx > 0 and next_idx < len(all_lines):
                next_line = all_lines[next_idx].strip()
                if next_line.startswith('def ') or next_line.startswith('class '):
                    patterns.append({
                        "type": "unclosed_call",
                        "description": "Unclosed method call before def/class",
                        "line": line[:100],
                        "regex_fix": "// Already handled in fixUnclosedStatements"
                    })
        
        return patterns
    
    def _suggest_fixes(self, line: str, patterns: List[Dict]) -> List[str]:
        """Generate TypeScript regex fixes for detected patterns."""
        fixes = []
        for p in patterns:
            if p.get("regex_fix") and not p["regex_fix"].startswith("//"):
                fixes.append(p["regex_fix"])
        return fixes

    def full_validation(self, code: str, max_iterations: int = 10) -> Dict:
        """Run validation and attempt to fix iteratively."""
        result = {
            "original_valid": False,
            "final_valid": False,
            "iterations": 0,
            "all_patterns": [],
            "all_fixes": [],
            "remaining_errors": []
        }
        
        # Check original
        analysis = self.analyze_code(code)
        result["original_valid"] = analysis["valid"]
        
        if analysis["valid"]:
            result["final_valid"] = True
            return result
        
        # Collect all patterns
        result["all_patterns"] = analysis["patterns_found"]
        result["all_fixes"] = analysis["suggested_fixes"]
        result["remaining_errors"] = analysis["errors"]
        
        return result


def scan_for_all_patterns(code: str) -> List[Dict]:
    """Scan entire code for ALL problematic patterns, not just at error lines."""
    patterns = []
    lines = code.split('\n')
    
    for i, line in enumerate(lines):
        # Concatenated docstrings
        if line.count('"""') > 2:
            patterns.append({
                "line_num": i + 1,
                "type": "concatenated_docstrings",
                "content": line[:80]
            })
        
        # self. if hasattr
        if re.search(r'self\.\s+if\s+hasattr', line):
            patterns.append({
                "line_num": i + 1,
                "type": "self_if_hasattr",
                "content": line[:80]
            })
        
        # Generated from
        if 'Generated from' in line and not line.strip().startswith('#'):
            patterns.append({
                "line_num": i + 1,
                "type": "generator_artifact",
                "content": line[:80]
            })
        
        # self. in strings
        if re.search(r'"[^"]*self\.[^"]*"', line):
            patterns.append({
                "line_num": i + 1,
                "type": "self_in_string",
                "content": line[:80]
            })
        
        # Orphan self.
        if re.search(r'self\.\s*[,)\]\n]', line):
            patterns.append({
                "line_num": i + 1,
                "type": "orphan_self",
                "content": line[:80]
            })
    
    return patterns


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python validate-and-fix.py <python_file_or_json>")
        print("       python validate-and-fix.py --api-test <url>")
        sys.exit(1)
    
    if sys.argv[1] == "--api-test":
        # Test API endpoint
        import urllib.request
        url = sys.argv[2] if len(sys.argv) > 2 else "https://cobol-ast-service.vercel.app/api/analyse"
        
        # Read COBOL from stdin or use sample
        cobol_code = sys.stdin.read() if not sys.stdin.isatty() else """
       IDENTIFICATION DIVISION.
       PROGRAM-ID. TEST.
       PROCEDURE DIVISION.
           DISPLAY "HELLO".
           STOP RUN.
        """
        
        req_data = json.dumps({"cobolCode": cobol_code}).encode()
        req = urllib.request.Request(url, data=req_data, headers={"Content-Type": "application/json"})
        
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode())
        
        code = data.get("python_code", "")
        print(f"Received {len(code)} chars of Python code")
        
    else:
        # Read from file
        file_path = Path(sys.argv[1])
        
        if file_path.suffix == ".json":
            with open(file_path) as f:
                data = json.load(f)
            code = data.get("python_code", data.get("pythonCode", ""))
        else:
            with open(file_path) as f:
                code = f.read()
    
    # Analyze
    analyzer = SyntaxErrorAnalyzer()
    result = analyzer.full_validation(code)
    
    print("\n" + "="*60)
    print("VALIDATION REPORT")
    print("="*60)
    
    # Check syntax
    try:
        ast.parse(code)
        print("✅ SYNTAX: VALID")
    except SyntaxError as e:
        print(f"❌ SYNTAX ERROR at line {e.lineno}: {e.msg}")
        if e.text:
            print(f"   >>> {e.text.strip()[:100]}")
    
    # Scan for all patterns
    all_patterns = scan_for_all_patterns(code)
    
    if all_patterns:
        print(f"\n⚠️  Found {len(all_patterns)} problematic patterns:")
        for p in all_patterns[:20]:  # Show first 20
            print(f"   Line {p['line_num']}: [{p['type']}] {p['content'][:50]}...")
    else:
        print("\n✅ No known problematic patterns found")
    
    # Show suggested fixes
    if result["all_fixes"]:
        print(f"\n🔧 Suggested TypeScript fixes for postprocess.ts:")
        for fix in set(result["all_fixes"]):
            print(f"   {fix}")
    
    print("\n" + "="*60)
    
    # Exit code
    sys.exit(0 if result.get("final_valid", False) or not all_patterns else 1)


if __name__ == "__main__":
    main()
