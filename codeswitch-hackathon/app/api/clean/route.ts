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
    // Fix curly quotes/apostrophes to straight ones (using Unicode escapes)
    cleanedCode = cleanedCode.replace(/\u2018/g, "'").replace(/\u2019/g, "'");
    cleanedCode = cleanedCode.replace(/\u201C/g, '"').replace(/\u201D/g, '"');
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
    // Fix broken expressions with "+ 0  # TODO" pattern
    cleanedCode = cleanedCode.replace(/\+ 0\s+# TODO\n\s+/g, '+ ');
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
      let line = codeLines[i];
      const nextLine = codeLines[i + 1] || '';
      
      // Fix unclosed docstrings: line ends with """ alone, next line is code
      if (line.match(/^\s+"""$/) && nextLine.trim().length > 0 && !nextLine.trim().startsWith('"""')) {
        line = line + 'TODO"""';  // Close the orphan docstring
      }
      
      // Fix truncated function definitions (def ... without closing paren and colon)
      if (line.match(/^def \w+\([^)]*$/) && !line.includes(':')) {
        line = line.trimEnd() + ') -> None:';  // Complete the truncated signature
      }
      
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
