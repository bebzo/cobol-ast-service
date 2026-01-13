"""UltimateBankingSystem - Clean Architecture Python Code with Supabase Backend
Auto-transpiled from COBOL [AST Transpiler v5.7.15-SUPABASE]

Architecture:
- SupabaseIndexedFileManager for VSAM INDEXED file simulation
- Business domain Enums (StatusCode, AccountType, etc.)
- Dataclasses for COBOL records
- Proper @property for 88-level conditions
- Boolean flags (not Y/N strings)
- Decimal for all monetary values
- CobolRuntime ACTIVELY USED for all financial calculations

Fixes Applied (v5.7.15-SUPABASE):
- CobolRuntime now used in all COMPUTE statements
- ROUND_HALF_EVEN (banker's rounding) enforced
- eof_flag correctly uses boolean True/False
- float comparisons replaced with Decimal
- OCCURS tables implemented as proper lists
- FileManager replaced with SupabaseIndexedFileManager
- VSAM operations (READ KEY IS, REWRITE, DELETE) fully supported
"""
from __future__ import annotations
import os
import json
import logging
from decimal import Decimal, ROUND_HALF_EVEN, ROUND_HALF_UP, ROUND_DOWN, ROUND_UP
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, ClassVar
from datetime import datetime, date
from enum import Enum, auto
from contextlib import contextmanager

# Supabase client
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = Any


# ============================================================================
# COBOL RUNTIME - Financial Precision Engine
# ============================================================================

class CobolRuntime:
    """COBOL-compatible runtime operations for financial precision.
    
    Provides:
    - COBOL-style rounding (ROUND_HALF_EVEN for banker's rounding)
    - Decimal arithmetic with proper precision
    - COBOL COMPUTE emulation
    - Array/table access with 1-based indexing
    """
    
    # COBOL uses banker's rounding (ROUND_HALF_EVEN) by default
    DEFAULT_ROUNDING = ROUND_HALF_EVEN
    
    @staticmethod
    def compute_rounded(value: Decimal, decimal_places: int = 2, 
                        rounding: str = None) -> Decimal:
        """COBOL COMPUTE ... ROUNDED emulation.
        
        Args:
            value: The computed value
            decimal_places: Number of decimal places (from PIC V99 etc.)
            rounding: Rounding mode (default: banker's rounding)
        
        Returns:
            Properly rounded Decimal value
        """
        if rounding is None:
            rounding = CobolRuntime.DEFAULT_ROUNDING
        quantizer = Decimal(10) ** -decimal_places
        if isinstance(value, (int, float)):
            value = Decimal(str(value))
        return value.quantize(quantizer, rounding=rounding)
    
    @staticmethod
    def cobol_round(value: Decimal, pic_spec: str = "V99") -> Decimal:
        """Round according to COBOL PIC specification.
        
        Args:
            value: Value to round
            pic_spec: COBOL PIC like V99, V9(4), etc.
        
        Returns:
            Rounded Decimal
        """
        import re
        match = re.search(r"V9\((\d+)\)|V(9+)", pic_spec.upper())
        if match:
            if match.group(1):
                places = int(match.group(1))
            else:
                places = len(match.group(2))
        else:
            places = 2  # Default
        return CobolRuntime.compute_rounded(value, places)
    
    @staticmethod
    def array_access(array: list, index: Any, default: Any = None) -> Any:
        """COBOL 1-based array access with bounds checking.
        
        COBOL arrays are 1-indexed, Python are 0-indexed.
        """
        try:
            idx = int(index) - 1  # Convert to 0-based
            if 0 <= idx < len(array):
                return array[idx]
            return default
        except (ValueError, TypeError):
            return default
    
    @staticmethod
    def array_set(array: list, index: Any, value: Any) -> bool:
        """COBOL 1-based array assignment with bounds checking."""
        try:
            idx = int(index) - 1
            if 0 <= idx < len(array):
                array[idx] = value
                return True
            return False
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def safe_divide(dividend: Decimal, divisor: Decimal, 
                    on_zero: Decimal = Decimal("0")) -> Decimal:
        """Safe division with ON SIZE ERROR handling."""
        if divisor == 0:
            return on_zero
        return dividend / divisor
    
    @staticmethod
    def cobol_add(target: Decimal, *values: Decimal, 
                  rounded: bool = False, places: int = 2) -> Decimal:
        """COBOL ADD statement emulation."""
        result = target + sum(values)
        if rounded:
            result = CobolRuntime.compute_rounded(result, places)
        return result
    
    @staticmethod
    def cobol_subtract(target: Decimal, *values: Decimal,
                       rounded: bool = False, places: int = 2) -> Decimal:
        """COBOL SUBTRACT statement emulation."""
        result = target - sum(values)
        if rounded:
            result = CobolRuntime.compute_rounded(result, places)
        return result
    
    @staticmethod
    def cobol_multiply(val1: Decimal, val2: Decimal,
                       rounded: bool = True, places: int = 2) -> Decimal:
        """COBOL MULTIPLY statement emulation."""
        result = val1 * val2
        if rounded:
            result = CobolRuntime.compute_rounded(result, places)
        return result


# Alias for convenience
RT = CobolRuntime


# ============================================================================
# FILE STATUS CODES - COBOL Compatible
# ============================================================================

class FileStatus:
    """COBOL FILE STATUS codes"""
    SUCCESS = '00'
    EOF = '10'
    DUPLICATE_KEY = '22'
    NOT_FOUND = '23'
    INVALID_KEY = '24'
    PERMANENT_ERROR = '30'
    FILE_NOT_FOUND = '35'
    PERMISSION_DENIED = '37'
    LOGIC_ERROR = '41'
    ALREADY_OPEN = '42'
    NOT_OPEN = '46'
    OTHER_ERROR = '99'


# ============================================================================
# RECORD STRUCTURES - COBOL Data Division
# ============================================================================

