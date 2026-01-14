/**
 * Performance Metrics - v6.1.0
 * Métriques CPU/mémoire par paragraphe COBOL
 */

export interface ParagraphMetrics {
  name: string;
  cobolLines: number;
  pythonLines: number;
  complexity: number;
  estimatedCpuMs: number;
  estimatedMemoryKb: number;
  ioOperations: number;
  callDepth: number;
  riskFactors: string[];
}

export interface TranspilationMetrics {
  totalCobolLines: number;
  totalPythonLines: number;
  totalParagraphs: number;
  paragraphMetrics: ParagraphMetrics[];
  aggregates: {
    totalCpuMs: number;
    totalMemoryKb: number;
    totalIoOps: number;
    maxCallDepth: number;
    avgComplexity: number;
  };
  hotspots: ParagraphMetrics[];
  recommendations: string[];
}

// Complexity weights for COBOL constructs
const COMPLEXITY_WEIGHTS = {
  PERFORM: 1,
  PERFORM_VARYING: 3,
  PERFORM_UNTIL: 2,
  IF: 1,
  EVALUATE: 2,
  SEARCH: 3,
  SEARCH_ALL: 2,
  CALL: 4,
  STRING: 2,
  UNSTRING: 3,
  INSPECT: 2,
  COMPUTE: 1,
  ALTER: 5,
  GOTO: 2,
  SORT: 5,
  MERGE: 5,
};

// Memory estimates per construct (in KB)
const MEMORY_ESTIMATES = {
  PIC_X: 0.001, // per character
  PIC_9: 0.001, // per digit
  OCCURS: 0.1,  // per occurrence
  TABLE: 1.0,   // base table overhead
  COPY: 5.0,    // copybook inclusion
  FILE: 10.0,   // file buffer
};

/**
 * Extract paragraphs from COBOL code
 */
export function extractParagraphs(cobolCode: string): { name: string; content: string; startLine: number }[] {
  const lines = cobolCode.split('\n');
  const paragraphs: { name: string; content: string; startLine: number }[] = [];
  
  let currentParagraph: { name: string; lines: string[]; startLine: number } | null = null;
  let inProcedureDivision = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check for PROCEDURE DIVISION
    if (/PROCEDURE\s+DIVISION/i.test(trimmed)) {
      inProcedureDivision = true;
      continue;
    }
    
    if (!inProcedureDivision) continue;
    
    // Detect paragraph start (name followed by period, at column 8-11)
    const paragraphMatch = line.match(/^[\s]{0,7}([A-Z0-9][\w-]*)\s*\.\s*$/i);
    
    if (paragraphMatch && !trimmed.startsWith('*')) {
      // Save previous paragraph
      if (currentParagraph) {
        paragraphs.push({
          name: currentParagraph.name,
          content: currentParagraph.lines.join('\n'),
          startLine: currentParagraph.startLine
        });
      }
      
      currentParagraph = {
        name: paragraphMatch[1],
        lines: [],
        startLine: i + 1
      };
    } else if (currentParagraph) {
      currentParagraph.lines.push(line);
    }
  }
  
  // Save last paragraph
  if (currentParagraph) {
    paragraphs.push({
      name: currentParagraph.name,
      content: currentParagraph.lines.join('\n'),
      startLine: currentParagraph.startLine
    });
  }
  
  return paragraphs;
}

/**
 * Calculate complexity for a paragraph
 */
export function calculateComplexity(content: string): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};
  let score = 1; // Base complexity
  
  const patterns: [RegExp, keyof typeof COMPLEXITY_WEIGHTS][] = [
    [/PERFORM\s+[\w-]+\s+VARYING/gi, 'PERFORM_VARYING'],
    [/PERFORM\s+[\w-]+\s+UNTIL/gi, 'PERFORM_UNTIL'],
    [/PERFORM\s+[\w-]+/gi, 'PERFORM'],
    [/\bIF\b/gi, 'IF'],
    [/EVALUATE\b/gi, 'EVALUATE'],
    [/SEARCH\s+ALL\b/gi, 'SEARCH_ALL'],
    [/SEARCH\b/gi, 'SEARCH'],
    [/CALL\s+/gi, 'CALL'],
    [/STRING\b/gi, 'STRING'],
    [/UNSTRING\b/gi, 'UNSTRING'],
    [/INSPECT\b/gi, 'INSPECT'],
    [/COMPUTE\b/gi, 'COMPUTE'],
    [/ALTER\b/gi, 'ALTER'],
    [/GO\s+TO\b/gi, 'GOTO'],
    [/SORT\b/gi, 'SORT'],
    [/MERGE\b/gi, 'MERGE'],
  ];
  
  for (const [pattern, key] of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      const count = matches.length;
      breakdown[key] = count;
      score += count * COMPLEXITY_WEIGHTS[key];
    }
  }
  
  return { score, breakdown };
}

