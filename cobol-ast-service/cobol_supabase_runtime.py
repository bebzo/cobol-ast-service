"""COBOL-to-Python Runtime with Supabase Backend
Simulates VSAM INDEXED files using Supabase PostgreSQL

Version: 5.7.14-SUPABASE
Author: Matrix Agent

This module provides:
- IndexedFileManager: Simulates COBOL INDEXED files with Supabase
- Supports: READ KEY IS, START, READ NEXT, REWRITE, DELETE
- Full FILE STATUS codes compatible with COBOL
"""
from __future__ import annotations
import os
import json
import logging
from decimal import Decimal
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, asdict
from datetime import datetime

# Supabase client - install with: pip install supabase
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = Any


# COBOL FILE STATUS codes
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


@dataclass
class CustomerMasterRecord:
    """COBOL CUSTOMER-MASTER-FILE record structure"""
    customer_id: str = ''
    account_type: str = ''
    account_balance: Decimal = Decimal('0')
    available_balance: Decimal = Decimal('0')
    account_locked: str = 'N'
    interest_rate: Decimal = Decimal('0')
    last_interest_date: str = ''
    last_tax_report: str = ''
    risk_level: str = 'L'
    risk_score: Decimal = Decimal('0')
    withholding_rate: Decimal = Decimal('0')
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
    """COBOL TRANSACTION-FILE record structure"""
    trans_id: str = ''
    trans_type: str = ''
    trans_amount: Decimal = Decimal('0')
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
    
    Usage:
        fm = SupabaseIndexedFileManager()
        fm.open_file('customer_master', mode='I-O')
        
        # Random read
        record = fm.read_key('customer_master', 'CUST001')
        if fm.is_ok('customer_master'):
            print(record)
        elif fm.get_status('customer_master') == '23':
            print('NOT FOUND')
            
        # Sequential read
        fm.start_key('customer_master', 'CUST', op='>=')
        while not fm.is_eof('customer_master'):
            record = fm.read_next('customer_master')
            if record:
                process(record)
    """
    
    # Mapping: COBOL file name -> Supabase table name
    FILE_TABLE_MAP = {
        'customer_master_file': 'customer_master',
        'customer_master': 'customer_master',
        'transaction_file': 'transactions',
        'transactions': 'transactions',
        'audit_trail_file': 'audit_trail',
        'audit_trail': 'audit_trail',
    }
    
    # Mapping: Table -> Primary key column
    TABLE_KEY_MAP = {
        'customer_master': 'customer_id',
        'transactions': 'trans_id',
        'audit_trail': 'audit_id',
    }
    
    # Mapping: Table -> Record class
    TABLE_RECORD_MAP = {
        'customer_master': CustomerMasterRecord,
        'transactions': TransactionRecord,
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
        self._cursor: Dict[str, List[Dict]] = {}  # For sequential reads
        self._cursor_pos: Dict[str, int] = {}
        self._current_record: Dict[str, Any] = {}
        
        if SUPABASE_AVAILABLE and self.supabase_url and self.supabase_key:
            try:
                self.client = create_client(self.supabase_url, self.supabase_key)
                self.logger.info("Supabase client initialized successfully")
            except Exception as e:
                self.logger.error(f"Failed to initialize Supabase: {e}")
                self.client = None
    
    def _get_table(self, file_name: str) -> str:
        """Get Supabase table name for COBOL file"""
        return self.FILE_TABLE_MAP.get(file_name, file_name)
    
    def _get_key_column(self, table: str) -> str:
        """Get primary key column for table"""
        return self.TABLE_KEY_MAP.get(table, 'id')
    
    # ========== COBOL FILE OPERATIONS ==========
    
    def open_file(self, file_name: str, mode: str = 'I-O') -> bool:
        """COBOL OPEN statement.
        
        Args:
            file_name: COBOL file name
            mode: 'INPUT', 'OUTPUT', 'I-O', 'EXTEND'
            
        Returns:
            True if successful
        """
        table = self._get_table(file_name)
        
        if not self.client:
            self._status[file_name] = FileStatus.FILE_NOT_FOUND
            self.logger.error(f"Supabase not connected for {file_name}")
            return False
        
        # Verify table exists by attempting a count
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
        Sets FILE STATUS to '23' if not found.
        
        Args:
            file_name: COBOL file name
            key_value: Value of the primary key
            
        Returns:
            Record dataclass or None if not found
        """
        if file_name not in self._mode:
            self._status[file_name] = FileStatus.NOT_OPEN
            return None
        
        table = self._get_table(file_name)
        key_col = self._get_key_column(table)
        
        try:
            result = self.client.table(table).select('*').eq(key_col, key_value).execute()
            
            if result.data and len(result.data) > 0:
                self._status[file_name] = FileStatus.SUCCESS
                row = result.data[0]
                self._current_record[file_name] = row
                
                # Convert to typed record if available
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
    
    def start_key(self, file_name: str, key_value: str, op: str = '>=') -> bool:
        """COBOL START ... KEY >= ... statement.
        
        Positions cursor for sequential reading.
        
        Args:
            file_name: COBOL file name
            key_value: Starting key value
            op: Comparison operator ('>=', '>', '=')
            
        Returns:
            True if at least one record matches
        """
        if file_name not in self._mode:
            self._status[file_name] = FileStatus.NOT_OPEN
            return False
        
        table = self._get_table(file_name)
        key_col = self._get_key_column(table)
        
        try:
            query = self.client.table(table).select('*')
            
            if op == '>=':
                query = query.gte(key_col, key_value)
            elif op == '>':
                query = query.gt(key_col, key_value)
            elif op == '=':
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
        """COBOL READ ... NEXT statement.
        
        Sequential read from current cursor position.
        Sets FILE STATUS to '10' at end of file.
        
        Returns:
            Record dataclass or None at EOF
        """
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
        
        # Convert to typed record
        table = self._get_table(file_name)
        record_class = self.TABLE_RECORD_MAP.get(table)
        if record_class:
            return record_class.from_dict(row)
        return row
    
    def write_record(self, file_name: str, record: Any) -> bool:
        """COBOL WRITE statement.
        
        Inserts a new record. Sets '22' if duplicate key.
        
        Args:
            file_name: COBOL file name
            record: Record dataclass or dict
            
        Returns:
            True if successful
        """
        if file_name not in self._mode:
            self._status[file_name] = FileStatus.NOT_OPEN
            return False
        
        mode = self._mode[file_name]
        if mode == 'INPUT':
            self._status[file_name] = FileStatus.LOGIC_ERROR
            return False
        
        table = self._get_table(file_name)
        
        # Convert record to dict
        if hasattr(record, 'to_dict'):
            data = record.to_dict()
        elif hasattr(record, '__dict__'):
            data = record.__dict__
        else:
            data = dict(record)
        
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
        """COBOL REWRITE statement.
        
        Updates the current record (last read).
        
        Args:
            file_name: COBOL file name
            record: Updated record (or uses current with modifications)
            
        Returns:
            True if successful
        """
        if file_name not in self._mode:
            self._status[file_name] = FileStatus.NOT_OPEN
            return False
        
        if self._mode[file_name] not in ('I-O', 'OUTPUT'):
            self._status[file_name] = FileStatus.LOGIC_ERROR
            return False
        
        table = self._get_table(file_name)
        key_col = self._get_key_column(table)
        
        # Get key from current record
        current = self._current_record.get(file_name)
        if not current:
            self._status[file_name] = FileStatus.LOGIC_ERROR
            return False
        
        key_value = current.get(key_col)
        
        # Prepare update data
        if record:
            if hasattr(record, 'to_dict'):
                data = record.to_dict()
            elif hasattr(record, '__dict__'):
                data = record.__dict__
            else:
                data = dict(record)
        else:
            data = current
        
        try:
            result = self.client.table(table).update(data).eq(key_col, key_value).execute()
            self._status[file_name] = FileStatus.SUCCESS
            return True
        except Exception as e:
            self._status[file_name] = FileStatus.OTHER_ERROR
            self.logger.error(f"Rewrite error on {file_name}: {e}")
            return False
    
    def delete_record(self, file_name: str) -> bool:
        """COBOL DELETE statement.
        
        Deletes the current record (last read).
        
        Returns:
            True if successful
        """
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
        """Check if last operation was successful (status '00')."""
        return self._status.get(file_name) == FileStatus.SUCCESS
    
    def is_eof(self, file_name: str) -> bool:
        """Check if end of file reached (status '10')."""
        return self._status.get(file_name) == FileStatus.EOF
    
    def is_not_found(self, file_name: str) -> bool:
        """Check if record not found (status '23')."""
        return self._status.get(file_name) == FileStatus.NOT_FOUND
    
    def is_duplicate(self, file_name: str) -> bool:
        """Check if duplicate key (status '22')."""
        return self._status.get(file_name) == FileStatus.DUPLICATE_KEY


# ========== SQL SCHEMA FOR SUPABASE ==========

SUPABASE_SCHEMA = """
-- Run this in Supabase SQL Editor to create tables

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

-- Audit Trail File (SEQUENTIAL file simulated as table)
CREATE TABLE IF NOT EXISTS audit_trail (
    audit_id SERIAL PRIMARY KEY,
    audit_date VARCHAR(8),
    audit_time VARCHAR(6),
    user_id VARCHAR(20),
    action VARCHAR(8),
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trans_source ON transactions(source_account);
CREATE INDEX IF NOT EXISTS idx_trans_date ON transactions(trans_date);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_trail(audit_date);

-- Enable Row Level Security (optional)
ALTER TABLE customer_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
"""


def print_schema():
    """Print the Supabase SQL schema for setup."""
    print(SUPABASE_SCHEMA)


if __name__ == '__main__':
    print("=== COBOL Supabase Runtime ===")
    print("\nTo set up Supabase, run this SQL in your Supabase SQL Editor:\n")
    print_schema()
