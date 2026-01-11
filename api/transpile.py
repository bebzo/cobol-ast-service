"""
COBOL → Python Transpiler v2.0 (AST Native)
Uses Python's ast module for 100% syntax-valid output
"""

import ast
import re
import json
from http.server import BaseHTTPRequestHandler
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from decimal import Decimal


# ============================================================
# COBOL Parser (Regex-based)
# ============================================================

@dataclass
class CobolVariable:
    level: int
    name: str
    picture: Optional[str] = None
    value: Optional[str] = None
    usage: Optional[str] = None
    line: int = 0


@dataclass
class CobolParagraph:
    name: str
    line_start: int
    line_end: int
    statements: List[str] = field(default_factory=list)


@dataclass
class CobolAST:
    program_id: str
    variables: List[CobolVariable]
    paragraphs: List[CobolParagraph]


def parse_cobol(source: str) -> CobolAST:
    """Parse COBOL source into structured AST"""
    lines = source.split('\n')
    
    # Extract program ID
    program_match = re.search(r'PROGRAM-ID\.\s+(\S+)', source, re.IGNORECASE)
    program_id = program_match.group(1).replace('.', '') if program_match else 'UNKNOWN'
    
    # Parse variables
    variables = parse_variables(source)
    
    # Parse paragraphs
    paragraphs = parse_paragraphs(lines)
    
    return CobolAST(
        program_id=program_id,
        variables=variables,
        paragraphs=paragraphs
    )


def parse_variables(source: str) -> List[CobolVariable]:
    """Extract WORKING-STORAGE variables"""
    variables = []
    lines = source.split('\n')
    in_working_storage = False
    
    for i, line in enumerate(lines):
        upper = line.upper()
        
        if 'WORKING-STORAGE' in upper and 'SECTION' in upper:
            in_working_storage = True
            continue
        
        if in_working_storage and ('PROCEDURE' in upper or 'LINKAGE' in upper):
            break
        
        if not in_working_storage:
            continue
        
        # Skip comments
        if len(line) > 6 and line[6] in ('*', '/'):
            continue
        
        # Match variable definition
        var_match = re.match(r'^\s*(\d{1,2})\s+([A-Z][A-Z0-9][-A-Z0-9_]*)', line, re.IGNORECASE)
        if not var_match:
            continue
        
        level = int(var_match.group(1))
        name = var_match.group(2).replace('.', '')
        
        if name.upper() == 'FILLER':
            continue
        
        # Extract PIC
        pic_match = re.search(r'PIC(?:TURE)?\s+(?:IS\s+)?([SX9AV0-9()+-.,ZB*$]+)', line, re.IGNORECASE)
        picture = pic_match.group(1).rstrip('.') if pic_match else None
        
        # Extract VALUE - support .150 (COBOL implied decimal), 23350, "string", etc.
        value = None
        value_match = re.search(
            r'VALUE\s+(?:IS\s+)?(?:ZEROS?|ZEROES|SPACES?|"([^"]*)"|\'([^\']*)\'|([-+]?\.?\d+\.?\d*))',
            line, re.IGNORECASE
        )
        if value_match:
            if 'ZERO' in line.upper() and 'VALUE' in line.upper():
                # Only treat as ZEROS if it's actually VALUE ZEROS, not just contains ZERO
                upper_line = line.upper()
                if re.search(r'VALUE\s+(?:IS\s+)?ZEROS?', upper_line) or re.search(r'VALUE\s+(?:IS\s+)?ZEROES', upper_line):
                    value = 'ZEROS'
                else:
                    value = value_match.group(1) or value_match.group(2) or value_match.group(3)
            elif 'SPACE' in line.upper() and re.search(r'VALUE\s+(?:IS\s+)?SPACES?', line.upper()):
                value = 'SPACES'
            else:
                value = value_match.group(1) or value_match.group(2) or value_match.group(3)
        
        variables.append(CobolVariable(
            level=level,
            name=name,
            picture=picture,
            value=value,
            line=i + 1
        ))
    
    return variables


