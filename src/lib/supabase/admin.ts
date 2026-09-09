import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses Row Level Security entirely.
 * Server-only (route handlers, webhook, cron) — never import from a Client Component.
 * The SUPABASE_SERVICE_ROLE_KEY must never be prefixed NEXT_PUBLIC_ and never sent to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
