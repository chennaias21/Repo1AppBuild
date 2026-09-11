import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Where the sign-in link in the email lands. Supabase verifies the link on its
 * own domain first, then sends the user here with a one-time `code` which we
 * exchange for a session. This works with Supabase's default email template —
 * nothing has to be customised in the dashboard.
 *
 * This route does the session exchange and nothing else. Admin-side work
 * (welcome email, tracking-sheet row) is deliberately kept out: those call slow
 * third parties, and making a person's sign-in wait on them pushed this route
 * past the hosting platform's request timeout. That work now happens via
 * /api/auth/record-registration, which the dashboard triggers in the background.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=expired_link`);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