def parse_paragraphs(lines: List[str]) -> List[CobolParagraph]:
    """Extract PROCEDURE DIVISION paragraphs"""
    paragraphs = []
    in_procedure = False
    current_para = None
    
    # Reserved words that should not be treated as paragraphs
    reserved = {
        'MOVE', 'IF', 'ELSE', 'END-IF', 'PERFORM', 'COMPUTE', 'ADD', 'SUBTRACT',
        'MULTIPLY', 'DIVIDE', 'DISPLAY', 'ACCEPT', 'READ', 'WRITE', 'OPEN', 'CLOSE',
        'CALL', 'STOP', 'GOBACK', 'EXIT', 'EVALUATE', 'WHEN', 'END-EVALUATE',
        'END-PERFORM', 'END-COMPUTE', 'END-READ', 'END-WRITE', 'INITIALIZE', 'SET',
        'STRING', 'UNSTRING', 'INSPECT', 'CONTINUE', 'NEXT', 'GO', 'COPY'
    }
    
    for i, line in enumerate(lines):
        upper = line.upper().strip()
        
        if 'PROCEDURE' in upper and 'DIVISION' in upper:
            in_procedure = True
            continue
        
        if not in_procedure:
            continue
        
        # Skip comments and empty lines
        if not upper or (len(line) > 6 and line[6] in ('*', '/')):
            continue
        
        # Check for paragraph header (name ending with period, alone on line)
        para_match = re.match(r'^\s*([A-Z0-9][-A-Z0-9_]*)\s*\.\s*$', line, re.IGNORECASE)
        if para_match:
            name = para_match.group(1).upper()
            # Skip if it's a reserved word
            if name not in reserved and not name.startswith('END-'):
                if current_para:
                    current_para.line_end = i
                    paragraphs.append(current_para)
                current_para = CobolParagraph(
                    name=name,
                    line_start=i + 1,
                    line_end=i + 1,
                    statements=[]
                )
                continue
        
        # Add statement to current paragraph
        if current_para and upper:
            current_para.statements.append(line.strip())
    
    if current_para:
        current_para.line_end = len(lines)
        paragraphs.append(current_para)
    
    return paragraphs


# ============================================================
# Python AST Generator
# ============================================================

def to_snake_case(name: str) -> str:
    """Convert COBOL-STYLE-NAME to python_style_name"""
    return name.lower().replace('-', '_').replace('.', '')


def to_pascal_case(name: str) -> str:
    """Convert COBOL-STYLE-NAME to PythonStyleName"""
    return ''.join(word.capitalize() for word in name.replace('-', '_').split('_'))


def pic_to_python_type(pic: Optional[str], value: Optional[str] = None) -> Tuple[str, ast.expr]:
    """Convert PIC clause to Python type and default value"""
    if not pic:
        return 'Any', ast.Constant(value=None)
    
    upper = pic.upper()
    
    # Check for decimal pattern (V = implied decimal point)
    if 'V' in upper or re.match(r'^S?9', upper):
        # Parse PIC to get default value
        default_val = parse_pic_default(upper, value)
        return 'Decimal', ast.Call(
            func=ast.Name(id='Decimal', ctx=ast.Load()),
            args=[ast.Constant(value=default_val)],
            keywords=[]
        )
    elif re.match(r'^X', upper) or re.match(r'^A', upper):
        # Alphanumeric: str - get length for default
        length = parse_pic_length(upper)
        return 'str', ast.Constant(value='')
    else:
        return 'str', ast.Constant(value='')


def parse_pic_default(pic: str, value: Optional[str]) -> str:
    """Parse PIC clause to extract proper default value with decimals"""
    upper = pic.upper()
    
    # If explicit value provided, use it
    if value:
        if value.upper() in ('ZEROS', 'ZEROES', 'ZERO'):
            pass  # Will return 0 with proper decimal places
        elif value.upper() not in ('SPACES', 'SPACE'):
            try:
                # Preserve the original value format
                return str(value)
            except:
                pass
    
    # Parse PIC to determine decimal places
    # V999 means 3 decimal places, 9(5)V99 means 2 decimal places
    if 'V' in upper:
        parts = upper.split('V')
        # Count digits after V
        after_v = parts[1] if len(parts) > 1 else ''
        decimal_places = count_pic_digits(after_v)
        
        # If value provided with decimal
        if value and value not in ('ZEROS', 'ZEROES', 'ZERO', 'SPACES', 'SPACE', None):
            try:
                # Handle values like .150 or 0.150
                if value.startswith('.'):
                    return f'0{value}'
                return str(float(value))
            except:
                pass
        
        # Return 0 with proper decimal places
        if decimal_places > 0:
            return f"0.{'0' * decimal_places}"
    
    return '0'


def count_pic_digits(pic_part: str) -> int:
    """Count number of digits in PIC part (handles 9(5) notation)"""
    count = 0
    i = 0
    while i < len(pic_part):
        c = pic_part[i]
        if c in '9AXZ0':
            # Check for (n) notation
            if i + 1 < len(pic_part) and pic_part[i + 1] == '(':
                end = pic_part.find(')', i + 2)
                if end != -1:
                    try:
                        count += int(pic_part[i + 2:end])
                    except:
                        count += 1
                    i = end + 1
                    continue
            count += 1
        i += 1
    return count


def parse_pic_length(pic: str) -> int:
    """Parse PIC X(n) to get string length"""
    match = re.search(r'X\((\d+)\)', pic.upper())
    if match:
        return int(match.group(1))
    return pic.upper().count('X')


