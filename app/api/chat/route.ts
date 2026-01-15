import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Phase 6: Rounding Analysis for Financial Accuracy
interface RoundingAnalysis {
  hasCobolRounded: boolean;
  pythonRoundingMethods: string[];
  inconsistencies: string[];
  missingRounding: string[];
  recommendations: string[];
}

function analyzeRoundingIssues(cobolCode: string, pythonCode: string): RoundingAnalysis {
  const analysis: RoundingAnalysis = {
    hasCobolRounded: false,
    pythonRoundingMethods: [],
    inconsistencies: [],
    missingRounding: [],
    recommendations: []
  };

  if (!cobolCode || !pythonCode) return analysis;

  // Detect COBOL ROUNDED keyword
  const roundedMatches = cobolCode.match(/COMPUTE\s+[\w-]+\s+ROUNDED/gi) || [];
  analysis.hasCobolRounded = roundedMatches.length > 0;

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
      `Mixed rounding modes detected: ROUND_HALF_UP (${roundHalfUp}x) and ROUND_HALF_EVEN (${roundHalfEven}x). ` +
      `This can cause penny differences in financial calculations.`
    );
  }

  // Detect missing rounding: COBOL has ROUNDED but Python may not have .quantize()
  if (analysis.hasCobolRounded && quantize === 0 && cobolRound === 0) {
    analysis.missingRounding.push(
      `COBOL uses ROUNDED (${roundedMatches.length}x) but Python code has no explicit rounding (.quantize() or cobol_round()). ` +
      `This WILL cause precision differences.`
    );
  }

  // Check for Decimal arithmetic without rounding
  const decimalCalcs = pythonCode.match(/self\.\w+\s*=\s*self\.\w+\s*\*[^;\n]+Decimal/g) || [];
  const calcWithoutRounding = decimalCalcs.filter(calc => !calc.includes('quantize') && !calc.includes('round'));
  if (calcWithoutRounding.length > 0 && analysis.hasCobolRounded) {
    analysis.missingRounding.push(
      `Found ${calcWithoutRounding.length} Decimal calculations without explicit rounding that may need .quantize()`
    );
  }

  // Generate recommendations
  if (analysis.inconsistencies.length > 0) {
    analysis.recommendations.push(
      'Standardize on ROUND_HALF_EVEN (banker\'s rounding) for all financial calculations to match COBOL ROUNDED behavior.'
    );
  }
  if (analysis.missingRounding.length > 0) {
    analysis.recommendations.push(
      'Add explicit rounding using: result.quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)'
    );
    analysis.recommendations.push(
      'Or use CobolRuntime.cobol_round(value, "V99") for consistent COBOL-style rounding'
    );
  }
  if (analysis.hasCobolRounded) {
    analysis.recommendations.push(
      'Create regression tests comparing COBOL vs Python results for boundary values like 1.005, 1.015, 2.5, 3.5'
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
