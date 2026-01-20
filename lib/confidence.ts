/**
 * Confidence Scoring System v1.0
 * 
 * Provides granular confidence scores for each translated line/method.
 * Helps developers know exactly WHERE to focus their review.
 */

export interface ConfidenceScore {
  score: number;          // 0-100
  level: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  reasons: string[];
  needsReview: boolean;
}

export interface LineConfidence {
  lineNumber: number;
  originalCobol: string;
  generatedPython: string;
  confidence: ConfidenceScore;
  patternId: string | null;
}

export interface MethodConfidence {
  methodName: string;
  lines: LineConfidence[];
  overallScore: number;
  overallLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  criticalLines: number[];  // Line numbers that need review
  reviewTimeEstimate: number;  // Minutes
}

export interface FileConfidence {
  fileName: string;
  methods: MethodConfidence[];
  overallScore: number;
  overallLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  summary: ConfidenceSummary;
}

export interface ConfidenceSummary {
  totalLines: number;
  highConfidenceLines: number;
  mediumConfidenceLines: number;
  lowConfidenceLines: number;
  criticalLines: number;
  patternMatchedLines: number;
  aiGeneratedLines: number;
  stubLines: number;
  estimatedReviewTime: number;  // Minutes
  productionReadiness: number;  // 0-100
}

// === CONFIDENCE CALCULATION RULES ===

const CONFIDENCE_FACTORS = {
  // Positive factors (increase confidence)
  PATTERN_MATCHED: 20,
  PATTERN_HIGH_CONFIDENCE: 15,
  SIMPLE_ASSIGNMENT: 10,
  STANDARD_CONTROL_FLOW: 8,
  WELL_KNOWN_FUNCTION: 5,
  
  // Negative factors (decrease confidence)
  AI_GENERATED: -15,
  COMPLEX_EXPRESSION: -10,
  NESTED_LOGIC: -8,
  UNKNOWN_COBOL_FUNCTION: -20,
  FALLBACK_USED: -30,
  NOT_IMPLEMENTED: -50,
  TODO_COMMENT: -25,
  COBOL_ARTIFACT: -15,
  
  // Base scores
  BASE_PATTERN: 85,
  BASE_AI: 50,
  BASE_STUB: 10
};

/**
 * Calculate confidence score for a single translated line.
 */
