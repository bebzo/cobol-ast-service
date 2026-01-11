/**
 * COBOL → Python Transpileur v1.0
 * Architecture Triple-Pass : Fonctionnel + Élégant
 * 
 * PASS 1: AST Parser (100% déterministe)
 * PASS 2: Code Generator (règles 1:1)
 * PASS 3: Optimizer (pythonique)
 */

import { CobolFullAST, VariableNode, ParagraphNode } from './cobol-antlr-parser';

// ============================================================
// TYPES
// ============================================================

interface PythonAST {
  className: string;
  imports: string[];
  classVars: PythonVariable[];
  methods: PythonMethod[];
  dataclasses: PythonDataclass[];
  conditionProperties: Python88Condition[];
}

interface Python88Condition {
  name: string;
  parentVariable: string;
  values: string[];
  thru?: { from: string; to: string };
}

interface PythonVariable {
  name: string;
  type: 'str' | 'int' | 'Decimal' | 'bool' | 'datetime' | 'Dict' | 'List' | 'Any';
  default: string;
  fromCobol: string;
  docstring?: string;
}

interface PythonMethod {
  name: string;
  originalName: string;
  params: string[];
  returnType: string;
  body: PythonStatement[];
  docstring: string;
  complexity: number;
}

interface PythonStatement {
  type: 'assignment' | 'if' | 'elif' | 'else' | 'for' | 'while' | 'call' | 'return' | 'try' | 'comment';
  code: string;
  indent: number;
  originalCobol?: string;
  confidence: number;
}

interface PythonDataclass {
  name: string;
  fields: PythonVariable[];
}

// ============================================================
// CLEAN ARCHITECTURE TYPES
// ============================================================

interface DomainModule {
  name: string;
  displayName: string;
  methods: PythonMethod[];
  entities: PythonVariable[];
}

interface CleanArchitectureOutput {
  domains: Map<string, DomainModule>;
  sharedEntities: PythonVariable[];
  repositories: RepositoryDef[];
  services: ServiceDef[];
}

interface RepositoryDef {
  name: string;
  domain: string;
  methods: string[];
}

interface ServiceDef {
  name: string;
  domain: string;
  dependencies: string[];
  methods: PythonMethod[];
}

// Domain detection rules based on COBOL paragraph prefixes
const DOMAIN_RULES: { pattern: RegExp; domain: string; displayName: string }[] = [
  { pattern: /^[0-9]*-?(FRAUD|AML|COMPLIANCE)/i, domain: 'fraud_detection', displayName: 'FraudDetection' },
  { pattern: /^[0-9]*-?(LOAN|MORTGAGE|AMORT)/i, domain: 'loans', displayName: 'Loans' },
  { pattern: /^[0-9]*-?(INVEST|PORTFOLIO|TRADE|DIVIDEND)/i, domain: 'investments', displayName: 'Investments' },
  { pattern: /^[0-9]*-?(INSURANCE|POLICY|CLAIM|PREMIUM)/i, domain: 'insurance', displayName: 'Insurance' },
  { pattern: /^[0-9]*-?(DEPOSIT|WITHDRAW|TRANSFER|BALANCE|INTEREST)/i, domain: 'banking', displayName: 'Banking' },
  { pattern: /^[0-9]*-?(REPORT|SUMMARY|STATEMENT)/i, domain: 'reporting', displayName: 'Reporting' },
  { pattern: /^[0-9]*-?(CUSTOMER|CRM|SEGMENT)/i, domain: 'customer', displayName: 'Customer' },
  { pattern: /^[0-9]*-?(AUDIT|LOG|SECURITY)/i, domain: 'audit', displayName: 'Audit' },
  { pattern: /^[0-9]*-?(TREASURY|LIQUIDITY|CAPITAL)/i, domain: 'treasury', displayName: 'Treasury' },
  { pattern: /^[0-9]*-?(BATCH|EOD|EOM|EOY)/i, domain: 'batch_processing', displayName: 'BatchProcessing' },
  { pattern: /^[0-9]*-?(INIT|OPEN|CLOSE|TERM)/i, domain: 'lifecycle', displayName: 'Lifecycle' },
  { pattern: /^[0-9]*-?(UTIL|FORMAT|VALIDATE|CONVERT)/i, domain: 'utilities', displayName: 'Utilities' },
];

// Business-friendly method name mappings
const METHOD_NAME_MAPPINGS: { pattern: RegExp; replacement: string }[] = [
  { pattern: /^p_\d+_/, replacement: '' },  // Remove p_XXXX_ prefix
  { pattern: /calculate_interest/i, replacement: 'calculate_interest' },
  { pattern: /process_deposit/i, replacement: 'process_deposit' },
  { pattern: /process_withdrawal/i, replacement: 'process_withdrawal' },
  { pattern: /validate_account/i, replacement: 'validate_account' },
  { pattern: /check_fraud/i, replacement: 'check_fraud_indicators' },
  { pattern: /apply_fee/i, replacement: 'apply_fee' },
  { pattern: /generate_report/i, replacement: 'generate_report' },
];

// ============================================================
// PASS 1: COBOL AST → Python AST (Déterministe)
// ============================================================

export function transpileCobolToPythonAST(cobolAST: CobolFullAST, sourceLines: string[]): PythonAST {
  const className = toPascalCase(cobolAST.programId);
  
  // Separate 88-level conditions from regular variables
  const regularVars = cobolAST.workingStorageVariables.filter(v => v.level !== 88);
  const conditionVars = cobolAST.workingStorageVariables.filter(v => v.level === 88);
  
  // Transpile regular variables
  const classVars = transpileVariables(regularVars);
  
  // Transpile 88-level conditions to properties
  const conditionProperties: Python88Condition[] = conditionVars.map(v => ({
    name: toSnakeCase(v.name),
    parentVariable: v.parentVariable ? toSnakeCase(v.parentVariable) : 'unknown',
    values: v.conditionValues || [],
    thru: v.conditionThru
  }));
  
  // Transpile paragraphs to methods
  const methods = cobolAST.paragraphs.map(p => 
    transpileParagraph(p, sourceLines, cobolAST.paragraphs)
  );
  
  // Standard imports
  const imports = [
    'from decimal import Decimal, ROUND_HALF_UP',
    'from dataclasses import dataclass, field',
    'from typing import Optional, List, Dict, Any',
    'from datetime import datetime, date, timedelta',
    'import logging',
    'import json'
  ];
  
  return {
    className,
    imports,
    classVars,
    methods,
    dataclasses: [],
    conditionProperties
  };
}

// ============================================================
// Variable Transpilation
// ============================================================

function transpileVariables(vars: VariableNode[]): PythonVariable[] {
  return vars.map(v => {
    // Sanitize PIC for safe Python comment (remove/escape problematic chars)
    let safePic = v.picture || '';
    // Ensure balanced parentheses in comment
    const openParens = (safePic.match(/\(/g) || []).length;
    const closeParens = (safePic.match(/\)/g) || []).length;
    if (openParens > closeParens) {
      safePic += ')'.repeat(openParens - closeParens);
    }
    
    // Handle COMP-3 / PACKED-DECIMAL
    const usage = (v as any).usage || '';
    const isPackedDecimal = /COMP-3|PACKED-DECIMAL|COMPUTATIONAL-3/i.test(usage);
    const isBinary = /COMP|BINARY|COMPUTATIONAL$/i.test(usage);
    
    // Handle REDEFINES
    const redefines = (v as any).redefines;
    const redefinesNote = redefines ? ` (REDEFINES ${redefines})` : '';
    
    // Handle OCCURS (arrays) and OCCURS DEPENDING ON (variable-length arrays)
    const occurs = (v as any).occurs;
    const occursDependingOn = (v as any).occursDependingOn;
    const isArray = occurs && occurs > 1;
    const isVariableArray = !!occursDependingOn;
    
    // Build docstring with full context
    let docstring = v.picture ? `PIC ${safePic}` : `from ${v.name}`;
    if (isPackedDecimal) docstring += ' [PACKED-DECIMAL]';
    if (isBinary) docstring += ' [BINARY]';
    if (redefines) docstring += redefinesNote;
    if (isVariableArray) {
      docstring += ` [OCCURS DEPENDING ON ${occursDependingOn}]`;
    } else if (isArray) {
      docstring += ` [OCCURS ${occurs}]`;
    }
    
    // Determine type (List if OCCURS)
    const baseType = pictureToType(v.picture, usage);
    const finalType = isArray ? 'List' : baseType;
    
    // Default value (array if OCCURS)
    const baseDefault = getDefaultValue(v.picture, v.value, usage);
    const finalDefault = isArray ? `[${baseDefault} for _ in range(${occurs})]` : baseDefault;
    
    return {
      name: toSnakeCase(v.name),
      type: finalType,
      default: finalDefault,
      fromCobol: v.name,
      docstring
    };
  });
}

