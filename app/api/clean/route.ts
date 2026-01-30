/**
 * Python Code Cleaner - Auto-repair loop with Gemini
 *
 * Strategy:
 * 1. Apply quick regex fixes (fast, no API)
 * 2. Ask Gemini to validate and fix ALL syntax errors
 * 3. Repeat until Gemini confirms code is valid (max 10 attempts)
 */
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Pyodide for syntax validation
let pyodideReady: Promise<any> | null = null;

async function getPyodide() {
  if (typeof window !== 'undefined') return null;  // Client-side check
  try {
    // @ts-ignore - globalThis.loadPyodide may exist
    if (!globalThis.loadPyodide) return null;
    // @ts-ignore
    const loadPyodide = globalThis.loadPyodide;
    if (!pyodideReady) {
      pyodideReady = loadPyodide().then((py: any) => py);
    }
    return pyodideReady;
  } catch (e) {
    return null;
  }
}

export const runtime = 'edge';

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
  cleaned = cleaned.replace(/'\\n\n\s*'/gm, "'\\n'");
  cleaned = cleaned.replace(/"\\n\n\s*"/gm, '"\\n"');
  
  // Fix truncated Decimal
  cleaned = cleaned.replace(/Decimal\("[^"]*$/gm, 'Decimal("0")');

  // Fix leading zeros in decimal integer literals (Python 3 doesn't allow 0123)
  // Only fix standalone numbers, not inside strings
  cleaned = cleaned.replace(/(?<![\w"'])(\b0+\d+\b)(?!["'\d])/g, (match) => {
    // Remove leading zeros but keep at least one digit
    const withoutZeros = match.replace(/^0+/, '') || '0';
    // If it looks like octal (was 0oXXX), restore the 0o prefix
    if (withoutZeros.startsWith('o') || withoutZeros.startsWith('O')) {
      return '0' + withoutZeros;
    }
    return withoutZeros;
  });

  // Fix merged lines (def/class appearing mid-line)
  cleaned = cleaned.replace(/([^\n])(def \w+\()/g, '$1\n$2');
  cleaned = cleaned.replace(/([^\n])(class \w+)/g, '$1\n$2');
  
  // Fix truncated statements
  cleaned = cleaned.replace(/^(\s*)global\s*$/gm, '$1pass  # truncated global');
  cleaned = cleaned.replace(/^(\s*)return\s*$/gm, '$1return None');
  
  // Fix standalone 'def' lines
  cleaned = cleaned.replace(/^\s*def\s*$/gm, '');
  
  // Fix incomplete if/while/for (missing :)
  cleaned = cleaned.replace(/^(\s*if\s+\w[^:\n]*)$/gm, '$1:');
  cleaned = cleaned.replace(/^(\s*while\s+\w[^:\n]*)$/gm, '$1:');
  cleaned = cleaned.replace(/^(\s*for\s+\w[^:\n]*)$/gm, '$1:');
  
  // Fix unclosed docstrings (docstring that doesn't close on same line)
  cleaned = cleaned.replace(/^(\s*"""[^"]{1,100})$/gm, '$1"""');
  
  // Fix logger line with trailing colon
  cleaned = cleaned.replace(/^(logger\s*=\s*logging\.getLogger\([^)]+\)):$/gm, '$1');
  
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
        fixedLines.push('    pass');
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

// Ask Gemini to validate and fix the code
async function validateAndFixWithGemini(code: string, attempt: number): Promise<{ code: string; isValid: boolean }> {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3-pro-preview',
    generationConfig: { maxOutputTokens: 65536 }
  });
  
  const prompt = `You are a Python syntax validator and fixer. Analyze this Python code and fix ALL syntax errors.

IMPORTANT RULES:
1. Check for: unterminated strings, missing colons, invalid indentation, unclosed brackets, truncated statements
2. Return ONLY the complete fixed Python code, no explanations
3. If code is already valid, return it unchanged
4. Preserve all logic and comments
5. Do NOT add new functionality
6. Start your response with exactly "# VALID" if the code has no syntax errors, or "# FIXED" if you made corrections

Python code to validate (attempt ${attempt}/10):

\`\`\`python
${code}
\`\`\`

Return the complete Python code:`;

  const result = await model.generateContent(prompt);
  let response = result.response.text();
  
  // Extract code from response
  const codeMatch = response.match(/```python\n([\s\S]*?)```/);
  if (codeMatch) {
    response = codeMatch[1];
  } else {
    // Remove markdown if present
    response = response.replace(/^```python\n?/gm, '').replace(/```$/gm, '');
  }
  
  const isValid = response.trim().startsWith('# VALID');
  
  // Remove the marker comment
  response = response.replace(/^# (VALID|FIXED)\n?/, '');
  
  return { code: response.trim(), isValid };
}

// Fix specific syntax error with Gemini
async function fixSpecificError(code: string, error: string, line: number): Promise<string> {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3-pro-preview',
    generationConfig: { maxOutputTokens: 65536 }
  });
  
  const lines = code.split('\n');
  const contextStart = Math.max(0, line - 10);
  const contextEnd = Math.min(lines.length, line + 10);
  const context = lines.slice(contextStart, contextEnd).map((l, i) => 
    `${contextStart + i + 1}: ${l}`
  ).join('\n');
  
  const prompt = `Fix this Python syntax error and VERIFY the code compiles before returning.

PROCESS:
1. Fix the error at line ${line}: ${error}
2. Mentally run "python -m py_compile" on your fix
3. If it still has errors, fix those too
4. Only return code that would compile successfully

RULES:
- PRESERVE ALL CODE - do NOT delete functions or logic
- Keep ~${lines.length} lines (same line count)
- Replace broken code with valid placeholders (pass, None) rather than deleting

Context around error:
${context}

FULL CODE:
\`\`\`python
${code}
\`\`\`

Return ONLY valid, compilable Python code:`;

  const result = await model.generateContent(prompt);
  let response = result.response.text();
  
  const codeMatch = response.match(/```python\n([\s\S]*?)```/);
  if (codeMatch) {
    response = codeMatch[1];
  } else {
    response = response.replace(/^```python\n?/gm, '').replace(/```$/gm, '');
  }
  
  return response.trim();
}

