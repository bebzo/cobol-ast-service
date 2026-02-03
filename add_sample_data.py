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
    
    now = datetime.now().isoformat()
    customers = [
        {
            'customer_id': 'C001',
            'name': 'Jean Dupont',
            'email': 'jean.dupont@example.com',
            'created_at': now,
            'updated_at': now
        },
        {
            'customer_id': 'C002',
            'name': 'Marie Martin',
            'email': 'marie.martin@example.com',
            'created_at': now,
            'updated_at': now
        },
        {
            'customer_id': 'C003',
            'name': 'Pierre Durand',
            'email': 'pierre.durand@example.com',
            'created_at': now,
            'updated_at': now
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
    
    now = datetime.now().isoformat()
    accounts = [
        {'account_id': 'A01', 'customer_id': 'C001', 'account_type': 'CHK', 'balance': Decimal('5000.00')},
        {'account_id': 'A02', 'customer_id': 'C001', 'account_type': 'SAV', 'balance': Decimal('15000.00')},
        {'account_id': 'A03', 'customer_id': 'C002', 'account_type': 'CHK', 'balance': Decimal('3500.00')},
        {'account_id': 'A04', 'customer_id': 'C002', 'account_type': 'SAV', 'balance': Decimal('25000.00')},
        {'account_id': 'A05', 'customer_id': 'C003', 'account_type': 'CHK', 'balance': Decimal('8750.00')},
        {'account_id': 'A06', 'customer_id': 'C003', 'account_type': 'MMK', 'balance': Decimal('50000.00')}
    ]
    
    for account in accounts:
        account['created_at'] = now
        account['updated_at'] = now
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
    
    now = datetime.now().isoformat()
    today = datetime.now().strftime('%Y%m%d')
    transactions = [
        {'trans_id': 'T01', 'source_account': 'A01', 'trans_type': 'DEP', 'trans_amount': 1000.00, 'trans_description': 'Cash deposit'},
        {'trans_id': 'T02', 'source_account': 'A01', 'trans_type': 'WDL', 'trans_amount': 200.00, 'trans_description': 'ATM withdrawal'},
        {'trans_id': 'T03', 'source_account': 'A02', 'target_account': 'A01', 'trans_type': 'TRF', 'trans_amount': 500.00, 'trans_description': 'Transfer to checking'},
        {'trans_id': 'T04', 'source_account': 'A03', 'trans_type': 'DEP', 'trans_amount': 3500.00, 'trans_description': 'Payroll deposit'},
        {'trans_id': 'T05', 'source_account': 'A05', 'trans_type': 'WIR', 'trans_amount': 1000.00, 'trans_description': 'Wire transfer outgoing'},
        {'trans_id': 'T06', 'source_account': 'A06', 'trans_type': 'INT', 'trans_amount': 125.50, 'trans_description': 'Monthly interest'}
    ]
    
    for txn in transactions:
        txn['trans_status'] = 'P'
        txn['trans_date'] = today
        txn['created_at'] = now
        
        try:
            result = supabase.table('transactions').insert(txn).execute()
            print(f"  ✅ Transaction added: {txn['trans_id']} ({txn['trans_type']}) - ${txn['trans_amount']:,.2f}")
        except Exception as e:
            if 'duplicate key' in str(e):
                print(f"  ⚠️  Transaction exists: {txn['trans_id']}")
            else:
                print(f"  ❌ Error: {e}")
    
    return len(transactions)


def add_audit_entries(supabase):
    """Add sample audit entries."""
    print("\n" + "=" * 60)
    print("Adding Sample Audit Entries")
    print("=" * 60)
    
    now = datetime.now()
    today = now.strftime('%Y%m%d')
    current_time = now.strftime('%H%M%S')
    
    # Get next available audit_id
    try:
        result = supabase.table('audit_trail').select('audit_id').order('audit_id', desc=True).limit(1).execute()
        if result.data:
            next_id = result.data[0]['audit_id'] + 1
        else:
            next_id = 1
    except:
        next_id = 1
    
    audit_entries = [
        {'audit_id': next_id, 'action': 'LOGIN', 'user_id': 'C001', 'audit_date': today, 'audit_time': current_time, 'details': {'portal': 'web'}},
        {'audit_id': next_id + 1, 'action': 'DEPOSIT', 'user_id': 'C002', 'audit_date': today, 'audit_time': current_time, 'details': {'account': 'A03', 'amount': 3500}},
        {'audit_id': next_id + 2, 'action': 'TRANSFER', 'user_id': 'C003', 'audit_date': today, 'audit_time': current_time, 'details': {'from': 'A06', 'to': 'A05', 'amount': 5000}},
        {'audit_id': next_id + 3, 'action': 'PWD', 'user_id': 'C001', 'audit_date': today, 'audit_time': current_time, 'details': {'reason': 'user_requested'}},
        {'audit_id': next_id + 4, 'action': 'ALERT', 'user_id': 'C002', 'audit_date': today, 'audit_time': current_time, 'details': {'type': 'login_attempt', 'location': 'unknown'}}
    ]
    
    for entry in audit_entries:
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
    anon_key = os.environ.get('SUPABASE_ANON_KEY')
    service_key = os.environ.get('SUPABASE_SERVICE_KEY')
    
    if not url or not anon_key:
        print("❌ Supabase credentials not configured")
        print("   Run: python setup_supabase.py --url URL --key KEY")
        return 1
    
    try:
        from supabase import create_client
        # Use service role key to bypass RLS policies for data insertion
        if service_key:
            print("  Using service role key (bypasses RLS policies)")
            supabase = create_client(url, service_key)
        else:
            print("  ⚠️  Using anon key - RLS policies may block inserts")
            supabase = create_client(url, anon_key)
        
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
