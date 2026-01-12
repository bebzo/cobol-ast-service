"""
COBOL → Python Transpiler v4.4 (Clean Architecture + Enterprise Patterns)
Uses Python's ast module for 100% syntax-valid output

Improvements in v4.4:
- FileManager class with context managers for safe file I/O
- Comprehensive Enums (StatusCode, AccountType, TransactionType, etc.)
- Dataclasses for COBOL records (CustomerRecord, AccountRecord, etc.)
- Proper @property decorators for 88-level conditions
- Strategy pattern for interest/fee calculations
"""

import ast
import re
import json
from http.server import BaseHTTPRequestHandler
from typing import Any, Dict, List, Optional, Tuple, Set
from dataclasses import dataclass, field
from decimal import Decimal


# ============================================================
# COBOL Parser - Enhanced with 88-level conditions
# ============================================================

@dataclass
class Cobol88Condition:
    """COBOL 88-level condition (boolean flag)"""
    name: str
    parent_var: str
    values: List[str]  # VALUES that make this condition TRUE
    line: int = 0


@dataclass
class CobolVariable:
    level: int
    name: str
    picture: Optional[str] = None
    value: Optional[str] = None
    usage: Optional[str] = None
    line: int = 0
    parent_group: Optional[str] = None
    conditions_88: List[Cobol88Condition] = field(default_factory=list)


@dataclass
class CobolFileDescriptor:
    """FD - File Descriptor from FILE SECTION"""
    name: str
    record_name: str
    organization: str = 'SEQUENTIAL'
    access_mode: str = 'SEQUENTIAL'
    status_var: Optional[str] = None


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
    conditions_88: List[Cobol88Condition] = field(default_factory=list)
    file_descriptors: List[CobolFileDescriptor] = field(default_factory=list)
    record_groups: Dict[str, List[CobolVariable]] = field(default_factory=dict)


def parse_cobol(source: str) -> CobolAST:
    """Parse COBOL source into structured AST with enhanced features"""
    lines = source.split('\n')
    
    # Extract program ID
    program_match = re.search(r'PROGRAM-ID\.\s+(\S+)', source, re.IGNORECASE)
    program_id = program_match.group(1).replace('.', '') if program_match else 'UNKNOWN'
    
    # Parse variables with 88-level conditions
    variables, conditions_88 = parse_variables_with_88(source)
    
    # Parse file descriptors
    file_descriptors = parse_file_descriptors(source)
    
    # Parse paragraphs
    paragraphs = parse_paragraphs(lines)
    
    # Group variables into records
    record_groups = group_into_records(variables)
    
    return CobolAST(
        program_id=program_id,
        variables=variables,
        paragraphs=paragraphs,
        conditions_88=conditions_88,
        file_descriptors=file_descriptors,
        record_groups=record_groups
    )


def parse_variables_with_88(source: str) -> Tuple[List[CobolVariable], List[Cobol88Condition]]:
    """Extract WORKING-STORAGE variables including 88-level conditions"""
    variables = []
    conditions_88 = []
    lines = source.split('\n')
    in_working_storage = False
    current_group = None
    last_variable = None
    
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
        
        # Handle 88-level conditions (boolean values)
        if level == 88 and last_variable:
            # Extract VALUE(S) for 88-level
            value_match = re.search(
                r'VALUE(?:S)?\s+(?:IS\s+|ARE\s+)?(?:"([^"]*)"|\'([^\']*)\'|([A-Z0-9][-A-Z0-9]*)|(\d+))',
                line, re.IGNORECASE
            )
            if value_match:
                value = value_match.group(1) or value_match.group(2) or value_match.group(3) or value_match.group(4)
                condition = Cobol88Condition(
                    name=name,
                    parent_var=last_variable.name,
                    values=[value] if value else [],
                    line=i + 1
                )
                conditions_88.append(condition)
                last_variable.conditions_88.append(condition)
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
        
        var = CobolVariable(
            level=level,
            name=name,
            picture=picture,
            value=value,
            line=i + 1,
            parent_group=current_group if level > 1 else None
        )
        variables.append(var)
        last_variable = var
    
    return variables, conditions_88


def parse_file_descriptors(source: str) -> List[CobolFileDescriptor]:
    """Extract FILE SECTION file descriptors"""
    descriptors = []
    
    # Match FD statements
    fd_pattern = re.compile(
        r'FD\s+([A-Z0-9][-A-Z0-9]*)[^.]*\.\s*(?:\d{1,2}\s+([A-Z][A-Z0-9][-A-Z0-9]*))?',
        re.IGNORECASE | re.DOTALL
    )
    
    for match in fd_pattern.finditer(source):
        fd_name = match.group(1)
        record_name = match.group(2) if match.group(2) else f'{fd_name}-RECORD'
        
        # Try to find SELECT statement for this file
        select_match = re.search(
            rf'SELECT\s+{re.escape(fd_name)}\s+.*?(?:FILE\s+STATUS\s+(?:IS\s+)?([A-Z][A-Z0-9-]*))?',
            source, re.IGNORECASE | re.DOTALL
        )
        status_var = select_match.group(1) if select_match and select_match.group(1) else None
        
        descriptors.append(CobolFileDescriptor(
            name=fd_name,
            record_name=record_name,
            status_var=status_var
        ))
    
    return descriptors


def group_into_records(variables: List[CobolVariable]) -> Dict[str, List[CobolVariable]]:
    """Group variables into logical records based on level structure"""
    records = {}
    current_record = None
    current_fields = []
    
    # Keywords that indicate record structures
    record_keywords = ['RECORD', 'REC', 'DATA', 'LINE', 'AREA', 'BLOCK']
    
    for var in variables:
        if var.level == 1:
            # Save previous record
            if current_record and current_fields:
                records[current_record] = current_fields
            
            # Check if this looks like a record
            name_upper = var.name.upper()
            is_record = any(kw in name_upper for kw in record_keywords) or not var.picture
            
            if is_record:
                current_record = var.name
                current_fields = []
            else:
                current_record = None
                current_fields = []
        elif current_record and var.level in (5, 10, 15, 20, 49, 77):
            current_fields.append(var)
    
    # Save last record
    if current_record and current_fields:
        records[current_record] = current_fields
    
    return records


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
# Python Code Generators - Clean Architecture v4.4
# ============================================================

def to_snake_case(name: str) -> str:
    """Convert COBOL-STYLE-NAME to python_style_name"""
    result = name.lower().replace('-', '_').replace('.', '')
    if result.startswith('ws_'):
        result = result[3:]
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
        'status': [],
        'counters': [],
        'totals': [],
        'rates': [],
        'fees': [],
        'config': [],
        'temp': [],
        'other': []
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


# ============================================================
# AST Generators for Enhanced Features
# ============================================================

def generate_enums_code() -> str:
    """Generate standard business enums as code string"""
    return '''
# ============================================================
# Business Domain Enums
# ============================================================

class StatusCode(Enum):
    """Standard status codes"""
    ACTIVE = "A"
    INACTIVE = "I"
    CLOSED = "C"
    PENDING = "P"
    SUSPENDED = "S"
    DELETED = "D"

class AccountType(Enum):
    """Account type codes"""
    CHECKING = "CK"
    SAVINGS = "SV"
    MONEY_MARKET = "MM"
    CERTIFICATE_OF_DEPOSIT = "CD"
    CREDIT_CARD = "CC"
    LOAN = "LN"

class TransactionType(Enum):
    """Transaction type codes"""
    DEPOSIT = "DEP"
    WITHDRAWAL = "WDR"
    TRANSFER = "TRF"
    PAYMENT = "PAY"
    FEE = "FEE"
    INTEREST = "INT"
    ADJUSTMENT = "ADJ"

class RiskLevel(Enum):
    """Risk rating levels"""
    LOW = "L"
    MEDIUM = "M"
    HIGH = "H"
    CRITICAL = "C"
'''


