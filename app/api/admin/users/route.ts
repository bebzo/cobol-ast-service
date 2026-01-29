import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-load admin client to avoid build-time errors
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdmin) return supabaseAdmin;
  
  // Support both naming conventions
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  
  if (!url || !key) {
    console.warn('[Admin API] Supabase credentials not configured');
    console.warn('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }
  
  supabaseAdmin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  return supabaseAdmin;
}

// Verify admin access - supports both cookie and Authorization header
async function verifyAdmin(request: NextRequest): Promise<{success: boolean, reason?: string, user?: any}> {
  const client = getSupabaseAdmin();
  if (!client) return { success: false, reason: 'Admin client not configured' };
  
  let accessToken: string | null = null;
  
  // First try Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    accessToken = authHeader.substring(7);
    console.log('[Admin API] Using Authorization header token');
  }
  
  // Fallback to cookie
  if (!accessToken) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
      if (tokenMatch) {
        try {
          const tokenData = JSON.parse(decodeURIComponent(tokenMatch[1]));
          accessToken = tokenData[0] || tokenData.access_token;
          console.log('[Admin API] Using cookie token');
        } catch {
          // Invalid cookie, continue
        }
      }
    }
  }
  
  if (!accessToken) {
    return { success: false, reason: 'No auth token found (cookie or Authorization header)' };
  }
  
  try {
    const { data: { user }, error } = await client.auth.getUser(accessToken);
    if (error || !user) {
      console.error('[Admin API] User verification failed:', error);
      return { success: false, reason: 'User verification failed' };
    }
    
    console.log('[Admin API] User email:', user.email);
    console.log('[Admin API] ADMIN_EMAIL env:', process.env.ADMIN_EMAIL);
    console.log('[Admin API] User role:', user.user_metadata?.role);
    
    // Check if user is admin by role or email
    const isAdminByRole = user.user_metadata?.role === 'admin';
    const isAdminByEmail = user.email === process.env.ADMIN_EMAIL;
    
    console.log('[Admin API] Is admin by role:', isAdminByRole);
    console.log('[Admin API] Is admin by email:', isAdminByEmail);
    
    if (isAdminByRole || isAdminByEmail) {
      return { success: true, user };
    }
    
    return { success: false, reason: 'User is not admin' };
  } catch (err) {
    console.error('[Admin API] Verification error:', err);
    return { success: false, reason: 'Verification exception' };
  }
}

// GET: List all users
export async function GET(request: NextRequest) {
  const client = getSupabaseAdmin();
  if (!client) {
    return NextResponse.json({ error: 'Admin API not configured' }, { status: 503 });
  }
  
  const adminCheck = await verifyAdmin(request);
  if (!adminCheck.success) {
    console.warn('[Admin API] Unauthorized:', adminCheck.reason);
    return NextResponse.json({ error: 'Unauthorized', reason: adminCheck.reason }, { status: 401 });
  }

  try {
    const { data: { users }, error } = await client.auth.admin.listUsers();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST: Create new user
export async function POST(request: NextRequest) {
  const client = getSupabaseAdmin();
  if (!client) {
    return NextResponse.json({ error: 'Admin API not configured' }, { status: 503 });
  }
  
  const adminCheck = await verifyAdmin(request);
  if (!adminCheck.success) {
    console.warn('[Admin API] Unauthorized:', adminCheck.reason);
    return NextResponse.json({ error: 'Unauthorized', reason: adminCheck.reason }, { status: 401 });
  }

  try {
    const { email, password, role } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    
    const { data, error } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: role || 'user' }
    });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ user: data.user });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// DELETE: Delete user
export async function DELETE(request: NextRequest) {
  const client = getSupabaseAdmin();
  if (!client) {
    return NextResponse.json({ error: 'Admin API not configured' }, { status: 503 });
  }
  
  const adminCheck = await verifyAdmin(request);
  if (!adminCheck.success) {
    console.warn('[Admin API] Unauthorized:', adminCheck.reason);
    return NextResponse.json({ error: 'Unauthorized', reason: adminCheck.reason }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    const { error } = await client.auth.admin.deleteUser(userId);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
