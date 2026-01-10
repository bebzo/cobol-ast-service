/**
 * Python Code Post-Processor
 * Cleans and validates generated Python code
 */

/**
 * Remove common AI/generation artifacts from Python code
 */
function removeArtifacts(code) {
  const patterns = [
    // "Generated from" artifacts (with optional indentation)
    /^\s*working_storage\s*-\s*Generated from.*$/gm,
    /^\s*linkage_section\s*-\s*Generated from.*$/gm,
    /^\s*\w+\s*-\s*Generated from COBOL.*$/gm,
    // UI button artifacts (indented or not)
    /^\s*Edit\s*$/gm,
    /^\s*Copy\s*$/gm,
    /^\s*Share\s*$/gm,
    /^\s*Edit\s*Copy\s*$/gm,
    /^\s*Copy\s*Share\s*$/gm,
    /^\s*Edit\s*Copy\s*Share\s*$/gm,
    // Markdown artifacts
    /^\s*```python\s*$/gm,
    /^\s*```\s*$/gm,
    // Empty comment lines that might appear as artifacts
    /^\s*#\s*Generated automatically.*$/gm,
    /^\s*#\s*Auto-generated.*$/gm,
  ];

  let result = code;
  for (const pattern of patterns) {
    result = result.replace(pattern, '');
  }
  
  // Clean up multiple consecutive blank lines
  result = result.replace(/\n{3,}/g, '\n\n');
  
  return result;
}

/**
 * Ensure all control blocks have proper bodies
 * Adds 'pass' to empty if/elif/else/try/except/for/while/with/def/class blocks
 */
function ensureBlockBodies(code) {
  const lines = code.split('\n');
  const result = [];
  
  // Patterns for block starters that need bodies
  const blockPatterns = [
    /^(\s*)(if\s+.+:\s*)$/,
    /^(\s*)(elif\s+.+:\s*)$/,
    /^(\s*)(else\s*:\s*)$/,
    /^(\s*)(try\s*:\s*)$/,
    /^(\s*)(except.*:\s*)$/,
    /^(\s*)(finally\s*:\s*)$/,
    /^(\s*)(for\s+.+:\s*)$/,
    /^(\s*)(while\s+.+:\s*)$/,
    /^(\s*)(with\s+.+:\s*)$/,
    /^(\s*)(def\s+\w+\s*\([^)]*\)\s*:\s*)$/,
    /^(\s*)(class\s+\w+.*:\s*)$/,
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    result.push(line);
    
    // Check if this is a block starter
    let isBlockStarter = false;
    let indent = '';
    
    for (const pattern of blockPatterns) {
      const match = line.match(pattern);
      if (match) {
        isBlockStarter = true;
        indent = match[1];
        break;
      }
    }
    
    if (isBlockStarter) {
      // Check the next non-empty line
      let nextLineIndex = i + 1;
      while (nextLineIndex < lines.length && lines[nextLineIndex].trim() === '') {
        nextLineIndex++;
      }
      
      if (nextLineIndex < lines.length) {
        const nextLine = lines[nextLineIndex];
        const nextIndent = nextLine.match(/^(\s*)/)[1];
        
        // If next line is not indented more than current, we need pass
        if (nextIndent.length <= indent.length && nextLine.trim() !== '') {
          result.push(indent + '    pass');
        }
      } else {
        // End of file after block starter - add pass
        result.push(indent + '    pass');
      }
    }
  }
  
  return result.join('\n');
}

/**
 * Fix orphan try blocks by adding except clause if missing
 */
function fixOrphanTryBlocks(code) {
  const lines = code.split('\n');
  const result = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check if this is a try: line
    if (trimmed === 'try:') {
      const indent = line.match(/^(\s*)/)[1];
      result.push(line);
      
      // Look ahead for corresponding except/finally
      let j = i + 1;
      let hasExcept = false;
      let tryEnded = false;
      
      while (j < lines.length) {
        const checkLine = lines[j];
        const checkTrimmed = checkLine.trim();
        const checkIndent = checkLine.match(/^(\s*)/)[1];
        
        // Skip empty lines
        if (checkTrimmed === '') {
          j++;
          continue;
        }
        
        // If we're back at same or less indentation
        if (checkIndent.length <= indent.length) {
          if (checkTrimmed.startsWith('except') || checkTrimmed.startsWith('finally')) {
            hasExcept = true;
          }
          tryEnded = true;
          break;
        }
        
        j++;
      }
      
      // If no except/finally found for this try, we need to add one
      // But only after all the try body is processed
      if (!hasExcept && tryEnded) {
        // Process try body first
        i++;
        while (i < lines.length) {
          const bodyLine = lines[i];
          const bodyTrimmed = bodyLine.trim();
          const bodyIndent = bodyLine.match(/^(\s*)/)[1];
          
          if (bodyTrimmed === '' || bodyIndent.length > indent.length) {
            result.push(lines[i]);
            i++;
          } else {
            break;
          }
        }
        
        // Add except clause before continuing
        result.push(indent + 'except Exception:');
        result.push(indent + '    pass');
        continue;
      }
    }
    
    result.push(line);
    i++;
  }
  
  return result.join('\n');
}