/**
 * Estimate memory usage for a paragraph
 */
export function estimateMemory(content: string): number {
  let memory = 0.5; // Base overhead in KB
  
  // Count PIC X declarations
  const picXMatches = content.match(/PIC\s+X+\((\d+)\)/gi) || [];
  for (const match of picXMatches) {
    const size = parseInt(match.match(/\((\d+)\)/)?.[1] || '1');
    memory += size * MEMORY_ESTIMATES.PIC_X;
  }
  
  // Count PIC 9 declarations
  const pic9Matches = content.match(/PIC\s+[S9]+\((\d+)\)/gi) || [];
  for (const match of pic9Matches) {
    const size = parseInt(match.match(/\((\d+)\)/)?.[1] || '1');
    memory += size * MEMORY_ESTIMATES.PIC_9;
  }
  
  // Count OCCURS clauses
  const occursMatches = content.match(/OCCURS\s+(\d+)/gi) || [];
  for (const match of occursMatches) {
    const count = parseInt(match.match(/(\d+)/)?.[1] || '1');
    memory += count * MEMORY_ESTIMATES.OCCURS;
  }
  
  // Count file operations
  const fileOps = (content.match(/\b(OPEN|READ|WRITE|CLOSE)\b/gi) || []).length;
  memory += fileOps * MEMORY_ESTIMATES.FILE;
  
  return Math.round(memory * 100) / 100;
}

/**
 * Estimate CPU time for a paragraph
 */
export function estimateCpuTime(content: string, complexity: number): number {
  const lines = content.split('\n').length;
  
  // Base: 0.01ms per line
  let cpuMs = lines * 0.01;
  
  // Add complexity factor
  cpuMs *= (1 + complexity * 0.1);
  
  // Add I/O overhead
  const ioOps = (content.match(/\b(READ|WRITE|REWRITE|DELETE|START)\b/gi) || []).length;
  cpuMs += ioOps * 5; // 5ms per I/O operation
  
  // Add CALL overhead
  const calls = (content.match(/CALL\s+/gi) || []).length;
  cpuMs += calls * 2; // 2ms per external call
  
  return Math.round(cpuMs * 100) / 100;
}

/**
 * Count I/O operations in a paragraph
 */
export function countIoOperations(content: string): number {
  return (content.match(/\b(READ|WRITE|REWRITE|DELETE|START|OPEN|CLOSE)\b/gi) || []).length;
}

/**
 * Detect risk factors in a paragraph
 */
export function detectRiskFactors(content: string): string[] {
  const risks: string[] = [];
  
  if (/ALTER\b/i.test(content)) {
    risks.push('ALTER statement - dynamic control flow');
  }
  
  if (/GO\s+TO\b/i.test(content)) {
    risks.push('GOTO statement - unstructured flow');
  }
  
  if (/DEPENDING\s+ON\b/i.test(content)) {
    risks.push('DEPENDING ON - variable array size');
  }
  
  if (/CORRESPONDING\b/i.test(content)) {
    risks.push('CORRESPONDING - implicit field matching');
  }
  
  if (/ENTRY\b/i.test(content)) {
    risks.push('ENTRY point - multiple entry points');
  }
  
  if ((content.match(/PERFORM/gi) || []).length > 10) {
    risks.push('High PERFORM count - potential performance issue');
  }
  
  return risks;
}

/**
 * Generate full transpilation metrics
 */
