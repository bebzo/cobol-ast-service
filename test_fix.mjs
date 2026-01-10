function fixMisalignedMethodBody(code) {
  const lines = code.split('\n');
  const result = [];
  
  let inMethod = false;
  let methodBaseIndent = 0;
  let expectedBodyIndent = 0;
  let docstringDone = false;
  
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
      docstringDone = false;
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
        docstringDone = true;
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

const testCode = `class EnterpriseProcessor:
    def __init__(self):
        """Initialize EnterpriseProcessor."""
            self._file_customer_file = open("test.dat", "w")
            self._file_account_file = open("test2.dat", "w")
    def p_1200_initialize_counters(self) -> None:
        """Initialize counters."""
            assert self.data is not None`;

console.log("=== INPUT ===");
console.log(testCode);
console.log("\n=== OUTPUT ===");
console.log(fixMisalignedMethodBody(testCode));
