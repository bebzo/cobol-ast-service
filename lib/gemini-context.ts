/**
 * CodeSwitch v7.0 - Enhanced Gemini Context System
 * 
 * Features:
 * 1. Line-specific context injection
 * 2. Auto-debug suggestions
 * 3. Error pattern recognition
 * 4. Contextual code explanation
 */

export interface GeminiContext {
  mode: 'explain' | 'debug' | 'improve' | 'analyze';
  cobolCode: string;
  pythonCode: string;
  selectedLine?: number;
  selectedCode?: string;
  errorMessage?: string;
  errorLine?: number;
  previousQuestions?: string[];
}

export interface AutoDebugSuggestion {
  errorType: string;
  errorLine: number;
  errorMessage: string;
  suggestedFix: string;
  confidence: number;
  explanation: string;
  quickFixCode?: string;
}

export interface ErrorPattern {
  pattern: RegExp;
  type: string;
  suggestion: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

// Common Python error patterns for auto-debug
const ERROR_PATTERNS: ErrorPattern[] = [
  {
    pattern: /unterminated string literal/i,
    type: 'SyntaxError',
    suggestion: 'Check for unclosed quotes. Look for strings that span multiple lines without proper continuation.',
    severity: 'high'
  },
  {
    pattern: /unexpected indent/i,
    type: 'IndentationError',
    suggestion: 'Fix inconsistent indentation. Ensure all code blocks use the same number of spaces.',
    severity: 'medium'
  },
  {
    pattern: /expected an indented block/i,
    type: 'IndentationError',
    suggestion: 'Add an indented block after the colon. Use "pass" if the block should be empty.',
    severity: 'medium'
  },
  {
    pattern: /name '(\w+)' is not defined/i,
    type: 'NameError',
    suggestion: 'Variable or function not defined. Check spelling or add import/definition.',
    severity: 'high'
  },
  {
    pattern: /invalid syntax/i,
    type: 'SyntaxError',
    suggestion: 'Check for missing colons, parentheses, or invalid operators.',
    severity: 'high'
  },
  {
    pattern: /cannot import name '(\w+)'/i,
    type: 'ImportError',
    suggestion: 'The specified name cannot be imported. Verify the module contains this export.',
    severity: 'medium'
  },
  {
    pattern: /object has no attribute '(\w+)'/i,
    type: 'AttributeError',
    suggestion: 'The object does not have this attribute. Check spelling or object type.',
    severity: 'medium'
  },
  {
    pattern: /division by zero/i,
    type: 'ZeroDivisionError',
    suggestion: 'Add a check for zero before division: "if divisor != 0:"',
    severity: 'high'
  },
  {
    pattern: /list index out of range/i,
    type: 'IndexError',
    suggestion: 'Array access is out of bounds. Add length check before accessing.',
    severity: 'high'
  },
  {
    pattern: /invalid literal for int\(\)/i,
    type: 'ValueError',
    suggestion: 'Cannot convert string to integer. Validate input before conversion.',
    severity: 'medium'
  }
];

/**
 * Build enhanced context for Gemini with line-specific information
 */
export function buildEnhancedContext(context: GeminiContext): string {
  let prompt = '';

  // Mode-specific prefix
  switch (context.mode) {
    case 'debug':
      prompt = `You are a COBOL-to-Python migration debugging expert. Analyze this error and provide a specific fix.\n\n`;
      break;
    case 'explain':
      prompt = `You are a COBOL expert explaining code to Python developers. Be precise and educational.\n\n`;
      break;
    case 'improve':
      prompt = `You are a Python code quality expert. Suggest improvements while preserving COBOL semantics.\n\n`;
      break;
    case 'analyze':
      prompt = `You are analyzing COBOL-to-Python transpilation for accuracy and completeness.\n\n`;
      break;
  }

  // Add error context if debugging
  if (context.mode === 'debug' && context.errorMessage) {
    prompt += `## ERROR DETECTED\n`;
    prompt += `**Error Message:** ${context.errorMessage}\n`;
    if (context.errorLine) {
      prompt += `**Error Line:** ${context.errorLine}\n`;
      
      // Extract context around error line
      const pythonLines = context.pythonCode.split('\n');
      const startLine = Math.max(0, context.errorLine - 5);
      const endLine = Math.min(pythonLines.length, context.errorLine + 5);
      
      prompt += `\n**Code Context (lines ${startLine + 1}-${endLine}):**\n\`\`\`python\n`;
      for (let i = startLine; i < endLine; i++) {
        const lineNum = i + 1;
        const marker = lineNum === context.errorLine ? ' >>> ' : '     ';
        prompt += `${marker}${lineNum}: ${pythonLines[i]}\n`;
      }
      prompt += `\`\`\`\n\n`;
    }
    
    // Add auto-detected suggestion
    const autoSuggestion = analyzeError(context.errorMessage, context.errorLine || 0);
    if (autoSuggestion) {
      prompt += `**Auto-Detection:** ${autoSuggestion.errorType}\n`;
      prompt += `**Initial Suggestion:** ${autoSuggestion.suggestedFix}\n\n`;
    }
  }

  // Add selected line context
  if (context.selectedLine && context.mode === 'explain') {
    const cobolLines = context.cobolCode.split('\n');
    const pythonLines = context.pythonCode.split('\n');
    
    prompt += `## SELECTED CODE (Line ${context.selectedLine})\n`;
    
    // COBOL context
    if (context.selectedLine <= cobolLines.length) {
      const startLine = Math.max(0, context.selectedLine - 3);
      const endLine = Math.min(cobolLines.length, context.selectedLine + 3);
      prompt += `\n**COBOL Context:**\n\`\`\`cobol\n`;
      for (let i = startLine; i < endLine; i++) {
        const lineNum = i + 1;
        const marker = lineNum === context.selectedLine ? ' >>> ' : '     ';
        prompt += `${marker}${lineNum}: ${cobolLines[i]}\n`;
      }
      prompt += `\`\`\`\n`;
    }

    prompt += `\n**Question:** Explain what this COBOL line does and how it maps to Python.\n\n`;
  }

  // Add full code for reference (truncated if too long)
  const maxCodeLines = 100;
  const cobolLines = context.cobolCode.split('\n');
  const pythonLines = context.pythonCode.split('\n');

  prompt += `## COBOL SOURCE (${cobolLines.length} lines)\n`;
  prompt += `\`\`\`cobol\n`;
  prompt += cobolLines.slice(0, maxCodeLines).join('\n');
  if (cobolLines.length > maxCodeLines) {
    prompt += `\n... (${cobolLines.length - maxCodeLines} more lines)\n`;
  }
  prompt += `\`\`\`\n\n`;

  prompt += `## PYTHON GENERATED (${pythonLines.length} lines)\n`;
  prompt += `\`\`\`python\n`;
  prompt += pythonLines.slice(0, maxCodeLines).join('\n');
  if (pythonLines.length > maxCodeLines) {
    prompt += `\n... (${pythonLines.length - maxCodeLines} more lines)\n`;
  }
  prompt += `\`\`\`\n`;

  return prompt;
}

/**
 * Analyze error and return auto-debug suggestion
 */
export function analyzeError(
  errorMessage: string,
  errorLine: number,
  pythonCode?: string
): AutoDebugSuggestion | null {
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.pattern.test(errorMessage)) {
      const suggestion: AutoDebugSuggestion = {
        errorType: pattern.type,
        errorLine,
        errorMessage,
        suggestedFix: pattern.suggestion,
        confidence: 0.8,
        explanation: `This is a common ${pattern.type}. ${pattern.suggestion}`
      };

      // Generate quick fix if possible
      if (pythonCode && errorLine > 0) {
        suggestion.quickFixCode = generateQuickFix(pattern, pythonCode, errorLine);
      }

      return suggestion;
    }
  }

  // Generic suggestion for unrecognized errors
  return {
    errorType: 'UnknownError',
    errorLine,
    errorMessage,
    suggestedFix: 'Review the code around this line for syntax or logic errors.',
    confidence: 0.3,
    explanation: 'This error pattern is not recognized. Manual review recommended.'
  };
}