export function generateMetrics(cobolCode: string, pythonCode: string): TranspilationMetrics {
  const paragraphs = extractParagraphs(cobolCode);
  const cobolLines = cobolCode.split('\n').length;
  const pythonLines = pythonCode.split('\n').length;
  
  const paragraphMetrics: ParagraphMetrics[] = paragraphs.map(p => {
    const { score: complexity } = calculateComplexity(p.content);
    const pLines = p.content.split('\n').length;
    
    // Estimate Python lines for this paragraph (proportional)
    const pyLinesEstimate = Math.round((pLines / cobolLines) * pythonLines);
    
    return {
      name: p.name,
      cobolLines: pLines,
      pythonLines: pyLinesEstimate,
      complexity,
      estimatedCpuMs: estimateCpuTime(p.content, complexity),
      estimatedMemoryKb: estimateMemory(p.content),
      ioOperations: countIoOperations(p.content),
      callDepth: (p.content.match(/CALL\s+/gi) || []).length,
      riskFactors: detectRiskFactors(p.content)
    };
  });
  
  // Calculate aggregates
  const totalCpuMs = paragraphMetrics.reduce((sum, p) => sum + p.estimatedCpuMs, 0);
  const totalMemoryKb = paragraphMetrics.reduce((sum, p) => sum + p.estimatedMemoryKb, 0);
  const totalIoOps = paragraphMetrics.reduce((sum, p) => sum + p.ioOperations, 0);
  const maxCallDepth = Math.max(...paragraphMetrics.map(p => p.callDepth), 0);
  const avgComplexity = paragraphMetrics.length > 0
    ? paragraphMetrics.reduce((sum, p) => sum + p.complexity, 0) / paragraphMetrics.length
    : 0;
  
  // Identify hotspots (top 5 by CPU)
  const hotspots = [...paragraphMetrics]
    .sort((a, b) => b.estimatedCpuMs - a.estimatedCpuMs)
    .slice(0, 5);
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (maxCallDepth > 5) {
    recommendations.push('Consider flattening deep CALL chains for better maintainability');
  }
  
  if (avgComplexity > 10) {
    recommendations.push('High average complexity - consider refactoring complex paragraphs');
  }
  
  if (totalIoOps > 20) {
    recommendations.push('High I/O operations - consider batch processing or caching');
  }
  
  const riskyParagraphs = paragraphMetrics.filter(p => p.riskFactors.length > 0);
  if (riskyParagraphs.length > 0) {
    recommendations.push(`${riskyParagraphs.length} paragraphs have risk factors - review carefully`);
  }
  
  return {
    totalCobolLines: cobolLines,
    totalPythonLines: pythonLines,
    totalParagraphs: paragraphs.length,
    paragraphMetrics,
    aggregates: {
      totalCpuMs: Math.round(totalCpuMs * 100) / 100,
      totalMemoryKb: Math.round(totalMemoryKb * 100) / 100,
      totalIoOps,
      maxCallDepth,
      avgComplexity: Math.round(avgComplexity * 10) / 10
    },
    hotspots,
    recommendations
  };
}

/**
 * Format metrics as a readable report
 */
export function formatMetricsReport(metrics: TranspilationMetrics): string {
  let report = `
╔══════════════════════════════════════════════════════════════════╗
║              PERFORMANCE METRICS REPORT - CodeSwitch v6.1        ║
╚══════════════════════════════════════════════════════════════════╝

📊 OVERVIEW
───────────────────────────────────────────────────────────────────
  Total COBOL Lines:    ${metrics.totalCobolLines.toLocaleString()}
  Total Python Lines:   ${metrics.totalPythonLines.toLocaleString()}
  Total Paragraphs:     ${metrics.totalParagraphs}
  Expansion Ratio:      ${(metrics.totalPythonLines / metrics.totalCobolLines).toFixed(2)}x

⚡ PERFORMANCE ESTIMATES
───────────────────────────────────────────────────────────────────
  Estimated CPU Time:   ${metrics.aggregates.totalCpuMs.toFixed(2)} ms
  Estimated Memory:     ${metrics.aggregates.totalMemoryKb.toFixed(2)} KB
  Total I/O Operations: ${metrics.aggregates.totalIoOps}
  Max Call Depth:       ${metrics.aggregates.maxCallDepth}
  Avg Complexity:       ${metrics.aggregates.avgComplexity.toFixed(1)}

🔥 HOTSPOTS (Top 5 by CPU)
───────────────────────────────────────────────────────────────────
`;

  for (const hotspot of metrics.hotspots) {
    report += `  ${hotspot.name.padEnd(30)} ${hotspot.estimatedCpuMs.toFixed(2)} ms | ${hotspot.complexity} complexity\n`;
  }

  report += `
⚠️  RECOMMENDATIONS
───────────────────────────────────────────────────────────────────
`;

  for (const rec of metrics.recommendations) {
    report += `  • ${rec}\n`;
  }

  if (metrics.recommendations.length === 0) {
    report += `  ✓ No critical recommendations - code looks well-structured\n`;
  }

  return report;
}
