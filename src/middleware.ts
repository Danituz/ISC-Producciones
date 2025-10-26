import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresca la sesión si toca (evita sesiones caducadas)
  const { data: { session } } = await supabase.auth.getSession();

  // Protege todo /admin
  if (req.nextUrl.pathname.startsWith("/admin") && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Allowlist opcional: limitar acceso a /admin por correo o dominio (y permitir Gmail si se configura)
  if (req.nextUrl.pathname.startsWith("/admin") && session?.user?.email) {
    const email = session.user.email.toLowerCase();
    const list = (process.env.ADMIN_EMAILS || "")
      .split(/[,;\s]+/)
      .filter(Boolean)
      .map((e) => e.toLowerCase());
    const domains = (process.env.ADMIN_ALLOWED_DOMAIN || "")
      .split(/[,;\s]+/)
      .filter(Boolean)
      .map((d) => d.toLowerCase());

    const inEmails = list.length ? list.includes(email) : true; // si no hay lista, no restringe por email
    const inDomains = domains.length ? domains.some((d) => email.endsWith(d)) : true; // si no hay dominios, no restringe por dominio
    const allowGmail = process.env.ADMIN_ALLOW_GMAIL === "1" && email.endsWith("@gmail.com");

    if (!(inEmails && inDomains) && !allowGmail) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("unauthorized", "1");
      return NextResponse.redirect(url);
    }
  }

  // Verificación adicional por código (si está configurado)
  if (req.nextUrl.pathname.startsWith("/admin") && process.env.ADMIN_VERIFICATION_CODE) {
    const verified = (session?.user?.user_metadata as any)?.admin_verified === true;
    if (!verified && !(process.env.ADMIN_ALLOW_GMAIL === "1" && (session?.user?.email?.toLowerCase() || "").endsWith("@gmail.com"))) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("verify", "1");
      url.searchParams.set("redirectedFrom", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
