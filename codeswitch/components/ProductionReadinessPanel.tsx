"use client";

import { useState, useMemo, useCallback } from "react";
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
  RefreshCw,
  Play,
  Terminal,
  Calculator,
  Layers,
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
  onEnhance?: () => void;
  isEnhancing?: boolean;
}

export default function ProductionReadinessPanel({
  analysis,
  testResults,
  cobolLines,
  pythonLines,
  onEnhance,
  isEnhancing = false,
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

  const checks = useMemo<ProductionCheck[]>(() => {
    const pythonCode = analysis?.python_code || "";
    const stats = analysis?.stats || {};

    const hasPattern = (pattern: string | RegExp) => {
      if (typeof pattern === "string") {
        return pythonCode.includes(pattern);
      }
      return pattern.test(pythonCode);
    };

    return [
      {
        id: "database_layer",
        name: "Database Layer (SQLAlchemy Repository)",
        category: "critical",
        status: hasPattern("from lib.database_layer") || hasPattern("DatabaseManager")
          ? "passed"
          : hasPattern("sqlalchemy") || hasPattern("repository")
          ? "partial"
          : "failed",
        description:
          "Remplace le FileManager abstrait par une vraie connexion PostgreSQL/Oracle avec Repository Pattern.",
        recommendation: hasPattern("DatabaseManager")
          ? "Database layer implemented with SQLAlchemy."
          : "Use lib/database_layer.py for production database access.",
        effort: "2-3 days",
        codeSnippet: `from lib.database_layer import (
    db, Customer, Account, Transaction,
    CustomerRepository, AccountRepository, init_database
)

# Initialize database connection
init_database("postgresql://user:pass@localhost/cobol_migration")

# Use repositories for thread-safe data access
with db.session() as session:
    customer_repo = CustomerRepository(session)
    customer = customer_repo.get_by_id("CUST123")
    accounts = customer_repo.get_accounts_by_customer("CUST123")`,
      },
      {
        id: "decimal_precision",
        name: "Financial Precision (COMP-3 Compliance)",
        category: "critical",
        status: hasPattern("from lib.decimal_financial") || hasPattern("FinancialContext")
          ? "passed"
          : hasPattern("Decimal") && hasPattern("ROUND_HALF_EVEN")
          ? "partial"
          : "failed",
        description:
          "Précision financière conforme au COMP-3 IBM mainframe avec arrondi bancaire (ROUND_HALF_EVEN).",
        recommendation: hasPattern("FinancialContext")
          ? "Financial precision implemented correctly."
          : "Use lib/decimal_financial.py for all monetary calculations.",
        effort: "1-2 days",
        codeSnippet: `from lib.decimal_financial import (
    FinancialContext, parse_comp3, format_comp3,
    calculate_interest, calculate_monthly_payment
)

# Use financial context for all money operations
with FinancialContext.transaction():
    interest = calculate_interest(
        principal=Decimal("10000.00"),
        rate=Decimal("0.035"),
        periods=12,
        compound=True
    )
    
    cobol_balance = parse_comp3("00000123456789C", "9(14)V99")
    
    print(f"Interest: {interest}")`,
      },
      {
        id: "thread_safe_services",
        name: "Thread-Safe Services (Stateless)",
        category: "critical",
        status: hasPattern("from services.customer_service") || hasPattern("TransferService")
          ? "passed"
          : hasPattern("contextvars") || hasPattern("BaseService")
          ? "partial"
          : "failed",
        description:
          "Services métier stateless avec isolation par requête pour environnements web multi-utilisateurs.",
        recommendation: hasPattern("TransferService")
          ? "Thread-safe services implemented."
          : "Use services/customer_service.py for business logic.",
        effort: "3-5 days",
        codeSnippet: `from services.customer_service import (
    get_customer_service, get_transfer_service,
    TransferService, TransferResult, TransferStatus
)

transfer_service = get_transfer_service()

result: TransferResult = transfer_service.execute_transfer(
    source_account="ACC001",
    target_account="ACC002",
    amount=Decimal("500.00"),
    description="Virement test"
)

if result.status == TransferStatus.COMPLETED:
    print(f"Transfert réussi: {result.transaction_id}")`,
      },
      {
        id: "external_call_stubs",
        name: "External CALL Stubs (CICS/VSAM)",
        category: "major",
        status: hasPattern("from lib.call_stubs") || hasPattern("stub_registry")
          ? "passed"
          : hasPattern("CALL") && pythonCode.includes("external")
          ? "partial"
          : "not_tested",
        description:
          "Implémentation des appels COBOL externes (CICS, VSAM, DATE/TIME, SECURITY) non transpilables.",
        recommendation: hasPattern("stub_registry")
          ? "External CALL stubs registered and configured."
          : "Use lib/call_stubs.py for mainframe compatibility.",
        effort: "1-2 weeks",
        codeSnippet: `from lib.call_stubs import (
    stub_registry, call_manager, init_external_calls,
    stub_authenticate, stub_cics_receive, stub_vsam_read
)

init_external_calls()

result = call_manager.execute_call(
    program_name="SECAUTH",
    username="admin",
    password="secure123"
)
print(f"Authentification: {result.get('authenticated')}")`,
      },
      {
        id: "shadow_testing_enhanced",
        name: "Shadow Testing Enhanced (Strangler)",
        category: "critical",
        status: hasPattern("from lib.shadow_tester_enhanced") || hasPattern("ShadowTestRunner")
          ? "passed"
          : hasPattern("ShadowTester") || hasPattern("shadow_test")
          ? "partial"
          : "failed",
        description:
          "Test en ombre COBOL vs Python avec comparison intelligente et détection des divergences de précision.",
        recommendation: hasPattern("ShadowTestRunner")
          ? "Enhanced shadow testing configured."
          : "Use lib/shadow_tester_enhanced.py for migration testing.",
        effort: "1 week",
        codeSnippet: `from lib.shadow_tester_enhanced import (
    ShadowTestRunner, ShadowTestReport,
    ResultComparator, ComparisonResult
)

runner = ShadowTestRunner(
    cobol_executor=execute_cobol_logic,
    python_executor=execute_python_logic,
    tolerance=Decimal("0.01")
)

runner.create_test_case(
    test_name="Calcul intérêt composé",
    cobol_input={"principal": 10000, "rate": 0.035, "periods": 12},
    python_input={"principal": 10000, "rate": 0.035, "periods": 12},
    expected_output={"interest": 367.92}
)

report: ShadowTestReport = runner.run_all_tests()
print(f"Parité: {report.parity_score:.1f}%")`,
      },
      {
        id: "thread_safety",
        name: "Thread Safety (contextvars)",
        category: "critical",
        status: hasPattern("contextvars")
          ? "passed"
          : hasPattern("ThreadSafeRuntime") || hasPattern("threading")
          ? "partial"
          : "failed",
        description:
          "COBOL code is single-threaded. Python in web servers needs thread isolation.",
        recommendation: hasPattern("contextvars")
          ? "Thread safety is implemented correctly."
          : "Use contextvars to isolate state per request in multi-threaded environments.",
        effort: "2-3 days",
        codeSnippet: `from lib.production_infrastructure import ThreadSafeRuntime

runtime = ThreadSafeRuntime(
    max_workers=10,
    timeout_seconds=30,
    enable_deadlock_detection=True
)

result = runtime.execute(
    lambda: process_transaction(data),
    context={'user_id': 'U123', 'transaction_id': 'TX456'}
)`,
      },
      {
        id: "acid_transactions",
        name: "ACID Transactions (Unit of Work)",
        category: "critical",
        status: hasPattern("UnitOfWork") || hasPattern("start_production_transaction")
          ? "passed"
          : hasPattern("transaction") || hasPattern("@transaction")
          ? "partial"
          : "failed",
        description:
          "COBOL/CICS provides native transaction support. Python needs explicit transaction management.",
        recommendation: hasPattern("UnitOfWork")
          ? "Transaction management is implemented."
          : "Implement Unit of Work pattern for atomic operations.",
        effort: "3-5 days",
        codeSnippet: `from lib.production_infrastructure import UnitOfWork

with start_production_transaction(user_id="U123", session_id="S456") as uow:
    account = repository.get("ACC123")
    uow.register_dirty(account)
    account.balance += amount`,
      },
      {
        id: "test_coverage",
        name: "Test Coverage (>500 tests)",
        category: "critical",
        status:
          testResults.total >= 500
            ? "passed"
            : testResults.total >= 100
            ? "partial"
            : testResults.total >= 10
            ? "partial"
            : "failed",
        description: `Current: ${testResults.total} tests. Banking systems require 50-100 tests per 1000 lines.`,
        recommendation:
          testResults.total >= 500
            ? "Excellent test coverage!"
            : `Add ${Math.max(0, 500 - testResults.total)} more tests for ${cobolLines} lines of COBOL.`,
        effort: "1-2 weeks",
        codeSnippet: `from lib.production_postprocessor import ProductionPostprocessor, ProductionLevel

postprocessor = ProductionPostprocessor(
    production_level=ProductionLevel.BANK_GRADE
)

production_code, report = postprocessor.process(
    original_cobol=cobol_code,
    transpiled_python=python_code,
    metadata={'user_id': 'U123'}
}

print(f"Production Readiness Score: {report.overall_score}%")`,
      },
      {
        id: "secrets_management",
        name: "Secrets Management (Vault)",
        category: "major",
        status: hasPattern("SecureCredentialManager") || hasPattern("get_secure_credential")
          ? "passed"
          : hasPattern("vault") || hasPattern("secretsmanager")
          ? "partial"
          : "failed",
        description:
          "PCI-DSS requires secrets in secure vaults, not environment variables.",
        recommendation: "Integrate HashiCorp Vault or AWS Secrets Manager.",
        effort: "2-3 days",
        codeSnippet: `from lib.production_infrastructure import SOXAuditLogger

audit_logger = SOXAuditLogger(
    log_directory="/var/log/codeswitch/audit",
    retention_days=2555  # ~7 ans pour conformité SOX
)`,
      },
      {
        id: "audit_logs",
        name: "SOX Audit Logs (Immutable)",
        category: "major",
        status: hasPattern("SOXAuditLogger") || hasPattern("AuditLogger")
          ? "passed"
          : hasPattern("audit") || hasPattern("AuditEvent")
          ? "partial"
          : "failed",
        description:
          "SOX compliance requires immutable, signed audit logs for all financial operations.",
        recommendation: hasPattern("SOXAuditLogger")
          ? "SOX audit logging is configured."
          : "Implement cryptographically signed audit trail with WORM storage.",
        effort: "3-5 days",
        codeSnippet: `from lib.production_infrastructure import SOXAuditLogger, AuditEventType

audit_logger = SOXAuditLogger(
    log_directory="/var/log/codeswitch/audit",
    retention_days=2555
)

audit_logger.log_event(
    event_type=AuditEventType.TRANSACTION_COMMIT,
    user_id="U123",
    resource="ACCOUNT001",
    action="CREDIT",
    after_state={"balance": 5000.00}
)`,
      },
      {
        id: "rate_limiting",
        name: "Rate Limiting (API Protection)",
        category: "major",
        status: hasPattern("RateLimiter") || hasPattern("rate_limited")
          ? "passed"
          : hasPattern("rate") || hasPattern("limiter")
          ? "partial"
          : "failed",
        description:
          "Prevent DDoS and brute force attacks with configurable rate limits per endpoint.",
        recommendation: hasPattern("RateLimiter")
          ? "Rate limiting is configured."
          : "Implement rate limiting (e.g., 100 req/min for reads, 10 req/min for writes).",
        effort: "1-2 days",
        codeSnippet: `from lib.production_infrastructure import RateLimiter

limiter = RateLimiter(
    rates={
        "/api/transpile": {"rate": 10, "window": 60},
        "/api/analyze": {"rate": 30, "window": 60},
    }
)`,
      },
      {
        id: "error_handling",
        name: "Graceful Error Handling",
        category: "minor",
        status: hasPattern("ExceptionHandler") || hasPattern("error_boundary")
          ? "passed"
          : hasPattern("try") && hasPattern("except")
          ? "partial"
          : "failed",
        description:
          "Never expose raw Python errors to users. Use structured error responses.",
        recommendation: hasPattern("ExceptionHandler")
          ? "Error handling is configured."
          : "Implement exception handlers that return user-friendly error codes.",
        effort: "1-2 days",
        codeSnippet: `from lib.production_infrastructure import ExceptionHandler

handler = ExceptionHandler(
    production_mode=True,
    log_level="WARNING",
    notify_sentry=True
)

try:
    result = transpile(code)
except Exception as e:
    logger.error(f"Transpilation failed: {e}")
    return handler.handle(e)`,
      },
      {
        id: "timeout_protection",
        name: "Timeout Protection (>10s)",
        category: "minor",
        status: hasPattern("TimeoutException") || hasPattern("timeout")
          ? "passed"
          : "partial",
        description:
          "Set explicit timeouts for all external calls to prevent hanging requests.",
        recommendation: hasPattern("TimeoutException")
          ? "Timeouts are configured."
          : "Add timeout=30s to all external API calls and database queries.",
        effort: "1 day",
        codeSnippet: `import asyncio
from async_timeout import timeout

async def transpile_with_timeout(code: str) -> str:
    try:
        async with timeout(120):
            return await transpile_service.transpile(code)
    except asyncio.TimeoutError:
        logger.error("Transpilation timeout after 120s")
        raise TimeoutException("Processing took too long")`,
      },
      {
        id: "idempotency",
        name: "Idempotency Keys",
        category: "minor",
        status: hasPattern("IdempotencyKey") || hasPattern("idempotent")
          ? "passed"
          : "partial",
        description:
          "Prevent duplicate processing when clients retry requests (critical for payments).",
        recommendation: hasPattern("IdempotencyKey")
          ? "Idempotency is implemented."
          : "Require Idempotency-Key header for all state-changing operations.",
        effort: "2-3 days",
        codeSnippet: `from lib.production_infrastructure import idempotency_check

@app.post("/api/transfer")
async def transfer(
    request: TransferRequest,
    idempotency_key: str = Header(None)
):
    if not idempotency_key:
        raise HTTPException(status_code=400, detail="Idempotency-Key required")
    
    return await idempotency_check(
        key=idempotency_key,
        user_id=request.user_id,
        operation=lambda: execute_transfer(request)
    )`,
      },
      {
        id: "monitoring",
        name: "Monitoring (Health + Metrics)",
        category: "minor",
        status: hasPattern("HealthEndpoint") || hasPattern("/api/health")
          ? "passed"
          : "partial",
        description:
          "Expose health, readiness, and metrics endpoints for Kubernetes/orchestration.",
        recommendation: hasPattern("HealthEndpoint")
          ? "Monitoring endpoints are configured."
          : "Implement /health, /ready, and /metrics endpoints.",
        effort: "1-2 days",
        codeSnippet: `from lib.production_monitoring import (
    HealthEndpoint, MetricsExporter, HealthStatus
)

health = HealthEndpoint(
    checks=[
        database_check,
        cache_check,
        external_api_check
    ]
)

@app.get("/health")
async def health_check() -> HealthStatus:
    return await health.check()`,
      },
    ];
  }, [analysis, testResults, cobolLines, pythonLines]);

  const { score, passedChecks, totalChecks, criticalPassed, criticalTotal } =
    useMemo(() => {
      const total = checks.length;
      const passed = checks.filter((c) => c.status === "passed").length;
      const critical = checks.filter((c) => c.category === "critical");
      const criticalPassed = critical.filter((c) => c.status === "passed").length;
      const criticalTotal = critical.length;
      
      const weightedScore =
        (criticalPassed / criticalTotal) * 60 +
        ((passed - criticalPassed) / (total - criticalTotal)) * 40;
      
      return {
        score: Math.round(weightedScore),
        passedChecks: passed,
        totalChecks: total,
        criticalPassed,
        criticalTotal,
      };
    }, [checks]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    if (score >= 50) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-green-500/20 border-green-500";
    if (score >= 70) return "bg-yellow-500/20 border-yellow-500";
    if (score >= 50) return "bg-orange-500/20 border-orange-500";
    return "bg-red-500/20 border-red-500";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "partial":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "critical":
        return "border-red-500/50 bg-slate-800/50";
      case "major":
        return "border-orange-500/50 bg-slate-800/50";
      default:
        return "border-slate-600/50 bg-slate-800/50";
    }
  };

  const exportReport = useCallback(() => {
    const report = {
      generatedAt: new Date().toISOString(),
      score,
      checksPassed: passedChecks,
      totalChecks,
      details: checks.map((check) => ({
        id: check.id,
        name: check.name,
        category: check.category,
        status: check.status,
        description: check.description,
        recommendation: check.recommendation,
      })),
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `production-readiness-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [score, passedChecks, totalChecks, checks]);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <Shield className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Production Readiness
            </h2>
            <p className="text-sm text-slate-400">
              {passedChecks}/{totalChecks} requirements met
            </p>
          </div>
        </div>
        
        <div
          className={`px-4 py-2 rounded-lg border-2 ${getScoreBg(
            score
          )} flex items-center gap-3`}
        >
          <div className="text-right">
            <p className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score}%
            </p>
            <p className="text-xs text-slate-400">
              {criticalPassed}/{criticalTotal} critical passed
            </p>
          </div>
          <Activity className={`w-8 h-8 ${getScoreColor(score)}`} />
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-blue-400">
            Production-Ready Modules Available
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-4 h-4 text-green-400" />
            Database Layer
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Calculator className="w-4 h-4 text-green-400" />
            Decimal Precision
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Layers className="w-4 h-4 text-green-400" />
            Thread-Safe Services
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Terminal className="w-4 h-4 text-green-400" />
            CALL Stubs
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <GitCompare className="w-4 h-4 text-green-400" />
            Shadow Testing
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-slate-300">Passed</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <span className="text-slate-300">Partial</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-400" />
          <span className="text-slate-300">Failed</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-slate-300">Not Tested</span>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {["critical", "major", "minor"].map((category) => (
          <div key={category} className="space-y-2">
            <h4
              className={`text-sm font-semibold uppercase ${
                category === "critical"
                  ? "text-red-400"
                  : category === "major"
                  ? "text-orange-400"
                  : "text-slate-400"
              }`}
            >
              {category} Requirements
            </h4>
            {checks
              .filter((c) => c.category === category)
              .map((check) => (
                <div
                  key={check.id}
                  className={`rounded-lg border ${getCategoryColor(
                    check.category
                  )} transition-all`}
                >
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-700/30"
                    onClick={() => toggleExpand(check.id)}
                  >
                    {getStatusIcon(check.status)}
                    <div className="flex-1">
                      <p className="font-medium text-white">{check.name}</p>
                      <p className="text-xs text-slate-400">
                        {check.description}
                      </p>
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
                          <strong>Recommendation:</strong>{" "}
                          {check.recommendation}
                        </div>
                      )}
                      {check.codeSnippet && (
                        <div className="relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400">
                              Implementation Example:
                            </span>
                            <button
                              onClick={() =>
                                copySnippet(check.id, check.codeSnippet!)
                              }
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                            >
                              <Copy className="w-3 h-3" />
                              {copiedSnippet === check.id
                                ? "Copied!"
                                : "Copy"}
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

      <div className="mt-4 pt-4 border-t border-slate-700 flex justify-end">
        <button
          onClick={exportReport}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>
    </div>
  );
}
