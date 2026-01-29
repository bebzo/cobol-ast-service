/**
 * Clean Architecture Transpiler API with Automatic AI Auto-Correction
 * Uses unified Python transpiler (api/transpile.py) as source of truth
 * Automatically applies AI fixes in a loop until no more issues are detected
 * Also applies auto-correction to generated test files
 */
import { NextRequest, NextResponse } from 'next/server';
import { transpileCobolViaPython, parseCobolQuick } from '@/lib/transpiler-client';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const maxDuration = 300; // Increased timeout for AI auto-correction

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Interface for review insights
interface ReviewInsights {
  score: number;
  grade: string;
  issues: Array<{ severity: string; message: string; line?: number; suggestedFix?: string }>;
  strengths: string[];
}

// Gemini call helper
async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.warn('[TranspileClean] No Gemini API key - skipping auto-correction');
    return JSON.stringify({ error: 'No API key configured', fallback: true });
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-preview',
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.2
      }
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    console.error('[TranspileClean] Gemini API error:', error.message);
    throw new Error(`Gemini API failed: ${error.message}`);
  }
}

// Review prompt for service code
const REVIEW_PROMPT_SERVICE = (python: string, cobol?: string) => `You are a senior code reviewer specializing in COBOL-to-Python migrations.
IMPORTANT: Respond ONLY in English.

Analyze this transpiled Python code and provide a review in JSON format:
{
  "score": 85,
  "grade": "B",
  "issues": [
    {"severity": "warning", "message": "Description of issue", "line": 123, "suggestedFix": "# Corrected line with proper fix"}
  ],
  "strengths": [
    "Good use of Decimal for financial precision",
    "Proper error handling patterns"
  ]
}

CRITICAL: For each issue, provide a "suggestedFix" field with the exact corrected code line that should replace the problematic line. This is required for the auto-fix feature to work.

Focus on:
1. Code quality and best practices
2. Potential bugs or edge cases
3. Security concerns
4. Performance issues
5. COBOL semantics preservation

Python code:
${python.substring(0, 8000)}

Respond ONLY with valid JSON.`;

// Review prompt for test code (focused on pytest issues)
const REVIEW_PROMPT_TESTS = (testCode: string) => `You are a Python testing expert specializing in pytest and COBOL-to-Python test migration.
IMPORTANT: Respond ONLY in English.

Analyze this generated pytest code and find any syntax errors or issues that would prevent compilation or execution:
{
  "score": 85,
  "grade": "B",
  "issues": [
    {"severity": "error", "message": "Description of issue", "line": 123, "suggestedFix": "# Corrected line"}
  ],
  "strengths": [
    "Good pytest structure"
  ]
}

CRITICAL: Focus on:
1. Syntax errors (missing imports, invalid Python syntax)
2. Reference errors (undefined variables, incorrect function calls)
3. pytest-specific issues (fixture problems, assertion errors)
4. Common issues with Decimal usage: ensure Decimal is imported and used correctly
5. String escaping issues with repr()

Common fixes needed:
- If you see "Decimal object is not callable", check if a variable named 'Decimal' shadows the import
- Fix repr() usage: repr("value") should work correctly
- Ensure all imports are present at the top

Test code:
${testCode.substring(0, 6000)}

Respond ONLY with valid JSON.`;

// SSE helper
function createSSEStream(controller: ReadableStreamDefaultController, encoder: TextEncoder) {
  return {
    send: (event: string, data: any) => {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(encoder.encode(message));
    },
    close: () => {
      controller.close();
    },
    error: (error: any) => {
      controller.error(error);
    }
  };
}

// Parse Gemini response to extract review object
function parseReview(response: string): ReviewInsights | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ReviewInsights;
    }
  } catch (e) {
    console.warn('[TranspileClean] Failed to parse review:', e);
  }
  return null;
}

// Apply fixes to code
interface FixResult {
  code: string;
  fixCount: number;
}

