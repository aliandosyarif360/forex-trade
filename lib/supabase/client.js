import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if we're in demo mode
const isDemoMode = process.env.DEMO_MODE === 'true';

// Create a mock client for demo mode
const createMockClient = () => {
  return {
    auth: {
      signIn: async () => ({ data: { user: { id: 'demo-user', email: 'demo@example.com' } }, error: null }),
      signUp: async () => ({ data: { user: { id: 'demo-user', email: 'demo@example.com' } }, error: null }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: { user: { id: 'demo-user', email: 'demo@example.com' } } }, error: null }),
      getUser: async () => ({ data: { user: { id: 'demo-user', email: 'demo@example.com' } }, error: null }),
    },
    from: (table) => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null }),
      delete: () => ({ data: [], error: null }),
      eq: () => ({ data: [], error: null }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'demo-path' }, error: null }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ data: null, error: null }),
      }),
    },
  };
};

// Create the actual Supabase client
let supabase;
let supabaseAdmin;

if (isDemoMode || !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('demo')) {
  // Use mock client for demo mode
  supabase = createMockClient();
  supabaseAdmin = createMockClient();
} else {
  // Use real Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });

  // Server-side client with service role key for admin operations
  supabaseAdmin = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export { supabase, supabaseAdmin };