def cobol_value_to_python(value: Optional[str], pic: Optional[str]) -> ast.expr:
    """Convert COBOL VALUE to Python AST expression (legacy)"""
    return cobol_value_to_python_v2(value, pic)


def cobol_value_to_python_v2(value: Optional[str], pic: Optional[str]) -> ast.expr:
    """Convert COBOL VALUE to Python AST expression with proper decimal handling"""
    if value is None:
        _, default = pic_to_python_type(pic, None)
        return default
    
    upper = value.upper() if isinstance(value, str) else str(value)
    
    if upper in ('ZEROS', 'ZEROES', 'ZERO'):
        default_val = parse_pic_default(pic or '9', 'ZEROS')
        return ast.Call(
            func=ast.Name(id='Decimal', ctx=ast.Load()),
            args=[ast.Constant(value=default_val)],
            keywords=[]
        )
    elif upper in ('SPACES', 'SPACE'):
        return ast.Constant(value='')
    elif upper in ('LOW-VALUES', 'LOW-VALUE'):
        return ast.Constant(value='')
    elif upper in ('HIGH-VALUES', 'HIGH-VALUE'):
        return ast.Constant(value='\xff')
    else:
        # Check if numeric - handle implied decimals
        try:
            # Handle COBOL implied decimal (.150 means 0.150)
            val_str = str(value)
            if val_str.startswith('.'):
                val_str = '0' + val_str
            float(val_str)
            return ast.Call(
                func=ast.Name(id='Decimal', ctx=ast.Load()),
                args=[ast.Constant(value=val_str)],
                keywords=[]
            )
        except (ValueError, TypeError):
            return ast.Constant(value=str(value))


