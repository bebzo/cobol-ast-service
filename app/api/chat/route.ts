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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Phase 1: Build enhanced context
    let analysisContext = '';
    if (analysis) {
      const metrics = {
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
## ANALYSIS METRICS:
- Program ID: ${programId}
- COBOL Lines: ${metrics.cobolLines}
- Python Lines: ${metrics.pythonLines}
- COBOL Paragraphs: ${paragraphs}
- COBOL Variables: ${variables}
- Translation Rate: ${coverage.translation_rate || 100}%
- Methods Generated: ${coverage.python_methods_generated || 0}
- Confidence Score: ${metrics.confidence}%
- Complexity: ${metrics.complexity}
- Risk Level: ${metrics.riskLevel}
- Estimated Effort: ${metrics.effort}

## TEST RESULTS:
- Tests Total: ${testResults?.total || 0}
- Tests Passed: ${testResults?.passed || 0}
- Tests Failed: ${testResults?.failed || 0}
- Pass Rate: ${testResults?.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0}%

## ISSUES FOUND (${issues.length}):
${issues.slice(0, 5).map((i: any) => `- ${typeof i === 'string' ? i : i.title || JSON.stringify(i)}`).join('\n')}

## IMPROVEMENTS (${improvements.length}):
${improvements.slice(0, 5).map((i: any) => `- ${typeof i === 'string' ? i : i}`).join('\n')}

## SECURITY WARNINGS (${securityWarnings.length}):
${securityWarnings.slice(0, 5).map((w: any) => `- [${w.severity || 'INFO'}] ${w.title || w}`).join('\n')}

## NEXT STEPS:
${nextSteps.slice(0, 4).map((s: string) => `- ${s}`).join('\n')}

## BUSINESS CONTEXT:
- Domain: ${analysis.business_context?.domain || 'Enterprise'}
- Summary: ${analysis.summary || 'No summary'}
`;
    }

    // Phase 1: Selected line context
    let lineContext = '';
    if (selectedLine) {
      lineContext = `
## CONTEXTE LIGNE SÉLECTIONNÉE:
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
## ERREUR ACTIVE:
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
## HISTORIQUE DE CONVERSATION (${conversationHistory.length} messages précédents):
${conversationHistory.slice(-5).map((h: any) => `- Q: ${h.query.substring(0, 100)}...\n  R: ${h.response.substring(0, 150)}...`).join('\n')}
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
## RELEVANT COBOL DOCUMENTATION:
${detectedKeywords.slice(0, 3).map(kw => `### ${kw}\n${COBOL_DOCS[kw]}`).join('\n\n')}
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
## ROUNDING ANALYSIS (Auto-detected):
### COBOL ROUNDED Detection:
- COBOL uses ROUNDED keyword: ${roundingAnalysis.hasCobolRounded ? 'YES' : 'NO'}

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

${analysisContext}
${lineContext}
${errorContext}
${historyContext}
${docsContext}
${roundingContext}

## COBOL SOURCE CODE (extract):
\`\`\`cobol
${cobolCode || 'Non fourni'}
\`\`\`

## GENERATED PYTHON CODE (extract):
\`\`\`python
${pythonCode || 'Non fourni'}
\`\`\`

## USER QUESTION:
${query}

## RESPONSE INSTRUCTIONS:
1. **BE SPECIFIC** - Use exact variable names, paragraph names, and line references from the code
2. **CITE METRICS** - If relevant, give precise numbers from the analysis
3. **EXPLAIN WHY** - Not just what happens, but why it happens that way
4. **Markdown Format** - Use code blocks, lists, and formatting
5. **If suggesting code** - Put it in a copyable \`\`\`python block
6. **ANALYZE THE ACTUAL CODE** - Reference specific lines and classes from the generated Python code
7. **For rounding questions** - Always check the ROUNDING ANALYSIS section and propose specific fixes
8. **Language** - Respond in the same language as the question

## RESPONSE STRUCTURE:
- Start by directly answering the question
- Add technical details if relevant
- If rounding issues detected, propose specific code fixes with line references
- End with 2-3 suggested follow-up questions

RESPONSE:`;

    const result = await model.generateContent(prompt);
    let response = result.response.text();

    // Phase 5: Add suggested questions if not already present
    if (!response.includes('Question') && !response.includes('?')) {
      const suggestedQuestions = generateSuggestedQuestions(query, detectedKeywords, analysis);
      if (suggestedQuestions.length > 0) {
        response += `\n\n---\n**💡 Questions connexes:**\n${suggestedQuestions.map(q => `- ${q}`).join('\n')}`;
      }
    }

    return NextResponse.json({ 
      response,
      // Return detected keywords for UI to potentially show doc links
      detectedKeywords,
      suggestedQuestions: generateSuggestedQuestions(query, detectedKeywords, analysis)
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
function generateSuggestedQuestions(query: string, keywords: string[], analysis: any): string[] {
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
  }
  
  // Based on analysis state
  if (analysis?.security_warnings?.length > 0) {
    questions.push("Explain the most critical security warning");
  }
  if (analysis?.issues?.length > 0) {
    questions.push("How to resolve the detected issues?");
  }
  
  // Default questions if none matched
  if (questions.length === 0) {
    questions.push("What are the major differences between this COBOL and the generated Python?");
    questions.push("Is this code ready for production?");
  }
  
  return questions.slice(0, 3);
}
