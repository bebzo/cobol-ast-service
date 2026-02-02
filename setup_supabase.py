#!/usr/bin/env python3
"""
Supabase Configuration Script - CodeSwitch v11.0
=================================================
Configure Supabase credentials and test connection.

Usage:
    python setup_supabase.py                    # Interactive setup
    python setup_supabase.py --url URL --key KEY  # Non-interactive
    python setup_supabase.py --test              # Test connection
    python setup_supabase.py --create-tables      # Create database tables

Auteur: MiniMax Agent
"""

import os
import sys
import argparse
from datetime import datetime

# Add workspace to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def load_env():
    """Load environment variables from .env file."""
    env_file = '.env'
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()


def save_env(url: str, anon_key: str, service_key: str = None, jwt_secret: str = None):
    """Save credentials to .env file."""
    env_file = '.env'
    
    # Load existing env
    load_env()
    
    # Generate JWT secret if not provided
    if not jwt_secret:
        import secrets
        jwt_secret = secrets.token_urlsafe(32)
    
    # Build env content
    lines = []
    lines.append("# ============================================================")
    lines.append("# COBOL-to-Python Transpiler - Environment Configuration")
    lines.append(f"# Generated: {datetime.now().isoformat()}")
    lines.append("# ============================================================")
    lines.append("")
    lines.append("# Environment")
    lines.append("ENVIRONMENT=development  # development | staging | production")
    lines.append("DEBUG=false")
    lines.append("")
    lines.append("# ============================================================")
    lines.append("# SUPABASE CONFIGURATION")
    lines.append("# ============================================================")
    lines.append(f"SUPABASE_URL={url}")
    lines.append(f"SUPABASE_ANON_KEY={anon_key}")
    if service_key:
        lines.append(f"SUPABASE_SERVICE_KEY={service_key}")
    lines.append("")
    lines.append("# ============================================================")
    lines.append("# Authentication")
    lines.append("# ============================================================")
    lines.append(f"JWT_SECRET={jwt_secret}")
    lines.append("SESSION_TIMEOUT_MINUTES=60")
    lines.append("MAX_LOGIN_ATTEMPTS=5")
    lines.append("LOCKOUT_DURATION_MINUTES=30")
    lines.append("")
    lines.append("# ============================================================")
    lines.append("# Security")
    lines.append("# ============================================================")
    lines.append("ALLOW_STUBS=false")
    lines.append("REQUIRE_AUTH=true")
    lines.append("LOG_LEVEL=INFO")
    lines.append("ENCRYPT_SENSITIVE_DATA=true")
    lines.append("")
    lines.append("# ============================================================")
    lines.append("# Business Rules")
    lines.append("# ============================================================")
    lines.append("OVERDRAFT_FEE=35.00")
    lines.append("MAX_SINGLE_TRANSACTION=100000.00")
    lines.append("FRAUD_THRESHOLD=100")
    lines.append("")
    lines.append("# ============================================================")
    lines.append("# DO NOT COMMIT THIS FILE TO VERSION CONTROL")
    lines.append("# ============================================================")
    
    with open(env_file, 'w') as f:
        f.write('\n'.join(lines))
    
    print(f"Credentials saved to {env_file}")
    return True


def test_connection(url: str = None, key: str = None):
    """Test Supabase connection."""
    load_env()
    
    url = url or os.environ.get('SUPABASE_URL')
    key = key or os.environ.get('SUPABASE_ANON_KEY')
    
    if not url or not key:
        print("SUPABASE_URL and SUPABASE_ANON_KEY not configured")
        print("   Run: python setup_supabase.py --url URL --key KEY")
        return False
    
    print(f"Testing connection to Supabase...")
    print(f"   URL: {url[:50]}...")
    
    try:
        from supabase import create_client
        client = create_client(url, key)
        
        # Test simple query
        result = client.table('customers').select('count').limit(1).execute()
        
        print("Connection successful!")
        print(f"   Client initialized: {client is not None}")
        
        # Check if tables exist
        try:
            tables = client.table('customers').select('*').limit(1).execute()
            print("   Tables accessible: Yes")
        except Exception:
            print("   Tables: Need to create (run --create-tables)")
        
        return True
        
    except ImportError:
        print("Supabase client not installed")
        print("   Run: uv pip install supabase")
        return False
    except Exception as e:
        print(f"Connection failed: {e}")
        return False


