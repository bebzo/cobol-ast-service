import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { pythonCode } = await request.json();

    if (!pythonCode) {
      return NextResponse.json(
        { error: 'pythonCode is required' },
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
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: { maxOutputTokens: 65536 }
    });

    const lines = pythonCode.split('\n');
    const lineCount = lines.length;
    const chunkSize = 4000;
    let cleanedCode = pythonCode;

    // Clean in chunks to handle large files
    const CLEAN_PROMPT = `You are a Python syntax fixer. Fix ALL syntax errors in this code.

CRITICAL RULES:
1. PRESERVE LINE COUNT - never delete lines, convert broken ones to comments or pass
2. Close unclosed parentheses (), brackets [], braces {}
3. Close unclosed strings " and docstrings """
4. Add 'pass' to empty function/class bodies
5. Fix truncated statements by adding 'None' or 'pass'
6. Remove COBOL keywords (PERFORM, MOVE, etc) - replace with 'pass  # COBOL'
7. Fix malformed operators (+= not + =)
8. Return ONLY valid Python code (no markdown, no explanation)

CODE TO FIX:
`;

    // Process start, middle, and end
    const sections = [
      { start: 0, end: chunkSize, name: 'start' },
      { start: Math.floor(lineCount / 2) * 50, end: Math.floor(lineCount / 2) * 50 + chunkSize, name: 'middle' },
      { start: Math.max(0, pythonCode.length - chunkSize), end: pythonCode.length, name: 'end' }
    ];

    for (const section of sections) {
      try {
        const chunk = cleanedCode.slice(section.start, section.end);
        const result = await model.generateContent(CLEAN_PROMPT + chunk);
        let fixed = result.response.text()
          .replace(/```python\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();

        if (fixed.length > 500) {
          cleanedCode = cleanedCode.slice(0, section.start) + fixed + cleanedCode.slice(section.end);
          console.log(`[Clean] Fixed ${section.name} section`);
        }
      } catch (e: any) {
        console.log(`[Clean] ${section.name} error: ${e.message}`);
      }
    }

    // Final regex cleanup
    cleanedCode = cleanedCode.replace(/\+\s+=/g, '+=');
    cleanedCode = cleanedCode.replace(/-\s+=/g, '-=');
    cleanedCode = cleanedCode.replace(/^(\s*).*""".*""".*""".*$/gm, '$1    """TODO"""');
    cleanedCode = cleanedCode.replace(/"""([^"]{0,200})"""TODO"""/g, '"""$1"""');
    cleanedCode = cleanedCode.replace(/^\s+\d{2}\s+[\w-]+\.?"""\s*$/gm, '');
    cleanedCode = cleanedCode.replace(/^\s+\d{2}\s+[\w-]+\.\s*$/gm, '');

    const cleanedLineCount = cleanedCode.split('\n').length;

    return NextResponse.json({
      cleanedCode,
      stats: {
        originalLines: lineCount,
        cleanedLines: cleanedLineCount,
        preserved: Math.round((cleanedLineCount / lineCount) * 100)
      }
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Clean API error:', error);
    return NextResponse.json(
      { error: error.message || 'Cleaning failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}
