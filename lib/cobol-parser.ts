/**
 * COBOL AST Parser - Production Grade
 * Parses COBOL source code into structured AST
 */

export interface CobolVariable {
  level: number;
  name: string;
  picture?: string;
  usage?: string;
  value?: string;
  occurs?: number;
  redefines?: string;
  lineNumber: number;
}

export interface CobolParagraph {
  name: string;
  lineStart: number;
  lineEnd: number;
  statements: string[];
  calls: string[];  // PERFORM references
  complexity: number;
}

export interface CobolSection {
  name: string;
  lineStart: number;
  lineEnd: number;
  paragraphs: CobolParagraph[];
}

export interface CobolDivision {
  name: string;
  lineStart: number;
  lineEnd: number;
  content: string[];
  sections?: CobolSection[];
  variables?: CobolVariable[];
}

export interface CobolAST {
  programId: string;
  author?: string;
  dateWritten?: string;
  divisions: {
    identification?: CobolDivision;
    environment?: CobolDivision;
    data?: CobolDivision;
    procedure?: CobolDivision;
  };
  workingStorage: CobolVariable[];
  linkage: CobolVariable[];
  fileSection: CobolVariable[];
  paragraphs: CobolParagraph[];
  sections: CobolSection[];
  copybooks: string[];
  metrics: {
    totalLines: number;
    codeLines: number;
    commentLines: number;
    blankLines: number;
    variableCount: number;
    paragraphCount: number;
    complexity: number;
    performCount: number;
    gotoCount: number;
    evalCount: number;
    sqlCount: number;
  };
  issues: string[];
  patterns: string[];
}

