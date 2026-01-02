import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { slugifyId } from "@/lib/utils";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const profileIdRaw = String(body?.profileId ?? "");
  const profileId = slugifyId(profileIdRaw);
  const newName = String(body?.newName ?? "").trim();

  if (!profileId) {
    return NextResponse.json({ error: "Perfil requerido" }, { status: 400 });
  }
  if (!newName) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
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

  const { data: updated, error } = await s
    .from("members")
    .update({ name: newName })
    .eq("id", member.id)
    .select("id,name")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    member: {
      id: updated?.id || member.id,
      name: updated?.name || newName,
      slug: slugifyId(updated?.name || newName),
    },
  });
}
