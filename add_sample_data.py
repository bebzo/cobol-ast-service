#!/usr/bin/env python3
"""
Add Sample Data to Supabase - CodeSwitch v11.0
===============================================
Insert sample customers, accounts, and transactions to test the system.

Usage:
    python add_sample_data.py

Auteur: MiniMax Agent
"""

import os
import sys
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

# Add workspace to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def load_env():
    """Load environment variables."""
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()


def add_customers(supabase):
    """Add sample customers."""
    print("=" * 60)
    print("Adding Sample Customers")
    print("=" * 60)
    
    customers = [
        {
            'customer_id': 'CUST001',
            'name': 'Jean Dupont',
            'email': 'jean.dupont@example.com',
            'created_at': datetime.now().isoformat()
        },
        {
            'customer_id': 'CUST002',
            'name': 'Marie Martin',
            'email': 'marie.martin@example.com',
            'created_at': datetime.now().isoformat()
        },
        {
            'customer_id': 'CUST003',
            'name': 'Pierre Durand',
            'email': 'pierre.durand@example.com',
            'created_at': datetime.now().isoformat()
        }
    ]
    
    for customer in customers:
        try:
            result = supabase.table('customers').insert(customer).execute()
            print(f"  ✅ Customer added: {customer['name']} ({customer['customer_id']})")
        except Exception as e:
            if 'duplicate key' in str(e):
                print(f"  ⚠️  Customer exists: {customer['name']}")
            else:
                print(f"  ❌ Error: {e}")
    
    return len(customers)


def add_accounts(supabase):
    """Add sample accounts."""
    print("\n" + "=" * 60)
    print("Adding Sample Accounts")
    print("=" * 60)
    
    accounts = [
        {'account_id': 'ACC001', 'customer_id': 'CUST001', 'account_type': 'CHECKING', 'balance': Decimal('5000.00')},
        {'account_id': 'ACC002', 'customer_id': 'CUST001', 'account_type': 'SAVINGS', 'balance': Decimal('15000.00')},
        {'account_id': 'ACC003', 'customer_id': 'CUST002', 'account_type': 'CHECKING', 'balance': Decimal('3500.00')},
        {'account_id': 'ACC004', 'customer_id': 'CUST002', 'account_type': 'SAVINGS', 'balance': Decimal('25000.00')},
        {'account_id': 'ACC005', 'customer_id': 'CUST003', 'account_type': 'CHECKING', 'balance': Decimal('8750.00')},
        {'account_id': 'ACC006', 'customer_id': 'CUST003', 'account_type': 'MONEY_MARKET', 'balance': Decimal('50000.00')}
    ]
    
    for account in accounts:
        account['created_at'] = datetime.now().isoformat()
        account['balance'] = float(account['balance'])
        
        try:
            result = supabase.table('accounts').insert(account).execute()
            print(f"  ✅ Account added: {account['account_id']} ({account['account_type']}) - ${account['balance']:,.2f}")
        except Exception as e:
            if 'duplicate key' in str(e):
                print(f"  ⚠️  Account exists: {account['account_id']}")
            else:
                print(f"  ❌ Error: {e}")
    
    return len(accounts)