/**
 * Remove orphan pass statements that break try/except flow
 */
function fixOrphanPass(code) {
  const lines = code.split('\n');
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const indent = line.match(/^(\s*)/)[1];
    
    // If this is a pass statement, check if it's breaking try/except
    if (trimmed === 'pass') {
      // Look for next non-empty line
      let nextIndex = i + 1;
      while (nextIndex < lines.length && lines[nextIndex].trim() === '') {
        nextIndex++;
      }
      
      if (nextIndex < lines.length) {
        const nextLine = lines[nextIndex];
        const nextTrimmed = nextLine.trim();
        const nextIndent = nextLine.match(/^(\s*)/)[1];
        
        // If next line is except/finally at same indentation level
        // and there's content before this pass, skip the pass
        if ((nextTrimmed.startsWith('except') || nextTrimmed.startsWith('finally')) &&
            nextIndent.length <= indent.length) {
          // Check if there's actual content before this pass
          let hasContent = false;
          for (let j = i - 1; j >= 0; j--) {
            const prevTrimmed = lines[j].trim();
            if (prevTrimmed === '') continue;
            if (prevTrimmed === 'try:') break;
            if (prevTrimmed !== '' && prevTrimmed !== 'pass') {
              hasContent = true;
              break;
            }
          }
          
          if (hasContent) {
            // Skip this pass as it's orphaned
            continue;
          }
        }
      }
    }
    
    result.push(line);
  }
  
  return result.join('\n');
}

/**
 * Fix incomplete if statements (missing condition)
 */
function fixIncompleteIf(code) {
  // Fix "if:" without condition
  let result = code.replace(/^(\s*)if\s*:\s*$/gm, '$1if True:  # TODO: Add condition');
  
  // Fix "elif:" without condition
  result = result.replace(/^(\s*)elif\s*:\s*$/gm, '$1elif True:  # TODO: Add condition');
  
  return result;
}

/**
 * Fix unclosed brackets/braces/parentheses
 */
function fixUnclosedDelimiters(code) {
  const lines = code.split('\n');
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Count delimiters
    const opens = (line.match(/[\(\[\{]/g) || []).length;
    const closes = (line.match(/[\)\]\}]/g) || []).length;
    
    // Check for line ending with opening delimiter (like "self.x = {")
    if (line.trim().endsWith('{') && opens > closes) {
      // Check if next line closes it
      let nextIndex = i + 1;
      while (nextIndex < lines.length && lines[nextIndex].trim() === '') {
        nextIndex++;
      }
      
      if (nextIndex < lines.length) {
        const nextLine = lines[nextIndex].trim();
        // If next line doesn't close the brace, add empty dict
        if (!nextLine.startsWith('}') && !nextLine.includes('}')) {
          line = line.replace(/\{\s*$/, '{}');
        }
      } else {
        // End of file, close the brace
        line = line.replace(/\{\s*$/, '{}');
      }
    }
    
    result.push(line);
  }
  
  return result.join('\n');
}

/**
 * Main post-processing function
 */
export function postProcessPythonCode(code) {
  if (!code || typeof code !== 'string') {
    return code;
  }
  
  let result = code;
  
  // Step 1: Remove artifacts
  result = removeArtifacts(result);
  
  // Step 2: Fix incomplete if/elif statements
  result = fixIncompleteIf(result);
  
  // Step 3: Fix unclosed delimiters
  result = fixUnclosedDelimiters(result);
  
  // Step 4: Fix orphan pass statements
  result = fixOrphanPass(result);
  
  // Step 5: Fix orphan try blocks
  result = fixOrphanTryBlocks(result);
  
  // Step 6: Ensure all blocks have bodies
  result = ensureBlockBodies(result);
  
  // Final cleanup: remove trailing whitespace and ensure final newline
  result = result.split('\n').map(line => line.replace(/\s+$/, '')).join('\n');
  if (!result.endsWith('\n')) {
    result += '\n';
  }
  
  return result;
}

export default postProcessPythonCode;
