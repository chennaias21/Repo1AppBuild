import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * A throwaway client used only to REQUEST a password-reset email. It uses the "implicit" flow,
 * so the emailed link carries its tokens in the address itself and works in any browser or
 * device, unlike the default flow which only works in the browser that asked for it.
 */
export function createImplicitClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