export function calculateLineConfidence(
  originalCobol: string,
  generatedPython: string,
  patternId: string | null,
  patternConfidence: number | null
): ConfidenceScore {
  let score = 50;  // Base score
  const reasons: string[] = [];
  
  const pythonLower = generatedPython.toLowerCase();
  const cobolUpper = originalCobol.toUpperCase();
  
  // === PATTERN-BASED SCORING ===
  if (patternId && patternConfidence) {
    score = patternConfidence;
    reasons.push(`Pattern matched: ${patternId} (${patternConfidence}%)`);
    
    if (patternConfidence >= 95) {
      score += CONFIDENCE_FACTORS.PATTERN_HIGH_CONFIDENCE;
      reasons.push('High-confidence pattern');
    }
  } else {
    // No pattern - AI generated
    score = CONFIDENCE_FACTORS.BASE_AI;
    reasons.push('AI-generated (no pattern match)');
  }
  
  // === POSITIVE INDICATORS ===
  
  // Simple assignment
  if (/^self\.\w+\s*=\s*self\.\w+$/.test(generatedPython.trim())) {
    score += CONFIDENCE_FACTORS.SIMPLE_ASSIGNMENT;
    reasons.push('Simple variable assignment');
  }
  
  // Standard control flow
  if (/^(if|elif|else:|for|while|return)\b/.test(generatedPython.trim())) {
    score += CONFIDENCE_FACTORS.STANDARD_CONTROL_FLOW;
    reasons.push('Standard control flow');
  }
  
  // Well-known functions
  if (/\b(len|str|int|float|round|abs|min|max|sum)\(/.test(pythonLower)) {
    score += CONFIDENCE_FACTORS.WELL_KNOWN_FUNCTION;
    reasons.push('Uses well-known Python functions');
  }
  
  // === NEGATIVE INDICATORS ===
  
  // NotImplementedError
  if (pythonLower.includes('notimplementederror')) {
    score += CONFIDENCE_FACTORS.NOT_IMPLEMENTED;
    reasons.push('Contains NotImplementedError stub');
  }
  
  // TODO comments
  if (pythonLower.includes('todo') || pythonLower.includes('# todo')) {
    score += CONFIDENCE_FACTORS.TODO_COMMENT;
    reasons.push('Contains TODO marker');
  }
  
  // FALLBACK marker
  if (pythonLower.includes('fallback')) {
    score += CONFIDENCE_FACTORS.FALLBACK_USED;
    reasons.push('Fallback logic used');
  }
  
  // Complex expressions (multiple operators)
  const operatorCount = (generatedPython.match(/[+\-*/%]/g) || []).length;
  if (operatorCount >= 3) {
    score += CONFIDENCE_FACTORS.COMPLEX_EXPRESSION;
    reasons.push('Complex arithmetic expression');
  }
  
  // Nested logic (multiple indentation levels in conditions)
  if (/if.*:.*if.*:/.test(pythonLower)) {
    score += CONFIDENCE_FACTORS.NESTED_LOGIC;
    reasons.push('Nested conditional logic');
  }
  
  // COBOL artifacts remaining
  if (/[A-Z]{2,}-[A-Z]{2,}/.test(generatedPython)) {
    score += CONFIDENCE_FACTORS.COBOL_ARTIFACT;
    reasons.push('COBOL naming convention detected');
  }
  
  // Unknown COBOL functions
  if (cobolUpper.includes('FUNCTION') && !patternId) {
    score += CONFIDENCE_FACTORS.UNKNOWN_COBOL_FUNCTION;
    reasons.push('Unknown COBOL intrinsic function');
  }
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));
  
  // Determine level
  let level: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  if (score >= 90) level = 'HIGH';
  else if (score >= 70) level = 'MEDIUM';
  else if (score >= 40) level = 'LOW';
  else level = 'CRITICAL';
  
  return {
    score,
    level,
    reasons,
    needsReview: score < 70
  };
}

/**
 * Calculate confidence for an entire method.
 */
export function calculateMethodConfidence(
  methodName: string,
  lines: LineConfidence[]
): MethodConfidence {
  if (lines.length === 0) {
    return {
      methodName,
      lines: [],
      overallScore: 0,
      overallLevel: 'CRITICAL',
      criticalLines: [],
      reviewTimeEstimate: 0
    };
  }
  
  // Calculate weighted average (critical lines weigh more)
  let totalWeight = 0;
  let weightedScore = 0;
  const criticalLines: number[] = [];
  
  for (const line of lines) {
    const weight = line.confidence.level === 'CRITICAL' ? 2 : 
                   line.confidence.level === 'LOW' ? 1.5 : 1;
    weightedScore += line.confidence.score * weight;
    totalWeight += weight;
    
    if (line.confidence.needsReview) {
      criticalLines.push(line.lineNumber);
    }
  }
  
  const overallScore = Math.round(weightedScore / totalWeight);
  
  // Determine level
  let overallLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  if (overallScore >= 85) overallLevel = 'HIGH';
  else if (overallScore >= 65) overallLevel = 'MEDIUM';
  else if (overallScore >= 40) overallLevel = 'LOW';
  else overallLevel = 'CRITICAL';
  
  // Estimate review time: 2 min per critical line, 1 min per low, 0.5 min per medium
  const reviewTime = lines.reduce((time, line) => {
    switch (line.confidence.level) {
      case 'CRITICAL': return time + 2;
      case 'LOW': return time + 1;
      case 'MEDIUM': return time + 0.5;
      default: return time;
    }
  }, 0);
  
  return {
    methodName,
    lines,
    overallScore,
    overallLevel,
    criticalLines,
    reviewTimeEstimate: Math.ceil(reviewTime)
  };
}

