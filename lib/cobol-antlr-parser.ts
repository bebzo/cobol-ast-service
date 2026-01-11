/**
 * COBOL Parser - Lightweight Version (no ANTLR)
 * Uses regex-based parsing for Vercel serverless compatibility
 */

export interface CobolASTNode {
  type: string;
  name?: string;
  children?: CobolASTNode[];
  value?: string;
  line?: number;
  properties?: Record<string, any>;
}

export interface CobolFullAST {
  programId: string;
  author?: string;
  dateWritten?: string;
  installationDate?: string;
  identificationDivision: CobolASTNode | null;
  environmentDivision: CobolASTNode | null;
  dataDivision: CobolASTNode | null;
  procedureDivision: CobolASTNode | null;
  workingStorageVariables: VariableNode[];
  linkageVariables: VariableNode[];
  fileDescriptions: FileNode[];
  paragraphs: ParagraphNode[];
  sections: SectionNode[];
  copyStatements: string[];
  performStatements: PerformNode[];
  callStatements: CallNode[];
  sqlStatements: SQLNode[];
  metrics: ASTMetrics;
  errors: ParseError[];
}

export interface VariableNode {
  level: number;
  name: string;
  picture?: string;
  usage?: string;
  value?: string;
  occurs?: number;
  redefines?: string;
  indexed?: string[];
  line: number;
  children?: VariableNode[];
}

export interface FileNode {
  name: string;
  recordName?: string;
  organization?: string;
  accessMode?: string;
  line: number;
}

export interface ParagraphNode {
  name: string;
  section?: string;
  lineStart: number;
  lineEnd: number;
  statements: StatementNode[];
  complexity: number;
}

export interface SectionNode {
  name: string;
  lineStart: number;
  lineEnd: number;
  paragraphs: string[];
}

export interface StatementNode {
  type: string;
  line: number;
  target?: string;
  condition?: string;
  details?: Record<string, any>;
}

export interface PerformNode {
  target: string;
  type: 'simple' | 'times' | 'until' | 'varying' | 'thru';
  times?: number;
  condition?: string;
  thruTarget?: string;
  line: number;
}

export interface CallNode {
  program: string;
  using?: string[];
  line: number;
}

export interface SQLNode {
  type: string;
  table?: string;
  operation: string;
  line: number;
  rawSQL?: string;
}

export interface ASTMetrics {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  paragraphCount: number;
  sectionCount: number;
  variableCount: number;
  complexity: number;
  performCount: number;
  callCount: number;
  sqlCount: number;
}

export interface ParseError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Parse COBOL source code into full AST using regex
 */
export function parseCobolWithANTLR(source: string): CobolFullAST {
  const lines = source.split('\n');
  const errors: ParseError[] = [];
  
  // Extract program ID
  const programIdMatch = source.match(/PROGRAM-ID\.\s+(\S+)/i);
  const programId = programIdMatch ? programIdMatch[1].replace('.', '') : 'UNKNOWN';
  
  // Extract author
  const authorMatch = source.match(/AUTHOR\.\s+(.+?)(?:\.|$)/im);
  const author = authorMatch ? authorMatch[1].trim() : undefined;
  
  // Extract date written
  const dateMatch = source.match(/DATE-WRITTEN\.\s+(.+?)(?:\.|$)/im);
  const dateWritten = dateMatch ? dateMatch[1].trim() : undefined;
  
  // Parse variables from WORKING-STORAGE and LINKAGE
  const workingStorageVariables = parseVariables(source, 'WORKING-STORAGE');
  const linkageVariables = parseVariables(source, 'LINKAGE');
  
  // Parse paragraphs
  const paragraphs = parseParagraphs(source);
  
  // Parse sections
  const sections = parseSections(source);
  
  // Parse PERFORM statements
  const performStatements = parsePerformStatements(source);
  
  // Parse CALL statements
  const callStatements = parseCallStatements(source);
  
  // Parse SQL statements
  const sqlStatements = parseSQLStatements(source);
  
  // Parse COPY statements
  const copyStatements = parseCopyStatements(source);
  
  // Parse file descriptions
  const fileDescriptions = parseFileDescriptions(source);
  
  // Calculate metrics
  const metrics = calculateMetrics(source, paragraphs, sections, workingStorageVariables, linkageVariables, performStatements, callStatements, sqlStatements);
  
  return {
    programId,
    author,
    dateWritten,
    installationDate: undefined,
    identificationDivision: createDivisionNode('IDENTIFICATION', source),
    environmentDivision: createDivisionNode('ENVIRONMENT', source),
    dataDivision: createDivisionNode('DATA', source),
    procedureDivision: createDivisionNode('PROCEDURE', source),
    workingStorageVariables,
    linkageVariables,
    fileDescriptions,
    paragraphs,
    sections,
    copyStatements,
    performStatements,
    callStatements,
    sqlStatements,
    metrics,
    errors
  };
}

