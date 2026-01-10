import fs from 'fs';

// Read the problematic Python file
let code = fs.readFileSync('/workspace/full_v4.py', 'utf8');
console.log(`Original lines: ${code.split('\n').length}`);
console.log(`Original 'self. if hasattr' count: ${(code.match(/self\.\s+if\s+hasattr/g) || []).length}`);
console.log(`Original 'self.' in strings count: ${(code.match(/"[^"]*self\.[^"]*"/g) || []).length}`);

// Apply the fixes from postprocess.ts v11.11.1

// v11.11: Fix "self. if hasattr" → corrupted conditional expression
code = code.replace(/self\.\s+if\s+hasattr\s*\([^)]*\)\s+else\s+(\S+)/g, '$1');

// v11.11: Fix strings containing "self.xxx" → remove ALL self. inside strings
code = code.replace(/"([^"]*)"/g, (match, content) => {
  const fixed = content.replace(/self\./gi, '');
  return `"${fixed}"`;
});

// v11.11: Fix bare self. without attribute
code = code.replace(/self\.\s*\)/g, 'None)');
code = code.replace(/self\.\s*,/g, 'None,');
code = code.replace(/self\.\s*$/gm, 'None');

fs.writeFileSync('/workspace/full_v4_fixed.py', code);
console.log(`\nFixed lines: ${code.split('\n').length}`);
console.log(`Fixed 'self. if hasattr' count: ${(code.match(/self\.\s+if\s+hasattr/g) || []).length}`);
console.log(`Fixed 'self.' in strings count: ${(code.match(/"[^"]*self\.[^"]*"/g) || []).length}`);
