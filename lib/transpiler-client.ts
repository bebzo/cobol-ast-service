/**
 * Transpiler Client - Unified API Gateway
 * 
 * This module is the SINGLE entry point for transpilation.
 * It calls the Python transpiler (api/transpile.py) which is the source of truth.
 * 
 * Architecture:
 * - TypeScript routes (app/api/*) → this client → Python transpiler
 * - This eliminates code duplication between TS and Python transpilers
 */

export interface TranspileResult {
  success: boolean;
  python_code: string;
  pythonCode: string;
  unit_tests: string;
  version: string;
  architecture: string;
  stats: {
    variables: number;
    paragraphs: number;
    program_id: string;
    gemini_calls?: number;
    enriched?: number;
    failed?: number;
  };
  copybook_stats?: {
    copybooks_found: number;
    copybooks_resolved: number;
    copybooks_missing: string[];
    replacements_applied: number;
  };
  error?: string;
}

export interface ParseResult {
  programId: string;
  workingStorageVariables: VariableInfo[];
  paragraphs: ParagraphInfo[];
}

export interface VariableInfo {
  level: number;
  name: string;
  picture?: string;
  value?: string;
  line: number;
}

export interface ParagraphInfo {
  name: string;
  lineStart: number;
  lineEnd: number;
  statements: string[];
}

/**
 * Call the Python transpiler API
 * Works both locally and on Vercel (internal routing)
 */
