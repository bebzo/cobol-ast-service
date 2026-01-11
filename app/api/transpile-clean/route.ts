/**
 * Clean Architecture Transpiler API
 * 
 * Transpiles COBOL to Python with Clean Architecture structure:
 * - domain/ (services, entities)
 * - app/ (orchestrator)
 * - infra/ (repositories)
 * - tests/ (pytest fixtures)
 */
import { NextRequest, NextResponse } from 'next/server';
import { parseCobolWithANTLR } from '@/lib/cobol-antlr-parser';
import { transpileToCleanArchitecture } from '@/lib/cobol-transpiler';

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
    const cobolCode = body.cobolCode || body.cobolSource; // Support both formats

    if (!cobolCode) {
      return NextResponse.json(
        { error: 'cobolCode is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Parse COBOL source
    const ast = parseCobolWithANTLR(cobolCode);
    
    // Transpile to Clean Architecture
    const result = transpileToCleanArchitecture(ast, cobolCode);
    
    // Convert Map to Object for JSON serialization
    const filesObject: Record<string, string> = {};
    for (const [path, content] of result.files) {
      filesObject[path] = content;
    }

    return NextResponse.json({
      files: filesObject,
      stats: result.stats,
      programId: ast.programId
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Transpile Clean Architecture API error:', error);
    return NextResponse.json(
      { error: error.message || 'Transpilation failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}
