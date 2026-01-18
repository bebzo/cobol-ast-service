import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-load admin client to avoid build-time errors
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdmin) return supabaseAdmin;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    console.warn('[Admin API] Supabase credentials not configured');
    return null;
  }
  
  supabaseAdmin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  return supabaseAdmin;
}

// Verify admin access
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const client = getSupabaseAdmin();
  if (!client) return false;
  
  const authHeader = request.headers.get('cookie');
  if (!authHeader) return false;
  
  // Extract token from cookie
  const tokenMatch = authHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
  if (!tokenMatch) return false;
  
  try {
    const tokenData = JSON.parse(decodeURIComponent(tokenMatch[1]));
    const accessToken = tokenData[0] || tokenData.access_token;
    
    const { data: { user }, error } = await client.auth.getUser(accessToken);
    if (error || !user) return false;
    
    // Check if user is admin
    return user.user_metadata?.role === 'admin' || 
           user.email === process.env.ADMIN_EMAIL;
  } catch {
    return false;
  }
}

// GET: List all users
export async function GET(request: NextRequest) {
  const client = getSupabaseAdmin();
  if (!client) {
    return NextResponse.json({ error: 'Admin API not configured' }, { status: 503 });
  }
  
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
