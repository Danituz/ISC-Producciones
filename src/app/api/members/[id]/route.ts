import { NextResponse } from "next/server";
import { createRoute } from "@/lib/supabase/server";
import { slugifyId } from "@/lib/utils";

function normalizeCode(input: string | null | undefined) {
  if (!input) return null;
  const code = String(input).replace(/\D/g, "").slice(0, 4);
  return code.length === 4 ? code : null;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const s = createRoute();
  const { data: { session } } = await s.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const code = normalizeCode(body.verification_code);
  if (body.verification_code && !code) return NextResponse.json({ error: "El código debe ser de 4 dígitos" }, { status: 400 });

  const { data, error } = await s.from("members")
    .update({ name: body.name, verification_code: code })
    .eq("id", params.id)
    .select("id,name,verification_code").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { ...data, slug: slugifyId(data.name || "") } });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const s = createRoute();
  const { data: { session } } = await s.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await s.from("members").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
