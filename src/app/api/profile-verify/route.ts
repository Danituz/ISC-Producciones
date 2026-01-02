import { NextResponse } from "next/server";
import { slugifyId } from "@/lib/utils";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { adminSupabase } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const profileIdRaw = String(body?.profileId ?? "");
  const profileId = slugifyId(profileIdRaw);
  const submitted = String(body?.code ?? "").replace(/\D/g, "").slice(0, 4);

  if (!profileId) {
    return NextResponse.json({ error: "Perfil requerido" }, { status: 400 });
  }

  // Invitado opcionalmente sin código
  if (profileId === "invitado" || profileId === "guest") {
    const allowGuestOpen = process.env.PROFILE_ALLOW_GUEST_NO_CODE === "1";
    if (allowGuestOpen && !submitted) {
      return NextResponse.json({ ok: true, mode: "guest-open" });
    }
  }

  // Admin mantiene código global
  if (profileId === "admin") {
    const adminCode = (process.env.ADMIN_VERIFICATION_CODE || "").trim();
    if (!adminCode) return NextResponse.json({ error: "Código admin no configurado" }, { status: 400 });
    if (submitted !== adminCode) return NextResponse.json({ error: "Código incorrecto" }, { status: 400 });
    return NextResponse.json({ ok: true, role: "admin" });
  }

  // Buscar integrante por id o por slug del nombre
  const cookieStore = await cookies();
  const s = createRouteHandlerClient({ cookies: () => cookieStore });
  let member: any = null;

  // Intento por id directo
  const client = adminSupabase ?? s;

  const selectFields = ["id", "name", "verification_code", "avatar_seed", "avatar_style"];

  const fetchMember = async () => {
    // Intento con columnas de avatar; si fallan, reintenta sin ellas
    const selectList = selectFields.join(",");
    if (profileIdRaw && profileIdRaw.length > 10) {
      const { data, error } = await client.from("members").select(selectList).eq("id", profileIdRaw).maybeSingle();
      if (!error && data) return data;
      if (error && error.code !== "42703") throw error;
    }
    const { data: list, error: listError } = await client.from("members").select(selectList);
    if (!listError && Array.isArray(list)) {
      const found = list.find((m: any) => slugifyId(m.name || "") === profileId);
      if (found) return found;
    }
    // retry sin columnas avatar si falló por 42703
    const fallbackSelect = "id,name,verification_code";
    if (profileIdRaw && profileIdRaw.length > 10) {
      const { data } = await client.from("members").select(fallbackSelect).eq("id", profileIdRaw).maybeSingle();
      if (data) return data;
    }
    const { data: fallbackList } = await client.from("members").select(fallbackSelect);
    if (fallbackList) return (fallbackList || []).find((m: any) => slugifyId(m.name || "") === profileId);
    return null;
  };

  if (profileIdRaw && profileIdRaw.length > 10) {
    const found = await fetchMember();
    if (found) member = found;
  }

  if (!member) {
    const found = await fetchMember();
    if (found) member = found;
  }

  if (!member) {
    return NextResponse.json({ error: "Integrante no encontrado" }, { status: 404 });
  }

  const expected = String(member.verification_code || "").trim();
  if (!expected) return NextResponse.json({ error: "Integrante sin código asignado" }, { status: 400 });
  if (submitted.length !== 4 || submitted !== expected) return NextResponse.json({ error: "Código incorrecto" }, { status: 400 });

  return NextResponse.json({
    ok: true,
    member: {
      id: member.id,
      name: member.name,
      slug: slugifyId(member.name || ""),
      avatar_seed: member.avatar_seed,
      avatar_style: member.avatar_style,
    },
  });
}