/**
 * Calculate confidence for an entire file.
 */
export function calculateFileConfidence(
  fileName: string,
  methods: MethodConfidence[]
): FileConfidence {
  if (methods.length === 0) {
    return {
      fileName,
      methods: [],
      overallScore: 0,
      overallLevel: 'CRITICAL',
      summary: {
        totalLines: 0,
        highConfidenceLines: 0,
        mediumConfidenceLines: 0,
        lowConfidenceLines: 0,
        criticalLines: 0,
        patternMatchedLines: 0,
        aiGeneratedLines: 0,
        stubLines: 0,
        estimatedReviewTime: 0,
        productionReadiness: 0
      }
    };
  }
  
  // Aggregate all lines
  const allLines = methods.flatMap(m => m.lines);
  
  const summary: ConfidenceSummary = {
    totalLines: allLines.length,
    highConfidenceLines: allLines.filter(l => l.confidence.level === 'HIGH').length,
    mediumConfidenceLines: allLines.filter(l => l.confidence.level === 'MEDIUM').length,
    lowConfidenceLines: allLines.filter(l => l.confidence.level === 'LOW').length,
    criticalLines: allLines.filter(l => l.confidence.level === 'CRITICAL').length,
    patternMatchedLines: allLines.filter(l => l.patternId !== null).length,
    aiGeneratedLines: allLines.filter(l => l.patternId === null && !l.generatedPython.includes('NotImplementedError')).length,
    stubLines: allLines.filter(l => l.generatedPython.includes('NotImplementedError')).length,
    estimatedReviewTime: methods.reduce((t, m) => t + m.reviewTimeEstimate, 0),
    productionReadiness: 0
  };
  
  // Calculate overall score
  const overallScore = methods.length > 0
    ? Math.round(methods.reduce((s, m) => s + m.overallScore, 0) / methods.length)
    : 0;
  
  // Production readiness = weighted by critical issues
  const criticalPenalty = (summary.criticalLines / Math.max(1, summary.totalLines)) * 50;
  const lowPenalty = (summary.lowConfidenceLines / Math.max(1, summary.totalLines)) * 20;
  summary.productionReadiness = Math.max(0, Math.round(overallScore - criticalPenalty - lowPenalty));
  
  // Determine level
  let overallLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  if (overallScore >= 85 && summary.criticalLines === 0) overallLevel = 'HIGH';
  else if (overallScore >= 65) overallLevel = 'MEDIUM';
  else if (overallScore >= 40) overallLevel = 'LOW';
  else overallLevel = 'CRITICAL';
  
  return {
    fileName,
    methods,
    overallScore,
    overallLevel,
    summary
  };
}

/**
 * Generate a confidence report in Markdown format.
 */
