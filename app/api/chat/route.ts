import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// ============================================================================
// Phase 6: Advanced Code Analysis for Expert Support
// ============================================================================

interface CodeStructure {
  className: string;
  methods: string[];
  properties: string[];
  imports: string[];
  hasCobolRuntime: boolean;
  hasFileManager: boolean;
  hasLogger: boolean;
}

interface CalculationIssue {
  lineNumber: number;
  code: string;
  issue: string;
  severity: 'critical' | 'warning' | 'info';
  suggestedFix: string;
}

interface RoundingAnalysis {
  hasCobolRounded: boolean;
  cobolRoundedVariables: string[];
  pythonRoundingMethods: string[];
  inconsistencies: string[];
  missingRounding: string[];
  recommendations: string[];
  calculationIssues: CalculationIssue[];
  autoFixCode: string;
}

// Deep analysis of Python code structure
function analyzeCodeStructure(pythonCode: string): CodeStructure {
  const structure: CodeStructure = {
    className: '',
    methods: [],
    properties: [],
    imports: [],
    hasCobolRuntime: false,
    hasFileManager: false,
    hasLogger: false
  };

  if (!pythonCode) return structure;

  const lines = pythonCode.split('\n');

  // Extract class name
  const classMatch = pythonCode.match(/class\s+(\w+)/);
  if (classMatch) structure.className = classMatch[1];

  // Extract methods
  const methodMatches = pythonCode.matchAll(/def\s+(\w+)\s*\(/g);
  for (const match of methodMatches) {
    structure.methods.push(match[1]);
  }

  // Extract self.property assignments
  const propMatches = pythonCode.matchAll(/self\.(\w+)\s*=/g);
  const propsSet = new Set<string>();
  for (const match of propMatches) {
    propsSet.add(match[1]);
  }
  structure.properties = Array.from(propsSet);

  // Extract imports
  const importMatches = pythonCode.matchAll(/(?:from\s+[\w.]+\s+)?import\s+([^\n]+)/g);
  for (const match of importMatches) {
    structure.imports.push(match[0].trim());
  }

  // Detect key components
  structure.hasCobolRuntime = pythonCode.includes('CobolRuntime') || pythonCode.includes('cobol_round');
  structure.hasFileManager = pythonCode.includes('FileManager') || pythonCode.includes('file_manager');
  structure.hasLogger = pythonCode.includes('logging') || pythonCode.includes('logger');

  return structure;
}

// Advanced rounding analysis with line-specific issues
function analyzeRoundingIssues(cobolCode: string, pythonCode: string): RoundingAnalysis {
  const analysis: RoundingAnalysis = {
    hasCobolRounded: false,
    cobolRoundedVariables: [],
    pythonRoundingMethods: [],
    inconsistencies: [],
    missingRounding: [],
    recommendations: [],
    calculationIssues: [],
    autoFixCode: ''
  };

  if (!cobolCode || !pythonCode) return analysis;

  const pythonLines = pythonCode.split('\n');

  // Detect COBOL ROUNDED keyword with variable names
  const roundedMatches = cobolCode.matchAll(/COMPUTE\s+([\w-]+)\s+ROUNDED/gi);
  for (const match of roundedMatches) {
    analysis.hasCobolRounded = true;
    const varName = match[1].toLowerCase().replace(/-/g, '_').replace(/^ws_/, '');
    analysis.cobolRoundedVariables.push(varName);
  }

  // Detect Python rounding methods
  const roundHalfUp = (pythonCode.match(/ROUND_HALF_UP/g) || []).length;
  const roundHalfEven = (pythonCode.match(/ROUND_HALF_EVEN/g) || []).length;
  const quantize = (pythonCode.match(/\.quantize\(/g) || []).length;
  const cobolRound = (pythonCode.match(/cobol_round\(/g) || []).length;

  if (roundHalfUp > 0) analysis.pythonRoundingMethods.push(`ROUND_HALF_UP: ${roundHalfUp} occurrences`);
  if (roundHalfEven > 0) analysis.pythonRoundingMethods.push(`ROUND_HALF_EVEN: ${roundHalfEven} occurrences`);
  if (quantize > 0) analysis.pythonRoundingMethods.push(`.quantize(): ${quantize} occurrences`);
  if (cobolRound > 0) analysis.pythonRoundingMethods.push(`cobol_round(): ${cobolRound} occurrences`);

  // Detect inconsistencies
  if (roundHalfUp > 0 && roundHalfEven > 0) {
    analysis.inconsistencies.push(
      `Mixed rounding modes: ROUND_HALF_UP (${roundHalfUp}x) vs ROUND_HALF_EVEN (${roundHalfEven}x). This causes penny differences.`
    );
  }

  // Line-by-line analysis for calculations without rounding
  const financialPatterns = [
    /self\.(\w*(?:prime|total|montant|amount|sum|tax|rate|price|cost|fee|interest|balance|payment)\w*)\s*=\s*([^#\n]+)/gi,
    /self\.(\w+)\s*=\s*self\.\w+\s*\*\s*\([^)]*Decimal[^)]*\)/gi,
    /self\.(\w+)\s*=\s*\([^)]+\)\s*\*\s*\([^)]+\)/gi
  ];

  pythonLines.forEach((line, idx) => {
    const lineNum = idx + 1;
    
    // Check for financial calculations without explicit rounding
    for (const pattern of financialPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(line);
      if (match && !line.includes('quantize') && !line.includes('cobol_round') && !line.includes('round(')) {
        const varName = match[1];
        // Check if this variable should be rounded (matches COBOL ROUNDED variable)
        const shouldRound = analysis.cobolRoundedVariables.some(v => 
          varName.toLowerCase().includes(v) || v.includes(varName.toLowerCase())
        );
        
        if (shouldRound || line.includes('Decimal') || line.includes('* (')) {
          analysis.calculationIssues.push({
            lineNumber: lineNum,
            code: line.trim(),
            issue: `Financial calculation without explicit rounding`,
            severity: shouldRound ? 'critical' : 'warning',
            suggestedFix: `${line.trim().replace(/;?\s*$/, '')}).quantize(Decimal('0.01'), rounding=ROUND_HALF_EVEN)`
          });
        }
      }
    }

    // Check for division without zero check
    if (line.includes(' / ') && !line.includes('!= 0') && !line.includes('> 0') && !line.includes('if ')) {
      const divMatch = line.match(/self\.(\w+)\s*=\s*[^/]+\/\s*([^#\n]+)/);
      if (divMatch) {
        analysis.calculationIssues.push({
          lineNumber: lineNum,
          code: line.trim(),
          issue: `Division without zero check (COBOL ON SIZE ERROR equivalent)`,
          severity: 'warning',
          suggestedFix: `if ${divMatch[2].trim()} != 0: ${line.trim()} else: self.${divMatch[1]} = Decimal('0')`
        });
      }
    }
  });

  // Missing rounding detection
  if (analysis.hasCobolRounded && quantize === 0 && cobolRound === 0) {
    analysis.missingRounding.push(
      `COBOL uses ROUNDED for ${analysis.cobolRoundedVariables.length} variables but Python has NO explicit rounding.`
    );
    analysis.missingRounding.push(
      `Variables needing rounding: ${analysis.cobolRoundedVariables.slice(0, 5).join(', ')}${analysis.cobolRoundedVariables.length > 5 ? '...' : ''}`
    );
  }

  // Generate auto-fix code
  if (analysis.calculationIssues.length > 0) {
    const criticalIssues = analysis.calculationIssues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      analysis.autoFixCode = `# AUTO-FIX: Add this import at the top
from decimal import Decimal, ROUND_HALF_EVEN

# Wrap financial calculations with proper rounding:
${criticalIssues.slice(0, 3).map(i => 
  `# Line ${i.lineNumber}: ${i.suggestedFix}`
).join('\n')}

# Or use CobolRuntime helper:
# result = CobolRuntime.cobol_round(calculation_result, "V99")`;
    }
  }

  // Generate recommendations
  if (analysis.inconsistencies.length > 0) {
    analysis.recommendations.push(
      'Standardize on ROUND_HALF_EVEN (banker\'s rounding) for COBOL ROUNDED compatibility.'
    );
  }
  if (analysis.missingRounding.length > 0) {
    analysis.recommendations.push(
      'Add .quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN) to all financial calculations.'
    );
  }
  if (analysis.calculationIssues.length > 0) {
    analysis.recommendations.push(
      `Fix ${analysis.calculationIssues.length} calculation issues detected (${analysis.calculationIssues.filter(i => i.severity === 'critical').length} critical).`
    );
  }
  if (analysis.hasCobolRounded) {
    analysis.recommendations.push(
      'Create regression tests with boundary values: 1.005, 1.015, 2.5, 3.5, 4.5'
    );
  }

  return analysis;
}

// Detect CobolRuntime class configuration  
function analyzeCobolRuntime(pythonCode: string): string {
  const lines = pythonCode.split('\n');
  const runtimeInfo: string[] = [];

  // Find DEFAULT_ROUNDING setting
  const roundingMatch = pythonCode.match(/DEFAULT_ROUNDING\s*=\s*(\w+)/i);
  if (roundingMatch) {
    runtimeInfo.push(`CobolRuntime.DEFAULT_ROUNDING = ${roundingMatch[1]}`);
  }

  // Find decimal precision
  const precisionMatch = pythonCode.match(/decimal_precision\s*=\s*(\d+)/i) || 
                         pythonCode.match(/getcontext\(\)\.prec\s*=\s*(\d+)/i);
  if (precisionMatch) {
    runtimeInfo.push(`Decimal precision = ${precisionMatch[1]}`);
  }

  // Find CobolRuntime class definition
  if (pythonCode.includes('class CobolRuntime')) {
    runtimeInfo.push('CobolRuntime class is defined - use cobol_round() for consistent behavior');
  }

  return runtimeInfo.length > 0 ? runtimeInfo.join('\n') : 'No CobolRuntime configuration detected';
}

// Phase 4: COBOL documentation links
const COBOL_DOCS: Record<string, string> = {
  'COMP-3': 'Packed decimal format - each digit uses 4 bits, sign in last nibble. Python equivalent: Decimal with banker rounding.',
  'REDEFINES': 'Memory overlay - same memory location with different structure. Python: Use dataclass with properties or union types.',
  'OCCURS': 'Array declaration. Python: List with fixed size or typed array.',
  'PIC': 'Picture clause defines data format. 9=numeric, X=alphanumeric, S=signed, V=implied decimal.',
  'PERFORM': 'Procedure call or loop. Python: function call or for/while loop.',
  'COPY': 'Include copybook (external file). Python: import statement.',
  'WORKING-STORAGE': 'Program variables section. Python: class attributes in __init__.',
  'FILE-CONTROL': 'File definitions. Python: FileManager class with context managers.',
  '88-LEVEL': 'Condition names (boolean flags). Python: @property returning bool.',
  'EVALUATE': 'Switch/case statement. Python: match/case or if/elif chain.',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      cobolCode, 
      pythonCode, 
      analysis, 
      testResults,
      edgeCaseResults,
      // Full Context from ALL TABS
      shadowTesting,           // Shadow Testing Panel data
      productionReadiness,     // Production Readiness Panel data
      complianceAssessment,    // Compliance Assessment data
      cyclomaticComplexity,    // Complexity metrics
      modules,                 // Architecture modules
      architectureDiagram,     // Architecture diagram (Mermaid)
      securityScore,           // Calculated security score
      metrics,                 // Overall metrics
      // Phase 1: Enhanced context
      selectedLine,
      activeError,
      conversationHistory // Phase 3: Conversation memory
    } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

    // Phase 1: Build enhanced context
    let analysisContext = '';
    if (analysis) {
      const metricsData = metrics || {
        cobolLines: analysis.cobol_lines || 0,
        pythonLines: analysis.python_lines || 0,
        confidence: analysis.migration_score?.confidence || 0,
        complexity: analysis.migration_score?.complexity || 'Unknown',
        riskLevel: analysis.migration_score?.risk_level || 'Unknown',
        effort: analysis.migration_score?.estimated_effort || 'Unknown',
      };
      
      const issues = analysis.issues || [];
      const improvements = analysis.improvements || [];
      const securityWarnings = analysis.security_warnings || [];
      const nextSteps = analysis.next_steps || [];
      const coverage = analysis.coverage_metrics || {};
      
      // Extract COBOL structure info
      const transpilerStats = analysis.transpiler_stats || {};
      const paragraphs = transpilerStats.cobol_paragraphs || 0;
      const variables = transpilerStats.cobol_variables || 0;
      const programId = transpilerStats.program_id || 'UNKNOWN';
      
      analysisContext = `
## 📊 ANALYSIS METRICS (from ALL TABS):
### Overall Metrics:
- Program ID: ${programId}
- COBOL Lines: ${metricsData.cobolLines}
- Python Lines: ${metricsData.pythonLines}
- Translation Rate: ${coverage.translation_rate || 100}%
- Confidence Score: ${metricsData.confidence}%
- Complexity: ${metricsData.complexity}
- Risk Level: ${metricsData.riskLevel}
- Estimated Effort: ${metricsData.effort}

### COBOL Structure:
- COBOL Paragraphs: ${paragraphs}
- COBOL Variables: ${variables}
- Methods Generated: ${coverage.python_methods_generated || 0}
- Fallbacks Used: ${coverage.fallback_count || 0}

### Test Results:
- Unit Tests Total: ${testResults?.total || 0}
- Unit Tests Passed: ${testResults?.passed || 0}
- Unit Tests Failed: ${testResults?.failed || 0}
- Pass Rate: ${testResults?.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0}%

### Edge Case Testing:
- Edge Cases Total: ${edgeCaseResults?.total || 0}
- Edge Cases Passed: ${edgeCaseResults?.passed || 0}
- Edge Cases Failed: ${edgeCaseResults?.failed || 0}
- Coverage: ${edgeCaseResults?.coverage || 0}%

### Security Score: ${securityScore?.score || 'N/A'}/100 (Grade: ${securityScore?.grade || 'N/A'})
${securityScore ? `- CRITICAL: ${securityScore.critical || 0}, HIGH: ${securityScore.high || 0}, MEDIUM: ${securityScore.medium || 0}` : ''}

## 🔍 ISSUES FOUND (${issues.length}):
${issues.slice(0, 8).map((i: any) => `- ${typeof i === 'string' ? i : i.title || JSON.stringify(i)}`).join('\n')}
${issues.length > 8 ? `\n- ... and ${issues.length - 8} more issues` : ''}

## 🚀 IMPROVEMENTS (${improvements.length}):
${improvements.slice(0, 8).map((i: any) => `- ${typeof i === 'string' ? i : i}`).join('\n')}
${improvements.length > 8 ? `\n- ... and ${improvements.length - 8} more improvements` : ''}

## ⚠️ SECURITY WARNINGS (${securityWarnings.length}):
${securityWarnings.slice(0, 5).map((w: any) => `- [${w.severity || 'INFO'}] ${w.title || w}`).join('\n')}

## 📋 NEXT STEPS:
${nextSteps.slice(0, 6).map((s: string) => `- ${s}`).join('\n')}

## 💼 BUSINESS CONTEXT:
- Domain: ${analysis.business_context?.domain || 'Enterprise'}
- Detected Year: ${analysis.business_context?.detected_year || 'Unknown'}
- Regulatory Context: ${analysis.business_context?.regulatory_context || 'None'}
- Is Obsolete: ${analysis.business_context?.is_obsolete ? 'YES - ' + (analysis.business_context?.obsolescence_reason || 'obsolete code') : 'No'}

## 🏗️ ARCHITECTURE TAB DATA:
### Modules (${modules?.length || 0} total):
${(modules || []).slice(0, 10).map((m: any) => `- ${m.name}: ${m.lines || 0} lines, complexity: ${m.complexity || 'MEDIUM'}, risk: ${m.risk || 'LOW'}`).join('\n')}
${(modules?.length || 0) > 10 ? `\n- ... and ${modules.length - 10} more modules` : ''}

### Architecture Diagram:
${architectureDiagram ? 'Available (Mermaid format)' : 'Not generated'}

## 📈 COMPLEXITY ANALYSIS:
${cyclomaticComplexity ? `
- Average Complexity: ${cyclomaticComplexity.average || 'N/A'}
- Highest Risk: ${cyclomaticComplexity.highest?.name || 'N/A'} (complexity: ${cyclomaticComplexity.highest?.complexity || 'N/A'})
- High Risk Paragraphs: ${cyclomaticComplexity.paragraphs?.filter((p: any) => p.risk === 'HIGH').length || 0}
` : '- Not available'}

## 🧪 SHADOW TESTING PLAN:
${shadowTesting ? `
- Readiness Score: ${shadowTesting.readiness_score || 'N/A'}%
- Status: ${shadowTesting.readiness_status || 'Unknown'}
- Estimated Duration: ${shadowTesting.estimated_duration || 'Unknown'}
- Critical Paths: ${shadowTesting.critical_paths?.length || 0}
- Risk Mitigation: ${shadowTesting.risk_mitigation?.length || 0} strategies
${shadowTesting.critical_paths?.slice(0, 3).map((p: any) => `- ${p.category}: ${p.description?.substring(0, 80)}...`).join('\n') || ''}
` : '- Not available - Run analysis to generate shadow testing plan'}

## ✅ PRODUCTION READINESS:
${productionReadiness ? `
- Overall Score: ${productionReadiness.overallScore || 'N/A'}%
- Categories: ${Object.keys(productionReadiness.categories || {}).join(', ') || 'None assessed'}
- Critical Issues: ${productionReadiness.criticalIssues || 0}
- Recommendations: ${productionReadiness.recommendations?.length || 0}
` : '- Not available - Run production readiness assessment'}

## 📜 COMPLIANCE ASSESSMENT:
${complianceAssessment ? `
- Overall Risk: ${complianceAssessment.overall_risk || 'Unknown'}
- Applicable Regulations:
${Object.entries(complianceAssessment).filter(([k]) => 
  ['sox', 'pci_dss', 'gdpr', 'hipaa'].includes(k.toLowerCase())
).map(([key, value]: [string, any]) => 
  `- ${key.toUpperCase()}: ${value.status || 'N/A'} (${value.applicable ? 'applicable' : 'not applicable'})`
).join('\n') || '- None'}
` : '- Not available - Run compliance assessment'}

## 🎯 SUMMARY:
${analysis.summary || 'No summary available'}
`;
    }

    // Phase 1: Selected line context
    let lineContext = '';
    if (selectedLine) {
      lineContext = `
## 📍 CONTEXTE LIGNE SÉLECTIONNÉE:
- Numéro de ligne: ${selectedLine.lineNumber}
- Type: ${selectedLine.type} (COBOL/Python)
- Contenu: \`${selectedLine.content}\`
${selectedLine.mappedLine ? `- Ligne correspondante: ${selectedLine.mappedLine}` : ''}
`;
    }

    // Phase 1: Active error context
    let errorContext = '';
    if (activeError) {
      errorContext = `
## ❌ ERREUR ACTIVE:
- Type: ${activeError.type}
- Message: ${activeError.message}
- Ligne: ${activeError.line || 'N/A'}
- Suggestion: ${activeError.suggestion || 'Aucune'}
`;
    }

    // Phase 3: Conversation history
    let historyContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      historyContext = `
## 💬 HISTORIQUE DE CONVERSATION (${conversationHistory.length} messages précédents):
${conversationHistory.slice(-5).map((h: any) => `- Q: ${h.query?.substring(0, 100)}...\n  R: ${h.response?.substring(0, 150)}...`).join('\n')}
`;
    }

    // Phase 4: Detect COBOL keywords for documentation
    const detectedKeywords: string[] = [];
    const queryUpper = query.toUpperCase();
    const codeToSearch = (cobolCode || '') + ' ' + query;
    
    Object.keys(COBOL_DOCS).forEach(keyword => {
      if (codeToSearch.toUpperCase().includes(keyword.replace('-', ' ')) || 
          codeToSearch.toUpperCase().includes(keyword)) {
        detectedKeywords.push(keyword);
      }
    });

    let docsContext = '';
    if (detectedKeywords.length > 0) {
      docsContext = `
## 📚 RELEVANT COBOL DOCUMENTATION:
${detectedKeywords.slice(0, 4).map(kw => `### ${kw}\n${COBOL_DOCS[kw]}`).join('\n\n')}
`;
    }

    // Phase 6: Rounding analysis for financial accuracy
    const queryLower = query.toLowerCase();
    const roundingAnalysis = analyzeRoundingIssues(cobolCode || '', pythonCode || '');
    const runtimeConfig = analyzeCobolRuntime(pythonCode || '');
    
    let roundingContext = '';
    if (roundingAnalysis.hasCobolRounded || 
        roundingAnalysis.inconsistencies.length > 0 || 
        roundingAnalysis.missingRounding.length > 0 ||
        queryLower.includes('arrondi') || queryLower.includes('round') || 
        queryLower.includes('decimal') || queryLower.includes('precision') ||
        queryLower.includes('centime') || queryLower.includes('penny')) {
      
      roundingContext = `
## 🔢 ROUNDING ANALYSIS (Auto-detected):
### COBOL ROUNDED Detection:
- COBOL uses ROUNDED keyword: ${roundingAnalysis.hasCobolRounded ? 'YES' : 'NO'}
${roundingAnalysis.cobolRoundedVariables.length > 0 ? `- Variables: ${roundingAnalysis.cobolRoundedVariables.join(', ')}` : ''}

### Python Rounding Methods Found:
${roundingAnalysis.pythonRoundingMethods.length > 0 ? roundingAnalysis.pythonRoundingMethods.map(m => `- ${m}`).join('\n') : '- No explicit rounding methods detected'}

### CobolRuntime Configuration:
${runtimeConfig}

${roundingAnalysis.inconsistencies.length > 0 ? `### ⚠️ INCONSISTENCIES DETECTED:\n${roundingAnalysis.inconsistencies.map(i => `- ${i}`).join('\n')}\n` : ''}
${roundingAnalysis.missingRounding.length > 0 ? `### 🚨 MISSING ROUNDING (CRITICAL):\n${roundingAnalysis.missingRounding.map(m => `- ${m}`).join('\n')}\n` : ''}
${roundingAnalysis.recommendations.length > 0 ? `### 💡 RECOMMENDATIONS:\n${roundingAnalysis.recommendations.map(r => `- ${r}`).join('\n')}` : ''}
`;
    }

    // Build the enhanced prompt
    const prompt = `You are an expert in COBOL to Python migration, specialized in banking and financial legacy systems.
You have deep knowledge of CobolRuntime, decimal precision, and rounding differences between COBOL and Python.
You have access to COMPLETE ANALYSIS DATA from ALL TABS including:
- Code Analysis, Tests, Metrics
- Shadow Testing Plan, Production Readiness
- Compliance Assessment, Architecture, Complexity Analysis

IMPORTANT: Always respond ONLY in English, regardless of the language the user uses in their question.

USE ALL AVAILABLE CONTEXT to provide comprehensive answers. Reference specific metrics, scores, and data from the analysis.

${analysisContext}
${lineContext}
${errorContext}
${historyContext}
${docsContext}
${roundingContext}

## 🖥️ COBOL SOURCE CODE (extract):
\`\`\`cobol
${cobolCode || 'Non fourni'}
\`\`\`

## 🐍 GENERATED PYTHON CODE (extract):
\`\`\`python
${pythonCode || 'Non fourni'}
\`\`\`

## ❓ USER QUESTION:
${query}

## 🛠️ EXPERT KNOWLEDGE BASE (always mention when relevant):

### Libraries & Tools to Reference:
- **cobolfmt**: COPYBOOK parser for Python (parsing data structures)
- **pycobol**: COBOL-Python interoperability library
- **decimal2**: Enhanced precision for financial calculations
- **hypothesis**: Property-based testing framework
- **contextvars**: Python stdlib for request-isolated global state

### COBOL-Specific Metrics to Monitor:
- cobol_global_counter_drift: Track divergence in global counters
- packed_decimal_conversion_errors: COMP-3 conversion failures
- on_size_error_trigger_count: Overflow/truncation events
- transaction_processing_delta_ms: COBOL vs Python timing diff
- rounding_discrepancy_count: Financial precision mismatches

### Banking Patterns to Propose:
- **Event Sourcing**: For immutable audit trail (SOX/PCI-DSS compliance)
- **Double-entry accounting**: Ensure credit/debit balance
- **Compensation transactions**: For rollback in distributed systems
- **Strangler Pattern**: Gradual migration with proxy routing

### Migration Architecture Recommendations:
- Use API Gateway for routing between COBOL/Python systems
- Shadow testing: Run both systems, compare results silently
- Canary releases by customer segment (5% → 25% → 100%)
- Blue-green deployment with automatic rollback on error rate > 0.1%

### State Synchronization for Migration:
- Message queues (Kafka/RabbitMQ) for event-driven sync
- Database CDC (Change Data Capture) for real-time replication
- Compensation logs for conflict resolution

## 📝 RESPONSE INSTRUCTIONS:
1. **BE SPECIFIC** - Use exact variable names, paragraph names, and line references from the code
2. **CITE METRICS** - Reference precise numbers from ALL TABS (confidence score, security score, test results, etc.)
3. **EXPLAIN WHY** - Not just what happens, but why it happens that way
4. **USE ALL DATA** - Reference shadow testing, production readiness, compliance data when relevant
5. **Markdown Format** - Use code blocks, lists, and formatting
6. **If suggesting code** - Put it in a copyable \`\`\`python block
7. **ANALYZE THE ACTUAL CODE** - Reference specific lines and classes from the generated Python code
8. **For rounding questions** - Always check the ROUNDING ANALYSIS section and propose specific fixes
9. **Language** - Respond in the same language as the question
10. **MENTION TOOLS** - Reference specific libraries (cobolfmt, pycobol, etc.) when applicable
11. **PROPOSE ARCHITECTURE** - For complex questions, suggest architectural patterns with diagrams description
12. **COMPLIANCE** - Mention SOX, PCI-DSS, GDPR implications for banking migrations
13. **GIVE CONTEXTUAL ANSWERS** - Don't say "I don't have access to that data" - use all the context provided above

## 📋 RESPONSE STRUCTURE:
- Start by directly answering the question
- Reference SPECIFIC metrics and data from the analysis (confidence score, test pass rate, security grade, etc.)
- Add technical details with exact line references
- Reference specific libraries/tools when applicable
- If rounding issues detected, propose specific code fixes with line references
- For architecture questions, describe the recommended topology
- Mention shadow testing and production readiness scores when relevant
- End with 2-3 suggested follow-up questions

## 🚨 IMPORTANT:
You have access to COMPLETE DATA from ALL ANALYSIS TABS. When the user asks about:
- "Is this production ready?" → Reference productionReadiness score, securityScore, testResults
- "What are the risks?" → Reference migration_score.risk, securityScore, complianceAssessment
- "How good is the translation?" → Reference confidence score, translation rate, test pass rate
- "What should I test?" → Reference shadowTesting.critical_paths, edgeCaseResults
- "What compliance issues?" → Reference complianceAssessment

USE THIS DATA to give accurate, contextual answers!

RESPONSE:`;

    const result = await model.generateContent(prompt);
    let response = result.response.text();

    // Phase 5: Add suggested questions if not already present
    if (!response.includes('Question') && !response.includes('?')) {
      const suggestedQuestions = generateSuggestedQuestions(query, detectedKeywords, analysis, shadowTesting, productionReadiness, complianceAssessment);
      if (suggestedQuestions.length > 0) {
        response += `\n\n---\n**💡 Questions connexes:**\n${suggestedQuestions.map(q => `- ${q}`).join('\n')}`;
      }
    }

    return NextResponse.json({ 
      response,
      // Return detected keywords for UI to potentially show doc links
      detectedKeywords,
      suggestedQuestions: generateSuggestedQuestions(query, detectedKeywords, analysis, shadowTesting, productionReadiness, complianceAssessment)
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[Chat Error]', error);
    return NextResponse.json(
      { response: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer." },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Phase 5: Generate contextual suggested questions
function generateSuggestedQuestions(query: string, keywords: string[], analysis: any, shadowTesting: any, productionReadiness: any, complianceAssessment: any): string[] {
  const questions: string[] = [];
  const queryLower = query.toLowerCase();
  
  // Based on detected COBOL keywords
  if (keywords.includes('COMP-3')) {
    questions.push("How does banker's rounding work with COMP-3?");
  }
  if (keywords.includes('REDEFINES')) {
    questions.push("Show me an example of REDEFINES converted to Python");
  }
  if (keywords.includes('OCCURS')) {
    questions.push("How are OCCURS arrays handled?");
  }
  
  // Based on query content - rounding specific
  if (queryLower.includes('arrondi') || queryLower.includes('round') || queryLower.includes('decimal')) {
    questions.push("Show me all calculations that need explicit rounding");
    questions.push("Generate regression tests for rounding edge cases");
  }
  if (queryLower.includes('erreur') || queryLower.includes('error')) {
    questions.push("What are the other potential errors in this code?");
  }
  if (queryLower.includes('performance') || queryLower.includes('lent') || queryLower.includes('slow')) {
    questions.push("How can I optimize the performance of this Python code?");
  }
  if (queryLower.includes('test')) {
    questions.push("What additional tests do you recommend?");
    if (shadowTesting) {
      questions.push("What are the critical paths for shadow testing?");
    }
  }
  
  // Based on analysis state
  if (analysis?.security_warnings?.length > 0) {
    questions.push("Explain the most critical security warning and how to fix it");
  }
  if (analysis?.issues?.length > 0) {
    questions.push("How to resolve the detected issues?");
  }
  
  // Production readiness context
  if (productionReadiness) {
    if ((productionReadiness.overallScore || 0) < 80) {
      questions.push("What are the main blockers to production readiness?");
    }
    questions.push("What improvements would increase the production readiness score?");
  }
  
  // Shadow testing context
  if (shadowTesting) {
    questions.push("What test data should I use for shadow testing?");
    questions.push("How long will shadow testing take?");
  }
  
  // Compliance context
  if (complianceAssessment) {
    questions.push("What are the compliance findings I need to address?");
  }
  
  // Confidence context
  if (analysis?.migration_score?.confidence) {
    const conf = typeof analysis.migration_score.confidence === 'number' 
      ? analysis.migration_score.confidence 
      : parseInt(String(analysis.migration_score.confidence || '0'));
    if (conf < 80) {
      questions.push("What would increase the confidence score?");
    }
  }
  
  // Default questions if none matched
  if (questions.length === 0) {
    questions.push("What are the major differences between this COBOL and the generated Python?");
    questions.push("Is this code ready for production?");
    questions.push("What additional tests should I write?");
  }
  
  return questions.slice(0, 4);
}