function pictureToType(pic?: string, usage?: string): PythonVariable['type'] {
  if (!pic) return 'Any';
  const upper = pic.toUpperCase();
  
  // COMP-3/PACKED-DECIMAL always maps to Decimal for precision
  if (usage && /COMP-3|PACKED-DECIMAL|COMPUTATIONAL-3/i.test(usage)) {
    return 'Decimal';
  }
  
  // COMP/BINARY maps to int for performance (unless has decimal places)
  if (usage && /COMP|BINARY|COMPUTATIONAL$/i.test(usage)) {
    return upper.includes('V') ? 'Decimal' : 'int';
  }
  
  if (upper.match(/^S?9/)) return 'Decimal';
  if (upper.match(/^X/)) return 'str';
  if (upper.match(/^A/)) return 'str';
  if (upper === '1' || upper.match(/^88$/)) return 'bool';
  return 'str';
}

function getDefaultValue(pic?: string, value?: string, usage?: string): string {
  if (value !== undefined) {
    const clean = value.replace(/['"]/g, '').trim();
    const upperClean = clean.toUpperCase();
    
    // Handle COBOL special values FIRST
    if (upperClean === 'SPACES' || upperClean === 'SPACE') return '""';
    if (upperClean === 'ZEROS' || upperClean === 'ZEROES' || upperClean === 'ZERO') return 'Decimal("0")';
    if (upperClean === 'LOW-VALUES' || upperClean === 'LOW-VALUE') return '""';
    if (upperClean === 'HIGH-VALUES' || upperClean === 'HIGH-VALUE') return '"\\xff"';
    if (upperClean === 'QUOTES' || upperClean === 'QUOTE') return '"\\""';
    
    // Then handle by type
    if (pictureToType(pic) === 'Decimal') {
      return `Decimal("${clean}")`;
    }
    return `"${clean}"`;
  }
  
  const type = pictureToType(pic);
  switch (type) {
    case 'Decimal': return 'Decimal("0")';
    case 'int': return '0';
    case 'bool': return 'False';
    case 'datetime': return 'None';
    case 'Dict': return '{}';
    case 'List': return '[]';
    default: return '""';
  }
}

// ============================================================
// Paragraph Transpilation
// ============================================================

function transpileParagraph(
  para: ParagraphNode,
  sourceLines: string[],
  allParagraphs: ParagraphNode[]
): PythonMethod {
  const methodName = toSnakeCase(para.name);
  const rawLines = sourceLines.slice(para.lineStart - 1, para.lineEnd);
  
  // Pre-process: Join continuation lines (lines that continue a previous statement)
  // COBOL continuation: line that doesn't start with a keyword and continues previous line
  const cobolKeywords = ['IF', 'ELSE', 'END-IF', 'END-PERFORM', 'END-EVALUATE', 'END-READ', 
    'PERFORM', 'MOVE', 'ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE', 'COMPUTE', 'SET', 'DISPLAY', 
    'OPEN', 'CLOSE', 'READ', 'WRITE', 'CALL', 'EVALUATE', 'WHEN', 'INITIALIZE', 'STOP', 
    'GOBACK', 'CONTINUE', 'NOT', 'AT', 'EXIT'];
  
  const cobolLines: string[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim().toUpperCase();
    
    // Skip empty, comments, paragraph headers
    if (!trimmed || (line.length > 6 && line[6] === '*') || trimmed.match(/^[A-Z0-9][-A-Z0-9]*\.$/)) {
      continue;
    }
    
    // Check if this line starts with a COBOL keyword or is a continuation
    const startsWithKeyword = cobolKeywords.some(kw => trimmed.startsWith(kw + ' ') || trimmed === kw || trimmed.startsWith(kw + '.'));
    const isEndStatement = trimmed.startsWith('END-');
    const isFunctionContinuation = trimmed.startsWith('FUNCTION ') || trimmed.startsWith('(FUNCTION ');
    const isExpressionContinuation = /^[\(\+\-\*\/]/.test(trimmed);  // Starts with operator or paren
    
    if ((!startsWithKeyword && !isEndStatement && cobolLines.length > 0) || 
        isFunctionContinuation || isExpressionContinuation) {
      // This is a continuation line - append to previous
      const prevLine = cobolLines[cobolLines.length - 1];
      // Remove trailing period from previous line if present, then join
      const cleanPrev = prevLine.replace(/\.\s*$/, '');
      cobolLines[cobolLines.length - 1] = cleanPrev + ' ' + line.trim();
    } else {
      cobolLines.push(line);
    }
  }
  
  const body: PythonStatement[] = [];
  const indentStack: number[] = [0];  // Stack to track nesting levels
  let currentIndent = 0;
  let inEvaluate = false;  // Track if we're inside an EVALUATE block
  let firstWhenSeen = false;  // Track if we've seen the first WHEN
  
  for (let i = 0; i < cobolLines.length; i++) {
    const line = cobolLines[i];
    const trimmed = line.trim().toUpperCase();
    const originalTrimmed = line.trim();
    
    // Skip empty lines (already pre-filtered but safety check)
    if (!trimmed) {
      continue;
    }
    
    // Track EVALUATE blocks
    if (trimmed.startsWith('EVALUATE ')) {
      inEvaluate = true;
      firstWhenSeen = false;
    }
    if (trimmed.startsWith('END-EVALUATE')) {
      inEvaluate = false;
      firstWhenSeen = false;
    }
    
    // Handle END-* statements FIRST (reduce indent before processing)
    if (trimmed.startsWith('END-IF') || trimmed === 'END-IF.' || trimmed === 'END-IF') {
      currentIndent = Math.max(0, indentStack.pop() || 0);
      continue;  // Don't generate code for END-IF itself
    }
    if (trimmed.startsWith('END-PERFORM') || trimmed.startsWith('END-EVALUATE')) {
      currentIndent = Math.max(0, indentStack.pop() || 0);
      continue;
    }
    
    // Handle ELSE (same level as IF, then increase)
    if (trimmed === 'ELSE' || trimmed === 'ELSE.') {
      const ifIndent = indentStack.length > 0 ? indentStack[indentStack.length - 1] : 0;
      body.push({
        type: 'else',
        code: 'else:',
        indent: ifIndent,
        originalCobol: originalTrimmed,
        confidence: 100
      });
      currentIndent = ifIndent + 1;
      continue;
    }
    
    // Process COBOL statement
    const statements = transpileStatement(trimmed, originalTrimmed, currentIndent);
    
    // Handle indentation changes
    for (const stmt of statements) {
      // Handle EVALUATE/WHEN: convert first WHEN to 'if', others to 'elif'
      if (inEvaluate && stmt.type === 'elif') {
        if (!firstWhenSeen) {
          // Convert first WHEN's elif to if
          firstWhenSeen = true;
          const ifCode = stmt.code.replace(/^elif /, 'if ');
          body.push({ ...stmt, type: 'if', code: ifCode, indent: currentIndent });
          indentStack.push(currentIndent);
          currentIndent++;
        } else {
          // Subsequent WHEN - use elif
          const prevIndent = indentStack.length > 0 ? indentStack[indentStack.length - 1] : 0;
          body.push({ ...stmt, indent: prevIndent });
          currentIndent = prevIndent + 1;
        }
      } else if (inEvaluate && stmt.type === 'else') {
        // WHEN OTHER
        const prevIndent = indentStack.length > 0 ? indentStack[indentStack.length - 1] : 0;
        body.push({ ...stmt, indent: prevIndent });
        currentIndent = prevIndent + 1;
      } else if (stmt.type === 'if' || stmt.type === 'for' || stmt.type === 'while') {
        body.push({ ...stmt, indent: currentIndent });
        indentStack.push(currentIndent);  // Save current level
        currentIndent++;  // Increase for body
      } else if (stmt.type === 'elif') {
        const prevIndent = indentStack.length > 0 ? indentStack[indentStack.length - 1] : 0;
        body.push({ ...stmt, indent: prevIndent });
        currentIndent = prevIndent + 1;
      } else {
        body.push({ ...stmt, indent: currentIndent });
      }
    }
  }
  
  // Ensure method has at least one statement
  if (body.length === 0) {
    body.push({
      type: 'call',
      code: 'self.logger.debug(f"Executing {self.__class__.__name__}.p_' + methodName + '")',
      indent: 0,
      confidence: 100
    });
  }
  
  return {
    name: `p_${methodName}`,
    originalName: para.name,
    params: [],
    returnType: 'None',
    body,
    docstring: `Translated from COBOL paragraph: ${para.name}`,
    complexity: para.complexity
  };
}

// ============================================================
// Statement Transpilation (Le cœur du transpileur)
// ============================================================

function transpileStatement(upper: string, original: string, indent: number): PythonStatement[] {
  const results: PythonStatement[] = [];
  
  // ===== MOVE statements =====
  if (upper.startsWith('MOVE ')) {
    const stmt = transpileMove(upper, original);
    if (stmt) results.push({ ...stmt, indent });
    return results;
  }
  
  // ===== ADD statements =====
  if (upper.startsWith('ADD ')) {
    const stmt = transpileAdd(upper, original);
    if (stmt) results.push({ ...stmt, indent });
    return results;
  }
  
  // ===== SUBTRACT statements =====
  if (upper.startsWith('SUBTRACT ')) {
    const stmt = transpileSubtract(upper, original);
    if (stmt) results.push({ ...stmt, indent });
    return results;
  }
  
  // ===== MULTIPLY statements =====
  if (upper.startsWith('MULTIPLY ')) {
    const stmt = transpileMultiply(upper, original);
    if (stmt) results.push({ ...stmt, indent });
    return results;
  }
  
  // ===== DIVIDE statements =====
  if (upper.startsWith('DIVIDE ')) {
    const stmt = transpileDivide(upper, original);
    if (stmt) results.push({ ...stmt, indent });
    return results;
  }
  
  // ===== COMPUTE statements =====
  if (upper.startsWith('COMPUTE ')) {
    const stmt = transpileCompute(upper, original);
    if (stmt) results.push({ ...stmt, indent });
    return results;
  }
  
  // ===== IF statements =====
  if (upper.startsWith('IF ')) {
    const stmt = transpileIf(upper, original);
    if (stmt) results.push({ ...stmt, indent });
    return results;
  }
  
  // ===== ELSE ===== (handled in transpileParagraph for proper indentation)
  if (upper === 'ELSE' || upper === 'ELSE.' || upper.startsWith('ELSE ')) {
    // ELSE is now handled directly in transpileParagraph
    return results;
  }
  
  // ===== PERFORM statements =====
  if (upper.startsWith('PERFORM ')) {
    const stmt = transpilePerform(upper, original);
    if (stmt) results.push({ ...stmt, indent });
    return results;
  }
  
  // ===== DISPLAY statements =====
  if (upper.startsWith('DISPLAY ')) {
    const stmt = transpileDisplay(upper, original);
    if (stmt) results.push({ ...stmt, indent });
    return results;
  }
  
  // ===== INITIALIZE statements =====
  if (upper.startsWith('INITIALIZE ')) {
    const match = upper.match(/INITIALIZE\s+([A-Z0-9][-A-Z0-9]*)/i);
    if (match) {
      results.push({
        type: 'assignment',
        code: `self.${toSnakeCase(match[1])} = None`,
        indent,
        originalCobol: original,
        confidence: 95
      });
    }
    return results;
  }
  
  // ===== SET TRUE/FALSE =====
  if (upper.startsWith('SET ')) {
    const trueMatch = upper.match(/SET\s+([A-Z0-9][-A-Z0-9]*)\s+TO\s+TRUE/i);
    if (trueMatch) {
      results.push({
        type: 'assignment',
        code: `self.${toSnakeCase(trueMatch[1])} = True`,
        indent,
        originalCobol: original,
        confidence: 100
      });
      return results;
    }
    const falseMatch = upper.match(/SET\s+([A-Z0-9][-A-Z0-9]*)\s+TO\s+FALSE/i);
    if (falseMatch) {
      results.push({
        type: 'assignment',
        code: `self.${toSnakeCase(falseMatch[1])} = False`,
        indent,
        originalCobol: original,
        confidence: 100
      });
      return results;
    }
  }
  
  // ===== OPEN/CLOSE/READ/WRITE =====
  if (upper.startsWith('OPEN ')) {
    const stmt = transpileOpen(upper, original);
    if (stmt) results.push({ ...stmt, indent });
    return results;
  }
  
  if (upper.startsWith('CLOSE ')) {
    const match = upper.match(/CLOSE\s+([A-Z0-9][-A-Z0-9]*)/i);
    if (match) {
      const file = toSnakeCase(match[1]);
      results.push({
        type: 'call',
        code: `if hasattr(self, '_file_${file}') and self._file_${file}: self._file_${file}.close()`,
        indent,
        originalCobol: original,
        confidence: 90
      });
    }
    return results;
  }
  
  if (upper.startsWith('READ ')) {
    const stmt = transpileRead(upper, original);
    if (stmt) results.push({ ...stmt, indent });
    return results;
  }
  
  if (upper.startsWith('WRITE ')) {
    const stmt = transpileWrite(upper, original);
    if (stmt) results.push({ ...stmt, indent });
    return results;
  }
  
  // ===== CALL statements =====
  if (upper.startsWith('CALL ')) {
    const stmt = transpileCall(upper, original);
    if (stmt) results.push({ ...stmt, indent });
    return results;
  }
  
  // ===== STOP RUN / GOBACK =====
  if (upper.includes('STOP RUN') || upper === 'GOBACK' || upper === 'GOBACK.') {
    results.push({
      type: 'return',
      code: 'return',
      indent,
      originalCobol: original,
      confidence: 100
    });
    return results;
  }
  
  // ===== END-* (ignorés, gérés par indentation) =====
  if (upper.startsWith('END-')) {
    return results;
  }
  
  // ===== EVALUATE (match/case) =====
  if (upper.startsWith('EVALUATE ')) {
    const stmt = transpileEvaluate(upper, original);
    if (stmt) results.push({ ...stmt, indent });
    return results;
  }
  
  // ===== WHEN (pour EVALUATE) =====
  if (upper.startsWith('WHEN ')) {
    const stmt = transpileWhen(upper, original);
    if (stmt) results.push({ ...stmt, indent });
    return results;
  }
  
  // ===== EXIT PERFORM =====
  if (upper.includes('EXIT PERFORM')) {
    results.push({
      type: 'call',
      code: 'break  # EXIT PERFORM',
      indent,
      originalCobol: original,
      confidence: 90
    });
    return results;
  }
  
  // ===== CONTINUE =====
  if (upper === 'CONTINUE' || upper === 'CONTINUE.') {
    results.push({
      type: 'call',
      code: 'pass  # CONTINUE',
      indent,
      originalCobol: original,
      confidence: 100
    });
    return results;
  }
  
  // ===== Fallback: commentaire =====
  if (!upper.startsWith('.') && upper.length > 1) {
    results.push({
      type: 'comment',
      code: `# COBOL: ${original.substring(0, 60)}`,
      indent,
      originalCobol: original,
      confidence: 0
    });
  }
  
  return results;
}

// ============================================================
// Statement-specific transpilers
// ============================================================

function transpileMove(upper: string, original: string): PythonStatement | null {
  // MOVE ZEROS/SPACES TO var
  let match = upper.match(/MOVE\s+ZEROS?\s+TO\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    return {
      type: 'assignment',
      code: `self.${toSnakeCase(match[1])} = Decimal("0")`,
      originalCobol: original,
      confidence: 100,
      indent: 0
    };
  }
  
  match = upper.match(/MOVE\s+SPACES?\s+TO\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    return {
      type: 'assignment',
      code: `self.${toSnakeCase(match[1])} = ""`,
      originalCobol: original,
      confidence: 100,
      indent: 0
    };
  }
  
  // MOVE "literal" TO var - PRESERVE original case
  match = upper.match(/MOVE\s+["']([^"']+)["']\s+TO\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    // Extract original literal from the original line to preserve case
    const literalMatch = original.match(/MOVE\s+["']([^"']+)["']/i);
    const literal = literalMatch ? literalMatch[1] : match[1];
    return {
      type: 'assignment',
      code: `self.${toSnakeCase(match[2])} = "${literal}"`,
      originalCobol: original,
      confidence: 100,
      indent: 0
    };
  }
  
  // MOVE number TO var
  match = upper.match(/MOVE\s+(\d+(?:\.\d+)?)\s+TO\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    return {
      type: 'assignment',
      code: `self.${toSnakeCase(match[2])} = Decimal("${match[1]}")`,
      originalCobol: original,
      confidence: 100,
      indent: 0
    };
  }
  
  // MOVE FUNCTION CURRENT-DATE TO var
  match = upper.match(/MOVE\s+FUNCTION\s+CURRENT-DATE\s+TO\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    return {
      type: 'assignment',
      code: `self.${toSnakeCase(match[1])} = datetime.now()`,
      originalCobol: original,
      confidence: 95,
      indent: 0
    };
  }
  
  // MOVE FUNCTION xxx(...) TO var - generic COBOL functions
  match = upper.match(/MOVE\s+FUNCTION\s+([A-Z][-A-Z0-9]*)\s*\(([^)]+)\)\s+TO\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    const funcName = toSnakeCase(match[1]);
    const args = match[2].split(',').map(a => `self.${toSnakeCase(a.trim())}`).join(', ');
    // Map common COBOL functions to Python equivalents
    let pythonFunc: string;
    switch (funcName) {
      case 'integer_of_date': pythonFunc = `int(${args}.strftime('%Y%m%d'))`; break;
      case 'date_of_integer': pythonFunc = `datetime.strptime(str(${args}), '%Y%m%d')`; break;
      case 'length': pythonFunc = `len(${args})`; break;
      case 'upper_case': pythonFunc = `str(${args}).upper()`; break;
      case 'lower_case': pythonFunc = `str(${args}).lower()`; break;
      case 'reverse': pythonFunc = `str(${args})[::-1]`; break;
      case 'trim': pythonFunc = `str(${args}).strip()`; break;
      case 'numval': pythonFunc = `Decimal(str(${args}).strip())`; break;
      case 'numval_c': pythonFunc = `Decimal(str(${args}).strip().replace(',', ''))`; break;
      case 'abs': pythonFunc = `abs(${args})`; break;
      case 'mod': pythonFunc = `${args.split(',')[0]} % ${args.split(',')[1] || '1'}`; break;
      default: pythonFunc = `self._cobol_function("${funcName}", ${args})`; break;
    }
    return {
      type: 'assignment',
      code: `self.${toSnakeCase(match[3])} = ${pythonFunc}`,
      originalCobol: original,
      confidence: 80,
      indent: 0
    };
  }
  
  // MOVE FUNCTION xxx TO var (no args)
  match = upper.match(/MOVE\s+FUNCTION\s+([A-Z][-A-Z0-9]*)\s+TO\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    const funcName = toSnakeCase(match[1]);
    let pythonFunc: string;
    switch (funcName) {
      case 'current_date': pythonFunc = 'datetime.now()'; break;
      case 'when_compiled': pythonFunc = 'datetime.now()'; break;
      default: pythonFunc = `self._cobol_function("${funcName}")`; break;
    }
    return {
      type: 'assignment',
      code: `self.${toSnakeCase(match[2])} = ${pythonFunc}`,
      originalCobol: original,
      confidence: 80,
      indent: 0
    };
  }
  
  // MOVE var TO var
  match = upper.match(/MOVE\s+([A-Z0-9][-A-Z0-9]*)\s+TO\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    return {
      type: 'assignment',
      code: `self.${toSnakeCase(match[2])} = self.${toSnakeCase(match[1])}`,
      originalCobol: original,
      confidence: 100,
      indent: 0
    };
  }
  
  return null;
}

function transpileAdd(upper: string, original: string): PythonStatement | null {
  // ADD num TO var
  let match = upper.match(/ADD\s+(\d+(?:\.\d+)?)\s+TO\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    return {
      type: 'assignment',
      code: `self.${toSnakeCase(match[2])} += Decimal("${match[1]}")`,
      originalCobol: original,
      confidence: 100,
      indent: 0
    };
  }
  
  // ADD var TO var
  match = upper.match(/ADD\s+([A-Z0-9][-A-Z0-9]*)\s+TO\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    return {
      type: 'assignment',
      code: `self.${toSnakeCase(match[2])} += self.${toSnakeCase(match[1])}`,
      originalCobol: original,
      confidence: 100,
      indent: 0
    };
  }
  
  // ADD var1 var2 GIVING var3
  match = upper.match(/ADD\s+([A-Z0-9][-A-Z0-9]*)\s+([A-Z0-9][-A-Z0-9]*)\s+GIVING\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    return {
      type: 'assignment',
      code: `self.${toSnakeCase(match[3])} = self.${toSnakeCase(match[1])} + self.${toSnakeCase(match[2])}`,
      originalCobol: original,
      confidence: 100,
      indent: 0
    };
  }
  
  return null;
}

function transpileSubtract(upper: string, original: string): PythonStatement | null {
  // SUBTRACT num FROM var
  let match = upper.match(/SUBTRACT\s+(\d+(?:\.\d+)?)\s+FROM\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    return {
      type: 'assignment',
      code: `self.${toSnakeCase(match[2])} -= Decimal("${match[1]}")`,
      originalCobol: original,
      confidence: 100,
      indent: 0
    };
  }
  
  // SUBTRACT var FROM var
  match = upper.match(/SUBTRACT\s+([A-Z0-9][-A-Z0-9]*)\s+FROM\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    return {
      type: 'assignment',
      code: `self.${toSnakeCase(match[2])} -= self.${toSnakeCase(match[1])}`,
      originalCobol: original,
      confidence: 100,
      indent: 0
    };
  }
  
  // SUBTRACT var1 FROM var2 GIVING var3
  match = upper.match(/SUBTRACT\s+([A-Z0-9][-A-Z0-9]*)\s+FROM\s+([A-Z0-9][-A-Z0-9]*)\s+GIVING\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    return {
      type: 'assignment',
      code: `self.${toSnakeCase(match[3])} = self.${toSnakeCase(match[2])} - self.${toSnakeCase(match[1])}`,
      originalCobol: original,
      confidence: 100,
      indent: 0
    };
  }
  
  return null;
}

function transpileMultiply(upper: string, original: string): PythonStatement | null {
  // MULTIPLY var BY var GIVING result
  let match = upper.match(/MULTIPLY\s+([A-Z0-9][-A-Z0-9]*)\s+BY\s+([A-Z0-9][-A-Z0-9]*)\s+GIVING\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    return {
      type: 'assignment',
      code: `self.${toSnakeCase(match[3])} = self.${toSnakeCase(match[1])} * self.${toSnakeCase(match[2])}`,
      originalCobol: original,
      confidence: 100,
      indent: 0
    };
  }
  
  // MULTIPLY var BY var (in place)
  match = upper.match(/MULTIPLY\s+([A-Z0-9][-A-Z0-9]*)\s+BY\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    return {
      type: 'assignment',
      code: `self.${toSnakeCase(match[2])} *= self.${toSnakeCase(match[1])}`,
      originalCobol: original,
      confidence: 100,
      indent: 0
    };
  }
  
  return null;
}

function transpileDivide(upper: string, original: string): PythonStatement | null {
  // DIVIDE var BY var GIVING result
  let match = upper.match(/DIVIDE\s+([A-Z0-9][-A-Z0-9]*)\s+BY\s+([A-Z0-9][-A-Z0-9]*)\s+GIVING\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    const divisor = toSnakeCase(match[2]);
    return {
      type: 'assignment',
      code: `self.${toSnakeCase(match[3])} = self.${toSnakeCase(match[1])} / self.${divisor} if self.${divisor} != 0 else Decimal("0")`,
      originalCobol: original,
      confidence: 95,
      indent: 0
    };
  }
  
  // DIVIDE var INTO var
  match = upper.match(/DIVIDE\s+([A-Z0-9][-A-Z0-9]*)\s+INTO\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    const divisor = toSnakeCase(match[1]);
    return {
      type: 'assignment',
      code: `self.${toSnakeCase(match[2])} = self.${toSnakeCase(match[2])} / self.${divisor} if self.${divisor} != 0 else Decimal("0")`,
      originalCobol: original,
      confidence: 95,
      indent: 0
    };
  }
  
  return null;
}

function transpileCompute(upper: string, original: string): PythonStatement | null {
  // COMPUTE var = expression
  const match = upper.match(/COMPUTE\s+([A-Z0-9][-A-Z0-9]*)\s*(?:ROUNDED)?\s*=\s*(.+)/i);
  if (match) {
    const target = toSnakeCase(match[1]);
    let expr = match[2].trim();
    
    // Remove trailing period
    expr = expr.replace(/\s*\.\s*$/, '');
    
    // Detect complex nested FUNCTION expressions and handle as fallback
    const functionCount = (expr.match(/FUNCTION/gi) || []).length;
    if (functionCount >= 2) {
      // Complex nested functions - generate safe fallback
      return {
        type: 'assignment',
        code: `self.${target} = 0  # TODO: Complex COBOL expression: ${original.substring(0, 60)}...`,
        originalCobol: original,
        confidence: 30,
        indent: 0
      };
    }
    
    // Step 1: Replace FUNCTION calls with placeholder markers
    // FUNCTION xxx(args) → @@FUNC_n@@
    const funcReplacements: string[] = [];
    
    expr = expr.replace(/FUNCTION\s+([A-Z][-A-Z0-9]*)\s*\(([^)]+)\)/gi, (_, funcName, args) => {
      const fn = funcName.toUpperCase().replace(/-/g, '_');
      // Process args - convert COBOL var names to Python
      const pyArgs = args.split(',').map((a: string) => {
        const trimArg = a.trim();
        if (/^\d+$/.test(trimArg)) return trimArg;
        return `self.${toSnakeCase(trimArg)}`;
      }).join(', ');
      
      let pythonExpr: string;
      switch (fn) {
        case 'INTEGER_OF_DATE': pythonExpr = `int(str(${pyArgs}).replace('-','')[:8])`; break;
        case 'DATE_OF_INTEGER': pythonExpr = `datetime.strptime(str(${pyArgs}), '%Y%m%d')`; break;
        case 'LENGTH': pythonExpr = `len(str(${pyArgs}))`; break;
        case 'UPPER_CASE': pythonExpr = `str(${pyArgs}).upper()`; break;
        case 'LOWER_CASE': pythonExpr = `str(${pyArgs}).lower()`; break;
        case 'REVERSE': pythonExpr = `str(${pyArgs})[::-1]`; break;
        case 'TRIM': pythonExpr = `str(${pyArgs}).strip()`; break;
        case 'NUMVAL': pythonExpr = `Decimal(str(${pyArgs}).strip())`; break;
        case 'ABS': pythonExpr = `abs(${pyArgs})`; break;
        case 'ORD': pythonExpr = `ord(str(${pyArgs})[0])`; break;
        case 'MOD': {
          const argList = pyArgs.split(',').map((s: string) => s.trim());
          pythonExpr = `(${argList[0]} % ${argList[1] || '1'})`;
          break;
        }
        default: pythonExpr = `self._cobol_function("${toSnakeCase(funcName)}", ${pyArgs})`; break;
      }
      
      const idx = funcReplacements.length;
      funcReplacements.push(pythonExpr);
      return `@@FUNC_${idx}@@`;
    });
    
    // Step 2: Convert COBOL operators
    expr = expr.replace(/\*\*/g, ' ** ');
    expr = expr.replace(/\s+/g, ' ');
    
    // Step 3: Replace remaining variable names with self.xxx
    // Use word boundary to avoid matching inside placeholders
    expr = expr.replace(/\b([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)\b/gi, (m) => {
      if (/^\d+$/.test(m)) return m;
      if (['AND', 'OR', 'NOT', 'ROUNDED', 'FUNCTION', 'FUNC'].includes(m.toUpperCase())) return '';
      // Skip if this looks like part of a placeholder
      if (m.startsWith('FUNC_')) return m;
      return `self.${toSnakeCase(m)}`;
    });
    
    // Step 4: Restore function placeholders
    for (let i = 0; i < funcReplacements.length; i++) {
      expr = expr.replace(`@@FUNC_${i}@@`, funcReplacements[i]);
    }
    
    // Clean up
    expr = expr.replace(/self\.self\./g, 'self.');
    expr = expr.replace(/\s+/g, ' ').trim();
    
    const hasRounded = upper.includes('ROUNDED');
    const code = hasRounded 
      ? `self.${target} = round(${expr}, 2)`
      : `self.${target} = ${expr}`;
    
    return {
      type: 'assignment',
      code,
      originalCobol: original,
      confidence: 90,
      indent: 0
    };
  }
  
  return null;
}

function transpileIf(upper: string, original: string): PythonStatement | null {
  let condition = upper.substring(3).trim();
  
  // Remove trailing THEN
  condition = condition.replace(/\s+THEN\s*$/i, '');
  
  // Handle FUNCTION calls in conditions
  condition = condition.replace(/FUNCTION\s+([A-Z][-A-Z0-9]*)\s*\(([^)]+)\)/gi, (_, funcName, args) => {
    const fn = funcName.toUpperCase().replace(/-/g, '_');
    const pyArgs = args.split(',').map((a: string) => a.trim()).join(', ');
    switch (fn) {
      case 'ABS': return `abs(${pyArgs})`;
      case 'LENGTH': return `len(str(${pyArgs}))`;
      case 'UPPER_CASE': return `str(${pyArgs}).upper()`;
      case 'LOWER_CASE': return `str(${pyArgs}).lower()`;
      case 'TRIM': return `str(${pyArgs}).strip()`;
      default: return `self._cobol_function("${toSnakeCase(funcName)}", ${pyArgs})`;
    }
  });
  
  // Handle NOT =
  condition = condition.replace(/\s+NOT\s*=\s*/gi, ' != ');
  
  // Handle GREATER THAN, LESS THAN, EQUAL TO
  condition = condition.replace(/\s+GREATER\s+THAN\s+OR\s+EQUAL\s+TO\s+/gi, ' >= ');
  condition = condition.replace(/\s+LESS\s+THAN\s+OR\s+EQUAL\s+TO\s+/gi, ' <= ');
  condition = condition.replace(/\s+GREATER\s+THAN\s+/gi, ' > ');
  condition = condition.replace(/\s+LESS\s+THAN\s+/gi, ' < ');
  condition = condition.replace(/\s+EQUAL\s+TO\s+/gi, ' == ');
  condition = condition.replace(/\s+NOT\s+EQUAL\s+TO\s+/gi, ' != ');
  
  // Handle IS NOT NUMERIC, IS NOT ALPHABETIC, etc. (must come before IS NUMERIC)
  condition = condition.replace(/([A-Z0-9][-A-Z0-9]*)\s+IS\s+NOT\s+NUMERIC/gi, 
    (_, v) => `not str(self.${toSnakeCase(v)}).replace('.','').replace('-','').isdigit()`);
  condition = condition.replace(/([A-Z0-9][-A-Z0-9]*)\s+IS\s+NOT\s+ALPHABETIC/gi, 
    (_, v) => `not str(self.${toSnakeCase(v)}).replace(' ','').isalpha()`);
  condition = condition.replace(/([A-Z0-9][-A-Z0-9]*)\s+IS\s+NOT\s+POSITIVE/gi, 
    (_, v) => `self.${toSnakeCase(v)} <= 0`);
  condition = condition.replace(/([A-Z0-9][-A-Z0-9]*)\s+IS\s+NOT\s+NEGATIVE/gi, 
    (_, v) => `self.${toSnakeCase(v)} >= 0`);
  condition = condition.replace(/([A-Z0-9][-A-Z0-9]*)\s+IS\s+NOT\s+ZERO/gi, 
    (_, v) => `self.${toSnakeCase(v)} != 0`);
  
  // Handle IS NUMERIC, IS ALPHABETIC, etc.
  condition = condition.replace(/([A-Z0-9][-A-Z0-9]*)\s+IS\s+NUMERIC/gi, 
    (_, v) => `str(self.${toSnakeCase(v)}).replace('.','').replace('-','').isdigit()`);
  condition = condition.replace(/([A-Z0-9][-A-Z0-9]*)\s+IS\s+ALPHABETIC/gi, 
    (_, v) => `str(self.${toSnakeCase(v)}).replace(' ','').isalpha()`);
  condition = condition.replace(/([A-Z0-9][-A-Z0-9]*)\s+IS\s+POSITIVE/gi, 
    (_, v) => `self.${toSnakeCase(v)} > 0`);
  condition = condition.replace(/([A-Z0-9][-A-Z0-9]*)\s+IS\s+NEGATIVE/gi, 
    (_, v) => `self.${toSnakeCase(v)} < 0`);
  condition = condition.replace(/([A-Z0-9][-A-Z0-9]*)\s+IS\s+ZERO/gi, 
    (_, v) => `self.${toSnakeCase(v)} == 0`);
  
  // Replace = with ==
  condition = condition.replace(/([^!=<>])\s*=\s*([^=])/g, '$1 == $2');
  
  // Handle AND/OR
  condition = condition.replace(/\s+AND\s+/gi, ' and ');
  condition = condition.replace(/\s+OR\s+/gi, ' or ');
  condition = condition.replace(/\s+NOT\s+/gi, ' not ');
  
  // Fix COBOL implicit subject in OR/AND conditions
  // Pattern: "X < 6 OR > 360" → "X < 6 or X > 360"
  // Pattern: "X = 'A' OR 'B'" → "X = 'A' or X = 'B'"
  condition = condition.replace(/([A-Z0-9][-A-Z0-9]*)\s*(=|<|>|<=|>=|!=)\s*(\S+)\s+or\s+(=|<|>|<=|>=|!=)\s*/gi, 
    (_, varName, op1, val1, op2) => `${varName} ${op1} ${val1} or ${varName} ${op2} `);
  condition = condition.replace(/([A-Z0-9][-A-Z0-9]*)\s*(=|<|>|<=|>=|!=)\s*(\S+)\s+or\s+([^=<>!]+)$/gi, 
    (_, varName, op, val1, val2) => `${varName} ${op} ${val1} or ${varName} ${op} ${val2}`);
  
  // Protect string literals before variable replacement
  const stringLiterals: string[] = [];
  condition = condition.replace(/"([^"]+)"/g, (_, lit) => {
    const idx = stringLiterals.length;
    stringLiterals.push(lit);
    return `@@STR_${idx}@@`;
  });
  condition = condition.replace(/'([^']+)'/g, (_, lit) => {
    const idx = stringLiterals.length;
    stringLiterals.push(lit);
    return `@@STR_${idx}@@`;
  });
  
  // Replace variable names
  condition = condition.replace(/\b([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)\b/gi, (m) => {
    if (/^\d+$/.test(m)) return m;
    if (['AND', 'OR', 'NOT', 'TRUE', 'FALSE', 'STR'].includes(m.toUpperCase())) return m.toLowerCase();
    return `self.${toSnakeCase(m)}`;
  });
  
  // Restore string literals
  for (let i = 0; i < stringLiterals.length; i++) {
    condition = condition.replace(`@@STR_${i}@@`, `"${stringLiterals[i]}"`);
  }
  
  return {
    type: 'if',
    code: `if ${condition.trim()}:`,
    originalCobol: original,
    confidence: 85,
    indent: 0
  };
}