export function generateConfidenceReport(fileConfidence: FileConfidence): string {
  const { fileName, methods, overallScore, overallLevel, summary } = fileConfidence;
  
  const levelEmoji = {
    HIGH: '🟢',
    MEDIUM: '🟡',
    LOW: '🟠',
    CRITICAL: '🔴'
  };
  
  let report = `# Confidence Report: ${fileName}\n\n`;
  report += `## Overall Score: ${overallScore}/100 ${levelEmoji[overallLevel]}\n\n`;
  
  // Summary table
  report += `## Summary\n\n`;
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Total Lines | ${summary.totalLines} |\n`;
  report += `| High Confidence (≥90%) | ${summary.highConfidenceLines} (${Math.round(summary.highConfidenceLines/summary.totalLines*100)}%) |\n`;
  report += `| Medium Confidence (70-89%) | ${summary.mediumConfidenceLines} (${Math.round(summary.mediumConfidenceLines/summary.totalLines*100)}%) |\n`;
  report += `| Low Confidence (40-69%) | ${summary.lowConfidenceLines} (${Math.round(summary.lowConfidenceLines/summary.totalLines*100)}%) |\n`;
  report += `| Critical (< 40%) | ${summary.criticalLines} (${Math.round(summary.criticalLines/summary.totalLines*100)}%) |\n`;
  report += `| Pattern Matched | ${summary.patternMatchedLines} |\n`;
  report += `| AI Generated | ${summary.aiGeneratedLines} |\n`;
  report += `| Stubs (NotImplemented) | ${summary.stubLines} |\n`;
  report += `| **Estimated Review Time** | **${summary.estimatedReviewTime} minutes** |\n`;
  report += `| **Production Readiness** | **${summary.productionReadiness}%** |\n\n`;
  
  // Methods requiring review
  const methodsToReview = methods.filter(m => m.overallLevel !== 'HIGH').sort((a, b) => a.overallScore - b.overallScore);
  
  if (methodsToReview.length > 0) {
    report += `## Methods Requiring Review\n\n`;
    report += `| Method | Score | Level | Critical Lines | Est. Time |\n`;
    report += `|--------|-------|-------|----------------|----------|\n`;
    
    for (const method of methodsToReview) {
      report += `| \`${method.methodName}\` | ${method.overallScore} | ${levelEmoji[method.overallLevel]} ${method.overallLevel} | ${method.criticalLines.length} | ${method.reviewTimeEstimate}m |\n`;
    }
    report += '\n';
  }
  
  // Detailed breakdown for critical methods
  const criticalMethods = methods.filter(m => m.overallLevel === 'CRITICAL');
  if (criticalMethods.length > 0) {
    report += `## Critical Methods (Detailed)\n\n`;
    
    for (const method of criticalMethods.slice(0, 10)) {
      report += `### \`${method.methodName}\` - Score: ${method.overallScore}\n\n`;
      
      const criticalLines = method.lines.filter(l => l.confidence.level === 'CRITICAL');
      for (const line of criticalLines.slice(0, 5)) {
        report += `- **Line ${line.lineNumber}** (${line.confidence.score}%): ${line.confidence.reasons.join(', ')}\n`;
        report += `  - COBOL: \`${line.originalCobol.substring(0, 60)}...\`\n`;
        report += `  - Python: \`${line.generatedPython.substring(0, 60)}...\`\n`;
      }
      report += '\n';
    }
  }
  
  // Recommendations
  report += `## Recommendations\n\n`;
  
  if (summary.productionReadiness >= 80) {
    report += `✅ Code is **production-ready** with minor review needed.\n`;
    report += `- Focus review on ${summary.lowConfidenceLines + summary.criticalLines} lines marked for attention.\n`;
  } else if (summary.productionReadiness >= 50) {
    report += `⚠️ Code requires **significant review** before production.\n`;
    report += `- Review all ${methodsToReview.length} methods flagged for attention.\n`;
    report += `- Estimated total review time: ${summary.estimatedReviewTime} minutes.\n`;
  } else {
    report += `🔴 Code is **not production-ready**.\n`;
    report += `- ${summary.criticalLines} critical lines require manual implementation.\n`;
    report += `- Consider regenerating with more context or manual translation.\n`;
  }
  
  return report;
}

/**
 * Generate inline confidence annotations for Python code.
 */
export function annotateCodeWithConfidence(
  pythonCode: string,
  lineConfidences: Map<number, LineConfidence>
): string {
  const lines = pythonCode.split('\n');
  const annotated: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const confidence = lineConfidences.get(lineNum);
    
    if (confidence && confidence.confidence.needsReview) {
      // Add confidence annotation
      const emoji = {
        HIGH: '✓',
        MEDIUM: '⚡',
        LOW: '⚠️',
        CRITICAL: '🔴'
      }[confidence.confidence.level];
      
      const annotation = `  # ${emoji} [${confidence.confidence.score}%] ${confidence.confidence.reasons[0] || ''}`;
      annotated.push(lines[i] + annotation);
    } else {
      annotated.push(lines[i]);
    }
  }
  
  return annotated.join('\n');
}

// Export for use in route.ts
export const ConfidenceSystem = {
  calculateLineConfidence,
  calculateMethodConfidence,
  calculateFileConfidence,
  generateConfidenceReport,
  annotateCodeWithConfidence
};