def add_transactions(supabase):
    """Add sample transactions."""
    print("\n" + "=" * 60)
    print("Adding Sample Transactions")
    print("=" * 60)
    
    transactions = [
        {'transaction_id': 'TXN001', 'account_id': 'ACC001', 'transaction_type': 'DEPOSIT', 'amount': float(Decimal('1000.00'))},
        {'transaction_id': 'TXN002', 'account_id': 'ACC001', 'transaction_type': 'WITHDRAWAL', 'amount': float(Decimal('200.00'))},
        {'transaction_id': 'TXN003', 'account_id': 'ACC002', 'transaction_type': 'TRANSFER', 'amount': float(Decimal('500.00'))},
        {'transaction_id': 'TXN004', 'account_id': 'ACC003', 'transaction_type': 'DEPOSIT', 'amount': float(Decimal('3500.00'))},
        {'transaction_id': 'TXN005', 'account_id': 'ACC005', 'transaction_type': 'WIRE_TRANSFER', 'amount': float(Decimal('1000.00'))},
        {'transaction_id': 'TXN006', 'account_id': 'ACC006', 'transaction_type': 'INTEREST', 'amount': float(Decimal('125.50'))}
    ]
    
    for txn in transactions:
        txn['created_at'] = datetime.now().isoformat()
        txn['details'] = {}
        
        try:
            result = supabase.table('transactions').insert(txn).execute()
            print(f"  ✅ Transaction added: {txn['transaction_id']} ({txn['transaction_type']}) - ${txn['amount']:,.2f}")
        except Exception as e:
            if 'duplicate key' in str(e):
                print(f"  ⚠️  Transaction exists: {txn['transaction_id']}")
            else:
                print(f"  ❌ Error: {e}")
    
    return len(transactions)


def add_audit_entries(supabase):
    """Add sample audit entries."""
    print("\n" + "=" * 60)
    print("Adding Sample Audit Entries")
    print("=" * 60)
    
    import secrets
    
    audit_entries = [
        {'action': 'LOGIN', 'user_id': 'CUST001', 'resource': 'web_portal'},
        {'action': 'DEPOSIT', 'user_id': 'CUST002', 'resource': 'ACC003'},
        {'action': 'TRANSFER', 'user_id': 'CUST003', 'resource': 'ACC006'},
        {'action': 'PASSWORD_CHANGE', 'user_id': 'CUST001', 'resource': 'account_settings'},
        {'action': 'SECURITY_ALERT', 'user_id': 'CUST002', 'resource': 'login_attempt'}
    ]
    
    for entry in audit_entries:
        entry['audit_id'] = secrets.token_hex(16)
        entry['timestamp'] = datetime.now().isoformat()
        entry['details'] = {}
        
        try:
            result = supabase.table('audit_trail').insert(entry).execute()
            print(f"  ✅ Audit entry: {entry['action']} by {entry['user_id']}")
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    return len(audit_entries)


def show_summary(supabase):
    """Show summary of all data."""
    print("\n" + "=" * 60)
    print("DATA SUMMARY")
    print("=" * 60)
    
    tables = ['customers', 'accounts', 'transactions', 'audit_trail', 'sessions', 'security_alerts']
    
    for table in tables:
        try:
            result = supabase.table(table).select('count').execute()
            count = result.count if hasattr(result, 'count') else (result.data[0]['count'] if result.data else 0)
            print(f"  {table}: {count} records")
        except Exception as e:
            print(f"  {table}: Error - {e}")


def main():
    """Main function."""
    print("\n" + "=" * 60)
    print("SAMPLE DATA INSERTION")
    print("CodeSwitch v11.0")
    print("=" * 60 + "\n")
    
    load_env()
    
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_ANON_KEY')
    
    if not url or not key:
        print("❌ Supabase credentials not configured")
        print("   Run: python setup_supabase.py --url URL --key KEY")
        return 1
    
    try:
        from supabase import create_client
        supabase = create_client(url, key)
        
        # Add data
        customers_count = add_customers(supabase)
        accounts_count = add_accounts(supabase)
        transactions_count = add_transactions(supabase)
        audit_count = add_audit_entries(supabase)
        
        # Show summary
        show_summary(supabase)
        
        print("\n" + "=" * 60)
        print("✅ SAMPLE DATA INSERTION COMPLETE")
        print("=" * 60)
        print(f"\nTotal records added:")
        print(f"  - Customers: {customers_count}")
        print(f"  - Accounts: {accounts_count}")
        print(f"  - Transactions: {transactions_count}")
        print(f"  - Audit entries: {audit_count}")
        print(f"\nYou can view this data in Supabase Dashboard > Table Editor")
        print()
        
        return 0
        
    except ImportError:
        print("❌ Supabase client not installed")
        print("   Run: uv pip install supabase")
        return 1
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