function transpilePerform(upper: string, original: string): PythonStatement | null {
  // PERFORM ... TIMES (single-line loop, no indent change)
  let match = upper.match(/PERFORM\s+([A-Z0-9][-A-Z0-9]*)\s+(\d+)\s+TIMES/i);
  if (match) {
    return {
      type: 'call',  // Use 'call' to avoid indent change for single-line loops
      code: `for _ in range(${match[2]}): self.p_${toSnakeCase(match[1])}()`,
      originalCobol: original,
      confidence: 95,
      indent: 0
    };
  }
  
  // PERFORM ... UNTIL condition (single-line loop, no indent change)
  match = upper.match(/PERFORM\s+([A-Z0-9][-A-Z0-9]*)\s+UNTIL\s+([A-Z0-9][-A-Z0-9]*)\s*=\s*["']?([^"'\s]+)["']?/i);
  if (match) {
    const target = toSnakeCase(match[1]);
    const condVar = toSnakeCase(match[2]);
    const condVal = match[3].toLowerCase();
    return {
      type: 'call',  // Use 'call' to avoid indent change for single-line loops
      code: `while self.${condVar} != "${condVal}": self.p_${target}()`,
      originalCobol: original,
      confidence: 85,
      indent: 0
    };
  }
  
  // PERFORM VARYING
  match = upper.match(/PERFORM\s+([A-Z0-9][-A-Z0-9]*)\s+VARYING\s+([A-Z0-9][-A-Z0-9]*)\s+FROM\s+(\d+)\s+BY\s+(\d+)\s+UNTIL\s+([A-Z0-9][-A-Z0-9]*)\s*>\s*(\d+)/i);
  if (match) {
    const target = toSnakeCase(match[1]);
    const loopVar = toSnakeCase(match[2]);
    const start = match[3];
    const step = match[4];
    const endVal = match[6];
    return {
      type: 'call',  // Use 'call' to avoid indent change for single-line loops
      code: `for self.${loopVar} in range(${start}, ${endVal} + 1, ${step}): self.p_${target}()`,
      originalCobol: original,
      confidence: 90,
      indent: 0
    };
  }
  
  // Simple PERFORM (not UNTIL/VARYING/TIMES/THRU)
  match = upper.match(/PERFORM\s+([A-Z0-9][-A-Z0-9]+)(?:\s|$|\.)/i);
  if (match && !upper.match(/PERFORM\s+(UNTIL|VARYING|TIMES|WITH)/i)) {
    return {
      type: 'call',
      code: `self.p_${toSnakeCase(match[1])}()`,
      originalCobol: original,
      confidence: 95,
      indent: 0
    };
  }
  
  return null;
}

