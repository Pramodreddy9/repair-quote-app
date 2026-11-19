import {createClient, type SupabaseClient} from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''
).trim();

const isPlaceholderUrl =
  !supabaseUrl || supabaseUrl.includes('YOUR_PROJECT_REF');
const isPlaceholderKey =
  !supabasePublishableKey ||
  supabasePublishableKey.includes('YOUR_SUPABASE_PUBLISHABLE_KEY');

export const isSupabaseConfigured = !isPlaceholderUrl && !isPlaceholderKey;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
