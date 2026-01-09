"""Python validation endpoint - ensures code compiles with aggressive fixes."""
from http.server import BaseHTTPRequestHandler
import json
import ast
import re

try:
    import autopep8
    HAS_AUTOPEP8 = True
except ImportError:
    HAS_AUTOPEP8 = False

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(body)
            python_code = data.get('code', '')
            result = validate_and_fix(python_code)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()


def validate_and_fix(code: str) -> dict:
    """Validate Python code and fix ALL errors aggressively."""
    # Normalize line endings (remove Windows \r)
    code = code.replace('\r\n', '\n').replace('\r', '\n')
    
    original_lines = len(code.split('\n'))
    fixes_applied = 0
    
    # === PHASE 0: autopep8 automatic fixes ===
    if HAS_AUTOPEP8:
        try:
            code = autopep8.fix_code(code, options={'aggressive': 2, 'max_line_length': 120})
            fixes_applied += 1
        except:
            pass  # Continue with manual fixes if autopep8 fails
    
    # === PHASE 0.5: Clean garbage at end of file ===
    # Remove trailing garbage parentheses
    lines = code.split('\n')
    while lines:
        last = lines[-1].strip()
        # Remove lines that are just closing brackets/parens
        if last and all(c in ')]}' for c in last):
            lines.pop()
            fixes_applied += 1
        else:
            break
    code = '\n'.join(lines)
    
    # === PHASE 0.52: Fix unclosed triple-quoted strings at end of file ===
    # Count triple quotes - if odd, add closing
    triple_double = code.count('"""')
    triple_single = code.count("'''")
    if triple_double % 2 == 1:
        # Unclosed docstring - close it
        code = code.rstrip() + '\n"""'
        fixes_applied += 1
    if triple_single % 2 == 1:
        code = code.rstrip() + "\n'''"
        fixes_applied += 1
    
    # === PHASE 0.53: Fix truncated function/class bodies ===
    # If file ends abruptly without proper closure
    lines = code.split('\n')
    if lines:
        last_line = lines[-1].strip()
        # If last line is incomplete (ends with operator, comma, etc.)
        if last_line and last_line[-1] in ',:+-*/=(&|':
            lines[-1] = '# TRUNCATED: ' + last_line
            lines.append('    pass  # End of truncated code')
            fixes_applied += 1
            code = '\n'.join(lines)
    
    # === PHASE 0.55: Flatten deeply nested parentheses (Python limit ~100) ===
    # Prevent "too many nested parentheses" error
    lines = code.split('\n')
    for i, line in enumerate(lines):
        # Count max nesting depth on this line
        max_depth = 0
        current_depth = 0
        for char in line:
            if char == '(':
                current_depth += 1
                max_depth = max(max_depth, current_depth)
            elif char == ')':
                current_depth -= 1
        
        # If nesting exceeds 50, flatten redundant parens
        if max_depth > 50:
            # Remove redundant double/triple parentheses
            original = line
            while '((' in line:
                # Only flatten if matched pairs
                line = re.sub(r'\(\(([^()]*)\)\)', r'(\1)', line)
                if line == original:  # No change, prevent infinite loop
                    break
                original = line
            if lines[i] != line:
                lines[i] = line
                fixes_applied += 1
    code = '\n'.join(lines)
    
    # === PHASE 0.6: Fix @decorator without following def/class ===
    lines = code.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        # Check for @classmethod, @staticmethod, @property without a def following
        if stripped.startswith('@') and stripped in ['@classmethod', '@staticmethod', '@property', '@abstractmethod']:
            # Look at next non-empty, non-comment line
            j = i + 1
            while j < len(lines) and (not lines[j].strip() or lines[j].strip().startswith('#')):
                j += 1
            if j < len(lines):
                next_stripped = lines[j].strip()
                # If next line is not a def, comment out the decorator
                if not next_stripped.startswith('def '):
                    lines[i] = '# ORPHAN_DEC: ' + stripped
                    fixes_applied += 1
        i += 1
    code = '\n'.join(lines)
    
    # === PHASE 0.7: Fix @dataclass) -> @dataclass ===
    code = re.sub(r'@dataclass\)', '@dataclass', code)
    
    # === PHASE 0.8: Fix docstring fragments without quotes ===
    lines = code.split('\n')
    for i, line in enumerate(lines):
        stripped = line.strip()
        # Lines that look like docstring content but aren't in quotes
        # Pattern: text followed by " - description"
        if stripped and not stripped.startswith('#') and not stripped.startswith('"""'):
            # Check if it's a naked docstring-like line inside a class (no = sign, ends with description-like text)
            if ' - ' in stripped and not '=' in stripped.split(' - ')[0]:
                # Check if previous line is a class definition
                if i > 0:
                    prev = lines[i-1].strip()
                    if prev.startswith('class ') or prev.startswith('def ') or prev == '"""':
                        # This is likely a docstring fragment - make it a comment
                        indent = len(line) - len(line.lstrip())
                        lines[i] = ' ' * indent + '# ' + stripped
                        fixes_applied += 1
    code = '\n'.join(lines)
    
    # === PHASE 0.9: Fix """...""") -> """...""" ===
    code = re.sub(r'"""\s*\)', '"""', code)
    
    # === PHASE 0.95: Comment out lines that are clearly not Python ===
    lines = code.split('\n')
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped or stripped.startswith('#') or stripped.startswith('"""') or stripped.startswith("'''"):
            continue
        # Lines that are not valid Python but look like docstring fragments/metadata
        # Pattern 1: "word word - description" without assignment
        # Pattern 2: "Word word: number unit" like "Record length: 1012 bytes"
        if re.match(r'^[a-z_]+\s+[a-z_]+\s*-\s+', stripped, re.IGNORECASE):
            indent = len(line) - len(line.lstrip())
            lines[i] = ' ' * indent + '# META: ' + stripped
            fixes_applied += 1
        elif re.match(r'^[A-Z][a-z]+\s+\w+:\s*\d+\s+\w+$', stripped):
            indent = len(line) - len(line.lstrip())
            lines[i] = ' ' * indent + '# META: ' + stripped
            fixes_applied += 1
    code = '\n'.join(lines)
    
    # === PHASE 1: Pre-processing fixes ===
    
    # Fix lines with unclosed parentheses (truncated expressions)
    lines = code.split('\n')
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            continue
        # Count parens on this line
        open_p = stripped.count('(')
        close_p = stripped.count(')')
        # If more opens than closes, and line doesn't end with operator/comma, close it
        if open_p > close_p:
            # Check if next line continues this expression
            if i + 1 < len(lines):
                next_stripped = lines[i + 1].strip()
                # If next line is except/finally/else or at lower indent, close the parens
                if next_stripped.startswith(('except', 'finally', 'else', 'elif')):
                    lines[i] = line.rstrip() + ')' * (open_p - close_p)
                    fixes_applied += 1
    code = '\n'.join(lines)
    
    # Fix unbalanced triple quotes - more robust approach
    # Find lines with only one """ and close them
    lines = code.split('\n')
    in_docstring = False
    for i, line in enumerate(lines):
        count = line.count('"""')
        if count == 1:
            if not in_docstring:
                in_docstring = True
            else:
                in_docstring = False
        elif count == 2:
            # Self-contained docstring, no change
            pass
    # If still in docstring at end, close it
    if in_docstring:
        lines.append('"""')
        fixes_applied += 1
    code = '\n'.join(lines)
    
    # Also check global balance
    if code.count('"""') % 2 == 1:
        code += '\n"""'
        fixes_applied += 1
    
    # Remove orphaned trailing """
    lines = code.split('\n')
    while lines and lines[-1].strip() == '"""':
        # Check if this is a closing docstring or orphaned
        count_before = '\n'.join(lines[:-1]).count('"""')
        if count_before % 2 == 0:
            # Orphaned - remove it
            lines.pop()
            fixes_applied += 1
        else:
            break
    code = '\n'.join(lines)
    
    # Fix lines with unbalanced quotes (truncated strings)
    lines = code.split('\n')
    for i, line in enumerate(lines):
        # Skip lines with triple quotes
        if '"""' in line or "'''" in line:
            continue
        # Count quotes (excluding escaped)
        clean_line = line.replace('\\"', '').replace("\\'", '')
        if clean_line.count('"') % 2 == 1:
            # Unbalanced double quote - close it
            lines[i] = line.rstrip() + '"'
            fixes_applied += 1
        elif clean_line.count("'") % 2 == 1:
            # Unbalanced single quote - close it
            lines[i] = line.rstrip() + "'"
            fixes_applied += 1
    code = '\n'.join(lines)
    
    # Fix strings with literal newlines (should use \n)
    lines = code.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]
        # Line ends with open string like: + '  or + "
        if (line.rstrip().endswith("+ '") or line.rstrip().endswith('+ "')) and i + 1 < len(lines):
            quote = "'" if line.rstrip().endswith("'") else '"'
            next_line = lines[i + 1].strip()
            # Merge with next line that closes the string
            if next_line in ["')", '")', "']", '"]', "'", '"', "');", '");']:
                lines[i] = line.rstrip() + '\\n' + quote + next_line[1:]
                lines.pop(i + 1)
                fixes_applied += 1
                continue
        i += 1
    code = '\n'.join(lines)
    
    # Fix imports merged into function/class definitions
    lines = code.split('\n')
    imports_to_add = []
    for i, line in enumerate(lines):
        # Check if line has both def/class and import statement merged
        if ('def ' in line or 'class ' in line) and ('from ' in line and ' import ' in line):
            # Extract the import part
            match = re.search(r'(from\s+\w+\s+import\s+\w+)', line)
            if match:
                import_stmt = match.group(1)
                imports_to_add.append(import_stmt)
                # Remove import from the line
                clean_line = line.replace(import_stmt, '')
                # Fix any broken type hints (e.g., WsIncidentRecor -> str)
                clean_line = re.sub(r':\s*\w*\)', ': str)', clean_line)
                lines[i] = clean_line
                fixes_applied += 1
    # Add imports at top
    if imports_to_add:
        for imp in imports_to_add:
            lines.insert(0, imp)
    code = '\n'.join(lines)
    
    # Fix truncated function definitions
    lines = code.split('\n')
    for i, line in enumerate(lines):
        s = line.rstrip()
        if s.startswith('def ') and '(' in s:
            if not s.endswith(':'):
                if ')' not in s:
                    lines[i] = s + ') -> None:'
                else:
                    lines[i] = s + ':'
                fixes_applied += 1
    code = '\n'.join(lines)
    
    # Fix truncated class definitions
    code = re.sub(r'^(class\s+\w+)\s*$', r'\1:', code, flags=re.MULTILINE)
    
    # Fix broken docstrings on multiple lines
    code = re.sub(r'"""([^"]*)\n([^"]*representing[^"]*""")', r'"""\1 \2', code)
    
    # Fix split docstrings ("""Text """ followed by orphaned text""")
    lines = code.split('\n')
    for i, line in enumerate(lines):
        s = line.strip()
        # Line ends with """ """ (empty-ish docstring)
        if s.endswith('"""') and s.count('"""') == 2 and i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            # Next line is orphaned docstring fragment
            if next_line.endswith('"""') and not next_line.startswith('"""') and not next_line.startswith('#'):
                # Merge: remove closing """ from current, append next line
                lines[i] = line.rstrip()[:-3] + ' ' + next_line
                lines[i + 1] = ''
                fixes_applied += 1
    code = '\n'.join(lines)
    
    # Fix orphaned lines starting with keywords (class, for, if, etc.) without proper context
    lines = code.split('\n')
    for i, line in enumerate(lines):
        s = line.strip()
        # Line starts with keyword but is clearly a docstring fragment
        if s and not s.startswith('#') and not s.startswith('"""'):
            # Check if line looks like docstring fragment: ends with """ and starts with lowercase
            if s.endswith('"""') and (s[0].islower() or s.startswith('for ') or s.startswith('class ') or s.startswith('if ')):
                # Check if previous line has unclosed docstring
                if i > 0:
                    prev = lines[i - 1].strip()
                    if prev.endswith('"""') and prev.count('"""') >= 2:
                        # Merge with previous line
                        lines[i - 1] = lines[i - 1].rstrip()[:-3] + ' ' + s
                        lines[i] = ''
                        fixes_applied += 1
                    elif '"""' in prev and prev.count('"""') == 1:
                        # Previous line has open docstring - close it and comment this
                        lines[i] = '# DOCFRAG: ' + s
                        fixes_applied += 1
    code = '\n'.join(lines)
    
    # Fix lines that are just closing quotes with text
    lines = code.split('\n')
    for i, line in enumerate(lines):
        s = line.strip()
        # Orphaned closing pattern: text followed by """
        if s.endswith('"""') and not s.startswith('"""') and not s.startswith('#'):
            if not any(s.startswith(kw) for kw in ['def ', 'class ', 'return ', 'if ', 'elif ', 'else:', 'for ', 'while ', 'try:', 'except', 'finally:', 'with ', 'raise ', 'assert ', 'pass', 'break', 'continue', 'import ', 'from ', 'global ', 'nonlocal ', 'yield ', 'async ', 'await ']):
                # Looks like orphaned docstring fragment - comment it
                if i > 0 and '"""' not in lines[i - 1]:
                    lines[i] = '# ORPHAN: ' + s
                    fixes_applied += 1
    code = '\n'.join(lines)
    
    # Fix truncated docstrings (line has """ but no closing """)
    lines = code.split('\n')
    for i, line in enumerate(lines):
        s = line.strip()
        # Docstring starts but doesn't close on same line
        if s.startswith('"""') and s.count('"""') == 1:
            # Check if next non-empty line is def/class (means this docstring is orphaned)
            for j in range(i + 1, min(i + 5, len(lines))):
                next_s = lines[j].strip()
                if next_s == '':
                    continue
                if next_s.startswith('def ') or next_s.startswith('class ') or next_s.startswith('@'):
                    lines[i] = line.rstrip() + '"""'
                    fixes_applied += 1
                break
    code = '\n'.join(lines)
    
    # Remove orphaned docstring fragments
    code = re.sub(r'^\s*[a-z_]+\s+representing\s+\w+\.\s*"""', '', code, flags=re.MULTILINE)
    
    # Fix unclosed parentheses in function calls (line ends with comma or open paren)
    lines = code.split('\n')
    for i, line in enumerate(lines):
        s = line.rstrip()
        if s.endswith(',') and i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            if next_line.startswith('def ') or next_line.startswith('class ') or next_line == '':
                lines[i] = s[:-1] + ')'
                fixes_applied += 1
    code = '\n'.join(lines)
    
    # Fix empty class/function bodies (add pass)
    lines = code.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]
        s = line.rstrip()
        if (s.lstrip().startswith('class ') or s.lstrip().startswith('def ')) and s.endswith(':'):
            indent = len(line) - len(line.lstrip())
            j = i + 1
            needs_pass = True
            # Look for first non-comment, non-empty line
            while j < len(lines):
                next_line = lines[j]
                next_stripped = next_line.strip()
                # Skip empty lines and comments
                if next_stripped == '' or next_stripped.startswith('#'):
                    j += 1
                    continue
                # Check if it's a decorator or new class/def at same level
                if next_stripped.startswith('@') or next_stripped.startswith('class ') or next_stripped.startswith('def '):
                    needs_pass = True
                    break
                # Check indentation
                next_indent = len(next_line) - len(next_line.lstrip())
                if next_indent > indent:
                    needs_pass = False
                break
            if needs_pass:
                lines.insert(i + 1, ' ' * (indent + 4) + 'pass')
                fixes_applied += 1
                i += 1  # Skip the inserted line
        i += 1
    code = '\n'.join(lines)
    
    # === ADDITIONAL PREVENTIVE FIXES ===
    
    # Fix indented lines after 'pass' (should be at same level or less)
    lines = code.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if stripped == 'pass' and i + 1 < len(lines):
            pass_indent = len(line) - len(line.lstrip())
            j = i + 1
            while j < len(lines):
                next_line = lines[j]
                next_stripped = next_line.strip()
                if next_stripped == '' or next_stripped.startswith('#'):
                    j += 1
                    continue
                next_indent = len(next_line) - len(next_line.lstrip())
                # If next code line is MORE indented than pass, it's orphaned
                if next_indent > pass_indent:
                    # Check if it's a valid block start
                    if not next_stripped.startswith(('def ', 'class ', '@', 'if ', 'for ', 'while ', 'try:', 'with ')):
                        lines[j] = ' ' * pass_indent + next_stripped
                        fixes_applied += 1
                break
            i = j
        else:
            i += 1
    code = '\n'.join(lines)
    
    # Fix inline function definitions (def x(): pass\n    code)
    lines = code.split('\n')
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('def ') and ': pass' in stripped and i + 1 < len(lines):
            func_indent = len(line) - len(line.lstrip())
            next_line = lines[i + 1]
            next_stripped = next_line.strip()
            if next_stripped and not next_stripped.startswith('#'):
                next_indent = len(next_line) - len(next_line.lstrip())
                if next_indent > func_indent:
                    # Orphaned line after inline function - dedent it
                    lines[i + 1] = ' ' * func_indent + next_stripped
                    fixes_applied += 1
    code = '\n'.join(lines)
    
    # Fix missing colons after if/elif/else/for/while/try/except/finally/with
    # Only for standalone keywords, not inline statements
    lines = code.split('\n')
    for i, line in enumerate(lines):
        s = line.rstrip()
        stripped = s.lstrip()
        # Only fix standalone else/try/finally (not else: x = y)
        if stripped == 'else' or stripped == 'try' or stripped == 'finally':
            lines[i] = s + ':'
            fixes_applied += 1
        # Fix if/elif/for/while/with ending with ) but no :
        elif (stripped.startswith(('if ', 'elif ', 'for ', 'while ', 'with ')) 
              and stripped.endswith(')') and not stripped.endswith(':')):
            lines[i] = s + ':'
            fixes_applied += 1
    code = '\n'.join(lines)
    
    # Fix class/def with wrong indentation after decorator
    lines = code.split('\n')
    for i, line in enumerate(lines):
        s = line.strip()
        if s.startswith('@') and i + 1 < len(lines):
            decorator_indent = len(line) - len(line.lstrip())
            next_line = lines[i + 1]
            next_stripped = next_line.strip()
            if next_stripped.startswith('class ') or next_stripped.startswith('def '):
                next_indent = len(next_line) - len(next_line.lstrip())
                if next_indent != decorator_indent:
                    # Fix indentation to match decorator
                    lines[i + 1] = ' ' * decorator_indent + next_stripped
                    fixes_applied += 1
    code = '\n'.join(lines)
    
    # Fix orphaned decorators (@ without following def/class)
    lines = code.split('\n')
    for i, line in enumerate(lines):
        s = line.strip()
        if s.startswith('@') and i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            if not next_line.startswith('def ') and not next_line.startswith('class ') and not next_line.startswith('@'):
                lines[i] = '# DECORATOR: ' + line
                fixes_applied += 1
    code = '\n'.join(lines)
    
    # Fix lines ending with operators (incomplete expressions)
    lines = code.split('\n')
    for i, line in enumerate(lines):
        s = line.rstrip()
        if s.endswith((' +', ' -', ' *', ' /', ' =', ' ==', ' and', ' or', ' not')):
            if i + 1 < len(lines) and lines[i + 1].strip():
                # Merge with next line
                lines[i] = s + ' ' + lines[i + 1].strip()
                lines[i + 1] = ''
                fixes_applied += 1
    code = '\n'.join(lines)
    
    # Fix lines ending with backslash continuation followed by empty/comment line
    lines = code.split('\n')
    for i, line in enumerate(lines):
        s = line.rstrip()
        if s.endswith('\\') and i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            if not next_line or next_line.startswith('#'):
                # Remove the backslash and add a placeholder
                lines[i] = s[:-1].rstrip() + ' 0  # continuation_fix'
                fixes_applied += 1
    code = '\n'.join(lines)
    
    # Remove duplicate blank lines (more than 2 in a row)
    code = re.sub(r'\n{4,}', '\n\n\n', code)
    
    # Fix f-strings with unbalanced braces
    lines = code.split('\n')
    for i, line in enumerate(lines):
        if 'f"' in line or "f'" in line:
            if line.count('{') != line.count('}'):
                # Try to balance braces
                diff = line.count('{') - line.count('}')
                if diff > 0:
                    lines[i] = line.rstrip() + '}' * diff
                    fixes_applied += 1
    code = '\n'.join(lines)
    
    # === PHASE 2.5: Fix empty if/elif/else blocks preemptively ===
    lines = code.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        indent = len(line) - len(line.lstrip())
        
        # Handle try blocks - must have except or finally
        if stripped == 'try:':
            # Find if there's an except/finally at same indent level
            j = i + 1
            has_except = False
            while j < len(lines):
                check_line = lines[j]
                check_stripped = check_line.strip()
                if not check_stripped:
                    j += 1
                    continue
                check_indent = len(check_line) - len(check_line.lstrip())
                if check_indent == indent and (check_stripped.startswith('except') or check_stripped.startswith('finally')):
                    has_except = True
                    break
                if check_indent <= indent and not check_stripped.startswith('#'):
                    # Hit same or lower indent without except/finally
                    break
                j += 1
            if not has_except:
                # Insert except after try body
                # Find end of try body (first line at same indent)
                k = i + 1
                while k < len(lines):
                    kline = lines[k]
                    kstripped = kline.strip()
                    if not kstripped:
                        k += 1
                        continue
                    kindent = len(kline) - len(kline.lstrip())
                    if kindent <= indent:
                        break
                    k += 1
                lines.insert(k, ' ' * indent + 'except Exception:\n' + ' ' * (indent + 4) + 'pass')
                fixes_applied += 1
        
        # Check for if/elif/else/for/while/except/finally/with ending with :
        elif stripped.endswith(':') and any(stripped.startswith(kw) for kw in ['if ', 'elif ', 'else', 'for ', 'while ', 'except', 'finally', 'with ']):
            # Check if next non-empty line needs a pass
            j = i + 1
            needs_pass = False
            while j < len(lines):
                next_line = lines[j]
                next_stripped = next_line.strip()
                if not next_stripped:
                    j += 1
                    continue
                next_indent = len(next_line) - len(next_line.lstrip())
                if next_indent <= indent:
                    needs_pass = True
                break
            if needs_pass:
                lines.insert(i + 1, ' ' * (indent + 4) + 'pass')
                fixes_applied += 1
                i += 1
        i += 1
    code = '\n'.join(lines)
    
    # === PHASE 3: Iterative AST-based fixing ===
    max_iterations = 500
    fixed_lines_set = set()
    
    for iteration in range(max_iterations):
        try:
            compile(code, '<validate>', 'exec')
            # Check code wasn't gutted
            code_lines = len([l for l in code.split('\n') if l.strip()])
            if code_lines < original_lines * 0.1:
                return {
                    'valid': False,
                    'code': code,
                    'fixes': fixes_applied,
                    'lines': len(code.split('\n')),
                    'original_lines': original_lines,
                    'error': 'Code reduced to less than 10%'
                }
            return {
                'valid': True,
                'code': code,
                'fixes': fixes_applied,
                'lines': len(code.split('\n')),
                'original_lines': original_lines
            }
        except SyntaxError as e:
            line_num = e.lineno or 1
            lines = code.split('\n')
            
            if line_num > len(lines):
                # EOF error - likely unclosed string/paren
                code += '\n"""'
                fixes_applied += 1
                continue
            
            error_line = lines[line_num - 1]
            error_msg = str(e.msg).lower() if e.msg else ''
            
            # Already tried this line - remove it entirely
            if line_num in fixed_lines_set:
                lines[line_num - 1] = ''
                code = '\n'.join(lines)
                fixes_applied += 1
                continue
            
            fixed_lines_set.add(line_num)
            
            # Specific error handlers
            if 'unterminated string' in error_msg or 'unterminated triple' in error_msg or 'string literal' in error_msg:
                # Try closing the string on current line
                fixed = False
                if '"""' in error_line:
                    lines[line_num - 1] = error_line + '"""'
                    fixed = True
                elif "'''" in error_line:
                    lines[line_num - 1] = error_line + "'''"
                    fixed = True
                elif '"' in error_line:
                    lines[line_num - 1] = error_line + '"'
                    fixed = True
                elif "'" in error_line:
                    lines[line_num - 1] = error_line + "'"
                    fixed = True
                else:
                    # Check previous lines for unclosed string
                    for j in range(line_num - 2, max(-1, line_num - 10), -1):
                        if j < 0:
                            break
                        prev = lines[j]
                        prev_clean = prev.replace('\\"', '').replace("\\'", '')
                        if prev_clean.count('"') % 2 == 1:
                            lines[j] = prev.rstrip() + '"'
                            fixed = True
                            break
                        elif prev_clean.count("'") % 2 == 1:
                            lines[j] = prev.rstrip() + "'"
                            fixed = True
                            break
                    if not fixed:
                        lines[line_num - 1] = '# STRFIX: ' + error_line
                fixes_applied += 1
            
            elif 'expected an indented block' in error_msg:
                # Check if current line is elif/else - need pass before it
                error_stripped = error_line.strip()
                if error_stripped.startswith('elif ') or error_stripped.startswith('else'):
                    indent = len(error_line) - len(error_line.lstrip())
                    lines.insert(line_num - 1, ' ' * (indent + 4) + 'pass')
                    fixes_applied += 1
                    fixed_lines_set.discard(line_num)  # Don't mark as fixed, line numbers shifted
                    code = '\n'.join(lines)
                    continue
                else:
                    # Find the class/def that needs the pass - search further back
                    found = False
                    for j in range(line_num - 2, max(-1, line_num - 50), -1):
                        if j < 0:
                            break
                        prev = lines[j].rstrip()
                        prev_stripped = prev.strip()
                        # Skip empty lines and comments
                        if prev_stripped == '' or prev_stripped.startswith('#'):
                            continue
                        if prev.endswith(':') and (prev_stripped.startswith('class ') or prev_stripped.startswith('def ') or prev_stripped.startswith('if ') or prev_stripped.startswith('else') or prev_stripped.startswith('elif ') or prev_stripped.startswith('try') or prev_stripped.startswith('except') or prev_stripped.startswith('finally') or prev_stripped.startswith('for ') or prev_stripped.startswith('while ') or prev_stripped.startswith('with ')):
                            indent = len(lines[j]) - len(lines[j].lstrip())
                            lines.insert(j + 1, ' ' * (indent + 4) + 'pass')
                            fixes_applied += 1
                            found = True
                            break
                    if not found:
                        # Fallback: add pass at current position
                        indent = len(error_line) - len(error_line.lstrip())
                        lines.insert(line_num - 1, ' ' * (indent + 4) + 'pass')
                        fixes_applied += 1
            
            elif "expected 'except' or 'finally'" in error_msg:
                # Find the try block and add except
                for j in range(line_num - 2, -1, -1):
                    if lines[j].strip().startswith('try:'):
                        indent = len(lines[j]) - len(lines[j].lstrip())
                        lines.insert(line_num - 1, ' ' * indent + 'except Exception:\n' + ' ' * (indent + 4) + 'pass')
                        fixes_applied += 1
                        break
                else:
                    lines[line_num - 1] = '# TRY: ' + error_line
            
            elif 'unexpected indent' in error_msg:
                # Remove the unexpected indentation or comment out
                lines[line_num - 1] = '# INDENT: ' + error_line.lstrip()
                fixes_applied += 1
                # Check if this creates an empty block and add pass
                for j in range(line_num - 2, -1, -1):
                    prev = lines[j].rstrip()
                    if prev.endswith(':') and not prev.strip().startswith('#'):
                        # Check if block is now empty (only comments)
                        block_empty = True
                        indent = len(lines[j]) - len(lines[j].lstrip())
                        for k in range(j + 1, min(j + 20, len(lines))):
                            check_line = lines[k]
                            check_stripped = check_line.strip()
                            if not check_stripped or check_stripped.startswith('#'):
                                continue
                            check_indent = len(check_line) - len(check_line.lstrip())
                            if check_indent > indent:
                                block_empty = False
                            break
                        if block_empty:
                            lines.insert(j + 1, ' ' * (indent + 4) + 'pass')
                            fixes_applied += 1
                        break
            
            elif 'unexpected unindent' in error_msg or 'unindent does not match' in error_msg:
                # Fix unexpected unindent - usually means a block was left open
                # Find the line and add proper indentation or close the block
                error_line = lines[line_num - 1] if line_num <= len(lines) else ''
                current_indent = len(error_line) - len(error_line.lstrip())
                
                # Look back to find the block that should contain this line
                for j in range(line_num - 2, max(-1, line_num - 30), -1):
                    if j < 0:
                        break
                    prev = lines[j].rstrip()
                    prev_stripped = prev.strip()
                    if not prev_stripped or prev_stripped.startswith('#'):
                        continue
                    prev_indent = len(lines[j]) - len(lines[j].lstrip())
                    
                    # If previous non-empty line ends with : and is at same/lower indent
                    # We need to add pass before current line
                    if prev.endswith(':') and prev_indent < current_indent:
                        # Block header found - add pass to close it properly
                        lines.insert(j + 1, ' ' * (prev_indent + 4) + 'pass')
                        fixes_applied += 1
                        break
                    elif prev_indent >= current_indent and not prev.endswith(':'):
                        # Found a properly indented line at same level - issue is something else
                        # Just comment out the problematic line
                        lines[line_num - 1] = '# UNINDENT: ' + error_line.lstrip()
                        fixes_applied += 1
                        break
                else:
                    # Fallback: comment out the line
                    lines[line_num - 1] = '# UNINDENT: ' + error_line.lstrip()
                    fixes_applied += 1
            
            elif 'was never closed' in error_msg:
                # Unclosed paren/bracket
                if '(' in error_line and ')' not in error_line:
                    lines[line_num - 1] = error_line.rstrip() + ')'
                elif '[' in error_line and ']' not in error_line:
                    lines[line_num - 1] = error_line.rstrip() + ']'
                elif '{' in error_line and '}' not in error_line:
                    lines[line_num - 1] = error_line.rstrip() + '}'
                else:
                    lines[line_num - 1] = '# ' + error_line
                fixes_applied += 1
            
            elif 'invalid decimal literal' in error_msg:
                # Usually caused by unclosed string earlier - comment this line
                lines[line_num - 1] = '# DECIMAL: ' + error_line
                fixes_applied += 1
            
            elif 'cannot assign' in error_msg or 'cannot delete' in error_msg:
                # Invalid assignment target
                lines[line_num - 1] = '# ASSIGN: ' + error_line
                fixes_applied += 1
            
            elif 'return' in error_msg and 'outside function' in error_msg:
                # Return outside function - comment it
                lines[line_num - 1] = '# RETURN: ' + error_line
                fixes_applied += 1
            
            elif 'break' in error_msg or 'continue' in error_msg:
                # Break/continue outside loop
                lines[line_num - 1] = '# LOOP: ' + error_line
                fixes_applied += 1
            
            elif 'global' in error_msg or 'nonlocal' in error_msg:
                # Global/nonlocal declaration issue - remove the global line
                lines[line_num - 1] = '# GLOBAL: ' + error_line
                fixes_applied += 1
            
            elif 'too many nested parentheses' in error_msg:
                # Python parser limit exceeded (~100 nesting levels)
                # Flatten the problematic expression by removing redundant parentheses
                if line_num - 1 < len(lines):
                    problem_line = lines[line_num - 1]
                    # Remove redundant double parentheses like ((...))
                    flattened = re.sub(r'\(\(([^()]+)\)\)', r'(\1)', problem_line)
                    # If still has too many, just simplify aggressively
                    if flattened == problem_line:
                        # Remove every other opening paren at start of nested expression
                        flattened = re.sub(r'\(\(', '(', problem_line)
                    if flattened != problem_line:
                        lines[line_num - 1] = flattened
                        fixes_applied += 1
                    else:
                        # Last resort: comment out and replace with placeholder
                        lines[line_num - 1] = '# NESTED_PAREN: ' + problem_line.strip()
                        fixes_applied += 1
            
            elif 'unexpected eof' in error_msg:
                # EOF while parsing - usually unclosed parens
                # Count parens in entire code
                open_parens = code.count('(') - code.count(')')
                open_brackets = code.count('[') - code.count(']')
                open_braces = code.count('{') - code.count('}')
                closing = ')' * max(0, open_parens) + ']' * max(0, open_brackets) + '}' * max(0, open_braces)
                if closing:
                    code = code.rstrip() + closing
                    fixes_applied += 1
                else:
                    code = code.rstrip() + '\npass'
                    fixes_applied += 1
            
            elif 'invalid syntax' in error_msg or 'expected' in error_msg or 'forgot a comma' in error_msg:
                # Check if previous line has backslash continuation
                if line_num > 1:
                    prev_line = lines[line_num - 2].rstrip()
                    if prev_line.endswith('\\'):
                        # Remove backslash and add 0
                        lines[line_num - 2] = prev_line[:-1].rstrip() + ' 0  # continuation_fix'
                        fixes_applied += 1
                        code = '\n'.join(lines)
                        continue
                # Comment out the line
                if not error_line.strip().startswith('#'):
                    lines[line_num - 1] = '# SYNTAX: ' + error_line
                    fixes_applied += 1
                    # Check if this creates an empty block and add pass
                    for j in range(line_num - 2, -1, -1):
                        prev = lines[j].rstrip()
                        if prev.endswith(':') and not prev.strip().startswith('#'):
                            block_empty = True
                            indent = len(lines[j]) - len(lines[j].lstrip())
                            for k in range(j + 1, min(j + 20, len(lines))):
                                check_line = lines[k]
                                check_stripped = check_line.strip()
                                if not check_stripped or check_stripped.startswith('#'):
                                    continue
                                check_indent = len(check_line) - len(check_line.lstrip())
                                if check_indent > indent:
                                    block_empty = False
                                break
                            if block_empty:
                                lines.insert(j + 1, ' ' * (indent + 4) + 'pass')
                                fixes_applied += 1
                            break
            
            else:
                # Generic: comment out
                lines[line_num - 1] = '# ERROR: ' + error_line
                fixes_applied += 1
            
            code = '\n'.join(lines)
    
    # === PHASE 3: Fix unclosed parentheses in return/call statements ===
    # This handles multi-line function calls - find the end and close parens there
    lines = code.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if stripped.startswith('return cls(') or stripped.startswith('return self(') or (stripped.startswith('return ') and '(' in stripped):
            # Count parens on this line
            open_p = stripped.count('(')
            close_p = stripped.count(')')
            if open_p > close_p:
                # This is a multi-line call - find where it ends
                # Look for consecutive lines ending with comma (arguments)
                j = i + 1
                last_arg_idx = i  # Track the last argument line
                while j < len(lines):
                    next_line = lines[j]
                    next_stripped = next_line.strip()
                    
                    # Empty line - check if next non-empty is a def/class (end of call)
                    if not next_stripped:
                        # Look ahead to see if call continues
                        k = j + 1
                        while k < len(lines) and not lines[k].strip():
                            k += 1
                        if k < len(lines):
                            peek = lines[k].strip()
                            if peek.startswith('def ') or peek.startswith('class ') or peek.startswith('@'):
                                # Call ends here
                                break
                        j += 1
                        continue
                    
                    # Check if it's an argument line (has = or starts with keyword arg pattern)
                    if '=' in next_stripped and (next_stripped.endswith(',') or next_stripped.endswith('),') or next_stripped.endswith(')')):
                        open_p += next_stripped.count('(')
                        close_p += next_stripped.count(')')
                        last_arg_idx = j
                        j += 1
                        continue
                    
                    # Check if it ends with just ) - the closing
                    if next_stripped == ')' or next_stripped == '),':
                        close_p += 1
                        last_arg_idx = j
                        j += 1
                        continue
                    
                    # If line starts with def/class, the call should end before
                    if next_stripped.startswith('def ') or next_stripped.startswith('class ') or next_stripped.startswith('@'):
                        break
                    
                    # Not part of the call - we need to close before this line
                    break
                
                # Now close the parens at the last argument line
                if open_p > close_p and last_arg_idx > i:
                    # Close the parens on the last argument line
                    last_line = lines[last_arg_idx].rstrip()
                    if last_line.endswith(','):
                        last_line = last_line[:-1]  # Remove trailing comma
                    lines[last_arg_idx] = last_line + ')' * (open_p - close_p)
                    fixes_applied += 1
                i = j if j > i else i + 1
                continue
        i += 1
    code = '\n'.join(lines)
    
    # === PHASE 3.1: Fix unclosed dict/list before commented lines ===
    lines = code.split('\n')
    open_brackets = 0  # Track { and [
    for i, line in enumerate(lines):
        trimmed = line.strip()
        if trimmed.startswith('#'):
            # If we have open brackets and hit a comment, close them on previous line
            if open_brackets > 0 and i > 0:
                closing = ('}' * line.count('{') + ']' * line.count('['))[:open_brackets]
                if not closing:
                    closing = '}' * open_brackets  # Default to closing braces
                # Find last non-comment, non-empty line
                for j in range(i - 1, -1, -1):
                    if lines[j].strip() and not lines[j].strip().startswith('#'):
                        lines[j] = lines[j].rstrip() + closing
                        fixes_applied += 1
                        open_brackets = 0
                        break
            continue
        
        # Count brackets (simplified)
        for c in trimmed:
            if c == '{' or c == '[':
                open_brackets += 1
            elif c == '}' or c == ']':
                open_brackets = max(0, open_brackets - 1)
    code = '\n'.join(lines)
    
    # === PHASE 4: Fix orphan code lines (code outside of valid def/class) ===
    # Multi-pass: find commented def/class and comment out their body
    for pass_num in range(20):  # Up to 20 passes
        lines = code.split('\n')
        fixed_lines = []
        orphan_base_indent = None  # The indentation level of the commented def/class
        changes_made = False
        
        for i, line in enumerate(lines):
            trimmed = line.strip()
            current_indent = len(line) - len(line.lstrip()) if line.strip() else 0
            
            # If we have an orphan context, check if we should exit it
            if orphan_base_indent is not None:
                # Check if this line starts a new def/class at same or lower indent (valid code resumes)
                if trimmed.startswith('def ') or trimmed.startswith('class ') or trimmed.startswith('@'):
                    if current_indent <= orphan_base_indent:
                        orphan_base_indent = None  # Exit orphan context
            
            # Detect commented function/class definition at start of line
            # Pattern: "# SOMETHING:     def ..." or "# SOMETHING: def ..."
            if re.match(r'^#\s*\w+:\s*(def\s+|class\s+)', trimmed):
                # This line is a commented def/class - anything indented after should be orphaned
                # Set base_indent to current line's indent (0 for top-level comment)
                orphan_base_indent = current_indent
                fixed_lines.append(line)
                continue
            
            # If we're in an orphaned body (inside a commented def/class)
            if orphan_base_indent is not None and current_indent > orphan_base_indent:
                if trimmed and not trimmed.startswith('#'):
                    indent_str = ' ' * current_indent
                    fixed_lines.append(f"{indent_str}# ORPHAN: {trimmed}")
                    fixes_applied += 1
                    changes_made = True
                    continue
            
            fixed_lines.append(line)
        
        code = '\n'.join(fixed_lines)
        if not changes_made:
            break
    
    # === PHASE 4.5: Fix lines with unclosed parens followed by comments ===
    lines = code.split('\n')
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            continue
        # Count parens on this line
        open_p = stripped.count('(') - stripped.count(')')
        if open_p > 0:
            # This line has unclosed parens - check if next lines are comments
            if i + 1 < len(lines):
                next_stripped = lines[i + 1].strip()
                if next_stripped.startswith('#'):
                    # Next line is a comment - close the parens here
                    lines[i] = line.rstrip() + ')' * open_p
                    fixes_applied += 1
    code = '\n'.join(lines)
    
    # === PHASE 4.6: Fix try blocks whose except was commented out ===
    lines = code.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        indent = len(line) - len(line.lstrip())
        
        if stripped == 'try:':
            # Find if there's an except/finally at same indent level (not commented)
            j = i + 1
            has_except = False
            try_body_end = i + 1
            while j < len(lines):
                check_line = lines[j]
                check_stripped = check_line.strip()
                if not check_stripped:
                    j += 1
                    continue
                check_indent = len(check_line) - len(check_line.lstrip())
                # If we're back at try's indent and it's except/finally, we're good
                if check_indent == indent and (check_stripped.startswith('except') or check_stripped.startswith('finally')):
                    has_except = True
                    break
                # If we hit same indent that's not except/finally or lower indent, try needs except
                if check_indent <= indent and not check_stripped.startswith('#'):
                    try_body_end = j
                    break
                # Track body
                if check_indent > indent:
                    try_body_end = j + 1
                j += 1
            
            if not has_except:
                # Insert except after try body
                lines.insert(try_body_end, ' ' * indent + 'except Exception:\n' + ' ' * (indent + 4) + 'pass')
                fixes_applied += 1
        i += 1
    code = '\n'.join(lines)
    
    # === FINAL PHASE: Fix any remaining empty blocks ===
    lines = code.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]
        s = line.rstrip()
        if (s.lstrip().startswith('class ') or s.lstrip().startswith('def ')) and s.endswith(':'):
            indent = len(line) - len(line.lstrip())
            j = i + 1
            needs_pass = True
            while j < len(lines):
                next_line = lines[j]
                next_stripped = next_line.strip()
                if next_stripped == '' or next_stripped.startswith('#'):
                    j += 1
                    continue
                if next_stripped.startswith('@') or next_stripped.startswith('class ') or next_stripped.startswith('def '):
                    needs_pass = True
                    break
                next_indent = len(next_line) - len(next_line.lstrip())
                if next_indent > indent:
                    needs_pass = False
                break
            if needs_pass:
                lines.insert(i + 1, ' ' * (indent + 4) + 'pass')
                fixes_applied += 1
                i += 1
        i += 1
    code = '\n'.join(lines)
    
    # Final validation
    try:
        ast.parse(code)
        # Check code is not too short (wasn't gutted by fixes)
        code_lines = len([l for l in code.split('\n') if l.strip()])
        if code_lines < original_lines * 0.1:  # Less than 10% of original = invalid
            return {
                'valid': False,
                'code': code,
                'fixes': fixes_applied,
                'lines': len(code.split('\n')),
                'original_lines': original_lines,
                'error': 'Code was reduced to less than 10% of original'
            }
        return {
            'valid': True,
            'code': code,
            'fixes': fixes_applied,
            'lines': len(code.split('\n')),
            'original_lines': original_lines
        }
    except:
        pass
    
    # Max iterations - force compile by removing all error lines
    return {
        'valid': False,
        'code': code,
        'fixes': fixes_applied,
        'lines': len(code.split('\n')),
        'original_lines': original_lines,
        'error': 'Max iterations reached'
    }
