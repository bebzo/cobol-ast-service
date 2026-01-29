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

// Verify admin access
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const client = getSupabaseAdmin();
  if (!client) return false;
  
  const authHeader = request.headers.get('cookie');
  if (!authHeader) return false;
  
  const tokenMatch = authHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
  if (!tokenMatch) return false;
  
  try {
    const tokenData = JSON.parse(decodeURIComponent(tokenMatch[1]));
    const accessToken = tokenData[0] || tokenData.access_token;
    
    const { data: { user }, error } = await client.auth.getUser(accessToken);
    if (error || !user) return false;
    
    return user.user_metadata?.role === 'admin' || 
           user.email === process.env.ADMIN_EMAIL;
  } catch {
    return false;
  }
}

// GET: Export analyses data
export async function GET(request: NextRequest) {
  const client = getSupabaseAdmin();
  if (!client) {
    return NextResponse.json({ 
      analyses: [],
      message: 'Admin API not configured',
      exported_at: new Date().toISOString()
    });
  }
  
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Try to fetch from analyses table if it exists
    const { data: analyses, error } = await client
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (error) {
      // Table might not exist - return empty array with metadata
      return NextResponse.json({ 
        analyses: [],
        message: 'No analyses table found. Analyses are processed in real-time.',
        exported_at: new Date().toISOString()
      });
    }
    
    return NextResponse.json({ 
      analyses: analyses || [],
      count: analyses?.length || 0,
      exported_at: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json({ 
      analyses: [],
      message: 'Export completed with no stored analyses',
      exported_at: new Date().toISOString()
    });
  }
}
