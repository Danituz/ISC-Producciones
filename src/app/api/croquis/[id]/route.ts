// src/app/api/croquis/[id]/route.ts
import { NextResponse } from "next/server";
import { createRoute } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = createRoute();
  const { data: { session } } = await s.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await s
    .from("croquis")
    .select("id,name,image_url,data")
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const s = createRoute();
  const { data: { session } } = await s.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Si ya implementaste upload a Storage, aquí podrías recibir body.image_data_url y subirla.
  const { data, error } = await s
    .from("croquis")
    .update({
      name: body.name,                // opcional
      image_url: body.image_url ?? null,
      data: body.data ?? null,
    })
    .eq("id", params.id)
    .select("id,name,image_url,data")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const s = createRoute();
  const { data: { session } } = await s.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await s.from("croquis").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
