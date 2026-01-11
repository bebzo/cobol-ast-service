"""
COBOL → Python Hybrid Transpiler v4.0
AST (structure) + Gemini (logic) + AST (validation)

Pipeline:
1. AST v3.0 generates valid Python structure
2. Gemini enriches TODO methods with business logic
3. AST validates Gemini output (reject if invalid)
4. Final code is 100% syntax valid
"""

import ast
import re
import json
import os
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import google.generativeai as genai

# Import base transpiler
from transpile import parse_cobol, generate_python_ast_v3, to_snake_case, CobolAST

# Configure Gemini
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyBfvnz6r2urB2WiRs_qlSR63uhM_cdZKO4')
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')


@dataclass
class MethodInfo:
    name: str
    start_line: int
    end_line: int
    code: str
    has_todo: bool
    cobol_context: str


def extract_methods(python_code: str) -> List[MethodInfo]:
    """Extract all methods from Python code with line numbers"""
    methods = []
    lines = python_code.split('\n')
    
    method_pattern = re.compile(r'^    def (\w+)\(self\)')
    current_method = None
    current_start = 0
    current_lines = []
    
    for i, line in enumerate(lines):
        match = method_pattern.match(line)
        if match:
            # Save previous method
            if current_method:
                code = '\n'.join(current_lines)
                methods.append(MethodInfo(
                    name=current_method,
                    start_line=current_start,
                    end_line=i - 1,
                    code=code,
                    has_todo='TODO' in code,
                    cobol_context=''
                ))
            # Start new method
            current_method = match.group(1)
            current_start = i
            current_lines = [line]
        elif current_method:
            # Check if still in method (indented or empty)
            if line.startswith('        ') or line.strip() == '' or line.startswith('    def '):
                if not line.startswith('    def '):
                    current_lines.append(line)
            else:
                # End of class or file
                pass
    
    # Don't forget last method
    if current_method and current_lines:
        code = '\n'.join(current_lines)
        methods.append(MethodInfo(
            name=current_method,
            start_line=current_start,
            end_line=len(lines) - 1,
            code=code,
            has_todo='TODO' in code,
            cobol_context=''
        ))
    
    return methods


def find_cobol_paragraph(cobol_source: str, method_name: str) -> str:
    """Find the original COBOL paragraph for a method"""
    # Convert Python method name back to COBOL style
    cobol_name = method_name.upper().replace('_', '-')
    if cobol_name.startswith('P-'):
        cobol_name = cobol_name[2:]
    
    lines = cobol_source.split('\n')
    
    # Find paragraph start
    para_start = -1
    for i, line in enumerate(lines):
        if re.match(rf'^\s{{6,8}}{cobol_name}\s*\.\s*$', line, re.IGNORECASE):
            para_start = i
            break
    
    if para_start == -1:
        return ""
    
    # Find paragraph end (next paragraph or section)
    para_end = para_start + 1
    for i in range(para_start + 1, min(para_start + 50, len(lines))):
        line = lines[i]
        if re.match(r'^\s{6,8}[A-Z0-9][-A-Z0-9]+\s*\.\s*$', line):
            para_end = i
            break
        para_end = i
    
    return '\n'.join(lines[para_start:para_end])


def enrich_method_with_gemini(method: MethodInfo, cobol_context: str) -> Tuple[str, bool]:
    """Use Gemini to enrich a TODO method with real logic"""
    
    prompt = f"""Convert this COBOL to a Python method. Output ONLY valid Python.

COBOL:
{cobol_context}

OUTPUT THIS EXACT FORMAT (fill in the logic):
    def {method.name}(self) -> None:
        \"\"\"Business logic for {method.name}\"\"\"
        self.logger.info("Executing {method.name}")
        # Add your implementation here
        pass

RULES:
- 4 spaces before 'def', 8 spaces for body
- Every if/while/try MUST have code after it (not empty)
- Use self.variable for all variables
- Use Decimal('0') for numbers
- End with pass or return

Output the method now:"""

    try:
        response = model.generate_content(prompt)
        result = response.text.strip()
        
        # Clean up response - remove markdown
        result = re.sub(r'^```python\s*\n?', '', result, flags=re.MULTILINE)
        result = re.sub(r'^```\s*$', '', result, flags=re.MULTILINE)
        result = result.strip()
        
        # Extract just the method if Gemini included extra stuff
        lines = result.split('\n')
        clean_lines = []
        in_method = False
        
        for line in lines:
            # Start capturing at def
            if re.match(r'^\s*def\s+\w+\(self', line):
                in_method = True
                # Normalize to 4-space indent for def
                clean_lines.append('    def ' + re.sub(r'^\s*def\s+', '', line))
            elif in_method:
                # Stop at next def or class
                if re.match(r'^\s*def\s+', line) or re.match(r'^\s*class\s+', line):
                    break
                # Normalize body indent to 8 spaces
                stripped = line.lstrip()
                if stripped:
                    clean_lines.append('        ' + stripped)
                else:
                    clean_lines.append('')
        
        if not clean_lines:
            # Fallback: just wrap everything as method body
            clean_lines = [f'    def {method.name}(self) -> None:']
            clean_lines.append(f'        """Business logic for {method.name}"""')
            for line in lines:
                stripped = line.lstrip()
                if stripped and not stripped.startswith('def ') and not stripped.startswith('class '):
                    clean_lines.append('        ' + stripped)
            if len(clean_lines) == 2:
                clean_lines.append('        pass')
        
        full_method = '\n'.join(clean_lines)
        
        # Ensure method has a body
        if full_method.rstrip().endswith(':'):
            full_method += '\n        pass'
        
        return full_method, True
        
    except Exception as e:
        print(f"[Gemini] Error for {method.name}: {e}")
        return method.code, False


