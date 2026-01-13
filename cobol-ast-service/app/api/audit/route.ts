/**
 * Audit Trail API - Enterprise Compliance
 * 
 * GET /api/audit - Query audit log
 * GET /api/audit/stats - Get audit statistics
 * GET /api/audit/export - Export audit log
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryAuditLog, getAuditStats, exportAuditLog, AuditAction } from '@/lib/audit-logger';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-user-role',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userRole = request.headers.get('x-user-role') || 'viewer';
  
  // Only admin and auditor can access audit logs
  if (!['admin', 'auditor'].includes(userRole)) {
    return NextResponse.json({
      error: 'Unauthorized',
      message: 'Audit log access requires admin or auditor role'
    }, { status: 403, headers: corsHeaders });
  }
  
  // Export mode
  const exportFormat = searchParams.get('export');
  if (exportFormat) {
    const format = exportFormat as 'json' | 'jsonl' | 'csv';
    const data = exportAuditLog(format);
    
    const contentType = {
      json: 'application/json',
      jsonl: 'application/x-ndjson',
      csv: 'text/csv'
    }[format] || 'application/json';
    
    return new NextResponse(data, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="audit_log_${new Date().toISOString().split('T')[0]}.${format}"`
      }
    });
  }
  
  // Stats mode
  if (searchParams.get('stats') === 'true') {
    const stats = getAuditStats();
    return NextResponse.json({ stats }, { headers: corsHeaders });
  }
  
  // Query mode
  const filters: {
    userId?: string;
    action?: AuditAction;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {};
  
  if (searchParams.get('userId')) {
    filters.userId = searchParams.get('userId')!;
  }
  if (searchParams.get('action')) {
    filters.action = searchParams.get('action') as AuditAction;
  }
  if (searchParams.get('resource')) {
    filters.resource = searchParams.get('resource')!;
  }
  if (searchParams.get('startDate')) {
    filters.startDate = new Date(searchParams.get('startDate')!);
  }
  if (searchParams.get('endDate')) {
    filters.endDate = new Date(searchParams.get('endDate')!);
  }
  if (searchParams.get('limit')) {
    filters.limit = parseInt(searchParams.get('limit')!);
  }
  
  const entries = queryAuditLog(filters);
  const stats = getAuditStats();
  
  return NextResponse.json({
    entries,
    count: entries.length,
    stats: {
      totalEntries: stats.totalEntries,
      successRate: stats.successRate.toFixed(1) + '%'
    }
  }, { headers: corsHeaders });
}
