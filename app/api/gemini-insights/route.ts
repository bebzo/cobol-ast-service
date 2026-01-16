/**
 * Gemini 3 Unified Insights API
 * Provides: Code Review, Tests, Optimization, Explanation, Architecture
 * All in one endpoint for efficiency
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface InsightRequest {
  cobolCode: string;
  pythonCode: string;
  type: 'review' | 'tests' | 'optimize' | 'explain' | 'architecture' | 'all';
  context?: {
    programName?: string;
    complexity?: number;
    linesOfCode?: number;
  };
}

interface InsightResponse {
  review?: {
    score: number;
    grade: string;
    issues: Array<{ severity: 'critical' | 'warning' | 'info'; message: string; line?: number }>;
    strengths: string[];
  };
  tests?: {
    unitTests: string;
    edgeCases: string[];
    coverage: string;
  };
  optimization?: {
    suggestions: Array<{ type: string; description: string; impact: 'high' | 'medium' | 'low'; code?: string }>;
    performanceScore: number;
  };
  explanation?: {
    summary: string;
    businessLogic: string[];
    dataFlow: string;
    keyVariables: Array<{ name: string; purpose: string }>;
  };
  architecture?: {
    diagram: string;
    layers: string[];
    patterns: string[];
    recommendations: string[];
  };
}

// Helper: Truncate code at line boundary to avoid cutting words mid-way
function truncateAtLine(code: string, maxLen: number): string {
  if (code.length <= maxLen) return code;
  const truncated = code.substring(0, maxLen);
  const lastNewline = truncated.lastIndexOf('\n');
  if (lastNewline > maxLen * 0.8) {
    return truncated.substring(0, lastNewline);
  }
  return truncated;
}

const PROMPTS = {
  review: (python: string, cobol: string) => `You are a senior code reviewer. Analyze this Python code (transpiled from COBOL) and provide a quality review.

IMPORTANT CONTEXT:
- This is a PARTIAL EXCERPT of a larger codebase for token efficiency
- DO NOT report "code is truncated" or "missing classes" as issues - they exist in the full codebase
- The full code includes: FileManager, Dataclasses, ProductionConfig, AuditRecord, and complete business logic
- Focus ONLY on issues visible in the provided excerpt

COBOL Original (for context):
\`\`\`cobol
${truncateAtLine(cobol, 2000)}
\`\`\`

Python Code to Review (excerpt):
\`\`\`python
${truncateAtLine(python, 12000)}
\`\`\`

Provide a JSON response with this EXACT structure:
{
  "score": 85,
  "grade": "B+",
  "issues": [
    {"severity": "warning", "message": "Consider using type hints", "line": 15}
  ],
  "strengths": ["Good use of Decimal for financial calculations", "Clean class structure"]
}

RULES:
- Focus on: COBOL-Python equivalence, financial precision, error handling, code quality
- DO NOT report truncation/missing code issues
- Verify line numbers against the ACTUAL visible code before reporting
- Return ONLY valid JSON, no markdown.`,

  tests: (python: string, cobol: string) => `You are a test engineer. Generate comprehensive unit tests for this Python code.

NOTE: This is a partial excerpt. The full code includes FileManager, Dataclasses, and complete business logic.

Python Code (excerpt):
\`\`\`python
${truncateAtLine(python, 10000)}
\`\`\`

Original COBOL (for business logic context):
\`\`\`cobol
${truncateAtLine(cobol, 2000)}
\`\`\`

Generate tests that cover:
1. Normal business scenarios
2. Edge cases (zero, negative, max values)
3. Boundary conditions from COBOL PIC clauses
4. Error handling paths

Return JSON with this EXACT structure:
{
  "unitTests": "import pytest\\nfrom decimal import Decimal\\n\\nclass TestBusinessLogic:\\n    def test_calculation(self):\\n        ...",
  "edgeCases": ["Zero amount handling", "Maximum PIC 9(7)V99 value", "Negative balance prevention"],
  "coverage": "Estimated 85% - covers main paths and edge cases"
}

Return ONLY valid JSON, no markdown.`,

  optimize: (python: string) => `You are a Python optimization expert. Analyze this code and suggest improvements.

NOTE: This is a partial excerpt of a larger production codebase.

Python Code (excerpt):
\`\`\`python
${truncateAtLine(python, 12000)}
\`\`\`

Provide optimization suggestions in JSON format:
{
  "suggestions": [
    {
      "type": "Performance",
      "description": "Use list comprehension instead of loop",
      "impact": "medium",
      "code": "result = [x * 2 for x in items]"
    }
  ],
  "performanceScore": 75
}

Focus on: Performance, readability, Pythonic idioms, memory efficiency.
Return ONLY valid JSON, no markdown.`,

  explain: (python: string, cobol: string, programName: string) => `You are a COBOL migration expert. Explain this code for developers unfamiliar with COBOL.

Program: ${programName}

NOTE: These are partial excerpts of the full codebase.

COBOL Original (excerpt):
\`\`\`cobol
${truncateAtLine(cobol, 4000)}
\`\`\`

Python Translation (excerpt):
\`\`\`python
${truncateAtLine(python, 8000)}
\`\`\`

Provide explanation in JSON format:
{
  "summary": "This program calculates interest for customer accounts...",
  "businessLogic": [
    "1. Reads customer records from master file",
    "2. Calculates interest based on account type",
    "3. Updates account balance"
  ],
  "dataFlow": "Input: Customer file → Process: Interest calculation → Output: Updated accounts",
  "keyVariables": [
    {"name": "ws_principal", "purpose": "Stores the account principal amount for interest calculation"}
  ]
}

Return ONLY valid JSON, no markdown.`,

  architecture: (python: string, cobol: string) => `You are a software architect. Analyze the architecture of this transpiled code.

NOTE: This is a partial excerpt. Full code includes: FileManager, ProductionConfig, AuditRecord dataclass, and 7 external CALL implementations.

Python Code (excerpt):
\`\`\`python
${truncateAtLine(python, 10000)}
\`\`\`

Provide architectural analysis in JSON format:
{
  "diagram": "graph TD\\n    A[Input Layer] --> B[Business Logic]\\n    B --> C[Data Layer]\\n    C --> D[Output]",
  "layers": ["Presentation Layer", "Business Logic Layer", "Data Access Layer"],
  "patterns": ["Repository Pattern", "Strategy Pattern for calculations"],
  "recommendations": [
    "Consider extracting file operations into a separate service",
    "Add dependency injection for better testability"
  ]
}

Return ONLY valid JSON, no markdown.`
};

async function callGemini(prompt: string): Promise<any> {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3-pro-preview',
    generationConfig: { 
      maxOutputTokens: 4096,
      temperature: 0.3
    }
  });
  
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  // Extract JSON from response
  let jsonStr = text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Return a fallback structure if JSON parsing fails
    return { error: 'Failed to parse response', raw: text.substring(0, 500) };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: InsightRequest = await request.json();
    const { cobolCode, pythonCode, type, context } = body;
    
    if (!pythonCode) {
      return NextResponse.json({ error: 'pythonCode is required' }, { status: 400 });
    }
    
    const response: InsightResponse = {};
    const programName = context?.programName || 'COBOL Program';
    
    // Execute requested insights in parallel where possible
    const tasks: Promise<void>[] = [];
    
    if (type === 'review' || type === 'all') {
      tasks.push(
        callGemini(PROMPTS.review(pythonCode, cobolCode || '')).then(r => { response.review = r; })
      );
    }
    
    if (type === 'tests' || type === 'all') {
      tasks.push(
        callGemini(PROMPTS.tests(pythonCode, cobolCode || '')).then(r => { response.tests = r; })
      );
    }
    
    if (type === 'optimize' || type === 'all') {
      tasks.push(
        callGemini(PROMPTS.optimize(pythonCode)).then(r => { response.optimization = r; })
      );
    }
    
    if (type === 'explain' || type === 'all') {
      tasks.push(
        callGemini(PROMPTS.explain(pythonCode, cobolCode || '', programName)).then(r => { response.explanation = r; })
      );
    }
    
    if (type === 'architecture' || type === 'all') {
      tasks.push(
        callGemini(PROMPTS.architecture(pythonCode, cobolCode || '')).then(r => { response.architecture = r; })
      );
    }
    
    await Promise.all(tasks);
    
    return NextResponse.json({
      success: true,
      insights: response,
      model: 'gemini-3-pro-preview',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Gemini Insights Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate insights',
      success: false 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Gemini 3 Insights API',
    version: '1.0.0',
    model: 'gemini-3-pro-preview',
    capabilities: ['review', 'tests', 'optimize', 'explain', 'architecture', 'all'],
    description: 'Unified AI-powered code analysis endpoint'
  });
}
