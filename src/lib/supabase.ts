/**
 * Centralized Supabase client factory.
 *
 * Provides singleton service client and per-request user clients.
 * Fails fast if required env vars are missing.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _serviceClient: SupabaseClient | null = null;
let _anonClient: SupabaseClient | null = null;

/**
 * Get the service role client (bypasses RLS).
 * Use for background operations, webhooks, and admin tasks.
 * Throws if SUPABASE_SERVICE_ROLE_KEY is not configured.
 */
export function getServiceClient(): SupabaseClient {
  if (!_serviceClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) {
      throw new Error('SUPABASE_URL is not configured');
    }
    if (!key) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    }

    _serviceClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _serviceClient;
}

/**
 * Get the anon client (subject to RLS).
 * Use for unauthenticated requests.
 */
export function getAnonClient(): SupabaseClient {
  if (!_anonClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('SUPABASE_URL or SUPABASE_ANON_KEY is not configured');
    }

    _anonClient = createClient(url, key);
  }
  return _anonClient;
}

/**
 * Create a user-scoped client from their JWT token.
 * RLS will apply using the token's auth.uid().
 */
export function createUserClient(token: string): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL or SUPABASE_ANON_KEY is not configured');
  }

  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