/**
 * Generate quick fix code for common errors
 */
function generateQuickFix(
  pattern: ErrorPattern,
  pythonCode: string,
  errorLine: number
): string | undefined {
  const lines = pythonCode.split('\n');
  if (errorLine > lines.length) return undefined;

  const line = lines[errorLine - 1];

  // Fix unterminated string
  if (pattern.type === 'SyntaxError' && pattern.pattern.test('unterminated string')) {
    const quoteCount = (line.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      return line + '"';
    }
    const singleQuoteCount = (line.match(/'/g) || []).length;
    if (singleQuoteCount % 2 !== 0) {
      return line + "'";
    }
  }

  // Fix missing indentation
  if (pattern.type === 'IndentationError') {
    const prevLine = lines[errorLine - 2];
    if (prevLine && prevLine.trim().endsWith(':')) {
      const indent = prevLine.match(/^(\s*)/)?.[1] || '';
      return indent + '    pass  # TODO: implement';
    }
  }

  return undefined;
}

/**
 * Build context for explaining a specific line mapping
 */
export function buildLineMappingContext(
  cobolLine: number,
  pythonLines: number[],
  cobolCode: string,
  pythonCode: string
): string {
  const cobolSrc = cobolCode.split('\n');
  const pythonSrc = pythonCode.split('\n');

  let prompt = `## Line Mapping Explanation\n\n`;
  
  prompt += `**COBOL Line ${cobolLine}:**\n\`\`\`cobol\n${cobolSrc[cobolLine - 1] || ''}\n\`\`\`\n\n`;
  
  prompt += `**Maps to Python Lines ${pythonLines.join(', ')}:**\n\`\`\`python\n`;
  pythonLines.forEach(ln => {
    if (pythonSrc[ln - 1]) {
      prompt += `${ln}: ${pythonSrc[ln - 1]}\n`;
    }
  });
  prompt += `\`\`\`\n\n`;
  
  prompt += `Explain why this COBOL line generates ${pythonLines.length} Python lines. What transformation is happening?`;

  return prompt;
}

/**
 * Format auto-debug suggestions for UI display
 */
export function formatDebugSuggestions(suggestions: AutoDebugSuggestion[]): string {
  if (suggestions.length === 0) return 'No automatic suggestions available.';

  let output = '## Auto-Debug Suggestions\n\n';
  
  suggestions.forEach((s, idx) => {
    const confidence = Math.round(s.confidence * 100);
    output += `### ${idx + 1}. ${s.errorType} (${confidence}% confidence)\n`;
    output += `- **Line:** ${s.errorLine}\n`;
    output += `- **Fix:** ${s.suggestedFix}\n`;
    if (s.quickFixCode) {
      output += `- **Quick Fix:**\n\`\`\`python\n${s.quickFixCode}\n\`\`\`\n`;
    }
    output += '\n';
  });

  return output;
}

/**
 * Extract error context from Python traceback
 */
export function parseTraceback(traceback: string): {
  errorType: string;
  errorMessage: string;
  errorLine: number;
  fileName: string;
} | null {
  // Match Python traceback format
  const lineMatch = traceback.match(/File "([^"]+)", line (\d+)/);
  const errorMatch = traceback.match(/(\w+Error): (.+)/);

  if (lineMatch && errorMatch) {
    return {
      fileName: lineMatch[1],
      errorLine: parseInt(lineMatch[2]),
      errorType: errorMatch[1],
      errorMessage: errorMatch[2]
    };
  }

  // Match simpler format
  const simpleMatch = traceback.match(/Line (\d+): (.+)/);
  if (simpleMatch) {
    return {
      fileName: '<string>',
      errorLine: parseInt(simpleMatch[1]),
      errorType: 'SyntaxError',
      errorMessage: simpleMatch[2]
    };
  }

  return null;
}
