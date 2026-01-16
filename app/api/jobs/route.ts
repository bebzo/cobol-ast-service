/**
 * Jobs API - Async Transpilation for Large COBOL Files
 * Uses unified Python transpiler (api/transpile.py)
 * 
 * POST /api/jobs - Create new transpilation job
 * GET /api/jobs - List user's jobs
 * GET /api/jobs?id=xxx - Get job status
 * DELETE /api/jobs?id=xxx - Cancel pending job
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createJob, 
  getJob, 
  getUserJobs, 
  cancelJob,
  completeJob,
  getQueueStats
} from '@/lib/job-queue';
import { logAudit } from '@/lib/audit-logger';
import { parseCobolQuick, transpileCobolViaPython } from '@/lib/transpiler-client';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-user-id, x-user-email',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * POST - Create a new transpilation job
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cobol_code, file_name, webhook_url, webhook_secret } = body;
    
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    
    // Require authentication - no anonymous transpilation allowed
    if (!userId || !userEmail) {
      return NextResponse.json({
        error: 'Authentication required',
        message: 'Please sign in to use the transpilation service'
      }, { status: 401, headers: corsHeaders });
    }
    
    if (!cobol_code) {
      return NextResponse.json({
        error: 'Missing cobol_code parameter'
      }, { status: 400, headers: corsHeaders });
    }
    
    const lines = cobol_code.split('\n').length;
    
    // For small files (< 5000 lines), process immediately
    if (lines < 5000) {
      const startTime = Date.now();
      const result = await transpileCobolViaPython(cobol_code);
      
      logAudit({
        action: 'TRANSPILE',
        userId,
        userEmail,
        userRole: 'developer',
        resource: file_name || 'inline_code',
        details: { lines, immediate: true },
        success: result.success
      });
      
      return NextResponse.json({
        mode: 'immediate',
        success: result.success,
        pythonCode: result.python_code,
        stats: {
          ...result.stats,
          processingTimeMs: Date.now() - startTime
        }
      }, { headers: corsHeaders });
    }
    
    // For large files, create async job
    const job = createJob({
      userId,
      userEmail,
      fileName: file_name || 'large_file.cbl',
      cobolCode: cobol_code,
      webhookUrl: webhook_url,
      webhookSecret: webhook_secret
    });
    
    logAudit({
      action: 'JOB_SUBMIT',
      userId,
      userEmail,
      userRole: 'developer',
      resource: file_name || 'large_file.cbl',
      resourceId: job.id,
      details: { lines, chunks: job.totalChunks },
      success: true
    });
    
    // Start async processing
    processJobAsync(job.id);
    
    return NextResponse.json({
      mode: 'async',
      job: {
        id: job.id,
        status: job.status,
        totalLines: job.totalLines,
        totalChunks: job.totalChunks,
        estimatedTimeSeconds: Math.ceil(job.totalLines / 1000) * 2
      },
      message: 'Job queued for processing',
      pollUrl: `/api/jobs?id=${job.id}`
    }, { status: 202, headers: corsHeaders });
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to create job',
      message: error.message
    }, { status: 500, headers: corsHeaders });
  }
}

/**
 * GET - Get job status or list jobs
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('id');
  const userId = request.headers.get('x-user-id');
  
  // Require authentication
  if (!userId) {
    return NextResponse.json({
      error: 'Authentication required'
    }, { status: 401, headers: corsHeaders });
  }
  
  if (jobId) {
    const job = getJob(jobId);
    
    if (!job) {
      return NextResponse.json({
        error: 'Job not found'
      }, { status: 404, headers: corsHeaders });
    }
    
    return NextResponse.json({
      job: {
        id: job.id,
        status: job.status,
        fileName: job.fileName,
        totalLines: job.totalLines,
        processedLines: job.processedLines,
        currentChunk: job.currentChunk,
        totalChunks: job.totalChunks,
        progress: job.totalChunks > 0 ? Math.round((job.currentChunk / job.totalChunks) * 100) : 0,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        processingTimeMs: job.processingTimeMs,
        errors: job.errors,
        warnings: job.warnings,
        pythonCode: job.status === 'completed' ? job.pythonCode : undefined
      }
    }, { headers: corsHeaders });
  }
  
  const jobs = getUserJobs(userId);
  const stats = getQueueStats();
  
  return NextResponse.json({
    jobs: jobs.map(j => ({
      id: j.id,
      status: j.status,
      fileName: j.fileName,
      totalLines: j.totalLines,
      progress: j.totalChunks > 0 ? Math.round((j.currentChunk / j.totalChunks) * 100) : 0,
      createdAt: j.createdAt,
      completedAt: j.completedAt
    })),
    queueStats: stats
  }, { headers: corsHeaders });
}

/**
 * DELETE - Cancel a pending job
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('id');
  
  if (!jobId) {
    return NextResponse.json({
      error: 'Missing job id'
    }, { status: 400, headers: corsHeaders });
  }
  
  const success = cancelJob(jobId);
  
  if (!success) {
    return NextResponse.json({
      error: 'Job not found or cannot be cancelled'
    }, { status: 400, headers: corsHeaders });
  }
  
  return NextResponse.json({
    success: true,
    message: 'Job cancelled'
  }, { headers: corsHeaders });
}

/**
 * Async job processor - uses unified Python transpiler
 */
async function processJobAsync(jobId: string) {
  const job = getJob(jobId);
  if (!job) return;
  
  try {
    const lines = job.cobolCode.split('\n');
    const chunkSize = 5000;
    let allPythonCode = '';
    
    for (let i = 0; i < job.totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, lines.length);
      const chunk = lines.slice(start, end).join('\n');
      
      // Process chunk via unified Python API
      const result = await transpileCobolViaPython(chunk);
      
      if (i === 0) {
        allPythonCode = result.python_code;
      } else {
        // Merge methods from subsequent chunks
        const methodsMatch = result.python_code.match(/def \w+\(self\)[\s\S]*?(?=\n    def |\nif __name__|$)/g);
        if (methodsMatch) {
          allPythonCode = allPythonCode.replace(
            /\nif __name__/,
            '\n' + methodsMatch.join('\n') + '\nif __name__'
          );
        }
      }
      
      // Update progress
      const { updateJob } = await import('@/lib/job-queue');
      updateJob(jobId, {
        currentChunk: i + 1,
        processedLines: end
      });
      
      await new Promise(r => setTimeout(r, 100));
    }
    
    // Complete job
    await completeJob(jobId, {
      pythonCode: allPythonCode,
      errors: [],
      warnings: []
    });
    
    logAudit({
      action: 'JOB_COMPLETE',
      userId: job.userId,
      userEmail: job.userEmail,
      userRole: 'developer',
      resource: job.fileName,
      resourceId: jobId,
      details: { 
        totalLines: job.totalLines,
        processingTimeMs: job.processingTimeMs 
      },
      success: true
    });
    
  } catch (error: any) {
    const { failJob } = await import('@/lib/job-queue');
    failJob(jobId, error.message);
  }
}
