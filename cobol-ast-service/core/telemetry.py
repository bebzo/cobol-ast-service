"""
MegaEnterpriseSystem - OpenTelemetry Module
Traces, métriques et observabilité
"""
import os
import time
import logging
from typing import Optional, Dict, Any, Callable
from functools import wraps
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal

# OpenTelemetry imports
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import ConsoleMetricExporter, PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes

logger = logging.getLogger(__name__)


# ============================================
# CONFIGURATION
# ============================================

@dataclass
class TelemetryConfig:
    """Configuration OpenTelemetry"""
    service_name: str = "mega-enterprise-system"
    service_version: str = "3.0.0"
    environment: str = "development"
    otlp_endpoint: str = None
    enable_console_export: bool = True
    metrics_export_interval_ms: int = 60000
    
    def __post_init__(self):
        self.otlp_endpoint = os.environ.get('OTEL_EXPORTER_OTLP_ENDPOINT', self.otlp_endpoint)
        self.environment = os.environ.get('ENVIRONMENT', self.environment)


# Global config
_config = TelemetryConfig()
_tracer: Optional[trace.Tracer] = None
_meter: Optional[metrics.Meter] = None
_initialized = False


# ============================================
# INITIALIZATION
# ============================================

def init_telemetry(config: TelemetryConfig = None) -> None:
    """
    Initialise OpenTelemetry avec traces et métriques
    """
    global _config, _tracer, _meter, _initialized
    
    if _initialized:
        logger.warning("Telemetry already initialized")
        return
    
    if config:
        _config = config
    
    # Resource avec métadonnées du service
    resource = Resource.create({
        ResourceAttributes.SERVICE_NAME: _config.service_name,
        ResourceAttributes.SERVICE_VERSION: _config.service_version,
        ResourceAttributes.DEPLOYMENT_ENVIRONMENT: _config.environment,
    })
    
    # ---- TRACES ----
    tracer_provider = TracerProvider(resource=resource)
    
    if _config.enable_console_export:
        tracer_provider.add_span_processor(
            BatchSpanProcessor(ConsoleSpanExporter())
        )
    
    # OTLP exporter (si configuré)
    if _config.otlp_endpoint:
        try:
            from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
            otlp_exporter = OTLPSpanExporter(endpoint=_config.otlp_endpoint)
            tracer_provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
            logger.info(f"OTLP trace exporter configured: {_config.otlp_endpoint}")
        except ImportError:
            logger.warning("OTLP exporter not available, using console only")
    
    trace.set_tracer_provider(tracer_provider)
    _tracer = trace.get_tracer(_config.service_name, _config.service_version)
    
    # ---- METRICS ----
    readers = []
    
    if _config.enable_console_export:
        readers.append(PeriodicExportingMetricReader(
            ConsoleMetricExporter(),
            export_interval_millis=_config.metrics_export_interval_ms
        ))
    
    meter_provider = MeterProvider(resource=resource, metric_readers=readers)
    metrics.set_meter_provider(meter_provider)
    _meter = metrics.get_meter(_config.service_name, _config.service_version)
    
    _initialized = True
    logger.info(f"Telemetry initialized for {_config.service_name} v{_config.service_version}")


def get_tracer() -> trace.Tracer:
    """Retourne le tracer global"""
    if not _initialized:
        init_telemetry()
    return _tracer


def get_meter() -> metrics.Meter:
    """Retourne le meter global"""
    if not _initialized:
        init_telemetry()
    return _meter


# ============================================
# MÉTRIQUES PRÉ-DÉFINIES
# ============================================

