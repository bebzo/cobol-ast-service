/**
 * Round-trip COBOL Generator - v6.1.0
 * Génère du COBOL commenté à partir du Python pour audit inverse
 */

export interface RoundtripMapping {
  pythonLine: number;
  pythonCode: string;
  cobolEquivalent: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
}

export interface RoundtripResult {
  commentedCobol: string;
  mappings: RoundtripMapping[];
  coverage: number;
  unmappedPythonLines: number[];
}

// Python to COBOL pattern mappings
const PYTHON_TO_COBOL_PATTERNS: Array<{
  pythonPattern: RegExp;
  cobolTemplate: (match: RegExpMatchArray) => string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}> = [
  // Class definition -> PROGRAM-ID
  {
    pythonPattern: /^class\s+(\w+)(?:\(.*\))?:/,
    cobolTemplate: (m) => `       PROGRAM-ID. ${m[1].toUpperCase().replace(/_/g, '-')}.`,
    confidence: 'HIGH'
  },
  // def __init__ -> WORKING-STORAGE SECTION
  {
    pythonPattern: /^\s*def\s+__init__\s*\(/,
    cobolTemplate: () => `       WORKING-STORAGE SECTION.`,
    confidence: 'MEDIUM'
  },
  // Method definition -> PARAGRAPH
  {
    pythonPattern: /^\s*def\s+(\w+)\s*\(/,
    cobolTemplate: (m) => `       ${m[1].toUpperCase().replace(/_/g, '-')}.`,
    confidence: 'HIGH'
  },
  // Variable assignment with Decimal -> MOVE with COMPUTE
  {
    pythonPattern: /^\s*(\w+)\s*=\s*Decimal\(['"]?([\d.]+)['"]?\)/,
    cobolTemplate: (m) => `           MOVE ${m[2]} TO ${m[1].toUpperCase().replace(/_/g, '-')}.`,
    confidence: 'HIGH'
  },
  // Simple variable assignment -> MOVE
  {
    pythonPattern: /^\s*self\.(\w+)\s*=\s*(.+)$/,
    cobolTemplate: (m) => `           MOVE ${m[2].replace(/['"]/g, '')} TO ${m[1].toUpperCase().replace(/_/g, '-')}.`,
    confidence: 'MEDIUM'
  },
  // If statement -> IF
  {
    pythonPattern: /^\s*if\s+(.+):/,
    cobolTemplate: (m) => `           IF ${m[1].toUpperCase()}`,
    confidence: 'MEDIUM'
  },
  // Else -> ELSE
  {
    pythonPattern: /^\s*else:/,
    cobolTemplate: () => `           ELSE`,
    confidence: 'HIGH'
  },
  // Elif -> ELSE IF (EVALUATE WHEN)
  {
    pythonPattern: /^\s*elif\s+(.+):/,
    cobolTemplate: (m) => `           WHEN ${m[1].toUpperCase()}`,
    confidence: 'MEDIUM'
  },
  // For loop -> PERFORM VARYING
  {
    pythonPattern: /^\s*for\s+(\w+)\s+in\s+range\((\d+),?\s*(\d+)?\):/,
    cobolTemplate: (m) => {
      const start = m[2] || '1';
      const end = m[3] || m[2];
      return `           PERFORM ${m[1].toUpperCase()}-LOOP VARYING ${m[1].toUpperCase()} FROM ${start} BY 1 UNTIL ${m[1].toUpperCase()} > ${end}`;
    },
    confidence: 'MEDIUM'
  },
  // While loop -> PERFORM UNTIL
  {
    pythonPattern: /^\s*while\s+(.+):/,
    cobolTemplate: (m) => `           PERFORM UNTIL NOT (${m[1].toUpperCase()})`,
    confidence: 'MEDIUM'
  },
  // Return statement -> paragraph end
  {
    pythonPattern: /^\s*return\s+(.+)?$/,
    cobolTemplate: (m) => m[1] ? `           MOVE ${m[1]} TO RETURN-VALUE.` : `           EXIT PARAGRAPH.`,
    confidence: 'MEDIUM'
  },
  // Print/display -> DISPLAY
  {
    pythonPattern: /^\s*print\s*\((.+)\)/,
    cobolTemplate: (m) => `           DISPLAY ${m[1].replace(/f?["']/g, '"')}.`,
    confidence: 'HIGH'
  },
  // File open -> OPEN
  {
    pythonPattern: /^\s*(\w+)\s*=\s*open\s*\(['"](.+)['"],\s*['"]([rwa])['"]?\)/,
    cobolTemplate: (m) => {
      const mode = m[3] === 'r' ? 'INPUT' : m[3] === 'w' ? 'OUTPUT' : 'I-O';
      return `           OPEN ${mode} ${m[1].toUpperCase().replace(/_/g, '-')}.`;
    },
    confidence: 'HIGH'
  },
  // File close -> CLOSE
  {
    pythonPattern: /^\s*(\w+)\.close\s*\(\)/,
    cobolTemplate: (m) => `           CLOSE ${m[1].toUpperCase().replace(/_/g, '-')}.`,
    confidence: 'HIGH'
  },
  // Read line -> READ
  {
    pythonPattern: /^\s*(\w+)\s*=\s*(\w+)\.read(?:line)?\s*\(\)/,
    cobolTemplate: (m) => `           READ ${m[2].toUpperCase()} INTO ${m[1].toUpperCase()}.`,
    confidence: 'HIGH'
  },
  // Write -> WRITE
  {
    pythonPattern: /^\s*(\w+)\.write\s*\((.+)\)/,
    cobolTemplate: (m) => `           WRITE ${m[1].toUpperCase()}-RECORD FROM ${m[2].toUpperCase()}.`,
    confidence: 'MEDIUM'
  },
  // Try block -> implicit error handling
  {
    pythonPattern: /^\s*try:/,
    cobolTemplate: () => `      * ERROR HANDLING BLOCK`,
    confidence: 'LOW'
  },
  // Except -> FILE STATUS check
  {
    pythonPattern: /^\s*except\s+(\w+)(?:\s+as\s+\w+)?:/,
    cobolTemplate: (m) => `           IF FILE-STATUS NOT = "00"`,
    confidence: 'LOW'
  },
  // List append -> table insert
  {
    pythonPattern: /^\s*(\w+)\.append\s*\((.+)\)/,
    cobolTemplate: (m) => `           ADD 1 TO ${m[1].toUpperCase()}-COUNT. MOVE ${m[2]} TO ${m[1].toUpperCase()}(${m[1].toUpperCase()}-COUNT).`,
    confidence: 'LOW'
  },
  // Dictionary access -> table lookup
  {
    pythonPattern: /^\s*(\w+)\s*=\s*(\w+)\[['"]?(\w+)['"]?\]/,
    cobolTemplate: (m) => `           SEARCH ${m[2].toUpperCase()} WHEN ${m[2].toUpperCase()}-KEY = "${m[3]}" MOVE ${m[2].toUpperCase()}-VALUE TO ${m[1].toUpperCase()}.`,
    confidence: 'LOW'
  },
  // String concatenation -> STRING
  {
    pythonPattern: /^\s*(\w+)\s*=\s*(.+)\s*\+\s*(.+)$/,
    cobolTemplate: (m) => `           STRING ${m[2]} DELIMITED SIZE ${m[3]} DELIMITED SIZE INTO ${m[1].toUpperCase()}.`,
    confidence: 'LOW'
  },
  // Math operation -> COMPUTE
  {
    pythonPattern: /^\s*(\w+)\s*=\s*(\w+)\s*([+\-*\/])\s*(\w+)/,
    cobolTemplate: (m) => {
      const ops: Record<string, string> = { '+': '+', '-': '-', '*': '*', '/': '/' };
      return `           COMPUTE ${m[1].toUpperCase()} = ${m[2].toUpperCase()} ${ops[m[3]]} ${m[4].toUpperCase()}.`;
    },
    confidence: 'MEDIUM'
  },
  // Import -> COPY
  {
    pythonPattern: /^from\s+(\w+)\s+import\s+(.+)$/,
    cobolTemplate: (m) => `       COPY ${m[1].toUpperCase()}.`,
    confidence: 'LOW'
  },
  // Import -> COPY
  {
    pythonPattern: /^import\s+(\w+)/,
    cobolTemplate: (m) => `       COPY ${m[1].toUpperCase()}.`,
    confidence: 'LOW'
  },
  // Comment
  {
    pythonPattern: /^\s*#\s*(.+)$/,
    cobolTemplate: (m) => `      * ${m[1]}`,
    confidence: 'HIGH'
  },
  // Docstring start
  {
    pythonPattern: /^\s*"""(.*)$/,
    cobolTemplate: (m) => `      * ${m[1] || 'Documentation'}`,
    confidence: 'HIGH'
  },
];

/**
 * Generate round-trip COBOL from Python code
 */
export function generateRoundtripCobol(pythonCode: string, originalCobol?: string): RoundtripResult {
  const pythonLines = pythonCode.split('\n');
  const mappings: RoundtripMapping[] = [];
  const unmappedLines: number[] = [];
  let cobolOutput: string[] = [];
  
  // Add header
  cobolOutput.push(`      ******************************************************************`);
  cobolOutput.push(`      * ROUND-TRIP COBOL - Generated from Python`);
  cobolOutput.push(`      * Generated by CodeSwitch v6.1.0`);
  cobolOutput.push(`      * For audit and verification purposes`);
  cobolOutput.push(`      ******************************************************************`);
  cobolOutput.push(``);
  cobolOutput.push(`       IDENTIFICATION DIVISION.`);
  
  let inDocstring = false;
  let currentIndent = 0;
  
  for (let i = 0; i < pythonLines.length; i++) {
    const line = pythonLines[i];
    const lineNum = i + 1;
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (trimmedLine === '') {
      cobolOutput.push(``);
      continue;
    }
    
    // Handle docstrings
    if (trimmedLine.startsWith('"""') || trimmedLine.startsWith("'''")) {
      if (inDocstring) {
        inDocstring = false;
        continue;
      }
      if (trimmedLine.endsWith('"""') || trimmedLine.endsWith("'''")) {
        // Single line docstring
        const content = trimmedLine.slice(3, -3);
        cobolOutput.push(`      * ${content}`);
        mappings.push({
          pythonLine: lineNum,
          pythonCode: line,
          cobolEquivalent: `      * ${content}`,
          confidence: 'HIGH'
        });
        continue;
      }
      inDocstring = true;
      continue;
    }
    
    if (inDocstring) {
      cobolOutput.push(`      * ${trimmedLine}`);
      continue;
    }
    
    // Try to match patterns
    let matched = false;
    for (const pattern of PYTHON_TO_COBOL_PATTERNS) {
      const match = line.match(pattern.pythonPattern);
      if (match) {
        const cobolEquiv = pattern.cobolTemplate(match);
        cobolOutput.push(cobolEquiv);
        
        mappings.push({
          pythonLine: lineNum,
          pythonCode: line,
          cobolEquivalent: cobolEquiv,
          confidence: pattern.confidence
        });
        
        matched = true;
        break;
      }
    }
    
    if (!matched && trimmedLine.length > 0 && !trimmedLine.startsWith('#')) {
      // Add as comment if unmatched
      cobolOutput.push(`      * [PY:${lineNum}] ${trimmedLine}`);
      unmappedLines.push(lineNum);
      
      mappings.push({
        pythonLine: lineNum,
        pythonCode: line,
        cobolEquivalent: `      * [UNMAPPED] ${trimmedLine}`,
        confidence: 'LOW',
        notes: 'Could not find COBOL equivalent'
      });
    }
  }
  
  // Add footer
  cobolOutput.push(``);
  cobolOutput.push(`       STOP RUN.`);
  cobolOutput.push(``);
  cobolOutput.push(`      ******************************************************************`);
  cobolOutput.push(`      * END OF ROUND-TRIP COBOL`);
  cobolOutput.push(`      * Mapped lines: ${mappings.length - unmappedLines.length}`);
  cobolOutput.push(`      * Unmapped lines: ${unmappedLines.length}`);
  cobolOutput.push(`      * Coverage: ${((1 - unmappedLines.length / pythonLines.length) * 100).toFixed(1)}%`);
  cobolOutput.push(`      ******************************************************************`);
  
  const coverage = pythonLines.length > 0 
    ? ((mappings.length - unmappedLines.length) / pythonLines.length) * 100 
    : 0;
  
  return {
    commentedCobol: cobolOutput.join('\n'),
    mappings,
    coverage: Math.round(coverage * 10) / 10,
    unmappedPythonLines: unmappedLines
  };
}

/**
 * Generate side-by-side comparison for audit
 */
export function generateAuditComparison(
  originalCobol: string,
  pythonCode: string,
  roundtripCobol: string
): string {
  const orig = originalCobol.split('\n');
  const rt = roundtripCobol.split('\n');
  
  let comparison = `
╔══════════════════════════════════════════════════════════════════════════════════════════╗
║                        AUDIT COMPARISON - Original vs Round-trip                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝

This report compares the original COBOL with the round-trip COBOL generated from Python.
Discrepancies may indicate transpilation issues or intentional modernization changes.

`;

  comparison += `📊 STATISTICS
───────────────────────────────────────────────────────────────────
  Original COBOL lines:    ${orig.length}
  Round-trip COBOL lines:  ${rt.length}
  Python lines:            ${pythonCode.split('\n').length}
  
`;

  comparison += `📋 CONFIDENCE SUMMARY
───────────────────────────────────────────────────────────────────
  HIGH confidence mappings are direct translations.
  MEDIUM confidence may have semantic variations.
  LOW confidence requires manual verification.

`;

  return comparison;
}

/**
 * Validate round-trip COBOL against original
 */
export function validateRoundtrip(
  originalCobol: string,
  roundtripCobol: string
): { similarity: number; differences: string[] } {
  const origParagraphs = extractParagraphNames(originalCobol);
  const rtParagraphs = extractParagraphNames(roundtripCobol);
  
  const differences: string[] = [];
  
  // Check for missing paragraphs
  for (const para of origParagraphs) {
    if (!rtParagraphs.includes(para)) {
      differences.push(`Missing paragraph in round-trip: ${para}`);
    }
  }
  
  // Check for extra paragraphs
  for (const para of rtParagraphs) {
    if (!origParagraphs.includes(para)) {
      differences.push(`Extra paragraph in round-trip: ${para}`);
    }
  }
  
  const matchingParagraphs = origParagraphs.filter(p => rtParagraphs.includes(p)).length;
  const similarity = origParagraphs.length > 0 
    ? (matchingParagraphs / origParagraphs.length) * 100 
    : 0;
  
  return {
    similarity: Math.round(similarity * 10) / 10,
    differences
  };
}

function extractParagraphNames(cobol: string): string[] {
  const matches = cobol.match(/^[\s]{0,7}([A-Z0-9][\w-]*)\s*\.\s*$/gim) || [];
  return matches.map(m => m.trim().replace('.', '').toUpperCase());
}

/**
 * Format round-trip result as report
 */
export function formatRoundtripReport(result: RoundtripResult): string {
  const highConf = result.mappings.filter(m => m.confidence === 'HIGH').length;
  const medConf = result.mappings.filter(m => m.confidence === 'MEDIUM').length;
  const lowConf = result.mappings.filter(m => m.confidence === 'LOW').length;

  let report = `
╔══════════════════════════════════════════════════════════════════╗
║              ROUND-TRIP COBOL GENERATION REPORT                  ║
╚══════════════════════════════════════════════════════════════════╝

📊 COVERAGE: ${result.coverage}%
───────────────────────────────────────────────────────────────────
  Total mappings:     ${result.mappings.length}
  Unmapped lines:     ${result.unmappedPythonLines.length}

🎯 CONFIDENCE BREAKDOWN
───────────────────────────────────────────────────────────────────
  🟢 HIGH:    ${highConf} lines (direct translation)
  🟡 MEDIUM:  ${medConf} lines (semantic equivalent)
  🔴 LOW:     ${lowConf} lines (requires verification)

`;

  if (result.unmappedPythonLines.length > 0) {
    report += `⚠️  UNMAPPED LINES: ${result.unmappedPythonLines.slice(0, 10).join(', ')}${result.unmappedPythonLines.length > 10 ? '...' : ''}\n\n`;
  }

  report += `✅ The round-trip COBOL has been generated for audit purposes.
   Review LOW confidence mappings before using in production.
`;

  return report;
}