function createDivisionNode(name: string, source: string): CobolASTNode | null {
  const regex = new RegExp(`${name}\\s+DIVISION`, 'i');
  if (regex.test(source)) {
    return { type: 'division', name: `${name} DIVISION` };
  }
  return null;
}

function parseVariables(source: string, section: string): VariableNode[] {
  const variables: VariableNode[] = [];
  const lines = source.split('\n');
  let inSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(new RegExp(`${section}\\s+SECTION`, 'i'))) {
      inSection = true;
      continue;
    }
    if (inSection && line.match(/^\s*(LINKAGE|PROCEDURE|FILE)\s+SECTION/i)) {
      break;
    }
    if (inSection) {
      const varMatch = line.match(/^\s*(\d{1,2})\s+(\S+)(?:\s+PIC(?:TURE)?\s+(\S+))?/i);
      if (varMatch) {
        const level = parseInt(varMatch[1]);
        const name = varMatch[2].replace('.', '');
        const picture = varMatch[3];
        
        const valueMatch = line.match(/VALUE\s+(?:IS\s+)?["']?([^"'.]+)["']?/i);
        const usageMatch = line.match(/USAGE\s+(?:IS\s+)?(\S+)/i);
        const occursMatch = line.match(/OCCURS\s+(\d+)/i);
        const redefinesMatch = line.match(/REDEFINES\s+(\S+)/i);
        
        variables.push({
          level,
          name,
          picture,
          value: valueMatch ? valueMatch[1].trim() : undefined,
          usage: usageMatch ? usageMatch[1] : undefined,
          occurs: occursMatch ? parseInt(occursMatch[1]) : undefined,
          redefines: redefinesMatch ? redefinesMatch[1] : undefined,
          line: i + 1
        });
      }
    }
  }
  return variables;
}

function parseParagraphs(source: string): ParagraphNode[] {
  const paragraphs: ParagraphNode[] = [];
  const lines = source.split('\n');
  let inProcedure = false;
  let currentParagraph: ParagraphNode | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/PROCEDURE\s+DIVISION/i)) {
      inProcedure = true;
      continue;
    }
    if (inProcedure) {
      // Paragraph definition (name followed by period, not a statement)
      const paraMatch = line.match(/^\s{7}\s*([A-Z0-9][-A-Z0-9]*)\s*\.\s*$/i);
      if (paraMatch && !line.match(/^\s*(MOVE|IF|PERFORM|CALL|ADD|SUBTRACT|MULTIPLY|DIVIDE|COMPUTE|READ|WRITE|OPEN|CLOSE|DISPLAY|ACCEPT|STOP|GO|EXIT|EVALUATE|STRING|UNSTRING|INSPECT|INITIALIZE|SET)/i)) {
        if (currentParagraph) {
          currentParagraph.lineEnd = i;
          paragraphs.push(currentParagraph);
        }
        currentParagraph = {
          name: paraMatch[1],
          lineStart: i + 1,
          lineEnd: i + 1,
          statements: [],
          complexity: 1
        };
      } else if (currentParagraph) {
        // Count complexity
        if (line.match(/\bIF\b/i)) currentParagraph.complexity++;
        if (line.match(/\bEVALUATE\b/i)) currentParagraph.complexity++;
        if (line.match(/\bPERFORM\b.*\bUNTIL\b/i)) currentParagraph.complexity++;
      }
    }
  }
  if (currentParagraph) {
    currentParagraph.lineEnd = lines.length;
    paragraphs.push(currentParagraph);
  }
  return paragraphs;
}

function parseSections(source: string): SectionNode[] {
  const sections: SectionNode[] = [];
  const lines = source.split('\n');
  let currentSection: SectionNode | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const sectionMatch = line.match(/^\s{7}\s*([A-Z0-9][-A-Z0-9]*)\s+SECTION\s*\./i);
    if (sectionMatch) {
      if (currentSection) {
        currentSection.lineEnd = i;
        sections.push(currentSection);
      }
      currentSection = {
        name: sectionMatch[1],
        lineStart: i + 1,
        lineEnd: i + 1,
        paragraphs: []
      };
    }
  }
  if (currentSection) {
    currentSection.lineEnd = lines.length;
    sections.push(currentSection);
  }
  return sections;
}

