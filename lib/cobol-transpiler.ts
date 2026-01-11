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
// PASS 1: COBOL AST → Python AST (Déterministe)
// ============================================================

export function transpileCobolToPythonAST(cobolAST: CobolFullAST, sourceLines: string[]): PythonAST {
  const className = toPascalCase(cobolAST.programId);
  
  // Transpile variables
  const classVars = transpileVariables(cobolAST.workingStorageVariables);
  
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
    dataclasses: []
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
    
    return {
      name: toSnakeCase(v.name),
      type: pictureToType(v.picture),
      default: getDefaultValue(v.picture, v.value),
      fromCobol: v.name,
      docstring: v.picture ? `PIC ${safePic}` : `from ${v.name}`
    };
  });
}

function pictureToType(pic?: string): PythonVariable['type'] {
  if (!pic) return 'Any';
  const upper = pic.toUpperCase();
  if (upper.match(/^S?9/)) return 'Decimal';
  if (upper.match(/^X/)) return 'str';
  if (upper.match(/^A/)) return 'str';
  if (upper === '1' || upper.match(/^88$/)) return 'bool';
  return 'str';
}

function getDefaultValue(pic?: string, value?: string): string {
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
  const cobolLines = sourceLines.slice(para.lineStart - 1, para.lineEnd);
  
  const body: PythonStatement[] = [];
  const indentStack: number[] = [0];  // Stack to track nesting levels
  let currentIndent = 0;
  
  for (let i = 0; i < cobolLines.length; i++) {
    const line = cobolLines[i];
    const trimmed = line.trim().toUpperCase();
    const originalTrimmed = line.trim();
    
    // Skip empty lines, paragraph headers, comments
    if (!trimmed || trimmed.match(/^[A-Z0-9][-A-Z0-9]*\.$/) || (line.length > 6 && line[6] === '*')) {
      continue;
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
      if (stmt.type === 'if' || stmt.type === 'for' || stmt.type === 'while') {
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
    
    // Convert COBOL operators and variables
    expr = expr.replace(/\*\*/g, ' ** ');  // Exponentiation
    expr = expr.replace(/\s+/g, ' ');
    
    // Replace variable names with self.xxx
    expr = expr.replace(/([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)/gi, (m) => {
      // Check if it's a number
      if (/^\d+$/.test(m)) return m;
      // Check if it's an operator word
      if (['AND', 'OR', 'NOT', 'ROUNDED'].includes(m.toUpperCase())) return m.toLowerCase();
      return `self.${toSnakeCase(m)}`;
    });
    
    // Clean up
    expr = expr.replace(/\s*\.\s*$/, '');
    expr = expr.replace(/rounded/gi, '');
    
    const hasRounded = upper.includes('ROUNDED');
    const code = hasRounded 
      ? `self.${target} = round(${expr.trim()}, 2)`
      : `self.${target} = ${expr.trim()}`;
    
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
  
  // Handle NOT =
  condition = condition.replace(/\s+NOT\s*=\s*/gi, ' != ');
  
  // Handle GREATER THAN, LESS THAN, EQUAL TO
  condition = condition.replace(/\s+GREATER\s+THAN\s+OR\s+EQUAL\s+TO\s+/gi, ' >= ');
  condition = condition.replace(/\s+LESS\s+THAN\s+OR\s+EQUAL\s+TO\s+/gi, ' <= ');
  condition = condition.replace(/\s+GREATER\s+THAN\s+/gi, ' > ');
  condition = condition.replace(/\s+LESS\s+THAN\s+/gi, ' < ');
  condition = condition.replace(/\s+EQUAL\s+TO\s+/gi, ' == ');
  condition = condition.replace(/\s+NOT\s+EQUAL\s+TO\s+/gi, ' != ');
  
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
  
  // Replace variable names
  condition = condition.replace(/([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)/gi, (m) => {
    if (/^\d+$/.test(m)) return m;
    if (['AND', 'OR', 'NOT', 'TRUE', 'FALSE'].includes(m.toUpperCase())) return m.toLowerCase();
    return `self.${toSnakeCase(m)}`;
  });
  
  // Handle string literals - restore quotes
  condition = condition.replace(/"([^"]+)"/g, '"$1"');
  condition = condition.replace(/'([^']+)'/g, '"$1"');
  
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
  // WHEN "value"
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
  
  // WHEN OTHER
  if (upper.includes('WHEN OTHER')) {
    return {
      type: 'else',
      code: `else:  # WHEN OTHER`,
      originalCobol: original,
      confidence: 90,
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
  
  // Fix trailing periods in variable names
  optimized = optimized.replace(/self\.([a-z_][a-z0-9_]*)\.([\s\)])/g, 'self.$1$2');
  
  // Ensure proper indentation consistency
  const lines = optimized.split('\n');
  const cleanedLines = lines.map(line => {
    // Remove trailing whitespace
    return line.replace(/\s+$/, '');
  });
  
  return cleanedLines.join('\n');
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
