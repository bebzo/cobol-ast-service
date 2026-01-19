# 🏦 CodeSwitch COBOL-to-Python Transpiler

> **Transform 40 years of mission-critical banking logic into modern, auditable Python — with line-by-line traceability.**

[![Version](https://img.shields.io/badge/version-5.7.34-blue.svg)](CHANGELOG.md)
[![Tests](https://img.shields.io/badge/tests-146%20passed-green.svg)](tests/)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://python.org)
[![License](https://img.shields.io/badge/license-Commercial-orange.svg)](LICENSE)

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Transpile COBOL source
python -m api.transpile --input source.cob --output output/

# 3. Run generated code
python output/ultimate_banking_v5.7.34.py
```

---

## 📋 Features

| Feature | Description |
|---------|-------------|
| **Clean Architecture** | FileManager → DataLayer → BusinessLogicLayer → PresentationLayer |
| **Full Traceability** | Every Python method maps to COBOL paragraph with line references |
| **Type Safety** | `Decimal` for money, `dataclass` for records, `Enum` for codes |
| **Production Config** | Environment variables + optional YAML configuration |
| **Observability** | OpenTelemetry `TracingContext` integration |
| **Dual Output** | Full (with comments) + Minified (production-optimized) |

---

## ⚙️ Configuration

### Environment Variables

```bash
# Required for production
export ALLOW_STUBS=false          # Force real implementations
export COBOL_LOG_LEVEL=INFO       # DEBUG|INFO|WARNING|ERROR

# Optional tuning
export COBOL_BUFFER_SIZE=4096     # I/O buffer size
export COBOL_TRACE=false          # Enable OpenTelemetry tracing
export COBOL_MAX_RETRIES=3        # Transaction retry limit
```

### YAML Configuration (Optional)

Create `config.yaml` in the output directory:

```yaml
# config.yaml
production:
  buffer_size: 4096
  log_level: INFO
  allow_stubs: false
  trace_enabled: true
  
files:
  customer_master: /data/customers.dat
  transaction_log: /data/transactions.dat
  audit_trail: /data/audit.dat

security:
  secrets_backend: vault  # vault | aws | azure | env
  vault_addr: https://vault.company.com:8200
```

---

## 🧪 Testing

```bash
# Run all transpiler tests
pytest tests/ -v

# Run with coverage report
pytest tests/ --cov=api --cov-report=html

# Run generated code tests
python -m pytest output/unit_tests/ -v
```

### Test Coverage Goals

| Component | Target | Current |
|-----------|--------|---------|
| Transpiler Core | 90%+ | ✅ 92% |
| Generated Code | 80%+ | ✅ 85% |
| Integration | 70%+ | 🔄 In Progress |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   PresentationLayer                      │
│              (Formatting, Display, Reports)              │
├─────────────────────────────────────────────────────────┤
│                  BusinessLogicLayer                      │
│         (Transactions, Validations, Workflows)           │
├─────────────────────────────────────────────────────────┤
│                      DataLayer                           │
│            (Record Access, Data Mapping)                 │
├─────────────────────────────────────────────────────────┤
│                    FileManager                           │
│     (I/O Operations, Context Managers, Buffering)        │
└─────────────────────────────────────────────────────────┘
```

See `architecture_diagram.md` for detailed Mermaid visualization.

---

## 🔐 Security Best Practices

### Secrets Management

**DO NOT** store secrets in code or environment variables in production.

| Backend | Integration Guide |
|---------|-------------------|
| **HashiCorp Vault** | `pip install hvac` → [Vault Integration](docs/vault.md) |
| **AWS Secrets Manager** | `pip install boto3` → [AWS Integration](docs/aws-secrets.md) |
| **Azure Key Vault** | `pip install azure-keyvault` → [Azure Integration](docs/azure-kv.md) |

### Authentication

For API endpoints, implement:
- OAuth 2.0 with JWT tokens
- mTLS for service-to-service
- API key rotation policy

---

## 📊 Production Readiness Checklist

- [x] **Configuration**: Environment variables + YAML support
- [x] **Logging**: Structured logging with configurable levels
- [x] **Monitoring**: OpenTelemetry TracingContext
- [x] **Error Handling**: Custom exceptions with error codes
- [x] **Thread Safety**: Documented warnings for concurrent access
- [ ] **External Integrations**: Replace stubs with real implementations
- [ ] **Load Testing**: Validate under production load
- [ ] **Security Audit**: Complete penetration testing

---

## 🔄 Migration Workflow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   COBOL      │────▶│  CodeSwitch  │────▶│   Python     │
│   Source     │     │  Transpiler  │     │   Output     │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │  • Full traceability output │
              │  • Minified production ver. │
              │  • Unit tests generated     │
              │  • Architecture diagram     │
              │  • Transformation docs      │
              └─────────────────────────────┘
```

---

## 📁 Output Files

| File | Purpose |
|------|---------|
| `ultimate_banking_v5.7.34.py` | Full version with comments & traceability |
| `ultimate_banking_v5.7.34_minified.py` | Production-optimized (17% smaller) |
| `architecture_diagram.md` | Mermaid system architecture |
| `unit_tests/` | Auto-generated test suite |
| `transformation_doc.md` | COBOL→Python mapping reference |

---

## 🆘 Troubleshooting

### Common Issues

**"NotImplementedError: PRODUCTION: Implement real..."**
```bash
# Development mode (stubs allowed)
export ALLOW_STUBS=true

# Production mode (requires real implementation)
export ALLOW_STUBS=false  # Default
```

**"FileNotFoundError: customer_master.dat"**
```bash
# Configure file paths
export CUSTOMER_MASTER_PATH=/data/customers.dat
# Or use config.yaml
```

---

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: GitHub Issues
- **Enterprise Support**: support@codeswitch.io

---

## 📜 License

Commercial License - See [LICENSE](LICENSE) for details.

---

<div align="center">

**CodeSwitch v5.7.34** — *Enterprise COBOL Migration*

*"We don't just translate COBOL. We reincarnate 40 years of critical banking logic into modern, clean, regulatory-compliant architecture — with guaranteed line-by-line traceability."*

</div>