export async function transpileCobolViaPython(
  cobolCode: string, 
  enhance: boolean = false,
  copybooks?: Record<string, string>
): Promise<TranspileResult> {
  try {
    // Optimized routing: use relative URL for internal Vercel calls
    // On Vercel serverless, relative URLs use internal fast routing
    // On client-side, relative URLs work naturally via same domain
    const isServer = typeof window === 'undefined';
    const baseUrl = isServer 
      ? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
      : ''; // Client-side: relative URL
    
    console.log(`[Transpiler] Calling ${baseUrl || 'relative'}/api/transpile`);
    
    // Optimized timeout: 60s for normal files, faster feedback on issues
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    const response = await fetch(`${baseUrl}/api/transpile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cobolCode, enhance, copybooks: copybooks || {} }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Transpiler API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Normalize response format
    return {
      success: result.success ?? true,
      python_code: result.python_code || result.pythonCode || '',
      pythonCode: result.python_code || result.pythonCode || '',
      unit_tests: result.unit_tests || '',
      version: result.version || '4.5.0',
      architecture: result.architecture || 'Clean Architecture',
      stats: result.stats || {},
      copybook_stats: result.copybook_stats,
      error: result.error,
    };
  } catch (error: any) {
    return {
      success: false,
      python_code: '',
      pythonCode: '',
      unit_tests: '',
      version: '4.4.0',
      architecture: 'Clean Architecture',
      stats: { variables: 0, paragraphs: 0, program_id: 'UNKNOWN' },
      error: error.message || 'Transpilation failed',
    };
  }
}

/**
 * Quick COBOL parser (lightweight, no Python call)
 * For UI progress display and basic validation
 */
export function parseCobolQuick(cobolCode: string): ParseResult {
  const lines = cobolCode.split('\n');
  
  // Extract program ID
  const programMatch = cobolCode.match(/PROGRAM-ID\.\s+(\S+)/i);
  const programId = programMatch ? programMatch[1].replace('.', '') : 'UNKNOWN';
  
  // Extract variables (simplified)
  const variables: VariableInfo[] = [];
  let inWorkingStorage = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upper = line.toUpperCase();
    
    if (upper.includes('WORKING-STORAGE') && upper.includes('SECTION')) {
      inWorkingStorage = true;
      continue;
    }
    if (inWorkingStorage && (upper.includes('PROCEDURE') || upper.includes('LINKAGE'))) {
      break;
    }
    
    if (inWorkingStorage) {
      const match = line.match(/^\s*(\d{1,2})\s+([A-Z][A-Z0-9-]*)/i);
      if (match) {
        const picMatch = line.match(/PIC(?:TURE)?\s+(?:IS\s+)?([SX9AV0-9()+-.,]+)/i);
        const valueMatch = line.match(/VALUE\s+(?:IS\s+)?(?:ZEROS?|SPACES?|["']([^"']+)["']|(\S+))/i);
        
        variables.push({
          level: parseInt(match[1]),
          name: match[2].replace('.', ''),
          picture: picMatch ? picMatch[1] : undefined,
          value: valueMatch ? (valueMatch[1] || valueMatch[2]) : undefined,
          line: i + 1,
        });
      }
    }
  }
  
  // Extract paragraphs (simplified)
  const paragraphs: ParagraphInfo[] = [];
  let inProcedure = false;
  let currentPara: ParagraphInfo | null = null;
  
  const reserved = new Set([
    'MOVE', 'IF', 'ELSE', 'END-IF', 'PERFORM', 'COMPUTE', 'ADD', 'SUBTRACT',
    'MULTIPLY', 'DIVIDE', 'DISPLAY', 'ACCEPT', 'READ', 'WRITE', 'OPEN', 'CLOSE',
    'CALL', 'STOP', 'GOBACK', 'EXIT', 'EVALUATE', 'WHEN', 'END-EVALUATE'
  ]);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upper = line.toUpperCase().trim();
    
    if (upper.includes('PROCEDURE') && upper.includes('DIVISION')) {
      inProcedure = true;
      continue;
    }
    
    if (!inProcedure) continue;
    
    const paraMatch = line.match(/^\s*([A-Z0-9][A-Z0-9-]*)\s*\.\s*$/i);
    if (paraMatch) {
      const name = paraMatch[1].toUpperCase();
      if (!reserved.has(name) && !name.startsWith('END-')) {
        if (currentPara) {
          currentPara.lineEnd = i;
          paragraphs.push(currentPara);
        }
        currentPara = {
          name,
          lineStart: i + 1,
          lineEnd: i + 1,
          statements: [],
        };
        continue;
      }
    }
    
    if (currentPara && upper) {
      currentPara.statements.push(line.trim());
    }
  }
  
  if (currentPara) {
    currentPara.lineEnd = lines.length;
    paragraphs.push(currentPara);
  }
  
  return { programId, workingStorageVariables: variables, paragraphs };
}

/**
 * Validate COBOL input with clear error messages
 */
export function validateCobolInput(code: string): { valid: boolean; reason?: string } {
  if (!code || code.trim().length < 50) {
    return { valid: false, reason: '⚠️ Code trop court. Veuillez charger un fichier COBOL valide (.cbl)' };
  }
  
  // Detect specific languages with clear messages
  const languagePatterns: { pattern: RegExp; lang: string }[] = [
    { pattern: /^from\s+\w+\s+import|^import\s+\w+|^def\s+\w+\(|^class\s+\w+.*:/m, lang: 'Python' },
    { pattern: /^#include|^int\s+main\s*\(|^void\s+\w+\s*\(/m, lang: 'C/C++' },
    { pattern: /^public\s+class|^private\s+class|^package\s+\w+/m, lang: 'Java' },
    { pattern: /^function\s+\w+|^const\s+\w+\s*=|^let\s+\w+\s*=|^var\s+\w+\s*=/m, lang: 'JavaScript' },
    { pattern: /^using\s+System|^namespace\s+\w+|^public\s+static\s+void/m, lang: 'C#' },
    { pattern: /^require\s*\(|^module\.exports/m, lang: 'Node.js' },
  ];
  
  for (const { pattern, lang } of languagePatterns) {
    if (pattern.test(code)) {
      return { 
        valid: false, 
        reason: `❌ Ce fichier contient du code ${lang}, pas du COBOL. CodeSwitch convertit uniquement COBOL → Python. Veuillez charger un fichier .cbl` 
      };
    }
  }
  
  const upper = code.toUpperCase();
  const hasDivision = ['IDENTIFICATION DIVISION', 'PROCEDURE DIVISION'].some(d => upper.includes(d));
  
  if (!hasDivision) {
    return { 
      valid: false, 
      reason: '❌ Aucune DIVISION COBOL trouvée (IDENTIFICATION DIVISION, PROCEDURE DIVISION). Veuillez charger un fichier COBOL valide (.cbl)' 
    };
  }
  
  return { valid: true };
}
