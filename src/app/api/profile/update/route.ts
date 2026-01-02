import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { slugifyId } from "@/lib/utils";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const profileIdRaw = String(body?.profileId ?? "");
  const profileId = slugifyId(profileIdRaw);
  const currentCode = String(body?.currentCode ?? "").replace(/\D/g, "").slice(0, 4);
  const newName = String(body?.newName ?? "").trim();
  const newCode = String(body?.newCode ?? "").replace(/\D/g, "").slice(0, 4);
  const avatarSeed = body?.avatarSeed ? String(body.avatarSeed) : undefined;
  const avatarStyle = body?.avatarStyle ? String(body.avatarStyle) : undefined;

  if (!profileId) return NextResponse.json({ error: "Perfil requerido" }, { status: 400 });
  if (!currentCode || currentCode.length !== 4) return NextResponse.json({ error: "Código actual debe tener 4 dígitos" }, { status: 400 });
  if (body.newCode && newCode.length !== 4) return NextResponse.json({ error: "El nuevo código debe tener 4 dígitos" }, { status: 400 });

  const cookieStore = await cookies();
  const s = createRouteHandlerClient({ cookies: () => cookieStore });

  let member: any = null;
  if (profileIdRaw && profileIdRaw.length > 10) {
    const { data } = await s.from("members").select("id,name,verification_code").eq("id", profileIdRaw).maybeSingle();
    if (data) member = data;
  }
  if (!member) {
    const { data } = await s.from("members").select("id,name,verification_code");
    member = (data || []).find((m: any) => slugifyId(m.name || "") === profileId);
  }
  if (!member) return NextResponse.json({ error: "Integrante no encontrado" }, { status: 404 });

  const expected = String(member.verification_code || "").trim();
  if (!expected || expected !== currentCode) return NextResponse.json({ error: "Código incorrecto" }, { status: 400 });

  const updatePayload: Record<string, any> = {};
  if (newName) updatePayload.name = newName;
  if (newCode) updatePayload.verification_code = newCode;

  if (avatarSeed) updatePayload.avatar_seed = avatarSeed;
  if (avatarStyle) updatePayload.avatar_style = avatarStyle;

  if (!Object.keys(updatePayload).length) {
    return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
  }

  const runUpdate = async (payload: Record<string, any>) => s
    .from("members")
    .update(payload)
    .eq("id", member.id)
    .select("id,name,verification_code,avatar_seed,avatar_style")
    .maybeSingle();

  let { data: updated, error } = await runUpdate(updatePayload);
  let avatarSaved = true;

  if (error && error.code === "42703") {
    avatarSaved = false;
    const { avatar_seed, avatar_style, ...rest } = updatePayload;
    ({ data: updated, error } = await runUpdate(rest));
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    member: {
      id: updated?.id || member.id,
      name: updated?.name || member.name,
      verification_code: updated?.verification_code || newCode || member.verification_code,
      slug: slugifyId(updated?.name || member.name || ""),
      avatar_seed: updated?.avatar_seed ?? avatarSeed,
      avatar_style: updated?.avatar_style ?? avatarStyle,
      avatar_saved: avatarSaved,
    },
  });
}