def generate_file_manager_code() -> str:
    """Generate FileManager class with context managers"""
    return '''
# ============================================================
# FileManager - Safe File I/O with Context Managers
# ============================================================

class FileManager:
    """Centralized file management with context manager support.
    
    Usage:
        with FileManager(file_paths) as fm:
            data = fm.read_record('customer_master')
            fm.write_record('audit_log', record)
    """
    
    def __init__(self, file_paths: Optional[Dict[str, str]] = None):
        self.file_paths = file_paths or {}
        self._files: Dict[str, Any] = {}
        self._status: Dict[str, str] = {}
        self.logger = logging.getLogger(__name__)
    
    def __enter__(self) -> 'FileManager':
        """Open all configured files"""
        self.open_all()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Close all open files"""
        self.close_all()
    
    def open_all(self) -> None:
        """Open all files in file_paths"""
        for name, path in self.file_paths.items():
            self.open_file(name, path)
    
    def open_file(self, name: str, path: str, mode: str = 'r') -> bool:
        """Open a single file with error handling"""
        try:
            self._files[name] = open(path, mode)
            self._status[name] = '00'  # COBOL success status
            self.logger.debug(f"Opened file: {name} ({path})")
            return True
        except FileNotFoundError:
            self._status[name] = '35'  # COBOL file not found
            self.logger.error(f"File not found: {path}")
            return False
        except PermissionError:
            self._status[name] = '37'  # COBOL permission denied
            self.logger.error(f"Permission denied: {path}")
            return False
        except Exception as e:
            self._status[name] = '99'  # COBOL general error
            self.logger.error(f"Error opening {path}: {e}")
            return False
    
    def close_all(self) -> None:
        """Close all open files"""
        for name, file_obj in self._files.items():
            try:
                if file_obj and not file_obj.closed:
                    file_obj.close()
                    self._status[name] = '00'
                    self.logger.debug(f"Closed file: {name}")
            except Exception as e:
                self.logger.error(f"Error closing {name}: {e}")
        self._files.clear()
    
    def close_file(self, name: str) -> bool:
        """Close a single file"""
        if name in self._files:
            try:
                self._files[name].close()
                del self._files[name]
                self._status[name] = '00'
                return True
            except Exception as e:
                self.logger.error(f"Error closing {name}: {e}")
                return False
        return False
    
    def read_record(self, name: str) -> Optional[str]:
        """Read a record from file (returns None at EOF)"""
        if name not in self._files:
            self._status[name] = '35'
            return None
        
        try:
            line = self._files[name].readline()
            if not line:
                self._status[name] = '10'  # COBOL end of file
                return None
            self._status[name] = '00'
            return line.rstrip('\\n')
        except Exception as e:
            self._status[name] = '99'
            self.logger.error(f"Error reading {name}: {e}")
            return None
    
    def write_record(self, name: str, record: str) -> bool:
        """Write a record to file"""
        if name not in self._files:
            self._status[name] = '35'
            return False
        
        try:
            self._files[name].write(record + '\\n')
            self._status[name] = '00'
            return True
        except Exception as e:
            self._status[name] = '99'
            self.logger.error(f"Error writing to {name}: {e}")
            return False
    
    def get_status(self, name: str) -> str:
        """Get file status code (COBOL FILE STATUS compatible)"""
        return self._status.get(name, '99')
    
    def is_eof(self, name: str) -> bool:
        """Check if end of file reached"""
        return self._status.get(name) == '10'
    
    def is_ok(self, name: str) -> bool:
        """Check if last operation was successful"""
        return self._status.get(name) == '00'
'''


def generate_record_dataclass(record_name: str, fields: List[CobolVariable]) -> str:
    """Generate a dataclass for a COBOL record"""
    class_name = to_pascal_case(record_name)
    
    lines = []
    lines.append('@dataclass')
    lines.append(f'class {class_name}:')
    lines.append(f'    """Data record from COBOL: {record_name}"""')
    
    if not fields:
        lines.append('    pass')
        return '\n'.join(lines)
    
    for var in fields:
        py_name = to_snake_case(var.name)
        py_type, _ = pic_to_python_type(var.picture, var.value)
        
        # Determine default value
        if py_type == 'Decimal':
            default = "field(default_factory=lambda: Decimal('0'))"
        elif py_type == 'str':
            default = "field(default='')"
        else:
            default = "field(default=None)"
        
        lines.append(f'    {py_name}: {py_type} = {default}')
    
    return '\n'.join(lines)


def generate_88_level_properties(conditions: List[Cobol88Condition]) -> str:
    """Generate @property decorators for 88-level conditions"""
    if not conditions:
        return ''
    
    lines = []
    lines.append('')
    lines.append('    # ═══════════════════════════════════════════════════════════')
    lines.append('    # COBOL 88-LEVEL CONDITIONS (Boolean properties)')
    lines.append('    # ═══════════════════════════════════════════════════════════')
    
    # Group conditions by parent variable
    by_parent: Dict[str, List[Cobol88Condition]] = {}
    for cond in conditions:
        parent = to_snake_case(cond.parent_var)
        if parent not in by_parent:
            by_parent[parent] = []
        by_parent[parent].append(cond)
    
    for parent, conds in by_parent.items():
        for cond in conds:
            prop_name = to_snake_case(cond.name)
            values = cond.values
            
            # Generate getter
            lines.append('')
            lines.append(f'    @property')
            lines.append(f'    def {prop_name}(self) -> bool:')
            lines.append(f'        """88-level condition: {cond.name} (parent: {parent})"""')
            
            if values:
                # Check if parent equals any of the values
                value_checks = ' or '.join([f'self.{parent} == {repr(v)}' for v in values])
                lines.append(f'        return {value_checks}')
            else:
                lines.append(f'        return bool(self.{parent})')
            
            # Generate setter
            lines.append('')
            lines.append(f'    @{prop_name}.setter')
            lines.append(f'    def {prop_name}(self, value: bool) -> None:')
            lines.append(f'        """Set {parent} to first condition value when True"""')
            if values:
                first_value = values[0]
                lines.append(f'        if value:')
                lines.append(f'            self.{parent} = {repr(first_value)}')
            else:
                lines.append(f'        self.{parent} = value')
    
    return '\n'.join(lines)