function parsePerformStatements(source: string): PerformNode[] {
  const performs: PerformNode[] = [];
  const lines = source.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // PERFORM ... THRU
    let match = line.match(/PERFORM\s+(\S+)\s+THRU\s+(\S+)/i);
    if (match) {
      performs.push({ target: match[1], type: 'thru', thruTarget: match[2], line: i + 1 });
      continue;
    }
    
    // PERFORM ... TIMES
    match = line.match(/PERFORM\s+(\S+)\s+(\d+)\s+TIMES/i);
    if (match) {
      performs.push({ target: match[1], type: 'times', times: parseInt(match[2]), line: i + 1 });
      continue;
    }
    
    // PERFORM ... UNTIL
    match = line.match(/PERFORM\s+(\S+)\s+UNTIL\s+(.+)/i);
    if (match) {
      performs.push({ target: match[1], type: 'until', condition: match[2].trim(), line: i + 1 });
      continue;
    }
    
    // PERFORM ... VARYING
    match = line.match(/PERFORM\s+(\S+)\s+VARYING/i);
    if (match) {
      performs.push({ target: match[1], type: 'varying', line: i + 1 });
      continue;
    }
    
    // Simple PERFORM
    match = line.match(/PERFORM\s+([A-Z0-9][-A-Z0-9]*)/i);
    if (match && !line.match(/PERFORM\s+(UNTIL|VARYING|WITH)/i)) {
      performs.push({ target: match[1], type: 'simple', line: i + 1 });
    }
  }
  return performs;
}

