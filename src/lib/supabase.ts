import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL || 
  'https://shyhzwhtpuebsafxkfcx.supabase.co';

const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoeWh6d2h0cHVlYnNhZnhrZmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2MjY1OTEsImV4cCI6MjExMDIwMjU5MX0.a9EUTQoaPmIZ_K76oL3UDCO3RLzfHhdBGuxruIjO0yU';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
});

export default supabase;
