/**
 * Audit Logger - Immutable Audit Trail for Enterprise Compliance
 * 
 * Logs all critical operations for SOX, GDPR, and banking regulations.
 * In production: integrate with Loki, Splunk, or CloudWatch.
 */

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  userId: string;
  userEmail: string;
  userRole: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
}

export type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'TRANSPILE'
  | 'ANALYZE'
  | 'EXPORT_CODE'
  | 'EXPORT_REPORT'
  | 'VIEW_AUDIT'
  | 'ADMIN_ACTION'
  | 'API_CALL'
  | 'JOB_SUBMIT'
  | 'JOB_COMPLETE'
  | 'CONFIG_CHANGE';

// In-memory store for demo (use Redis/DB in production)
const auditStore: AuditEntry[] = [];

/**
 * Log an audit entry (immutable append-only)
 */
export function logAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
  const fullEntry: AuditEntry = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString()
  };
  
  // Append to immutable log
  auditStore.push(fullEntry);
  
  // Console log for demo (in production: send to log aggregator)
  console.log(`[AUDIT] ${fullEntry.timestamp} | ${fullEntry.action} | ${fullEntry.userEmail} | ${fullEntry.resource} | ${fullEntry.success ? 'SUCCESS' : 'FAILED'}`);
  
  // Keep only last 10000 entries in memory
  if (auditStore.length > 10000) {
    auditStore.shift();
  }
  
  return fullEntry;
}

/**
 * Query audit log with filters
 */
export function queryAuditLog(filters: {
  userId?: string;
  action?: AuditAction;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): AuditEntry[] {
  let results = [...auditStore];
  
  if (filters.userId) {
    results = results.filter(e => e.userId === filters.userId);
  }
  if (filters.action) {
    results = results.filter(e => e.action === filters.action);
  }
  if (filters.resource) {
    const resourceFilter = filters.resource;
    results = results.filter(e => e.resource.includes(resourceFilter));
  }
  if (filters.startDate) {
    results = results.filter(e => new Date(e.timestamp) >= filters.startDate!);
  }
  if (filters.endDate) {
    results = results.filter(e => new Date(e.timestamp) <= filters.endDate!);
  }
  
  // Sort by timestamp descending
  results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return results.slice(0, filters.limit || 100);
}

/**
 * Get audit statistics
 */
export function getAuditStats(): {
  totalEntries: number;
  last24h: number;
  byAction: Record<string, number>;
  successRate: number;
} {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const last24h = auditStore.filter(e => new Date(e.timestamp) >= oneDayAgo);
  
  const byAction: Record<string, number> = {};
  for (const entry of auditStore) {
    byAction[entry.action] = (byAction[entry.action] || 0) + 1;
  }
  
  const successCount = auditStore.filter(e => e.success).length;
  
  return {
    totalEntries: auditStore.length,
    last24h: last24h.length,
    byAction,
    successRate: auditStore.length > 0 ? (successCount / auditStore.length) * 100 : 100
  };
}

/**
 * Export audit log for compliance (JSON Lines format)
 */
export function exportAuditLog(format: 'json' | 'jsonl' | 'csv' = 'jsonl'): string {
  if (format === 'json') {
    return JSON.stringify(auditStore, null, 2);
  }
  
  if (format === 'csv') {
    const headers = ['id', 'timestamp', 'action', 'userId', 'userEmail', 'resource', 'success'];
    const rows = auditStore.map(e => 
      headers.map(h => String((e as any)[h] || '')).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
  
  // Default: JSON Lines (best for log aggregators)
  return auditStore.map(e => JSON.stringify(e)).join('\n');
}