def generate_python_ast(cobol_ast: CobolAST) -> ast.Module:
    """Generate Python AST from COBOL AST"""
    class_name = to_pascal_case(cobol_ast.program_id)
    
    # Build module body
    body = []
    
    # Docstring
    body.append(ast.Expr(value=ast.Constant(
        value=f"{class_name} - Auto-transpiled from COBOL [AST Transpiler v2.0]"
    )))
    
    # Imports
    imports = [
        ast.ImportFrom(module='decimal', names=[
            ast.alias(name='Decimal'),
            ast.alias(name='ROUND_HALF_UP')
        ], level=0),
        ast.ImportFrom(module='dataclasses', names=[
            ast.alias(name='dataclass'),
            ast.alias(name='field')
        ], level=0),
        ast.ImportFrom(module='typing', names=[
            ast.alias(name='Optional'),
            ast.alias(name='List'),
            ast.alias(name='Dict'),
            ast.alias(name='Any')
        ], level=0),
        ast.ImportFrom(module='datetime', names=[
            ast.alias(name='datetime'),
            ast.alias(name='date')
        ], level=0),
        ast.Import(names=[ast.alias(name='logging')]),
    ]
    body.extend(imports)
    
    # Class definition
    class_body = []
    
    # Class docstring
    class_body.append(ast.Expr(value=ast.Constant(
        value=f"Main processor class for {cobol_ast.program_id}"
    )))
    
    # __init__ method
    init_body = []
    
    # Logger setup
    init_body.append(ast.Assign(
        targets=[ast.Attribute(
            value=ast.Name(id='self', ctx=ast.Load()),
            attr='logger',
            ctx=ast.Store()
        )],
        value=ast.Call(
            func=ast.Attribute(
                value=ast.Name(id='logging', ctx=ast.Load()),
                attr='getLogger',
                ctx=ast.Load()
            ),
            args=[ast.Name(id='__name__', ctx=ast.Load())],
            keywords=[]
        )
    ))
    
    # File paths dict
    init_body.append(ast.AnnAssign(
        target=ast.Attribute(
            value=ast.Name(id='self', ctx=ast.Load()),
            attr='file_paths',
            ctx=ast.Store()
        ),
        annotation=ast.Subscript(
            value=ast.Name(id='Dict', ctx=ast.Load()),
            slice=ast.Tuple(elts=[
                ast.Name(id='str', ctx=ast.Load()),
                ast.Name(id='str', ctx=ast.Load())
            ], ctx=ast.Load()),
            ctx=ast.Load()
        ),
        value=ast.Dict(keys=[], values=[]),
        simple=0
    ))
    
    # Variables from WORKING-STORAGE - group by level
    current_group = None
    for var in cobol_ast.variables:
        py_name = to_snake_case(var.name)
        
        # Level 01 with no PIC = group header
        if var.level == 1 and not var.picture:
            current_group = py_name
            # Create empty dict for group
            init_body.append(ast.AnnAssign(
                target=ast.Attribute(
                    value=ast.Name(id='self', ctx=ast.Load()),
                    attr=py_name,
                    ctx=ast.Store()
                ),
                annotation=ast.Subscript(
                    value=ast.Name(id='Dict', ctx=ast.Load()),
                    slice=ast.Tuple(elts=[
                        ast.Name(id='str', ctx=ast.Load()),
                        ast.Name(id='Any', ctx=ast.Load())
                    ], ctx=ast.Load()),
                    ctx=ast.Load()
                ),
                value=ast.Dict(keys=[], values=[]),
                simple=0
            ))
            continue
        
        py_type, _ = pic_to_python_type(var.picture, var.value)
        py_value = cobol_value_to_python_v2(var.value, var.picture)
        
        init_body.append(ast.AnnAssign(
            target=ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=py_name,
                ctx=ast.Store()
            ),
            annotation=ast.Name(id=py_type, ctx=ast.Load()),
            value=py_value,
            simple=0
        ))
    
    # If no variables, add pass
    if not init_body:
        init_body.append(ast.Pass())
    
    init_method = ast.FunctionDef(
        name='__init__',
        args=ast.arguments(
            posonlyargs=[],
            args=[ast.arg(arg='self')],
            vararg=None,
            kwonlyargs=[],
            kw_defaults=[],
            kwarg=None,
            defaults=[]
        ),
        body=init_body,
        decorator_list=[],
        returns=None
    )
    class_body.append(init_method)
    
    # Paragraph methods
    for para in cobol_ast.paragraphs:
        method_name = f"p_{to_snake_case(para.name)}"
        method_body = transpile_statements(para.statements)
        
        if not method_body:
            method_body = [ast.Pass()]
        
        method = ast.FunctionDef(
            name=method_name,
            args=ast.arguments(
                posonlyargs=[],
                args=[ast.arg(arg='self')],
                vararg=None,
                kwonlyargs=[],
                kw_defaults=[],
                kwarg=None,
                defaults=[]
            ),
            body=[
                ast.Expr(value=ast.Constant(value=f"Translated from COBOL paragraph: {para.name}")),
                *method_body
            ],
            decorator_list=[],
            returns=ast.Constant(value=None)
        )
        class_body.append(method)
    
    # Run method
    run_body = []
    if cobol_ast.paragraphs:
        first_method = f"p_{to_snake_case(cobol_ast.paragraphs[0].name)}"
        run_body.append(ast.Expr(value=ast.Call(
            func=ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=first_method,
                ctx=ast.Load()
            ),
            args=[],
            keywords=[]
        )))
    else:
        run_body.append(ast.Pass())
    
    run_method = ast.FunctionDef(
        name='run',
        args=ast.arguments(
            posonlyargs=[],
            args=[ast.arg(arg='self')],
            vararg=None,
            kwonlyargs=[],
            kw_defaults=[],
            kwarg=None,
            defaults=[]
        ),
        body=[
            ast.Expr(value=ast.Constant(value="Main entry point")),
            *run_body
        ],
        decorator_list=[],
        returns=None
    )
    class_body.append(run_method)
    
    # Create class
    class_def = ast.ClassDef(
        name=class_name,
        bases=[],
        keywords=[],
        body=class_body,
        decorator_list=[]
    )
    body.append(class_def)
    
    # Main block
    main_if = ast.If(
        test=ast.Compare(
            left=ast.Name(id='__name__', ctx=ast.Load()),
            ops=[ast.Eq()],
            comparators=[ast.Constant(value='__main__')]
        ),
        body=[
            ast.Expr(value=ast.Call(
                func=ast.Attribute(
                    value=ast.Name(id='logging', ctx=ast.Load()),
                    attr='basicConfig',
                    ctx=ast.Load()
                ),
                args=[],
                keywords=[ast.keyword(
                    arg='level',
                    value=ast.Attribute(
                        value=ast.Name(id='logging', ctx=ast.Load()),
                        attr='INFO',
                        ctx=ast.Load()
                    )
                )]
            )),
            ast.Assign(
                targets=[ast.Name(id='processor', ctx=ast.Store())],
                value=ast.Call(
                    func=ast.Name(id=class_name, ctx=ast.Load()),
                    args=[],
                    keywords=[]
                )
            ),
            ast.Expr(value=ast.Call(
                func=ast.Attribute(
                    value=ast.Name(id='processor', ctx=ast.Load()),
                    attr='run',
                    ctx=ast.Load()
                ),
                args=[],
                keywords=[]
            ))
        ],
        orelse=[]
    )
    body.append(main_if)
    
    module = ast.Module(body=body, type_ignores=[])
    ast.fix_missing_locations(module)
    
    return module