def create_tables():
    """Display SQL for creating database tables."""
    load_env()
    
    url = os.environ.get('SUPABASE_URL')
    service_key = os.environ.get('SUPABASE_SERVICE_KEY')
    
    if not url or not service_key:
        print("SUPABASE_URL and SUPABASE_SERVICE_KEY required for table creation")
        return False
    
    print("Creating database tables...")
    
    # Define tables to create
    tables_sql = """
-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address TEXT,
    user_agent TEXT
);

-- Security alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    alert_type TEXT NOT NULL,
    user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB DEFAULT '{}'
);

-- Audit trail table
CREATE TABLE IF NOT EXISTS audit_trail (
    audit_id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    user_id TEXT,
    resource TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB DEFAULT '{}'
);

-- Customers table (example)
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    customer_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table (example)
CREATE TABLE IF NOT EXISTS accounts (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    account_id TEXT UNIQUE NOT NULL,
    customer_id TEXT NOT NULL,
    account_type TEXT NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table (example)
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    transaction_id TEXT UNIQUE NOT NULL,
    account_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB DEFAULT '{}'
);
"""
    
    print("Table creation requires Supabase SQL editor")
    print("Please run the following SQL in Supabase Dashboard > SQL Editor:")
    print("")
    print("-" * 60)
    print(tables_sql)
    print("-" * 60)
    
    return True


def interactive_setup():
    """Interactive Supabase setup."""
    print("=" * 60)
    print("SUPABASE CONFIGURATION")
    print("=" * 60)
    print("")
    
    print("Step 1: Get your Supabase credentials")
    print("   1. Go to https://supabase.com/dashboard")
    print("   2. Select your project")
    print("   3. Go to Project Settings > API")
    print("   4. Copy the Project URL and anon key")
    print("")
    
    url = input("Enter SUPABASE_URL: ").strip()
    if not url:
        print("URL is required")
        return False
    
    if not url.startswith('https://'):
        print("URL must start with https://")
        return False
    
    anon_key = input("Enter SUPABASE_ANON_KEY: ").strip()
    if not anon_key:
        print("Anon key is required")
        return False
    
    service_key = input("Enter SUPABASE_SERVICE_KEY (optional, for admin): ").strip()
    
    print("")
    print("Step 2: Save credentials")
    
    if save_env(url, anon_key, service_key):
        print("")
        print("Step 3: Test connection")
        test_connection(url, anon_key)
        
        print("")
        print("Configuration complete!")
        print("   Next steps:")
        print("   1. Create database tables: python setup_supabase.py --create-tables")
        print("   2. Run migration: python api/migrate_to_supabase.py --all")
        print("")
    
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Supabase Configuration Script"
    )
    parser.add_argument(
        '--url',
        type=str,
        help='Supabase URL'
    )
    parser.add_argument(
        '--key',
        type=str,
        help='Supabase anon key'
    )
    parser.add_argument(
        '--service-key',
        type=str,
        help='Supabase service role key'
    )
    parser.add_argument(
        '--jwt-secret',
        type=str,
        help='JWT secret key'
    )
    parser.add_argument(
        '--test',
        action='store_true',
        help='Test Supabase connection'
    )
    parser.add_argument(
        '--create-tables',
        action='store_true',
        help='Create database tables'
    )
    parser.add_argument(
        '--non-interactive',
        action='store_true',
        help='Non-interactive mode'
    )
    
    args = parser.parse_args()
    
    if args.test:
        test_connection(args.url, args.key)
    elif args.create_tables:
        create_tables()
    elif args.url and args.key:
        save_env(args.url, args.key, args.service_key, args.jwt_secret)
        test_connection(args.url, args.key)
    elif args.non-interactive:
        print("Error: --url and --key required in non-interactive mode")
    else:
        interactive_setup()


if __name__ == "__main__":
    main()
