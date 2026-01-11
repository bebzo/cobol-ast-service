import { NextResponse } from 'next/server';

const startTime = Date.now();

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'CodeSwitch COBOL Migration API',
    version: '1.0.0',
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    capabilities: {
      cobol_parsing: true,
      python_generation: true,
      security_analysis: true,
      test_generation: true,
      gemini_integration: true
    },
    endpoints: {
      analyse: '/api/analyse',
      chat: '/api/chat',
      health: '/api/health'
    }
  }, {
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
}