class BankingMetrics:
    """Métriques métier pour le module bancaire"""
    
    def __init__(self):
        meter = get_meter()
        
        # Compteurs
        self.transactions_total = meter.create_counter(
            name="banking.transactions.total",
            description="Total number of transactions processed",
            unit="1"
        )
        
        self.deposits_total = meter.create_counter(
            name="banking.deposits.total",
            description="Total deposit amount",
            unit="USD"
        )
        
        self.withdrawals_total = meter.create_counter(
            name="banking.withdrawals.total",
            description="Total withdrawal amount",
            unit="USD"
        )
        
        self.errors_total = meter.create_counter(
            name="banking.errors.total",
            description="Total number of errors",
            unit="1"
        )
        
        # Histogrammes
        self.transaction_duration = meter.create_histogram(
            name="banking.transaction.duration",
            description="Transaction processing duration",
            unit="ms"
        )
        
        self.transaction_amount = meter.create_histogram(
            name="banking.transaction.amount",
            description="Transaction amount distribution",
            unit="USD"
        )
        
        # Gauges (via callback)
        self._active_accounts = 0
        meter.create_observable_gauge(
            name="banking.accounts.active",
            callbacks=[lambda options: [(self._active_accounts, {})]],
            description="Number of active accounts",
            unit="1"
        )
    
    def record_transaction(self, txn_type: str, amount: float, duration_ms: float, success: bool):
        """Enregistre les métriques d'une transaction"""
        attributes = {"type": txn_type, "status": "success" if success else "error"}
        
        self.transactions_total.add(1, attributes)
        self.transaction_duration.record(duration_ms, attributes)
        self.transaction_amount.record(amount, {"type": txn_type})
        
        if txn_type == "deposit":
            self.deposits_total.add(amount, {})
        elif txn_type == "withdrawal":
            self.withdrawals_total.add(amount, {})
        
        if not success:
            self.errors_total.add(1, {"type": txn_type})
    
    def set_active_accounts(self, count: int):
        """Met à jour le nombre de comptes actifs"""
        self._active_accounts = count


# ============================================
# DÉCORATEURS DE TRACING
# ============================================

def traced(span_name: str = None, attributes: Dict[str, Any] = None):
    """
    Décorateur pour tracer une fonction
    
    Usage:
        @traced("process_payment")
        def process_payment(amount):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            tracer = get_tracer()
            name = span_name or func.__name__
            
            with tracer.start_as_current_span(name) as span:
                if attributes:
                    for key, value in attributes.items():
                        span.set_attribute(key, value)
                
                try:
                    result = func(*args, **kwargs)
                    span.set_status(trace.Status(trace.StatusCode.OK))
                    return result
                except Exception as e:
                    span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
                    span.record_exception(e)
                    raise
        
        return wrapper
    return decorator


def traced_async(span_name: str = None, attributes: Dict[str, Any] = None):
    """Décorateur pour tracer une fonction async"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            tracer = get_tracer()
            name = span_name or func.__name__
            
            with tracer.start_as_current_span(name) as span:
                if attributes:
                    for key, value in attributes.items():
                        span.set_attribute(key, value)
                
                try:
                    result = await func(*args, **kwargs)
                    span.set_status(trace.Status(trace.StatusCode.OK))
                    return result
                except Exception as e:
                    span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
                    span.record_exception(e)
                    raise
        
        return wrapper
    return decorator