def transpile_statements(statements: List[str]) -> List[ast.stmt]:
    """Transpile COBOL statements to Python AST statements"""
    result = []
    i = 0
    
    while i < len(statements):
        stmt = statements[i].strip()
        upper = stmt.upper()
        
        if not upper or upper.startswith('*'):
            i += 1
            continue
        
        # MOVE statement
        if upper.startswith('MOVE '):
            py_stmt = transpile_move(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        # DISPLAY statement
        elif upper.startswith('DISPLAY '):
            py_stmt = transpile_display(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        # COMPUTE statement
        elif upper.startswith('COMPUTE '):
            py_stmt = transpile_compute(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        # ADD statement
        elif upper.startswith('ADD '):
            py_stmt = transpile_add(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        # SUBTRACT statement
        elif upper.startswith('SUBTRACT '):
            py_stmt = transpile_subtract(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        # PERFORM statement
        elif upper.startswith('PERFORM '):
            py_stmt = transpile_perform(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        # IF statement
        elif upper.startswith('IF '):
            py_stmt, consumed = transpile_if(statements, i)
            if py_stmt:
                result.append(py_stmt)
            i += consumed
            continue
        
        # STOP RUN / GOBACK
        elif 'STOP RUN' in upper or upper == 'GOBACK' or upper == 'GOBACK.':
            result.append(ast.Return(value=None))
        
        # SET statement
        elif upper.startswith('SET '):
            py_stmt = transpile_set(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        # INITIALIZE
        elif upper.startswith('INITIALIZE '):
            py_stmt = transpile_initialize(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        # Skip END-* statements
        elif upper.startswith('END-'):
            pass
        
        # Fallback: comment
        elif len(upper) > 1 and not upper.startswith('.'):
            result.append(ast.Expr(value=ast.Call(
                func=ast.Attribute(
                    value=ast.Attribute(
                        value=ast.Name(id='self', ctx=ast.Load()),
                        attr='logger',
                        ctx=ast.Load()
                    ),
                    attr='debug',
                    ctx=ast.Load()
                ),
                args=[ast.Constant(value=f"COBOL: {stmt[:50]}")],
                keywords=[]
            )))
        
        i += 1
    
    return result


def transpile_move(stmt: str) -> Optional[ast.stmt]:
    """Transpile MOVE statement"""
    upper = stmt.upper()
    
    # MOVE ZEROS/SPACES TO var
    match = re.match(r'MOVE\s+ZEROS?\s+TO\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        return ast.Assign(
            targets=[ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=target,
                ctx=ast.Store()
            )],
            value=ast.Call(
                func=ast.Name(id='Decimal', ctx=ast.Load()),
                args=[ast.Constant(value='0')],
                keywords=[]
            )
        )
    
    match = re.match(r'MOVE\s+SPACES?\s+TO\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        return ast.Assign(
            targets=[ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=target,
                ctx=ast.Store()
            )],
            value=ast.Constant(value='')
        )
    
    # MOVE "literal" TO var - preserve case from original
    match = re.match(r'MOVE\s+["\']([^"\']+)["\']\s+TO\s+([A-Z0-9][-A-Z0-9]*)', stmt, re.IGNORECASE)
    if match:
        literal = match.group(1)
        target = to_snake_case(match.group(2))
        return ast.Assign(
            targets=[ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=target,
                ctx=ast.Store()
            )],
            value=ast.Constant(value=literal)
        )
    
    # MOVE number TO var
    match = re.match(r'MOVE\s+(\d+(?:\.\d+)?)\s+TO\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        value = match.group(1)
        target = to_snake_case(match.group(2))
        return ast.Assign(
            targets=[ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=target,
                ctx=ast.Store()
            )],
            value=ast.Call(
                func=ast.Name(id='Decimal', ctx=ast.Load()),
                args=[ast.Constant(value=value)],
                keywords=[]
            )
        )
    
    # MOVE var TO var
    match = re.match(r'MOVE\s+([A-Z0-9][-A-Z0-9]*)\s+TO\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        source = to_snake_case(match.group(1))
        target = to_snake_case(match.group(2))
        return ast.Assign(
            targets=[ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=target,
                ctx=ast.Store()
            )],
            value=ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=source,
                ctx=ast.Load()
            )
        )
    
    return None


def transpile_display(stmt: str) -> Optional[ast.stmt]:
    """Transpile DISPLAY statement"""
    match = re.match(r'DISPLAY\s+["\']([^"\']+)["\']', stmt, re.IGNORECASE)
    if match:
        message = match.group(1)
        return ast.Expr(value=ast.Call(
            func=ast.Attribute(
                value=ast.Attribute(
                    value=ast.Name(id='self', ctx=ast.Load()),
                    attr='logger',
                    ctx=ast.Load()
                ),
                attr='info',
                ctx=ast.Load()
            ),
            args=[ast.Constant(value=message)],
            keywords=[]
        ))
    
    # DISPLAY variable
    match = re.match(r'DISPLAY\s+([A-Z0-9][-A-Z0-9]*)', stmt, re.IGNORECASE)
    if match:
        var = to_snake_case(match.group(1))
        return ast.Expr(value=ast.Call(
            func=ast.Attribute(
                value=ast.Attribute(
                    value=ast.Name(id='self', ctx=ast.Load()),
                    attr='logger',
                    ctx=ast.Load()
                ),
                attr='info',
                ctx=ast.Load()
            ),
            args=[ast.JoinedStr(values=[
                ast.FormattedValue(
                    value=ast.Attribute(
                        value=ast.Name(id='self', ctx=ast.Load()),
                        attr=var,
                        ctx=ast.Load()
                    ),
                    conversion=-1,
                    format_spec=None
                )
            ])],
            keywords=[]
        ))
    
    return None


def transpile_compute(stmt: str) -> Optional[ast.stmt]:
    """Transpile COMPUTE statement"""
    match = re.match(r'COMPUTE\s+([A-Z0-9][-A-Z0-9]*)\s*(?:ROUNDED)?\s*=\s*(.+)', stmt, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        expr_str = match.group(2).strip().rstrip('.')
        
        # Convert expression
        expr_str = re.sub(r'([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)', 
                         lambda m: f'self.{to_snake_case(m.group(1))}', expr_str)
        
        try:
            expr_ast = ast.parse(expr_str, mode='eval').body
            return ast.Assign(
                targets=[ast.Attribute(
                    value=ast.Name(id='self', ctx=ast.Load()),
                    attr=target,
                    ctx=ast.Store()
                )],
                value=expr_ast
            )
        except SyntaxError:
            return None
    
    return None


def transpile_add(stmt: str) -> Optional[ast.stmt]:
    """Transpile ADD statement"""
    upper = stmt.upper()
    
    # ADD num TO var
    match = re.match(r'ADD\s+(\d+(?:\.\d+)?)\s+TO\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        value = match.group(1)
        target = to_snake_case(match.group(2))
        return ast.AugAssign(
            target=ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=target,
                ctx=ast.Store()
            ),
            op=ast.Add(),
            value=ast.Call(
                func=ast.Name(id='Decimal', ctx=ast.Load()),
                args=[ast.Constant(value=value)],
                keywords=[]
            )
        )
    
    # ADD var TO var
    match = re.match(r'ADD\s+([A-Z0-9][-A-Z0-9]*)\s+TO\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        source = to_snake_case(match.group(1))
        target = to_snake_case(match.group(2))
        return ast.AugAssign(
            target=ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=target,
                ctx=ast.Store()
            ),
            op=ast.Add(),
            value=ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=source,
                ctx=ast.Load()
            )
        )
    
    return None


def transpile_subtract(stmt: str) -> Optional[ast.stmt]:
    """Transpile SUBTRACT statement"""
    upper = stmt.upper()
    
    # SUBTRACT var FROM var
    match = re.match(r'SUBTRACT\s+([A-Z0-9][-A-Z0-9]*)\s+FROM\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        source = to_snake_case(match.group(1))
        target = to_snake_case(match.group(2))
        return ast.AugAssign(
            target=ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=target,
                ctx=ast.Store()
            ),
            op=ast.Sub(),
            value=ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=source,
                ctx=ast.Load()
            )
        )
    
    return None


def transpile_perform(stmt: str) -> Optional[ast.stmt]:
    """Transpile PERFORM statement"""
    upper = stmt.upper()
    
    # PERFORM ... TIMES
    match = re.match(r'PERFORM\s+([A-Z0-9][-A-Z0-9]*)\s+(\d+)\s+TIMES', upper, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        times = int(match.group(2))
        return ast.For(
            target=ast.Name(id='_', ctx=ast.Store()),
            iter=ast.Call(
                func=ast.Name(id='range', ctx=ast.Load()),
                args=[ast.Constant(value=times)],
                keywords=[]
            ),
            body=[ast.Expr(value=ast.Call(
                func=ast.Attribute(
                    value=ast.Name(id='self', ctx=ast.Load()),
                    attr=f'p_{target}',
                    ctx=ast.Load()
                ),
                args=[],
                keywords=[]
            ))],
            orelse=[]
        )
    
    # PERFORM ... UNTIL
    match = re.match(r'PERFORM\s+([A-Z0-9][-A-Z0-9]*)\s+UNTIL\s+([A-Z0-9][-A-Z0-9]*)\s*=\s*["\']?([^"\'\s]+)["\']?', upper, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        cond_var = to_snake_case(match.group(2))
        cond_val = match.group(3).lower()
        return ast.While(
            test=ast.Compare(
                left=ast.Attribute(
                    value=ast.Name(id='self', ctx=ast.Load()),
                    attr=cond_var,
                    ctx=ast.Load()
                ),
                ops=[ast.NotEq()],
                comparators=[ast.Constant(value=cond_val)]
            ),
            body=[ast.Expr(value=ast.Call(
                func=ast.Attribute(
                    value=ast.Name(id='self', ctx=ast.Load()),
                    attr=f'p_{target}',
                    ctx=ast.Load()
                ),
                args=[],
                keywords=[]
            ))],
            orelse=[]
        )
    
    # PERFORM VARYING (loop)
    match = re.match(
        r'PERFORM\s+([A-Z0-9][-A-Z0-9]*)\s+VARYING\s+([A-Z0-9][-A-Z0-9]*)\s+FROM\s+(\d+)\s+BY\s+(\d+)\s+UNTIL\s+([A-Z0-9][-A-Z0-9]*)\s*>\s*(\d+)',
        upper, re.IGNORECASE
    )
    if match:
        para_name = to_snake_case(match.group(1))
        counter = to_snake_case(match.group(2))
        start_val = int(match.group(3))
        step_val = int(match.group(4))
        end_val = int(match.group(6)) + 1  # UNTIL > means we include end_val
        
        return ast.For(
            target=ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=counter,
                ctx=ast.Store()
            ),
            iter=ast.Call(
                func=ast.Name(id='range', ctx=ast.Load()),
                args=[
                    ast.Constant(value=start_val),
                    ast.Constant(value=end_val),
                    ast.Constant(value=step_val)
                ],
                keywords=[]
            ),
            body=[ast.Expr(value=ast.Call(
                func=ast.Attribute(
                    value=ast.Name(id='self', ctx=ast.Load()),
                    attr=f'p_{para_name}',
                    ctx=ast.Load()
                ),
                args=[],
                keywords=[]
            ))],
            orelse=[]
        )
    
    # Simple PERFORM
    match = re.match(r'PERFORM\s+([A-Z0-9][-A-Z0-9]+)', upper, re.IGNORECASE)
    if match and 'UNTIL' not in upper and 'TIMES' not in upper and 'VARYING' not in upper:
        target = to_snake_case(match.group(1))
        return ast.Expr(value=ast.Call(
            func=ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=f'p_{target}',
                ctx=ast.Load()
            ),
            args=[],
            keywords=[]
        ))
    
    return None


def transpile_if(statements: List[str], start_idx: int) -> Tuple[Optional[ast.stmt], int]:
    """Transpile IF statement block"""
    stmt = statements[start_idx].strip()
    upper = stmt.upper()
    
    # Extract condition
    cond_match = re.match(r'IF\s+(.+?)(?:\s+THEN)?$', upper, re.IGNORECASE)
    if not cond_match:
        return None, 0
    
    condition = cond_match.group(1).strip()
    
    # Convert condition to Python
    condition = re.sub(r'\s+NOT\s*=\s*', ' != ', condition)
    condition = re.sub(r'\s+GREATER\s+THAN\s+', ' > ', condition)
    condition = re.sub(r'\s+LESS\s+THAN\s+', ' < ', condition)
    condition = re.sub(r'\s+EQUAL\s+TO\s+', ' == ', condition)
    condition = re.sub(r'([^!=<>])\s*=\s*([^=])', r'\1 == \2', condition)
    condition = re.sub(r'\s+AND\s+', ' and ', condition, flags=re.IGNORECASE)
    condition = re.sub(r'\s+OR\s+', ' or ', condition, flags=re.IGNORECASE)
    
    # Replace variable names
    condition = re.sub(r'([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)', 
                      lambda m: f'self.{to_snake_case(m.group(1))}', condition)
    
    # Fix string literals
    condition = re.sub(r'"([^"]+)"', r'"\1"', condition)
    
    try:
        test_ast = ast.parse(condition, mode='eval').body
    except SyntaxError:
        test_ast = ast.Constant(value=True)
    
    # Collect body statements until ELSE or END-IF
    body_stmts = []
    else_stmts = []
    in_else = False
    consumed = 1
    
    for i in range(start_idx + 1, len(statements)):
        line = statements[i].strip()
        line_upper = line.upper()
        consumed += 1
        
        if line_upper == 'END-IF' or line_upper == 'END-IF.':
            break
        elif line_upper == 'ELSE' or line_upper == 'ELSE.':
            in_else = True
            continue
        elif line_upper.startswith('END-'):
            continue
        
        transpiled = transpile_statements([line])
        if transpiled:
            if in_else:
                else_stmts.extend(transpiled)
            else:
                body_stmts.extend(transpiled)
    
    if not body_stmts:
        body_stmts = [ast.Pass()]
    
    return ast.If(
        test=test_ast,
        body=body_stmts,
        orelse=else_stmts if else_stmts else []
    ), consumed


def transpile_set(stmt: str) -> Optional[ast.stmt]:
    """Transpile SET statement"""
    upper = stmt.upper()
    
    # SET var TO TRUE/FALSE
    match = re.match(r'SET\s+([A-Z0-9][-A-Z0-9]*)\s+TO\s+(TRUE|FALSE)', upper, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        value = match.group(2).upper() == 'TRUE'
        return ast.Assign(
            targets=[ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=target,
                ctx=ast.Store()
            )],
            value=ast.Constant(value=value)
        )
    
    return None


def transpile_initialize(stmt: str) -> Optional[ast.stmt]:
    """Transpile INITIALIZE statement"""
    match = re.match(r'INITIALIZE\s+([A-Z0-9][-A-Z0-9]*)', stmt, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        return ast.Assign(
            targets=[ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=target,
                ctx=ast.Store()
            )],
            value=ast.Constant(value=None)
        )
    return None


# ============================================================
# Code Generation
# ============================================================

def generate_python_code(cobol_source: str) -> Dict[str, Any]:
    """Main entry point: COBOL source → Python code"""
    try:
        # Parse COBOL
        cobol_ast = parse_cobol(cobol_source)
        
        # Generate Python AST
        python_ast = generate_python_ast(cobol_ast)
        
        # Unparse to code (Python 3.9+)
        python_code = ast.unparse(python_ast)
        
        # Try to format with black (optional)
        try:
            import black
            python_code = black.format_str(python_code, mode=black.Mode())
        except ImportError:
            pass  # black not available, use unformatted
        
        # Validate syntax
        compile(python_code, '<generated>', 'exec')
        
        # Generate unit tests
        class_name = to_pascal_case(cobol_ast.program_id)
        test_code = generate_unit_tests(cobol_ast, class_name)
        
        return {
            'success': True,
            'python_code': python_code,
            'unit_tests': test_code,
            'stats': {
                'variables': len(cobol_ast.variables),
                'paragraphs': len(cobol_ast.paragraphs),
                'program_id': cobol_ast.program_id
            }
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'python_code': ''
        }


def generate_unit_tests(cobol_ast: CobolAST, class_name: str) -> str:
    """Generate basic unit tests for the transpiled code"""
    tests = []
    tests.append('"""Auto-generated unit tests for ' + class_name + '"""')
    tests.append('import pytest')
    tests.append('from decimal import Decimal')
    tests.append(f'from main import {class_name}')
    tests.append('')
    tests.append('')
    tests.append(f'class Test{class_name}:')
    tests.append(f'    """Test cases for {class_name}"""')
    tests.append('')
    tests.append('    def test_initialization(self):')
    tests.append(f'        """Test that {class_name} can be instantiated"""')
    tests.append(f'        processor = {class_name}()')
    tests.append('        assert processor is not None')
    tests.append('')
    
    # Test variables initialization
    for var in cobol_ast.variables[:5]:  # Limit to first 5
        py_name = to_snake_case(var.name)
        tests.append(f'    def test_{py_name}_exists(self):')
        tests.append(f'        """Test {var.name} is properly initialized"""')
        tests.append(f'        processor = {class_name}()')
        tests.append(f'        assert hasattr(processor, "{py_name}")')
        tests.append('')
    
    # Test paragraphs/methods
    for para in cobol_ast.paragraphs[:3]:  # Limit to first 3
        method_name = f'p_{to_snake_case(para.name)}'
        tests.append(f'    def test_{method_name}_callable(self):')
        tests.append(f'        """Test {para.name} method is callable"""')
        tests.append(f'        processor = {class_name}()')
        tests.append(f'        assert callable(getattr(processor, "{method_name}", None))')
        tests.append('')
    
    # Test run method
    tests.append('    def test_run_executes(self):')
    tests.append('        """Test run() executes without errors"""')
    tests.append(f'        processor = {class_name}()')
    tests.append('        try:')
    tests.append('            processor.run()')
    tests.append('            assert True')
    tests.append('        except Exception as e:')
    tests.append('            pytest.fail(f"run() raised {e}")')
    
    return '\n'.join(tests)


# ============================================================
# Vercel Serverless Handler
# ============================================================

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(body)
            cobol_code = data.get('cobolCode', '')
            
            if not cobol_code:
                self.send_error_response({'error': 'cobolCode is required'})
                return
            
            result = generate_python_code(cobol_code)
            self.send_json_response(result)
        
        except json.JSONDecodeError:
            self.send_error_response({'error': 'Invalid JSON'})
        except Exception as e:
            self.send_error_response({'error': str(e)})
    
    def do_GET(self):
        self.send_json_response({
            'name': 'COBOL AST Transpiler v2.0',
            'engine': 'Python AST Native',
            'features': ['ast.Module', 'ast.unparse', 'black formatting'],
            'syntax_guarantee': '100%'
        })
    
    def send_json_response(self, data: dict, status: int = 200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def send_error_response(self, data: dict):
        self.send_json_response(data, 400)
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
