import { NextResponse } from "next/server";
import { createRoute } from "@/lib/supabase/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const s = createRoute();
  const { data: { session } } = await s.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const table = body.type === "lights" ? "scenes_lights" : "scenes_audio";
  const { data, error } = await s.from(table).update({ name: body.name }).eq("id", params.id).select("id,name").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const s = createRoute();
  const { data: { session } } = await s.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = new URL(req.url).searchParams.get("type");
  const table = type === "lights" ? "scenes_lights" : "scenes_audio";

  const { error } = await s.from(table).delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
