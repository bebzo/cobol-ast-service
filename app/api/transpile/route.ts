/**
 * Local Python Transpiler API Route
 * 
 * This route calls the Python transpiler (api/transpile.py) directly,
 * ensuring the local transpiler is used instead of external Vercel services.
 */

import { NextRequest, NextResponse } from 'next/server';

// Import the Python transpiler from the local API modules
// Using dynamic import to avoid issues with serverless execution
async function callPythonTranspiler(cobolCode: string, options: any = {}): Promise<any> {
  try {
    // Import the transpile module from the local api directory
    const transpileModule = await import('../../../api/transpile');
    const transpileFunction = transpileModule.generate_python_code || transpileModule.transpile_cobol_to_python;
    
    if (!transpileFunction) {
      throw new Error('Transpile function not found in module');
    }
    
    // Call the transpiler with proper options
    const result = await transpileFunction(cobolCode, options);
    return result;
  } catch (importError: any) {
    console.error('[TranspileLocal] Failed to import transpile module:', importError.message);
    
    // Fallback: try importing from the api directory directly
    try {
      const transpilePath = '../../../api/transpile';
      const transpileModule = await import(transpilePath);
      
      if (typeof transpileModule.generate_python_code === 'function') {
        return await transpileModule.generate_python_code(cobolCode, options);
      }
      
      throw new Error('generate_python_code function not found');
    } catch (fallbackError: any) {
      console.error('[TranspileLocal] Fallback import also failed:', fallbackError.message);
      throw fallbackError;
    }
  }
}

export const runtime = 'nodejs';
export const maxDuration = 120;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cobolCode = body.cobolCode || body.cobolSource;
    const enhance = body.enhance === true;
    const copybooks = body.copybooks || {};
    const allow_stubs = body.allow_stubs !== false; // Default to true
    const exception_mode = body.exception_mode || 'cobol';
    const minified_mode = body.minified_mode === true;
    const production_quality = body.production_quality !== false; // Default to true
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
      python_code: result.python_code,
      pythonCode: result.python_code,
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
