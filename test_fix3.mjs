import fs from 'fs';

function fixMisalignedMethodBody(code) {
  const lines = code.split('\n');
  const result = [];
  
  let inMethod = false;
  let methodBaseIndent = 0;
  let expectedBodyIndent = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const currentIndent = line.length - line.trimStart().length;
    
    if (!trimmed) {
      result.push(line);
      continue;
    }
    
    if (trimmed.startsWith('def ') && trimmed.endsWith(':')) {
      inMethod = true;
      methodBaseIndent = currentIndent;
      expectedBodyIndent = currentIndent + 4;
      result.push(line);
      continue;
    }
    
    if (trimmed.startsWith('class ') && trimmed.endsWith(':')) {
      inMethod = false;
      result.push(line);
      continue;
    }
    
    if (inMethod && currentIndent > methodBaseIndent) {
      if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
        if (currentIndent !== expectedBodyIndent) {
          result.push(' '.repeat(expectedBodyIndent) + trimmed);
        } else {
          result.push(line);
        }
        continue;
      }
      
      if (currentIndent > expectedBodyIndent) {
        result.push(' '.repeat(expectedBodyIndent) + trimmed);
        continue;
      }
      
      result.push(line);
      continue;
    }
    
    if (inMethod && currentIndent <= methodBaseIndent) {
      inMethod = false;
    }
    
    result.push(line);
  }
  
  return result.join('\n');
}

const code = fs.readFileSync('/workspace/test_v1120_final2.py', 'utf8');
const fixed = fixMisalignedMethodBody(code);
fs.writeFileSync('/workspace/test_v1120_fixed_local.py', fixed);
console.log("Fixed code written.");
