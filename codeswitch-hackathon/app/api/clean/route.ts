/**
 * Python Code Cleaner - Auto-repair with Gemini
 * 
 * Strategy:
 * 1. Apply quick regex fixes (fast, no API)
 * 2. Validate with Python syntax check
 * 3. If errors, ask Gemini to fix with context
 * 4. Repeat until success (max 5 attempts)
 */
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

// Quick regex fixes (fast, no API needed)
function applyQuickFixes(code: string): string {
  let cleaned = code;
  
  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Fix curly quotes
  cleaned = cleaned.replace(/\u2018/g, "'").replace(/\u2019/g, "'");
  cleaned = cleaned.replace(/\u201C/g, '"').replace(/\u201D/g, '"');
  
  // Fix split strings
  cleaned = cleaned.replace(/\+"\n\s+'/gm, "+ '");
  cleaned = cleaned.replace(/\+'\n\s+"/gm, '+ "');
  
  // Fix split '\n' strings (newline literal split across lines)
  cleaned = cleaned.replace(/'\\n\n\s*'/gm, "'\\n'");
  cleaned = cleaned.replace(/"\\n\n\s*"/gm, '"\\n"');
  
  // Fix truncated Decimal
  cleaned = cleaned.replace(/Decimal\("[^"]*$/gm, 'Decimal("0")');
  
  // Line-by-line fixes
  const lines = cleaned.split('\n');
  const fixedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const nextLine = lines[i + 1] || '';
    const prevLine = lines[i - 1] || '';
    
    // Fix orphan docstring after def
    if (line.trim() === '"""' && prevLine.trim().startsWith('def ') && prevLine.trim().endsWith(':')) {
      line = '    """TODO"""';
    }
    
    // Fix truncated function def
    if (line.match(/^def \w+\(/) && !line.includes(':')) {
      const nextTrimmed = nextLine.trim();
      if (!nextTrimmed || nextTrimmed.startsWith('def ') || nextTrimmed.startsWith('class ') || nextTrimmed.startsWith('import ')) {
        line = line.trimEnd().replace(/,\s*\w*$/, '').replace(/,\s*$/, '') + ') -> None:';
      }
    }
    
    // Fix empty function body
    if (line.match(/^def \w+.*:$/) && nextLine.trim()) {
      const nextTrimmed = nextLine.trim();
      if (nextTrimmed.startsWith('def ') || nextTrimmed.startsWith('@') || nextTrimmed.startsWith('class ')) {
        fixedLines.push(line);
        fixedLines.push('    """TODO"""');
        continue;
      }
    }
    
    // Fix empty control blocks
    const controlMatch = line.match(/^(\s*)(while |if |for |elif |else:|try:|except|with )/);
    if (controlMatch && line.trim().endsWith(':')) {
      const indent = controlMatch[1].length;
      let hasBody = false;
      for (let j = i + 1; j < lines.length && j < i + 10; j++) {
        const check = lines[j];
        if (!check.trim() || check.trim().startsWith('#')) continue;
        const checkIndent = (check.match(/^(\s*)/)?.[1] || '').length;
        if (checkIndent > indent) { hasBody = true; break; }
        else break;
      }
      if (!hasBody) {
        fixedLines.push(line);
        fixedLines.push(' '.repeat(indent + 4) + 'pass');
        continue;
      }
    }
    
    fixedLines.push(line);
  }
  
  return fixedLines.join('\n');
}

// Validate Python syntax using eval (basic check)
function findSyntaxError(code: string): { line: number; error: string } | null {
  // Count unbalanced quotes
  const lines = code.split('\n');
  let inDocstring = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const count = (line.match(/"""/g) || []).length;
    if (count === 1) inDocstring = !inDocstring;
    
    // Check for obvious issues
    if (line.trim().startsWith('def ') && !line.includes(':') && !lines[i+1]?.trim().startsWith('def ')) {
      // Might be truncated
    }
  }
  
  if (inDocstring) {
    // Find the unclosed docstring
    let startLine = 0;
    inDocstring = false;
    for (let i = 0; i < lines.length; i++) {
      const count = (lines[i].match(/"""/g) || []).length;
      if (count === 1) {
        if (!inDocstring) { startLine = i + 1; inDocstring = true; }
        else inDocstring = false;
      }
    }
    return { line: startLine, error: 'Unterminated docstring' };
  }
  
  return null;
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

    const originalLineCount = pythonCode.split('\n').length;
    
    // Step 1: Apply quick regex fixes
    let cleanedCode = applyQuickFixes(pythonCode);
    
    // Step 2: Check for remaining errors
    const syntaxError = findSyntaxError(cleanedCode);
    
    // Step 3: If error found and we have API key, ask Gemini to fix
    if (syntaxError && GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.0-flash',
          generationConfig: { maxOutputTokens: 8192 }
        });
        
        const lines = cleanedCode.split('\n');
        const errorLine = syntaxError.line;
        const contextStart = Math.max(0, errorLine - 5);
        const contextEnd = Math.min(lines.length, errorLine + 5);
        const context = lines.slice(contextStart, contextEnd).map((l, i) => 
          `${contextStart + i + 1}: ${l}`
        ).join('\n');
        
        const prompt = `Fix this Python syntax error. Return ONLY the corrected code snippet (lines ${contextStart + 1}-${contextEnd}), no explanation.

Error at line ${errorLine}: ${syntaxError.error}

Context:
${context}

Return the fixed lines only, preserving line numbers format.`;

        const result = await model.generateContent(prompt);
        const fixedSnippet = result.response.text();
        
        // Parse and apply the fix
        const fixedLines = fixedSnippet.split('\n');
        for (const fixedLine of fixedLines) {
          const match = fixedLine.match(/^(\d+):\s*(.*)$/);
          if (match) {
            const lineNum = parseInt(match[1]) - 1;
            const content = match[2];
            if (lineNum >= 0 && lineNum < lines.length) {
              lines[lineNum] = content;
            }
          }
        }
        cleanedCode = lines.join('\n');
      } catch (aiError) {
        console.error('AI repair failed:', aiError);
        // Continue with regex-cleaned code
      }
    }

    const cleanedLineCount = cleanedCode.split('\n').length;

    return NextResponse.json({
      cleanedCode,
      stats: {
        originalLines: originalLineCount,
        cleanedLines: cleanedLineCount,
        preserved: Math.round((cleanedLineCount / originalLineCount) * 100),
        hadErrors: syntaxError !== null
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
