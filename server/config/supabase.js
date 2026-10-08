const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl !== 'https://your-project-ref.supabase.co' &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_anon_key_here'
);

if (!isConfigured) {
  console.warn(
    '\x1b[33m⚠️  [TaskFlow Server] Supabase environment variables are missing or default placeholders. ' +
    'Please set valid SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.\x1b[0m'
  );
}

// 1. Standard Anon Supabase Client (Used for auth verification and public tasks)
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// 2. Service Role Client (Optional - Server-side only, bypasses RLS)
const supabaseAdmin = (supabaseServiceRoleKey && supabaseServiceRoleKey.length > 20)
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

/**
 * Returns a scoped Supabase client with the user's auth token attached.
 * This guarantees that all PostgreSQL operations will strictly respect Row Level Security (RLS) policies.
 * @param {string} token - The JWT bearer token from the client request
 */
const getScopedSupabase = (token) => {
  if (!isConfigured) {
    return supabase;
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

module.exports = {
  supabase,
  supabaseAdmin,
  getScopedSupabase,
  isConfigured,
  supabaseUrl,
  supabaseAnonKey,
};