function transpileDisplay(upper: string, original: string): PythonStatement | null {
  const match = upper.match(/DISPLAY\s+(.+)/i);
  if (match) {
    let content = match[1].trim().replace(/\.$/, '');
    
    // Handle quoted strings - extract from original to preserve case
    const quotedMatch = original.match(/DISPLAY\s+["']([^"']+)["']/i);
    if (quotedMatch) {
      return {
        type: 'call',
        code: `self.logger.info("${quotedMatch[1]}")`,
        originalCobol: original,
        confidence: 95,
        indent: 0
      };
    }
    
    // Variable display
    const varName = toSnakeCase(content);
    return {
      type: 'call',
      code: `self.logger.info(f"{self.${varName}}")`,
      originalCobol: original,
      confidence: 95,
      indent: 0
    };
  }
  
  return null;
}

function transpileOpen(upper: string, original: string): PythonStatement | null {
  let match = upper.match(/OPEN\s+INPUT\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    const file = toSnakeCase(match[1]);
    return {
      type: 'assignment',
      code: `self._file_${file} = open(self.file_paths.get("${file}", "${file}.dat"), "r")`,
      originalCobol: original,
      confidence: 85,
      indent: 0
    };
  }
  
  match = upper.match(/OPEN\s+OUTPUT\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    const file = toSnakeCase(match[1]);
    return {
      type: 'assignment',
      code: `self._file_${file} = open(self.file_paths.get("${file}", "${file}.dat"), "w")`,
      originalCobol: original,
      confidence: 85,
      indent: 0
    };
  }
  
  match = upper.match(/OPEN\s+I-O\s+([A-Z0-9][-A-Z0-9]*)/i);
  if (match) {
    const file = toSnakeCase(match[1]);
    return {
      type: 'assignment',
      code: `self._file_${file} = open(self.file_paths.get("${file}", "${file}.dat"), "r+")`,
      originalCobol: original,
      confidence: 85,
      indent: 0
    };
  }
  
  return null;
}