def timed(metric_name: str = None):
    """
    Décorateur pour mesurer la durée d'exécution
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            meter = get_meter()
            name = metric_name or f"{func.__name__}.duration"
            histogram = meter.create_histogram(name, unit="ms")
            
            start = time.perf_counter()
            try:
                return func(*args, **kwargs)
            finally:
                duration_ms = (time.perf_counter() - start) * 1000
                histogram.record(duration_ms, {"function": func.__name__})
        
        return wrapper
    return decorator


# ============================================
# CONTEXT MANAGERS
# ============================================

@contextmanager
def span_context(name: str, attributes: Dict[str, Any] = None):
    """
    Context manager pour créer un span
    
    Usage:
        with span_context("process_batch", {"batch_size": 100}):
            ...
    """
    tracer = get_tracer()
    with tracer.start_as_current_span(name) as span:
        if attributes:
            for key, value in attributes.items():
                span.set_attribute(key, str(value))
        yield span


@contextmanager
def timer_context(name: str):
    """
    Context manager pour mesurer le temps
    
    Usage:
        with timer_context("database_query") as timer:
            ...
        print(f"Duration: {timer.duration_ms}ms")
    """
    @dataclass
    class Timer:
        start_time: float = field(default_factory=time.perf_counter)
        end_time: float = 0.0
        duration_ms: float = 0.0
    
    timer = Timer()
    try:
        yield timer
    finally:
        timer.end_time = time.perf_counter()
        timer.duration_ms = (timer.end_time - timer.start_time) * 1000


# ============================================
# HEALTH CHECK
# ============================================

@dataclass
class HealthStatus:
    """Statut de santé du système"""
    status: str = "healthy"  # healthy, degraded, unhealthy
    timestamp: datetime = field(default_factory=datetime.now)
    checks: Dict[str, bool] = field(default_factory=dict)
    details: Dict[str, Any] = field(default_factory=dict)
    
    def is_healthy(self) -> bool:
        return self.status == "healthy"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "timestamp": self.timestamp.isoformat(),
            "checks": self.checks,
            "details": self.details,
        }


class HealthChecker:
    """Gestionnaire de health checks"""
    
    def __init__(self):
        self._checks: Dict[str, Callable[[], bool]] = {}
    
    def register_check(self, name: str, check_fn: Callable[[], bool]):
        """Enregistre un health check"""
        self._checks[name] = check_fn
    
    def run_checks(self) -> HealthStatus:
        """Exécute tous les health checks"""
        status = HealthStatus()
        
        for name, check_fn in self._checks.items():
            try:
                status.checks[name] = check_fn()
            except Exception as e:
                status.checks[name] = False
                status.details[f"{name}_error"] = str(e)
        
        # Déterminer le statut global
        if all(status.checks.values()):
            status.status = "healthy"
        elif any(status.checks.values()):
            status.status = "degraded"
        else:
            status.status = "unhealthy"
        
        return status


# ============================================
# TESTS
# ============================================

if __name__ == '__main__':
    print("=== OpenTelemetry Module Tests ===\n")
    
    # Disable console export for cleaner test output
    config = TelemetryConfig(enable_console_export=False)
    init_telemetry(config)
    
    # Test traced decorator
    print("1. Traced Decorator Test:")
    
    @traced("test_function")
    def test_function(x: int) -> int:
        return x * 2
    
    result = test_function(5)
    print(f"   Result: {result} ✓")
    
    # Test timed decorator
    print("\n2. Timed Decorator Test:")
    
    @timed("test_timed")
    def slow_function():
        time.sleep(0.01)
        return "done"
    
    result = slow_function()
    print(f"   Result: {result} ✓")
    
    # Test span context
    print("\n3. Span Context Test:")
    with span_context("test_span", {"key": "value"}) as span:
        span.set_attribute("custom", "attribute")
    print("   Span created ✓")
    
    # Test timer context
    print("\n4. Timer Context Test:")
    with timer_context("test_timer") as timer:
        time.sleep(0.01)
    print(f"   Duration: {timer.duration_ms:.2f}ms ✓")
    
    # Test health checker
    print("\n5. Health Checker Test:")
    checker = HealthChecker()
    checker.register_check("database", lambda: True)
    checker.register_check("cache", lambda: True)
    checker.register_check("external_api", lambda: False)
    
    health = checker.run_checks()
    print(f"   Status: {health.status}")
    print(f"   Checks: {health.checks}")
    
    # Test banking metrics
    print("\n6. Banking Metrics Test:")
    banking_metrics = BankingMetrics()
    banking_metrics.record_transaction("deposit", 1000.0, 5.5, True)
    banking_metrics.record_transaction("withdrawal", 500.0, 3.2, True)
    banking_metrics.set_active_accounts(1500)
    print("   Metrics recorded ✓")
    
    print("\n=== All Telemetry Tests Passed ===")
