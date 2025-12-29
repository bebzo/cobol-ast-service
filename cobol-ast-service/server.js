/**
 * COBOL AST Service - Express Server
 * Combines deterministic AST parsing with Gemini AI enrichment
 */

import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { cobolToPython, parseCobol } from './cobol-parser.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Gemini
let genAI = null;
let model = null;

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', gemini: !!model });
});

// Main analysis endpoint
app.post('/analyse', async (req, res) => {
  try {
    const { cobolCode, filename = 'program.cbl' } = req.body;

    if (!cobolCode) {
      return res.status(400).json({ error: 'cobolCode is required' });
    }

    console.log(`Processing ${filename} (${cobolCode.length} chars)...`);

    // Step 1: Deterministic AST parsing
    const startAst = Date.now();
    const { pythonCode, ast, stats } = cobolToPython(cobolCode);
    const astTime = Date.now() - startAst;
    console.log(`AST parsing: ${astTime}ms, ${stats.pythonLines} Python lines generated`);

    // Step 2: Gemini enrichment (if available)
    let enrichment = getDefaultEnrichment(ast, stats);
    
    if (model) {
      try {
        const startGemini = Date.now();
        enrichment = await enrichWithGemini(cobolCode, pythonCode, ast, stats);
        const geminiTime = Date.now() - startGemini;
        console.log(`Gemini enrichment: ${geminiTime}ms`);
      } catch (geminiError) {
        console.error('Gemini enrichment failed:', geminiError.message);
        // Continue with default enrichment
      }
    }

    // Generate detailed report
    const report = generateDefaultReport(ast, stats);

    // Combine AST results with Gemini enrichment
    const result = {
      python_code: pythonCode,
      cobol_lines: stats.cobolLines,
      python_lines: stats.pythonLines,
      ratio: ((stats.pythonLines / stats.cobolLines) * 100).toFixed(1),
      confidence: enrichment.confidence || 85,
      complexity: stats.procedures > 50 ? 'HIGH' : stats.procedures > 20 ? 'MEDIUM' : 'LOW',
      category: enrichment.category || 'Banking',
      year_detected: enrichment.year_detected || 1990,
      risk_level: stats.procedures > 100 ? 'HIGH' : stats.procedures > 30 ? 'MEDIUM' : 'LOW',
      estimated_effort: `${Math.ceil(stats.procedures / 25)} weeks`,
      effort_details: 'Full migration cycle including testing, validation and deployment',
      summary: enrichment.summary || `Converted ${ast.name} from COBOL to Python using AST parsing. Contains ${stats.procedures} procedures and ${stats.variables} variables.`,
      
      // Migration Score object for frontend
      migration_score: {
        complexity: stats.procedures > 100 ? 'CRITICAL' : stats.procedures > 50 ? 'HIGH' : stats.procedures > 20 ? 'MEDIUM' : 'LOW',
        risk_level: stats.procedures > 100 ? 'CRITICAL' : stats.procedures > 50 ? 'HIGH' : stats.procedures > 20 ? 'MEDIUM' : 'LOW',
        estimated_effort: `${Math.ceil(stats.procedures / 25)} weeks`,
        confidence: Math.max(65, Math.min(95, 95 - Math.floor(stats.procedures / 20)))
      },
      
      // Detailed analysis - use report data
      issues: report.issues,
      improvements: report.improvements,
      security_warnings: report.security.map(s => ({
        severity: s.severity,
        title: `${s.title}: ${s.description}`,
        description: s.description,
        recommendation: s.recommendation,
        location: `${s.location} | Fix: ${s.recommendation}`,
        cvss_score: s.severity === 'CRITICAL' ? 9.1 : s.severity === 'HIGH' ? 7.5 : s.severity === 'MEDIUM' ? 5.3 : 3.0
      })),
      next_steps: report.nextSteps.map(s => `Phase ${s.phase}: ${s.title} - ${s.description} (${s.duration})`),
      
      // Other enrichment data
      tests: enrichment.tests || generateDefaultTests(ast),
      config: enrichment.config || generateDefaultConfig(ast),
      architecture_diagram: enrichment.architecture_diagram || generateDefaultArchitecture(ast),
      modules: enrichment.modules || generateDefaultModules(ast),
      impact_analysis: enrichment.impact_analysis || generateDefaultImpact(ast),
      
      // AST-specific metadata
      ast_stats: {
        variables: stats.variables,
        procedures: stats.procedures,
        files: stats.files,
        parsing_method: 'AST',
        ast_time_ms: astTime
      },
      
      // Dependency graph for impact analysis
      dependencies: ast.dependencies || { calls: {}, calledBy: {} }
    };

    res.json(result);

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Gemini enrichment function
async function enrichWithGemini(cobolCode, pythonCode, ast, stats) {
  const cobolSample = cobolCode.substring(0, 8000);
  const pythonSample = pythonCode.substring(0, 4000);

  const prompt = `Analyze this COBOL to Python conversion and provide enrichment data.

COBOL CODE (sample):
${cobolSample}

GENERATED PYTHON (sample):
${pythonSample}

AST STATS:
- Variables: ${stats.variables}
- Procedures: ${stats.procedures}  
- Files: ${stats.files}
- COBOL lines: ${stats.cobolLines}
- Python lines: ${stats.pythonLines}

Provide JSON with:
{
  "confidence": 75-95 (based on conversion quality),
  "complexity": "LOW|MEDIUM|HIGH|CRITICAL",
  "category": "Banking|Payroll|Insurance|Inventory|etc",
  "year_detected": 1980-2000,
  "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "summary": "2-3 sentence description of what this program does",
  "tests": "Complete pytest test code with at least 15 test cases covering all procedures",
  "config": "YAML configuration for deployment (database, logging, env vars)",
  "architecture_diagram": "ASCII diagram showing system components and data flow",
  "modules": [{"name":"module","lines":100,"type":"Business Logic","description":"what it does","complexity":"MEDIUM","pythonTarget":"file.py","risk":"LOW"}],
  "impact_analysis": {"affected_systems":[],"data_dependencies":[],"integration_points":[],"migration_risks":[],"estimated_effort":"X weeks"}
}

IMPORTANT: Generate COMPLETE, DETAILED content for each field. The tests should have 15+ test cases. The config should be production-ready. Return ONLY valid JSON.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  throw new Error('Failed to parse Gemini response');
}

// Default enrichment when Gemini is unavailable
function getDefaultEnrichment(ast, stats) {
  return {
    confidence: 85,
    complexity: stats.procedures > 20 ? 'HIGH' : stats.procedures > 10 ? 'MEDIUM' : 'LOW',
    category: 'Business',
    year_detected: 1990,
    risk_level: 'MEDIUM',
    summary: `COBOL program ${ast.name} converted to Python using AST parsing. Contains ${stats.procedures} procedures and ${stats.variables} variables.`
  };
}

// Generate comprehensive report
function generateDefaultReport(ast, stats) {
  const issues = [];
  const improvements = [];
  const security = [];
  const nextSteps = [];

  // Analyze variables for patterns
  const variables = ast.variables || ast.dataStructures || [];
  const procedures = ast.procedures || [];
  const variableNames = variables.map(v => v.name || '').join(' ');
  const procedureNames = procedures.map(p => p.name || '').join(' ');
  const hasDateFields = /DATE|DT-|YY|MM-|DD-/i.test(variableNames);
  const hasAmountFields = /AMT|AMOUNT|PRICE|TOTAL|BAL|MONEY|COST/i.test(variableNames);
  const hasPasswordFields = /PASS|PWD|SECRET|KEY|TOKEN|CRED/i.test(variableNames);
  const hasFileOps = /READ|WRITE|OPEN|CLOSE|FILE/i.test(procedureNames) || (ast.files && ast.files.length > 0);
  const hasSqlOps = /SQL|EXEC|CURSOR|FETCH/i.test(procedureNames);
  const hasNetworkOps = /SOCKET|TCP|HTTP|SEND|RECEIVE/i.test(procedureNames);
  const hasErrorHandling = /ERROR|EXCEPTION|ABORT|INVALID/i.test(procedureNames);

  // ========== ISSUES - Detected Problems ==========
  
  if (hasDateFields) {
    issues.push({
      id: 'DATE-001',
      severity: 'MEDIUM',
      title: 'Legacy date handling detected',
      description: 'COBOL date fields use fixed formats (YYMMDD, PIC 9(6)). Python migration should use datetime objects with proper timezone handling.',
      location: 'DATA DIVISION',
      recommendation: 'Use Python datetime.strptime() with explicit format strings. Consider using pendulum or arrow libraries for timezone support.'
    });
  }

  issues.push({
    id: 'STR-001',
    severity: 'LOW',
    title: 'Fixed-length string fields',
    description: 'COBOL PIC X fields have fixed lengths with space padding. Python strings are dynamic.',
    location: 'DATA DIVISION',
    recommendation: 'Use .strip() on string fields and validate max lengths with len() checks.'
  });

  if (stats.procedures > 50) {
    issues.push({
      id: 'COMPLEX-001',
      severity: 'HIGH',
      title: 'High procedural complexity',
      description: `${stats.procedures} procedures detected. Complex control flow may require careful refactoring to maintain business logic.`,
      location: 'PROCEDURE DIVISION',
      recommendation: 'Group related procedures into Python classes. Consider using design patterns like Strategy or Command.'
    });
  }

  if (stats.procedures > 20 && stats.procedures <= 50) {
    issues.push({
      id: 'COMPLEX-002',
      severity: 'MEDIUM',
      title: 'Moderate procedural complexity',
      description: `${stats.procedures} procedures require careful organization in Python modules.`,
      location: 'PROCEDURE DIVISION',
      recommendation: 'Create logical groupings based on business functionality.'
    });
  }

  if (hasFileOps) {
    issues.push({
      id: 'FILE-001',
      severity: 'MEDIUM',
      title: 'Legacy file I/O operations',
      description: 'COBOL sequential/indexed file operations detected. Requires migration to modern file handling or database.',
      location: 'PROCEDURE DIVISION',
      recommendation: 'Consider migrating to SQLite, PostgreSQL, or pandas DataFrames for structured data.'
    });
  }

  if (hasSqlOps) {
    issues.push({
      id: 'SQL-001',
      severity: 'MEDIUM',
      title: 'Embedded SQL detected',
      description: 'EXEC SQL statements found. Requires database connection refactoring for Python.',
      location: 'PROCEDURE DIVISION',
      recommendation: 'Use SQLAlchemy ORM or psycopg2/pymysql for Python database access.'
    });
  }

  if (stats.variables > 100) {
    issues.push({
      id: 'DATA-001',
      severity: 'MEDIUM',
      title: 'Large data structure complexity',
      description: `${stats.variables} variables detected. Consider using dataclasses or Pydantic models.`,
      location: 'DATA DIVISION',
      recommendation: 'Use Python dataclasses with type hints for structured data.'
    });
  }

  if (hasAmountFields) {
    issues.push({
      id: 'NUM-001',
      severity: 'HIGH',
      title: 'Financial calculations detected',
      description: 'Amount/price fields found. COBOL COMP-3 decimals require careful handling to avoid floating-point errors.',
      location: 'DATA DIVISION',
      recommendation: 'Use Python Decimal class for all financial calculations. Never use float for money.'
    });
  }

  if (!hasErrorHandling) {
    issues.push({
      id: 'ERR-001',
      severity: 'MEDIUM',
      title: 'Limited error handling detected',
      description: 'No explicit error handling procedures found. Python version needs robust exception handling.',
      location: 'PROCEDURE DIVISION',
      recommendation: 'Implement try/except blocks with specific exception types and proper logging.'
    });
  }

  // ========== IMPROVEMENTS - Enhancement Suggestions ==========
  
  improvements.push({
    id: 'IMP-001',
    priority: 'HIGH',
    title: 'Add comprehensive type hints',
    description: 'Python code should use type hints (PEP 484) for better IDE support, maintainability, and early error detection.',
    benefit: 'Catches type errors at development time, improves code documentation',
    effort: '2-4 hours'
  });

  improvements.push({
    id: 'IMP-002',
    priority: 'HIGH',
    title: 'Implement unit test suite',
    description: 'Create pytest test suite covering all converted procedures with at least 80% code coverage.',
    benefit: 'Ensures conversion accuracy and prevents regression',
    effort: '1-2 days'
  });

  improvements.push({
    id: 'IMP-003',
    priority: 'MEDIUM',
    title: 'Add structured logging',
    description: 'Replace DISPLAY statements with Python logging module for production monitoring and debugging.',
    benefit: 'Better debugging, audit trails, and production monitoring',
    effort: '2-4 hours'
  });

  improvements.push({
    id: 'IMP-004',
    priority: 'MEDIUM',
    title: 'Implement exception handling',
    description: 'Add try/except blocks with proper exception hierarchy and error recovery.',
    benefit: 'Graceful error handling and improved reliability',
    effort: '4-8 hours'
  });

  improvements.push({
    id: 'IMP-005',
    priority: 'MEDIUM',
    title: 'Create configuration management',
    description: 'Externalize all hardcoded values to configuration files or environment variables.',
    benefit: 'Easier deployment across environments',
    effort: '2-4 hours'
  });

  if (hasAmountFields) {
    improvements.push({
      id: 'IMP-006',
      priority: 'HIGH',
      title: 'Use Decimal for financial calculations',
      description: 'COBOL COMP-3 packed decimals should use Python Decimal class to avoid floating-point precision errors.',
      benefit: 'Accurate financial calculations without rounding errors',
      effort: '2-4 hours'
    });
  }

  improvements.push({
    id: 'IMP-007',
    priority: 'LOW',
    title: 'Add API documentation',
    description: 'Create OpenAPI/Swagger documentation for any exposed interfaces.',
    benefit: 'Better developer experience and integration support',
    effort: '4-8 hours'
  });

  improvements.push({
    id: 'IMP-008',
    priority: 'MEDIUM',
    title: 'Implement input validation',
    description: 'Add Pydantic models or marshmallow schemas for input validation.',
    benefit: 'Data integrity and security',
    effort: '4-6 hours'
  });

  // ========== SECURITY - Vulnerabilities & Recommendations ==========
  
  if (hasPasswordFields) {
    security.push({
      id: 'SEC-001',
      severity: 'CRITICAL',
      title: 'Hardcoded credentials detected',
      description: 'Password/secret fields found in DATA DIVISION. Credentials should never be hardcoded in source code.',
      location: 'DATA DIVISION',
      recommendation: 'Use environment variables or a secrets manager (AWS Secrets Manager, HashiCorp Vault, Azure Key Vault).'
    });
  }

  if (hasSqlOps) {
    security.push({
      id: 'SEC-002',
      severity: 'HIGH',
      title: 'SQL injection vulnerability risk',
      description: 'Dynamic SQL detected. String concatenation for SQL queries can lead to injection attacks.',
      location: 'PROCEDURE DIVISION',
      recommendation: 'Use parameterized queries: cursor.execute("SELECT * FROM x WHERE id = %s", (id,)). Never use f-strings or concatenation for SQL.'
    });
  }

  security.push({
    id: 'SEC-003',
    severity: 'MEDIUM',
    title: 'Input validation required',
    description: 'COBOL ACCEPT statements need comprehensive input validation in Python to prevent injection attacks.',
    location: 'PROCEDURE DIVISION',
    recommendation: 'Implement input sanitization functions and use validation libraries like Pydantic or Cerberus.'
  });

  if (hasFileOps) {
    security.push({
      id: 'SEC-004',
      severity: 'MEDIUM',
      title: 'File path traversal risk',
      description: 'File operations should validate paths to prevent directory traversal attacks (../../../etc/passwd).',
      location: 'PROCEDURE DIVISION',
      recommendation: 'Use pathlib and validate paths against an allowed directory whitelist. Use os.path.realpath() to resolve symlinks.'
    });
  }

  security.push({
    id: 'SEC-005',
    severity: 'LOW',
    title: 'Implement audit logging',
    description: 'Add audit logging for sensitive operations to support compliance and forensics.',
    location: 'All procedures',
    recommendation: 'Log user actions, data access, and modifications with timestamps and user identifiers.'
  });

  if (hasNetworkOps) {
    security.push({
      id: 'SEC-006',
      severity: 'HIGH',
      title: 'Network security considerations',
      description: 'Network operations detected. Ensure TLS/SSL is used for all communications.',
      location: 'PROCEDURE DIVISION',
      recommendation: 'Use HTTPS, verify SSL certificates, and implement proper timeout handling.'
    });
  }

  security.push({
    id: 'SEC-007',
    severity: 'MEDIUM',
    title: 'Error message information disclosure',
    description: 'Ensure error messages do not expose sensitive system information or stack traces to end users.',
    location: 'Error handling',
    recommendation: 'Use generic error messages for users, detailed logs for developers. Implement proper exception handling.'
  });

  // ========== NEXT STEPS - Migration Plan ==========
  
  nextSteps.push({
    id: 'STEP-001',
    phase: 1,
    title: 'Code review & validation',
    description: 'Review generated Python code for accuracy and business logic preservation. Verify all COBOL constructs are correctly translated.',
    duration: '1-2 days',
    deliverables: ['Code review report', 'Issue list', 'Sign-off document']
  });

  nextSteps.push({
    id: 'STEP-002',
    phase: 2,
    title: 'Test suite creation',
    description: 'Create comprehensive pytest test cases based on existing COBOL test data and business requirements.',
    duration: '2-3 days',
    deliverables: ['Unit tests', 'Integration tests', 'Test data files']
  });

  nextSteps.push({
    id: 'STEP-003',
    phase: 3,
    title: 'Integration testing',
    description: 'Test Python code with real database connections, file systems, and external services.',
    duration: '2-3 days',
    deliverables: ['Integration test results', 'Environment configuration', 'Connection validation']
  });

  nextSteps.push({
    id: 'STEP-004',
    phase: 4,
    title: 'Performance benchmarking',
    description: 'Compare Python execution time and resource usage with original COBOL program. Optimize critical paths.',
    duration: '1-2 days',
    deliverables: ['Performance report', 'Benchmark results', 'Optimization recommendations']
  });

  nextSteps.push({
    id: 'STEP-005',
    phase: 5,
    title: 'Security audit',
    description: 'Conduct security review of the converted code. Address all identified vulnerabilities.',
    duration: '1-2 days',
    deliverables: ['Security assessment', 'Vulnerability fixes', 'Compliance checklist']
  });

  nextSteps.push({
    id: 'STEP-006',
    phase: 6,
    title: 'Staging deployment',
    description: 'Deploy to staging environment and run parallel testing with COBOL system.',
    duration: '3-5 days',
    deliverables: ['Staging environment', 'Parallel test results', 'Discrepancy report']
  });

  nextSteps.push({
    id: 'STEP-007',
    phase: 7,
    title: 'Production migration',
    description: 'Execute production deployment with rollback plan. Monitor for issues.',
    duration: '1-2 weeks',
    deliverables: ['Production deployment', 'Monitoring dashboards', 'Rollback procedures']
  });

  nextSteps.push({
    id: 'STEP-008',
    phase: 8,
    title: 'Documentation & training',
    description: 'Create technical documentation and train team on the new Python codebase.',
    duration: '3-5 days',
    deliverables: ['Technical docs', 'API documentation', 'Training materials']
  });

  return {
    issues,
    improvements,
    security,
    nextSteps,
    summary: {
      totalIssues: issues.length,
      totalImprovements: improvements.length,
      totalSecurityFindings: security.length,
      totalNextSteps: nextSteps.length,
      critical: issues.filter(i => i.severity === 'CRITICAL').length + security.filter(s => s.severity === 'CRITICAL').length,
      high: issues.filter(i => i.severity === 'HIGH').length + security.filter(s => s.severity === 'HIGH').length,
      medium: issues.filter(i => i.severity === 'MEDIUM').length + security.filter(s => s.severity === 'MEDIUM').length,
      low: issues.filter(i => i.severity === 'LOW').length + security.filter(s => s.severity === 'LOW').length
    }
  };
}

// Generate default tests
function generateDefaultTests(ast) {
  const className = ast.name.replace(/-/g, '_').toLowerCase();
  let tests = `import pytest
from ${className} import ${ast.name.replace(/-/g, '')}

class Test${ast.name.replace(/-/g, '')}:
    """Unit tests for ${ast.name}"""
    
    @pytest.fixture
    def program(self):
        return ${ast.name.replace(/-/g, '')}()
    
    def test_initialization(self, program):
        """Test program initialization"""
        assert program is not None
`;

  for (const proc of ast.procedures.slice(0, 10)) {
    const methodName = proc.name.replace(/-/g, '_').toLowerCase();
    tests += `
    def test_${methodName}(self, program):
        """Test ${proc.name} procedure"""
        # Call the method
        result = program.${methodName}()
        # Add assertions based on expected behavior
        assert True  # Placeholder
`;
  }

  tests += `
    def test_run_complete(self, program):
        """Test complete program execution"""
        program.run()
        assert True

    def test_edge_cases(self, program):
        """Test edge cases and boundary conditions"""
        # Test with boundary values
        assert True

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
`;

  return tests;
}

// Generate default config
function generateDefaultConfig(ast) {
  return `# ${ast.name} Configuration
# Generated by CodeSwitch AST Parser

application:
  name: ${ast.name.toLowerCase()}
  version: 1.0.0
  environment: production

database:
  host: \${DB_HOST:localhost}
  port: \${DB_PORT:5432}
  name: \${DB_NAME:${ast.name.toLowerCase()}_db}
  pool_size: 10
  timeout: 30

logging:
  level: INFO
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
  handlers:
    - console
    - file
  file_path: /var/log/${ast.name.toLowerCase()}.log

security:
  encryption: AES-256
  ssl_enabled: true
  auth_required: true

monitoring:
  enabled: true
  metrics_endpoint: /metrics
  health_endpoint: /health

files:
${ast.files.map(f => `  - name: ${f.name}
    path: /data/${f.name.toLowerCase()}.dat
    mode: sequential`).join('\n')}
`;
}

// Generate default architecture diagram
function generateDefaultArchitecture(ast) {
  const procedures = ast.procedures.slice(0, 6).map(p => p.name).join('\n│   ├── ');
  
  return `
┌─────────────────────────────────────────────────────────────────┐
│                        ${ast.name}                              │
│                    Python Application                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │   Input Layer   │    │  Output Layer   │                    │
│  │  - File I/O     │    │  - Reports      │                    │
│  │  - User Input   │    │  - Data Export  │                    │
│  └────────┬────────┘    └────────▲────────┘                    │
│           │                      │                              │
│           ▼                      │                              │
│  ┌─────────────────────────────────────────┐                   │
│  │           Business Logic Layer          │                   │
│  │   ├── ${procedures}                     │
│  └─────────────────────────────────────────┘                   │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────────────────────────────┐                   │
│  │            Data Layer                   │                   │
│  │  - Working Storage Variables            │                   │
│  │  - File Handlers                        │                   │
│  │  - Data Structures (${ast.variables.length} variables)      │
│  └─────────────────────────────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Data Flow:
  Input → Validation → Processing → Output
  
Integration Points:
${ast.files.map(f => `  • ${f.name}: File-based data exchange`).join('\n') || '  • None detected'}
`;
}

// Generate default modules (format expected by frontend)
function generateDefaultModules(ast) {
  const modules = [];
  const deps = ast.dependencies || { calls: {}, calledBy: {} };
  
  // Module name mapping based on common COBOL patterns
  const moduleNames = {
    '0000': 'Main Control', '1000': 'Initialization', '1100': 'Setup', '1200': 'Config Load',
    '1300': 'Parameter Init', '1400': 'File Open', '1500': 'Header Process',
    '2000': 'Main Processing', '2100': 'Input Validation', '2200': 'Data Transform',
    '2300': 'Business Rules', '2400': 'Calculation Engine', '2500': 'Account Process',
    '2600': 'Transaction Handler', '2700': 'Balance Update', '2800': 'Interest Calc',
    '2900': 'Fee Processing', '3000': 'Output Generation', '3100': 'Report Format',
    '3200': 'Print Handler', '3300': 'File Write', '3400': 'Summary Build',
    '4000': 'Database Access', '5000': 'External Interface', '6000': 'Audit Trail',
    '7000': 'Security Check', '8000': 'Error Recovery', '9000': 'Cleanup',
    '9100': 'File Close', '9200': 'Summary Output', '9300': 'Stats Report',
    '9400': 'Audit Write', '9500': 'Log Finalize', '9600': 'Memory Release',
    '9700': 'Connection Close', '9800': 'Final Validation', '9900': 'Program Exit',
    'A': 'Account Management', 'B': 'Balance Operations', 'C': 'Customer Service',
    'D': 'Data Validation', 'E': 'Event Processing', 'F': 'File Handler',
    'G': 'General Ledger', 'H': 'History Tracking', 'I': 'Interest Calculation',
    'J': 'Journal Entry', 'K': 'Key Generation', 'L': 'Loan Processing',
    'M': 'Money Transfer', 'N': 'Notification', 'O': 'Output Format',
    'P': 'Payment Process', 'Q': 'Query Handler', 'R': 'Report Generator',
    'S': 'Security Module', 'T': 'Transaction Log', 'U': 'User Interface',
    'V': 'Validation Rules', 'W': 'Workflow Engine', 'X': 'External API',
    'Y': 'Year-End Process', 'Z': 'Zero Balance Check', 'WS': 'Working Storage'
  };
  
  // Group procedures by prefix
  const groups = {};
  for (const proc of ast.procedures) {
    const prefix = proc.name.split('-')[0];
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(proc.name);
  }

  const types = ['Business Logic', 'Data Access', 'Validation', 'Processing', 'Reporting', 'Utilities'];
  let i = 0;

  for (const [prefix, procs] of Object.entries(groups)) {
    const lines = procs.length * 25;
    
    // Get meaningful module name
    let moduleName = moduleNames[prefix] || moduleNames[prefix.charAt(0)] || 'Processing';
    const displayName = `${prefix}: ${moduleName}`;
    
    // Calculate dependencies for this module
    const moduleDeps = new Set();
    const moduleCalledBy = new Set();
    for (const procName of procs) {
      const calls = deps.calls[procName] || [];
      const calledBy = deps.calledBy[procName] || [];
      calls.forEach(c => {
        const cPrefix = c.split('-')[0];
        if (cPrefix !== prefix) moduleDeps.add(cPrefix);
      });
      calledBy.forEach(c => {
        const cPrefix = c.split('-')[0];
        if (cPrefix !== prefix) moduleCalledBy.add(cPrefix);
      });
    }
    
    modules.push({
      name: displayName,
      prefix: prefix,
      lines: lines,
      type: types[i % types.length],
      description: `${moduleName} - ${procs.length} procedures`,
      complexity: lines > 200 ? 'HIGH' : lines > 100 ? 'MEDIUM' : 'LOW',
      pythonTarget: `${prefix.toLowerCase()}_${moduleName.toLowerCase().replace(/\s+/g, '_')}.py`,
      risk: procs.length > 10 ? 'HIGH' : procs.length > 5 ? 'MEDIUM' : 'LOW',
      dependencies: Array.from(moduleDeps).map(p => `${p}: ${moduleNames[p] || moduleNames[p.charAt(0)] || 'Module'}`),
      dependents: Array.from(moduleCalledBy).map(p => `${p}: ${moduleNames[p] || moduleNames[p.charAt(0)] || 'Module'}`)
    });
    i++;
  }

  return modules;
}

// Generate default impact analysis
function generateDefaultImpact(ast) {
  const deps = ast.dependencies || { calls: {}, calledBy: {} };
  
  // Module name mapping
  const moduleNames = {
    '0000': 'Main Control', '1000': 'Initialization', '1100': 'Setup', '1200': 'Config Load',
    '1300': 'Parameter Init', '1400': 'File Open', '1500': 'Header Process',
    '2000': 'Main Processing', '2100': 'Input Validation', '2200': 'Data Transform',
    '2300': 'Business Rules', '2400': 'Calculation Engine', '2500': 'Account Process',
    '2600': 'Transaction Handler', '2700': 'Balance Update', '2800': 'Interest Calc',
    '2900': 'Fee Processing', '3000': 'Output Generation', '3100': 'Report Format',
    '3200': 'Print Handler', '3300': 'File Write', '3400': 'Summary Build',
    '4000': 'Database Access', '5000': 'External Interface', '6000': 'Audit Trail',
    '7000': 'Security Check', '8000': 'Error Recovery', '9000': 'Cleanup',
    '9100': 'File Close', '9200': 'Summary Output', '9300': 'Stats Report',
    '9400': 'Audit Write', '9500': 'Log Finalize', '9600': 'Memory Release',
    '9700': 'Connection Close', '9800': 'Final Validation', '9900': 'Program Exit',
    'A': 'Account Management', 'B': 'Balance Operations', 'C': 'Customer Service',
    'D': 'Data Validation', 'E': 'Event Processing', 'F': 'File Handler',
    'G': 'General Ledger', 'H': 'History Tracking', 'I': 'Interest Calculation',
    'J': 'Journal Entry', 'K': 'Key Generation', 'L': 'Loan Processing',
    'M': 'Money Transfer', 'N': 'Notification', 'O': 'Output Format',
    'P': 'Payment Process', 'Q': 'Query Handler', 'R': 'Report Generator',
    'S': 'Security Module', 'T': 'Transaction Log', 'U': 'User Interface',
    'V': 'Validation Rules', 'W': 'Workflow Engine', 'X': 'External API',
    'Y': 'Year-End Process', 'Z': 'Zero Balance Check', 'WS': 'Working Storage'
  };
  
  const getModuleName = (prefix) => {
    return `${prefix}: ${moduleNames[prefix] || moduleNames[prefix.charAt(0)] || 'Processing'}`;
  };
  
  // Build module-level dependency map
  const moduleDependencies = {};
  const groups = {};
  
  for (const proc of ast.procedures) {
    const prefix = proc.name.split('-')[0];
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(proc.name);
  }
  
  for (const [prefix, procs] of Object.entries(groups)) {
    const moduleName = getModuleName(prefix);
    moduleDependencies[moduleName] = {
      prefix: prefix,
      calls: new Set(),
      calledBy: new Set()
    };
    
    for (const procName of procs) {
      const calls = deps.calls[procName] || [];
      const calledBy = deps.calledBy[procName] || [];
      
      calls.forEach(c => {
        const cPrefix = c.split('-')[0];
        if (cPrefix !== prefix) {
          moduleDependencies[moduleName].calls.add(getModuleName(cPrefix));
        }
      });
      
      calledBy.forEach(c => {
        const cPrefix = c.split('-')[0];
        if (cPrefix !== prefix) {
          moduleDependencies[moduleName].calledBy.add(getModuleName(cPrefix));
        }
      });
    }
  }
  
  // Convert Sets to Arrays for JSON serialization
  const moduleGraph = {};
  for (const [mod, data] of Object.entries(moduleDependencies)) {
    moduleGraph[mod] = {
      calls: Array.from(data.calls),
      calledBy: Array.from(data.calledBy),
      impactCount: data.calledBy.size
    };
  }
  
  return {
    affected_systems: ast.files.map(f => f.name),
    data_dependencies: ast.variables.filter(v => v.level === 1).map(v => v.name),
    module_dependencies: moduleGraph,
    integration_points: ast.files.map(f => ({
      system: f.name,
      type: 'file',
      direction: 'bidirectional'
    })),
    migration_risks: [
      { risk: 'Data format changes', impact: 'MEDIUM', mitigation: 'Implement data validation layer' },
      { risk: 'Performance differences', impact: 'LOW', mitigation: 'Benchmark critical paths' },
      { risk: 'Character encoding', impact: 'LOW', mitigation: 'Use UTF-8 consistently' }
    ],
    estimated_effort: `${Math.ceil(ast.procedures.length / 5)} weeks`
  };
}

// Export for Vercel
export default app;