@dataclass
class CustomerMasterRecord:
    """COBOL CUSTOMER-MASTER-FILE record structure
    
    Maps to Supabase table: customer_master
    """
    customer_id: str = ''
    account_type: str = ''
    account_balance: Decimal = field(default_factory=lambda: Decimal('0'))
    available_balance: Decimal = field(default_factory=lambda: Decimal('0'))
    account_locked: str = 'N'
    interest_rate: Decimal = field(default_factory=lambda: Decimal('0'))
    last_interest_date: str = ''
    last_tax_report: str = ''
    risk_level: str = 'L'
    risk_score: Decimal = field(default_factory=lambda: Decimal('0'))
    withholding_rate: Decimal = field(default_factory=lambda: Decimal('0'))
    created_at: str = ''
    updated_at: str = ''
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to Supabase-compatible dict"""
        return {
            'customer_id': self.customer_id,
            'account_type': self.account_type,
            'account_balance': float(self.account_balance),
            'available_balance': float(self.available_balance),
            'account_locked': self.account_locked,
            'interest_rate': float(self.interest_rate),
            'last_interest_date': self.last_interest_date,
            'last_tax_report': self.last_tax_report,
            'risk_level': self.risk_level,
            'risk_score': float(self.risk_score),
            'withholding_rate': float(self.withholding_rate),
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CustomerMasterRecord':
        """Create from Supabase row"""
        return cls(
            customer_id=data.get('customer_id', ''),
            account_type=data.get('account_type', ''),
            account_balance=Decimal(str(data.get('account_balance', 0))),
            available_balance=Decimal(str(data.get('available_balance', 0))),
            account_locked=data.get('account_locked', 'N'),
            interest_rate=Decimal(str(data.get('interest_rate', 0))),
            last_interest_date=data.get('last_interest_date', ''),
            last_tax_report=data.get('last_tax_report', ''),
            risk_level=data.get('risk_level', 'L'),
            risk_score=Decimal(str(data.get('risk_score', 0))),
            withholding_rate=Decimal(str(data.get('withholding_rate', 0))),
            created_at=data.get('created_at', ''),
            updated_at=data.get('updated_at', ''),
        )


@dataclass
class TransactionRecord:
    """COBOL TRANSACTION-FILE record structure
    
    Maps to Supabase table: transactions
    """
    trans_id: str = ''
    trans_type: str = ''
    trans_amount: Decimal = field(default_factory=lambda: Decimal('0'))
    trans_status: str = ''
    trans_reference: str = ''
    trans_description: str = ''
    source_account: str = ''
    target_account: str = ''
    trans_channel: str = ''
    trans_ip: str = ''
    trans_date: str = ''
    trans_time: str = ''
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'trans_id': self.trans_id,
            'trans_type': self.trans_type,
            'trans_amount': float(self.trans_amount),
            'trans_status': self.trans_status,
            'trans_reference': self.trans_reference,
            'trans_description': self.trans_description,
            'source_account': self.source_account,
            'target_account': self.target_account,
            'trans_channel': self.trans_channel,
            'trans_ip': self.trans_ip,
            'trans_date': self.trans_date,
            'trans_time': self.trans_time,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TransactionRecord':
        return cls(
            trans_id=data.get('trans_id', ''),
            trans_type=data.get('trans_type', ''),
            trans_amount=Decimal(str(data.get('trans_amount', 0))),
            trans_status=data.get('trans_status', ''),
            trans_reference=data.get('trans_reference', ''),
            trans_description=data.get('trans_description', ''),
            source_account=data.get('source_account', ''),
            target_account=data.get('target_account', ''),
            trans_channel=data.get('trans_channel', ''),
            trans_ip=data.get('trans_ip', ''),
            trans_date=data.get('trans_date', ''),
            trans_time=data.get('trans_time', ''),
        )


@dataclass
class AuditRecord:
    """COBOL AUDIT-TRAIL-FILE record structure
    
    Maps to Supabase table: audit_trail
    """
    audit_id: int = 0
    audit_date: str = ''
    audit_time: str = ''
    user_id: str = ''
    action: str = ''
    details: str = ''
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'audit_date': self.audit_date,
            'audit_time': self.audit_time,
            'user_id': self.user_id,
            'action': self.action,
            'details': self.details,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AuditRecord':
        return cls(
            audit_id=data.get('audit_id', 0),
            audit_date=data.get('audit_date', ''),
            audit_time=data.get('audit_time', ''),
            user_id=data.get('user_id', ''),
            action=data.get('action', ''),
            details=data.get('details', ''),
        )


# ============================================================================
# SUPABASE INDEXED FILE MANAGER - VSAM Simulation
# ============================================================================

class SupabaseIndexedFileManager:
    """Simulates COBOL INDEXED files using Supabase PostgreSQL.
    
    Implements COBOL file operations:
    - OPEN INPUT/OUTPUT/I-O/EXTEND
    - READ KEY IS (random access)
    - READ NEXT (sequential)
    - START KEY >= / > / = (positioning)
    - WRITE (insert)
    - REWRITE (update)
    - DELETE (remove)
    - CLOSE
    
    Each "file" maps to a Supabase table.
    """
    
    # Mapping: COBOL file name -> Supabase table name
    FILE_TABLE_MAP = {
        'customer_master_file': 'customer_master',
        'customer_master': 'customer_master',
        'transaction_file': 'transactions',
        'transactions': 'transactions',
        'audit_trail_file': 'audit_trail',
        'audit_trail': 'audit_trail',
        'temporary_work_file': 'temp_work',
        'report_file': 'reports',
    }
    
    # Mapping: Table -> Primary key column
    TABLE_KEY_MAP = {
        'customer_master': 'customer_id',
        'transactions': 'trans_id',
        'audit_trail': 'audit_id',
        'temp_work': 'id',
        'reports': 'id',
    }
    
    # Mapping: Table -> Record class
    TABLE_RECORD_MAP = {
        'customer_master': CustomerMasterRecord,
        'transactions': TransactionRecord,
        'audit_trail': AuditRecord,
    }
    
    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        """Initialize with Supabase credentials.
        
        Args:
            supabase_url: Supabase project URL (or env SUPABASE_URL)
            supabase_key: Supabase anon/service key (or env SUPABASE_KEY)
        """
        self.logger = logging.getLogger(__name__)
        
        # Get credentials from params or environment
        self.supabase_url = supabase_url or os.getenv('SUPABASE_URL')
        self.supabase_key = supabase_key or os.getenv('SUPABASE_KEY')
        
        # Initialize client
        self.client: Optional[Client] = None
        self._status: Dict[str, str] = {}
        self._mode: Dict[str, str] = {}
        self._cursor: Dict[str, List[Dict]] = {}
        self._cursor_pos: Dict[str, int] = {}
        self._current_record: Dict[str, Any] = {}
        
        # Fallback mode for local testing without Supabase
        self._local_mode = False
        self._local_data: Dict[str, List[Dict]] = {}
        
        if SUPABASE_AVAILABLE and self.supabase_url and self.supabase_key:
            try:
                self.client = create_client(self.supabase_url, self.supabase_key)
                self.logger.info("Supabase client initialized successfully")
            except Exception as e:
                self.logger.warning(f"Supabase connection failed, using local mode: {e}")
                self._local_mode = True
        else:
            self.logger.info("Supabase not configured, using local fallback mode")
            self._local_mode = True
    
    def _get_table(self, file_name: str) -> str:
        """Get Supabase table name for COBOL file"""
        return self.FILE_TABLE_MAP.get(file_name, file_name)
    
    def _get_key_column(self, table: str) -> str:
        """Get primary key column for table"""
        return self.TABLE_KEY_MAP.get(table, 'id')
    
    # ========== COBOL FILE OPERATIONS ==========
    
    def open_file(self, file_name: str, path: str = None, mode: str = 'I-O') -> bool:
        """COBOL OPEN statement.
        
        Args:
            file_name: COBOL file name
            path: Ignored (kept for compatibility)
            mode: 'INPUT', 'OUTPUT', 'I-O', 'EXTEND', 'r', 'w', 'r+', 'a'
        """
        # Normalize mode
        mode_map = {'r': 'INPUT', 'w': 'OUTPUT', 'r+': 'I-O', 'a': 'EXTEND'}
        mode = mode_map.get(mode, mode)
        
        table = self._get_table(file_name)
        
        if self._local_mode:
            # Local fallback mode
            if table not in self._local_data:
                self._local_data[table] = []
            self._status[file_name] = FileStatus.SUCCESS
            self._mode[file_name] = mode
            self._cursor[file_name] = []
            self._cursor_pos[file_name] = 0
            return True
        
        if not self.client:
            self._status[file_name] = FileStatus.FILE_NOT_FOUND
            self.logger.error(f"Supabase not connected for {file_name}")
            return False
        
        try:
            result = self.client.table(table).select('*', count='exact').limit(0).execute()
            self._status[file_name] = FileStatus.SUCCESS
            self._mode[file_name] = mode
            self._cursor[file_name] = []
            self._cursor_pos[file_name] = 0
            self.logger.debug(f"Opened {file_name} ({table}) in {mode} mode")
            return True
        except Exception as e:
            self._status[file_name] = FileStatus.FILE_NOT_FOUND
            self.logger.error(f"Failed to open {file_name}: {e}")
            return False
    
    def close_file(self, file_name: str) -> bool:
        """COBOL CLOSE statement."""
        if file_name in self._mode:
            del self._mode[file_name]
        if file_name in self._cursor:
            del self._cursor[file_name]
        if file_name in self._cursor_pos:
            del self._cursor_pos[file_name]
        self._status[file_name] = FileStatus.SUCCESS
        return True
    
    def read_key(self, file_name: str, key_value: str) -> Optional[Any]:
        """COBOL READ ... KEY IS ... statement.
        
        Random access read by primary key.
        """
        if file_name not in self._mode:
            self._status[file_name] = FileStatus.NOT_OPEN
            return None
        
        table = self._get_table(file_name)
        key_col = self._get_key_column(table)
        
        if self._local_mode:
            # Local fallback
            for row in self._local_data.get(table, []):
                if row.get(key_col) == key_value:
                    self._status[file_name] = FileStatus.SUCCESS
                    self._current_record[file_name] = row
                    record_class = self.TABLE_RECORD_MAP.get(table)
                    if record_class:
                        return record_class.from_dict(row)
                    return row
            self._status[file_name] = FileStatus.NOT_FOUND
            return None
        
        try:
            result = self.client.table(table).select('*').eq(key_col, key_value).execute()
            
            if result.data and len(result.data) > 0:
                self._status[file_name] = FileStatus.SUCCESS
                row = result.data[0]
                self._current_record[file_name] = row
                
                record_class = self.TABLE_RECORD_MAP.get(table)
                if record_class:
                    return record_class.from_dict(row)
                return row
            else:
                self._status[file_name] = FileStatus.NOT_FOUND
                return None
                
        except Exception as e:
            self._status[file_name] = FileStatus.OTHER_ERROR
            self.logger.error(f"Read error on {file_name}: {e}")
            return None
    
    def read_record(self, file_name: str) -> Optional[Any]:
        """Legacy compatibility: Read next record sequentially.
        
        If no cursor is set, starts from beginning.
        """
        if file_name not in self._cursor or not self._cursor[file_name]:
            # Initialize cursor with all records
            self.start_key(file_name, '', op='>=')
        return self.read_next(file_name)
    
    def start_key(self, file_name: str, key_value: str, op: str = '>=') -> bool:
        """COBOL START ... KEY >= ... statement."""
        if file_name not in self._mode:
            self._status[file_name] = FileStatus.NOT_OPEN
            return False
        
        table = self._get_table(file_name)
        key_col = self._get_key_column(table)
        
        if self._local_mode:
            # Local fallback
            data = self._local_data.get(table, [])
            if op == '>=':
                filtered = [r for r in data if r.get(key_col, '') >= key_value]
            elif op == '>':
                filtered = [r for r in data if r.get(key_col, '') > key_value]
            else:
                filtered = [r for r in data if r.get(key_col, '') == key_value]
            
            self._cursor[file_name] = sorted(filtered, key=lambda x: x.get(key_col, ''))
            self._cursor_pos[file_name] = 0
            
            if self._cursor[file_name]:
                self._status[file_name] = FileStatus.SUCCESS
                return True
            else:
                self._status[file_name] = FileStatus.NOT_FOUND
                return False
        
        try:
            query = self.client.table(table).select('*')
            
            if op == '>=' and key_value:
                query = query.gte(key_col, key_value)
            elif op == '>' and key_value:
                query = query.gt(key_col, key_value)
            elif op == '=' and key_value:
                query = query.eq(key_col, key_value)
            
            result = query.order(key_col).execute()
            
            if result.data and len(result.data) > 0:
                self._cursor[file_name] = result.data
                self._cursor_pos[file_name] = 0
                self._status[file_name] = FileStatus.SUCCESS
                return True
            else:
                self._cursor[file_name] = []
                self._cursor_pos[file_name] = 0
                self._status[file_name] = FileStatus.NOT_FOUND
                return False
                
        except Exception as e:
            self._status[file_name] = FileStatus.OTHER_ERROR
            self.logger.error(f"Start error on {file_name}: {e}")
            return False
    
    def read_next(self, file_name: str) -> Optional[Any]:
        """COBOL READ ... NEXT statement."""
        if file_name not in self._mode:
            self._status[file_name] = FileStatus.NOT_OPEN
            return None
        
        cursor = self._cursor.get(file_name, [])
        pos = self._cursor_pos.get(file_name, 0)
        
        if pos >= len(cursor):
            self._status[file_name] = FileStatus.EOF
            return None
        
        row = cursor[pos]
        self._cursor_pos[file_name] = pos + 1
        self._status[file_name] = FileStatus.SUCCESS
        self._current_record[file_name] = row
        
        table = self._get_table(file_name)
        record_class = self.TABLE_RECORD_MAP.get(table)
        if record_class:
            return record_class.from_dict(row)
        return row
    
    def write_record(self, file_name: str, record: Any) -> bool:
        """COBOL WRITE statement."""
        if file_name not in self._mode:
            self._status[file_name] = FileStatus.NOT_OPEN
            return False
        
        mode = self._mode[file_name]
        if mode == 'INPUT':
            self._status[file_name] = FileStatus.LOGIC_ERROR
            return False
        
        table = self._get_table(file_name)
        
        # Handle string records (audit trail compatibility)
        if isinstance(record, str):
            data = {'details': record, 'audit_date': datetime.now().strftime('%Y%m%d'),
                    'audit_time': datetime.now().strftime('%H%M%S')}
        elif hasattr(record, 'to_dict'):
            data = record.to_dict()
        elif hasattr(record, '__dict__'):
            data = record.__dict__
        else:
            data = dict(record) if isinstance(record, dict) else {'details': str(record)}
        
        if self._local_mode:
            if table not in self._local_data:
                self._local_data[table] = []
            self._local_data[table].append(data)
            self._status[file_name] = FileStatus.SUCCESS
            return True
        
        try:
            result = self.client.table(table).insert(data).execute()
            self._status[file_name] = FileStatus.SUCCESS
            return True
        except Exception as e:
            if 'duplicate' in str(e).lower() or 'unique' in str(e).lower():
                self._status[file_name] = FileStatus.DUPLICATE_KEY
            else:
                self._status[file_name] = FileStatus.OTHER_ERROR
            self.logger.error(f"Write error on {file_name}: {e}")
            return False
    
    def rewrite_record(self, file_name: str, record: Any = None) -> bool:
        """COBOL REWRITE statement."""
        if file_name not in self._mode:
            self._status[file_name] = FileStatus.NOT_OPEN
            return False
        
        if self._mode[file_name] not in ('I-O', 'OUTPUT'):
            self._status[file_name] = FileStatus.LOGIC_ERROR
            return False
        
        table = self._get_table(file_name)
        key_col = self._get_key_column(table)
        
        current = self._current_record.get(file_name)
        if not current:
            self._status[file_name] = FileStatus.LOGIC_ERROR
            return False
        
        key_value = current.get(key_col)
        
        if record:
            if hasattr(record, 'to_dict'):
                data = record.to_dict()
            elif hasattr(record, '__dict__'):
                data = record.__dict__
            else:
                data = dict(record)
        else:
            data = current
        
        if self._local_mode:
            for i, row in enumerate(self._local_data.get(table, [])):
                if row.get(key_col) == key_value:
                    self._local_data[table][i] = data
                    self._status[file_name] = FileStatus.SUCCESS
                    return True
            self._status[file_name] = FileStatus.NOT_FOUND
            return False
        
        try:
            result = self.client.table(table).update(data).eq(key_col, key_value).execute()
            self._status[file_name] = FileStatus.SUCCESS
            return True
        except Exception as e:
            self._status[file_name] = FileStatus.OTHER_ERROR
            self.logger.error(f"Rewrite error on {file_name}: {e}")
            return False
    
    def delete_record(self, file_name: str) -> bool:
        """COBOL DELETE statement."""
        if file_name not in self._mode:
            self._status[file_name] = FileStatus.NOT_OPEN
            return False
        
        if self._mode[file_name] not in ('I-O', 'OUTPUT'):
            self._status[file_name] = FileStatus.LOGIC_ERROR
            return False
        
        table = self._get_table(file_name)
        key_col = self._get_key_column(table)
        
        current = self._current_record.get(file_name)
        if not current:
            self._status[file_name] = FileStatus.LOGIC_ERROR
            return False
        
        key_value = current.get(key_col)
        
        if self._local_mode:
            original_len = len(self._local_data.get(table, []))
            self._local_data[table] = [r for r in self._local_data.get(table, []) 
                                        if r.get(key_col) != key_value]
            if len(self._local_data[table]) < original_len:
                self._status[file_name] = FileStatus.SUCCESS
                return True
            self._status[file_name] = FileStatus.NOT_FOUND
            return False
        
        try:
            result = self.client.table(table).delete().eq(key_col, key_value).execute()
            self._status[file_name] = FileStatus.SUCCESS
            return True
        except Exception as e:
            self._status[file_name] = FileStatus.OTHER_ERROR
            self.logger.error(f"Delete error on {file_name}: {e}")
            return False
    
    # ========== STATUS HELPERS ==========
    
    def get_status(self, file_name: str) -> str:
        """Get FILE STATUS code for file."""
        return self._status.get(file_name, FileStatus.OTHER_ERROR)
    
    def is_ok(self, file_name: str) -> bool:
        """Check if last operation was successful."""
        return self._status.get(file_name) == FileStatus.SUCCESS
    
    def is_eof(self, file_name: str) -> bool:
        """Check if end of file reached."""
        return self._status.get(file_name) == FileStatus.EOF
    
    def is_not_found(self, file_name: str) -> bool:
        """Check if record not found."""
        return self._status.get(file_name) == FileStatus.NOT_FOUND
    
    def close_all(self) -> None:
        """Close all open files."""
        for file_name in list(self._mode.keys()):
            self.close_file(file_name)


# ============================================================================
# BUSINESS LAYER - Calculations and Validations
# ============================================================================

class DataLayer:
    """Data access layer - handles file I/O and record structures."""
    
    def __init__(self, file_manager: SupabaseIndexedFileManager):
        self.file_manager = file_manager
        self.current_record = None
    
    def read_next(self, file_name: str) -> Optional[Any]:
        """Read next record from file."""
        return self.file_manager.read_next(file_name)
    
    def read_key(self, file_name: str, key: str) -> Optional[Any]:
        """Read record by key."""
        return self.file_manager.read_key(file_name, key)
    
    def write_record(self, file_name: str, record: Any) -> bool:
        """Write record to file."""
        return self.file_manager.write_record(file_name, record)
    
    def is_eof(self, file_name: str) -> bool:
        """Check if end of file reached."""
        return self.file_manager.is_eof(file_name)


class BusinessLayer:
    """Business logic layer - calculations and validations."""
    
    def __init__(self, runtime: CobolRuntime = None):
        self.runtime = runtime or CobolRuntime()
    
    def validate_amount(self, amount: Decimal, min_val: Decimal = Decimal("0"),
                        max_val: Decimal = None) -> bool:
        """Validate monetary amount."""
        if amount < min_val:
            return False
        if max_val is not None and amount > max_val:
            return False
        return True
    
    def calculate_interest(self, principal: Decimal, rate: Decimal, 
                           periods: int = 1) -> Decimal:
        """Calculate simple interest with COBOL rounding."""
        interest = principal * rate * Decimal(periods)
        return RT.compute_rounded(interest)


class PresentationLayer:
    """Presentation layer - formatting and display."""
    
    @staticmethod
    def format_currency(amount: Decimal, symbol: str = "$") -> str:
        """Format amount as currency."""
        return f"{symbol}{amount:,.2f}"
    
    @staticmethod
    def format_date_cobol(dt: datetime, fmt: str = "%Y%m%d") -> str:
        """Format date in COBOL style (YYYYMMDD)."""
        return dt.strftime(fmt)


# ============================================================================
# ENUMS - Business Domain Types
# ============================================================================

class StatusCode(Enum):
    """Standard status codes"""
    ACTIVE = 'A'
    INACTIVE = 'I'
    CLOSED = 'C'
    PENDING = 'P'
    SUSPENDED = 'S'
    DELETED = 'D'


class AccountType(Enum):
    """Account type codes"""
    CHECKING = 'CK'
    SAVINGS = 'SV'
    MONEY_MARKET = 'MM'
    CERTIFICATE_OF_DEPOSIT = 'CD'
    CREDIT_CARD = 'CC'
    LOAN = 'LN'


class TransactionType(Enum):
    """Transaction type codes"""
    DEPOSIT = 'DEP'
    WITHDRAWAL = 'WDR'
    TRANSFER = 'TRF'
    PAYMENT = 'PAY'
    FEE = 'FEE'
    INTEREST = 'INT'
    ADJUSTMENT = 'ADJ'


class RiskLevel(Enum):
    """Risk rating levels"""
    LOW = 'L'
    MEDIUM = 'M'
    HIGH = 'H'
    CRITICAL = 'C'


# ============================================================================
# WORKING STORAGE - Configuration and Tables
# ============================================================================

@dataclass
class RateEntry:
    """COBOL WS-RATE-ENTRY structure for OCCURS table"""
    account_code: str = ''
    base_rate: Decimal = field(default_factory=lambda: Decimal('0'))
    premium_rate: Decimal = field(default_factory=lambda: Decimal('0'))


@dataclass
class FeeEntry:
    """COBOL WS-FEE-ENTRY structure for OCCURS table"""
    fee_type: str = ''
    fee_percent: Decimal = field(default_factory=lambda: Decimal('0'))
    min_fee: Decimal = field(default_factory=lambda: Decimal('0'))
    max_fee: Decimal = field(default_factory=lambda: Decimal('0'))


@dataclass
class UltimateBankingSystemConfig:
    """Configuration settings for rates and fees"""
    daily_rate: Decimal = Decimal('0.00000000')
    annual_rate: Decimal = Decimal('0.00000')
    effective_rate: Decimal = Decimal('0.00000000')
    tax_rate: Decimal = Decimal('0.196')
    
    # OCCURS 5 TIMES - Rate table aligned with COBOL source
    rate_table: List[RateEntry] = field(default_factory=lambda: [
        RateEntry('CK', Decimal('0.002500'), Decimal('0.000000')),  # Checking 0.25%
        RateEntry('SV', Decimal('0.015000'), Decimal('0.000000')),  # Savings 1.50%
        RateEntry('MM', Decimal('0.020000'), Decimal('0.000000')),  # Money Market 2.00%
        RateEntry('CD', Decimal('0.030000'), Decimal('0.000000')),  # Certificate 3.00%
        RateEntry('IR', Decimal('0.025000'), Decimal('0.000000')),  # IRA 2.50%
    ])
    
    # OCCURS 3 TIMES - Fee table aligned with COBOL source (lines 274-287)
    fee_table: List[FeeEntry] = field(default_factory=lambda: [
        FeeEntry('WDR', Decimal('0.010'), Decimal('5.00'), Decimal('500000.00')),   # Withdrawal 1% min 5€
        FeeEntry('TRF', Decimal('0.015'), Decimal('10.00'), Decimal('100000.00')),  # Transfer 1.5% min 10€
        FeeEntry('PAY', Decimal('0.005'), Decimal('2.50'), Decimal('250000.00')),   # Payment 0.5% min 2.50€
    ])


# ============================================================================
# MAIN PROCESSOR - UltimateBankingSystem
# ============================================================================

class UltimateBankingSystem:
    """Main processor for ULTIMATE-BANKING-SYSTEM with Supabase Backend

    Attributes:
        logger: Logging instance
        config: Configuration settings
        file_manager: SupabaseIndexedFileManager for VSAM I/O
        rt: CobolRuntime for financial calculations
        
    Methods:
        run(): Main entry point
    """
    VERSION: ClassVar[str] = '5.7.15-SUPABASE'
    SPACES: ClassVar[str] = ' ' * 256
    LOW_VALUES: ClassVar[str] = '\x00' * 256
    HIGH_VALUES: ClassVar[str] = '\xff' * 256

    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        """Initialize the banking system.
        
        Args:
            supabase_url: Supabase project URL (or env SUPABASE_URL)
            supabase_key: Supabase key (or env SUPABASE_KEY)
        """
        self.logger = logging.getLogger(__name__)
        
        # INTEGRATION: Use SupabaseIndexedFileManager instead of local FileManager
        self.file_manager = SupabaseIndexedFileManager(supabase_url, supabase_key)
        
        self.rt = CobolRuntime()
        self._strict_mode = False
        self.config = UltimateBankingSystemConfig()
        
        # Control fields
        self.program_status: str = ''
        self.transaction_count: Decimal = Decimal('0')
        self.total_amount: Decimal = Decimal('0.00')
        self.success_count: Decimal = Decimal('0')
        self.failure_count: Decimal = Decimal('0')
        self.current_date: str = ''
        self.current_time: str = ''
        self.batch_number: Decimal = Decimal('0')
        self.job_id: str = ''
        
        # File statuses
        self.cm_status: str = ''
        self.trans_status: str = ''
        self.audit_status: str = ''
        
        # Calculation fields
        self.new_balance: Decimal = Decimal('0.00')
        self.interest_amount: Decimal = Decimal('0.00')
        self.fee_amount: Decimal = Decimal('0.00')
        self.tax_amount: Decimal = Decimal('0.00')
        self.net_amount: Decimal = Decimal('0.00')
        self.foreign_amount: Decimal = Decimal('0.00')
        self.daily_limit: Decimal = Decimal('500000')
        self.monthly_limit: Decimal = Decimal('2000000')
        self.daily_total: Decimal = Decimal('0.00')
        self.monthly_total: Decimal = Decimal('0.00')
        self.compound_factor: Decimal = Decimal('0.000000000')
        self.present_value: Decimal = Decimal('0.00')
        self.future_value: Decimal = Decimal('0.00')
        self.net_interest: Decimal = Decimal('0.00')
        self.total_debit: Decimal = Decimal('0.00')
        self.principal: Decimal = Decimal('0.00')
        self.days_accrued: Decimal = Decimal('0')
        self.days_in_year: Decimal = Decimal('365')
        self.compounding_periods: Decimal = Decimal('0')
        self.annual_rate: Decimal = Decimal('0')
        self.daily_rate: Decimal = Decimal('0')
        self.base_rate: Decimal = Decimal('0')
        self.premium_rate: Decimal = Decimal('0')
        self.tax_rate: Decimal = Decimal('0.196')
        
        # Security controls
        self.encryption_key: str = ''
        self.session_token: str = ''
        self.auth_level: Decimal = Decimal('0')
        self.ip_whitelist: List[str] = [''] * 50
        self.ip_whitelist_count: Decimal = Decimal('10')
        self.fraud_score: Decimal = Decimal('0')
        self.risk_threshold: Decimal = Decimal('750')
        self.index: Decimal = Decimal('0')
        
        # Report data
        self.report_date: str = ''
        self.report_time: str = ''
        self.report_title: str = ''
        self.report_header: str = ''
        self.report_detail: str = ''
        self.report_total: str = ''
        self.page_count: Decimal = Decimal('1')
        self.line_count: Decimal = Decimal('0')
        self.lines_per_page: Decimal = Decimal('55')
        
        # Flags - Using proper booleans
        self.eof_flag: bool = False
        self.validation_flag: str = ''
        self.security_flag: str = ''
        self.audit_flag: bool = True
        self.debug_flag: bool = False
        
        # Error handling
        self.error_code: str = ''
        self.error_message: str = ''
        self.error_severity: str = ''
        self.error_program: str = ''
        self.error_line: Decimal = Decimal('0')
        self.error_stack_ptr: Decimal = Decimal('0')
        
        # Performance metrics
        self.start_time: Decimal = Decimal('0')
        self.end_time: Decimal = Decimal('0')
        self.elapsed_time: Decimal = Decimal('0')
        self.records_processed: Decimal = Decimal('0')
        self.transactions_per_second: Decimal = Decimal('0.00')
        
        # Constants
        self.max_retries: Decimal = Decimal('3')
        self.min_balance: Decimal = Decimal('10000')
        self.max_single_transaction: Decimal = Decimal('100000')
        self.fraud_threshold: Decimal = Decimal('85')
        
        # Display fields
        self.display_amount: str = ''
        self.display_date: str = ''
        self.display_time: str = ''
        self.display_balance: str = ''
        self.display_count: str = ''
        
        # Customer/Account fields - Now uses CustomerMasterRecord
        self.cm_customer_id: str = ''
        self.cm_account_type: str = ''
        self.cm_account_balance: Decimal = Decimal('0')
        self.cm_available_balance: Decimal = Decimal('0')
        self.cm_account_locked: str = 'N'
        self.cm_interest_rate: Decimal = Decimal('0')
        self.cm_last_interest_date: str = ''
        self.cm_last_tax_report: str = ''
        self.cm_risk_level: str = 'L'
        self.cm_risk_score: Decimal = Decimal('0')
        self.cm_withholding_rate: Decimal = Decimal('0')
        
        # Current customer record (for REWRITE operations)
        self._current_customer: Optional[CustomerMasterRecord] = None
        
        # Transaction fields
        self.trans_type: str = ''
        self.trans_amount: Decimal = Decimal('0')
        self.trans_status: str = ''
        self.trans_reference: str = ''
        self.trans_description: str = ''
        self.trans_source_account: str = ''
        self.trans_channel: str = ''
        self.trans_ip_address: str = ''
        self.trans_key: str = ''
        
        # Linkage section fields
        self.ls_user_id: str = ''
        self.ls_session_id: str = ''
        self.ls_command: str = ''
        self.ls_from_account: str = ''
        self.ls_to_account: str = ''
        self.ls_amount: Decimal = Decimal('0')
        self.ls_error_msg: str = ''
        self.ls_return_code: Decimal = Decimal('0')
        
        # Misc fields
        self.audit_record: str = ' ' * 256
        self.report_line: str = ''
        self.customer_record: Optional[CustomerMasterRecord] = None
        self.rate_index: Decimal = Decimal('0')
        self.suspicious_activity: bool = False

    # ========== HELPER: Load/Store CustomerMasterRecord ==========
    
    def _load_customer_fields(self, record: CustomerMasterRecord) -> None:
        """Load CustomerMasterRecord into working storage fields."""
        self.cm_customer_id = record.customer_id
        self.cm_account_type = record.account_type
        self.cm_account_balance = record.account_balance
        self.cm_available_balance = record.available_balance
        self.cm_account_locked = record.account_locked
        self.cm_interest_rate = record.interest_rate
        self.cm_last_interest_date = record.last_interest_date
        self.cm_last_tax_report = record.last_tax_report
        self.cm_risk_level = record.risk_level
        self.cm_risk_score = record.risk_score
        self.cm_withholding_rate = record.withholding_rate
        self._current_customer = record
    
    def _store_customer_fields(self) -> CustomerMasterRecord:
        """Store working storage fields back to CustomerMasterRecord."""
        return CustomerMasterRecord(
            customer_id=self.cm_customer_id,
            account_type=self.cm_account_type,
            account_balance=self.cm_account_balance,
            available_balance=self.cm_available_balance,
            account_locked=self.cm_account_locked,
            interest_rate=self.cm_interest_rate,
            last_interest_date=self.cm_last_interest_date,
            last_tax_report=self.cm_last_tax_report,
            risk_level=self.cm_risk_level,
            risk_score=self.cm_risk_score,
            withholding_rate=self.cm_withholding_rate,
        )

    # ========== 88-LEVEL CONDITIONS ==========
    
    @property
    def program_ok(self) -> bool:
        """COBOL 88-level condition: PROGRAM-OK"""
        return self.program_status == '00'

    @program_ok.setter
    def program_ok(self, value: bool):
        if value:
            self.program_status = '00'

    @property
    def program_error(self) -> bool:
        """COBOL 88-level condition: PROGRAM-ERROR"""
        return self.program_status == '99'

    @program_error.setter
    def program_error(self, value: bool):
        if value:
            self.program_status = '99'

    @property
    def cm_success(self) -> bool:
        """COBOL 88-level condition: CM-SUCCESS"""
        return self.file_manager.is_ok('customer_master_file')

    @property
    def cm_eof(self) -> bool:
        """COBOL 88-level condition: CM-EOF"""
        return self.file_manager.is_eof('customer_master_file')

    @property
    def cm_not_found(self) -> bool:
        """COBOL 88-level condition: CM-NOT-FOUND"""
        return self.file_manager.is_not_found('customer_master_file')

    @property
    def end_of_file(self) -> bool:
        """COBOL 88-level condition: WS-END-OF-FILE"""
        return self.eof_flag == True

    @end_of_file.setter
    def end_of_file(self, value: bool):
        if value:
            self.eof_flag = True

    @property
    def not_end_of_file(self) -> bool:
        """COBOL 88-level condition: WS-NOT-END-OF-FILE"""
        return self.eof_flag == False

    @property
    def data_valid(self) -> bool:
        """COBOL 88-level condition: WS-DATA-VALID"""
        return self.validation_flag == 'Y'

    @data_valid.setter
    def data_valid(self, value: bool):
        if value:
            self.validation_flag = 'Y'

    @property
    def data_invalid(self) -> bool:
        """COBOL 88-level condition: WS-DATA-INVALID"""
        return self.validation_flag == 'N'

    @property
    def security_pass(self) -> bool:
        """COBOL 88-level condition: WS-SECURITY-PASS"""
        return self.security_flag == 'P'

    @security_pass.setter
    def security_pass(self, value: bool):
        if value:
            self.security_flag = 'P'

    @property
    def security_fail(self) -> bool:
        """COBOL 88-level condition: WS-SECURITY-FAIL"""
        return self.security_flag == 'F'

    @property
    def audit_enabled(self) -> bool:
        """COBOL 88-level condition: WS-AUDIT-ENABLED"""
        return self.audit_flag == True

    @property
    def auth_none(self) -> bool:
        return self.auth_level == Decimal('0')

    @property
    def auth_basic(self) -> bool:
        return self.auth_level == Decimal('1')

    @property
    def auth_advanced(self) -> bool:
        return self.auth_level == Decimal('2')

    @property
    def auth_admin(self) -> bool:
        return self.auth_level == Decimal('3')

    # ========== BUSINESS LOGIC PARAGRAPHS ==========

    def p_000_main(self) -> None:
        """Business logic from COBOL paragraph: 000-MAIN"""
        self.p_100_initialize()
        self.p_200_authenticate_user()
        if self.security_pass:
            self.p_300_process_command()
            self.p_400_calculate_interest()
            self.p_500_apply_fees_and_taxes()
            self.p_600_generate_reports()
            self.p_700_update_audit_trail()
        else:
            self.p_800_handle_security_failure()
        self.p_900_terminate()

    def p_100_initialize(self) -> None:
        """Business logic from COBOL paragraph: 100-INITIALIZE"""
        self.current_date = datetime.now().strftime('%Y%m%d%H%M%S00')[:14]
        self.current_time = datetime.now().strftime('%H%M%S00')
        self.job_id = datetime.now().strftime('%Y%m%d%H%M%S00')
        
        # INTEGRATION: Open files via Supabase
        self.file_manager.open_file('customer_master_file', mode='I-O')
        self.file_manager.open_file('transaction_file', mode='INPUT')
        self.file_manager.open_file('audit_trail_file', mode='OUTPUT')
        self.file_manager.open_file('temporary_work_file', mode='OUTPUT')
        
        if not self.cm_success:
            self.ls_error_msg = 'FILE OPEN FAILED'
            self.ls_return_code = Decimal('9001')
            self.p_900_terminate()
            return
            
        self.p_110_load_configuration()
        self.p_120_initialize_security()
        self.p_130_setup_reporting()

    def p_110_load_configuration(self) -> None:
        """Business logic from COBOL paragraph: 110-LOAD-CONFIGURATION"""
        for idx in range(1, 6):
            rate_entry = RT.array_access(self.config.rate_table, idx)
            if rate_entry:
                self.logger.debug(f'LOADED RATE: {rate_entry.account_code} {rate_entry.base_rate}')

    def p_120_initialize_security(self) -> None:
        """Business logic from COBOL paragraph: 120-INITIALIZE-SECURITY"""
        # SECURITY FIX: Use environment variable instead of hardcoded key
        self.encryption_key = os.getenv('BANKING_ENCRYPTION_KEY', '')
        if not self.encryption_key:
            self.logger.warning('BANKING_ENCRYPTION_KEY not set - encryption disabled')
        self.call_gensession(self.session_token)
        self.auth_level = Decimal('2')

    def p_130_setup_reporting(self) -> None:
        """Business logic from COBOL paragraph: 130-SETUP-REPORTING"""
        self.report_date = self.current_date[:8]
        self.report_time = self.current_time[:6]
        self.page_count = Decimal('1')
        self.line_count = Decimal('0')
        self.report_header = f'ULTIMATE BANKING SYSTEM - DAILY REPORT {self.report_date}'

    def p_200_authenticate_user(self) -> None:
        """Business logic from COBOL paragraph: 200-AUTHENTICATE-USER"""
        self.call_authmodule(self.ls_user_id, self.ls_session_id, self.auth_level)
        if self.auth_level >= Decimal('1'):
            self.security_flag = 'P'
            self.p_210_validate_session()
        else:
            self.security_flag = 'F'
            self.error_message = 'AUTHENTICATION FAILED'

    def p_210_validate_session(self) -> None:
        """Business logic from COBOL paragraph: 210-VALIDATE-SESSION"""
        self.call_validatesession(self.ls_session_id, self.security_flag)
        if self.security_pass:
            self.p_220_check_ip_authorization()

    def p_220_check_ip_authorization(self) -> None:
        """Business logic from COBOL paragraph: 220-CHECK-IP-AUTHORIZATION"""
        for idx in range(1, int(self.ip_whitelist_count) + 1):
            ip = RT.array_access(self.ip_whitelist, idx, '')
            if ip == self.trans_ip_address:
                self.security_flag = 'P'
                return
        self.security_flag = 'F'
        self.error_message = 'IP NOT AUTHORIZED'

    def p_300_process_command(self) -> None:
        """Business logic from COBOL paragraph: 300-PROCESS-COMMAND"""
        if self.ls_command == 'DEP':
            self.p_310_process_deposit()
        elif self.ls_command == 'WDR':
            self.p_320_process_withdrawal()
        elif self.ls_command == 'TRF':
            self.p_330_process_transfer()
        elif self.ls_command == 'BAL':
            self.p_340_check_balance()
        elif self.ls_command == 'HST':
            self.p_350_get_history()
        elif self.ls_command == 'INT':
            self.p_360_calculate_interest_adv()
        else:
            self.ls_error_msg = 'INVALID COMMAND'
            self.ls_return_code = Decimal('9002')

    def p_310_process_deposit(self) -> None:
        """Business logic from COBOL paragraph: 310-PROCESS-DEPOSIT"""
        # INTEGRATION: Use read_key for random access
        record = self.file_manager.read_key('customer_master_file', self.ls_from_account)
        if record is None or self.cm_not_found:
            self.ls_error_msg = 'ACCOUNT NOT FOUND'
            self.ls_return_code = Decimal('9003')
            return
        
        self._load_customer_fields(record)
        self.p_311_validate_deposit()
        if self.data_valid:
            self.p_312_execute_deposit()
            self.p_313_update_record()

    def p_311_validate_deposit(self) -> None:
        """Business logic from COBOL paragraph: 311-VALIDATE-DEPOSIT"""
        self.validation_flag = 'Y'
        
        if self.ls_amount <= Decimal('0'):
            self.validation_flag = 'N'
            self.error_message = 'INVALID AMOUNT'
            return
            
        if self.ls_amount > self.max_single_transaction:
            self.validation_flag = 'N'
            self.error_message = 'EXCEEDS LIMIT'
            return
            
        self.calculate_fraud_score()
        if self.fraud_score > self.fraud_threshold:
            self.validation_flag = 'N'
            self.error_message = 'FRAUD SUSPECTED'

    def p_312_execute_deposit(self) -> None:
        """Business logic from COBOL paragraph: 312-EXECUTE-DEPOSIT
        
        Using CobolRuntime for all financial calculations
        """
        self.new_balance = RT.compute_rounded(self.cm_account_balance + self.ls_amount)
        self.tax_amount = RT.compute_rounded(self.ls_amount * self.tax_rate)
        self.net_amount = RT.compute_rounded(self.ls_amount - self.tax_amount)
        
        self.cm_account_balance = RT.cobol_add(self.cm_account_balance, self.net_amount)
        self.cm_available_balance = RT.cobol_add(self.cm_available_balance, self.net_amount)
        
        self.transaction_count += Decimal('1')
        self.total_amount = RT.cobol_add(self.total_amount, self.ls_amount)
        self.trans_type = 'DEP'
        self.trans_amount = self.ls_amount
        self.trans_status = 'C'

    def p_313_update_record(self) -> None:
        """Business logic from COBOL paragraph: 313-UPDATE-RECORD"""
        self.cm_last_interest_date = self.current_date
        
        # INTEGRATION: Use rewrite_record for VSAM update
        updated_record = self._store_customer_fields()
        success = self.file_manager.rewrite_record('customer_master_file', updated_record)
        
        if not success:
            self.ls_error_msg = 'UPDATE FAILED'
            self.ls_return_code = Decimal('9005')
        else:
            self.ls_error_msg = 'SUCCESS'
            self.ls_return_code = Decimal('0')
            self.log_transaction()

    def p_320_process_withdrawal(self) -> None:
        """Business logic from COBOL paragraph: 320-PROCESS-WITHDRAWAL"""
        record = self.file_manager.read_key('customer_master_file', self.ls_from_account)
        if record is None or self.cm_not_found:
            self.ls_error_msg = 'ACCOUNT NOT FOUND'
            self.ls_return_code = Decimal('9006')
            return
        
        self._load_customer_fields(record)
        self.p_321_validate_withdrawal()
        if self.data_valid:
            self.p_322_execute_withdrawal()
            self.p_323_update_record()

    def p_321_validate_withdrawal(self) -> None:
        """Business logic from COBOL paragraph: 321-VALIDATE-WITHDRAWAL"""
        self.validation_flag = 'Y'
        
        if self.ls_amount <= Decimal('0'):
            self.validation_flag = 'N'
            self.error_message = 'INVALID AMOUNT'
            return
            
        if self.ls_amount > self.cm_available_balance:
            self.validation_flag = 'N'
            self.error_message = 'INSUFFICIENT FUNDS'
            return
            
        if self.ls_amount > self.daily_limit:
            self.validation_flag = 'N'
            self.error_message = 'DAILY LIMIT EXCEEDED'
            return
            
        self.daily_total = RT.compute_rounded(self.daily_total + self.ls_amount)
        if self.daily_total > self.daily_limit:
            self.validation_flag = 'N'
            self.error_message = 'DAILY TOTAL EXCEEDED'
            return
            
        self.calculate_fraud_score()
        if self.fraud_score > self.fraud_threshold:
            self.validation_flag = 'N'
            self.error_message = 'FRAUD SUSPECTED'

    def p_322_execute_withdrawal(self) -> None:
        """Business logic from COBOL paragraph: 322-EXECUTE-WITHDRAWAL"""
        self.new_balance = RT.compute_rounded(self.cm_account_balance - self.ls_amount)
        self.fee_amount = RT.compute_rounded(self.ls_amount * Decimal('0.015'))
        
        if self.fee_amount < Decimal('5.00'):
            self.fee_amount = Decimal('5.00')
            
        self.net_amount = RT.compute_rounded(self.ls_amount + self.fee_amount)
        self.cm_account_balance = RT.cobol_subtract(self.cm_account_balance, self.net_amount)
        self.cm_available_balance = RT.cobol_subtract(self.cm_available_balance, self.net_amount)
        
        self.transaction_count += Decimal('1')
        self.total_amount = RT.cobol_subtract(self.total_amount, self.ls_amount)
        self.trans_type = 'WDR'
        self.trans_amount = self.ls_amount
        self.trans_status = 'C'

    def p_323_update_record(self) -> None:
        """Alias for p_313_update_record"""
        self.p_313_update_record()

    def p_330_process_transfer(self) -> None:
        """Business logic from COBOL paragraph: 330-PROCESS-TRANSFER"""
        record = self.file_manager.read_key('customer_master_file', self.ls_from_account)
        if record is None or self.cm_not_found:
            self.ls_error_msg = 'SOURCE ACCOUNT NOT FOUND'
            self.ls_return_code = Decimal('9007')
            return
        
        self._load_customer_fields(record)
        self.p_331_validate_transfer()
        if self.data_valid:
            self.p_332_debit_source()
            self.p_333_credit_target()
            self.p_334_update_both()

    def p_331_validate_transfer(self) -> None:
        """Business logic from COBOL paragraph: 331-VALIDATE-TRANSFER"""
        self.validation_flag = 'Y'
        
        if self.ls_amount <= Decimal('0'):
            self.validation_flag = 'N'
            self.error_message = 'INVALID AMOUNT'
            return
            
        if self.ls_amount > self.cm_available_balance:
            self.validation_flag = 'N'
            self.error_message = 'INSUFFICIENT FUNDS'
            return
            
        if self.ls_from_account == self.ls_to_account:
            self.validation_flag = 'N'
            self.error_message = 'SAME ACCOUNT'

    def p_332_debit_source(self) -> None:
        """Business logic from COBOL paragraph: 332-DEBIT-SOURCE"""
        self.new_balance = RT.compute_rounded(self.cm_account_balance - self.ls_amount)
        self.fee_amount = RT.compute_rounded(self.ls_amount * Decimal('0.010'))
        
        if self.fee_amount < Decimal('10.00'):
            self.fee_amount = Decimal('10.00')
            
        self.total_debit = RT.compute_rounded(self.ls_amount + self.fee_amount)
        self.cm_account_balance = RT.cobol_subtract(self.cm_account_balance, self.total_debit)
        self.cm_available_balance = RT.cobol_subtract(self.cm_available_balance, self.total_debit)
        
        # Update source account
        updated_record = self._store_customer_fields()
        self.file_manager.rewrite_record('customer_master_file', updated_record)

    def p_333_credit_target(self) -> None:
        """Business logic from COBOL paragraph: 333-CREDIT-TARGET"""
        record = self.file_manager.read_key('customer_master_file', self.ls_to_account)
        if record is None or self.cm_not_found:
            self.ls_error_msg = 'TARGET ACCOUNT NOT FOUND'
            self.ls_return_code = Decimal('9008')
            self.p_335_reverse_transaction()
            return
        
        self._load_customer_fields(record)
        self.cm_account_balance = RT.cobol_add(self.cm_account_balance, self.ls_amount)
        self.cm_available_balance = RT.cobol_add(self.cm_available_balance, self.ls_amount)
        
        # Update target account
        updated_record = self._store_customer_fields()
        self.file_manager.rewrite_record('customer_master_file', updated_record)

    def p_334_update_both(self) -> None:
        """Business logic from COBOL paragraph: 334-UPDATE-BOTH"""
        self.trans_type = 'TRF'
        self.trans_amount = self.ls_amount
        self.trans_status = 'C'
        self.transaction_count += Decimal('1')
        self.log_transaction()

    def p_335_reverse_transaction(self) -> None:
        """Business logic from COBOL paragraph: 335-REVERSE-TRANSACTION"""
        record = self.file_manager.read_key('customer_master_file', self.ls_from_account)
        if record:
            self._load_customer_fields(record)
            self.cm_account_balance = RT.cobol_add(self.cm_account_balance, self.ls_amount)
            self.cm_available_balance = RT.cobol_add(self.cm_available_balance, self.ls_amount)
            updated_record = self._store_customer_fields()
            self.file_manager.rewrite_record('customer_master_file', updated_record)
        self.trans_type = 'REV'
        self.trans_description = 'REVERSED - TARGET NOT FOUND'

    def p_340_check_balance(self) -> None:
        """Business logic from COBOL paragraph: 340-CHECK-BALANCE"""
        record = self.file_manager.read_key('customer_master_file', self.ls_from_account)
        if record is None or self.cm_not_found:
            self.ls_error_msg = 'ACCOUNT NOT FOUND'
            self.ls_return_code = Decimal('9009')
            return
        
        self._load_customer_fields(record)
        self.ls_amount = self.cm_account_balance
        self.ls_error_msg = 'SUCCESS'
        self.ls_return_code = Decimal('0')

    def p_350_get_history(self) -> None:
        """Business logic from COBOL paragraph: 350-GET-HISTORY"""
        self.p_351_initialize_search()
        self.p_352_search_transactions()
        self.p_353_format_results()

    def p_351_initialize_search(self) -> None:
        """Business logic from COBOL paragraph: 351-INITIALIZE-SEARCH"""
        self.file_manager.start_key('transaction_file', '', op='>=')

    def p_352_search_transactions(self) -> None:
        """Business logic from COBOL paragraph: 352-SEARCH-TRANSACTIONS"""
        self.index = Decimal('1')
        self.eof_flag = False
        
        while not (self.index > 100 or self.end_of_file):
            record = self.file_manager.read_next('transaction_file')
            if record is None:
                self.eof_flag = True
            else:
                if hasattr(record, 'source_account'):
                    if record.source_account == self.ls_from_account:
                        self.p_354_add_to_results()
            self.index += Decimal('1')

    def p_353_format_results(self) -> None:
        """Business logic from COBOL paragraph: 353-FORMAT-RESULTS"""
        self.ls_error_msg = 'HISTORY RETRIEVED'
        self.ls_return_code = Decimal('0')

    def p_354_add_to_results(self) -> None:
        """Business logic from COBOL paragraph: 354-ADD-TO-RESULTS"""
        self.transaction_count += Decimal('1')

    def p_360_calculate_interest_adv(self) -> None:
        """Business logic from COBOL paragraph: 360-CALCULATE-INTEREST-ADV"""
        self.p_361_get_account_data()
        self.p_362_determine_rate()
        self.p_363_calculate_compound()
        self.p_364_apply_interest()

    def p_361_get_account_data(self) -> None:
        """Business logic from COBOL paragraph: 361-GET-ACCOUNT-DATA"""
        record = self.file_manager.read_key('customer_master_file', self.ls_from_account)
        if record is None or self.cm_not_found:
            self.ls_error_msg = 'ACCOUNT NOT FOUND'
            self.ls_return_code = Decimal('9011')
            return
        
        self._load_customer_fields(record)
        self.principal = self.cm_account_balance
        self.annual_rate = self.cm_interest_rate

    def p_362_determine_rate(self) -> None:
        """Business logic from COBOL paragraph: 362-DETERMINE-RATE"""
        self.annual_rate = Decimal('0.005')
        
        for idx in range(1, 6):
            rate_entry = RT.array_access(self.config.rate_table, idx)
            if rate_entry and rate_entry.account_code == self.cm_account_type:
                self.annual_rate = rate_entry.base_rate
                if self.cm_account_balance > Decimal('1000000'):
                    self.annual_rate = RT.compute_rounded(
                        self.annual_rate + rate_entry.premium_rate, 6
                    )
                break

    def p_363_calculate_compound(self) -> None:
        """Business logic from COBOL paragraph: 363-CALCULATE-COMPOUND"""
        daily_factor = Decimal('1') + RT.safe_divide(self.annual_rate, Decimal('365'))
        self.compound_factor = daily_factor ** 30
        self.future_value = RT.compute_rounded(self.principal * self.compound_factor)
        self.interest_amount = RT.compute_rounded(self.future_value - self.principal)

    def p_364_apply_interest(self) -> None:
        """Business logic from COBOL paragraph: 364-APPLY-INTEREST"""
        self.tax_amount = RT.compute_rounded(self.interest_amount * self.tax_rate)
        self.net_interest = RT.compute_rounded(self.interest_amount - self.tax_amount)
        
        self.cm_account_balance = RT.cobol_add(self.cm_account_balance, self.net_interest)
        self.cm_available_balance = RT.cobol_add(self.cm_available_balance, self.net_interest)
        self.cm_last_interest_date = self.current_date
        
        # Update record
        updated_record = self._store_customer_fields()
        self.file_manager.rewrite_record('customer_master_file', updated_record)
        
        self.trans_type = 'INT'
        self.trans_amount = self.net_interest
        self.log_transaction()

    def p_400_calculate_interest(self) -> None:
        """Business logic from COBOL paragraph: 400-CALCULATE-INTEREST"""
        self.eof_flag = False
        self.file_manager.start_key('customer_master_file', '', op='>=')
        
        while not self.end_of_file:
            record = self.file_manager.read_next('customer_master_file')
            if record is None:
                self.eof_flag = True
            else:
                self._load_customer_fields(record)
                if self.cm_account_balance > Decimal('0'):
                    self.p_410_calculate_daily_interest()
                    self.p_411_update_account()

    def p_410_calculate_daily_interest(self) -> None:
        """Business logic from COBOL paragraph: 410-CALCULATE-DAILY-INTEREST"""
        self.principal = self.cm_account_balance
        self.annual_rate = self.cm_interest_rate
        
        self.daily_rate = RT.compute_rounded(
            RT.safe_divide(self.annual_rate, Decimal('365')), 8
        )
        self.interest_amount = RT.compute_rounded(self.principal * self.daily_rate)
        self.tax_amount = RT.compute_rounded(self.interest_amount * self.tax_rate)
        self.net_interest = RT.compute_rounded(self.interest_amount - self.tax_amount)

    def p_411_update_account(self) -> None:
        """Business logic from COBOL paragraph: 411-UPDATE-ACCOUNT"""
        self.cm_account_balance = RT.cobol_add(self.cm_account_balance, self.net_interest)
        self.cm_available_balance = RT.cobol_add(self.cm_available_balance, self.net_interest)
        self.cm_last_interest_date = self.current_date
        self.total_amount = RT.cobol_add(self.total_amount, self.net_interest)
        self.transaction_count += Decimal('1')
        
        updated_record = self._store_customer_fields()
        self.file_manager.rewrite_record('customer_master_file', updated_record)

    def p_500_apply_fees_and_taxes(self) -> None:
        """Business logic from COBOL paragraph: 500-APPLY-FEES-AND-TAXES"""
        self.p_510_calculate_monthly_fees()
        self.p_520_apply_tax_withholding()
        self.p_530_update_compliance()

    def p_510_calculate_monthly_fees(self) -> None:
        """Business logic from COBOL paragraph: 510-CALCULATE-MONTHLY-FEES"""
        if self.cm_account_balance < self.min_balance:
            self.fee_amount = Decimal('25.00')
            self.cm_account_balance = RT.cobol_subtract(self.cm_account_balance, self.fee_amount)
            self.log_fee()

    def p_520_apply_tax_withholding(self) -> None:
        """Business logic from COBOL paragraph: 520-APPLY-TAX-WITHHOLDING"""
        if self.total_amount > Decimal('10000'):
            self.tax_amount = RT.compute_rounded(self.total_amount * self.cm_withholding_rate)
            self.cm_account_balance = RT.cobol_subtract(self.cm_account_balance, self.tax_amount)
            self.log_tax()

    def p_530_update_compliance(self) -> None:
        """Business logic from COBOL paragraph: 530-UPDATE-COMPLIANCE"""
        self.cm_last_tax_report = self.current_date

    def p_600_generate_reports(self) -> None:
        """Business logic from COBOL paragraph: 600-GENERATE-REPORTS"""
        self.p_610_generate_transaction_report()
        self.p_620_generate_balance_report()
        self.p_630_generate_risk_report()
        self.p_640_generate_audit_report()

    def p_610_generate_transaction_report(self) -> None:
        """Business logic from COBOL paragraph: 610-GENERATE-TRANSACTION-REPORT"""
        self.display_count = str(self.transaction_count)
        self.display_amount = PresentationLayer.format_currency(self.total_amount)
        self.logger.info(f'REPORT: Transactions: {self.display_count}  Total: {self.display_amount}')

    def p_620_generate_balance_report(self) -> None:
        """Business logic from COBOL paragraph: 620-GENERATE-BALANCE-REPORT"""
        self.report_title = 'BALANCE REPORT'
        self.logger.info(f'GENERATING: {self.report_title}')

    def p_630_generate_risk_report(self) -> None:
        """Business logic from COBOL paragraph: 630-GENERATE-RISK-REPORT"""
        self.report_title = 'RISK ASSESSMENT REPORT'
        self.logger.info(f'GENERATING: {self.report_title}')
        self.p_631_analyze_risks()
    
    def p_631_analyze_risks(self) -> None:
        """Business logic from COBOL paragraph: 631-ANALYZE-RISKS"""
        self.eof_flag = False
        self.index = Decimal('1')
        self.file_manager.start_key('customer_master_file', '', op='>=')
        
        while not (self.index > Decimal('100') or self.end_of_file):
            record = self.file_manager.read_next('customer_master_file')
            if record is None:
                self.eof_flag = True
            else:
                self._load_customer_fields(record)
                self.p_632_calculate_risk_score()
                if self.cm_risk_score > self.risk_threshold:
                    self.p_633_flag_high_risk()
            self.index += Decimal('1')
    
    def p_632_calculate_risk_score(self) -> None:
        """Business logic from COBOL paragraph: 632-CALCULATE-RISK-SCORE
        
        COBOL source lines 941-958
        """
        self.cm_risk_score = Decimal('50')  # Base score
        
        # High balance = higher risk
        if self.cm_account_balance > Decimal('1000000'):
            self.cm_risk_score += Decimal('20')
        
        # Suspicious activity flag
        if self.suspicious_activity:
            self.cm_risk_score += Decimal('30')
        
        # Determine risk level
        if self.cm_risk_score > Decimal('75'):
            self.cm_risk_level = 'H'  # High
        elif self.cm_risk_score > Decimal('50'):
            self.cm_risk_level = 'M'  # Medium
        else:
            self.cm_risk_level = 'L'  # Low
    
    def p_633_flag_high_risk(self) -> None:
        """Business logic from COBOL paragraph: 633-FLAG-HIGH-RISK"""
        self.cm_risk_level = 'C'  # Critical
        updated_record = self._store_customer_fields()
        self.file_manager.rewrite_record('customer_master_file', updated_record)
        self.log_risk_event()
    
    def log_risk_event(self) -> None:
        """Log risk event to audit trail"""
        audit = AuditRecord(
            audit_date=self.current_date[:8],
            audit_time=self.current_time[:6],
            user_id=self.ls_user_id,
            action='RISK',
            details=f'Level: {self.cm_risk_level} Score: {self.cm_risk_score}'
        )
        self.file_manager.write_record('audit_trail_file', audit)

    def p_640_generate_audit_report(self) -> None:
        """Business logic from COBOL paragraph: 640-GENERATE-AUDIT-REPORT"""
        self.report_title = 'AUDIT TRAIL REPORT'
        audit_record = AuditRecord(
            audit_date=self.current_date[:8],
            audit_time=self.current_time[:6],
            user_id=self.ls_user_id,
            action='AUDIT',
            details='AUDIT COMPLETED'
        )
        self.file_manager.write_record('audit_trail_file', audit_record)

    def p_700_update_audit_trail(self) -> None:
        """Business logic from COBOL paragraph: 700-UPDATE-AUDIT-TRAIL"""
        if self.audit_enabled:
            self.p_710_log_all_actions()

    def p_710_log_all_actions(self) -> None:
        """Business logic from COBOL paragraph: 710-LOG-ALL-ACTIONS"""
        audit_record = AuditRecord(
            audit_date=self.current_date[:8],
            audit_time=self.current_time[:6],
            user_id=self.ls_user_id,
            action=self.ls_command,
            details=f'Return Code: {self.ls_return_code}'
        )
        self.file_manager.write_record('audit_trail_file', audit_record)

    def p_800_handle_security_failure(self) -> None:
        """Business logic from COBOL paragraph: 800-HANDLE-SECURITY-FAILURE"""
        self.ls_error_msg = 'SECURITY VIOLATION'
        self.ls_return_code = Decimal('9998')
        self.log_security_event()
        self.lock_account()
        self.notify_security_team()

    def lock_account(self) -> None:
        """Business logic from COBOL paragraph: LOCK-ACCOUNT"""
        self.cm_account_locked = 'Y'

    def notify_security_team(self) -> None:
        """Business logic from COBOL paragraph: NOTIFY-SECURITY-TEAM"""
        self.logger.warning(f'SECURITY ALERT: {self.ls_user_id}')

    def p_900_terminate(self) -> None:
        """Business logic from COBOL paragraph: 900-TERMINATE"""
        self.file_manager.close_all()
        self.p_910_generate_performance_report()

    def p_910_generate_performance_report(self) -> None:
        """Business logic from COBOL paragraph: 910-GENERATE-PERFORMANCE-REPORT"""
        self.elapsed_time = self.end_time - self.start_time
        if self.elapsed_time > Decimal('0'):
            self.transactions_per_second = RT.compute_rounded(
                RT.safe_divide(self.transaction_count, self.elapsed_time)
            )
        self.logger.info('PERFORMANCE METRICS:')
        self.logger.info(f'TRANSACTIONS: {self.transaction_count}')
        self.logger.info(f'TPS: {self.transactions_per_second}')

    # ========== UTILITY METHODS ==========

    def log_error(self) -> None:
        """Log error to audit trail"""
        audit = AuditRecord(
            audit_date=self.current_date[:8],
            audit_time=self.current_time[:6],
            user_id=self.ls_user_id,
            action='ERROR',
            details=f'{self.error_code}: {self.error_message}'
        )
        self.file_manager.write_record('audit_trail_file', audit)

    def log_transaction(self) -> None:
        """Log transaction to audit trail"""
        audit = AuditRecord(
            audit_date=self.current_date[:8],
            audit_time=self.current_time[:6],
            user_id=self.ls_user_id,
            action='TXN',
            details=f'{self.trans_type} {self.trans_amount} {self.trans_status}'
        )
        self.file_manager.write_record('audit_trail_file', audit)

    def log_security_event(self) -> None:
        """Log security event to audit trail"""
        audit = AuditRecord(
            audit_date=self.current_date[:8],
            audit_time=self.current_time[:6],
            user_id=self.ls_user_id,
            action='SEC',
            details=f'Security flag: {self.security_flag}'
        )
        self.file_manager.write_record('audit_trail_file', audit)

    def log_fee(self) -> None:
        """Log fee to audit trail"""
        audit = AuditRecord(
            audit_date=self.current_date[:8],
            audit_time=self.current_time[:6],
            user_id=self.ls_user_id,
            action='FEE',
            details=f'Fee: {self.fee_amount}'
        )
        self.file_manager.write_record('audit_trail_file', audit)

    def log_tax(self) -> None:
        """Log tax to audit trail"""
        audit = AuditRecord(
            audit_date=self.current_date[:8],
            audit_time=self.current_time[:6],
            user_id=self.ls_user_id,
            action='TAX',
            details=f'Tax: {self.tax_amount}'
        )
        self.file_manager.write_record('audit_trail_file', audit)

    def calculate_fraud_score(self) -> None:
        """Calculate fraud score based on transaction patterns
        
        COBOL source lines 1087-1097:
        - TRANS-AMOUNT > 100000 → +30 pts
        - TRANS-CHANNEL = 'O' AND > 50000 → +25 pts
        - WS-INDEX > 10 → +20 pts (frequency check)
        """
        self.fraud_score = Decimal('0')
        
        # Rule 1: Large transaction
        if self.trans_amount > Decimal('100000'):
            self.fraud_score += Decimal('30')
        
        # Rule 2: Online channel with significant amount
        if self.trans_channel == 'O' and self.trans_amount > Decimal('50000'):
            self.fraud_score += Decimal('25')
        
        # Rule 3: High frequency (WS-INDEX > 10)
        if self.index > Decimal('10'):
            self.fraud_score += Decimal('20')

    # ========== MAIN ENTRY POINT ==========

    def run(self, ls_control_block: Optional[Dict[str, Any]] = None,
            ls_transaction_data: Optional[Dict[str, Any]] = None):
        """Main entry point - executes primary workflow"""
        self.logger.info('Starting UltimateBankingSystem v%s', self.VERSION)
        
        if ls_control_block:
            self.ls_user_id = ls_control_block.get('user_id', '')
            self.ls_session_id = ls_control_block.get('session_id', '')
            self.ls_command = ls_control_block.get('command', '')
            
        if ls_transaction_data:
            self.ls_from_account = ls_transaction_data.get('from_account', '')
            self.ls_to_account = ls_transaction_data.get('to_account', '')
            self.ls_amount = Decimal(str(ls_transaction_data.get('amount', 0)))
            
        self.p_000_main()
        
        return {
            'return_code': int(self.ls_return_code),
            'message': self.ls_error_msg,
            'balance': float(self.ls_amount) if self.ls_command == 'BAL' else None,
            'transaction_count': int(self.transaction_count),
        }

    # ========== EXTERNAL CALL STUBS ==========

    def call_authmodule(self, *args):
        """Stub for external CALL 'AUTHMODULE'."""
        pass

    def call_gensession(self, *args):
        """Stub for external CALL 'GENSESSION'."""
        pass

    def call_validatesession(self, *args):
        """Stub for external CALL 'VALIDATESESSION'."""
        pass


# ============================================================================
# SUPABASE SCHEMA - Run in SQL Editor to create tables
# ============================================================================

SUPABASE_SCHEMA = """
-- COBOL Banking System - Supabase Schema
-- Run this in Supabase SQL Editor to create required tables