function transpileRead(upper: string, original: string): PythonStatement | null {
  const match = upper.match(/READ\s+([A-Z0-9][-A-Z0-9]*)(?:\s+INTO\s+([A-Z0-9][-A-Z0-9]*))?/i);
  if (match) {
    const file = toSnakeCase(match[1]);
    const target = match[2] ? toSnakeCase(match[2]) : 'record';
    return {
      type: 'assignment',
      code: `self.${target} = self._file_${file}.readline().strip() if self._file_${file} else ""`,
      originalCobol: original,
      confidence: 80,
      indent: 0
    };
  }
  return null;
}

function transpileWrite(upper: string, original: string): PythonStatement | null {
  const match = upper.match(/WRITE\s+([A-Z0-9][-A-Z0-9]*)(?:\s+FROM\s+([A-Z0-9][-A-Z0-9]*))?/i);
  if (match) {
    const file = toSnakeCase(match[1]);
    const source = match[2] ? toSnakeCase(match[2]) : file;
    return {
      type: 'call',
      code: `self._file_${file}.write(str(self.${source}) + "\\n") if hasattr(self, '_file_${file}') else None`,
      originalCobol: original,
      confidence: 80,
      indent: 0
    };
  }
  return null;
}

function transpileCall(upper: string, original: string): PythonStatement | null {
  const match = upper.match(/CALL\s+["']?([A-Z0-9][-A-Z0-9]*)["']?(?:\s+USING\s+(.+))?/i);
  if (match) {
    const program = toSnakeCase(match[1]);
    const args = match[2] 
      ? match[2].split(/\s+/).filter(a => a && !['BY', 'REFERENCE', 'CONTENT', 'VALUE'].includes(a.toUpperCase())).map(a => `self.${toSnakeCase(a)}`).join(', ')
      : '';
    return {
      type: 'call',
      code: `self.call_program("${program}"${args ? `, ${args}` : ''})`,
      originalCobol: original,
      confidence: 85,
      indent: 0
    };
  }
  return null;
}

function transpileEvaluate(upper: string, original: string): PythonStatement | null {
  const match = upper.match(/EVALUATE\s+(.+)/i);
  if (match) {
    const subject = toSnakeCase(match[1].trim());
    return {
      type: 'comment',
      code: `# EVALUATE ${match[1]} - using if/elif chain`,
      originalCobol: original,
      confidence: 75,
      indent: 0
    };
  }
  return null;
}

function transpileWhen(upper: string, original: string): PythonStatement | null {
  // WHEN OTHER (check first, as it's most specific)
  if (upper.includes('WHEN OTHER')) {
    return {
      type: 'else',
      code: `else:  # WHEN OTHER`,
      originalCobol: original,
      confidence: 90,
      indent: 0
    };
  }
  
  // WHEN "value" (string literal)
  let match = upper.match(/WHEN\s+["']([^"']+)["']/i);
  if (match) {
    return {
      type: 'elif',
      code: `elif self._eval_subject == "${match[1].toLowerCase()}":`,
      originalCobol: original,
      confidence: 70,
      indent: 0
    };
  }
  
  // WHEN identifier (88-level condition like WHEN ACCT-CHECKING)
  // Used with EVALUATE TRUE
  match = upper.match(/WHEN\s+([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)/i);
  if (match) {
    const conditionName = toSnakeCase(match[1]);
    return {
      type: 'elif',
      code: `elif self.${conditionName}:`,
      originalCobol: original,
      confidence: 85,
      indent: 0
    };
  }
  
  return null;
}

// ============================================================
// PASS 2: Python AST → Code String (Génération)
// ============================================================

export function generatePythonCode(ast: PythonAST): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`"""${ast.className} - Auto-transpiled from COBOL [Deterministic Transpiler v1.0]"""`);
  lines.push('');
  
  // Imports
  lines.push(...ast.imports);
  lines.push('');
  
  // Main class
  lines.push(`class ${ast.className}:`);
  lines.push(`    """Main processor class transpiled from COBOL."""`);
  lines.push('');
  
  // __init__
  lines.push('    def __init__(self):');
  lines.push('        """Initialize processor with default values."""');
  lines.push('        self.logger = logging.getLogger(__name__)');
  lines.push('        self.file_paths: Dict[str, str] = {}');
  lines.push('        self.status: str = "initialized"');
  
  // Variables
  for (const v of ast.classVars) {
    const comment = v.docstring ? `  # ${v.docstring}` : '';
    lines.push(`        self.${v.name}: ${v.type} = ${v.default}${comment}`);
  }
  lines.push('');
  
  // 88-level condition properties (COBOL conditions → Python @property)
  if (ast.conditionProperties && ast.conditionProperties.length > 0) {
    lines.push('    # ═══════════════════════════════════════════════════════════');
    lines.push('    # COBOL 88-LEVEL CONDITIONS (Auto-generated properties)');
    lines.push('    # ═══════════════════════════════════════════════════════════');
    lines.push('');
    
    for (const cond of ast.conditionProperties) {
      lines.push(`    @property`);
      lines.push(`    def ${cond.name}(self) -> bool:`);
      
      if (cond.thru) {
        // THRU/THROUGH range check
        lines.push(`        """88-level condition: ${cond.parentVariable} in range ${cond.thru.from} THRU ${cond.thru.to}"""`);
        lines.push(`        return "${cond.thru.from}" <= str(self.${cond.parentVariable}) <= "${cond.thru.to}"`);
      } else if (cond.values.length > 0) {
        // Multiple values check
        const valuesStr = cond.values.map(v => `"${v}"`).join(', ');
        lines.push(`        """88-level condition: ${cond.parentVariable} in (${valuesStr})"""`);
        lines.push(`        return str(self.${cond.parentVariable}) in (${valuesStr})`);
      } else {
        lines.push(`        """88-level condition for ${cond.parentVariable}"""`);
        lines.push(`        return False  # No values defined`);
      }
      lines.push('');
      
      // Setter for the condition
      lines.push(`    @${cond.name}.setter`);
      lines.push(`    def ${cond.name}(self, value: bool):`);
      if (cond.values.length > 0) {
        lines.push(`        """Set ${cond.parentVariable} to first condition value when True."""`);
        lines.push(`        if value:`);
        lines.push(`            self.${cond.parentVariable} = "${cond.values[0]}"`);
      } else if (cond.thru) {
        lines.push(`        """Set ${cond.parentVariable} to start of range when True."""`);
        lines.push(`        if value:`);
        lines.push(`            self.${cond.parentVariable} = "${cond.thru.from}"`);
      } else {
        lines.push(`        pass`);
      }
      lines.push('');
    }
  }
  
  // Methods
  for (const method of ast.methods) {
    lines.push(`    def ${method.name}(self) -> ${method.returnType}:`);
    lines.push(`        """${method.docstring}"""`);
    
    if (method.body.length === 0) {
      lines.push('        pass');
    } else {
      for (const stmt of method.body) {
        const indent = '        ' + '    '.repeat(stmt.indent);
        lines.push(`${indent}${stmt.code}`);
      }
    }
    lines.push('');
  }
  
  // Run method
  lines.push('    def run(self):');
  lines.push('        """Main entry point."""');
  if (ast.methods.length > 0) {
    lines.push(`        self.${ast.methods[0].name}()`);
  } else {
    lines.push('        pass');
  }
  lines.push('');
  
  // call_program helper
  lines.push('    def call_program(self, name: str, *args) -> Any:');
  lines.push('        """Call external program/subroutine."""');
  lines.push('        self.logger.info(f"Calling program: {name} with {len(args)} args")');
  lines.push('        return None');
  lines.push('');
  
  // Main block
  lines.push('');
  lines.push('if __name__ == "__main__":');
  lines.push('    logging.basicConfig(level=logging.INFO)');
  lines.push(`    processor = ${ast.className}()`);
  lines.push('    processor.run()');
  
  return lines.join('\n');
}

// ============================================================
// PASS 3: Optimizer - Clean up generated code
// ============================================================

export function optimizePythonCode(code: string): string {
  let optimized = code;
  
  // Fix any double self. references
  optimized = optimized.replace(/self\.self\./g, 'self.');
  
  // Fix elif after else (invalid Python)
  optimized = optimized.replace(/(\n\s*else:.*\n(?:\s+.*\n)*?)(\s*)(elif\s)/g, '$1$2# TODO: $3');
  
  // Fix trailing periods in variable names
  optimized = optimized.replace(/self\.([a-z_][a-z0-9_]*)\.([\s\)])/g, 'self.$1$2');
  
  // Fix empty blocks (if/elif/else followed by else/elif/def/class without body)
  const lines = optimized.split('\n');
  const result: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const currentIndent = line.match(/^(\s*)/)?.[0] || '';
    
    result.push(line.replace(/\s+$/, ''));  // Remove trailing whitespace
    
    // Check if this is a block statement (if, elif, else, for, while, etc.)
    if (trimmed.endsWith(':') && 
        (trimmed.startsWith('if ') || trimmed.startsWith('elif ') || 
         trimmed === 'else:' || trimmed.startsWith('else:') ||
         trimmed.startsWith('for ') || trimmed.startsWith('while ') ||
         trimmed.startsWith('try:') || trimmed.startsWith('except') ||
         trimmed.startsWith('finally:') || trimmed.startsWith('with '))) {
      
      // Check if next non-empty line is properly indented
      let nextLineIdx = i + 1;
      while (nextLineIdx < lines.length && lines[nextLineIdx].trim() === '') {
        nextLineIdx++;
      }
      
      if (nextLineIdx < lines.length) {
        const nextLine = lines[nextLineIdx];
        const nextTrimmed = nextLine.trim();
        const nextIndent = nextLine.match(/^(\s*)/)?.[0] || '';
        
        // If next line is NOT more indented, we need to add pass
        if (nextIndent.length <= currentIndent.length && nextTrimmed !== '') {
          result.push(currentIndent + '    pass  # Empty block');
        }
      }
    }
  }
  
  return result.join('\n');
}