function applyFixes(code: string, issues: ReviewInsights['issues']): FixResult {
  const lines = code.split('\n');
  const fixedLines: string[] = [];
  let fixCount = 0;

  // Create a map of line numbers to issues
  const issuesByLine: Map<number, ReviewInsights['issues'][0]> = new Map();
  for (const issue of issues) {
    if (issue.line && issue.suggestedFix && issue.severity !== 'info') {
      // Only keep the first fix for each line
      if (!issuesByLine.has(issue.line)) {
        issuesByLine.set(issue.line, issue);
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    let line = lines[i];

    const issue = issuesByLine.get(lineNum);
    if (issue && issue.suggestedFix) {
      // Apply the suggested fix
      const indent = line.match(/^(\s*)/)?.[1] || '';
      line = indent + issue.suggestedFix;
      fixCount++;
      console.log(`[TranspileClean] Fixed line ${lineNum}: ${issue.message}`);
    }

    fixedLines.push(line);
  }

  return { code: fixedLines.join('\n'), fixCount };
}

// Auto-correct a single file with iterative loop
async function autoCorrectCode(
  code: string,
  cobolCode: string | undefined,
  promptFn: (code: string, cobol?: string) => string,
  fileType: string,
  sse: any,
  startProgress: number
): Promise<{ code: string; fixesApplied: number; finalReview: ReviewInsights | null }> {
  let currentCode = code;
  let totalFixesApplied = 0;
  let finalReview: ReviewInsights | null = null;
  let iterations = 0;
  const maxIterations = 10;

  let keepGoing = true;

  while (keepGoing && iterations < maxIterations) {
    iterations++;
    console.log(`[TranspileClean][${fileType}] Auto-fix iteration ${iterations}/${maxIterations}`);

    sse.send('status', {
      message: `${fileType} - AI verification iteration ${iterations}...`,
      progress: startProgress + (iterations * 2)
    });

    // Call Gemini for code review
    const prompt = promptFn(currentCode, cobolCode);
    const geminiResponse = await callGemini(prompt);
    const review = parseReview(geminiResponse);

    if (!review) {
      console.warn(`[TranspileClean][${fileType}] Failed to parse review, stopping auto-fix`);
      break;
    }

    // Send review update
    const fixableIssues = review.issues.filter(
      (i) => i.line && i.suggestedFix && i.severity !== 'info'
    );

    sse.send('review', {
      fileType,
      iteration: iterations,
      review,
      fixableCount: fixableIssues.length
    });

    // Check if we should stop
    const hasFixableIssues = fixableIssues.length > 0;

    if (!hasFixableIssues || review.score >= 100) {
      console.log(`[TranspileClean][${fileType}] No more fixable issues found (score: ${review.score})`);
      finalReview = review;
      keepGoing = false;
      break;
    }

    // Apply fixes
    console.log(`[TranspileClean][${fileType}] Applying ${fixableIssues.length} fixes...`);
    const { code: fixedCode, fixCount } = applyFixes(currentCode, review.issues);

    if (fixCount === 0) {
      console.log(`[TranspileClean][${fileType}] No fixes could be applied, stopping`);
      finalReview = review;
      keepGoing = false;
      break;
    }

    totalFixesApplied += fixCount;
    currentCode = fixedCode;

    sse.send('fixes', {
      fileType,
      iteration: iterations,
      fixesApplied: fixCount,
      totalFixes: totalFixesApplied
    });
  }

  return { code: currentCode, fixesApplied: totalFixesApplied, finalReview };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cobolCode = body.cobolCode || body.cobolSource;
    const autoFix = body.autoFix !== false; // Default to true

    if (!cobolCode) {
      return NextResponse.json(
        { error: 'cobolCode is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sse = createSSEStream(controller, encoder);

        try {
          // Send initial progress
          sse.send('status', { message: 'Starting transpilation...', progress: 10 });

          // Parse for metadata
          const parsed = parseCobolQuick(cobolCode);
          const className = parsed.programId.replace(/-/g, '_');

          sse.send('status', { message: 'Transpiling COBOL to Python...', progress: 30 });

          // Transpile via unified Python API
          const result = await transpileCobolViaPython(cobolCode, false);

          if (!result.success) {
            sse.send('error', { error: result.error || 'Transpilation failed' });
            sse.close();
            return;
          }

          sse.send('status', { message: 'Transpilation complete!', progress: 50 });
          sse.send('transpiled', { pythonCode: result.python_code });

          let finalPythonCode = result.python_code;
          let finalTestCode = result.unit_tests;
          let autoFixApplied = false;
          let serviceReview: ReviewInsights | null = null;
          let testReview: ReviewInsights | null = null;
          let totalServiceFixes = 0;
          let totalTestFixes = 0;

          // Iterative Auto-correction loop for service code
          if (autoFix && GEMINI_API_KEY) {
            sse.send('status', { message: 'Starting AI auto-correction for service code...', progress: 60 });

            try {
              const serviceResult = await autoCorrectCode(
                finalPythonCode,
                cobolCode,
                REVIEW_PROMPT_SERVICE,
                'Service',
                sse,
                60
              );

              finalPythonCode = serviceResult.code;
              totalServiceFixes = serviceResult.fixesApplied;
              serviceReview = serviceResult.finalReview;

              if (totalServiceFixes > 0) {
                autoFixApplied = true;
              }

              sse.send('status', { message: 'Starting AI auto-correction for tests...', progress: 80 });

              // Also auto-correct the test file
              const testResult = await autoCorrectCode(
                finalTestCode,
                '',
                REVIEW_PROMPT_TESTS,
                'Tests',
                sse,
                80
              );

              finalTestCode = testResult.code;
              totalTestFixes = testResult.fixesApplied;
              testReview = testResult.finalReview;

              if (totalTestFixes > 0) {
                autoFixApplied = true;
              }

              sse.send('status', {
                message: `Auto-correction complete! (Service: ${totalServiceFixes} fixes, Tests: ${totalTestFixes} fixes)`,
                progress: 95
              });

            } catch (aiError: any) {
              console.warn('[TranspileClean] AI auto-correction failed:', aiError.message);
              sse.send('warning', { message: 'AI auto-correction error: ' + aiError.message });
            }
          } else if (!GEMINI_API_KEY) {
            sse.send('warning', { message: 'AI auto-correction disabled: No Gemini API key' });
          }

          // Format as Clean Architecture structure
          const files: Record<string, string> = {
            [`domain/${className.toLowerCase()}_service.py`]: finalPythonCode,
            [`tests/test_${className.toLowerCase()}.py`]: finalTestCode,
          };

          // Send complete event
          sse.send('complete', {
            files,
            stats: result.stats,
            programId: parsed.programId,
            version: result.version,
            autoFixApplied,
            reviews: {
              service: serviceReview,
              tests: testReview
            },
            totalFixesApplied: {
              service: totalServiceFixes,
              tests: totalTestFixes,
              combined: totalServiceFixes + totalTestFixes
            },
            timestamp: new Date().toISOString()
          });

        } catch (error: any) {
          console.error('Transpile Clean Architecture API error:', error);
          sse.send('error', { error: error.message || 'Transpilation failed' });
        }

        sse.close();
      }
    });

    return new NextResponse(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error: any) {
    console.error('Transpile Clean Architecture API error:', error);
    return NextResponse.json(
      { error: error.message || 'Transpilation failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}
