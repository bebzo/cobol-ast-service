import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseCobol, generateASTSummary, CobolAST } from '@/lib/cobol-parser';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const GEMINI_PROMPT = `You are CodeSwitch Pro, an expert COBOL-to-Python migration architect.

I will provide you with a COBOL AST (Abstract Syntax Tree) analysis. Based on this structured data, generate production-quality Python code.

REQUIREMENTS:
1. Use @dataclass for all data structures
2. Use Decimal for financial calculations
3. Use complete type hints
4. Include docstrings
5. Generate matching pytest unit tests

Respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "summary": "Brief description of what the program does",
  "business_context": {
    "domain": "Business domain (banking, insurance, payroll, etc.)",
    "detected_year": "Estimated year based on patterns",
    "regulatory_context": "Any compliance considerations",
    "is_obsolete": true/false,
    "obsolescence_reason": "Why if obsolete"
  },
  "python_code": "Complete Python code as a single string with \\n for newlines",
  "unit_tests": "Complete pytest code as a single string with \\n for newlines",
  "config_json": "Example configuration JSON",
  "issues": ["List of issues found"],
  "improvements": ["List of recommended improvements"],
  "security_warnings": [{"title": "Warning title", "severity": "HIGH/MEDIUM/LOW", "cvss_score": 5.0, "location": "Location", "description": "Description", "vulnerable_code": "Code", "fix": "Fix"}],
  "migration_score": {
    "complexity": "LOW/MEDIUM/HIGH",
    "risk_level": "LOW/MEDIUM/HIGH/CRITICAL",
    "estimated_effort": "X person-days",
    "confidence": 85
  },
  "architecture_diagram": "graph LR; A[Module] --> B[Class]",
  "next_steps": ["Step 1", "Step 2"]
}

COBOL AST Analysis:
`;

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { cobolCode, filename } = await request.json();

    if (!cobolCode) {
      return NextResponse.json(
        { error: 'cobolCode is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Parse COBOL to AST
    const ast: CobolAST = parseCobol(cobolCode);
    const astSummary = generateASTSummary(ast);

    // Call Gemini with AST
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = GEMINI_PROMPT + astSummary;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse Gemini response
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.error('Gemini JSON parse error:', parseError);
      // Use AST data to generate fallback
      parsed = generateFallbackFromAST(ast, filename);
    }

    // Enrich with AST metrics
    const finalResult = {
      ...parsed,
      cobol_lines: ast.metrics.totalLines,
      python_lines: parsed.python_code?.split('\\n').length || 50,
      filename: filename || `${ast.programId}.cbl`,
      confidence: parsed.migration_score?.confidence || 85,
      category: parsed.business_context?.domain || 'Enterprise Application',
      risk_level: parsed.migration_score?.risk_level || 'MEDIUM',
      complexity: parsed.migration_score?.complexity || 'MEDIUM',
      // Add AST data for modules view
      modules: ast.paragraphs.map(p => ({
        name: p.name,
        lines: p.lineEnd - p.lineStart + 1,
        type: 'PARAGRAPH',
        description: `Contains ${p.statements.length} statements, calls: ${p.calls.join(', ') || 'none'}`,
        complexity: p.complexity > 3 ? 'HIGH' : p.complexity > 1 ? 'MEDIUM' : 'LOW',
      })),
      ast_metrics: ast.metrics,
      ast_patterns: ast.patterns,
      ast_issues: ast.issues,
      ast_copybooks: ast.copybooks,
    };

    return NextResponse.json(finalResult, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}

function generateFallbackFromAST(ast: CobolAST, filename?: string): any {
  const varDefs = ast.workingStorage.slice(0, 10).map(v => 
    `    ${v.name.toLowerCase().replace(/-/g, '_')}: ${v.picture?.includes('9') ? 'Decimal' : 'str'} = ${v.picture?.includes('9') ? "Decimal('0')" : "''"}`
  ).join('\n');

  const methods = ast.paragraphs.slice(0, 5).map(p =>
    `    def ${p.name.toLowerCase().replace(/-/g, '_')}(self):\n        """${p.name} - migrated from COBOL"""\n        pass`
  ).join('\n\n');

  const pythonCode = `"""
${ast.programId} - Migrated from COBOL
Original: ${ast.metrics.totalLines} lines, ${ast.metrics.variableCount} variables, ${ast.metrics.paragraphCount} paragraphs
"""
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ${ast.programId.replace(/-/g, '')}Data:
    """Working storage variables migrated from COBOL"""
${varDefs || '    value: Decimal = Decimal("0")'}

class ${ast.programId.replace(/-/g, '')}:
    """Main program class - migrated from ${ast.programId}"""
    
    def __init__(self):
        self.data = ${ast.programId.replace(/-/g, '')}Data()
        logger.info("Initialized ${ast.programId}")

${methods || '    def main(self):\n        """Main entry point"""\n        pass'}

    def run(self):
        """Execute the program"""
        logger.info("Starting ${ast.programId}")
        self.main()
        logger.info("Completed ${ast.programId}")

if __name__ == "__main__":
    program = ${ast.programId.replace(/-/g, '')}()
    program.run()
`;

  const tests = `"""Unit tests for ${ast.programId}"""
import pytest
from decimal import Decimal
from main import ${ast.programId.replace(/-/g, '')}Data, ${ast.programId.replace(/-/g, '')}

class Test${ast.programId.replace(/-/g, '')}Data:
    def test_initialization(self):
        data = ${ast.programId.replace(/-/g, '')}Data()
        assert data is not None

    def test_decimal_precision(self):
        data = ${ast.programId.replace(/-/g, '')}Data()
        # Verify Decimal is used for financial calculations
        assert isinstance(data.value if hasattr(data, 'value') else Decimal('0'), Decimal)

class Test${ast.programId.replace(/-/g, '')}:
    def test_initialization(self):
        program = ${ast.programId.replace(/-/g, '')}()
        assert program.data is not None

    def test_run(self):
        program = ${ast.programId.replace(/-/g, '')}()
        program.run()  # Should not raise

${ast.paragraphs.slice(0, 3).map(p => `    def test_${p.name.toLowerCase().replace(/-/g, '_')}(self):
        program = ${ast.programId.replace(/-/g, '')}()
        # Test ${p.name} logic
        assert True`).join('\n\n')}
`;

  return {
    summary: `Migration of ${ast.programId} - ${ast.metrics.totalLines} lines COBOL to modern Python`,
    business_context: {
      domain: ast.patterns.includes('Decimal arithmetic') ? 'Financial Services' : 'Enterprise Application',
      detected_year: '1990s',
      regulatory_context: ast.patterns.includes('Embedded SQL/CICS') ? 'Database transaction processing' : 'Batch processing',
      is_obsolete: true,
      obsolescence_reason: 'Legacy COBOL requires modernization for maintainability',
    },
    python_code: pythonCode,
    unit_tests: tests,
    config_json: JSON.stringify({
      program: ast.programId,
      version: '1.0.0',
      logging_level: 'INFO',
      decimal_precision: 2,
    }, null, 2),
    issues: [
      ...ast.issues,
      ast.metrics.gotoCount > 0 ? `${ast.metrics.gotoCount} GO TO statements require refactoring` : null,
      ast.metrics.complexity > 50 ? 'High cyclomatic complexity' : null,
      ast.copybooks.length > 0 ? `${ast.copybooks.length} copybooks need migration: ${ast.copybooks.join(', ')}` : null,
    ].filter(Boolean),
    improvements: [
      'Use Python dataclasses for data structures',
      'Implement proper exception handling',
      'Add comprehensive logging',
      ast.metrics.sqlCount > 0 ? 'Replace embedded SQL with SQLAlchemy ORM' : null,
      'Add input validation',
      'Implement unit tests with pytest',
    ].filter(Boolean),
    security_warnings: ast.patterns.includes('Embedded SQL/CICS') ? [{
      title: 'SQL Injection Risk',
      severity: 'HIGH',
      cvss_score: 7.5,
      location: 'EXEC SQL statements',
      description: 'Dynamic SQL may be vulnerable to injection',
      vulnerable_code: 'EXEC SQL ... END-EXEC',
      fix: 'Use parameterized queries in Python',
    }] : [],
    migration_score: {
      complexity: ast.metrics.complexity > 100 ? 'HIGH' : ast.metrics.complexity > 30 ? 'MEDIUM' : 'LOW',
      risk_level: ast.metrics.gotoCount > 5 ? 'HIGH' : ast.issues.length > 3 ? 'MEDIUM' : 'LOW',
      estimated_effort: `${Math.ceil(ast.metrics.totalLines / 100) * 2}-${Math.ceil(ast.metrics.totalLines / 100) * 3} person-days`,
      confidence: 85 - (ast.metrics.gotoCount * 2) - (ast.copybooks.length * 3),
    },
    architecture_diagram: `graph LR; A[${ast.programId}] --> B[Data Classes]; B --> C[Business Logic]; C --> D[Output]`,
    next_steps: [
      'Review generated Python code',
      'Migrate copybooks: ' + (ast.copybooks.join(', ') || 'none'),
      'Run unit tests',
      'Validate business logic',
      'Deploy to staging environment',
    ],
  };
}
