/**
 * Batch Processing API v9.2
 * 
 * Handles ZIP file uploads containing multiple .cbl files
 * Processes all files in parallel and returns aggregated results
 */

import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

// Reuse the analyse logic
async function analyseCobol(cobolCode: string, filename: string): Promise<any> {
  // Call the existing analyse endpoint internally
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/analyse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cobolCode, filename })
    });
    
    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return {
      filename,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const zipFile = formData.get('zipFile') as File | null;
    
    if (!zipFile) {
      return NextResponse.json({ error: 'No ZIP file provided' }, { status: 400 });
    }
    
    // Read ZIP file
    const arrayBuffer = await zipFile.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Extract .cbl files
    const cobolFiles: { name: string; content: string }[] = [];
    
    await Promise.all(
      Object.keys(zip.files).map(async (filename) => {
        if (filename.toLowerCase().endsWith('.cbl') || 
            filename.toLowerCase().endsWith('.cob') ||
            filename.toLowerCase().endsWith('.cobol')) {
          const file = zip.files[filename];
          if (!file.dir) {
            const content = await file.async('string');
            cobolFiles.push({ 
              name: filename.split('/').pop() || filename, 
              content 
            });
          }
        }
      })
    );
    
    if (cobolFiles.length === 0) {
      return NextResponse.json({ 
        error: 'No COBOL files found in ZIP (.cbl, .cob, .cobol)' 
      }, { status: 400 });
    }
    
    // Process files in parallel with concurrency limit
    const BATCH_SIZE = 5; // Process 5 files at a time
    const results: any[] = [];
    
    for (let i = 0; i < cobolFiles.length; i += BATCH_SIZE) {
      const batch = cobolFiles.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(file => analyseCobol(file.content, file.name))
      );
      results.push(...batchResults);
    }
    
    // Aggregate statistics
    const successful = results.filter(r => r.success !== false && !r.error);
    const failed = results.filter(r => r.success === false || r.error);
    
    const totalCobolLines = results.reduce((sum, r) => sum + (r.cobol_lines || 0), 0);
    const totalPythonLines = results.reduce((sum, r) => sum + (r.python_lines || 0), 0);
    const avgConfidence = successful.length > 0
      ? Math.round(successful.reduce((sum, r) => {
          const conf = r.migration_score?.confidence;
          return sum + (typeof conf === 'number' ? conf : parseInt(String(conf || '0').replace(/[^0-9]/g, '')) || 0);
        }, 0) / successful.length)
      : 0;
    
    // Aggregate issues and improvements
    const allIssues = results.flatMap(r => (r.issues || []).map((issue: string) => ({
      file: r.filename || 'unknown',
      issue
    })));
    
    const allSecurityWarnings = results.flatMap(r => (r.security_warnings || []).map((w: any) => ({
      file: r.filename || 'unknown',
      ...w
    })));
    
    return NextResponse.json({
      success: true,
      summary: {
        totalFiles: cobolFiles.length,
        successfulConversions: successful.length,
        failedConversions: failed.length,
        totalCobolLines,
        totalPythonLines,
        averageConfidence: avgConfidence,
        issuesCount: allIssues.length,
        securityWarningsCount: allSecurityWarnings.length
      },
      results: results.map(r => ({
        filename: r.filename,
        success: r.success !== false && !r.error,
        cobol_lines: r.cobol_lines,
        python_lines: r.python_lines,
        code_valid: r.code_valid,
        confidence: r.migration_score?.confidence,
        issues_count: (r.issues || []).length,
        error: r.error
      })),
      aggregated: {
        issues: allIssues.slice(0, 50), // Limit to 50
        security_warnings: allSecurityWarnings.slice(0, 20)
      },
      // Include full results for download
      fullResults: results.map(r => ({
        filename: r.filename,
        python_code: r.python_code,
        unit_tests: r.unit_tests,
        summary: r.summary
      }))
    });
    
  } catch (error) {
    console.error('Batch processing error:', error);
    return NextResponse.json({ 
      error: 'Batch processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    version: '9.2',
    capabilities: ['zip', 'parallel', 'batch']
  });
}
