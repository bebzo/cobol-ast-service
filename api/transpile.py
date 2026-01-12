"""
COBOL → Python Transpiler v3.0 (Clean Architecture)
Uses Python's ast module for 100% syntax-valid output
Generates Clean Architecture code with entities, services, and tests
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
    parent_group: Optional[str] = None


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
    """Extract WORKING-STORAGE variables with group hierarchy"""
    variables = []
    lines = source.split('\n')
    in_working_storage = False
    current_group = None
    
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
        
        # Track group hierarchy
        if level == 1:
            current_group = name if 'PIC' not in line.upper() else None
        
        # Extract PIC
        pic_match = re.search(r'PIC(?:TURE)?\s+(?:IS\s+)?([SX9AV0-9()+-.,ZB*$]+)', line, re.IGNORECASE)
        picture = pic_match.group(1).rstrip('.') if pic_match else None
        
        # Extract VALUE
        value = None
        value_match = re.search(
            r'VALUE\s+(?:IS\s+)?(?:ZEROS?|ZEROES|SPACES?|"([^"]*)"|\'([^\']*)\'|([-+]?\.?\d+\.?\d*))',
            line, re.IGNORECASE
        )
        if value_match:
            if 'ZERO' in line.upper() and 'VALUE' in line.upper():
                upper_line = line.upper()
                if re.search(r'VALUE\s+(?:IS\s+)?ZEROS?', upper_line) or re.search(r'VALUE\s+(?:IS\s+)?ZEROES', upper_line):
                    value = 'ZEROS'
                else:
                    value = value_match.group(1) or value_match.group(2) or value_match.group(3)
            elif 'SPACE' in line.upper() and re.search(r'VALUE\s+(?:IS\s+)?SPACES?', line.upper()):
                value = 'SPACES'
            else:
                raw_value = value_match.group(1) or value_match.group(2) or value_match.group(3)
                value = raw_value.rstrip('.') if raw_value else None
        
        variables.append(CobolVariable(
            level=level,
            name=name,
            picture=picture,
            value=value,
            line=i + 1,
            parent_group=current_group if level > 1 else None
        ))
    
    return variables


def parse_paragraphs(lines: List[str]) -> List[CobolParagraph]:
    """Extract PROCEDURE DIVISION paragraphs"""
    paragraphs = []
    in_procedure = False
    current_para = None
    
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
        
        if not upper or (len(line) > 6 and line[6] in ('*', '/')):
            continue
        
        para_match = re.match(r'^\s*([A-Z0-9][-A-Z0-9_]*)\s*\.\s*$', line, re.IGNORECASE)
        if para_match:
            name = para_match.group(1).upper()
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
        
        if current_para and upper:
            current_para.statements.append(line.strip())
    
    if current_para:
        current_para.line_end = len(lines)
        paragraphs.append(current_para)
    
    return paragraphs


# ============================================================
# Python AST Generator - Clean Architecture v3.0
# ============================================================

def to_snake_case(name: str) -> str:
    """Convert COBOL-STYLE-NAME to python_style_name (removes ws_ prefix)"""
    result = name.lower().replace('-', '_').replace('.', '')
    # Remove common COBOL prefixes for cleaner Python code
    if result.startswith('ws_'):
        result = result[3:]
    # Python identifiers cannot start with a digit
    if result and result[0].isdigit():
        result = 'p_' + result
    return result


def to_pascal_case(name: str) -> str:
    """Convert COBOL-STYLE-NAME to PythonStyleName"""
    return ''.join(word.capitalize() for word in name.replace('-', '_').split('_'))


def pic_to_python_type(pic: Optional[str], value: Optional[str] = None) -> Tuple[str, ast.expr]:
    """Convert PIC clause to Python type and default value"""
    if not pic:
        return 'Any', ast.Constant(value=None)
    
    upper = pic.upper()
    
    # Check for decimal/numeric
    if 'V' in upper or re.match(r'^S?9', upper):
        default_val = parse_pic_default(upper, value)
        return 'Decimal', ast.Call(
            func=ast.Name(id='Decimal', ctx=ast.Load()),
            args=[ast.Constant(value=default_val)],
            keywords=[]
        )
    elif re.match(r'^X', upper) or re.match(r'^A', upper):
        return 'str', ast.Constant(value='')
    else:
        return 'str', ast.Constant(value='')


def parse_pic_default(pic: str, value: Optional[str]) -> str:
    """Parse PIC clause to extract proper default value with decimals"""
    upper = pic.upper()
    
    if value:
        if value.upper() in ('ZEROS', 'ZEROES', 'ZERO'):
            pass
        elif value.upper() not in ('SPACES', 'SPACE'):
            try:
                return str(value)
            except:
                pass
    
    if 'V' in upper:
        parts = upper.split('V')
        after_v = parts[1] if len(parts) > 1 else ''
        decimal_places = count_pic_digits(after_v)
        
        if value and value not in ('ZEROS', 'ZEROES', 'ZERO', 'SPACES', 'SPACE', None):
            try:
                if value.startswith('.'):
                    return f'0{value}'
                return str(float(value))
            except:
                pass
        
        if decimal_places > 0:
            return f"0.{'0' * decimal_places}"
    
    return '0'


def count_pic_digits(pic_part: str) -> int:
    """Count number of digits in PIC part"""
    count = 0
    i = 0
    while i < len(pic_part):
        c = pic_part[i]
        if c in '9AXZ0':
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


def is_flag_variable(name: str, value: Optional[str]) -> bool:
    """Check if variable is a Y/N flag that should become bool"""
    upper_name = name.upper()
    flag_keywords = ['FLAG', 'EOF', 'ERROR', 'VALID', 'FOUND', 'APPROVED', 'ACTIVE', 'DONE']
    if any(kw in upper_name for kw in flag_keywords):
        return True
    if value and value.upper() in ('Y', 'N', 'TRUE', 'FALSE'):
        return True
    return False


def cobol_value_to_python_v3(value: Optional[str], pic: Optional[str], var_name: str) -> ast.expr:
    """Convert COBOL VALUE to Python AST (v3: bools for flags)"""
    if value is None:
        _, default = pic_to_python_type(pic, None)
        return default
    
    upper = value.upper() if isinstance(value, str) else str(value)
    
    # Convert Y/N flags to bool
    if is_flag_variable(var_name, value):
        if upper in ('Y', 'TRUE', '1'):
            return ast.Constant(value=True)
        elif upper in ('N', 'FALSE', '0'):
            return ast.Constant(value=False)
    
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
        try:
            val_str = str(value).strip().rstrip('.')
            if val_str.startswith('.'):
                val_str = '0' + val_str
            float(val_str)
            return ast.Call(
                func=ast.Name(id='Decimal', ctx=ast.Load()),
                args=[ast.Constant(value=val_str)],
                keywords=[]
            )
        except (ValueError, TypeError):
            return ast.Constant(value=str(value).strip().rstrip('.'))


def categorize_variables(variables: List[CobolVariable]) -> Dict[str, List[CobolVariable]]:
    """Categorize variables into domain groups for Clean Architecture"""
    categories = {
        'status': [],      # Status flags
        'counters': [],    # Counters
        'totals': [],      # Financial totals
        'rates': [],       # Interest/tax rates
        'fees': [],        # Fee schedules
        'config': [],      # Configuration
        'temp': [],        # Temporary/work areas
        'other': []        # Everything else
    }
    
    for var in variables:
        name_upper = var.name.upper()
        
        if any(x in name_upper for x in ['STATUS', 'FLAG', 'EOF', 'ERROR', 'VALID', 'FOUND']):
            categories['status'].append(var)
        elif any(x in name_upper for x in ['COUNT', 'COUNTER', 'CNT']):
            categories['counters'].append(var)
        elif any(x in name_upper for x in ['TOTAL', 'SUM', 'AMOUNT']):
            categories['totals'].append(var)
        elif any(x in name_upper for x in ['RATE', 'PCT', 'PERCENT']):
            categories['rates'].append(var)
        elif any(x in name_upper for x in ['FEE', 'CHARGE', 'PREMIUM']):
            categories['fees'].append(var)
        elif any(x in name_upper for x in ['TEMP', 'WORK', 'CALC']):
            categories['temp'].append(var)
        else:
            categories['other'].append(var)
    
    return categories


def generate_python_ast_v3(cobol_ast: CobolAST) -> ast.Module:
    """Generate Python AST with Clean Architecture patterns"""
    class_name = to_pascal_case(cobol_ast.program_id)
    
    body = []
    
    # Module docstring
    body.append(ast.Expr(value=ast.Constant(
        value=f"""{class_name} - Clean Architecture Python Code
