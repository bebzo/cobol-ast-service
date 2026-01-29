/**
 * Clean Architecture Transpiler API with Automatic AI Auto-Correction
 * Uses unified Python transpiler (api/transpile.py) as source of truth
 * Automatically applies AI fixes after transpilation
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

// Review prompt
const REVIEW_PROMPT = (python: string, cobol: string) => `You are a senior code reviewer specializing in COBOL-to-Python migrations.
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
          let autoFixApplied = false;
          let reviewAfterFix: ReviewInsights | null = null;

          // Auto-correction step
          if (autoFix && GEMINI_API_KEY) {
            sse.send('status', { message: 'Analyzing code with AI...', progress: 60 });

            try {
              // Call Gemini for code review
              const prompt = REVIEW_PROMPT(finalPythonCode, cobolCode);
              const geminiResponse = await callGemini(prompt);

              let review: ReviewInsights | null = null;
              try {
                const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  review = JSON.parse(jsonMatch[0]) as ReviewInsights;
                }
              } catch (parseError) {
                console.warn('[TranspileClean] Failed to parse review response:', parseError);
              }

              if (review && review.issues && review.issues.length > 0) {
                // Count issues with suggested fixes
                const fixableIssues = review.issues.filter(
                  (i: { line?: number; suggestedFix?: string }) => i.line && i.suggestedFix
                );

                sse.send('review', { review, fixableCount: fixableIssues.length });

                if (fixableIssues.length > 0) {
                  sse.send('status', {
                    message: `Applying ${fixableIssues.length} AI fixes...`,
                    progress: 70
                  });

                  // Apply fixes
                  let fixedCode = finalPythonCode;
                  const lines = fixedCode.split('\n');
                  const fixedLines: string[] = [];

                  for (let i = 0; i < lines.length; i++) {
                    const lineNum = i + 1;
                    let line = lines[i];

                    for (const issue of fixableIssues) {
                      if (issue.line === lineNum && issue.severity !== 'info' && issue.suggestedFix) {
                        // Apply the suggested fix
                        const indent = line.match(/^(\s*)/)?.[1] || '';
                        line = indent + issue.suggestedFix;
                        console.log(`[TranspileClean] Fixed line ${lineNum}: ${issue.message}`);
                      }
                    }

                    fixedLines.push(line);
                  }

                  fixedCode = fixedLines.join('\n');

                  // Re-run review on fixed code
                  sse.send('status', { message: 'Verifying fixes with AI...', progress: 85 });

                  const reReviewPrompt = REVIEW_PROMPT(fixedCode, cobolCode);
                  const reReviewResponse = await callGemini(reReviewPrompt);

                  try {
                    const jsonMatch = reReviewResponse.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                      reviewAfterFix = JSON.parse(jsonMatch[0]) as ReviewInsights;
                    }
                  } catch (e) {
                    console.warn('[TranspileClean] Failed to parse re-review response');
                  }

                  finalPythonCode = fixedCode;
                  autoFixApplied = true;

                  sse.send('status', {
                    message: 'Auto-correction complete!',
                    progress: 95
                  });
                }
              }
            } catch (aiError: any) {
              console.warn('[TranspileClean] AI auto-correction failed:', aiError.message);
              sse.send('warning', { message: 'AI auto-correction skipped: ' + aiError.message });
            }
          } else if (!GEMINI_API_KEY) {
            sse.send('warning', { message: 'AI auto-correction disabled: No Gemini API key' });
          }

          // Format as Clean Architecture structure
          const files: Record<string, string> = {
            [`domain/${className.toLowerCase()}_service.py`]: finalPythonCode,
            [`tests/test_${className.toLowerCase()}.py`]: result.unit_tests,
          };

          // Send complete event
          sse.send('complete', {
            files,
            stats: result.stats,
            programId: parsed.programId,
            version: result.version,
            autoFixApplied,
            review: reviewAfterFix,
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
