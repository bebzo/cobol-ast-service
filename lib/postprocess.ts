/**
 * Post-processing utilities for generated Python code
 * Applied AFTER code fusion in frontend to ensure clean output
 */

/**
 * Fix corrupted docstrings that contain code
 */
function fixCorruptedDocstrings(code: string): string {
  // Skip for v4+ - already clean (AST-generated code is syntax-valid)
  // v5.7.2: Fixed version detection to match "[AST Transpiler v5.x]" format
  if (/\[AST Transpiler v[4-9]/.test(code) || /Transpiler v[4-9]\./.test(code) || code.includes('[v4.') || code.includes('[v5.') || code.includes('[v6.') || code.includes('[v7.') || code.includes('[v8.')) return code;
  
  // v5.7.3: REMOVED aggressive regex that corrupted v5+ code
  // The regex was: /"""[^"]*\bdef\s+\w+[^"]*"""/g → '"""Documentation."""'
  // This caused valid docstrings to be replaced with "Documentation."
  
  // Fix docstrings that don't close properly before next def
  const lines = code.split('\n');
  const result: string[] = [];
  let inDocstring = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Track docstrings
    const tripleCount = (line.match(/"""/g) || []).length;
    if (tripleCount === 1) inDocstring = !inDocstring;
    if (tripleCount === 2) inDocstring = false;
    
    // If in docstring and hit a def/class, close the docstring first
    if (inDocstring && (trimmed.startsWith('def ') || trimmed.startsWith('class '))) {
      result.push('        """');
      inDocstring = false;
    }
    
    result.push(line);
  }
  
  return result.join('\n');
}

/**
 * Fix common Python syntax errors in generated code
 */
function fixSyntaxErrors(code: string): string {
  let lines = code.split('\n');
  const fixedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines
    if (trimmed === '') {
      fixedLines.push(line);
      continue;
    }
    
    // Fix 1: Remove truncated/incomplete lines (end with operators or incomplete tokens)
    if (/[+\-*\/=,:\(\[\{]\s*$/.test(trimmed) && !trimmed.endsWith(':')) {
      // Check if next line exists and can be joined
      if (i + 1 < lines.length && lines[i + 1].trim()) {
        // Keep the line, it might be a valid multi-line statement
      } else if (trimmed.endsWith('(') || trimmed.endsWith('[') || trimmed.endsWith('{')) {
        // Incomplete opening bracket - try to close it
        const lastChar = trimmed.slice(-1);
        const closeMap: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
        line = line + closeMap[lastChar];
      }
    }
    
    // Fix 2: Balance quotes in strings
    const singleQuotes = (line.match(/'/g) || []).length;
    const doubleQuotes = (line.match(/"/g) || []).length;
    const tripleDoubleQuotes = (line.match(/"""/g) || []).length;
    const tripleSingleQuotes = (line.match(/'''/g) || []).length;
    
    // Fix unbalanced single quotes (not part of triple quotes)
    if ((singleQuotes - tripleSingleQuotes * 3) % 2 !== 0 && !trimmed.startsWith('#')) {
      line = line + "'";
    }
    // Fix unbalanced double quotes (not part of triple quotes)
    if ((doubleQuotes - tripleDoubleQuotes * 3) % 2 !== 0 && !trimmed.startsWith('#')) {
      line = line + '"';
    }
    
    // Fix 3: Incomplete def/class declarations
    if (/^(\s*)(def|class)\s+\w+[^:]*$/.test(line) && !trimmed.endsWith(':')) {
      if (!trimmed.includes('(')) {
        line = line + '():';
      } else if (!trimmed.endsWith(')')) {
        line = line + '):';
      } else {
        line = line + ':';
      }
    }
    
    // Fix 4: Incomplete if/elif/else/for/while/try/except/finally/with
    const controlKeywords = ['if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with'];
    for (const kw of controlKeywords) {
      const pattern = new RegExp(`^(\\s*)${kw}\\b(.*)$`);
      const match = line.match(pattern);
      if (match && !trimmed.endsWith(':')) {
        if (kw === 'else' || kw === 'try' || kw === 'finally') {
          line = line + ':';
        } else if (match[2].trim() && !trimmed.endsWith(':')) {
          line = line + ':';
        }
        break;
      }
    }
    
    // Fix 5: Remove lines with obvious syntax errors that can't be fixed
    if (trimmed.startsWith('...') && trimmed !== '...') {
      continue; // Skip truncated continuation markers
    }
    
    // Fix 6: Remove orphan/corrupted lines (quotes, parens, escape sequences)
    // Patterns: "", ")", " \""", )"", pure quotes/parens combinations
    if (/^["'()\\]+$/.test(trimmed) ||                    // Pure symbols only
        /^"\s*\\?"\s*"?\)?$/.test(trimmed) ||             // Corrupted quote patterns
        /^\s*"\s*\)?"?\s*$/.test(trimmed) ||              // ")" or " " etc
        /^"\s*\\""\s*$/.test(trimmed) ||                  // " \"""
        trimmed === '""' ||
        trimmed === '")' ||
        trimmed === '")"' ||
        trimmed === '" \\"""' ||
        /^["'\s\\)]+$/.test(trimmed)) {                   // Only quotes, spaces, backslashes, parens
      continue;
    }
    
    // Fix 7: Remove debug/corrupted comments
    if (trimmed.startsWith('# SYNTAX:') || 
        trimmed.startsWith('# INDENT:') ||
        trimmed.startsWith('# DECIMAL:') ||
        trimmed.startsWith('# {{LOGIC:')) {
      continue;
    }
    
    // Fix 8: Remove orphan 'pass' after __init__ body
    if (trimmed === 'pass' && i > 0) {
      const prevLine = fixedLines[fixedLines.length - 1]?.trim() || '';
      if (prevLine.startsWith('self.') || prevLine === '' || prevLine.endsWith('}')) {
        continue; // Skip redundant pass after init body
      }
    }
    
    fixedLines.push(line);
  }
  
  return fixedLines.join('\n');
}

/**
 * Balance brackets in code
 */
function balanceBrackets(code: string): string {
  const lines = code.split('\n');
  let parenCount = 0;
  let bracketCount = 0;
  let braceCount = 0;
  
  for (const line of lines) {
    if (line.trim().startsWith('#')) continue;
    
    for (const char of line) {
      switch (char) {
        case '(': parenCount++; break;
        case ')': parenCount--; break;
        case '[': bracketCount++; break;
        case ']': bracketCount--; break;
        case '{': braceCount++; break;
        case '}': braceCount--; break;
      }
    }
  }
  
  // Add missing closing brackets at the end
  let suffix = '';
  while (parenCount > 0) { suffix += ')'; parenCount--; }
  while (bracketCount > 0) { suffix += ']'; bracketCount--; }
  while (braceCount > 0) { suffix += '}'; braceCount--; }
  
  if (suffix) {
    return code + '\n' + suffix;
  }
  
  return code;
}

/**
 * Ensure all function/class definitions have a body
 */
function ensureBlockBodies(code: string): string {
  const lines = code.split('\n');
  const result: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    result.push(line);
    
    const trimmed = line.trim();
    
    // Check if this is a block definition
    if ((trimmed.startsWith('def ') || trimmed.startsWith('class ') || 
         trimmed.startsWith('if ') || trimmed.startsWith('elif ') ||
         trimmed === 'else:' || trimmed === 'try:' || trimmed === 'finally:' ||
         trimmed.startsWith('except') || trimmed.startsWith('for ') ||
         trimmed.startsWith('while ') || trimmed.startsWith('with ')) && 
        trimmed.endsWith(':')) {
      
      // Check if next line is indented (has a body)
      const baseIndent = line.match(/^(\s*)/)?.[0] || '';
      const nextLine = lines[i + 1];
      
      if (!nextLine || nextLine.trim() === '') {
        // Check the line after empty line
        const lineAfterEmpty = lines[i + 2];
        if (!lineAfterEmpty || !lineAfterEmpty.startsWith(baseIndent + '    ') && !lineAfterEmpty.startsWith(baseIndent + '\t')) {
          // No body found, add pass
          result.push(baseIndent + '    pass');
        }
      } else if (!nextLine.startsWith(baseIndent + '    ') && !nextLine.startsWith(baseIndent + '\t')) {
        // Next line is not indented, add pass
        result.push(baseIndent + '    pass');
      }
    }
  }
  
  return result.join('\n');
}

/**
 * Remove obviously broken code fragments
 */
function removeBrokenFragments(code: string): string {
  const lines = code.split('\n');
  const result: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip lines that are clearly broken
    if (
      // Incomplete variable assignments to nothing
      /^\w+\s*=\s*$/.test(trimmed) ||
      // Just operators
      /^[+\-*\/=<>!&|]+$/.test(trimmed) ||
      // Incomplete method calls
      /^\.\w+$/.test(trimmed) ||
      // Random closing brackets on their own (without context)
      /^[)\]}]+$/.test(trimmed) && result.length === 0
    ) {
      continue;
    }
    
    result.push(line);
  }
  
  return result.join('\n');
}

/**
 * Clean and deduplicate generated Python code
 * - Removes debug comments (# SYNTAX:, # DEBUG:, etc.)
 * - Fixes common syntax errors
 * - Deduplicates class definitions
 * - Deduplicates function definitions
 * - Ensures single if __name__ == "__main__" block
 */
export function postProcessPythonCode(code: string, programId: string = 'PROGRAM'): string {
  if (!code || code.length < 50) return code;
  
  // v11.21: Remove NUCLEAR error markers first
  code = code.replace(/^\s*pass\s*#.*NUCLEAR.*$/gm, '');
  code = code.replace(/^\s*pass\s*#.*syntax error.*$/gim, '');
  
  // Skip ALL post-processing for v4+ skeletons - they are already clean
  // AST Transpiler v4.x+ generates syntax-valid code via Python's ast module
  // v5.7.2: Fixed version detection to match "[AST Transpiler v5.x]" format
  if (/\[AST Transpiler v[4-9]/.test(code) || /Transpiler v[4-9]\./.test(code) || code.includes('[v4.') || code.includes('[v5.') || code.includes('[v6.') || code.includes('[v7.') || code.includes('[v8.')) {
    return code;
  }

  // Phase 0: Fix corrupted docstrings first
  let processed = fixCorruptedDocstrings(code);
  
  // Phase 1: Fix syntax errors
  processed = fixSyntaxErrors(processed);
  processed = balanceBrackets(processed);
  processed = removeBrokenFragments(processed);
  
  let lines = processed.split('\n');

  // 1. Remove debug/syntax comments and corrupted lines
  lines = lines.filter(line => {
    const trimmed = line.trim();
    // Remove debug comments
    if (
      trimmed.startsWith('# SYNTAX:') ||
      trimmed.startsWith('# DEBUG:') ||
      trimmed.startsWith('# TODO: SYNTAX') ||
      trimmed.startsWith('# GENERATED:') ||
      trimmed.startsWith('# AUTO-FIXED:') ||
      trimmed.startsWith('# ERROR:') ||
      trimmed.startsWith('# TRUNCATED:') ||
      trimmed.startsWith('# INDENT:') ||
      trimmed.startsWith('# DECORATOR:') ||
      trimmed.startsWith('# ASSIGN:')
    ) {
      return false;
    }
    // Remove lines with embedded imports (corruption from AI merge)
    // Match: any line containing "import X" or "from X import" that isn't a proper import statement
    if (/(import\s+\w+|from\s+\w+\s+import)/.test(trimmed)) {
      // Valid imports start with import/from at the beginning
      if (!(/^(import\s|from\s)/.test(trimmed))) {
        return false; // Corrupted line with embedded import
      }
    }
    return true;
  });
  
  // 1b. Keep only first logger definition (module-level only)
  let loggerFound = false;
  lines = lines.filter(line => {
    const trimmed = line.trim();
    // Only match module-level logger (no indentation)
    if (!line.startsWith(' ') && !line.startsWith('\t') && 
        /^logger\s*=\s*logging\.getLogger/.test(trimmed)) {
      if (loggerFound) return false;
      loggerFound = true;
    }
    return true;
  });

  // Helper to find the end of a code block (class or function)
  function findBlockEnd(startIdx: number, baseIndent: string): number {
    let endIdx = startIdx + 1;
    
    while (endIdx < lines.length) {
      const nextLine = lines[endIdx];
      
      // Skip empty lines
      if (nextLine.trim() === '') {
        endIdx++;
        continue;
      }
      
      const nextIndent = nextLine.match(/^(\s*)/)?.[0] || '';
      
      // If we find a non-empty line at same or lower indent, block ends
      if (nextIndent.length <= baseIndent.length) {
        break;
      }
      
      endIdx++;
    }
    
    return endIdx - 1;
  }

  // 2. Deduplicate class definitions
  const seenClasses = new Set<string>();
  const classBlocks: { name: string; startIdx: number; endIdx: number }[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(\s*)class\s+(\w+)/);
    if (match) {
      const indent = match[1];
      const className = match[2];
      const endIdx = findBlockEnd(i, indent);
      classBlocks.push({ name: className, startIdx: i, endIdx });
    }
  }
  
  // Mark duplicate class blocks for removal (keep first occurrence)
  let linesToRemove = new Set<number>();
  for (const block of classBlocks) {
    if (seenClasses.has(block.name)) {
      // Also remove @dataclass decorator if present
      if (block.startIdx > 0 && lines[block.startIdx - 1].trim() === '@dataclass') {
        linesToRemove.add(block.startIdx - 1);
      }
      for (let i = block.startIdx; i <= block.endIdx; i++) {
        linesToRemove.add(i);
      }
    } else {
      seenClasses.add(block.name);
    }
  }
  
  lines = lines.filter((_, idx) => !linesToRemove.has(idx));

  // 3. Deduplicate function definitions (keep last occurrence for better completeness)
  linesToRemove = new Set<number>();
  const seenFunctions = new Map<string, { startIdx: number; endIdx: number }>();
  const funcBlocks: { name: string; startIdx: number; endIdx: number }[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(\s*)def\s+(\w+)\s*\(/);
    if (match) {
      const indent = match[1];
      const funcName = match[2];
      const endIdx = findBlockEnd(i, indent);
      funcBlocks.push({ name: funcName, startIdx: i, endIdx });
    }
  }

  // Mark duplicate functions for removal (keep the LAST/most complete version)
  for (const block of funcBlocks) {
    const existing = seenFunctions.get(block.name);
    if (existing) {
      // Remove the earlier (smaller) version
      const existingSize = existing.endIdx - existing.startIdx;
      const currentSize = block.endIdx - block.startIdx;
      
      if (currentSize >= existingSize) {
        // Remove the earlier version, keep current
        for (let i = existing.startIdx; i <= existing.endIdx; i++) {
          linesToRemove.add(i);
        }
        seenFunctions.set(block.name, block);
      } else {
        // Keep existing, remove current
        for (let i = block.startIdx; i <= block.endIdx; i++) {
          linesToRemove.add(i);
        }
      }
    } else {
      seenFunctions.set(block.name, block);
    }
  }
  
  lines = lines.filter((_, idx) => !linesToRemove.has(idx));

  // 4. Ensure single if __name__ == "__main__" block
  let mainBlockFound = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('if __name__') && lines[i].includes('__main__')) {
      if (mainBlockFound) {
        // Remove duplicate main blocks
        const indent = lines[i].match(/^(\s*)/)?.[0] || '';
        lines[i] = '';
        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j];
          if (nextLine.trim() === '') {
            j++;
            continue;
          }
          const nextIndent = nextLine.match(/^(\s*)/)?.[0] || '';
          if (nextIndent.length <= indent.length && nextLine.trim() !== '') {
            break;
          }
          lines[j] = '';
          j++;
        }
      } else {
        mainBlockFound = true;
      }
    }
  }

  // 5. Remove duplicate global variable declarations (keep first)
  const seenGlobalVars = new Set<string>();
  lines = lines.filter(line => {
    // Match: VAR_NAME = value (at module level, not in function)
    const globalMatch = line.match(/^([A-Z][A-Z0-9_]*)\s*=\s*.+/);
    if (globalMatch && !line.startsWith(' ') && !line.startsWith('\t')) {
      const varName = globalMatch[1];
      if (seenGlobalVars.has(varName)) {
        return false; // Remove duplicate
      }
      seenGlobalVars.add(varName);
    }
    return true;
  });
  
  // 5b. Deduplicate import statements (keep first occurrence)
  const seenImports = new Set<string>();
  lines = lines.filter(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
      if (seenImports.has(trimmed)) {
        return false;
      }
      seenImports.add(trimmed);
    }
    return true;
  });

  // 6. Clean up empty lines (max 2 consecutive)
  const result: string[] = [];
  let emptyCount = 0;
  
  for (const line of lines) {
    if (line.trim() === '') {
      emptyCount++;
      if (emptyCount <= 2) {
        result.push(line);
      }
    } else {
      emptyCount = 0;
      result.push(line);
    }
  }

  // Phase 3: Ensure all blocks have bodies
  let finalCode = ensureBlockBodies(result.join('\n'));

  // Phase 4: Inject missing __init__ methods in classes
  finalCode = injectMissingInit(finalCode);

  // Phase 5: Remove orphan 'pass' statements at class level
  finalCode = removeOrphanClassPass(finalCode);

  return finalCode;
}