def generate_python_ast_v4(cobol_ast: CobolAST) -> ast.Module:
    """Generate Python AST with Clean Architecture v4.4 patterns"""
    class_name = to_pascal_case(cobol_ast.program_id)
    
    body = []
    
    # Module docstring
    body.append(ast.Expr(value=ast.Constant(
        value=f"""{class_name} - Clean Architecture Python Code
Auto-transpiled from COBOL [AST Transpiler v4.4]

Architecture:
- FileManager with context managers for safe I/O
- Business domain Enums (StatusCode, AccountType, etc.)
- Dataclasses for COBOL records
- Proper @property for 88-level conditions
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
        ast.ImportFrom(module='contextlib', names=[
            ast.alias(name='contextmanager')
        ], level=0),
        ast.Import(names=[ast.alias(name='logging')]),
    ]
    body.extend(imports)
    
    # Parse and add enum, FileManager, and record dataclass code
    extra_code = generate_enums_code() + '\n' + generate_file_manager_code()
    
    # Add record dataclasses
    for record_name, fields in cobol_ast.record_groups.items():
        extra_code += '\n\n' + generate_record_dataclass(record_name, fields)
    
    # Parse extra code and add to body
    extra_ast = ast.parse(extra_code)
    body.extend(extra_ast.body)
    
    # Categorize variables
    categories = categorize_variables(cobol_ast.variables)
    
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
    file_manager: FileManager for safe I/O
    
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
        value=ast.Constant(value='4.4.0'),
        simple=1
    ))
    
    # COBOL constants
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
    init_body = generate_init_body_v4(cobol_ast.variables, class_name, 
                                      has_config=(config_class is not None),
                                      has_files=bool(cobol_ast.file_descriptors))
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
    
    # Add 88-level properties as code
    if cobol_ast.conditions_88:
        prop_code = generate_88_level_properties(cobol_ast.conditions_88)
        if prop_code.strip():
            # Parse and add each property
            # We need to add these as method definitions
            for cond in cobol_ast.conditions_88:
                prop_name = to_snake_case(cond.name)
                parent = to_snake_case(cond.parent_var)
                values = cond.values
                
                # Create getter
                if values:
                    value_check = f'self.{parent} == {repr(values[0])}'
                    getter_body = [ast.Return(value=ast.parse(value_check, mode='eval').body)]
                else:
                    getter_body = [ast.Return(value=ast.Call(
                        func=ast.Name(id='bool', ctx=ast.Load()),
                        args=[ast.Attribute(
                            value=ast.Name(id='self', ctx=ast.Load()),
                            attr=parent,
                            ctx=ast.Load()
                        )],
                        keywords=[]
                    ))]
                
                # Sanitize condition name for docstring
                safe_cond_name = cond.name.replace('"', "'").replace('\n', ' ')
                safe_parent = parent.replace('"', "'").replace('\n', ' ')
                docstring_text = f"COBOL 88-level condition: {safe_cond_name}\n\nParent variable: {safe_parent}"
                
                getter = ast.FunctionDef(
                    name=prop_name,
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
                        ast.Expr(value=ast.Constant(value=docstring_text)),
                        *getter_body
                    ],
                    decorator_list=[ast.Name(id='property', ctx=ast.Load())],
                    returns=ast.Name(id='bool', ctx=ast.Load())
                )
                class_body.append(getter)
                
                # Create setter
                if values:
                    setter_body = [
                        ast.If(
                            test=ast.Name(id='value', ctx=ast.Load()),
                            body=[ast.Assign(
                                targets=[ast.Attribute(
                                    value=ast.Name(id='self', ctx=ast.Load()),
                                    attr=parent,
                                    ctx=ast.Store()
                                )],
                                value=ast.Constant(value=values[0])
                            )],
                            orelse=[]
                        )
                    ]
                else:
                    setter_body = [ast.Assign(
                        targets=[ast.Attribute(
                            value=ast.Name(id='self', ctx=ast.Load()),
                            attr=parent,
                            ctx=ast.Store()
                        )],
                        value=ast.Name(id='value', ctx=ast.Load())
                    )]
                
                setter = ast.FunctionDef(
                    name=prop_name,
                    args=ast.arguments(
                        posonlyargs=[],
                        args=[
                            ast.arg(arg='self'),
                            ast.arg(arg='value', annotation=ast.Name(id='bool', ctx=ast.Load()))
                        ],
                        vararg=None,
                        kwonlyargs=[],
                        kw_defaults=[],
                        kwarg=None,
                        defaults=[]
                    ),
                    body=setter_body,
                    decorator_list=[ast.Attribute(
                        value=ast.Name(id=prop_name, ctx=ast.Load()),
                        attr='setter',
                        ctx=ast.Load()
                    )],
                    returns=None
                )
                class_body.append(setter)
    
    # __getattr__ for dynamic COBOL variables
    getattr_code = '''
def __getattr__(self, name):
    """Handle undefined COBOL variables (REDEFINES, sub-fields, implicit vars)"""
    lower = name.lower()
    string_keywords = ('msg', 'message', 'text', 'name', 'desc', 'description', 'status', 
                       'code', 'type', 'id', 'key', 'record', 'line', 'reason', 'path',
                       'file', 'string', 'char', 'alpha', 'label', 'title', 'header', 'footer')
    is_string = any(kw in lower for kw in string_keywords)
    
    bool_keywords = ('flag', 'eof', 'error', 'valid', 'found', 'done', 'active', 'enabled', 'disabled')
    is_bool = any(kw in lower for kw in bool_keywords)
    
    if is_string:
        self.__dict__[name] = ''
    elif is_bool:
        self.__dict__[name] = False
    else:
        self.__dict__[name] = Decimal('0')
    return self.__dict__[name]
'''
    getattr_ast = ast.parse(getattr_code).body[0]
    class_body.append(getattr_ast)
    
    # Generate service methods from paragraphs
    for para in cobol_ast.paragraphs:
        method = generate_method_from_paragraph_v4(para)
        class_body.append(method)
    
    # Run method
    run_body = []
    run_body.append(ast.Expr(value=ast.Constant(value="Main entry point - executes primary workflow")))
    run_body.append(ast.Expr(value=ast.Call(
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
    )))
    
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
        body=run_body,
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


def generate_init_body_v4(variables: List[CobolVariable], class_name: str, 
                          has_config: bool = True, has_files: bool = False) -> List[ast.stmt]:
    """Generate __init__ body with FileManager support"""
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
    
    # FileManager
    init_body.append(ast.Assign(
        targets=[ast.Attribute(
            value=ast.Name(id='self', ctx=ast.Load()),
            attr='file_manager',
            ctx=ast.Store()
        )],
        value=ast.Call(
            func=ast.Name(id='FileManager', ctx=ast.Load()),
            args=[],
            keywords=[]
        )
    ))
    
    # Config instance
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
    
    # State variables
    config_keywords = ['RATE', 'FEE', 'CHARGE', 'PREMIUM', 'PCT']
    
    for var in variables:
        name_upper = var.name.upper()
        if any(kw in name_upper for kw in config_keywords):
            continue
        
        py_name = to_snake_case(var.name)
        
        if var.level == 1 and not var.picture:
            continue
        
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
    
    if len(init_body) <= 3:
        init_body.append(ast.Pass())
    
    return init_body


def generate_method_from_paragraph_v4(para: CobolParagraph) -> ast.FunctionDef:
    """Generate method from COBOL paragraph"""
    method_name = to_snake_case(para.name)
    method_body = transpile_statements_v4(para.statements)
    
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


# ============================================================
# Statement Transpilers v4 (with FileManager support)
# ============================================================

def transpile_statements_v4(statements: List[str]) -> List[ast.stmt]:
    """Transpile COBOL statements to Python AST (v4: FileManager)"""
    result = []
    i = 0
    
    while i < len(statements):
        stmt = statements[i].strip()
        upper = stmt.upper()
        
        if not upper or upper.startswith('*'):
            i += 1
            continue
        
        if upper.startswith('MOVE '):
            py_stmt = transpile_move_v4(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        elif upper.startswith('DISPLAY '):
            py_stmt = transpile_display_v4(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        elif upper.startswith('COMPUTE '):
            py_stmt = transpile_compute_v4(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        elif upper.startswith('ADD '):
            py_stmt = transpile_add_v4(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        elif upper.startswith('SUBTRACT '):
            py_stmt = transpile_subtract_v4(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        elif upper.startswith('PERFORM '):
            py_stmt = transpile_perform_v4(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        elif upper.startswith('IF '):
            py_stmt, consumed = transpile_if_v4(statements, i)
            if py_stmt:
                result.append(py_stmt)
            i += consumed
            continue
        
        elif 'STOP RUN' in upper or upper == 'GOBACK' or upper == 'GOBACK.':
            result.append(ast.Return(value=None))
        
        elif upper.startswith('SET '):
            py_stmt = transpile_set_v4(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        elif upper.startswith('INITIALIZE '):
            py_stmt = transpile_initialize_v4(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        elif upper.startswith('MULTIPLY '):
            py_stmt = transpile_multiply_v4(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        elif upper.startswith('DIVIDE '):
            py_stmt = transpile_divide_v4(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        elif upper.startswith('EVALUATE '):
            py_stmt, consumed = transpile_evaluate_v4(statements, i)
            if py_stmt:
                result.append(py_stmt)
            i += consumed
            continue
        
        elif upper.startswith('STRING '):
            py_stmt = transpile_string_v4(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        elif upper.startswith(('OPEN ', 'CLOSE ', 'READ ', 'WRITE ')):
            py_stmt = transpile_file_io_v4(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        elif upper.startswith('ACCEPT '):
            py_stmt = transpile_accept_v4(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        elif upper.startswith('CALL '):
            py_stmt = transpile_call_v4(stmt)
            if py_stmt:
                result.append(py_stmt)
        
        elif upper in ('CONTINUE', 'CONTINUE.', 'NEXT SENTENCE', 'NEXT SENTENCE.'):
            result.append(ast.Pass())
        
        elif upper.startswith('EXIT'):
            result.append(ast.Pass())
        
        elif upper.startswith('END-'):
            pass
        
        elif len(upper) <= 1 or upper == '.':
            pass
        
        else:
            pass  # Complex statements handled by Gemini
        
        i += 1
    
    return result


def transpile_move_v4(stmt: str) -> Optional[ast.stmt]:
    """Transpile MOVE statement"""
    upper = stmt.upper()
    
    match = re.match(r'MOVE\s+ZEROS?\s+TO\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        return ast.Assign(
            targets=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Store())],
            value=ast.Call(func=ast.Name(id='Decimal', ctx=ast.Load()), args=[ast.Constant(value='0')], keywords=[])
        )
    
    match = re.match(r'MOVE\s+SPACES?\s+TO\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        return ast.Assign(
            targets=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Store())],
            value=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr='SPACES', ctx=ast.Load())
        )
    
    match = re.match(r'MOVE\s+LOW-VALUES?\s+TO\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        return ast.Assign(
            targets=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Store())],
            value=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr='LOW_VALUES', ctx=ast.Load())
        )
    
    match = re.match(r'MOVE\s+HIGH-VALUES?\s+TO\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        return ast.Assign(
            targets=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Store())],
            value=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr='HIGH_VALUES', ctx=ast.Load())
        )
    
    match = re.match(r'MOVE\s+["\']([^"\']+)["\']\s+TO\s+([A-Z0-9][-A-Z0-9]*)', stmt, re.IGNORECASE)
    if match:
        literal = match.group(1)
        target = to_snake_case(match.group(2))
        return ast.Assign(
            targets=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Store())],
            value=ast.Constant(value=literal)
        )
    
    match = re.match(r'MOVE\s+(\d+(?:\.\d+)?)\s+TO\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        value = match.group(1)
        target = to_snake_case(match.group(2))
        return ast.Assign(
            targets=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Store())],
            value=ast.Call(func=ast.Name(id='Decimal', ctx=ast.Load()), args=[ast.Constant(value=value)], keywords=[])
        )
    
    match = re.match(r'MOVE\s+([A-Z0-9][-A-Z0-9]*)\s+TO\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        source = to_snake_case(match.group(1))
        target = to_snake_case(match.group(2))
        return ast.Assign(
            targets=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Store())],
            value=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=source, ctx=ast.Load())
        )
    
    return None


def transpile_display_v4(stmt: str) -> Optional[ast.stmt]:
    """Transpile DISPLAY statement"""
    match = re.match(r'DISPLAY\s+["\']([^"\']+)["\']', stmt, re.IGNORECASE)
    if match:
        message = match.group(1)
        return ast.Expr(value=ast.Call(
            func=ast.Attribute(
                value=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr='logger', ctx=ast.Load()),
                attr='info', ctx=ast.Load()
            ),
            args=[ast.Constant(value=message)],
            keywords=[]
        ))
    
    match = re.match(r'DISPLAY\s+([A-Z0-9][-A-Z0-9]*)', stmt, re.IGNORECASE)
    if match:
        var = to_snake_case(match.group(1))
        return ast.Expr(value=ast.Call(
            func=ast.Attribute(
                value=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr='logger', ctx=ast.Load()),
                attr='info', ctx=ast.Load()
            ),
            args=[ast.JoinedStr(values=[
                ast.FormattedValue(
                    value=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=var, ctx=ast.Load()),
                    conversion=-1, format_spec=None
                )
            ])],
            keywords=[]
        ))
    
    return None


def transpile_compute_v4(stmt: str) -> Optional[ast.stmt]:
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
                targets=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Store())],
                value=expr_ast
            )
        except SyntaxError:
            return None
    
    return None


def transpile_add_v4(stmt: str) -> Optional[ast.stmt]:
    """Transpile ADD statement"""
    upper = stmt.upper()
    
    match = re.match(r'ADD\s+(\d+(?:\.\d+)?)\s+TO\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        value = match.group(1)
        target = to_snake_case(match.group(2))
        return ast.AugAssign(
            target=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Store()),
            op=ast.Add(),
            value=ast.Call(func=ast.Name(id='Decimal', ctx=ast.Load()), args=[ast.Constant(value=value)], keywords=[])
        )
    
    match = re.match(r'ADD\s+([A-Z0-9][-A-Z0-9]*)\s+TO\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        source = to_snake_case(match.group(1))
        target = to_snake_case(match.group(2))
        return ast.AugAssign(
            target=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Store()),
            op=ast.Add(),
            value=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=source, ctx=ast.Load())
        )
    
    return None


def transpile_subtract_v4(stmt: str) -> Optional[ast.stmt]:
    """Transpile SUBTRACT statement"""
    upper = stmt.upper()
    
    match = re.match(r'SUBTRACT\s+([A-Z0-9][-A-Z0-9]*)\s+FROM\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        source = to_snake_case(match.group(1))
        target = to_snake_case(match.group(2))
        return ast.AugAssign(
            target=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Store()),
            op=ast.Sub(),
            value=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=source, ctx=ast.Load())
        )
    
    return None


def transpile_perform_v4(stmt: str) -> Optional[ast.stmt]:
    """Transpile PERFORM statement"""
    upper = stmt.upper()
    
    match = re.match(r'PERFORM\s+([A-Z0-9][-A-Z0-9]*)\s+(\d+)\s+TIMES', upper, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        times = int(match.group(2))
        return ast.For(
            target=ast.Name(id='_', ctx=ast.Store()),
            iter=ast.Call(func=ast.Name(id='range', ctx=ast.Load()), args=[ast.Constant(value=times)], keywords=[]),
            body=[ast.Expr(value=ast.Call(
                func=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Load()),
                args=[], keywords=[]
            ))],
            orelse=[]
        )
    
    match = re.match(r'PERFORM\s+([A-Z0-9][-A-Z0-9]*)\s+UNTIL\s+([A-Z0-9][-A-Z0-9]*)', upper, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        cond_var = to_snake_case(match.group(2))
        return ast.While(
            test=ast.UnaryOp(
                op=ast.Not(),
                operand=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=cond_var, ctx=ast.Load())
            ),
            body=[ast.Expr(value=ast.Call(
                func=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Load()),
                args=[], keywords=[]
            ))],
            orelse=[]
        )
    
    match = re.match(r'PERFORM\s+([A-Z0-9][-A-Z0-9]+)', upper, re.IGNORECASE)
    if match and 'UNTIL' not in upper and 'TIMES' not in upper and 'VARYING' not in upper:
        target = to_snake_case(match.group(1))
        return ast.Expr(value=ast.Call(
            func=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Load()),
            args=[], keywords=[]
        ))
    
    return None


def transpile_if_v4(statements: List[str], start_idx: int) -> Tuple[Optional[ast.stmt], int]:
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
        
        transpiled = transpile_statements_v4([line])
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


def transpile_set_v4(stmt: str) -> Optional[ast.stmt]:
    """Transpile SET statement"""
    upper = stmt.upper()
    
    match = re.match(r'SET\s+([A-Z0-9][-A-Z0-9]*)\s+TO\s+(TRUE|FALSE)', upper, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        value = match.group(2).upper() == 'TRUE'
        return ast.Assign(
            targets=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Store())],
            value=ast.Constant(value=value)
        )
    
    return None


def transpile_initialize_v4(stmt: str) -> Optional[ast.stmt]:
    """Transpile INITIALIZE statement"""
    match = re.match(r'INITIALIZE\s+([A-Z0-9][-A-Z0-9]*)', stmt, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        return ast.Assign(
            targets=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Store())],
            value=ast.Constant(value=None)
        )
    return None


def transpile_multiply_v4(stmt: str) -> Optional[ast.stmt]:
    """Transpile MULTIPLY statement"""
    upper = stmt.upper()
    
    match = re.match(r'MULTIPLY\s+([A-Z0-9][-A-Z0-9]*)\s+BY\s+([A-Z0-9][-A-Z0-9]*)\s+GIVING\s+([A-Z0-9][-A-Z0-9]*)', upper)
    if match:
        x = to_snake_case(match.group(1))
        y = to_snake_case(match.group(2))
        z = to_snake_case(match.group(3))
        return ast.Assign(
            targets=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=z, ctx=ast.Store())],
            value=ast.BinOp(
                left=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=x, ctx=ast.Load()),
                op=ast.Mult(),
                right=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=y, ctx=ast.Load())
            )
        )
    
    match = re.match(r'MULTIPLY\s+([A-Z0-9][-A-Z0-9]*)\s+BY\s+([A-Z0-9][-A-Z0-9]*)', upper)
    if match:
        x = to_snake_case(match.group(1))
        y = to_snake_case(match.group(2))
        return ast.AugAssign(
            target=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=y, ctx=ast.Store()),
            op=ast.Mult(),
            value=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=x, ctx=ast.Load())
        )
    
    return None


def transpile_divide_v4(stmt: str) -> Optional[ast.stmt]:
    """Transpile DIVIDE statement"""
    upper = stmt.upper()
    
    match = re.match(r'DIVIDE\s+([A-Z0-9][-A-Z0-9]*)\s+BY\s+([A-Z0-9][-A-Z0-9]*)\s+GIVING\s+([A-Z0-9][-A-Z0-9]*)\s+REMAINDER\s+([A-Z0-9][-A-Z0-9]*)', upper)
    if match:
        x = to_snake_case(match.group(1))
        y = to_snake_case(match.group(2))
        z = to_snake_case(match.group(3))
        r = to_snake_case(match.group(4))
        return ast.Assign(
            targets=[ast.Tuple(elts=[
                ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=z, ctx=ast.Store()),
                ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=r, ctx=ast.Store())
            ], ctx=ast.Store())],
            value=ast.Call(
                func=ast.Name(id='divmod', ctx=ast.Load()),
                args=[
                    ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=x, ctx=ast.Load()),
                    ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=y, ctx=ast.Load())
                ],
                keywords=[]
            )
        )
    
    match = re.match(r'DIVIDE\s+([A-Z0-9][-A-Z0-9]*)\s+BY\s+([A-Z0-9][-A-Z0-9]*)\s+GIVING\s+([A-Z0-9][-A-Z0-9]*)', upper)
    if match:
        x = to_snake_case(match.group(1))
        y = to_snake_case(match.group(2))
        z = to_snake_case(match.group(3))
        return ast.Assign(
            targets=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=z, ctx=ast.Store())],
            value=ast.BinOp(
                left=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=x, ctx=ast.Load()),
                op=ast.Div(),
                right=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=y, ctx=ast.Load())
            )
        )
    
    match = re.match(r'DIVIDE\s+([A-Z0-9][-A-Z0-9]*)\s+INTO\s+([A-Z0-9][-A-Z0-9]*)', upper)
    if match:
        x = to_snake_case(match.group(1))
        y = to_snake_case(match.group(2))
        return ast.AugAssign(
            target=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=y, ctx=ast.Store()),
            op=ast.Div(),
            value=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=x, ctx=ast.Load())
        )
    
    return None


def transpile_evaluate_v4(statements: List[str], start_idx: int) -> Tuple[Optional[ast.stmt], int]:
    """Transpile EVALUATE statement (COBOL switch/case)"""
    stmt = statements[start_idx].strip()
    upper = stmt.upper()
    
    match = re.match(r'EVALUATE\s+(.+)', upper)
    if not match:
        return None, 0
    
    subject = match.group(1).strip()
    is_true_eval = subject == 'TRUE'
    
    consumed = 1
    cases = []
    current_when = None
    current_body = []
    
    for i in range(start_idx + 1, len(statements)):
        line = statements[i].strip()
        line_upper = line.upper()
        consumed += 1
        
        if line_upper.startswith('END-EVALUATE') or line_upper == 'END-EVALUATE.':
            if current_when is not None:
                cases.append((current_when, current_body))
            break
        
        if line_upper.startswith('WHEN OTHER'):
            if current_when is not None:
                cases.append((current_when, current_body))
            current_when = 'OTHER'
            current_body = []
            continue
        
        when_match = re.match(r'WHEN\s+(.+)', line_upper)
        if when_match:
            if current_when is not None:
                cases.append((current_when, current_body))
            current_when = when_match.group(1).strip()
            current_body = []
            continue
        
        if current_when is not None and line.strip():
            transpiled = transpile_statements_v4([line])
            current_body.extend(transpiled)
    
    if not cases:
        return ast.Pass(), consumed
    
    result = None
    else_body = None
    
    for cond, body in reversed(cases):
        if not body:
            body = [ast.Pass()]
        
        if cond == 'OTHER':
            else_body = body
            continue
        
        if is_true_eval:
            try:
                cond_py = cond.replace(' AND ', ' and ').replace(' OR ', ' or ')
                cond_py = re.sub(r'([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)', 
                                lambda m: f'self.{to_snake_case(m.group(1))}', cond_py)
                test_ast = ast.parse(cond_py, mode='eval').body
            except:
                test_ast = ast.Constant(value=True)
        else:
            subject_py = to_snake_case(subject)
            try:
                value_py = cond.strip('"\'')
                if value_py.isdigit():
                    test_ast = ast.Compare(
                        left=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=subject_py, ctx=ast.Load()),
                        ops=[ast.Eq()],
                        comparators=[ast.Call(func=ast.Name(id='Decimal', ctx=ast.Load()), args=[ast.Constant(value=value_py)], keywords=[])]
                    )
                else:
                    test_ast = ast.Compare(
                        left=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=subject_py, ctx=ast.Load()),
                        ops=[ast.Eq()],
                        comparators=[ast.Constant(value=value_py)]
                    )
            except:
                test_ast = ast.Constant(value=True)
        
        if result is None:
            result = ast.If(test=test_ast, body=body, orelse=else_body or [])
        else:
            result = ast.If(test=test_ast, body=body, orelse=[result])
    
    return result, consumed


def transpile_string_v4(stmt: str) -> Optional[ast.stmt]:
    """Transpile STRING statement (concatenation)"""
    match = re.match(r'STRING\s+(.+?)\s+INTO\s+([A-Z0-9][-A-Z0-9]*)', stmt, re.IGNORECASE)
    if match:
        parts = match.group(1)
        target = to_snake_case(match.group(2))
        
        parts_clean = re.sub(r'DELIMITED\s+BY\s+\S+', '', parts, flags=re.IGNORECASE).strip()
        vars_list = re.findall(r'[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*', parts_clean, re.IGNORECASE)
        
        if vars_list:
            concat_parts = []
            for v in vars_list:
                concat_parts.append(ast.Call(
                    func=ast.Name(id='str', ctx=ast.Load()),
                    args=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=to_snake_case(v), ctx=ast.Load())],
                    keywords=[]
                ))
            
            if len(concat_parts) == 1:
                concat_expr = concat_parts[0]
            else:
                concat_expr = concat_parts[0]
                for part in concat_parts[1:]:
                    concat_expr = ast.BinOp(left=concat_expr, op=ast.Add(), right=part)
            
            return ast.Assign(
                targets=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Store())],
                value=concat_expr
            )
    
    return None


def transpile_file_io_v4(stmt: str) -> Optional[ast.stmt]:
    """Transpile file I/O using FileManager"""
    upper = stmt.upper()
    
    if upper.startswith('OPEN '):
        match = re.match(r'OPEN\s+(INPUT|OUTPUT|I-O|EXTEND)\s+([A-Z0-9][-A-Z0-9]*)', upper)
        if match:
            mode = match.group(1)
            file_name = to_snake_case(match.group(2))
            py_mode = {'INPUT': 'r', 'OUTPUT': 'w', 'I-O': 'r+', 'EXTEND': 'a'}.get(mode, 'r')
            return ast.Expr(value=ast.Call(
                func=ast.Attribute(
                    value=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr='file_manager', ctx=ast.Load()),
                    attr='open_file', ctx=ast.Load()
                ),
                args=[
                    ast.Constant(value=file_name),
                    ast.Constant(value=f'{file_name}.dat'),
                    ast.Constant(value=py_mode)
                ],
                keywords=[]
            ))
    
    elif upper.startswith('CLOSE '):
        match = re.match(r'CLOSE\s+([A-Z0-9][-A-Z0-9]*)', upper)
        if match:
            file_name = to_snake_case(match.group(1))
            return ast.Expr(value=ast.Call(
                func=ast.Attribute(
                    value=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr='file_manager', ctx=ast.Load()),
                    attr='close_file', ctx=ast.Load()
                ),
                args=[ast.Constant(value=file_name)],
                keywords=[]
            ))
    
    elif upper.startswith('READ '):
        match = re.match(r'READ\s+([A-Z0-9][-A-Z0-9]*)', upper)
        if match:
            file_name = to_snake_case(match.group(1))
            return ast.Assign(
                targets=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=f'{file_name}_record', ctx=ast.Store())],
                value=ast.Call(
                    func=ast.Attribute(
                        value=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr='file_manager', ctx=ast.Load()),
                        attr='read_record', ctx=ast.Load()
                    ),
                    args=[ast.Constant(value=file_name)],
                    keywords=[]
                )
            )
    
    elif upper.startswith('WRITE '):
        match = re.match(r'WRITE\s+([A-Z0-9][-A-Z0-9]*)', upper)
        if match:
            record_name = to_snake_case(match.group(1))
            return ast.Expr(value=ast.Call(
                func=ast.Attribute(
                    value=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr='file_manager', ctx=ast.Load()),
                    attr='write_record', ctx=ast.Load()
                ),
                args=[
                    ast.Constant(value=record_name),
                    ast.Call(func=ast.Name(id='str', ctx=ast.Load()),
                            args=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=record_name, ctx=ast.Load())],
                            keywords=[])
                ],
                keywords=[]
            ))
    
    return None


def transpile_accept_v4(stmt: str) -> Optional[ast.stmt]:
    """Transpile ACCEPT statement"""
    upper = stmt.upper()
    
    if 'FROM DATE' in upper or 'FROM TIME' in upper:
        match = re.match(r'ACCEPT\s+([A-Z0-9][-A-Z0-9]*)\s+FROM\s+(DATE|TIME)', upper)
        if match:
            target = to_snake_case(match.group(1))
            source = match.group(2)
            if source == 'DATE':
                return ast.Assign(
                    targets=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Store())],
                    value=ast.Call(
                        func=ast.Attribute(
                            value=ast.Call(
                                func=ast.Attribute(value=ast.Name(id='datetime', ctx=ast.Load()), attr='now', ctx=ast.Load()),
                                args=[], keywords=[]
                            ),
                            attr='strftime', ctx=ast.Load()
                        ),
                        args=[ast.Constant(value='%Y%m%d')],
                        keywords=[]
                    )
                )
            else:
                return ast.Assign(
                    targets=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Store())],
                    value=ast.Call(
                        func=ast.Attribute(
                            value=ast.Call(
                                func=ast.Attribute(value=ast.Name(id='datetime', ctx=ast.Load()), attr='now', ctx=ast.Load()),
                                args=[], keywords=[]
                            ),
                            attr='strftime', ctx=ast.Load()
                        ),
                        args=[ast.Constant(value='%H%M%S%f')],
                        keywords=[]
                    )
                )
    
    match = re.match(r'ACCEPT\s+([A-Z0-9][-A-Z0-9]*)', stmt, re.IGNORECASE)
    if match:
        target = to_snake_case(match.group(1))
        return ast.Assign(
            targets=[ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=target, ctx=ast.Store())],
            value=ast.Constant(value='')
        )
    return None


def transpile_call_v4(stmt: str) -> Optional[ast.stmt]:
    """Transpile CALL statement"""
    match = re.match(r'CALL\s+["\']?([A-Z0-9][-A-Z0-9]*)["\']?', stmt, re.IGNORECASE)
    if match:
        program = to_snake_case(match.group(1))
        return ast.Expr(value=ast.Call(
            func=ast.Attribute(value=ast.Name(id='self', ctx=ast.Load()), attr=f'call_{program}', ctx=ast.Load()),
            args=[], keywords=[]
        ))
    return None


# ============================================================
# Gemini Enrichment (Hybrid Mode)
# ============================================================

def enrich_with_gemini(python_code: str, cobol_source: str, max_calls: int = 100) -> Tuple[str, Dict]:
    """Enrich TODO methods with Gemini AI"""
    stats = {'gemini_calls': 0, 'enriched': 0, 'failed': 0, 'total_methods': 0}
    
    try:
        import os
        import google.generativeai as genai
        
        api_key = os.environ.get('GEMINI_API_KEY', '')
        if not api_key:
            stats['error'] = 'No GEMINI_API_KEY'
            return python_code, stats
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        todo_pattern = re.compile(r"(    def ([a-z][a-z0-9_]*)\(self\)[^:]*:.*?(?=\n    def |\nclass |\nif __name__|$))", re.DOTALL)
        methods = todo_pattern.findall(python_code)
        stats['total_methods'] = len(methods)
        
        for method_code, method_name in methods[:max_calls]:
            if method_name in ('__init__', 'run', '__getattr__') or 'TODO' not in method_code:
                continue
            
            cobol_name = method_name.upper().replace('_', '-')
            cobol_name_alt = re.sub(r'^P-', '', cobol_name)
            cobol_name_alt2 = re.sub(r'^\d+-', '', cobol_name)
            
            para_match = None
            for name_variant in [cobol_name, cobol_name_alt, cobol_name_alt2]:
                para_match = re.search(
                    rf'^\s*{re.escape(name_variant)}\s*\.\s*$.*?(?=^\s*[A-Z0-9][-A-Z0-9]+\s*\.\s*$|STOP\s+RUN|GOBACK|\Z)', 
                    cobol_source, re.MULTILINE | re.DOTALL | re.IGNORECASE
                )
                if para_match:
                    break
            
            if not para_match:
                stats['failed'] += 1
                continue
            
            cobol_para = para_match.group(0)[:1500]
            
            prompt = f"""Convert this COBOL paragraph to Python. Output ONLY executable code lines with 8-space indent.

COBOL:
{cobol_para}

TRANSLATION RULES:
1. Variables: self.var_name (snake_case, remove WS- prefix)
2. Numbers: Decimal('value') for ALL numeric operations
3. MOVE X TO Y → self.y = self.x
4. ADD X TO Y → self.y += self.x
5. SUBTRACT X FROM Y → self.y -= self.x
6. MULTIPLY X BY Y GIVING Z → self.z = self.x * self.y
7. DIVIDE X BY Y GIVING Z → self.z = self.x / self.y
8. COMPUTE X = expr → self.x = expr
9. PERFORM para → self.para_name()
10. IF cond / END-IF → if cond:
11. DISPLAY → self.logger.info()
12. File I/O → self.file_manager.read_record() / write_record()
13. Booleans: Use True/False not 'Y'/'N'

Output ONLY the method body (8-space indent), NO 'def' line:"""

            try:
                stats['gemini_calls'] += 1
                response = model.generate_content(prompt)
                new_body = response.text.strip()
                
                # Clean markdown code blocks
                new_body = re.sub(r'^```python\s*\n?', '', new_body)
                new_body = re.sub(r'\n?```\s*$', '', new_body)
                new_body = re.sub(r'^    def \w+\([^)]*\):\s*\n', '', new_body)
                
                # Build new method with proper indentation
                new_method = f"    def {method_name}(self) -> None:\n"
                new_method += f'        """Business logic from COBOL paragraph: {method_name.upper().replace("_", "-")}"""\n'
                
                lines = new_body.split('\n')
                base_indent = None
                
                for line in lines:
                    stripped = line.lstrip()
                    if not stripped:
                        continue
                    
                    # Detect base indentation from first non-empty line
                    if base_indent is None:
                        base_indent = len(line) - len(stripped)
                    
                    # Calculate relative indentation
                    current_indent = len(line) - len(stripped)
                    relative_indent = max(0, current_indent - base_indent)
                    
                    # Add 8-space base indent + relative indentation
                    new_method += ' ' * (8 + relative_indent) + stripped + '\n'
                
                # Ensure method has at least a pass statement
                if 'pass' not in new_method and 'return' not in new_method and 'self.' not in new_method:
                    new_method += '        pass\n'
                
                test_code = f"class T:\n{new_method}"
                ast.parse(test_code)
                
                python_code = python_code.replace(method_code, new_method)
                stats['enriched'] += 1
                
            except Exception:
                stats['failed'] += 1
                continue
        
        return python_code, stats
        
    except ImportError:
        return python_code, stats
    except Exception:
        return python_code, stats


# ============================================================
# Syntax Error Auto-Correction
# ============================================================

def fix_syntax_errors(code: str, max_attempts: int = 5) -> Tuple[str, List[str]]:
    """
    Attempt to automatically fix common Python syntax errors.
    Returns (fixed_code, list_of_fixes_applied).
    """
    fixes_applied = []
    
    for attempt in range(max_attempts):
        try:
            ast.parse(code)
            return code, fixes_applied  # Code is valid
        except SyntaxError as e:
            line_no = e.lineno or 1
            col = e.offset or 0
            msg = str(e.msg) if e.msg else ""
            
            lines = code.split('\n')
            if line_no > len(lines):
                break
            
            problem_line = lines[line_no - 1] if line_no <= len(lines) else ""
            fixed = False
            
            # Fix 1: Unclosed string/docstring
            if 'unterminated string' in msg or 'EOL while scanning' in msg:
                if '"""' in problem_line and problem_line.count('"""') % 2 == 1:
                    lines[line_no - 1] = problem_line + '"""'
                    fixes_applied.append(f"Line {line_no}: Closed unclosed docstring")
                    fixed = True
                elif "'''" in problem_line and problem_line.count("'''") % 2 == 1:
                    lines[line_no - 1] = problem_line + "'''"
                    fixes_applied.append(f"Line {line_no}: Closed unclosed docstring")
                    fixed = True
                elif '"' in problem_line and problem_line.count('"') % 2 == 1:
                    lines[line_no - 1] = problem_line + '"'
                    fixes_applied.append(f"Line {line_no}: Closed unclosed string")
                    fixed = True
                elif "'" in problem_line and problem_line.count("'") % 2 == 1:
                    lines[line_no - 1] = problem_line + "'"
                    fixes_applied.append(f"Line {line_no}: Closed unclosed string")
                    fixed = True
            
            # Fix 2: Invalid decimal literal (number followed by identifier)
            if 'invalid decimal literal' in msg or 'invalid syntax' in msg:
                # Pattern like: 88-level or 123abc
                fixed_line = re.sub(r'(\d+)([a-zA-Z_])', r'\1 # \2', problem_line)
                if fixed_line != problem_line:
                    lines[line_no - 1] = fixed_line
                    fixes_applied.append(f"Line {line_no}: Fixed invalid decimal literal")
                    fixed = True
            
            # Fix 3: Fused docstrings ("""text"""text)
            if '"""' in problem_line:
                # Fix pattern: """..."""something -> """..."""\n        # something
                fused_match = re.search(r'"""[^"]*"""(\S)', problem_line)
                if fused_match:
                    indent = len(problem_line) - len(problem_line.lstrip())
                    fixed_line = re.sub(r'("""[^"]*""")(\S)', r'\1\n' + ' ' * indent + '# \2', problem_line)
                    lines[line_no - 1] = fixed_line
                    fixes_applied.append(f"Line {line_no}: Separated fused docstring")
                    fixed = True
            
            # Fix 4: Missing colon after def/if/for/while/class/try/except/with
            if 'expected' in msg and ':' in msg:
                if re.match(r'\s*(def|if|elif|else|for|while|class|try|except|finally|with)\b', problem_line):
                    if not problem_line.rstrip().endswith(':'):
                        lines[line_no - 1] = problem_line.rstrip() + ':'
                        fixes_applied.append(f"Line {line_no}: Added missing colon")
                        fixed = True
            
            # Fix 5: Unmatched parentheses/brackets
            if 'unexpected EOF' in msg or 'was never closed' in msg:
                open_parens = code.count('(') - code.count(')')
                open_brackets = code.count('[') - code.count(']')
                open_braces = code.count('{') - code.count('}')
                
                suffix = ')' * max(0, open_parens) + ']' * max(0, open_brackets) + '}' * max(0, open_braces)
                if suffix:
                    lines.append(suffix)
                    fixes_applied.append(f"End: Added {len(suffix)} closing brackets")
                    fixed = True
            
            # Fix 6: Empty method body
            if 'expected an indented block' in msg:
                # Find the previous def/if/for line and add pass
                for i in range(line_no - 2, -1, -1):
                    if re.match(r'\s*(def|if|elif|else|for|while|try|except|finally|with)\b.*:\s*$', lines[i]):
                        indent = len(lines[i]) - len(lines[i].lstrip()) + 4
                        lines.insert(i + 1, ' ' * indent + 'pass')
                        fixes_applied.append(f"Line {i + 1}: Added missing pass statement")
                        fixed = True
                        break
            
            # Fix 7: Remove lines with invalid syntax that can't be fixed
            if not fixed and 'invalid syntax' in msg:
                # Comment out the problematic line
                indent = len(problem_line) - len(problem_line.lstrip())
                lines[line_no - 1] = ' ' * indent + '# SYNTAX_ERROR: ' + problem_line.lstrip()
                fixes_applied.append(f"Line {line_no}: Commented out invalid syntax")
                fixed = True
            
            if fixed:
                code = '\n'.join(lines)
            else:
                # Can't fix this error, break to avoid infinite loop
                fixes_applied.append(f"Line {line_no}: Unable to fix - {msg}")
                break
    
    return code, fixes_applied


# ============================================================
# Code Generation & Unit Tests
# ============================================================

def generate_python_code(cobol_source: str, enhance: bool = False) -> Dict[str, Any]:
    """Main entry point: COBOL source → Python code"""
    try:
        cobol_ast = parse_cobol(cobol_source)
        python_ast = generate_python_ast_v4(cobol_ast)
        python_code = ast.unparse(python_ast)
        
        try:
            import black
            python_code = black.format_str(python_code, mode=black.Mode())
        except ImportError:
            pass
        
        # Auto-fix any syntax errors in base generation
        python_code, base_fixes = fix_syntax_errors(python_code)
        
        gemini_stats = {'syntax_fixes_base': base_fixes}
        if enhance:
            python_code, gemini_stats = enrich_with_gemini(python_code, cobol_source)
            
            # Auto-fix any syntax errors introduced by Gemini
            python_code, gemini_fixes = fix_syntax_errors(python_code)
            gemini_stats['syntax_fixes_gemini'] = gemini_fixes
        
        class_name = to_pascal_case(cobol_ast.program_id)
        test_code = generate_unit_tests_v4(cobol_ast, class_name)
        
        return {
            'success': True,
            'python_code': python_code,
            'unit_tests': test_code,
            'version': '4.4.0-hybrid' if enhance else '4.4.0',
            'architecture': 'Clean Architecture + Enterprise Patterns',
            'stats': {
                'variables': len(cobol_ast.variables),
                'paragraphs': len(cobol_ast.paragraphs),
                'program_id': cobol_ast.program_id,
                'conditions_88': len(cobol_ast.conditions_88),
                'file_descriptors': len(cobol_ast.file_descriptors),
                'record_groups': len(cobol_ast.record_groups),
                **gemini_stats
            }
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'python_code': ''
        }


def generate_unit_tests_v4(cobol_ast: CobolAST, class_name: str) -> str:
    """Generate comprehensive unit tests (v4.4)"""
    tests = []
    tests.append(f'"""')
    tests.append(f'Auto-generated unit tests for {class_name}')
    tests.append(f'Transpiler: AST v4.4 (Clean Architecture + Enterprise Patterns)')
    tests.append(f'"""')
    tests.append('')
    tests.append('import pytest')
    tests.append('from decimal import Decimal')
    tests.append(f'from main import {class_name}, {class_name}Config, FileManager')
    tests.append('from main import StatusCode, AccountType, TransactionType')
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
    tests.append('    def test_has_file_manager(self, processor):')
    tests.append('        """Verify FileManager is initialized."""')
    tests.append('        assert hasattr(processor, "file_manager")')
    tests.append('        assert isinstance(processor.file_manager, FileManager)')
    tests.append('')
    tests.append('    def test_has_config(self, processor):')
    tests.append('        """Verify config dataclass is initialized."""')
    tests.append('        assert hasattr(processor, "config")')
    tests.append(f'        assert isinstance(processor.config, {class_name}Config)')
    tests.append('')
    tests.append('    def test_version_exists(self, processor):')
    tests.append('        """Verify VERSION class variable exists."""')
    tests.append('        assert hasattr(processor, "VERSION")')
    tests.append('        assert processor.VERSION == "4.4.0"')
    tests.append('')
    
    # Test 88-level conditions
    if cobol_ast.conditions_88:
        tests.append('')
        tests.append(f'class Test{class_name}Conditions88:')
        tests.append('    """Test 88-level condition properties."""')
        tests.append('')
        for cond in cobol_ast.conditions_88[:5]:
            prop_name = to_snake_case(cond.name)
            tests.append(f'    def test_{prop_name}_is_property(self, processor):')
            tests.append(f'        """Verify {prop_name} is a boolean property."""')
            tests.append(f'        assert hasattr(type(processor), "{prop_name}")')
            tests.append(f'        assert isinstance(getattr(type(processor), "{prop_name}"), property)')
            tests.append('')
    
    # Test FileManager
    tests.append('')
    tests.append('class TestFileManager:')
    tests.append('    """Test FileManager context manager."""')
    tests.append('')
    tests.append('    def test_file_manager_context_manager(self):')
    tests.append('        """Verify FileManager works as context manager."""')
    tests.append('        fm = FileManager()')
    tests.append('        with fm:')
    tests.append('            pass  # Should not raise')
    tests.append('')
    tests.append('    def test_file_manager_status(self):')
    tests.append('        """Verify status codes work correctly."""')
    tests.append('        fm = FileManager()')
    tests.append('        assert fm.get_status("nonexistent") == "99"')
    tests.append('')
    
    # Test Enums
    tests.append('')
    tests.append('class TestEnums:')
    tests.append('    """Test business domain enums."""')
    tests.append('')
    tests.append('    def test_status_code_values(self):')
    tests.append('        """Verify StatusCode enum values."""')
    tests.append('        assert StatusCode.ACTIVE.value == "A"')
    tests.append('        assert StatusCode.INACTIVE.value == "I"')
    tests.append('')
    tests.append('    def test_account_type_values(self):')
    tests.append('        """Verify AccountType enum values."""')
    tests.append('        assert AccountType.CHECKING.value == "CK"')
    tests.append('        assert AccountType.SAVINGS.value == "SV"')
    tests.append('')
    tests.append('    def test_transaction_type_values(self):')
    tests.append('        """Verify TransactionType enum values."""')
    tests.append('        assert TransactionType.DEPOSIT.value == "DEP"')
    tests.append('        assert TransactionType.WITHDRAWAL.value == "WDR"')
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
            enhance = data.get('enhance', False)
            
            if not cobol_code:
                self.send_error_response({'error': 'cobolCode is required'})
                return
            
            result = generate_python_code(cobol_code, enhance)
            self.send_json_response(result)
        
        except json.JSONDecodeError:
            self.send_error_response({'error': 'Invalid JSON'})
        except Exception as e:
            self.send_error_response({'error': str(e)})
    
    def do_GET(self):
        self.send_json_response({
            'name': 'COBOL AST Transpiler',
            'version': '4.4.0',
            'engine': 'Python AST Native',
            'architecture': 'Clean Architecture + Enterprise Patterns',
            'features': [
                'FileManager with context managers',
                'Business domain Enums (StatusCode, AccountType, etc.)',
                'Dataclasses for COBOL records',
                'Proper @property for 88-level conditions',
                'Boolean flags (not Y/N strings)',
                'Decimal for all monetary values',
                'Comprehensive pytest suite'
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