export async function POST(request: NextRequest) {
  try {
    const { pythonCode, syntaxError, errorLine } = await request.json();

    if (!pythonCode) {
      return NextResponse.json(
        { error: 'pythonCode is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const originalLineCount = pythonCode.split('\n').length;
    
    // Step 1: Apply quick regex fixes
    let cleanedCode = applyQuickFixes(pythonCode);
    
    // Step 2: If specific error provided (from Pyodide), fix it directly
    if (syntaxError && errorLine && GEMINI_API_KEY) {
      console.log(`Fixing specific error at line ${errorLine}: ${syntaxError}`);
      try {
        cleanedCode = await fixSpecificError(cleanedCode, syntaxError, errorLine);
      } catch (e) {
        console.error('Specific fix failed:', e);
      }
    }

    // Step 3: Validate and fix ALL remaining errors with Gemini loop
    if (GEMINI_API_KEY) {
      let currentCode = cleanedCode;
      let attempt = 1;
      let isValid = false;

      while (attempt <= 10 && !isValid) {
        console.log(`Validation attempt ${attempt}/10...`);
        const result = await validateAndFixWithGemini(currentCode, attempt);
        currentCode = result.code;
        isValid = result.isValid;

        if (!isValid && attempt < 10) {
          // Re-validate the fixed code
          try {
            const pyodide = await getPyodide();
            if (pyodide) {
              const checkResult = pyodide.runPython(`check_syntax(${JSON.stringify(currentCode)})`);
              if (checkResult === null || checkResult === 'None') {
                isValid = true;
                console.log('Code validated by Pyodide!');
              }
            }
          } catch (e) {
            // Continue to next attempt
          }
        }
        attempt++;
      }

      cleanedCode = currentCode;
      console.log(`Validation complete. Valid: ${isValid}, Attempts: ${attempt - 1}`);
    }

    const cleanedLineCount = cleanedCode.split('\n').length;
    
    // SAFETY: If corrected code lost >20% of lines, reject the fix and return original
    const preservedRatio = cleanedLineCount / originalLineCount;
    if (preservedRatio < 0.8) {
      console.log(`[REJECTED] Fix reduced code from ${originalLineCount} to ${cleanedLineCount} lines (${Math.round(preservedRatio * 100)}%). Keeping original.`);
      return NextResponse.json({
        cleanedCode: pythonCode,  // Return original
        stats: {
          originalLines: originalLineCount,
          cleanedLines: originalLineCount,
          preserved: 100,
          hadError: true,
          rejected: true
        }
      }, { headers: corsHeaders });
    }

    return NextResponse.json({
      cleanedCode,
      stats: {
        originalLines: originalLineCount,
        cleanedLines: cleanedLineCount,
        preserved: Math.round((cleanedLineCount / originalLineCount) * 100),
        hadError: !!(syntaxError && errorLine)
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
