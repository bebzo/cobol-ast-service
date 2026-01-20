#!/usr/bin/env node
// Quick test to check Supabase environment variables
console.log('=== Supabase Environment Check ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (hidden)' : 'NOT SET');

// Check if the URL looks like a valid Supabase URL
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (url) {
  const isValidUrl = url.includes('.supabase.co') || url.includes('supabase-project');
  console.log('URL appears valid:', isValidUrl);
}
