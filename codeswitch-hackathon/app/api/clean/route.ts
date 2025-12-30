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

    const lines = pythonCode.split('\n');
    const lineCount = lines.length;
    let cleanedCode = pythonCode;

    // Fast regex-only cleanup (no AI to avoid timeout)
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
