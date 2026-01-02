import { NextResponse } from "next/server";
import { z } from "zod";
import { createRoute } from "@/lib/supabase/server";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  pastor_name: z.string().optional().nullable(),
  default_arrival_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  default_start_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  default_end_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  scene_audio_id: z.string().uuid().optional().nullable(),
  scene_lights_id: z.string().uuid().optional().nullable(),
  croquis_id: z.string().uuid().optional().nullable(),
  channel_preset_id: z.string().uuid().optional().nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const s = createRoute();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await s
    .from("organizations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const s = createRoute();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => ({}));
  const parsed = UpdateSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid payload";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const updates: Record<string, any> = {};
  const body = parsed.data;

  if (body.name !== undefined) updates.name = body.name;
  if (body.pastor_name !== undefined) updates.pastor_name = body.pastor_name;
  if (body.default_arrival_time !== undefined) updates.default_arrival_time = body.default_arrival_time;
  if (body.default_start_time !== undefined) updates.default_start_time = body.default_start_time;
  if (body.default_end_time !== undefined) updates.default_end_time = body.default_end_time;
  if (body.scene_audio_id !== undefined) updates.scene_audio_id = body.scene_audio_id;
  if (body.scene_lights_id !== undefined) updates.scene_lights_id = body.scene_lights_id;
  if (body.croquis_id !== undefined) updates.croquis_id = body.croquis_id;
  if (body.channel_preset_id !== undefined) updates.channel_preset_id = body.channel_preset_id;

  const { data, error } = await s
    .from("organizations")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const s = createRoute();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // La eliminación en CASCADE borrará eventos y recursos vinculados
  const { error } = await s
    .from("organizations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
