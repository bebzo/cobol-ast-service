/**
 * CodeSwitch v6.1 - Advanced Diff Features
 * 
 * Features:
 * 1. Line Mapping - Click COBOL line → highlight corresponding Python line
 * 2. Sync Scroll - Synchronized scrolling between panels
 * 3. Enhanced Syntax Highlighting - Improved code highlighting
 * 4. PDF Export - Export diff view as PDF
 * 5. A/B Testing - Compare multiple Python versions
 */

export interface LineMapping {
  cobolLine: number;
  pythonLines: number[];
  type: 'direct' | 'expanded' | 'generated';
}

export interface DiffState {
  selectedCobolLine: number | null;
  highlightedPythonLines: number[];
  syncScrollEnabled: boolean;
  showLineMapping: boolean;
}

export interface ABTestVersion {
  id: string;
  name: string;
  pythonCode: string;
  timestamp: number;
  metrics: {
    lines: number;
    methods: number;
    classes: number;
    testsPassed: number;
  };
}

/**
 * Generate line mappings between COBOL and Python code
 * Uses comments and structure analysis to map lines
 */
export function generateLineMappings(cobolCode: string, pythonCode: string): LineMapping[] {
  const mappings: LineMapping[] = [];
  const cobolLines = cobolCode.split('\n');
  const pythonLines = pythonCode.split('\n');
  
  // Find paragraph/section markers in COBOL
  const cobolParagraphs: { name: string; line: number }[] = [];
  cobolLines.forEach((line, idx) => {
    // Match COBOL paragraph names (line starting with identifier followed by period)
    const match = line.match(/^\s{7}([A-Z0-9][-A-Z0-9]*)\s*\./i);
    if (match) {
      cobolParagraphs.push({ name: match[1].toUpperCase(), line: idx + 1 });
    }
  });
  
  // Find corresponding Python methods
  const pythonMethods: { name: string; startLine: number; endLine: number }[] = [];
  let currentMethodName: string | null = null;
  let currentMethodStart: number = 0;
  
  pythonLines.forEach((line, idx) => {
    const methodMatch = line.match(/^\s*def\s+([a-z_][a-z0-9_]*)\s*\(/i);
    if (methodMatch) {
      if (currentMethodName !== null) {
        pythonMethods.push({ name: currentMethodName, startLine: currentMethodStart, endLine: idx });
      }
      currentMethodName = methodMatch[1];
      currentMethodStart = idx + 1;
    }
  });
  if (currentMethodName !== null) {
    pythonMethods.push({ name: currentMethodName, startLine: currentMethodStart, endLine: pythonLines.length });
  }
  
  // Map COBOL paragraphs to Python methods
  cobolParagraphs.forEach(para => {
    const normalizedName = para.name.toLowerCase().replace(/-/g, '_');
    const matchingMethod = pythonMethods.find(m => 
      m.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(m.name.toLowerCase())
    );
    
    if (matchingMethod) {
      const pythonLineNumbers: number[] = [];
      for (let i = matchingMethod.startLine; i <= matchingMethod.endLine; i++) {
        pythonLineNumbers.push(i);
      }
      mappings.push({
        cobolLine: para.line,
        pythonLines: pythonLineNumbers,
        type: 'direct'
      });
    }
  });
  
  // Also map DATA DIVISION items to Python class attributes
  let inDataDivision = false;
  cobolLines.forEach((line, idx) => {
    if (line.includes('DATA DIVISION')) {
      inDataDivision = true;
    } else if (line.includes('PROCEDURE DIVISION')) {
      inDataDivision = false;
    }
    
    if (inDataDivision) {
      // Match level numbers (01, 05, 10, etc.)
      const levelMatch = line.match(/^\s*(\d{2})\s+([A-Z0-9][-A-Z0-9]*)/i);
      if (levelMatch) {
        const varName = levelMatch[2].toLowerCase().replace(/-/g, '_');
        // Find in Python (as self.variable or in __init__)
        pythonLines.forEach((pyLine, pyIdx) => {
          if (pyLine.includes(`self.${varName}`) || pyLine.includes(`${varName} =`) || pyLine.includes(`${varName}:`)) {
            mappings.push({
              cobolLine: idx + 1,
              pythonLines: [pyIdx + 1],
              type: 'direct'
            });
          }
        });
      }
    }
  });
  
  return mappings;
}

/**
 * Find Python lines that correspond to a COBOL line
 */
export function findPythonLinesForCobol(
  cobolLineNumber: number,
  mappings: LineMapping[]
): number[] {
  // Direct mapping
  const directMapping = mappings.find(m => m.cobolLine === cobolLineNumber);
  if (directMapping) {
    return directMapping.pythonLines;
  }

  // Find closest mapping (for lines within a paragraph)
  const sortedMappings = [...mappings].sort((a, b) => a.cobolLine - b.cobolLine);
  for (let i = sortedMappings.length - 1; i >= 0; i--) {
    if (sortedMappings[i].cobolLine <= cobolLineNumber) {
      return sortedMappings[i].pythonLines;
    }
  }
  
  return [];
}

/**
 * Find COBOL lines that correspond to a Python line (reverse mapping)
 */
export function findCobolLinesForPython(
  pythonLineNumber: number,
  mappings: LineMapping[]
): number[] {
  // Find all mappings where this Python line is included
  const matchingMappings = mappings.filter(m => 
    m.pythonLines.includes(pythonLineNumber)
  );
  
  if (matchingMappings.length > 0) {
    return matchingMappings.map(m => m.cobolLine);
  }

  // Find closest mapping (for lines within a method)
  // Sort by first Python line in each mapping
  const sortedMappings = [...mappings]
    .filter(m => m.pythonLines.length > 0)
    .sort((a, b) => Math.min(...a.pythonLines) - Math.min(...b.pythonLines));
  
  for (let i = sortedMappings.length - 1; i >= 0; i--) {
    const minPyLine = Math.min(...sortedMappings[i].pythonLines);
    const maxPyLine = Math.max(...sortedMappings[i].pythonLines);
    if (pythonLineNumber >= minPyLine && pythonLineNumber <= maxPyLine) {
      return [sortedMappings[i].cobolLine];
    }
    if (minPyLine <= pythonLineNumber) {
      return [sortedMappings[i].cobolLine];
    }
  }
  
  return [];
}

/**
 * Sync scroll handler - returns scroll percentage
 */
export function calculateScrollSync(
  sourceScrollTop: number,
  sourceScrollHeight: number,
  sourceClientHeight: number
): number {
  const maxScroll = sourceScrollHeight - sourceClientHeight;
  if (maxScroll <= 0) return 0;
  return sourceScrollTop / maxScroll;
}

/**
 * Apply scroll sync to target element
 */
export function applyScrollSync(
  targetElement: HTMLElement,
  scrollPercentage: number
): void {
  const maxScroll = targetElement.scrollHeight - targetElement.clientHeight;
  targetElement.scrollTop = scrollPercentage * maxScroll;
}

/**
 * Generate PDF from diff view using html2canvas approach
 */
export async function exportDiffToPDF(
  cobolCode: string,
  pythonCode: string,
  filename: string
): Promise<Blob> {
  // Create HTML content for PDF
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CodeSwitch Diff Report - ${filename}</title>
  <style>
    body { font-family: 'Courier New', monospace; margin: 20px; background: #1e293b; color: #e2e8f0; }
    h1 { color: #818cf8; text-align: center; }
    .container { display: flex; gap: 20px; }
    .panel { flex: 1; background: #0f172a; border-radius: 8px; padding: 15px; overflow: auto; }
    .panel h2 { margin-top: 0; font-size: 14px; color: #94a3b8; border-bottom: 1px solid #334155; padding-bottom: 8px; }
    .cobol h2 { color: #fbbf24; }
    .python h2 { color: #4ade80; }
    pre { margin: 0; white-space: pre-wrap; font-size: 11px; line-height: 1.5; }
    .line { display: flex; }
    .line-num { color: #64748b; min-width: 40px; text-align: right; padding-right: 10px; user-select: none; }
    .line-content { flex: 1; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; background: #0f172a; padding: 15px; border-radius: 8px; }
    .stat { text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #818cf8; }
    .stat-label { font-size: 12px; color: #94a3b8; }
    footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 11px; }
  </style>
</head>
<body>
  <h1>CodeSwitch Diff Report</h1>
  <p style="text-align: center; color: #94a3b8;">Generated: ${new Date().toLocaleString()}</p>
  
  <div class="stats">
    <div class="stat">
      <div class="stat-value">${cobolCode.split('\n').length}</div>
      <div class="stat-label">COBOL Lines</div>
    </div>
    <div class="stat">
      <div class="stat-value">${pythonCode.split('\n').length}</div>
      <div class="stat-label">Python Lines</div>
    </div>
    <div class="stat">
      <div class="stat-value">${((pythonCode.split('\n').length / cobolCode.split('\n').length) * 100).toFixed(0)}%</div>
      <div class="stat-label">Ratio</div>
    </div>
  </div>
  
  <div class="container">
    <div class="panel cobol">
      <h2>COBOL Original (${cobolCode.split('\n').length} lines)</h2>
      <pre>${cobolCode.split('\n').map((line, i) => 
        `<div class="line"><span class="line-num">${i + 1}</span><span class="line-content">${escapeHtml(line)}</span></div>`
      ).join('')}</pre>
    </div>
    <div class="panel python">
      <h2>Python Generated (${pythonCode.split('\n').length} lines)</h2>
      <pre>${pythonCode.split('\n').map((line, i) => 
        `<div class="line"><span class="line-num">${i + 1}</span><span class="line-content">${escapeHtml(line)}</span></div>`
      ).join('')}</pre>
    </div>
  </div>
  
  <footer>Generated by CodeSwitch v6.1 - COBOL to Python Transpiler</footer>
</body>
</html>
  `;
  
  // Return as Blob (HTML for now, can be converted to PDF on client)
  return new Blob([html], { type: 'text/html' });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * A/B Testing - Compare two Python versions
 */
export function compareVersions(versionA: ABTestVersion, versionB: ABTestVersion): {
  linesDiff: number;
  linesPercent: number;
  methodsDiff: number;
  winner: 'A' | 'B' | 'tie';
  analysis: string[];
} {
  const linesDiff = versionB.metrics.lines - versionA.metrics.lines;
  const linesPercent = versionA.metrics.lines > 0 
    ? ((linesDiff / versionA.metrics.lines) * 100) 
    : 0;
  const methodsDiff = versionB.metrics.methods - versionA.metrics.methods;
  
  // Determine winner based on multiple factors
  let score = 0;
  const analysis: string[] = [];
  
  // Less lines is generally better (more concise)
  if (linesDiff < 0) {
    score++;
    analysis.push(`Version B has ${Math.abs(linesDiff)} fewer lines (${Math.abs(linesPercent).toFixed(1)}% reduction)`);
  } else if (linesDiff > 0) {
    score--;
    analysis.push(`Version A has ${linesDiff} fewer lines`);
  }
  
  // More methods can mean better structure
  if (methodsDiff > 0) {
    score++;
    analysis.push(`Version B has ${methodsDiff} more methods (better modularity)`);
  } else if (methodsDiff < 0) {
    score--;
    analysis.push(`Version A has ${Math.abs(methodsDiff)} more methods`);
  }
  
  // Test pass rate
  if (versionB.metrics.testsPassed > versionA.metrics.testsPassed) {
    score += 2;
    analysis.push(`Version B passes more tests (${versionB.metrics.testsPassed} vs ${versionA.metrics.testsPassed})`);
  } else if (versionA.metrics.testsPassed > versionB.metrics.testsPassed) {
    score -= 2;
    analysis.push(`Version A passes more tests`);
  }
  
  const winner = score > 0 ? 'B' : score < 0 ? 'A' : 'tie';
  
  return {
    linesDiff,
    linesPercent,
    methodsDiff,
    winner,
    analysis
  };
}

/**
 * Extract metrics from Python code
 */
export function extractPythonMetrics(code: string): ABTestVersion['metrics'] {
  const lines = code.split('\n').length;
  const methods = (code.match(/def \w+\(/g) || []).length;
  const classes = (code.match(/class \w+/g) || []).length;
  
  return {
    lines,
    methods,
    classes,
    testsPassed: 0 // To be filled by test runner
  };
}

/**
 * Generate diff highlights between two code versions
 */
export function generateCodeDiff(codeA: string, codeB: string): {
  added: number[];
  removed: number[];
  modified: number[];
} {
  const linesA = codeA.split('\n');
  const linesB = codeB.split('\n');
  
  const added: number[] = [];
  const removed: number[] = [];
  const modified: number[] = [];
  
  // Simple line-by-line comparison
  const maxLines = Math.max(linesA.length, linesB.length);
  
  for (let i = 0; i < maxLines; i++) {
    const lineA = linesA[i] || '';
    const lineB = linesB[i] || '';
    
    if (!linesA[i] && linesB[i]) {
      added.push(i + 1);
    } else if (linesA[i] && !linesB[i]) {
      removed.push(i + 1);
    } else if (lineA.trim() !== lineB.trim()) {
      modified.push(i + 1);
    }
  }
  
  return { added, removed, modified };
}
