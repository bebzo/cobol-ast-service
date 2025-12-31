import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

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

    // Normalize line endings (CRLF -> LF)
    let cleanedCode = pythonCode.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Fix curly quotes/apostrophes to straight ones
    cleanedCode = cleanedCode.replace(/'/g, "'").replace(/'/g, "'");
    cleanedCode = cleanedCode.replace(/"/g, '"').replace(/"/g, '"');
    const lines = cleanedCode.split('\n');
    const lineCount = lines.length;

    // Fast regex-only cleanup (no AI to avoid timeout)
    // Fix split string literals ending with unclosed quote + newline (double and single quotes)
    cleanedCode = cleanedCode.replace(/ \+ "\n"\)/gm, ' + "\\n")');
    cleanedCode = cleanedCode.replace(/ \+ '\n'\)/gm, " + '\\n')");
    cleanedCode = cleanedCode.replace(/\.write\("[^"]*\n"\)/gm, (match: string) => {
      return match.replace(/\n/g, '\\n');
    });
    cleanedCode = cleanedCode.replace(/\.write\('[^']*\n'\)/gm, (match: string) => {
      return match.replace(/\n/g, '\\n');
    });
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
    // Fix over-indented docstrings: align docstring with following line
    const fixedLines: string[] = [];
    const codeLines = cleanedCode.split('\n');
    for (let i = 0; i < codeLines.length; i++) {
      const line = codeLines[i];
      const nextLine = codeLines[i + 1] || '';
      // Check if current line is a docstring and next line has less indent
      if (line.match(/^\s+""".*"""$/) && nextLine.trim().length > 0) {
        const docIndent = (line.match(/^(\s*)/)?.[1] || '').length;
        const nextIndent = (nextLine.match(/^(\s*)/)?.[1] || '').length;
        if (docIndent > nextIndent && nextIndent > 0) {
          fixedLines.push(' '.repeat(nextIndent) + line.trim());
          continue;
        }
      }
      fixedLines.push(line);
    }
    cleanedCode = fixedLines.join('\n');

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
// 1767139309
