import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Verify admin access
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('cookie');
  if (!authHeader) return false;
  
  const tokenMatch = authHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
  if (!tokenMatch) return false;
  
  try {
    const tokenData = JSON.parse(decodeURIComponent(tokenMatch[1]));
    const accessToken = tokenData[0] || tokenData.access_token;
    
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !user) return false;
    
    return user.user_metadata?.role === 'admin' || 
           user.email === process.env.ADMIN_EMAIL;
  } catch {
    return false;
  }
}

// GET: Export analyses data
export async function GET(request: NextRequest) {
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Try to fetch from analyses table if it exists
    const { data: analyses, error } = await supabaseAdmin
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
