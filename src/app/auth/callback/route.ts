import { NextRequest, NextResponse } from "next/server";
import { createRoute } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/admin"; // opcional: permite ?next=/admin
  const origin = url.origin;

  if (!code) {
    // Si no viene code, regresa al login con mensaje
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  try {
    const supabase = createRoute();
    await supabase.auth.exchangeCodeForSession(code);
    // Auto-verify admin for Gmail if configured
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email?.toLowerCase() || "";
      const allowGmail = process.env.ADMIN_ALLOW_GMAIL === "1" && email.endsWith("@gmail.com");
      if (user && allowGmail) {
        await supabase.auth.updateUser({ data: { admin_verified: true, admin_verified_at: new Date().toISOString() } });
      }
    } catch {}
    // si todo ok, redirige al destino (por defecto /admin)
    return NextResponse.redirect(`${origin}${next}`);
  } catch (e) {
    console.error("Supabase exchangeCodeForSession error:", e);
    return NextResponse.redirect(`${origin}/login?error=callback_failed`);
  }
}
