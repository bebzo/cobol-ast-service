import { createClient } from '@supabase/supabase-js';

// Type definition for auth state change callback
type AuthStateChangeCallback = (event: string, session: any) => void;

// Type definition for the mock subscription object
interface MockSubscription {
  unsubscribe: () => void;
}

// Type definition for the mock auth object
interface MockAuth {
  getSession: () => Promise<{ data: { session: any }; error: null }>;
  onAuthStateChange: (callback: AuthStateChangeCallback) => { data: { subscription: MockSubscription } };
  signOut: () => Promise<{ error: null }>;
}

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
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: (callback: AuthStateChangeCallback) => {
      // Return a mock subscription
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signOut: () => Promise.resolve({ error: null })
  } as MockAuth
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
