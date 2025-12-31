/**
 * Python Code Cleaner - Fixes common AI-generated syntax errors
 * 
 * KNOWN ERROR PATTERNS (add new patterns here):
 * ─────────────────────────────────────────────
 * 1. CRLF line endings         → Normalize to LF
 * 2. Curly quotes (' ' " ")    → Replace with straight quotes
 * 3. Split strings (.write)    → Rejoin strings with literal \n
 * 4. Truncated Decimal()       → Decimal("5." → Decimal("0")
 * 5. Orphan docstrings         → """ alone → """TODO"""
 * 6. Empty function bodies     → Add """TODO""" after def
 * 7. Merged def statements     → Split docstring + def on same line
 * 8. Empty control blocks      → while/if/for with only comments → add pass
 * 9. Truncated function def    → def name( without ) → add ) -> None:
 * 10. Over-indented docstrings → Align with next line
 * 
 * TO ADD NEW PATTERN:
 * - Add regex fix in the appropriate section below
 * - Document pattern here with example
 */
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
    // Fix f-strings split across lines
    cleanedCode = cleanedCode.replace(/\.write\(f"[^"]*\n"\)/gm, (match: string) => {
      return match.replace(/\n/g, '\\n');
    });
    // Fix truncated Decimal() calls (e.g., Decimal("5." without closing)
    cleanedCode = cleanedCode.replace(/Decimal\("[^"]*$/gm, 'Decimal("0")');
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
      
      // Fix unclosed docstrings: line ends with """ alone, next line is actual code (def/class/@/import)
      if (line.trim() === '"""') {
        const nextTrimmed = nextLine.trim();
        // Only fix if next line is actual code, not docstring content
        if (nextTrimmed.startsWith('def ') || nextTrimmed.startsWith('class ') || 
            nextTrimmed.startsWith('@') || nextTrimmed.startsWith('import ') ||
            nextTrimmed.startsWith('from ')) {
          const indent = line.match(/^(\s*)/)?.[1] || '';
          line = indent + '"""TODO"""';  // Close the orphan docstring
        }
      }
      
      // Fix truncated function definitions (def ... without closing paren and colon)
      if (line.match(/^def \w+\([^)]*$/) && !line.includes(':')) {
        line = line.trimEnd() + ') -> None:';  // Complete the truncated signature
      }
      
      // Fix empty function bodies: def followed by non-indented line
      if (line.match(/^def \w+.*:$/) && nextLine.trim().length > 0) {
        const nextTrimmed = nextLine.trim();
        if (nextTrimmed.startsWith('def ') || nextTrimmed.startsWith('@') || nextTrimmed.startsWith('class ')) {
          fixedLines.push(line);
          fixedLines.push('    """TODO"""');
          continue;
        }
      }
      
      // Fix merged lines: docstring followed by def on same line
      if (line.match(/"""[^"]*def \w+/)) {
        const parts = line.split(/(?=def \w+)/);
        if (parts.length >= 2) {
          // Close first docstring and add def on new line
          fixedLines.push(parts[0].replace(/"""[^"]*$/, '"""TODO"""'));
          line = parts.slice(1).join('');
        }
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
      
      // Fix control structures with only comments as body (while, if, for, etc.)
      const controlMatch = line.match(/^(\s*)(while |if |for |elif |else:|try:|except|with )/);
      if (controlMatch && line.trim().endsWith(':')) {
        const controlIndent = controlMatch[1].length;
        // Look ahead to see if body is missing (only comments until unindented line)
        let hasBody = false;
        let insertIndex = -1;
        for (let j = i + 1; j < codeLines.length && j < i + 20; j++) {
          const checkLine = codeLines[j];
          const checkTrimmed = checkLine.trim();
          if (!checkTrimmed) continue; // skip empty
          if (checkTrimmed.startsWith('#')) continue; // skip comments
          const checkIndent = (checkLine.match(/^(\s*)/)?.[1] || '').length;
          if (checkIndent > controlIndent) {
            hasBody = true;
            break;
          } else {
            insertIndex = j;
            break;
          }
        }
        if (!hasBody && insertIndex > 0) {
          // Add pass with proper indentation
          fixedLines.push(line);
          fixedLines.push(' '.repeat(controlIndent + 4) + 'pass');
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
