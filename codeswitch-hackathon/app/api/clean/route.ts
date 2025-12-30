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
    const CLEAN_PROMPT = `Fix Python syntax errors. CRITICAL: Preserve EXACT indentation of each line.

RULES:
1. Keep same indentation for each line
2. Close unclosed strings/docstrings
3. Add 'pass' to empty blocks
4. Return ONLY Python code (no markdown)

CODE:
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

    // Comprehensive regex cleanup
    cleanedCode = cleanedCode.replace(/\+\s+=/g, '+=');
    cleanedCode = cleanedCode.replace(/-\s+=/g, '-=');
    cleanedCode = cleanedCode.replace(/\*\s+=/g, '*=');
    cleanedCode = cleanedCode.replace(/\/\s+=/g, '/=');
    // Fix corrupted docstrings
    cleanedCode = cleanedCode.replace(/^(\s*).*""".*""".*""".*$/gm, '$1"""TODO"""');
    cleanedCode = cleanedCode.replace(/"""([^"]{0,200})"""TODO"""/g, '"""$1"""');
    // Remove COBOL remnants
    cleanedCode = cleanedCode.replace(/^\s+\d{2}\s+[\w-]+\.?"""\s*$/gm, '');
    cleanedCode = cleanedCode.replace(/^\s+\d{2}\s+[\w-]+\.\s*$/gm, '');
    // Fix over-indented docstrings (8 spaces -> 4 spaces)
    cleanedCode = cleanedCode.replace(/^(\s{4}def\s+\w+.*:\s*\n)\s{12}(""")/gm, '$1        $2');
    cleanedCode = cleanedCode.replace(/^(\s*)        ("""TODO""")\n\s{4}(self\.)/gm, '$1    $2\n$1    $3');

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
// trigger 1767137310
