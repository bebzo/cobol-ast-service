import { NextRequest, NextResponse } from 'next/server';
import { parseCobolWithANTLR, CobolFullAST } from '@/lib/cobol-antlr-parser';
import { transpileCobol } from '@/lib/cobol-transpiler';

/**
 * CodeSwitch AST API v1.0 - Chunked Processing
 * 
 * Handles large COBOL files by processing in chunks.
 * Supports files > 250kLOC via pagination.
 * 
 * Usage:
 *   POST /api/ast
 *   Body: { cobol_code: string, chunk_index?: number, chunk_size?: number }
 * 
 *   - chunk_size: lines per chunk (default: 5000)
 *   - chunk_index: 0-based chunk number (default: 0)
 */

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
    const { cobol_code, chunk_index = 0, chunk_size = 5000, full_parse = false } = body;
    
    if (!cobol_code) {
      return NextResponse.json({
        error: 'Missing cobol_code parameter',
        usage: {
          method: 'POST',
          body: {
            cobol_code: 'string (required)',
            chunk_index: 'number (optional, default: 0)',
            chunk_size: 'number (optional, default: 5000)',
            full_parse: 'boolean (optional, default: false)'
          }
        }
      }, { status: 400, headers: corsHeaders });
    }
    
    const lines = cobol_code.split('\n');
    const totalLines = lines.length;
    const totalChunks = Math.ceil(totalLines / chunk_size);
    
    // Full parse mode - process everything (for smaller files)
    if (full_parse || totalLines <= chunk_size) {
      const ast = parseCobolWithANTLR(cobol_code);
      const pythonResult = transpileCobol(ast, cobol_code);
      
      return NextResponse.json({
        success: true,
        mode: 'full',
        stats: {
          total_lines: totalLines,
          python_lines: pythonResult.pythonCode.split('\n').length,
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
            line_end: p.lineEnd,
            complexity: p.complexity
          })),
          variables_count: ast.workingStorageVariables.length,
          copybooks: ast.copyStatements || []
        },
        python_code: pythonResult.pythonCode,
        metadata: {
          transpiler_version: '1.0.0',
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
    
    // Extract chunk with context (include headers for first chunk)
    let chunkCode: string;
    if (chunk_index === 0) {
      // First chunk includes everything up to chunkEnd
      chunkCode = lines.slice(0, chunkEnd).join('\n');
    } else {
      // Subsequent chunks need PROCEDURE DIVISION header for context
      const headerLines = lines.slice(0, 50).join('\n'); // First 50 lines for context
      const chunkLines = lines.slice(chunkStart, chunkEnd).join('\n');
      chunkCode = headerLines + '\n       PROCEDURE DIVISION.\n' + chunkLines;
    }
    
    // Parse and transpile chunk
    const ast = parseCobolWithANTLR(chunkCode);
    const pythonResult = transpileCobol(ast, chunkCode);
    
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
        python_lines: pythonResult.pythonCode.split('\n').length,
        processing_time_ms: Date.now() - startTime
      },
      python_code: pythonResult.pythonCode,
      metadata: {
        transpiler_version: '1.0.0',
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
    name: 'CodeSwitch AST API',
    version: '1.0.0',
    description: 'Chunked COBOL → Python transpilation for large files',
    endpoints: {
      'POST /api/ast': {
        description: 'Transpile COBOL to Python with optional chunking',
        body: {
          cobol_code: 'string (required) - COBOL source code',
          chunk_index: 'number (optional) - 0-based chunk index for large files',
          chunk_size: 'number (optional) - lines per chunk (default: 5000)',
          full_parse: 'boolean (optional) - force full parsing'
        },
        response: {
          success: 'boolean',
          mode: '"full" | "chunked"',
          python_code: 'string',
          stats: 'object',
          pagination: 'object (if chunked)'
        }
      }
    },
    limits: {
      max_chunk_size: 10000,
      recommended_chunk_size: 5000,
      timeout_seconds: 120
    }
  }, { headers: corsHeaders });
}