def validate_method_syntax(method_code: str) -> Tuple[bool, str]:
    """Validate method syntax using AST"""
    # Wrap in class to make it valid
    test_code = f"""
class Test:
{method_code}
"""
    try:
        ast.parse(test_code)
        return True, ""
    except SyntaxError as e:
        return False, str(e)


def hybrid_transpile(cobol_source: str, max_gemini_calls: int = 100) -> Dict:
    """
    Hybrid transpilation: AST structure + Gemini logic + AST validation
    """
    results = {
        'success': False,
        'python_code': '',
        'stats': {
            'total_methods': 0,
            'todo_methods': 0,
            'enriched_methods': 0,
            'failed_enrichments': 0,
            'gemini_calls': 0
        }
    }
    
    # Step 1: Parse COBOL and generate base Python with AST
    print("[Step 1] Parsing COBOL and generating AST structure...")
    try:
        cobol_ast = parse_cobol(cobol_source)
        python_ast = generate_python_ast_v3(cobol_ast)
        base_python = ast.unparse(python_ast)
        
        # Validate base
        compile(base_python, '<generated>', 'exec')
        print(f"[Step 1] ✅ Base structure valid: {len(base_python.splitlines())} lines")
        
    except Exception as e:
        results['error'] = f"AST generation failed: {e}"
        return results
    
    # Step 2: Extract methods and identify TODOs
    print("[Step 2] Extracting methods...")
    methods = extract_methods(base_python)
    todo_methods = [m for m in methods if m.has_todo]
    
    results['stats']['total_methods'] = len(methods)
    results['stats']['todo_methods'] = len(todo_methods)
    
    print(f"[Step 2] Found {len(methods)} methods, {len(todo_methods)} with TODO")
    
    # Step 3: Enrich TODO methods with Gemini
    print(f"[Step 3] Enriching methods with Gemini (max {max_gemini_calls} calls)...")
    
    enriched_code = base_python
    gemini_calls = 0
    enriched_count = 0
    failed_count = 0
    
    for method in todo_methods[:max_gemini_calls]:
        # Find COBOL context
        cobol_context = find_cobol_paragraph(cobol_source, method.name)
        
        if not cobol_context:
            continue
        
        # Call Gemini
        gemini_calls += 1
        enriched_method, success = enrich_method_with_gemini(method, cobol_context)
        
        if not success:
            failed_count += 1
            continue
        
        # Step 4: Validate Gemini output with AST
        is_valid, error = validate_method_syntax(enriched_method)
        
        if is_valid:
            # Replace method in code
            enriched_code = enriched_code.replace(method.code, enriched_method)
            enriched_count += 1
            print(f"  ✅ {method.name}")
        else:
            failed_count += 1
            print(f"  ❌ {method.name}: {error[:50]}")
    
    results['stats']['gemini_calls'] = gemini_calls
    results['stats']['enriched_methods'] = enriched_count
    results['stats']['failed_enrichments'] = failed_count
    
    # Step 5: Final validation
    print("[Step 5] Final AST validation...")
    try:
        compile(enriched_code, '<final>', 'exec')
        print("[Step 5] ✅ Final code is valid!")
        results['success'] = True
        results['python_code'] = enriched_code
    except SyntaxError as e:
        print(f"[Step 5] ❌ Final validation failed: {e}")
        # Fallback to base code
        results['success'] = True
        results['python_code'] = base_python
        results['warning'] = 'Fell back to base AST code due to validation error'
    
    return results


# CLI for testing
if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python hybrid_transpile.py <cobol_file> [max_gemini_calls]")
        sys.exit(1)
    
    cobol_file = sys.argv[1]
    max_calls = int(sys.argv[2]) if len(sys.argv) > 2 else 50
    
    with open(cobol_file, 'r') as f:
        cobol_source = f.read()
    
    print(f"Processing {cobol_file} with max {max_calls} Gemini calls...")
    result = hybrid_transpile(cobol_source, max_calls)
    
    if result['success']:
        output_file = cobol_file.replace('.cbl', '_hybrid.py').replace('.CBL', '_hybrid.py')
        with open(output_file, 'w') as f:
            f.write(result['python_code'])
        
        print(f"\n{'='*60}")
        print(f"✅ SUCCESS - Saved to {output_file}")
        print(f"{'='*60}")
        print(f"Stats: {json.dumps(result['stats'], indent=2)}")
    else:
        print(f"❌ FAILED: {result.get('error', 'Unknown error')}")