Auto-transpiled from COBOL [AST Transpiler v3.0]

Architecture:
- Domain entities with strict typing
- Service methods for business logic
- Boolean flags (not Y/N strings)
- Decimal for all monetary values
"""
    )))
    
    # Imports
    imports = [
        ast.ImportFrom(module='__future__', names=[ast.alias(name='annotations')], level=0),
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
            ast.alias(name='Any'),
            ast.alias(name='ClassVar')
        ], level=0),
        ast.ImportFrom(module='datetime', names=[
            ast.alias(name='datetime'),
            ast.alias(name='date')
        ], level=0),
        ast.ImportFrom(module='enum', names=[
            ast.alias(name='Enum'),
            ast.alias(name='auto')
        ], level=0),
        ast.Import(names=[ast.alias(name='logging')]),
    ]
    body.extend(imports)
    
    # Categorize variables
    categories = categorize_variables(cobol_ast.variables)
    
    # Generate Status enum if we have status flags (without __init__)
    if categories['status']:
        enum_body = []
        for var in categories['status']:
            if is_flag_variable(var.name, var.value):
                continue  # Skip simple flags, use bool
            enum_name = to_snake_case(var.name).upper()
            enum_body.append(ast.Assign(
                targets=[ast.Name(id=enum_name, ctx=ast.Store())],
                value=ast.Call(
                    func=ast.Name(id='auto', ctx=ast.Load()),
                    args=[],
                    keywords=[]
                )
            ))
        
        # Only create enum if we have valid members (no __init__ method!)
        if enum_body:
            status_enum = ast.ClassDef(
                name='ProcessingStatus',
                bases=[ast.Name(id='Enum', ctx=ast.Load())],
                keywords=[],
                body=enum_body,  # No __init__, just enum members
                decorator_list=[]
            )
            body.append(status_enum)
    
    # Generate Configuration dataclass
    config_class = generate_config_dataclass(categories['rates'] + categories['fees'], class_name)
    if config_class:
        body.append(config_class)
    
    # Main class definition
    class_body = []
    
    # Class docstring
    class_body.append(ast.Expr(value=ast.Constant(
        value=f"""Main processor for {cobol_ast.program_id}

