import { createClient } from '@supabase/supabase-js';

// Type definition for auth state change callback
type AuthStateChangeCallback = (event: string, session: any) => void;

// Lazy initialization - only create client when actually needed
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseClient;
  }
  
  return null;
}

// Export a proxy object that safely handles null
export const supabase = {
  get client() {
    return getSupabaseClient();
  },
  from(table: string) {
    const client = getSupabaseClient();
    if (!client) {
      // Return a mock object for dev mode with proper type assertions
      return {
        select: () => Promise.resolve({ data: [], error: null }) as any,
        insert: () => Promise.resolve({ error: null }) as any,
        delete: () => Promise.resolve({ error: null }) as any,
        order: () => Promise.resolve({ data: [], error: null }) as any,
        eq: () => Promise.resolve({ error: null }) as any,
        limit: () => Promise.resolve({ data: [], error: null }) as any
      };
    }
    return client.from(table);
  },
  auth: {
    getSession: () => {
      const client = getSupabaseClient();
      if (client) {
        return client.auth.getSession();
      }
      // Fallback to mock when no client available
      return Promise.resolve({ data: { session: null }, error: null });
    },
    onAuthStateChange: (callback: AuthStateChangeCallback) => {
      const client = getSupabaseClient();
      if (client) {
        return client.auth.onAuthStateChange(callback);
      }
      // Return a mock subscription for dev mode
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signOut: () => {
      const client = getSupabaseClient();
      if (client) {
        return client.auth.signOut();
      }
      return Promise.resolve({ error: null });
    }
  } as any
};

export interface AnalysisHistory {
  id?: string;
  filename: string;
  timestamp: string;
  cobol_lines: number;
  python_lines: number;
  cobol_code: string;
  python_code: string;
  analysis: any;
  created_at?: string;
}

const MAX_HISTORY = 10;

export async function saveAnalysis(item: AnalysisHistory): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    console.log('Demo mode: saving to localStorage only');
    saveToLocalStorage(item);
    return true;
  }
  
  try {
    console.log('[DEBUG] saveAnalysis - analysis keys:', item.analysis ? Object.keys(item.analysis) : 'N/A');
    console.log('[DEBUG] saveAnalysis - shadow_testing_plan present:', !!item.analysis?.shadow_testing_plan);
    console.log('[DEBUG] saveAnalysis - shadow_testing_plan value:', JSON.stringify(item.analysis?.shadow_testing_plan, null, 2));
    
    const { error } = await client
      .from('analysis_history')
      .insert([{
        filename: item.filename,
        timestamp: item.timestamp,
        cobol_lines: item.cobol_lines,
        python_lines: item.python_lines,
        cobol_code: item.cobol_code,
        python_code: item.python_code,
        analysis: item.analysis,
      }] as any);
    
    if (error) {
      console.error('Supabase save error:', error);
      return false;
    }
    
    // @ts-ignore - Supabase types mismatch with runtime client
    const { data: allEntries } = await client
      .from('analysis_history')
      .select('id, created_at')
      .order('created_at', { ascending: false });
    
    if (allEntries && allEntries.length > MAX_HISTORY) {
      const entriesToDelete = allEntries.slice(MAX_HISTORY);
      for (const entry of entriesToDelete) {
        // @ts-ignore - entry.id type is never due to Supabase type inference issues
        await client.from('analysis_history').delete().eq('id', entry.id);
      }
      console.log(`Auto-purged ${entriesToDelete.length} old entries`);
    }
    
    return true;
  } catch (e) {
    console.error('Save failed:', e);
    return false;
  }
}

export async function loadHistory(limit = 10): Promise<AnalysisHistory[]> {
  const client = getSupabaseClient();
  if (!client) {
    console.log('Demo mode: loading from localStorage only');
    return loadFromLocalStorage(limit);
  }
  
  try {
    // @ts-ignore - Supabase types mismatch with runtime client
    const { data, error } = await client
      .from('analysis_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Supabase load error, trying localStorage:', error);
      return loadFromLocalStorage(limit);
    }
    
    return data || [];
  } catch (e) {
    console.error('Load failed, using localStorage:', e);
    return loadFromLocalStorage(limit);
  }
}

// Helper to parse COBOL code quickly (simplified version for frontend)
function parseCobolQuick(cobolCode: string): { workingStorageVariables: any[]; paragraphs: any[]; programId: string } {
  const lines = cobolCode.split('\n');
  const workingStorageVariables: any[] = [];
  const paragraphs: any[] = [];
  let programId = 'UNKNOWN';
  
  // Extract program ID
  const programIdMatch = cobolCode.match(/PROGRAM-ID\.?\s*\.?\s*([A-Z0-9][A-Z0-9-]*)/i);
  if (programIdMatch) {
    programId = programIdMatch[1].toUpperCase();
  }
  
  // Simple paragraph detection
  const paragraphPattern = /^([A-Z0-9][A-Z0-9-]*)\.\s*$/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(paragraphPattern);
    if (match && !line.includes('PIC ') && !line.includes('VALUE ') && !line.includes('FD ') && !line.includes('SD ')) {
      paragraphs.push({ name: match[1], line: i + 1 });
    }
  }
  
  return { workingStorageVariables, paragraphs, programId };
}

// Export helper for frontend use
export function getAnalysisWithShadowTest(cobolCode: string, pythonCode: string, analysis: any): any {
  // If shadow_testing_plan already exists, return as-is
  if (analysis?.shadow_testing_plan) {
    return analysis;
  }
  
  // Regenerate shadow_testing_plan for historical data
  console.log('[DEBUG] Regenerating shadow_testing_plan for historical analysis');
  const quickParse = parseCobolQuick(cobolCode);
  const shadowTestingPlan = generateShadowTestingPlanFrontend(cobolCode, pythonCode, quickParse);
  
  return {
    ...analysis,
    shadow_testing_plan: shadowTestingPlan
  };
}

function loadFromLocalStorage(limit: number): AnalysisHistory[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('codeswitch_history');
    const items = stored ? JSON.parse(stored) : [];
    return items.slice(0, limit);
  } catch { return []; }
}

export function saveToLocalStorage(item: AnalysisHistory): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem('codeswitch_history');
    const items = stored ? JSON.parse(stored) : [];
    items.unshift(item);
    localStorage.setItem('codeswitch_history', JSON.stringify(items.slice(0, 20)));
  } catch { /* ignore */ }
}

export async function deleteAnalysis(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    console.log('Demo mode: delete from localStorage only');
    return true;
  }
  
  try {
    // @ts-ignore - Supabase types mismatch with runtime client
    const { error } = await client
      .from('analysis_history')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Delete failed:', e);
    return false;
  }
}
