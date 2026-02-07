/**
 * Local Python Transpiler API Route
 * 
 * This route calls the Python transpiler (api/transpile.py) directly using subprocess,
 * ensuring the local transpiler is used instead of external Vercel services.
 */

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export const runtime = 'nodejs';
export const maxDuration = 120;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function callPythonTranspiler(cobolCode: string, options: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const outputChunks: Buffer[] = [];
    const errorChunks: Buffer[] = [];
    
    // Create a temporary input file for the transpiler
    const inputData = JSON.stringify({
      cobolCode,
      ...options
    });
    
    // Path to the transpiler script
    const transpilerPath = path.join(process.cwd(), 'api', 'transpile.py');
    const pythonPath = process.env.PYTHON_PATH || 'python3';
    
    console.log('[TranspileLocal] Using transpiler:', transpilerPath);
    
    // Spawn Python process with the transpiler module
    const child = spawn(pythonPath, [
      '-c',
      `
import sys
import json
import os

# Add the api directory to the path
sys.path.insert(0, os.path.join(os.getcwd(), 'api'))

from transpile import generate_python_code

# Read input from stdin
input_data = json.loads(sys.stdin.read())

result = generate_python_code(
    input_data.get('cobolCode', ''),
    enhance=input_data.get('enhance', False),
    cics_commands=input_data.get('cics_commands', []),
    sql_commands=input_data.get('sql_commands', []),
    exception_mode=input_data.get('exception_mode', 'cobol'),
    minified_mode=input_data.get('minified_mode', False),
    production_quality=input_data.get('production_quality', True),
    backend=input_data.get('backend', 'supabase')
)

print(json.dumps(result))
sys.stdout.flush()
`
    ], {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONPATH: path.join(process.cwd(), 'api') }
    });

    // Send input data
    child.stdin.write(inputData);
    child.stdin.end();

    // Collect output
    child.stdout.on('data', (data) => {
      outputChunks.push(Buffer.from(data));
    });

    child.stderr.on('data', (data) => {
      errorChunks.push(Buffer.from(data));
      console.error('[TranspileLocal] Python stderr:', data.toString());
    });

    child.on('error', (error) => {
      console.error('[TranspileLocal] Process error:', error);
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        const errorOutput = Buffer.concat(errorChunks).toString();
        console.error('[TranspileLocal] Process exited with code', code, ':', errorOutput);
        reject(new Error(`Transpiler process failed with code ${code}: ${errorOutput}`));
        return;
      }

      try {
        const output = Buffer.concat(outputChunks).toString();
        const result = JSON.parse(output);
        resolve(result);
      } catch (parseError: any) {
        console.error('[TranspileLocal] Failed to parse output:', parseError);
        console.error('[TranspileLocal] Raw output:', Buffer.concat(outputChunks).toString().slice(0, 500));
        reject(new Error('Failed to parse transpiler output'));
      }
    });
  });
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cobolCode = body.cobolCode || body.cobolSource;
    const enhance = body.enhance === true;
    const copybooks = body.copybooks || {};
    const allow_stubs = body.allow_stubs !== false;
    const exception_mode = body.exception_mode || 'cobol';
    const minified_mode = body.minified_mode === true;
    const production_quality = body.production_quality !== false;
    const backend = body.backend || 'supabase';

    if (!cobolCode) {
      return NextResponse.json(
        { error: 'cobolCode is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('[TranspileLocal] Starting transpilation...');
    console.log(`[TranspileLocal] Options: enhance=${enhance}, allow_stubs=${allow_stubs}, backend=${backend}`);

    // Call the Python transpiler
    const result = await callPythonTranspiler(cobolCode, {
      enhance,
      cics_commands: [],
      sql_commands: [],
      exception_mode,
      minified_mode,
      production_quality,
      backend,
      copybooks,
      allow_stubs
    });

    if (!result || typeof result !== 'object') {
      throw new Error('Invalid result from transpiler');
    }

    if (!result.success) {
      console.warn('[TranspileLocal] Transpiler returned error:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Transpilation failed',
          validation_warnings: result.validation_warnings || []
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Return the result
    return NextResponse.json({
      success: true,
      python_code: result.python_code || '',
      pythonCode: result.python_code || '',
      unit_tests: result.unit_tests || '',
      deterministic_tests: result.deterministic_tests || '',
      version: result.version || '6.0.0',
      architecture: result.architecture || 'Clean Architecture',
      stats: result.stats || {},
      confidence_score: result.confidence_score || 100,
      business_patterns: result.business_patterns || [],
      copybook_stats: result.copybook_stats,
      error: result.error,
      validation_warnings: result.validation_warnings || []
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[TranspileLocal] Error:', error.message);
    console.error('[TranspileLocal] Stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Transpilation failed',
        python_code: '',
        pythonCode: '',
        unit_tests: ''
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
