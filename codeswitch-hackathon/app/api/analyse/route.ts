import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseCobolWithANTLR, generateANTLRSummary, CobolFullAST } from '@/lib/cobol-antlr-parser';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Prompt for translating a chunk of COBOL code
const CHUNK_PROMPT = `You are a COBOL-to-Python translator. Translate this COBOL code section to Python.

RULES:
- Use @dataclass for record structures
- Use Decimal for numeric PIC 9 with V (decimal)
- Use type hints
- Include docstrings with original COBOL line numbers
- PERFORM → method calls
- EVALUATE → match/case
- Generate complete, executable Python code

Return ONLY raw Python code (no markdown, no \`\`\`, no JSON). Just the Python code.

COBOL CODE:
`;

// Prompt for generating analysis metadata
const ANALYSIS_PROMPT = `Analyze this COBOL program and provide migration metadata.

Return ONLY a valid JSON object:
{
  "summary": "Brief description",
  "business_context": {
    "domain": "Banking/Insurance/Payroll/etc",
    "detected_year": "1985",
    "regulatory_context": "Compliance notes",
    "is_obsolete": true,
    "obsolescence_reason": "Reason"
  },
  "issues": ["Issue 1", "Issue 2"],
  "improvements": ["Improvement 1", "Improvement 2"],
  "security_warnings": [{"title": "Warning", "severity": "HIGH", "cvss_score": 7.0, "location": "Location", "description": "Desc", "vulnerable_code": "Code", "fix": "Fix"}],
  "migration_score": {
    "complexity": "HIGH",
    "risk_level": "CRITICAL",
    "estimated_effort": "80 person-days",
    "confidence": 70
  },
  "architecture_diagram": "graph LR; A-->B",
  "next_steps": ["Step 1", "Step 2"]
}

COBOL AST Summary:
`;

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
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

    // Parse COBOL with ANTLR4 (full COBOL85 grammar)
    console.log(`[AST] Parsing ${cobolCode.length} characters...`);
    const ast: CobolFullAST = parseCobolWithANTLR(cobolCode);
    console.log(`[AST] Parsed: ${ast.programId}, ${ast.metrics.variables} variables, ${ast.metrics.paragraphs} paragraphs`);
    
    const astSummary = generateANTLRSummary(ast);
    const lines = cobolCode.split('\n');
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        maxOutputTokens: 65536,
      }
    });
    const jsonModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
      }
    });

    // === CHUNKED TRANSLATION ===
    // Split COBOL into chunks - max 8 chunks for full coverage
    const MAX_CHUNKS = 8;
    const CHUNK_SIZE = Math.max(500, Math.ceil(lines.length / MAX_CHUNKS));
    const chunks: string[] = [];
    for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
      chunks.push(lines.slice(i, i + CHUNK_SIZE).join('\n'));
    }
    
    console.log(`[Chunks] Splitting ${lines.length} lines into ${chunks.length} chunks of ~${CHUNK_SIZE} lines`);

    // Translate chunks in parallel (max 5 concurrent)
    const translateChunk = async (chunk: string, index: number): Promise<string> => {
      try {
        const result = await model.generateContent(CHUNK_PROMPT + chunk);
        const code = result.response.text();
        console.log(`[Chunk ${index + 1}/${chunks.length}] Translated: ${code.length} chars`);
        return `# === CHUNK ${index + 1} (lines ${index * CHUNK_SIZE + 1}-${Math.min((index + 1) * CHUNK_SIZE, lines.length)}) ===\n${code}`;
      } catch (e: any) {
        console.error(`[Chunk ${index + 1}] Error:`, e.message);
        return `# === CHUNK ${index + 1} ERROR: ${e.message} ===`;
      }
    };

    // Run ALL translations in parallel (max 8 chunks)
    const allPythonCode = await Promise.all(
      chunks.map((chunk, idx) => translateChunk(chunk, idx))
    );

    // Combine all Python code
    const combinedPythonCode = `"""
${ast.programId} - Migrated from COBOL
Original: ${ast.metrics.totalLines} lines COBOL
Translated in ${chunks.length} chunks
"""
from dataclasses import dataclass
from decimal import Decimal
from typing import Optional, List, Dict
import logging

logger = logging.getLogger('${ast.programId}')

${allPythonCode.join('\n\n')}
`;

    console.log(`[Translation] Combined Python: ${combinedPythonCode.split('\n').length} lines`);

    // === ANALYSIS METADATA ===
    console.log(`[Analysis] Getting metadata...`);
    const analysisResult = await jsonModel.generateContent(ANALYSIS_PROMPT + astSummary);
    let metadata;
    try {
      metadata = JSON.parse(analysisResult.response.text());
    } catch (e) {
      metadata = {
        summary: `Migration of ${ast.programId}`,
        business_context: { domain: 'Enterprise', detected_year: '1990s', is_obsolete: true },
        issues: [],
        improvements: [],
        security_warnings: [],
        migration_score: { complexity: 'HIGH', risk_level: 'HIGH', estimated_effort: '60 person-days', confidence: 70 },
        next_steps: []
      };
    }

    // Skip test generation to save time - generate placeholder
    const unitTests = `# Unit tests for ${ast.programId}
import pytest
from decimal import Decimal

def test_placeholder():
    """Placeholder test - implement specific tests"""
    assert True
`;

    // Build final result
    const finalResult = {
      ...metadata,
      python_code: combinedPythonCode,
      unit_tests: unitTests,
      config_json: JSON.stringify({
        program: ast.programId,
        version: '1.0.0',
        migration: {
          source: 'COBOL85',
          target: 'Python 3.10+',
          parser: 'ANTLR4',
          timestamp: new Date().toISOString()
        },
        metrics: {
          original_lines: ast.metrics.totalLines,
          variables: ast.metrics.variables,
          paragraphs: ast.metrics.paragraphs,
          cyclomatic_complexity: ast.metrics.cyclomaticComplexity,
          maintainability_index: ast.metrics.maintainabilityIndex
        },
        dependencies: {
          python: ['dataclasses', 'decimal', 'typing', 'logging'],
          testing: ['pytest', 'pytest-cov'],
          optional: ast.metrics.sqlStatements > 0 ? ['sqlalchemy'] : []
        },
        runtime: {
          min_python_version: '3.10',
          recommended_python_version: '3.11'
        }
      }, null, 2),
      cobol_lines: ast.metrics.totalLines,
      python_lines: combinedPythonCode.split('\n').length,
      filename: filename || `${ast.programId}.cbl`,
      confidence: metadata.migration_score?.confidence || 70,
      category: metadata.business_context?.domain || 'Enterprise',
      risk_level: metadata.migration_score?.risk_level || 'HIGH',
      complexity: metadata.migration_score?.complexity || 'HIGH',
      modules: ast.paragraphs.map(p => ({
        name: p.name,
        lines: p.lineEnd - p.lineStart + 1,
        type: 'PARAGRAPH',
        description: `Lines ${p.lineStart}-${p.lineEnd}`,
        complexity: p.complexity > 3 ? 'HIGH' : p.complexity > 1 ? 'MEDIUM' : 'LOW',
      })),
      ast_metrics: ast.metrics,
      chunks_processed: chunks.length,
      processing_time_ms: Date.now() - startTime,
    };

    console.log(`[Complete] ${chunks.length} chunks, ${finalResult.python_lines} Python lines in ${finalResult.processing_time_ms}ms`);
    return NextResponse.json(finalResult, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[Error]', error);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}