-- Customer Master File (INDEXED file)
CREATE TABLE IF NOT EXISTS customer_master (
    customer_id VARCHAR(20) PRIMARY KEY,
    account_type VARCHAR(2) NOT NULL DEFAULT 'CK',
    account_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    available_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    account_locked CHAR(1) NOT NULL DEFAULT 'N',
    interest_rate DECIMAL(10,6) NOT NULL DEFAULT 0,
    last_interest_date VARCHAR(14),
    last_tax_report VARCHAR(14),
    risk_level CHAR(1) NOT NULL DEFAULT 'L',
    risk_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    withholding_rate DECIMAL(10,6) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions File (INDEXED file)
CREATE TABLE IF NOT EXISTS transactions (
    trans_id VARCHAR(30) PRIMARY KEY,
    trans_type VARCHAR(3) NOT NULL,
    trans_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    trans_status CHAR(1) NOT NULL DEFAULT 'P',
    trans_reference VARCHAR(30),
    trans_description VARCHAR(100),
    source_account VARCHAR(20),
    target_account VARCHAR(20),
    trans_channel CHAR(1),
    trans_ip VARCHAR(45),
    trans_date VARCHAR(8),
    trans_time VARCHAR(6),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Trail File
CREATE TABLE IF NOT EXISTS audit_trail (
    audit_id SERIAL PRIMARY KEY,
    audit_date VARCHAR(8),
    audit_time VARCHAR(6),
    user_id VARCHAR(20),
    action VARCHAR(8),
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trans_source ON transactions(source_account);
CREATE INDEX IF NOT EXISTS idx_trans_date ON transactions(trans_date);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_trail(audit_date);
"""


# ============================================================================
# MAIN - Entry Point
# ============================================================================

if __name__ == '__main__':
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("=" * 60)
    print("UltimateBankingSystem v5.7.15-SUPABASE")
    print("COBOL-to-Python Transpilation with Supabase Backend")
    print("=" * 60)
    
    # Test run
    processor = UltimateBankingSystem()
    
    result = processor.run(
        ls_control_block={
            'user_id': 'ADMIN001',
            'session_id': 'SESSION123',
            'command': 'BAL'
        },
        ls_transaction_data={
            'from_account': 'ACC001',
            'amount': 1000.00
        }
    )
    
    print("\n" + "=" * 60)
    print("EXECUTION RESULT:")
    print(f"  Return Code: {result['return_code']}")
    print(f"  Message: {result['message']}")
    print(f"  Transactions: {result['transaction_count']}")
    print("=" * 60)
    
    print("\n[INFO] To configure Supabase, set environment variables:")
    print("  export SUPABASE_URL='your-project-url'")
    print("  export SUPABASE_KEY='your-anon-key'")
    print("\n[INFO] Then run this SQL in Supabase SQL Editor:")
    print("-" * 40)
    print(SUPABASE_SCHEMA[:500] + "...")
