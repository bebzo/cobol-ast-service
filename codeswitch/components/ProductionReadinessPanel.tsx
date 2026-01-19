"use client";

import { useState } from "react";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Database,
  Activity,
  Clock,
  FileText,
  Zap,
  Server,
  GitCompare,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
} from "lucide-react";

interface ProductionCheck {
  id: string;
  name: string;
  category: "critical" | "major" | "minor";
  status: "passed" | "failed" | "partial" | "not_tested";
  description: string;
  recommendation?: string;
  codeSnippet?: string;
  effort: string;
}

interface ProductionReadinessProps {
  analysis: any;
  testResults: {
    total: number;
    passed: number;
    failed: number;
    details: { name: string; status: string; error?: string }[];
  };
  cobolLines: number;
  pythonLines: number;
}

export default function ProductionReadinessPanel({
  analysis,
  testResults,
  cobolLines,
  pythonLines,
}: ProductionReadinessProps) {
  const [expandedChecks, setExpandedChecks] = useState<string[]>([]);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedChecks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const copySnippet = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // Calculate production readiness checks
  const checks: ProductionCheck[] = [
    // CRITICAL
    {
      id: "thread_safety",
      name: "Thread Safety (contextvars)",
      category: "critical",
      status: analysis?.python_code?.includes("contextvars") ? "passed" : "failed",
      description: "COBOL code is single-threaded. Python in web servers needs thread isolation.",
      recommendation: "Use contextvars to isolate state per request in multi-threaded environments.",
      effort: "2-3 days",
      codeSnippet: `from contextvars import ContextVar
from typing import Dict, Any

# Thread-safe session context
current_session: ContextVar[Dict[str, Any]] = ContextVar('session', default={})

class ThreadSafeRuntime:
    """Thread-safe wrapper for COBOL runtime state."""
    
    @classmethod
    def get_state(cls) -> Dict[str, Any]:
        return current_session.get()
    
    @classmethod
    def set_state(cls, key: str, value: Any) -> None:
        state = current_session.get()
        state[key] = value
        current_session.set(state)
    
    @classmethod
    def reset(cls) -> None:
        current_session.set({})

# Usage in Flask/FastAPI:
# @app.before_request
# def init_session():
#     ThreadSafeRuntime.reset()`,
    },
    {
      id: "acid_transactions",
      name: "ACID Transactions (Unit of Work)",
      category: "critical",
      status: analysis?.python_code?.includes("@transaction") || analysis?.python_code?.includes("UnitOfWork") ? "passed" : "failed",
      description: "COBOL/CICS provides native transaction support. Python needs explicit transaction management.",
      recommendation: "Implement Unit of Work pattern for atomic operations.",
      effort: "3-5 days",
      codeSnippet: `from contextlib import contextmanager
from typing import List, Callable
import logging

class UnitOfWork:
    """ACID transaction manager - rollback on any failure."""
    
    def __init__(self):
        self._operations: List[Callable] = []
        self._rollbacks: List[Callable] = []
        self._committed = False
        self.logger = logging.getLogger(__name__)
    
    def register(self, operation: Callable, rollback: Callable):
        """Register an operation with its rollback."""
        self._operations.append(operation)
        self._rollbacks.append(rollback)
    
    def commit(self):
        """Execute all operations. Rollback on any failure."""
        executed = []
        try:
            for i, op in enumerate(self._operations):
                op()
                executed.append(i)
            self._committed = True
            self.logger.info(f"Transaction committed: {len(executed)} operations")
        except Exception as e:
            self.logger.error(f"Transaction failed: {e}")
            # Rollback in reverse order
            for i in reversed(executed):
                try:
                    self._rollbacks[i]()
                except Exception as rollback_error:
                    self.logger.error(f"Rollback failed: {rollback_error}")
            raise

@contextmanager
def transaction():
    """Context manager for transactions."""
    uow = UnitOfWork()
    try:
        yield uow
        uow.commit()
    except Exception:
        raise`,
    },
    {
      id: "test_coverage",
      name: "Test Coverage (>500 tests)",
      category: "critical",
      status: testResults.total >= 500 ? "passed" : testResults.total >= 100 ? "partial" : "failed",
      description: `Current: ${testResults.total} tests. Banking systems require 50-100 tests per 1000 lines.`,
      recommendation: `Add ${Math.max(0, 500 - testResults.total)} more tests for ${cobolLines} lines of COBOL.`,
      effort: "1-2 weeks",
      codeSnippet: `# Property-based testing with Hypothesis
from hypothesis import given, strategies as st
from decimal import Decimal

@given(st.decimals(min_value=0, max_value=999999999, places=2))
def test_deposit_never_loses_money(amount):
    """Property: deposits always increase balance by exact amount."""
    account = Account(balance=Decimal("0"))
    account.deposit(amount)
    assert account.balance == amount

@given(
    st.decimals(min_value=100, max_value=999999, places=2),
    st.decimals(min_value=0, max_value=99, places=2)
)
def test_withdrawal_never_exceeds_balance(balance, withdrawal):
    """Property: withdrawal never makes balance negative."""
    account = Account(balance=balance)
    if withdrawal <= balance:
        account.withdraw(withdrawal)
        assert account.balance >= Decimal("0")

# Mutation testing configuration (mutmut)
# mutmut run --paths-to-mutate=api/`,
    },
    {
      id: "shadow_testing",
      name: "Shadow Testing (COBOL vs Python)",
      category: "critical",
      status: analysis?.shadow_testing_plan ? "partial" : "failed",
      description: "Run COBOL and Python in parallel, compare outputs bit-by-bit before cutover.",
      recommendation: "Implement shadow mode: route traffic to both systems, compare results.",
      effort: "1 week",
      codeSnippet: `import hashlib
from decimal import Decimal
from typing import Dict, Any, Tuple
import logging

class ShadowTester:
    """Compare COBOL and Python outputs in production."""
    
    def __init__(self):
        self.logger = logging.getLogger("shadow_test")
        self.discrepancies = []
    
    def compare(
        self, 
        cobol_result: Dict[str, Any], 
        python_result: Dict[str, Any],
        transaction_id: str
    ) -> Tuple[bool, list]:
        """Compare outputs, return (match, differences)."""
        differences = []
        
        for key in set(cobol_result.keys()) | set(python_result.keys()):
            cobol_val = cobol_result.get(key)
            python_val = python_result.get(key)
            
            # Decimal comparison with tolerance
            if isinstance(cobol_val, Decimal) and isinstance(python_val, Decimal):
                if abs(cobol_val - python_val) > Decimal("0.01"):
                    differences.append({
                        "field": key,
                        "cobol": str(cobol_val),
                        "python": str(python_val),
                        "delta": str(abs(cobol_val - python_val))
                    })
            elif cobol_val != python_val:
                differences.append({
                    "field": key,
                    "cobol": str(cobol_val),
                    "python": str(python_val)
                })
        
        if differences:
            self.logger.warning(f"Shadow test MISMATCH [{transaction_id}]: {differences}")
            self.discrepancies.append({"id": transaction_id, "diffs": differences})
        
        return len(differences) == 0, differences`,
    },
    // MAJOR
    {
      id: "secrets_management",
      name: "Secrets Management (Vault)",
      category: "major",
      status: analysis?.python_code?.includes("get_secure_credential") ? "partial" : "failed",
      description: "PCI-DSS requires secrets in secure vaults, not environment variables.",
      recommendation: "Integrate HashiCorp Vault or AWS Secrets Manager.",
      effort: "2-3 days",
      codeSnippet: `import os
from functools import lru_cache
from typing import Optional
import logging

class SecureCredentialManager:
    """Production-grade secrets management."""
    
    def __init__(self):
        self.backend = os.getenv("SECRETS_BACKEND", "env")
        self.logger = logging.getLogger(__name__)
        self._vault_client = None
    
    def _get_vault_client(self):
        if self._vault_client is None:
            import hvac
            self._vault_client = hvac.Client(
                url=os.getenv("VAULT_ADDR", "http://localhost:8200"),
                token=os.getenv("VAULT_TOKEN")
            )
        return self._vault_client
    
    @lru_cache(maxsize=100)
    def get_secret(self, name: str, default: Optional[str] = None) -> str:
        """Get secret from configured backend."""
        if self.backend == "vault":
            try:
                client = self._get_vault_client()
                secret = client.secrets.kv.read_secret_version(path=name)
                return secret["data"]["data"]["value"]
            except Exception as e:
                self.logger.error(f"Vault error: {e}")
                if default is not None:
                    return default
                raise
        
        elif self.backend == "aws":
            import boto3
            client = boto3.client("secretsmanager")
            response = client.get_secret_value(SecretId=name)
            return response["SecretString"]
        
        else:  # env fallback
            value = os.getenv(name.upper().replace("-", "_"))
            if value is None and default is None:
                raise ValueError(f"Secret {name} not found")
            return value or default

# Global instance
secrets = SecureCredentialManager()`,
    },
    {
      id: "audit_logs",
      name: "SOX Audit Logs (Immutable)",
      category: "major",
      status: analysis?.python_code?.includes("AuditLogger") ? "passed" : "failed",
      description: "SOX compliance requires immutable, signed audit logs for all financial operations.",
      recommendation: "Implement cryptographically signed audit trail with WORM storage.",
      effort: "3-5 days",
      codeSnippet: `import hashlib
import json
import time
from dataclasses import dataclass, asdict
from typing import Optional
import logging

@dataclass
class AuditEntry:
    timestamp: float
    event_type: str
    user_id: str
    action: str
    details: dict
    previous_hash: str
    signature: str = ""

class SOXAuditLogger:
    """Immutable audit log for SOX compliance."""
    
    def __init__(self, signing_key: str):
        self.signing_key = signing_key
        self.last_hash = "GENESIS"
        self.logger = logging.getLogger("audit")
    
    def _compute_hash(self, entry: AuditEntry) -> str:
        data = json.dumps(asdict(entry), sort_keys=True)
        return hashlib.sha256(data.encode()).hexdigest()
    
    def _sign(self, data: str) -> str:
        import hmac
        return hmac.new(
            self.signing_key.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
    
    def log(
        self,
        event_type: str,
        user_id: str,
        action: str,
        details: dict
    ) -> AuditEntry:
        """Create immutable, signed audit entry."""
        entry = AuditEntry(
            timestamp=time.time(),
            event_type=event_type,
            user_id=user_id,
            action=action,
            details=details,
            previous_hash=self.last_hash
        )
        
        entry_hash = self._compute_hash(entry)
        entry.signature = self._sign(entry_hash)
        self.last_hash = entry_hash
        
        # Write to WORM storage
        self._persist(entry)
        
        return entry
    
    def _persist(self, entry: AuditEntry):
        # In production: Write to append-only storage (S3 Object Lock, etc.)
        self.logger.info(f"AUDIT: {json.dumps(asdict(entry))}")

# Usage:
# audit = SOXAuditLogger(signing_key=secrets.get_secret("audit-key"))
# audit.log("TRANSACTION", user_id, "TRANSFER", {"amount": "1000.00", "to": "ACC123"})`,
    },
    {
      id: "rate_limiting",
      name: "Rate Limiting (API Protection)",
      category: "major",
      status: "failed",
      description: "No protection against API abuse, DoS attacks, or fraud by volume.",
      recommendation: "Implement token bucket rate limiting with Redis backend.",
      effort: "1-2 days",
      codeSnippet: `import time
from typing import Dict, Tuple
from functools import wraps

class RateLimiter:
    """Token bucket rate limiter."""
    
    def __init__(self, requests_per_minute: int = 60, burst: int = 10):
        self.rate = requests_per_minute / 60  # tokens per second
        self.burst = burst
        self.buckets: Dict[str, Tuple[float, float]] = {}  # key -> (tokens, last_update)
    
    def allow(self, key: str) -> Tuple[bool, dict]:
        """Check if request is allowed."""
        now = time.time()
        tokens, last_update = self.buckets.get(key, (self.burst, now))
        
        # Add tokens based on time elapsed
        elapsed = now - last_update
        tokens = min(self.burst, tokens + elapsed * self.rate)
        
        if tokens >= 1:
            self.buckets[key] = (tokens - 1, now)
            return True, {"remaining": int(tokens - 1), "reset": int(1 / self.rate)}
        else:
            self.buckets[key] = (tokens, now)
            retry_after = (1 - tokens) / self.rate
            return False, {"retry_after": int(retry_after)}

rate_limiter = RateLimiter(requests_per_minute=100, burst=20)

def rate_limited(key_func=lambda: "global"):
    """Decorator for rate limiting."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = key_func()
            allowed, info = rate_limiter.allow(key)
            if not allowed:
                raise Exception(f"Rate limited. Retry after {info['retry_after']}s")
            return func(*args, **kwargs)
        return wrapper
    return decorator`,
    },
    {
      id: "observability",
      name: "Observability (OpenTelemetry)",
      category: "major",
      status: analysis?.python_code?.includes("opentelemetry") || analysis?.python_code?.includes("TracingContext") ? "partial" : "failed",
      description: "No distributed tracing or monitoring for transaction flows.",
      recommendation: "Add OpenTelemetry instrumentation for all critical paths.",
      effort: "2-3 days",
      codeSnippet: `from contextlib import contextmanager
from typing import Optional, Dict, Any
import time
import logging

class Span:
    def __init__(self, name: str, attributes: Dict[str, Any] = None):
        self.name = name
        self.attributes = attributes or {}
        self.start_time = time.time()
        self.end_time: Optional[float] = None
    
    def set_attribute(self, key: str, value: Any):
        self.attributes[key] = value
    
    def end(self):
        self.end_time = time.time()

class Tracer:
    """OpenTelemetry-compatible tracer (lightweight implementation)."""
    
    def __init__(self, service_name: str = "cobol-python"):
        self.service_name = service_name
        self.logger = logging.getLogger("tracing")
        self._spans = []
    
    @contextmanager
    def start_span(self, name: str, attributes: Dict[str, Any] = None):
        span = Span(name, attributes)
        self._spans.append(span)
        try:
            yield span
        except Exception as e:
            span.set_attribute("error", True)
            span.set_attribute("error.message", str(e))
            raise
        finally:
            span.end()
            self._export(span)
    
    def _export(self, span: Span):
        duration_ms = (span.end_time - span.start_time) * 1000
        self.logger.info(
            f"TRACE [{self.service_name}] {span.name} "
            f"duration={duration_ms:.2f}ms attrs={span.attributes}"
        )

# Global tracer
tracer = Tracer()

# Usage:
# with tracer.start_span("process_transaction", {"tx_id": "123"}) as span:
#     result = process(...)
#     span.set_attribute("amount", str(result.amount))`,
    },
    // MINOR
    {
      id: "db_migration",
      name: "Database Migration (FileManager → SQL)",
      category: "minor",
      status: analysis?.python_code?.includes("SQLAlchemy") || analysis?.python_code?.includes("psycopg") ? "passed" : "failed",
      description: "FileManager uses sequential file access. Production needs indexed database.",
      recommendation: "Migrate to PostgreSQL with proper indexing for O(log n) access.",
      effort: "1 week",
      codeSnippet: `from sqlalchemy import create_engine, Column, String, Numeric, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Optional
import os

Base = declarative_base()

class CustomerRecord(Base):
    """CUSTOMER-MASTER migrated to SQL."""
    __tablename__ = 'customers'
    
    cust_id = Column(String(12), primary_key=True)
    cust_name = Column(String(50))
    cust_total_balance = Column(Numeric(17, 2))
    cust_status = Column(String(1), index=True)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

class DatabaseRepository:
    """SQL-based repository replacing FileManager."""
    
    def __init__(self):
        db_url = os.getenv("DATABASE_URL", "postgresql://localhost/cobol_migration")
        self.engine = create_engine(db_url, pool_size=20, max_overflow=30)
        self.Session = sessionmaker(bind=self.engine)
    
    def read_by_key(self, key: str) -> Optional[CustomerRecord]:
        """O(log n) access via primary key index."""
        with self.Session() as session:
            return session.query(CustomerRecord).get(key)
    
    def write_record(self, record: CustomerRecord) -> bool:
        with self.Session() as session:
            session.merge(record)
            session.commit()
            return True`,
    },
    {
      id: "mutation_testing",
      name: "Mutation Testing",
      category: "minor",
      status: "not_tested",
      description: "Verify test quality by introducing code mutations.",
      recommendation: "Run mutmut or cosmic-ray to validate test effectiveness.",
      effort: "2-3 days",
      codeSnippet: `# Install: pip install mutmut
# Run: mutmut run --paths-to-mutate=api/

# Configuration in setup.cfg:
[mutmut]
paths_to_mutate=api/
tests_dir=tests/
runner=pytest -x --tb=no -q

# Mutation testing validates that tests actually catch bugs
# by introducing small changes (mutations) and verifying tests fail

# Example mutations:
# - Change == to !=
# - Change + to -
# - Change > to >=
# - Remove lines

# Target: >80% mutation score (mutations killed by tests)`,
    },
    {
      id: "rollback_plan",
      name: "Rollback Strategy",
      category: "minor",
      status: "not_tested",
      description: "No documented rollback plan if Python system fails in production.",
      recommendation: "Implement feature flags and traffic routing for instant rollback.",
      effort: "2-3 days",
      codeSnippet: `import os
from typing import Callable, Any

class FeatureFlags:
    """Feature flags for gradual rollout and instant rollback."""
    
    def __init__(self):
        self.flags = {
            "use_python_engine": os.getenv("USE_PYTHON_ENGINE", "false") == "true",
            "python_traffic_percent": int(os.getenv("PYTHON_TRAFFIC_PERCENT", "0")),
            "enable_shadow_mode": os.getenv("SHADOW_MODE", "true") == "true",
        }
    
    def should_use_python(self, transaction_id: str) -> bool:
        """Determine if this transaction should use Python."""
        if not self.flags["use_python_engine"]:
            return False
        
        # Percentage-based routing
        hash_val = hash(transaction_id) % 100
        return hash_val < self.flags["python_traffic_percent"]
    
    def route_transaction(
        self,
        transaction_id: str,
        cobol_handler: Callable,
        python_handler: Callable
    ) -> Any:
        """Route to appropriate handler with shadow testing."""
        use_python = self.should_use_python(transaction_id)
        
        if self.flags["enable_shadow_mode"]:
            # Run both, compare, return COBOL result
            cobol_result = cobol_handler()
            python_result = python_handler()
            self._compare_results(transaction_id, cobol_result, python_result)
            return cobol_result
        
        return python_handler() if use_python else cobol_handler()

flags = FeatureFlags()`,
    },
  ];

  // Calculate overall readiness score
  const passedCritical = checks.filter((c) => c.category === "critical" && c.status === "passed").length;
  const totalCritical = checks.filter((c) => c.category === "critical").length;
  const passedMajor = checks.filter((c) => c.category === "major" && (c.status === "passed" || c.status === "partial")).length;
  const totalMajor = checks.filter((c) => c.category === "major").length;
  const passedMinor = checks.filter((c) => c.category === "minor" && c.status === "passed").length;
  const totalMinor = checks.filter((c) => c.category === "minor").length;

  const score = Math.round(
    (passedCritical / totalCritical) * 50 +
    (passedMajor / totalMajor) * 30 +
    (passedMinor / totalMinor) * 20
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "partial":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "critical":
        return "border-red-500/50 bg-red-500/10";
      case "major":
        return "border-orange-500/50 bg-orange-500/10";
      default:
        return "border-slate-500/50 bg-slate-500/10";
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-red-900/20 rounded-xl p-6 border border-red-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Production Readiness Assessment</h3>
            <p className="text-xs text-slate-400">Banking-Grade Security & Reliability Checklist</p>
          </div>
        </div>
        <div className="text-center">
          <div className={`text-3xl font-bold ${score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {score}%
          </div>
          <div className={`text-xs px-2 py-1 rounded ${
            score >= 80 ? 'bg-green-500/20 text-green-400' :
            score >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {score >= 80 ? 'PRODUCTION READY' : score >= 50 ? 'NEEDS WORK' : 'NOT READY'}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{passedCritical}/{totalCritical}</p>
          <p className="text-xs text-slate-400">Critical Passed</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-orange-400">{passedMajor}/{totalMajor}</p>
          <p className="text-xs text-slate-400">Major Passed</p>
        </div>
        <div className="bg-slate-500/10 border border-slate-500/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-slate-400">{passedMinor}/{totalMinor}</p>
          <p className="text-xs text-slate-400">Minor Passed</p>
        </div>
      </div>

      {/* Checks List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {["critical", "major", "minor"].map((category) => (
          <div key={category} className="space-y-2">
            <h4 className={`text-sm font-semibold uppercase ${
              category === "critical" ? "text-red-400" :
              category === "major" ? "text-orange-400" : "text-slate-400"
            }`}>
              {category} Requirements
            </h4>
            {checks
              .filter((c) => c.category === category)
              .map((check) => (
                <div
                  key={check.id}
                  className={`rounded-lg border ${getCategoryColor(check.category)} transition-all`}
                >
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-700/30"
                    onClick={() => toggleExpand(check.id)}
                  >
                    {getStatusIcon(check.status)}
                    <div className="flex-1">
                      <p className="font-medium text-white">{check.name}</p>
                      <p className="text-xs text-slate-400">{check.description}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300">
                      {check.effort}
                    </span>
                    {expandedChecks.includes(check.id) ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  
                  {expandedChecks.includes(check.id) && (
                    <div className="px-3 pb-3 space-y-3 border-t border-slate-700">
                      {check.recommendation && (
                        <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-sm text-blue-300">
                          <strong>Recommendation:</strong> {check.recommendation}
                        </div>
                      )}
                      {check.codeSnippet && (
                        <div className="relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400">Implementation Example:</span>
                            <button
                              onClick={() => copySnippet(check.id, check.codeSnippet!)}
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                            >
                              <Copy className="w-3 h-3" />
                              {copiedSnippet === check.id ? "Copied!" : "Copy"}
                            </button>
                          </div>
                          <pre className="bg-slate-900 rounded p-3 text-xs text-slate-300 overflow-x-auto max-h-64">
                            <code>{check.codeSnippet}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* Export Button */}
      <div className="mt-4 pt-4 border-t border-slate-700 flex justify-end">
        <button
          onClick={() => {
            const report = checks.map((c) => ({
              name: c.name,
              category: c.category,
              status: c.status,
              effort: c.effort,
              recommendation: c.recommendation,
            }));
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "production-readiness-report.json";
            a.click();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>
    </div>
  );
}