function parseCallStatements(source: string): CallNode[] {
  const calls: CallNode[] = [];
  const lines = source.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/CALL\s+["']?(\S+?)["']?(?:\s+USING\s+(.+))?/i);
    if (match) {
      const usingVars = match[2] ? match[2].split(/\s+/).filter(v => v && !v.match(/^(BY|REFERENCE|CONTENT|VALUE)$/i)) : [];
      calls.push({
        program: match[1].replace(/["']/g, ''),
        using: usingVars.length > 0 ? usingVars : undefined,
        line: i + 1
      });
    }
  }
  return calls;
}

function parseSQLStatements(source: string): SQLNode[] {
  const sqls: SQLNode[] = [];
  const sqlBlocks = source.match(/EXEC\s+SQL[\s\S]*?END-EXEC/gi) || [];
  
  for (const block of sqlBlocks) {
    const lineMatch = source.indexOf(block);
    const line = source.substring(0, lineMatch).split('\n').length;
    
    let type = 'UNKNOWN';
    let operation = 'unknown';
    let table: string | undefined;
    
    if (block.match(/SELECT/i)) {
      type = 'SELECT';
      operation = 'read';
      const fromMatch = block.match(/FROM\s+(\S+)/i);
      table = fromMatch ? fromMatch[1] : undefined;
    } else if (block.match(/INSERT/i)) {
      type = 'INSERT';
      operation = 'write';
      const intoMatch = block.match(/INTO\s+(\S+)/i);
      table = intoMatch ? intoMatch[1] : undefined;
    } else if (block.match(/UPDATE/i)) {
      type = 'UPDATE';
      operation = 'write';
      const updateMatch = block.match(/UPDATE\s+(\S+)/i);
      table = updateMatch ? updateMatch[1] : undefined;
    } else if (block.match(/DELETE/i)) {
      type = 'DELETE';
      operation = 'write';
      const deleteMatch = block.match(/FROM\s+(\S+)/i);
      table = deleteMatch ? deleteMatch[1] : undefined;
    } else if (block.match(/DECLARE.*CURSOR/i)) {
      type = 'CURSOR';
      operation = 'cursor';
    } else if (block.match(/OPEN\s+\S+/i)) {
      type = 'OPEN_CURSOR';
      operation = 'cursor';
    } else if (block.match(/FETCH/i)) {
      type = 'FETCH';
      operation = 'read';
    } else if (block.match(/CLOSE\s+\S+/i)) {
      type = 'CLOSE_CURSOR';
      operation = 'cursor';
    }
    
    sqls.push({ type, table, operation, line, rawSQL: block });
  }
  return sqls;
}

function parseCopyStatements(source: string): string[] {
  const copies: string[] = [];
  const matches = source.match(/COPY\s+(\S+)/gi) || [];
  for (const match of matches) {
    const copyMatch = match.match(/COPY\s+(\S+)/i);
    if (copyMatch) {
      copies.push(copyMatch[1].replace('.', ''));
    }
  }
  return copies;
}

function parseFileDescriptions(source: string): FileNode[] {
  const files: FileNode[] = [];
  const lines = source.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fdMatch = line.match(/^\s*FD\s+(\S+)/i);
    if (fdMatch) {
      files.push({
        name: fdMatch[1],
        line: i + 1
      });
    }
    const selectMatch = line.match(/SELECT\s+(\S+)\s+ASSIGN/i);
    if (selectMatch) {
      const orgMatch = line.match(/ORGANIZATION\s+(?:IS\s+)?(\S+)/i);
      const accessMatch = line.match(/ACCESS\s+(?:MODE\s+)?(?:IS\s+)?(\S+)/i);
      files.push({
        name: selectMatch[1],
        organization: orgMatch ? orgMatch[1] : undefined,
        accessMode: accessMatch ? accessMatch[1] : undefined,
        line: i + 1
      });
    }
  }
  return files;
}

function calculateMetrics(
  source: string,
  paragraphs: ParagraphNode[],
  sections: SectionNode[],
  wsVars: VariableNode[],
  linkVars: VariableNode[],
  performs: PerformNode[],
  calls: CallNode[],
  sqls: SQLNode[]
): ASTMetrics {
  const lines = source.split('\n');
  let codeLines = 0;
  let commentLines = 0;
  let blankLines = 0;
  
  for (const line of lines) {
    if (line.trim() === '') {
      blankLines++;
    } else if (line.length > 6 && line[6] === '*') {
      commentLines++;
    } else {
      codeLines++;
    }
  }
  
  const complexity = paragraphs.reduce((sum, p) => sum + p.complexity, 0);
  
  return {
    totalLines: lines.length,
    codeLines,
    commentLines,
    blankLines,
    paragraphCount: paragraphs.length,
    sectionCount: sections.length,
    variableCount: wsVars.length + linkVars.length,
    complexity,
    performCount: performs.length,
    callCount: calls.length,
    sqlCount: sqls.length
  };
}

/**
 * Generate summary from AST
 */
export function generateANTLRSummary(ast: CobolFullAST): string {
  return `Program: ${ast.programId}
Variables: ${ast.workingStorageVariables.length + ast.linkageVariables.length}
Paragraphs: ${ast.paragraphs.length}
Sections: ${ast.sections.length}
PERFORM statements: ${ast.performStatements.length}
CALL statements: ${ast.callStatements.length}
SQL statements: ${ast.sqlStatements.length}
Complexity: ${ast.metrics.complexity}`;
}

/**
 * Generate Python skeleton from AST
 */
export function generatePythonSkeleton(ast: CobolFullAST): string {
  const lines: string[] = [];
  
  lines.push(`"""
Python conversion of COBOL program: ${ast.programId}
Generated by CodeSwitch
"""

from decimal import Decimal
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

`);

  // Generate data class for working storage
  if (ast.workingStorageVariables.length > 0) {
    lines.push('@dataclass');
    lines.push('class WorkingStorage:');
    lines.push('    """WORKING-STORAGE SECTION variables"""');
    
    for (const v of ast.workingStorageVariables) {
      if (v.level === 1 || v.level === 77) {
        const pyType = getPythonType(v.picture);
        const defaultVal = getDefaultValue(v.picture, v.value);
        lines.push(`    ${toSnakeCase(v.name)}: ${pyType} = ${defaultVal}`);
      }
    }
    lines.push('');
  }

  // Generate main class
  lines.push(`class ${toPascalCase(ast.programId)}:`);
  lines.push(`    """Main program class for ${ast.programId}"""`);
  lines.push('');
  lines.push('    def __init__(self):');
  lines.push('        self.ws = WorkingStorage()');
  lines.push('');

  // Generate paragraph methods
  for (const para of ast.paragraphs) {
    lines.push(`    def ${toSnakeCase(para.name)}(self):`);
    lines.push(`        """Paragraph: ${para.name}"""`);
    lines.push('        pass  # TODO: Implement');
    lines.push('');
  }

  // Generate main entry point
  lines.push('    def run(self):');
  lines.push('        """Main entry point"""');
  if (ast.paragraphs.length > 0) {
    lines.push(`        self.${toSnakeCase(ast.paragraphs[0].name)}()`);
  } else {
    lines.push('        pass');
  }
  lines.push('');

  lines.push('');
  lines.push('if __name__ == "__main__":');
  lines.push(`    program = ${toPascalCase(ast.programId)}()`);
  lines.push('    program.run()');

  return lines.join('\n');
}

function getPythonType(picture?: string): string {
  if (!picture) return 'Any';
  if (picture.match(/^9/)) return 'Decimal';
  if (picture.match(/^S9/)) return 'Decimal';
  if (picture.match(/^X/)) return 'str';
  return 'str';
}

function getDefaultValue(picture?: string, value?: string): string {
  if (value) {
    if (picture?.match(/^[S]?9/)) {
      return `Decimal("${value.replace(/['"]/g, '')}")`;
    }
    return `"${value.replace(/['"]/g, '')}"`;
  }
  if (picture?.match(/^[S]?9/)) return 'Decimal("0")';
  return '""';
}

function toSnakeCase(str: string): string {
  return str.toLowerCase().replace(/-/g, '_').replace(/[^a-z0-9_]/g, '');
}

function toPascalCase(str: string): string {
  return str.split(/[-_]/).map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join('');
}
