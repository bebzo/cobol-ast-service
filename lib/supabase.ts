import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jcizfxniwgwfdmubapyb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjaXpmeG5pd2d3ZmRtdWJhcHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1Njk5MjgsImV4cCI6MjA4MjE0NTkyOH0.ZMReVdLgTRdV8MTWZ8yUBeknBuJAZZON_77OPoxp6-c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  try {
    // 1. Save new entry
    const { error } = await supabase
      .from('analysis_history')
      .insert([{
        filename: item.filename,
        timestamp: item.timestamp,
        cobol_lines: item.cobol_lines,
        python_lines: item.python_lines,
        cobol_code: item.cobol_code,
        python_code: item.python_code,
        analysis: item.analysis,
      }]);
    
    if (error) {
      console.error('Supabase save error:', error);
      return false;
    }
    
    // 2. Auto-purge: keep only MAX_HISTORY entries, delete oldest
    const { data: allEntries } = await supabase
      .from('analysis_history')
      .select('id, created_at')
      .order('created_at', { ascending: false });
    
    if (allEntries && allEntries.length > MAX_HISTORY) {
      const entriesToDelete = allEntries.slice(MAX_HISTORY);
      for (const entry of entriesToDelete) {
        await supabase.from('analysis_history').delete().eq('id', entry.id);
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
  try {
    const { data, error } = await supabase
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

// LocalStorage fallback
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
  try {
    const { error } = await supabase
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
