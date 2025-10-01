import { NextResponse } from "next/server";
import { createRoute } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const s = createRoute();
  const { data: { session } } = await s.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = new URL(req.url).searchParams.get("type"); // audio | lights
  const table = type === "lights" ? "scenes_lights" : "scenes_audio";

  const { data, error } = await s.from(table).select("id,name").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const s = createRoute();
  const { data: { session } } = await s.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const table = body.type === "lights" ? "scenes_lights" : "scenes_audio";
  const { data, error } = await s.from(table)
    .insert({ user_id: session.user.id, name: body.name })
    .select("id,name").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
