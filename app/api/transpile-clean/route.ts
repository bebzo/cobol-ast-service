/**
 * Clean Architecture Transpiler API
 * Uses unified Python transpiler (api/transpile.py) as source of truth
 */
import { NextRequest, NextResponse } from 'next/server';
import { transpileCobolViaPython, parseCobolQuick } from '@/lib/transpiler-client';

export const runtime = 'nodejs';

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

    if (!cobolCode) {
      return NextResponse.json(
        { error: 'cobolCode is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Parse for metadata
    const parsed = parseCobolQuick(cobolCode);
    
    // Transpile via unified Python API
    const result = await transpileCobolViaPython(cobolCode, false);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Transpilation failed' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Format as Clean Architecture structure
    const className = parsed.programId.replace(/-/g, '_');
    const files: Record<string, string> = {
      [`domain/${className.toLowerCase()}_service.py`]: result.python_code,
      [`tests/test_${className.toLowerCase()}.py`]: result.unit_tests,
    };

    return NextResponse.json({
      files,
      stats: result.stats,
      programId: parsed.programId,
      version: result.version
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Transpile Clean Architecture API error:', error);
    return NextResponse.json(
      { error: error.message || 'Transpilation failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}
