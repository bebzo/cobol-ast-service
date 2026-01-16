import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration per endpoint
const RATE_LIMITS: Record<string, { requests: number; windowMs: number }> = {
  '/api/analyse': { requests: 10, windowMs: 60000 },      // 10 per minute
  '/api/analyse-sse': { requests: 10, windowMs: 60000 }, // 10 per minute
  '/api/transpile-clean': { requests: 20, windowMs: 60000 }, // 20 per minute
  '/api/chat': { requests: 30, windowMs: 60000 },        // 30 per minute
  '/api/gemini-insights': { requests: 20, windowMs: 60000 }, // 20 per minute
  'default': { requests: 100, windowMs: 60000 }          // 100 per minute default
};

function getRateLimitKey(ip: string, path: string): string {
  return `${ip}:${path}`;
}

function checkRateLimit(ip: string, path: string): { allowed: boolean; remaining: number; resetIn: number } {
  const config = RATE_LIMITS[path] || RATE_LIMITS['default'];
  const key = getRateLimitKey(ip, path);
  const now = Date.now();
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.requests - 1, resetIn: config.windowMs };
  }
  
  if (entry.count >= config.requests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }
  
  entry.count++;
  return { allowed: true, remaining: config.requests - entry.count, resetIn: entry.resetTime - now };
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;
  
  // ============================================
  // SECURITY HEADERS (Production Grade)
  // ============================================
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  response.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://*.vercel.app wss://*.supabase.co https://generativelanguage.googleapis.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '));
  
  // ============================================
  // RATE LIMITING (API routes only)
  // ============================================
  
  if (path.startsWith('/api/')) {
    // Skip rate limiting for health check
    if (path === '/api/health') {
      return response;
    }
    
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('x-real-ip') 
      || 'unknown';
    
    const { allowed, remaining, resetIn } = checkRateLimit(ip, path);
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(resetIn / 1000).toString());
    
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(resetIn / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(resetIn / 1000).toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(resetIn / 1000).toString()
          }
        }
      );
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
