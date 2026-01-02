import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { slugifyId } from "@/lib/utils";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const profileIdRaw = String(body?.profileId ?? "");
  const profileId = slugifyId(profileIdRaw);
  const avatarSeed = body?.avatarSeed ? String(body.avatarSeed) : undefined;
  const avatarStyle = body?.avatarStyle ? String(body.avatarStyle) : undefined;

  if (!profileId) {
    return NextResponse.json({ error: "Perfil requerido" }, { status: 400 });
  }
  if (!avatarSeed && !avatarStyle) {
    return NextResponse.json({ error: "Avatar requerido" }, { status: 400 });
  }

  const s = createRouteHandlerClient({ cookies });

  let member: { id: string; name: string } | null = null;
  if (profileIdRaw && profileIdRaw.length > 10) {
    const { data } = await s.from("members").select("id,name").eq("id", profileIdRaw).maybeSingle();
    if (data) member = data;
  }
  if (!member) {
    const { data } = await s.from("members").select("id,name");
    member = (data || []).find((m: { name: string }) => slugifyId(m.name || "") === profileId) || null;
  }
  if (!member) {
    return NextResponse.json({ error: "Integrante no encontrado" }, { status: 404 });
  }

  const updatePayload: Record<string, string> = {};
  if (avatarSeed) updatePayload.avatar_seed = avatarSeed;
  if (avatarStyle) updatePayload.avatar_style = avatarStyle;

  const { data: updated, error } = await s
    .from("members")
    .update(updatePayload)
    .eq("id", member.id)
    .select("id,name,avatar_seed,avatar_style")
    .maybeSingle();

  if (error) {
    if (error.code === "42703") {
      return NextResponse.json({
        ok: true,
        member: {
          id: member.id,
          name: member.name,
          avatar_seed: avatarSeed,
          avatar_style: avatarStyle,
          avatar_saved: false,
        },
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    member: {
      id: updated?.id || member.id,
      name: updated?.name || member.name,
      avatar_seed: updated?.avatar_seed ?? avatarSeed,
      avatar_style: updated?.avatar_style ?? avatarStyle,
      avatar_saved: true,
    },
  });
}
