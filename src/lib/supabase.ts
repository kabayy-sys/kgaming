import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = supabaseUrl && supabaseAnonKey;

if (typeof window !== 'undefined' && !isConfigured) {
  console.warn(
    'Supabase environment variables not configured. ' +
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

function createSupabaseClient() {
  if (!isConfigured) {
    // Return a mock client for build-time/SSR to prevent crashes
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ error: null }),
        update: () => Promise.resolve({ error: null }),
        delete: () => Promise.resolve({ error: null }),
        eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Not configured' } }) }),
        order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
      }),
      channel: () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        subscribe: () => ({ unsubscribe: () => {} }),
      }),
      removeChannel: () => {},
      auth: {
        signInWithPassword: () => Promise.resolve({ error: { message: 'Not configured' } }),
        signOut: () => Promise.resolve({ error: null }),
      },
    } as unknown as ReturnType<typeof createClient>;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

export const supabase = createSupabaseClient();

// ---- Realtime Channels ----
export const DEVICES_CHANNEL = 'devices-channel';
export const BOOKINGS_CHANNEL = 'bookings-channel';
export const ACTIVITY_CHANNEL = 'activity-channel';
export const SLOT_OVERRIDES_CHANNEL = 'slot-overrides-channel';

export function getRealtimeChannel(channelName: string) {
  return supabase.channel(channelName);
}