// ============================================================
// Helpers
// ============================================================

function toSnakeCase(str: string): string {
  return str.toLowerCase().replace(/-/g, '_').replace(/[^a-z0-9_]/g, '').replace(/^_+|_+$/g, '');
}

function toPascalCase(str: string): string {
  return str.split(/[-_\s]/).map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join('');
}

// ============================================================
// CLEAN ARCHITECTURE: Domain Detection
// ============================================================

function detectDomain(paragraphName: string): { domain: string; displayName: string } {
  for (const rule of DOMAIN_RULES) {
    if (rule.pattern.test(paragraphName)) {
      return { domain: rule.domain, displayName: rule.displayName };
    }
  }
  return { domain: 'core', displayName: 'Core' };
}

function toBusinessMethodName(originalName: string): string {
  let name = originalName;
  
  // Remove p_XXXX_ prefix
  name = name.replace(/^p_\d+_/, '');
  
  // Apply specific mappings
  for (const mapping of METHOD_NAME_MAPPINGS) {
    if (mapping.pattern.test(name)) {
      name = name.replace(mapping.pattern, mapping.replacement);
    }
  }
  
  return name;
}

// ============================================================
// CLEAN ARCHITECTURE: Multi-File Generator
// ============================================================

export function transpileToCleanArchitecture(cobolAST: CobolFullAST, sourceCode: string): {
  files: Map<string, string>;
  stats: {
    domainsDetected: number;
    methodsTranspiled: number;
    servicesGenerated: number;
    repositoriesGenerated: number;
  };
} {
  const sourceLines = sourceCode.split('\n');
  const pythonAST = transpileCobolToPythonAST(cobolAST, sourceLines);
  
  // Group methods by domain
  const domainMethods = new Map<string, { displayName: string; methods: PythonMethod[] }>();
  
  for (const method of pythonAST.methods) {
    const { domain, displayName } = detectDomain(method.originalName);
    
    if (!domainMethods.has(domain)) {
      domainMethods.set(domain, { displayName, methods: [] });
    }
    
    // Rename method to business-friendly name
    const renamedMethod = {
      ...method,
      name: toBusinessMethodName(method.name),
      docstring: method.docstring.replace(/Business logic from: /, 'Implements: ')
    };
    
    domainMethods.get(domain)!.methods.push(renamedMethod);
  }
  
  // Generate files
  const files = new Map<string, string>();
  const repositoriesGenerated: string[] = [];
  
  // 1. Generate domain/__init__.py
  files.set('domain/__init__.py', generateDomainInit(domainMethods));
  
  // 2. Generate domain services (one per domain)
  for (const [domain, { displayName, methods }] of domainMethods) {
    const serviceCode = generateDomainService(displayName, domain, methods, pythonAST);
    files.set(`domain/${domain}_service.py`, serviceCode);
    
    // 3. Generate repository interface for this domain
    const repoCode = generateRepository(displayName, domain);
    files.set(`infra/repositories/${domain}_repository.py`, repoCode);
    repositoriesGenerated.push(domain);
  }
  
  // 4. Generate infra/__init__.py
  files.set('infra/__init__.py', generateInfraInit(repositoriesGenerated));
  files.set('infra/repositories/__init__.py', generateRepoInit(repositoriesGenerated));
  
  // 5. Generate shared entities from class variables
  files.set('domain/entities.py', generateEntities(pythonAST));
  
  // 6. Generate main orchestrator
  files.set('app/main.py', generateMainOrchestrator(pythonAST.className, domainMethods));
  files.set('app/__init__.py', '# Application layer\n');
  
  // 7. Generate basic tests
  files.set('tests/__init__.py', '# Tests\n');
  files.set('tests/test_services.py', generateBasicTests(domainMethods));
  
  return {
    files,
    stats: {
      domainsDetected: domainMethods.size,
      methodsTranspiled: pythonAST.methods.length,
      servicesGenerated: domainMethods.size,
      repositoriesGenerated: repositoriesGenerated.length
    }
  };
}

