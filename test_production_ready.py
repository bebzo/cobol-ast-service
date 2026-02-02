#!/usr/bin/env python3
"""
Production Readiness Test - CodeSwitch v11.0
=============================================
Test that Supabase is properly configured and all modules work.

Usage:
    python test_production_ready.py

Auteur: MiniMax Agent
"""

import os
import sys
from datetime import datetime

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


def test_supabase_connection():
    """Test Supabase connection."""
    print("=" * 60)
    print("TEST 1: Supabase Connection")
    print("=" * 60)
    
    load_env()
    
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_ANON_KEY')
    
    if not url or not key:
        print("❌ SUPABASE_URL or SUPABASE_ANON_KEY not configured")
        return False
    
    print(f"   URL: {url}")
    print(f"   Key: {key[:30]}...")
    
    try:
        from supabase import create_client
        client = create_client(url, key)
        
        # Test each table
        tables = ['sessions', 'security_alerts', 'audit_trail', 'customers', 'accounts', 'transactions']
        
        for table in tables:
            try:
                result = client.table(table).select('count').limit(1).execute()
                print(f"   ✅ Table '{table}' accessible")
            except Exception as e:
                print(f"   ❌ Table '{table}' error: {e}")
                return False
        
        print("✅ Supabase connection: PASSED\n")
        return True
        
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}\n")
        return False


def test_external_calls():
    """Test external CALL modules."""
    print("=" * 60)
    print("TEST 2: External CALL Modules")
    print("=" * 60)
    
    try:
        from core.external_calls import (
            AuthModule, SecurityAlertModule, MetricsModule, AuditModule,
            OFACScreeningModule, FraudCheckModule,
            get_auth_module, get_security_module, get_metrics_module, get_audit_module
        )
        
        # Test Auth
        auth = AuthModule()
        print("   ✅ AuthModule imported and initialized")
        
        # Test Security
        security = SecurityAlertModule()
        result = security.send_alert('TEST', user_id='test_user')
        print(f"   ✅ SecurityAlertModule: alert sent ({result})")
        
        # Test Metrics
        metrics = MetricsModule()
        metrics.update(transaction_count=1, total_amount=100.50, transaction_type='DEPOSIT')
        print("   ✅ MetricsModule: updated")
        
        # Test Audit
        audit = AuditModule()
        audit_id = audit.log_action('TEST_ACTION', user_id='test_user')
        print(f"   ✅ AuditModule: action logged ({audit_id})")
        
        # Test OFAC
        ofac = OFACScreeningModule()
        result = ofac.search({'name': 'Test Entity'})
        print(f"   ✅ OFACScreeningModule: search completed (match={result['match_found']})")
        
        # Test Fraud Check
        fraud = FraudCheckModule()
        result = fraud.check({'transaction_amount': 100, 'card_present': True})
        print(f"   ✅ FraudCheckModule: check completed (recommendation={result['recommendation']})")
        
        print("✅ External CALL Modules: PASSED\n")
        return True
        
    except Exception as e:
        print(f"❌ External CALL Modules failed: {e}\n")
        import traceback
        traceback.print_exc()
        return False


def test_unit_tests():
    """Run unit tests."""
    print("=" * 60)
    print("TEST 3: Unit Tests")
    print("=" * 60)
    
    try:
        import subprocess
        result = subprocess.run(
            ['python3', '-m', 'pytest', 'tests/test_external_calls_new_modules.py', '-v', '--tb=short', '-q'],
            cwd='/workspace',
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            # Parse output for summary
            lines = result.stdout.split('\n')
            for line in lines:
                if 'passed' in line:
                    print(f"   ✅ {line}")
            print("✅ Unit Tests: PASSED\n")
            return True
        else:
            print(f"   ❌ Unit tests failed")
            print(result.stdout[-500:])
            print("❌ Unit Tests: FAILED\n")
            return False
            
    except Exception as e:
        print(f"   ❌ Error running tests: {e}")
        print("❌ Unit Tests: FAILED\n")
        return False


def test_migration_capability():
    """Test that migration can connect to Supabase."""
    print("=" * 60)
    print("TEST 4: Migration Capability")
    print("=" * 60)
    
    load_env()
    
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_ANON_KEY')
    
    if not url or not key:
        print("   ❌ No Supabase credentials configured")
        return False
    
    try:
        from api.supabase_dal import SupabaseConnection, SupabaseTable
        
        # Test connection
        conn = SupabaseConnection.get_instance(url, key)
        
        if conn.is_connected:
            print("   ✅ SupabaseConnection: connected")
            
            # Test table creation
            test_table = SupabaseTable('test_migration', primary_key='id')
            test_table.open("OUTPUT")
            test_table.write('test_key', {'id': 'test_key', 'data': 'test'})
            test_table.close()
            
            print("   ✅ Table write: successful")
            
            # Clean up test
            test_table.open("OUTPUT")
            test_table.delete('test_key')
            test_table.close()
            
            print("   ✅ Table delete: successful")
            print("✅ Migration Capability: PASSED\n")
            return True
        else:
            print("   ❌ SupabaseConnection: not connected")
            return False
            
    except Exception as e:
        print(f"   ❌ Migration test error: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("PRODUCTION READINESS TEST")
    print(f"Date: {datetime.now().isoformat()}")
    print("=" * 60 + "\n")
    
    results = []
    
    # Run tests
    results.append(("Supabase Connection", test_supabase_connection()))
    results.append(("External CALL Modules", test_external_calls()))
    results.append(("Unit Tests", test_unit_tests()))
    results.append(("Migration Capability", test_migration_capability()))
    
    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"   {name}: {status}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print("")
    print(f"Total: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("\n🎉 SYSTEM IS PRODUCTION READY! 🎉\n")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please review the errors above.\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
