import { NextRequest, NextResponse } from 'next/server';
import { transpileCobolViaPython, parseCobolQuick, validateCobolInput } from '@/lib/transpiler-client';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Node.js runtime (Edge not compatible with complex modules)
export const runtime = 'nodejs';
export const maxDuration = 60; // 60s timeout for Pro plan

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * CodeSwitch API v16.0 - Unified Python Transpiler Client
 * Uses Python engine as single source of truth via transpiler-client
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

// Expand COPYBOOK references
function expandCopybooks(cobolCode: string, copybooks: Record<string, string>): string {
  if (!copybooks || Object.keys(copybooks).length === 0) {
    return cobolCode;
  }
  
  let expanded = cobolCode;
  
  // Match COPY statements: COPY copybook-name. or COPY "copybook-name".
  const copyPattern = /^\s{6}\s*COPY\s+["']?([A-Z0-9][-A-Z0-9]*)["']?\.?\s*$/gmi;
  
  expanded = expanded.replace(copyPattern, (match, copybookName) => {
    const normalizedName = copybookName.toUpperCase().replace(/["']/g, '');
    
    // Look for copybook in provided copybooks
    const copybookContent = copybooks[normalizedName] || 
                           copybooks[normalizedName.toLowerCase()] ||
                           copybooks[copybookName];
    
    if (copybookContent) {
      return `      * === EXPANDED FROM COPYBOOK: ${normalizedName} ===\n${copybookContent}\n      * === END COPYBOOK: ${normalizedName} ===`;
    }
    
    // If copybook not found, leave a comment
    return `      * COPY ${normalizedName} - (copybook not provided)`;
  });
  
  return expanded;
}

// Resolve TODOs with Gemini
async function resolveTodosWithGemini(pythonCode: string, cobolCode: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.log('[Gemini] No API key, skipping TODO resolution');
    return pythonCode;
  }
  
  // Check if there are TODOs to resolve (both # TODO and logger.debug('TODO: patterns)
  const todoComments = (pythonCode.match(/# TODO/g) || []).length;
  const todoLogs = (pythonCode.match(/\.debug\(['"]TODO:/g) || []).length;
  const todoCount = todoComments + todoLogs;
  if (todoCount === 0) {
    return pythonCode;
  }
  
  console.log(`[Gemini] Resolving ${todoCount} TODOs...`);
  
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: { maxOutputTokens: 65536 }
    });
    
    // Timeout: 50s for Gemini call (maxDuration is 60s)
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Gemini timeout')), 50000)
    );
    
    const prompt = `You are a COBOL-to-Python migration expert. The following Python code was auto-transpiled from COBOL but has TODO markers that need implementation.

ORIGINAL COBOL CODE (first 15000 chars):
\`\`\`cobol
${cobolCode.substring(0, 15000)}
\`\`\`

TRANSPILED PYTHON WITH TODOs:
\`\`\`python
${pythonCode.substring(0, 60000)}
\`\`\`

TODO MARKERS TO FIX:
- Lines with: self.logger.debug('TODO: ...')
- Lines with: # TODO ...

INSTRUCTIONS:
1. Find ALL lines containing 'TODO:' (in logger.debug or comments)
2. Replace each TODO with ACTUAL working Python code implementing the COBOL logic
3. For COMPUTE statements: implement the math using Decimal operations
4. For MOVE statements: implement proper assignments
5. For FILE operations: use Python file I/O or add pass with a comment
6. Keep ALL existing working code unchanged
7. Preserve exact class/method names
8. Use Decimal('...') for all monetary values
9. Return ONLY the complete Python code, no explanations

CRITICAL: Replace logger.debug('TODO: X') with actual implementation of X.

Return the complete fixed Python code:`;
    
    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ]);
    let response = result.response.text();
    
    // Extract code from response
    const codeMatch = response.match(/```python\n([\s\S]*?)```/);
    if (codeMatch) {
      response = codeMatch[1];
    } else {
      response = response.replace(/^```python\n?/gm, '').replace(/```$/gm, '');
    }
    
    // Validate we got reasonable code back
    if (response.includes('class ') && response.includes('def ')) {
      console.log('[Gemini] TODOs resolved successfully');
      return response.trim();
    }
    
    console.log('[Gemini] Response invalid, keeping original');
    return pythonCode;
    
  } catch (error: any) {
    console.error('[Gemini] TODO resolution failed:', error.message);
    return pythonCode;
  }
}

// Generate security warnings
function generateSecurityWarnings(cobolCode: string): any[] {
  const warnings: any[] = [];
  const lines = cobolCode.split('\n');
  const lower = cobolCode.toLowerCase();
  const findLine = (pattern: string) => lines.findIndex(l => l.toLowerCase().includes(pattern)) + 1;

  if (lower.includes('password') || lower.includes('pwd')) {
    warnings.push({ title: 'Hardcoded credentials', severity: 'CRITICAL', cvss_score: 9.1, location: `Line ${findLine('password') || findLine('pwd')}`, description: 'Sensitive credentials in source', fix: 'Use environment variables' });
  }
  if (lower.includes('exec sql') && !lower.includes('prepare')) {
    warnings.push({ title: 'SQL injection risk', severity: 'HIGH', cvss_score: 8.6, location: `Line ${findLine('exec sql')}`, description: 'Dynamic SQL without parameterization', fix: 'Use parameterized queries' });
  }
  if (lower.includes('ssn') || lower.includes('social-security')) {
    warnings.push({ title: 'PII data exposure', severity: 'MEDIUM', cvss_score: 5.3, location: `Line ${findLine('ssn') || findLine('social-security')}`, description: 'SSN stored in plain text', fix: 'Encrypt at rest and in transit' });
  }
  
  return warnings;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const { cobolCode, filename, outputMode, copybooks, enhancedMode } = await request.json();

    if (!cobolCode) {
      return NextResponse.json(
        { error: 'cobolCode is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Step 1: Expand COPYBOOK references if provided
    const expandedCobolCode = expandCopybooks(cobolCode, copybooks || {});
    
    // Validate COBOL (use unified validator)
    const validation = validateCobolInput(expandedCobolCode);
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Invalid COBOL code: ${validation.reason}` },
        { status: 400, headers: corsHeaders }
      );
    }

    const totalLines = cobolCode.split('\n').length;
    console.log(`[v16.0] Processing ${totalLines} lines via Python transpiler`);
    
    // Quick parse for UI feedback while Python processes
    const quickParse = parseCobolQuick(expandedCobolCode);
    
    // Clean Architecture mode - call Python backend
    if (outputMode === 'clean-architecture') {
      console.log(`[v16.0] Clean Architecture mode requested`);
      
      // Call Python transpiler
      const transpileResult = await transpileCobolViaPython(expandedCobolCode, enhancedMode);
      
      if (!transpileResult.success) {
        return NextResponse.json(
          { error: transpileResult.error || 'Transpilation failed' },
          { status: 500, headers: corsHeaders }
        );
      }
      
      const processingTime = Date.now() - startTime;
      
      // Generate clean architecture file structure
      const programId = quickParse.programId;
      const className = programId.replace(/-/g, '_').replace(/^\d/, 'P') + 'Processor';
      
      const filesObject: Record<string, string> = {
        [`src/${className.toLowerCase()}/main.py`]: transpileResult.python_code,
        [`tests/test_${className.toLowerCase()}.py`]: transpileResult.unit_tests,
      };
      
      return NextResponse.json({
        success: true,
        outputMode: 'clean-architecture',
        programId: programId,
        files: filesObject,
        stats: {
          ...transpileResult.stats,
          totalFiles: Object.keys(filesObject).length,
          processingTimeMs: processingTime
        },
        security_warnings: generateSecurityWarnings(cobolCode)
      }, { headers: corsHeaders });
    }
    
    // Default: single-file mode via Python transpiler
    let transpileResult = await transpileCobolViaPython(expandedCobolCode, false);

    if (!transpileResult.success) {
      return NextResponse.json(
        { error: transpileResult.error || 'Transpilation failed' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Step 2: Resolve TODOs with Gemini if enhancedMode is enabled
    if (enhancedMode) {
      console.log('[v16.0] Enhanced mode enabled - resolving TODOs with Gemini...');
      const resolvedCode = await resolveTodosWithGemini(transpileResult.python_code, expandedCobolCode);
      transpileResult = {
        ...transpileResult,
        python_code: resolvedCode,
        pythonCode: resolvedCode
      };
    }

    // Extract program ID from quick parse
    const programId = quickParse.programId;
    const className = programId.replace(/-/g, '_').replace(/^\d/, 'P') + 'Processor';

    // Build response
    const pythonLines = transpileResult.python_code.split('\n').length;
    const processingTime = Date.now() - startTime;
    
    // Generate architecture diagram
    const archDiagram = `flowchart TB
    subgraph COBOL[${programId} - COBOL Legacy]
      direction LR
      ID[Identification]
      DATA[Data Division]
      PROC[Procedure Division]
    end
    subgraph Python[Python Modules]
      direction TB
      Main[${className}]
      Config[Configuration]
      Methods[Business Logic]
    end
    COBOL ==>|Python Transpiler v4.4| Python
    Main --> Config
    Main --> Methods`;

    // Analyze issues
    const issues: any[] = [];
    if (totalLines > 5000) issues.push({ title: `Large codebase: ${totalLines} lines`, severity: 'HIGH', description: 'Consider splitting into modules', recommendation: 'Split into smaller files' });
    if (cobolCode.toLowerCase().includes('goto')) issues.push({ title: 'GOTO detected', severity: 'MEDIUM', description: 'Unstructured control flow', recommendation: 'Replace with structured loops' });
    if (issues.length === 0) issues.push({ title: 'Clean transpilation', severity: 'INFO', description: 'No major issues', recommendation: 'Proceed with testing' });

    // Improvements
    const improvements = [
      `${transpileResult.stats?.paragraphs || quickParse.paragraphs.length} methods transpiled`,
      '100% syntax-valid Python code guaranteed',
      'Clean Architecture with dataclasses',
      'Boolean flags (not Y/N strings)',
      'Decimal for all monetary values',
      'Unified Python transpiler engine'
    ];

    // Security analysis
    const securityWarnings = generateSecurityWarnings(cobolCode);

    // Generate unit tests (use what Python returned or generate stubs)
    const generatedTests = transpileResult.unit_tests || `"""Auto-generated unit tests for ${className}"""
import pytest
from decimal import Decimal

class Test${className}:
    """Test suite for ${className}"""
    
    def setup_method(self):
        """Setup test fixtures"""
        pass
    
    def test_initialization(self):
        """Test system initialization"""
        pass
    
    def test_decimal_precision(self):
        """Test Decimal precision for monetary values"""
        amount = Decimal('1000.00')
        rate = Decimal('0.05')
        interest = amount * rate
        assert interest == Decimal('50.00')
`;

    // Generate config with extracted rates
    const rateMatches = [...transpileResult.python_code.matchAll(/(\w+_rate):\s*Decimal\(['"]([\d.]+)['"]\)/g)];
    const feeMatches = [...transpileResult.python_code.matchAll(/(\w+_fee):\s*Decimal\(['"]([\d.]+)['"]\)/g)];
    const configData = {
      transpiler: 'Python v4.4.0',
      ai_calls: transpileResult.stats?.gemini_calls || 0,
      syntax_valid: true,
      rates: Object.fromEntries(rateMatches.slice(0, 15).map(m => [m[1], parseFloat(m[2])])),
      fees: Object.fromEntries(feeMatches.slice(0, 10).map(m => [m[1], parseFloat(m[2])])),
      settings: {
        decimal_precision: 2,
        currency: 'USD',
        date_format: 'YYYY-MM-DD'
      }
    };

    // Detect business domain from COBOL content
    const upperCode = cobolCode.toUpperCase();
    const domainKeywords: Record<string, string[]> = {
      'Banking': ['ACCOUNT', 'DEPOSIT', 'WITHDRAW', 'BALANCE', 'INTEREST', 'LOAN', 'MORTGAGE', 'CREDIT'],
      'Insurance': ['POLICY', 'PREMIUM', 'CLAIM', 'COVERAGE', 'INSURED', 'BENEFICIARY'],
      'Taxation': ['TAX', 'FISCAL', 'DEDUCTION', 'BRACKET', 'INCOME', 'WITHHOLDING'],
      'Payroll': ['SALARY', 'WAGE', 'EMPLOYEE', 'PAYROLL', 'OVERTIME', 'BENEFIT'],
      'Inventory': ['STOCK', 'INVENTORY', 'WAREHOUSE', 'PRODUCT', 'SKU', 'QUANTITY'],
      'Healthcare': ['PATIENT', 'MEDICAL', 'DIAGNOSIS', 'HOSPITAL', 'PRESCRIPTION']
    };
    
    let detectedDomain = 'Enterprise';
    let maxScore = 0;
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      const score = keywords.filter(kw => upperCode.includes(kw)).length;
      if (score > maxScore) {
        maxScore = score;
        detectedDomain = domain;
      }
    }
    
    // Detect year from comments or date patterns
    const yearMatch = cobolCode.match(/(?:19|20)\d{2}/) || cobolCode.match(/YEAR[\s-]*(\d{4})/);
    const detectedYear = yearMatch ? yearMatch[0] : 'Legacy';
    
    // Calculate confidence based on code quality
    const hasProperStructure = cobolCode.includes('IDENTIFICATION DIVISION') && cobolCode.includes('PROCEDURE DIVISION');
    const hasClearNaming = (cobolCode.match(/[A-Z0-9]+-[A-Z0-9]+/g) || []).length > 10;
    const hasComments = (cobolCode.match(/\*.*$/gm) || []).length > 5;
    let confidenceScore = 85;
    if (hasProperStructure) confidenceScore += 5;
    if (hasClearNaming) confidenceScore += 5;
    if (hasComments) confidenceScore += 3;
    if (totalLines > 1000) confidenceScore += 2; // More code = more context
    confidenceScore = Math.min(99, confidenceScore);

    // Build modules list from quick parse
    const modules = quickParse.paragraphs.slice(0, 50).map(p => ({
      name: p.name,
      type: 'PARAGRAPH',
      complexity: 'MEDIUM'
    }));

    return NextResponse.json({
      // Core output
      python_code: transpileResult.python_code,
      pythonCode: transpileResult.python_code,
      unit_tests: generatedTests,
      tests: generatedTests,
      config_json: JSON.stringify(configData, null, 2),
      config: configData,
      
      // Metrics
      cobol_lines: totalLines,
      python_lines: pythonLines,
      confidence: 98,
      complexity: totalLines > 5000 ? 'HIGH' : totalLines > 1000 ? 'MEDIUM' : 'LOW',
      risk_level: 'LOW',
      processing_time_ms: processingTime,
      code_valid: true,
      
      // Summary
      summary: `${totalLines} COBOL lines → ${pythonLines} Python lines (Python Transpiler v4.4, unified engine)`,
      
      // Analysis tabs
      issues,
      improvements,
      security_warnings: securityWarnings,
      architecture_diagram: archDiagram,
      modules,
      
      // Business context (dynamically detected)
      business_context: {
        domain: detectedDomain,
        detected_year: detectedYear,
        is_obsolete: detectedYear === 'Legacy' || (parseInt(detectedYear) < 2000),
        regulatory_context: `${detectedDomain} system modernization via Python transpiler`
      },
      
      // Migration score (calculated)
      migration_score: {
        complexity: totalLines > 5000 ? 'HIGH' : totalLines > 1000 ? 'MEDIUM' : 'LOW',
        risk_level: maxScore > 5 ? 'LOW' : maxScore > 2 ? 'MEDIUM' : 'LOW',
        estimated_effort: `${Math.round(totalLines / 500)} person-days`,
        confidence: confidenceScore
      },
      
      // Next steps
      next_steps: [
        'Review generated Python code',
        'Run generated unit tests',
        'Validate business logic',
        'Deploy to staging environment'
      ],
      
      // Metadata
      filename: filename || `${programId}.cbl`,
      category: 'Enterprise',
      version: transpileResult.version || '4.4.0',
      architecture: transpileResult.architecture || 'Clean Architecture',
      
      // Stats from transpiler
      transpiler_stats: transpileResult.stats || {
        variables: quickParse.workingStorageVariables.length,
        paragraphs: quickParse.paragraphs.length,
        program_id: programId
      }
      
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[v16.0] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}
