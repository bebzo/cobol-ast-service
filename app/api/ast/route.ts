/**
 * AST Analysis API - Unified Version
 * Uses transpiler-client.ts for parsing, Python API for transpilation
 */
import { NextRequest, NextResponse } from 'next/server';
import { parseCobolQuick, transpileCobolViaPython } from '@/lib/transpiler-client';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const cobol_code = body.cobolCode || body.cobol_code;
    const { chunk_index = 0, chunk_size = 5000, full_parse = false } = body;
    
    if (!cobol_code) {
      return NextResponse.json({
        error: 'Missing cobolCode parameter',
        usage: {
          method: 'POST',
          body: {
            cobolCode: 'string (required)',
            chunkIndex: 'number (optional, default: 0)',
            chunkSize: 'number (optional, default: 5000)',
            fullParse: 'boolean (optional, default: false)'
          }
        }
      }, { status: 400, headers: corsHeaders });
    }
    
    const lines = cobol_code.split('\n');
    const totalLines = lines.length;
    const totalChunks = Math.ceil(totalLines / chunk_size);
    
    // Full parse mode - process everything
    if (full_parse || totalLines <= chunk_size) {
      const ast = parseCobolQuick(cobol_code);
      const pythonResult = await transpileCobolViaPython(cobol_code);
      
      return NextResponse.json({
        success: true,
        mode: 'full',
        stats: {
          total_lines: totalLines,
          python_lines: pythonResult.python_code.split('\n').length,
          paragraphs: ast.paragraphs.length,
          variables: ast.workingStorageVariables.length,
          processing_time_ms: Date.now() - startTime
        },
        ast: {
          program_id: ast.programId,
          divisions: ['IDENTIFICATION', 'DATA', 'PROCEDURE'],
          paragraphs: ast.paragraphs.map(p => ({
            name: p.name,
            line_start: p.lineStart,
            line_end: p.lineEnd
          })),
          variables_count: ast.workingStorageVariables.length
        },
        python_code: pythonResult.python_code,
        metadata: {
          transpiler_version: pythonResult.version,
          chunk_mode: false
        }
      }, { headers: corsHeaders });
    }
    
    // Chunked mode - process specific chunk
    const chunkStart = chunk_index * chunk_size;
    const chunkEnd = Math.min(chunkStart + chunk_size, totalLines);
    
    if (chunkStart >= totalLines) {
      return NextResponse.json({
        error: 'chunk_index out of range',
        total_chunks: totalChunks,
        total_lines: totalLines
      }, { status: 400, headers: corsHeaders });
    }
    
    // Extract chunk with context
    let chunkCode: string;
    if (chunk_index === 0) {
      chunkCode = lines.slice(0, chunkEnd).join('\n');
    } else {
      const headerLines = lines.slice(0, 50).join('\n');
      const chunkLines = lines.slice(chunkStart, chunkEnd).join('\n');
      chunkCode = headerLines + '\n       PROCEDURE DIVISION.\n' + chunkLines;
    }
    
    // Parse and transpile chunk
    const ast = parseCobolQuick(chunkCode);
    const pythonResult = await transpileCobolViaPython(chunkCode);
    
    return NextResponse.json({
      success: true,
      mode: 'chunked',
      chunk: {
        index: chunk_index,
        start_line: chunkStart + 1,
        end_line: chunkEnd,
        lines_in_chunk: chunkEnd - chunkStart
      },
      pagination: {
        total_lines: totalLines,
        total_chunks: totalChunks,
        chunk_size: chunk_size,
        has_next: chunk_index < totalChunks - 1,
        next_chunk: chunk_index < totalChunks - 1 ? chunk_index + 1 : null
      },
      stats: {
        paragraphs_in_chunk: ast.paragraphs.length,
        variables_in_chunk: ast.workingStorageVariables.length,
        python_lines: pythonResult.python_code.split('\n').length,
        processing_time_ms: Date.now() - startTime
      },
      python_code: pythonResult.python_code,
      metadata: {
        transpiler_version: pythonResult.version,
        chunk_mode: true,
        warning: chunk_index > 0 ? 'Chunk includes header context - merge carefully' : undefined
      }
    }, { headers: corsHeaders });
    
  } catch (error: any) {
    console.error('AST API error:', error);
    return NextResponse.json({
      error: 'Processing failed',
      message: error.message,
      processing_time_ms: Date.now() - startTime
    }, { status: 500, headers: corsHeaders });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'CodeSwitch AST API (Unified)',
    version: '4.4.0',
    description: 'COBOL → Python transpilation via unified Python API',
    endpoints: {
      'POST /api/ast': {
        description: 'Transpile COBOL to Python with optional chunking',
        body: {
          cobol_code: 'string (required)',
          chunk_index: 'number (optional)',
          chunk_size: 'number (optional, default: 5000)',
          full_parse: 'boolean (optional)'
        }
      }
    }
  }, { headers: corsHeaders });
}