export function parseCobol(source: string): CobolAST {
  const lines = source.split('\n');
  const ast: CobolAST = {
    programId: 'UNKNOWN',
    divisions: {},
    workingStorage: [],
    linkage: [],
    fileSection: [],
    paragraphs: [],
    sections: [],
    copybooks: [],
    metrics: {
      totalLines: lines.length,
      codeLines: 0,
      commentLines: 0,
      blankLines: 0,
      variableCount: 0,
      paragraphCount: 0,
      complexity: 0,
      performCount: 0,
      gotoCount: 0,
      evalCount: 0,
      sqlCount: 0,
    },
    issues: [],
    patterns: [],
  };

  let currentDivision: string | null = null;
  let currentSection: string | null = null;
  let currentParagraph: CobolParagraph | null = null;
  let inWorkingStorage = false;
  let inLinkage = false;
  let inFileSection = false;
  let inProcedure = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();
    const upper = trimmed.toUpperCase();

    // Count line types
    if (!trimmed) {
      ast.metrics.blankLines++;
      continue;
    }
    
    // COBOL comment (column 7 = *)
    if (line.length >= 7 && line[6] === '*') {
      ast.metrics.commentLines++;
      continue;
    }
    
    ast.metrics.codeLines++;

    // Extract PROGRAM-ID
    const programIdMatch = upper.match(/PROGRAM-ID\.\s*([A-Z0-9-]+)/);
    if (programIdMatch) {
      ast.programId = programIdMatch[1];
    }

    // Extract AUTHOR
    const authorMatch = upper.match(/AUTHOR\.\s*(.+)/);
    if (authorMatch) {
      ast.author = authorMatch[1].replace('.', '').trim();
    }

    // Detect DIVISIONS
    if (upper.includes('IDENTIFICATION DIVISION')) {
      currentDivision = 'identification';
      ast.divisions.identification = { name: 'IDENTIFICATION', lineStart: lineNum, lineEnd: lineNum, content: [] };
    } else if (upper.includes('ENVIRONMENT DIVISION')) {
      currentDivision = 'environment';
      ast.divisions.environment = { name: 'ENVIRONMENT', lineStart: lineNum, lineEnd: lineNum, content: [] };
    } else if (upper.includes('DATA DIVISION')) {
      currentDivision = 'data';
      ast.divisions.data = { name: 'DATA', lineStart: lineNum, lineEnd: lineNum, content: [] };
    } else if (upper.includes('PROCEDURE DIVISION')) {
      currentDivision = 'procedure';
      inProcedure = true;
      ast.divisions.procedure = { name: 'PROCEDURE', lineStart: lineNum, lineEnd: lineNum, content: [], sections: [] };
    }

    // Detect SECTIONS in DATA DIVISION
    if (upper.includes('WORKING-STORAGE SECTION')) {
      inWorkingStorage = true;
      inLinkage = false;
      inFileSection = false;
      currentSection = 'WORKING-STORAGE';
    } else if (upper.includes('LINKAGE SECTION')) {
      inLinkage = true;
      inWorkingStorage = false;
      inFileSection = false;
      currentSection = 'LINKAGE';
    } else if (upper.includes('FILE SECTION')) {
      inFileSection = true;
      inWorkingStorage = false;
      inLinkage = false;
      currentSection = 'FILE';
    }

    // Parse variables (01-77 level)
    const varMatch = trimmed.match(/^(\d{2})\s+([A-Z0-9-]+)(.*)$/i);
    if (varMatch && (inWorkingStorage || inLinkage || inFileSection)) {
      const level = parseInt(varMatch[1]);
      const name = varMatch[2].toUpperCase();
      const rest = varMatch[3].toUpperCase();

      const variable: CobolVariable = {
        level,
        name,
        lineNumber: lineNum,
      };

      // Extract PIC clause
      const picMatch = rest.match(/PIC(?:TURE)?\s+([SXA9()V+-]+)/);
      if (picMatch) {
        variable.picture = picMatch[1];
      }

      // Extract VALUE clause
      const valueMatch = rest.match(/VALUE\s+(['"]?[^.'"\s]+['"]?|SPACES?|ZEROS?|LOW-VALUES?|HIGH-VALUES?)/);
      if (valueMatch) {
        variable.value = valueMatch[1];
      }

      // Extract OCCURS clause
      const occursMatch = rest.match(/OCCURS\s+(\d+)/);
      if (occursMatch) {
        variable.occurs = parseInt(occursMatch[1]);
      }

      // Extract USAGE clause
      const usageMatch = rest.match(/USAGE\s+(COMP(?:-\d)?|BINARY|PACKED-DECIMAL|DISPLAY)/);
      if (usageMatch) {
        variable.usage = usageMatch[1];
      }

      // Extract REDEFINES
      const redefinesMatch = rest.match(/REDEFINES\s+([A-Z0-9-]+)/);
      if (redefinesMatch) {
        variable.redefines = redefinesMatch[1];
      }

      if (inWorkingStorage) ast.workingStorage.push(variable);
      else if (inLinkage) ast.linkage.push(variable);
      else if (inFileSection) ast.fileSection.push(variable);

      ast.metrics.variableCount++;
    }

    // Parse paragraphs in PROCEDURE DIVISION
    if (inProcedure && !upper.includes('DIVISION') && !upper.includes('SECTION')) {
      // Paragraph definition (name followed by period at start of line after column 8)
      const paragraphMatch = trimmed.match(/^([A-Z0-9-]+)\s*\.$/);
      if (paragraphMatch && !['EXIT', 'STOP', 'GOBACK'].includes(paragraphMatch[1])) {
        // Save previous paragraph
        if (currentParagraph) {
          currentParagraph.lineEnd = lineNum - 1;
          ast.paragraphs.push(currentParagraph);
        }

        currentParagraph = {
          name: paragraphMatch[1],
          lineStart: lineNum,
          lineEnd: lineNum,
          statements: [],
          calls: [],
          complexity: 1,
        };
        ast.metrics.paragraphCount++;
      } else if (currentParagraph) {
        // Add statement to current paragraph
        currentParagraph.statements.push(trimmed);

        // Track PERFORM calls
        const performMatch = upper.match(/PERFORM\s+([A-Z0-9-]+)/);
        if (performMatch) {
          currentParagraph.calls.push(performMatch[1]);
          ast.metrics.performCount++;
        }

        // Track complexity
        if (upper.includes('IF ') || upper.includes('EVALUATE ')) {
          currentParagraph.complexity++;
          ast.metrics.complexity++;
        }
        if (upper.includes('EVALUATE ')) {
          ast.metrics.evalCount++;
        }
      }
    }

    // Track COPY statements
    const copyMatch = upper.match(/COPY\s+([A-Z0-9-]+)/);
    if (copyMatch) {
      ast.copybooks.push(copyMatch[1]);
    }

    // Track potential issues
    if (upper.includes('GO TO')) {
      ast.metrics.gotoCount++;
      if (!ast.issues.includes('GO TO statements detected - consider refactoring')) {
        ast.issues.push('GO TO statements detected - consider refactoring');
      }
    }

    if (upper.includes('EXEC SQL') || upper.includes('EXEC CICS')) {
      ast.metrics.sqlCount++;
      if (!ast.patterns.includes('Embedded SQL/CICS')) {
        ast.patterns.push('Embedded SQL/CICS');
      }
    }

    // Update division end lines
    if (ast.divisions.identification && currentDivision === 'identification') {
      ast.divisions.identification.lineEnd = lineNum;
    }
    if (ast.divisions.environment && currentDivision === 'environment') {
      ast.divisions.environment.lineEnd = lineNum;
    }
    if (ast.divisions.data && currentDivision === 'data') {
      ast.divisions.data.lineEnd = lineNum;
    }
    if (ast.divisions.procedure && currentDivision === 'procedure') {
      ast.divisions.procedure.lineEnd = lineNum;
    }
  }

  // Close last paragraph
  if (currentParagraph) {
    currentParagraph.lineEnd = lines.length;
    ast.paragraphs.push(currentParagraph);
  }

  // Detect patterns
  if (ast.workingStorage.some(v => v.picture?.includes('9') && v.picture?.includes('V'))) {
    ast.patterns.push('Decimal arithmetic');
  }
  if (ast.workingStorage.some(v => v.name.includes('DATE') || v.name.includes('TIME'))) {
    ast.patterns.push('Date/Time processing');
  }
  if (ast.metrics.performCount > 10) {
    ast.patterns.push('Modular structure');
  }
  if (ast.copybooks.length > 0) {
    ast.patterns.push('Uses copybooks');
  }

  // Calculate overall complexity
  ast.metrics.complexity += ast.metrics.gotoCount * 2;
  ast.metrics.complexity += ast.metrics.evalCount;
  ast.metrics.complexity += Math.floor(ast.metrics.variableCount / 20);

  return ast;
}

/**
 * Generate a summary of the AST for Gemini analysis
 */
export function generateASTSummary(ast: CobolAST): string {
  return JSON.stringify({
    programId: ast.programId,
    author: ast.author,
    metrics: ast.metrics,
    structure: {
      divisions: Object.keys(ast.divisions),
      workingStorageVars: ast.workingStorage.length,
      linkageVars: ast.linkage.length,
      paragraphs: ast.paragraphs.map(p => ({ name: p.name, complexity: p.complexity, calls: p.calls })),
      copybooks: ast.copybooks,
    },
    patterns: ast.patterns,
    issues: ast.issues,
    sampleVariables: ast.workingStorage.slice(0, 20).map(v => ({
      level: v.level,
      name: v.name,
      picture: v.picture,
      value: v.value,
    })),
    sampleCode: ast.paragraphs.slice(0, 5).map(p => ({
      name: p.name,
      statements: p.statements.slice(0, 10),
    })),
  }, null, 2);
}