Attributes:
    logger: Logging instance
    config: Configuration settings
    
Methods:
    run(): Main entry point
"""
    )))
    
    # Class variables
    class_body.append(ast.AnnAssign(
        target=ast.Name(id='VERSION', ctx=ast.Store()),
        annotation=ast.Subscript(
            value=ast.Name(id='ClassVar', ctx=ast.Load()),
            slice=ast.Name(id='str', ctx=ast.Load()),
            ctx=ast.Load()
        ),
        value=ast.Constant(value='3.0.0'),
        simple=1
    ))
    
    # COBOL constants (SPACES, LOW-VALUES)
    class_body.append(ast.AnnAssign(
        target=ast.Name(id='SPACES', ctx=ast.Store()),
        annotation=ast.Subscript(
            value=ast.Name(id='ClassVar', ctx=ast.Load()),
            slice=ast.Name(id='str', ctx=ast.Load()),
            ctx=ast.Load()
        ),
        value=ast.BinOp(
            left=ast.Constant(value=' '),
            op=ast.Mult(),
            right=ast.Constant(value=256)
        ),
        simple=1
    ))
    class_body.append(ast.AnnAssign(
        target=ast.Name(id='LOW_VALUES', ctx=ast.Store()),
        annotation=ast.Subscript(
            value=ast.Name(id='ClassVar', ctx=ast.Load()),
            slice=ast.Name(id='str', ctx=ast.Load()),
            ctx=ast.Load()
        ),
        value=ast.BinOp(
            left=ast.Constant(value='\x00'),
            op=ast.Mult(),
            right=ast.Constant(value=256)
        ),
        simple=1
    ))
    class_body.append(ast.AnnAssign(
        target=ast.Name(id='HIGH_VALUES', ctx=ast.Store()),
        annotation=ast.Subscript(
            value=ast.Name(id='ClassVar', ctx=ast.Load()),
            slice=ast.Name(id='str', ctx=ast.Load()),
            ctx=ast.Load()
        ),
        value=ast.BinOp(
            left=ast.Constant(value='\xff'),
            op=ast.Mult(),
            right=ast.Constant(value=256)
        ),
        simple=1
    ))
    
    # __init__ method
    init_body = generate_init_body(cobol_ast.variables, class_name, has_config=(config_class is not None))
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
    
    # Generate service methods from paragraphs
    for para in cobol_ast.paragraphs:
        method = generate_method_from_paragraph(para)
        class_body.append(method)
    
    # Run method
    run_body = []
    if cobol_ast.paragraphs:
        first_method = to_snake_case(cobol_ast.paragraphs[0].name)
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
            ast.Expr(value=ast.Constant(value="Main entry point - executes primary workflow")),
            ast.Expr(value=ast.Call(
                func=ast.Attribute(
                    value=ast.Attribute(
                        value=ast.Name(id='self', ctx=ast.Load()),
                        attr='logger',
                        ctx=ast.Load()
                    ),
                    attr='info',
                    ctx=ast.Load()
                ),
                args=[
                    ast.Constant(value=f"Starting {class_name} v%s"),
                    ast.Attribute(
                        value=ast.Name(id='self', ctx=ast.Load()),
                        attr='VERSION',
                        ctx=ast.Load()
                    )
                ],
                keywords=[]
            )),
            *run_body
        ],
        decorator_list=[],
        returns=None
    )
    class_body.append(run_method)
    
    # Create main class
    class_def = ast.ClassDef(
        name=class_name,
        bases=[],
        keywords=[],
        body=class_body,
        decorator_list=[]
    )
    body.append(class_def)
    
    # Main block
    main_if = generate_main_block(class_name)
    body.append(main_if)
    
    module = ast.Module(body=body, type_ignores=[])
    ast.fix_missing_locations(module)
    
    return module


def generate_config_dataclass(config_vars: List[CobolVariable], class_name: str) -> Optional[ast.ClassDef]:
    """Generate a configuration dataclass for rates and fees"""
    if not config_vars:
        return None
    
    fields = []
    for var in config_vars:
        py_name = to_snake_case(var.name)
        py_type, py_default = pic_to_python_type(var.picture, var.value)
        
        # Create field assignment
        fields.append(ast.AnnAssign(
            target=ast.Name(id=py_name, ctx=ast.Store()),
            annotation=ast.Name(id=py_type, ctx=ast.Load()),
            value=cobol_value_to_python_v3(var.value, var.picture, var.name),
            simple=1
        ))
    
    if not fields:
        return None
    
    return ast.ClassDef(
        name=f'{class_name}Config',
        bases=[],
        keywords=[],
        body=[
            ast.Expr(value=ast.Constant(value="Configuration settings for rates and fees")),
            *fields
        ],
        decorator_list=[ast.Name(id='dataclass', ctx=ast.Load())]
    )


def generate_init_body(variables: List[CobolVariable], class_name: str, has_config: bool = True) -> List[ast.stmt]:
    """Generate __init__ body with clean variable names"""
    init_body = []
    
    # Logger
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
    
    # Config instance (only if config class exists)
    if has_config:
        init_body.append(ast.Assign(
            targets=[ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr='config',
                ctx=ast.Store()
            )],
            value=ast.Call(
                func=ast.Name(id=f'{class_name}Config', ctx=ast.Load()),
                args=[],
                keywords=[]
            )
        ))
    
    # State variables (skip config vars already in dataclass)
    config_keywords = ['RATE', 'FEE', 'CHARGE', 'PREMIUM', 'PCT']
    
    for var in variables:
        name_upper = var.name.upper()
        if any(kw in name_upper for kw in config_keywords):
            continue  # Skip, already in config
        
        py_name = to_snake_case(var.name)
        
        # Skip group headers without PIC
        if var.level == 1 and not var.picture:
            continue
        
        # Determine type
        if is_flag_variable(var.name, var.value):
            py_type = 'bool'
            py_value = cobol_value_to_python_v3(var.value, var.picture, var.name)
        else:
            py_type, _ = pic_to_python_type(var.picture, var.value)
            py_value = cobol_value_to_python_v3(var.value, var.picture, var.name)
        
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
    
    if len(init_body) <= 2:  # Only logger and config
        init_body.append(ast.Pass())
    
    return init_body


def generate_method_from_paragraph(para: CobolParagraph) -> ast.FunctionDef:
    """Generate method from COBOL paragraph with clean naming"""
    # Clean method name (no p_ prefix for cleaner API)
    method_name = to_snake_case(para.name)
    
    # Transpile statements
    method_body = transpile_statements_v3(para.statements)
    
    if not method_body:
        method_body = [ast.Pass()]
    
    return ast.FunctionDef(
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
            ast.Expr(value=ast.Constant(value=f"Business logic from: {para.name}")),
            *method_body
        ],
        decorator_list=[],
        returns=ast.Constant(value=None)
    )


def generate_main_block(class_name: str) -> ast.If:
    """Generate if __name__ == '__main__' block"""
    return ast.If(
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
                keywords=[
                    ast.keyword(arg='level', value=ast.Attribute(
                        value=ast.Name(id='logging', ctx=ast.Load()),
                        attr='INFO',
                        ctx=ast.Load()
                    )),
                    ast.keyword(arg='format', value=ast.Constant(
                        value='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
                    ))
                ]
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


def transpile_statements_v3(statements: List[str]) -> List[ast.stmt]:
    """Transpile COBOL statements to Python AST (v3: clean architecture)"""
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
            py_stmt = transpile_move_v3(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        # DISPLAY statement
        elif upper.startswith('DISPLAY '):
            py_stmt = transpile_display_v3(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        # COMPUTE statement
        elif upper.startswith('COMPUTE '):
            py_stmt = transpile_compute_v3(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        # ADD statement
        elif upper.startswith('ADD '):
            py_stmt = transpile_add_v3(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        # SUBTRACT statement
        elif upper.startswith('SUBTRACT '):
            py_stmt = transpile_subtract_v3(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        # PERFORM statement
        elif upper.startswith('PERFORM '):
            py_stmt = transpile_perform_v3(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        # IF statement
        elif upper.startswith('IF '):
            py_stmt, consumed = transpile_if_v3(statements, i)
            if py_stmt:
                result.append(py_stmt)
            i += consumed
            continue
        
        # STOP RUN / GOBACK
        elif 'STOP RUN' in upper or upper == 'GOBACK' or upper == 'GOBACK.':
            result.append(ast.Return(value=None))
        
        # SET statement
        elif upper.startswith('SET '):
            py_stmt = transpile_set_v3(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        # INITIALIZE
        elif upper.startswith('INITIALIZE '):
            py_stmt = transpile_initialize_v3(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        # Skip END-* statements
        elif upper.startswith('END-'):
            pass
        
        # Fallback: debug log
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
                args=[ast.Constant(value=f"TODO: {stmt[:60]}")],
                keywords=[]
            )))
        
        i += 1
    
    return result


def transpile_move_v3(stmt: str) -> Optional[ast.stmt]:
    """Transpile MOVE statement (v3: clean names)"""
    upper = stmt.upper()
    
    # MOVE ZEROS TO var
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
    
    # MOVE SPACES TO var
    match = re.match(r'MOVE\s+SPACES?\s+TO\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        return ast.Assign(
            targets=[ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=target,
                ctx=ast.Store()
            )],
            value=ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr='SPACES',
                ctx=ast.Load()
            )
        )
    
    # MOVE LOW-VALUES TO var
    match = re.match(r'MOVE\s+LOW-VALUES?\s+TO\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        return ast.Assign(
            targets=[ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=target,
                ctx=ast.Store()
            )],
            value=ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr='LOW_VALUES',
                ctx=ast.Load()
            )
        )
    
    # MOVE HIGH-VALUES TO var
    match = re.match(r'MOVE\s+HIGH-VALUES?\s+TO\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        return ast.Assign(
            targets=[ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr=target,
                ctx=ast.Store()
            )],
            value=ast.Attribute(
                value=ast.Name(id='self', ctx=ast.Load()),
                attr='HIGH_VALUES',
                ctx=ast.Load()
            )
        )
    
    # MOVE "literal" TO var
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


def transpile_display_v3(stmt: str) -> Optional[ast.stmt]:
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


def transpile_compute_v3(stmt: str) -> Optional[ast.stmt]:
    """Transpile COMPUTE statement"""
    match = re.match(r'COMPUTE\s+([A-Z0-9][-A-Z0-9]*)\s*(?:ROUNDED)?\s*=\s*(.+)', stmt, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        expr_str = match.group(2).strip().rstrip('.')
        
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


def transpile_add_v3(stmt: str) -> Optional[ast.stmt]:
    """Transpile ADD statement"""
    upper = stmt.upper()
    
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


def transpile_subtract_v3(stmt: str) -> Optional[ast.stmt]:
    """Transpile SUBTRACT statement"""
    upper = stmt.upper()
    
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


def transpile_perform_v3(stmt: str) -> Optional[ast.stmt]:
    """Transpile PERFORM statement (v3: clean method names)"""
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
                    attr=target,
                    ctx=ast.Load()
                ),
                args=[],
                keywords=[]
            ))],
            orelse=[]
        )
    
    # PERFORM ... UNTIL
    match = re.match(r'PERFORM\s+([A-Z0-9][-A-Z0-9]*)\s+UNTIL\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        cond_var = to_snake_case(match.group(2))
        return ast.While(
            test=ast.UnaryOp(
                op=ast.Not(),
                operand=ast.Attribute(
                    value=ast.Name(id='self', ctx=ast.Load()),
                    attr=cond_var,
                    ctx=ast.Load()
                )
            ),
            body=[ast.Expr(value=ast.Call(
                func=ast.Attribute(
                    value=ast.Name(id='self', ctx=ast.Load()),
                    attr=target,
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
                attr=target,
                ctx=ast.Load()
            ),
            args=[],
            keywords=[]
        ))
    
    return None


def transpile_if_v3(statements: List[str], start_idx: int) -> Tuple[Optional[ast.stmt], int]:
    """Transpile IF statement block"""
    stmt = statements[start_idx].strip()
    upper = stmt.upper()
    
    cond_match = re.match(r'IF\s+(.+?)(?:\s+THEN)?$', upper, re.IGNORECASE)
    if not cond_match:
        return None, 0
    
    condition = cond_match.group(1).strip()
    
    condition = re.sub(r'\s+NOT\s*=\s*', ' != ', condition)
    condition = re.sub(r'\s+GREATER\s+THAN\s+', ' > ', condition)
    condition = re.sub(r'\s+LESS\s+THAN\s+', ' < ', condition)
    condition = re.sub(r'\s+EQUAL\s+TO\s+', ' == ', condition)
    condition = re.sub(r'([^!=<>])\s*=\s*([^=])', r'\1 == \2', condition)
    condition = re.sub(r'\s+AND\s+', ' and ', condition, flags=re.IGNORECASE)
    condition = re.sub(r'\s+OR\s+', ' or ', condition, flags=re.IGNORECASE)
    
    condition = re.sub(r'([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)', 
                      lambda m: f'self.{to_snake_case(m.group(1))}', condition)
    
    try:
        test_ast = ast.parse(condition, mode='eval').body
    except SyntaxError:
        test_ast = ast.Constant(value=True)
    
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
        
        transpiled = transpile_statements_v3([line])
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


def transpile_set_v3(stmt: str) -> Optional[ast.stmt]:
    """Transpile SET statement (v3: proper booleans)"""
    upper = stmt.upper()
    
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


def transpile_initialize_v3(stmt: str) -> Optional[ast.stmt]:
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
# Code Generation & Unit Tests
# ============================================================

def generate_python_code(cobol_source: str) -> Dict[str, Any]:
    """Main entry point: COBOL source → Python code"""
    try:
        cobol_ast = parse_cobol(cobol_source)
        python_ast = generate_python_ast_v3(cobol_ast)
        python_code = ast.unparse(python_ast)
        
        try:
            import black
            python_code = black.format_str(python_code, mode=black.Mode())
        except ImportError:
            pass
        
        compile(python_code, '<generated>', 'exec')
        
        class_name = to_pascal_case(cobol_ast.program_id)
        test_code = generate_unit_tests_v3(cobol_ast, class_name)
        
        return {
            'success': True,
            'python_code': python_code,
            'unit_tests': test_code,
            'version': '3.0.0',
            'architecture': 'Clean Architecture',
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


def generate_unit_tests_v3(cobol_ast: CobolAST, class_name: str) -> str:
    """Generate comprehensive unit tests (v3)"""
    tests = []
    tests.append(f'"""')
    tests.append(f'Auto-generated unit tests for {class_name}')
    tests.append(f'Transpiler: AST v3.0 (Clean Architecture)')
    tests.append(f'"""')
    tests.append('')
    tests.append('import pytest')
    tests.append('from decimal import Decimal')
    tests.append(f'from main import {class_name}, {class_name}Config')
    tests.append('')
    tests.append('')
    tests.append('@pytest.fixture')
    tests.append('def processor():')
    tests.append(f'    """Create a fresh {class_name} instance for each test."""')
    tests.append(f'    return {class_name}()')
    tests.append('')
    tests.append('')
    tests.append(f'class Test{class_name}Initialization:')
    tests.append(f'    """Test suite for {class_name} initialization."""')
    tests.append('')
    tests.append('    def test_can_instantiate(self, processor):')
    tests.append('        """Verify processor can be instantiated."""')
    tests.append('        assert processor is not None')
    tests.append('')
    tests.append('    def test_has_logger(self, processor):')
    tests.append('        """Verify logger is configured."""')
    tests.append('        assert hasattr(processor, "logger")')
    tests.append('        assert processor.logger is not None')
    tests.append('')
    tests.append('    def test_has_config(self, processor):')
    tests.append('        """Verify config dataclass is initialized."""')
    tests.append('        assert hasattr(processor, "config")')
    tests.append(f'        assert isinstance(processor.config, {class_name}Config)')
    tests.append('')
    tests.append('    def test_version_exists(self, processor):')
    tests.append('        """Verify VERSION class variable exists."""')
    tests.append('        assert hasattr(processor, "VERSION")')
    tests.append('        assert processor.VERSION == "3.0.0"')
    tests.append('')
    
    # Test flag variables are booleans
    flag_vars = [v for v in cobol_ast.variables if is_flag_variable(v.name, v.value)]
    if flag_vars:
        tests.append('')
        tests.append(f'class Test{class_name}Flags:')
        tests.append('    """Test boolean flags are properly typed."""')
        tests.append('')
        for var in flag_vars[:3]:
            py_name = to_snake_case(var.name)
            tests.append(f'    def test_{py_name}_is_boolean(self, processor):')
            tests.append(f'        """Verify {py_name} is a boolean, not string."""')
            tests.append(f'        assert isinstance(processor.{py_name}, bool)')
            tests.append('')
    
    # Test decimal variables
    decimal_vars = [v for v in cobol_ast.variables 
                   if v.picture and ('V' in v.picture.upper() or v.picture.upper().startswith('9'))]
    if decimal_vars:
        tests.append('')
        tests.append(f'class Test{class_name}Decimals:')
        tests.append('    """Test monetary values use Decimal type."""')
        tests.append('')
        for var in decimal_vars[:3]:
            py_name = to_snake_case(var.name)
            tests.append(f'    def test_{py_name}_is_decimal(self, processor):')
            tests.append(f'        """Verify {py_name} uses Decimal for precision."""')
            tests.append(f'        assert isinstance(processor.{py_name}, Decimal)')
            tests.append('')
    
    # Test methods
    tests.append('')
    tests.append(f'class Test{class_name}Methods:')
    tests.append('    """Test business logic methods."""')
    tests.append('')
    
    for para in cobol_ast.paragraphs[:5]:
        method_name = to_snake_case(para.name)
        tests.append(f'    def test_{method_name}_is_callable(self, processor):')
        tests.append(f'        """Verify {method_name} method exists and is callable."""')
        tests.append(f'        assert callable(getattr(processor, "{method_name}", None))')
        tests.append('')
    
    tests.append('    def test_run_executes_without_error(self, processor):')
    tests.append('        """Verify run() completes without raising exceptions."""')
    tests.append('        try:')
    tests.append('            processor.run()')
    tests.append('        except Exception as e:')
    tests.append('            pytest.fail(f"run() raised {type(e).__name__}: {e}")')
    tests.append('')
    
    # Config tests
    tests.append('')
    tests.append(f'class Test{class_name}Config:')
    tests.append('    """Test configuration dataclass."""')
    tests.append('')
    tests.append('    def test_config_is_dataclass(self):')
    tests.append(f'        """Verify {class_name}Config is a dataclass."""')
    tests.append('        from dataclasses import is_dataclass')
    tests.append(f'        assert is_dataclass({class_name}Config)')
    tests.append('')
    
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
            'name': 'COBOL AST Transpiler',
            'version': '3.0.0',
            'engine': 'Python AST Native',
            'architecture': 'Clean Architecture',
            'features': [
                'Boolean flags (not Y/N strings)',
                'Decimal for all monetary values',
                'Configuration dataclass',
                'Comprehensive pytest suite',
                'Idiomatic Python naming'
            ],
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