/**
 * v11.21: Remove orphan 'pass' statements at class level
 * These appear when business methods weren't generated but __init__ was injected
 */
function removeOrphanClassPass(code: string): string {
  const lines = code.split('\n');
  const result: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip lines that are just 'pass' at class level (4 spaces indent)
    if (trimmed === 'pass') {
      const indent = line.match(/^(\s*)/)?.[0] || '';
      // Check if this is at class level (4 spaces) after a method or class body
      if (indent.length === 4) {
        // Check if previous non-empty line is end of method or class
        let j = i - 1;
        while (j >= 0 && lines[j].trim() === '') j--;
        if (j >= 0) {
          const prevLine = lines[j].trim();
          // If previous is data assignment, dict, or similar - skip this pass
          if (prevLine.includes('self.') || prevLine.includes('{}') || 
              prevLine.includes('= {}') || prevLine.endsWith('"""') ||
              prevLine.startsWith('#')) {
            continue; // Skip this orphan pass
          }
        }
      }
    }
    result.push(line);
  }
  
  return result.join('\n');
}

/**
 * Inject __init__ methods into classes that don't have one
 */
function injectMissingInit(code: string): string {
  // Skip injection for v4+ skeletons - they already have proper __init__
  // v5.7.2: Fixed version detection to match "[AST Transpiler v5.x]" format
  if (/\[AST Transpiler v[4-9]/.test(code) || /Transpiler v[4-9]\./.test(code) || code.includes('[v4.') || code.includes('[v5.') || code.includes('[v6.') || code.includes('[v7.') || code.includes('[v8.')) {
    return code;
  }
  
  const lines = code.split('\n');
  const result: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Detect class definition (not @dataclass)
    if (trimmed.startsWith('class ') && trimmed.endsWith(':')) {
      // Check if previous line is @dataclass - skip those
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      if (prevLine === '@dataclass' || prevLine.startsWith('@dataclass(')) {
        result.push(line);
        continue;
      }
      
      // Skip Exception classes - they don't need __init__
      if (trimmed.includes('Error(') || trimmed.includes('Exception(') || 
          trimmed.includes('Error:') || trimmed.includes('Exception:')) {
        result.push(line);
        continue;
      }
      
      // Get class indentation
      const classIndent = line.match(/^(\s*)/)?.[0] || '';
      const methodIndent = classIndent + '    ';
      const bodyIndent = methodIndent + '    ';
      
      // Check if next non-empty lines contain __init__
      let hasInit = false;
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j].trim();
        if (nextLine === '') {
          j++;
          continue;
        }
        // If we hit another class or a non-indented line, stop
        if (!lines[j].startsWith(methodIndent) && nextLine !== '') {
          break;
        }
        if (nextLine.startsWith('def __init__')) {
          hasInit = true;
          break;
        }
        // Check first 10 methods
        if (j - i > 30) break;
        j++;
      }
      
      result.push(line);
      
      // Inject __init__ if missing
      if (!hasInit) {
        const className = trimmed.match(/class\s+(\w+)/)?.[1] || 'Unknown';
        result.push(methodIndent + 'def __init__(self):');
        result.push(bodyIndent + '"""Initialize ' + className + '."""');
        result.push(bodyIndent + 'self.logger = logging.getLogger(__name__)');
        result.push(bodyIndent + 'self.data: Dict[str, Any] = {}');
        result.push('');
      }
    } else {
      result.push(line);
    }
  }
  
  return result.join('\n');
}