function generateDomainInit(domains: Map<string, { displayName: string; methods: PythonMethod[] }>): string {
  const lines = [
    '"""Domain layer - Business logic services."""',
    '',
    'from .entities import *',
    ''
  ];
  
  for (const [domain, { displayName }] of domains) {
    lines.push(`from .${domain}_service import ${displayName}Service`);
  }
  
  lines.push('');
  lines.push('__all__ = [');
  for (const [domain, { displayName }] of domains) {
    lines.push(`    "${displayName}Service",`);
  }
  lines.push(']');
  
  return lines.join('\n');
}

function generateDomainService(displayName: string, domain: string, methods: PythonMethod[], ast: PythonAST): string {
  const lines = [
    `"""${displayName} Service - Domain logic for ${domain}."""`,
    '',
    'from decimal import Decimal, ROUND_HALF_UP',
    'from typing import Optional, Dict, Any, Protocol',
    'from dataclasses import dataclass',
    'from datetime import datetime, date',
    'import logging',
    '',
    'from .entities import *',
    `from ..infra.repositories.${domain}_repository import ${displayName}Repository`,
    '',
    '',
    `class ${displayName}Service:`,
    `    """Service handling ${domain.replace(/_/g, ' ')} operations."""`,
    '',
    '    def __init__(self, repository: ' + displayName + 'Repository):',
    '        """Initialize with repository dependency."""',
    '        self.repository = repository',
    '        self.logger = logging.getLogger(__name__)',
    ''
  ];
  
  // Add methods
  for (const method of methods) {
    lines.push(`    def ${method.name}(self) -> ${method.returnType}:`);
    lines.push(`        """${method.docstring}"""`);
    
    if (method.body.length === 0) {
      lines.push('        pass');
    } else {
      for (const stmt of method.body) {
        const indent = '        ' + '    '.repeat(stmt.indent);
        // Replace self. references with repository calls where appropriate
        let code = stmt.code;
        code = code.replace(/self\.logger\.debug\('TODO: (.*?)'\)/g, '# TODO: $1');
        lines.push(`${indent}${code}`);
      }
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

function generateRepository(displayName: string, domain: string): string {
  return `"""${displayName} Repository - Data access interface for ${domain}."""

from typing import Protocol, Optional, List, Dict, Any
from decimal import Decimal
from datetime import date


class ${displayName}Repository(Protocol):
    """Repository interface for ${domain.replace(/_/g, ' ')} data access.
    
    This is a Port (interface) - implement with concrete adapters.
    """
    
    def find_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        """Find entity by ID."""
        ...
    
    def find_all(self, filters: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Find all entities matching filters."""
        ...
    
    def save(self, entity: Dict[str, Any]) -> str:
        """Save entity and return ID."""
        ...
    
    def update(self, id: str, data: Dict[str, Any]) -> bool:
        """Update entity by ID."""
        ...
    
    def delete(self, id: str) -> bool:
        """Delete entity by ID."""
        ...


class InMemory${displayName}Repository:
    """In-memory implementation for testing."""
    
    def __init__(self):
        self._storage: Dict[str, Dict[str, Any]] = {}
        self._next_id = 1
    
    def find_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        return self._storage.get(id)
    
    def find_all(self, filters: Optional[Dict] = None) -> List[Dict[str, Any]]:
        results = list(self._storage.values())
        if filters:
            for key, value in filters.items():
                results = [r for r in results if r.get(key) == value]
        return results
    
    def save(self, entity: Dict[str, Any]) -> str:
        id = str(self._next_id)
        self._next_id += 1
        entity['id'] = id
        self._storage[id] = entity
        return id
    
    def update(self, id: str, data: Dict[str, Any]) -> bool:
        if id in self._storage:
            self._storage[id].update(data)
            return True
        return False
    
    def delete(self, id: str) -> bool:
        if id in self._storage:
            del self._storage[id]
            return True
        return False
`;
}

function generateInfraInit(domains: string[]): string {
  return `"""Infrastructure layer - Adapters and implementations."""

from .repositories import *

__all__ = ['repositories']
`;
}

function generateRepoInit(domains: string[]): string {
  const lines = ['"""Repository implementations."""', ''];
  
  for (const domain of domains) {
    const displayName = toPascalCase(domain);
    lines.push(`from .${domain}_repository import ${displayName}Repository, InMemory${displayName}Repository`);
  }
  
  return lines.join('\n');
}

function generateEntities(ast: PythonAST): string {
  const lines = [
    '"""Domain entities - Core business objects."""',
    '',
    'from dataclasses import dataclass, field',
    'from decimal import Decimal',
    'from typing import Optional, List, Dict, Any',
    'from datetime import datetime, date',
    'from enum import Enum, auto',
    '',
    ''
  ];
  
  // Generate ProcessingStatus enum if conditions exist
  if (ast.conditionProperties.length > 0) {
    lines.push('class ProcessingStatus(Enum):');
    lines.push('    """Processing status flags."""');
    const seenValues = new Set<string>();
    for (const cond of ast.conditionProperties.slice(0, 10)) {
      const enumName = cond.name.toUpperCase();
      if (!seenValues.has(enumName)) {
        lines.push(`    ${enumName} = auto()`);
        seenValues.add(enumName);
      }
    }
    lines.push('');
    lines.push('');
  }
  
  // Generate Config dataclass
  lines.push('@dataclass');
  lines.push('class SystemConfig:');
  lines.push('    """System configuration settings."""');
  
  const configVars = ast.classVars.filter(v => 
    v.name.includes('rate') || v.name.includes('fee') || v.name.includes('pct')
  ).slice(0, 20);
  
  if (configVars.length === 0) {
    lines.push('    pass');
  } else {
    for (const v of configVars) {
      lines.push(`    ${v.name}: ${v.type} = ${v.default}`);
    }
  }
  lines.push('');
  
  return lines.join('\n');
}

function generateMainOrchestrator(className: string, domains: Map<string, { displayName: string; methods: PythonMethod[] }>): string {
  const lines = [
    `"""${className} - Main Application Orchestrator."""`,
    '',
    'import logging',
    'from typing import Dict, Any',
    '',
    '# Import domain services',
  ];
  
  for (const [domain, { displayName }] of domains) {
    lines.push(`from domain.${domain}_service import ${displayName}Service`);
  }
  
  lines.push('');
  lines.push('# Import repositories');
  
  for (const [domain, { displayName }] of domains) {
    lines.push(`from infra.repositories.${domain}_repository import InMemory${displayName}Repository`);
  }
  
  lines.push('');
  lines.push('');
  lines.push(`class ${className}:`);
  lines.push('    """Main application orchestrator."""');
  lines.push('');
  lines.push('    def __init__(self):');
  lines.push('        """Initialize with all services."""');
  lines.push('        self.logger = logging.getLogger(__name__)');
  lines.push('');
  lines.push('        # Initialize repositories');
  
  for (const [domain, { displayName }] of domains) {
    lines.push(`        self._${domain}_repo = InMemory${displayName}Repository()`);
  }
  
  lines.push('');
  lines.push('        # Initialize services with dependency injection');
  
  for (const [domain, { displayName }] of domains) {
    lines.push(`        self.${domain} = ${displayName}Service(self._${domain}_repo)`);
  }
  
  lines.push('');
  lines.push('    def run(self):');
  lines.push('        """Main entry point."""');
  lines.push('        self.logger.info("Starting application...")');
  lines.push('        # Orchestrate domain services as needed');
  lines.push('        pass');
  lines.push('');
  lines.push('');
  lines.push('if __name__ == "__main__":');
  lines.push('    logging.basicConfig(level=logging.INFO)');
  lines.push(`    app = ${className}()`);
  lines.push('    app.run()');
  
  return lines.join('\n');
}

function generateBasicTests(domains: Map<string, { displayName: string; methods: PythonMethod[] }>): string {
  const lines = [
    '"""Basic service tests."""',
    '',
    'import pytest',
    'from decimal import Decimal',
    '',
  ];
  
  for (const [domain, { displayName }] of domains) {
    lines.push(`from domain.${domain}_service import ${displayName}Service`);
    lines.push(`from infra.repositories.${domain}_repository import InMemory${displayName}Repository`);
  }
  
  lines.push('');
  lines.push('');
  lines.push('# Fixtures');
  
  for (const [domain, { displayName }] of domains) {
    lines.push('');
    lines.push('@pytest.fixture');
    lines.push(`def ${domain}_service():`);
    lines.push(`    """Create ${displayName}Service with in-memory repository."""`);
    lines.push(`    repo = InMemory${displayName}Repository()`);
    lines.push(`    return ${displayName}Service(repo)`);
  }
  
  lines.push('');
  lines.push('');
  lines.push('# Basic tests');
  
  for (const [domain, { displayName, methods }] of domains) {
    lines.push('');
    lines.push(`class Test${displayName}Service:`);
    lines.push(`    """Tests for ${displayName}Service."""`);
    lines.push('');
    lines.push(`    def test_service_initialization(self, ${domain}_service):`);
    lines.push(`        """Test service can be instantiated."""`);
    lines.push(`        assert ${domain}_service is not None`);
    lines.push(`        assert ${domain}_service.repository is not None`);
    
    // Add test for first method if available
    if (methods.length > 0) {
      const firstMethod = methods[0];
      lines.push('');
      lines.push(`    def test_${firstMethod.name}(self, ${domain}_service):`);
      lines.push(`        """Test ${firstMethod.name} method exists."""`);
      lines.push(`        assert hasattr(${domain}_service, '${firstMethod.name}')`);
    }
  }
  
  return lines.join('\n');
}

// ============================================================
// MAIN EXPORT: Full Pipeline
// ============================================================

export function transpileCobol(cobolAST: CobolFullAST, sourceCode: string): {
  pythonCode: string;
  stats: {
    methodsTranspiled: number;
    statementsTranspiled: number;
    averageConfidence: number;
    fallbackCount: number;
  };
} {
  const sourceLines = sourceCode.split('\n');
  
  // PASS 1: COBOL AST → Python AST
  const pythonAST = transpileCobolToPythonAST(cobolAST, sourceLines);
  
  // PASS 2: Python AST → Code
  let pythonCode = generatePythonCode(pythonAST);
  
  // PASS 3: Optimize (future)
  pythonCode = optimizePythonCode(pythonCode);
  
  // Calculate stats
  let totalConfidence = 0;
  let stmtCount = 0;
  let fallbackCount = 0;
  
  for (const method of pythonAST.methods) {
    for (const stmt of method.body) {
      totalConfidence += stmt.confidence;
      stmtCount++;
      if (stmt.confidence === 0) fallbackCount++;
    }
  }
  
  return {
    pythonCode,
    stats: {
      methodsTranspiled: pythonAST.methods.length,
      statementsTranspiled: stmtCount,
      averageConfidence: stmtCount > 0 ? Math.round(totalConfidence / stmtCount) : 0,
      fallbackCount
    }
  };
}
