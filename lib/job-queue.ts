/**
 * Job Queue System - Async Processing for Large COBOL Files
 * 
 * Handles files > 50kLOC via chunked processing with webhooks.
 * In production: integrate with Redis/BullMQ for persistence.
 */

export interface TranspileJob {
  id: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userEmail: string;
  
  // Input
  fileName: string;
  totalLines: number;
  cobolCode: string;
  
  // Progress
  currentChunk: number;
  totalChunks: number;
  processedLines: number;
  
  // Output
  pythonCode?: string;
  errors: string[];
  warnings: string[];
  
  // Webhook
  webhookUrl?: string;
  webhookSecret?: string;
  
  // Metrics
  startedAt?: string;
  completedAt?: string;
  processingTimeMs?: number;
}

export type JobStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

// In-memory job store (use Redis in production)
const jobStore: Map<string, TranspileJob> = new Map();

// Job processing queue
const processingQueue: string[] = [];

/**
 * Create a new transpilation job
 */
export function createJob(params: {
  userId: string;
  userEmail: string;
  fileName: string;
  cobolCode: string;
  webhookUrl?: string;
  webhookSecret?: string;
}): TranspileJob {
  const lines = params.cobolCode.split('\n').length;
  const chunkSize = 5000;
  const totalChunks = Math.ceil(lines / chunkSize);
  
  const job: TranspileJob = {
    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: params.userId,
    userEmail: params.userEmail,
    fileName: params.fileName,
    totalLines: lines,
    cobolCode: params.cobolCode,
    currentChunk: 0,
    totalChunks,
    processedLines: 0,
    errors: [],
    warnings: [],
    webhookUrl: params.webhookUrl,
    webhookSecret: params.webhookSecret
  };
  
  jobStore.set(job.id, job);
  processingQueue.push(job.id);
  
  console.log(`[JOB] Created job ${job.id}: ${lines} lines, ${totalChunks} chunks`);
  
  return job;
}

/**
 * Get job by ID
 */
export function getJob(jobId: string): TranspileJob | undefined {
  return jobStore.get(jobId);
}

/**
 * Get all jobs for a user
 */
export function getUserJobs(userId: string): TranspileJob[] {
  return Array.from(jobStore.values())
    .filter(j => j.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Update job status and progress
 */
export function updateJob(jobId: string, updates: Partial<TranspileJob>): TranspileJob | undefined {
  const job = jobStore.get(jobId);
  if (!job) return undefined;
  
  Object.assign(job, updates, { updatedAt: new Date().toISOString() });
  jobStore.set(jobId, job);
  
  return job;
}

/**
 * Process next job in queue (called by worker)
 */
export async function processNextJob(): Promise<TranspileJob | null> {
  const jobId = processingQueue.shift();
  if (!jobId) return null;
  
  const job = jobStore.get(jobId);
  if (!job) return null;
  
  // Update status
  updateJob(jobId, { 
    status: 'processing',
    startedAt: new Date().toISOString()
  });
  
  return job;
}

/**
 * Mark job as completed with results
 */
export async function completeJob(jobId: string, result: {
  pythonCode: string;
  errors: string[];
  warnings: string[];
}): Promise<TranspileJob | undefined> {
  const job = updateJob(jobId, {
    status: 'completed',
    pythonCode: result.pythonCode,
    errors: result.errors,
    warnings: result.warnings,
    completedAt: new Date().toISOString(),
    processedLines: jobStore.get(jobId)?.totalLines || 0,
    currentChunk: jobStore.get(jobId)?.totalChunks || 0
  });
  
  if (job) {
    job.processingTimeMs = job.completedAt && job.startedAt
      ? new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
      : undefined;
    
    // Send webhook notification
    if (job.webhookUrl) {
      await sendWebhook(job);
    }
  }
  
  return job;
}

/**
 * Mark job as failed
 */
export function failJob(jobId: string, error: string): TranspileJob | undefined {
  const job = updateJob(jobId, {
    status: 'failed',
    errors: [...(jobStore.get(jobId)?.errors || []), error],
    completedAt: new Date().toISOString()
  });
  
  // Send webhook notification for failure
  if (job?.webhookUrl) {
    sendWebhook(job);
  }
  
  return job;
}

/**
 * Cancel a pending job
 */
export function cancelJob(jobId: string): boolean {
  const job = jobStore.get(jobId);
  if (!job || job.status !== 'pending') return false;
  
  updateJob(jobId, { status: 'cancelled' });
  
  // Remove from queue
  const idx = processingQueue.indexOf(jobId);
  if (idx > -1) processingQueue.splice(idx, 1);
  
  return true;
}

/**
 * Send webhook notification
 */
async function sendWebhook(job: TranspileJob): Promise<void> {
  if (!job.webhookUrl) return;
  
  const payload = {
    event: job.status === 'completed' ? 'job.completed' : 'job.failed',
    jobId: job.id,
    status: job.status,
    fileName: job.fileName,
    totalLines: job.totalLines,
    processingTimeMs: job.processingTimeMs,
    completedAt: job.completedAt,
    hasErrors: job.errors.length > 0,
    errorCount: job.errors.length,
    warningCount: job.warnings.length
  };
  
  try {
    const response = await fetch(job.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CodeSwitch-Signature': job.webhookSecret || '',
        'X-CodeSwitch-Event': payload.event
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`[WEBHOOK] Sent to ${job.webhookUrl}: ${response.status}`);
  } catch (error) {
    console.error(`[WEBHOOK] Failed to send to ${job.webhookUrl}:`, error);
  }
}

/**
 * Get queue statistics
 */
export function getQueueStats(): {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalJobs: number;
} {
  const jobs = Array.from(jobStore.values());
  return {
    pending: jobs.filter(j => j.status === 'pending').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    totalJobs: jobs.length
  };
}
