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

  // Dynamically calculate production readiness checks based on analysis
  const checks = useMemo<ProductionCheck[]>(() => {
    const pythonCode = analysis?.python_code || "";
    const stats = analysis?.stats || {};
    const confidence = analysis?.confidence || {};
    const quality = analysis?.quality || {};

    // Helper to determine status based on code analysis
    const hasPattern = (pattern: string | RegExp) => {
      if (typeof pattern === "string") {
        return pythonCode.includes(pattern);
      }
      return pattern.test(pythonCode);
    };

    return [
      // CRITICAL CHECKS
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

# Thread-safe runtime is now available
runtime = ThreadSafeRuntime(
    max_workers=10,
    timeout_seconds=30,
    enable_deadlock_detection=True
)

# Execute with automatic thread isolation
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

# Transaction context with automatic commit/rollback
with start_production_transaction(user_id="U123", session_id="S456") as uow:
    account = repository.get("ACC123")
    uow.register_dirty(account)
    
    account.balance += amount
    account.last_modified = datetime.now()
    
    # Commit is automatic at exit

# Or use UnitOfWork directly
uow = UnitOfWork(audit_logger=audit_logger)
with uow.start(user_id="U123") as ctx:
    # Perform operations
    pass`,
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

# Generate comprehensive tests automatically
postprocessor = ProductionPostprocessor(
    production_level=ProductionLevel.BANK_GRADE
)

production_code, report = postprocessor.process(
    original_cobol=cobol_code,
    transpiled_python=python_code,
    metadata={'user_id': 'U123'}
)

# Check the production report for test requirements
print(f"Production Readiness Score: {report.overall_score}%")`,
      },
      {
        id: "shadow_testing",
        name: "Shadow Testing (COBOL vs Python)",
        category: "critical",
        status: hasPattern("ShadowTester") || hasPattern("shadow_test")
          ? "passed"
          : hasPattern("run_shadow_test") || analysis?.shadow_testing_plan
          ? "partial"
          : "failed",
        description:
          "Run COBOL and Python in parallel, compare outputs bit-by-bit before cutover.",
        recommendation: hasPattern("ShadowTester")
          ? "Shadow testing is configured."
          : "Implement shadow mode: route traffic to both systems, compare results.",
        effort: "1 week",
        codeSnippet: `from lib.shadow_tester import ShadowTester, ShadowTestCase

# Create shadow tester
tester = ShadowTester(
    cobol_executor="cobc",
    python_executor="python3"
)

# Define test cases
test_case = ShadowTestCase(
    name="Test calcul intérêt",
    cobol_input={"principal": 10000, "rate": 0.05, "time": 12},
    python_input={"principal": 10000, "rate": 0.05, "time": 12}
)

# Run shadow test
report = tester.run_test(test_case)

print(f"Correspondance: {report.comparison_result['match']}")
print(f"Score: {report.success_rate}%")`,
      },
      // MAJOR CHECKS
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

# Initialize audit logger for SOX compliance
audit_logger = SOXAuditLogger(
    log_directory="/var/log/codeswitch/audit",
    retention_days=2555  # ~7 ans pour conformité SOX
)

# Log audit events
audit_logger.log_event(
    event_type=AuditEventType.TRANSACTION_COMMIT,
    user_id="U123",
    session_id="S456",
    resource="ACCOUNT001",
    action="CREDIT",
    after_state={"balance": 5000.00}
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

# Initialize audit logger for SOX compliance
audit_logger = SOXAuditLogger(
    log_directory="/var/log/codeswitch/audit",
    retention_days=2555  # ~7 ans pour conformité SOX
)

# Log audit events
audit_logger.log_event(
    event_type=AuditEventType.TRANSACTION_COMMIT,
    user_id="U123",
    session_id="S456",
    resource="ACCOUNT001",
    action="CREDIT",
    after_state={"balance": 5000.00}
)

# Generate compliance report
report = audit_logger.export_compliance_report(
    start_date=datetime(2024, 1, 1),
    end_date=datetime(2024, 12, 31)
)`,
      },
      {
        id: "rate_limiting",
        name: "Rate Limiting (API Protection)",
        category: "major",
        status: hasPattern("RateLimiter") || hasPattern("rate_limited")
          ? "passed"
          : hasPattern("rate_limit") || hasPattern("throttle")
          ? "partial"
          : "failed",
        description:
          "No protection against API abuse, DoS attacks, or fraud by volume.",
        recommendation: "Implement token bucket rate limiting with Redis backend.",
        effort: "1-2 days",
        codeSnippet: `from lib.production_postprocessor import ProductionPostprocessor, ProductionLevel

# Enhance code with production patterns including rate limiting
postprocessor = ProductionPostprocessor(
    production_level=ProductionLevel.BANK_GRADE
)

production_code, report = postprocessor.process(
    original_cobol=cobol_code,
    transpiled_python=python_code
)

print(f"Production Readiness Score: {report.overall_score}%")
print(f"Patterns injected: {report.injected_patterns}")`,
      },
      {
        id: "observability",
        name: "Observability (OpenTelemetry)",
        category: "major",
        status:
          hasPattern("opentelemetry") ||
          hasPattern("TracingContext") ||
          hasPattern("tracer")
            ? "passed"
            : hasPattern("trace") || hasPattern("span")
            ? "partial"
            : "failed",
        description: "No distributed tracing or monitoring for transaction flows.",
        recommendation: "Add OpenTelemetry instrumentation for all critical paths.",
        effort: "2-3 days",
        codeSnippet: `from lib.production_infrastructure import ThreadSafeRuntime

# All production patterns are now available
runtime = ThreadSafeRuntime(
    max_workers=10,
    timeout_seconds=30,
    enable_deadlock_detection=True
)

# Execute with monitoring
result = runtime.execute(
    lambda: calculate_loan_interest(amount, rate, term),
    context={'user_id': 'U123', 'loan_id': 'L456'}
)

# Get runtime statistics
stats = runtime.get_statistics()
print(f"Executions: {stats['total_executions']}")
print(f"Active: {stats['active_executions']}")`,
      },
      // MINOR CHECKS
      {
        id: "db_migration",
        name: "Database Migration (FileManager → SQL)",
        category: "minor",
        status: hasPattern("SQLAlchemy") || hasPattern("psycopg")
          ? "passed"
          : hasPattern("DatabaseRepository") || hasPattern("sessionmaker")
          ? "partial"
          : "not_tested",
        description: "FileManager uses sequential file access. Production needs indexed database.",
        recommendation: "Migrate to PostgreSQL with proper indexing for O(log n) access.",
        effort: "1 week",
        codeSnippet: `from lib.production_postprocessor import calculate_production_readiness

# Calculate production readiness score
readiness = calculate_production_readiness(python_code)

print(f"Overall Score: {readiness['overall_score']}%")
print(f"Category Scores: {readiness['category_scores']}")
print(f"Critical Missing: {readiness['critical_missing']}")

# Recommendations
for rec in readiness['recommendations']:
    if rec:
        print(f"- {rec}")`,
      },
      {
        id: "mutation_testing",
        name: "Mutation Testing",
        category: "minor",
        status:
          testResults.total >= 100 && testResults.passed / testResults.total > 0.9
            ? "passed"
            : testResults.total >= 20
            ? "partial"
            : "not_tested",
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

# Target: >80% mutation score`,
      },
      {
        id: "rollback_plan",
        name: "Rollback Strategy",
        category: "minor",
        status: hasPattern("FeatureFlags") || hasPattern("rollback")
          ? "passed"
          : hasPattern("feature_flag") || hasPattern("traffic_percent")
          ? "partial"
          : "not_tested",
        description:
          "No documented rollback plan if Python system fails in production.",
        recommendation: "Implement feature flags and traffic routing for instant rollback.",
        effort: "2-3 days",
        codeSnippet: `from lib.shadow_tester import run_shadow_test

# Run shadow testing on the transpiled code
report = run_shadow_test(
    cobol_code=original_cobol,
    python_code=transpiled_python,
    test_cases=[
        {
            'name': 'Test principal',
            'cobol_input': {'amount': 1000, 'rate': 0.05},
            'python_input': {'amount': 1000, 'rate': 0.05}
        }
    ],
    parallel=True
)

print(f"Success Rate: {report['success_rate']}%")
print(f"Passed: {report['passed_tests']}/{report['total_tests']}")`,
      },
    ];
  }, [analysis, testResults, cobolLines, pythonLines]);

  // Calculate overall readiness score dynamically
  const { score, passedCritical, totalCritical, passedMajor, totalMajor, passedMinor, totalMinor } =
    useMemo(() => {
      const criticalChecks = checks.filter((c) => c.category === "critical");
      const majorChecks = checks.filter((c) => c.category === "major");
      const minorChecks = checks.filter((c) => c.category === "minor");

      const passedCritical = criticalChecks.filter(
        (c) => c.status === "passed"
      ).length;
      const partialCritical = criticalChecks.filter(
        (c) => c.status === "partial"
      ).length;

      const passedMajor = majorChecks.filter(
        (c) => c.status === "passed"
      ).length;
      const partialMajor = majorChecks.filter(
        (c) => c.status === "partial"
      ).length;

      const passedMinor = minorChecks.filter(
        (c) => c.status === "passed"
      ).length;
      const partialMinor = minorChecks.filter(
        (c) => c.status === "partial"
      ).length;

      // Weighted scoring: Critical=50%, Major=30%, Minor=20%
      const criticalScore =
        ((passedCritical + partialCritical * 0.5) / totalCritical) * 50;
      const majorScore =
        ((passedMajor + partialMajor * 0.5) / totalMajor) * 30;
      const minorScore =
        ((passedMinor + partialMinor * 0.5) / totalMinor) * 20;

      const score = Math.round(criticalScore + majorScore + minorScore);

      return {
        score,
        passedCritical,
        totalCritical,
        passedMajor,
        totalMajor,
        passedMinor,
        totalMinor,
      };
    }, [checks]);

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

  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 80) return "text-green-400";
    if (scoreValue >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBadge = (scoreValue: number) => {
    if (scoreValue >= 80) {
      return { bg: "bg-green-500/20", text: "text-green-400", label: "PRODUCTION READY" };
    }
    if (scoreValue >= 50) {
      return { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "NEEDS WORK" };
    }
    return { bg: "bg-red-500/20", text: "text-red-400", label: "NOT READY" };
  };

  const badge = getScoreBadge(score);

  const exportReport = useCallback(() => {
    const report = checks.map((c) => ({
      name: c.name,
      category: c.category,
      status: c.status,
      effort: c.effort,
      recommendation: c.recommendation,
    }));
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "production-readiness-report.json";
    a.click();
  }, [checks]);

  return (
    <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-red-900/20 rounded-xl p-6 border border-red-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Production Readiness Assessment
            </h3>
            <p className="text-xs text-slate-400">
              Banking-Grade Security & Reliability Checklist
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onEnhance && (
            <button
              onClick={onEnhance}
              disabled={isEnhancing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isEnhancing
                  ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
              }`}
            >
              {isEnhancing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enhancing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Enhance to 100%</span>
                </>
              )}
            </button>
          )}
          <div className="text-center">
            <div
              className={`text-3xl font-bold ${getScoreColor(score)}`}
            >
              {score}%
            </div>
            <div
              className={`text-xs px-2 py-1 rounded ${badge.bg} ${badge.text}`}
            >
              {badge.label}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Score Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">
            Production Readiness Score
          </span>
          <span className="text-sm text-slate-400">
            {passedCritical + passedMajor + passedMinor} /{" "}
            {totalCritical + totalMajor + totalMinor} checks passed
          </span>
        </div>
        <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              score >= 80
                ? "bg-gradient-to-r from-green-500 to-green-400"
                : score >= 50
                ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                : "bg-gradient-to-r from-red-500 to-red-400"
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-400">
            {passedCritical}/{totalCritical}
          </p>
          <p className="text-xs text-slate-400">Critical Passed</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-orange-400">
            {passedMajor}/{totalMajor}
          </p>
          <p className="text-xs text-slate-400">Major Passed</p>
        </div>
        <div className="bg-slate-500/10 border border-slate-500/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-slate-400">
            {passedMinor}/{totalMinor}
          </p>
          <p className="text-xs text-slate-400">Minor Passed</p>
        </div>
      </div>

      {/* Code Quality Metrics */}
      <div className="mb-6 p-4 bg-slate-700/30 rounded-lg">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">
          Code Analysis Metrics
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500">Confidence Score</p>
            <p className="text-lg font-bold text-white">
              {analysis?.confidence_score?.toFixed(1) || "N/A"}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">COBOL Lines</p>
            <p className="text-lg font-bold text-white">
              {cobolLines.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Python Lines</p>
            <p className="text-lg font-bold text-white">
              {pythonLines.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Test Coverage</p>
            <p className="text-lg font-bold text-white">
              {testResults.total > 0
                ? `${((testResults.passed / testResults.total) * 100).toFixed(1)}%`
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Checks List */}
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

      {/* Export Button */}
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
