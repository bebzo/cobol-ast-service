/**
 * API Route: /api/validate
 * Validates Python code using AST and attempts auto-repair.
 * v9.4
 */
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

interface ValidationResult {
  valid: boolean;
  error?: string;
  line?: number;
  repaired?: boolean;
  repairs?: string[];
  repaired_code?: string;
  issues: Array<{
    type: string;
    severity: string;
    line?: number;
    message: string;
  }>;
  stats: {
    total_methods: number;
    problematic_methods: number;
    total_issues: number;
  };
}

async function validatePython(code: string): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const pythonScript = path.join(process.cwd(), 'lib', 'ast_validator.py');
    const python = spawn('python3', [pythonScript], {
      cwd: process.cwd(),
    });
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (exitCode) => {
      if (exitCode !== 0 || !stdout) {
        resolve({
          valid: false,
          error: stderr || 'Python validation failed',
          issues: [{
            type: 'execution_error',
            severity: 'CRITICAL',
            message: stderr || 'Validation process failed'
          }],
          stats: { total_methods: 0, problematic_methods: 0, total_issues: 1 }
        });
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        resolve({
          valid: false,
          error: 'Failed to parse validation result',
          issues: [{
            type: 'parse_error',
            severity: 'CRITICAL',
            message: 'Invalid JSON from validator'
          }],
          stats: { total_methods: 0, problematic_methods: 0, total_issues: 1 }
        });
      }
    });
    
    // Send code to stdin
    python.stdin.write(code);
    python.stdin.end();
    
    // Timeout after 10 seconds
    setTimeout(() => {
      python.kill();
      resolve({
        valid: false,
        error: 'Validation timeout',
        issues: [{
          type: 'timeout',
          severity: 'CRITICAL',
          message: 'Validation took too long'
        }],
        stats: { total_methods: 0, problematic_methods: 0, total_issues: 1 }
      });
    }, 10000);
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid code parameter' },
        { status: 400 }
      );
    }
    
    const result = await validatePython(code);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { 
        valid: false,
        error: 'Internal server error',
        issues: [{
          type: 'server_error',
          severity: 'CRITICAL',
          message: String(error)
        }],
        stats: { total_methods: 0, problematic_methods: 0, total_issues: 1 }
      },
      { status: 500 }
    );
  }
}
