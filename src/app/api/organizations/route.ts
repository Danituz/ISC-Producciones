import { NextResponse } from "next/server";
import { z } from "zod";
import { createRoute } from "@/lib/supabase/server";

const OrganizationSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  pastor_name: z.string().optional().nullable(),
  default_arrival_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  default_start_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  default_end_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  scene_audio_id: z.string().uuid().optional().nullable(),
  scene_lights_id: z.string().uuid().optional().nullable(),
  croquis_id: z.string().uuid().optional().nullable(),
  channel_preset_id: z.string().uuid().optional().nullable(),
});

export async function GET() {
  const s = createRoute();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: orgs, error } = await s
    .from("organizations")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolver nombres de recursos
  const [audioRes, lightsRes, croquisRes, presetsRes] = await Promise.all([
    s.from("scenes_audio").select("id,name").eq("user_id", user.id),
    s.from("scenes_lights").select("id,name").eq("user_id", user.id),
    s.from("croquis").select("id,name,image_url").eq("user_id", user.id),
    s.from("channel_presets").select("id,name").eq("user_id", user.id),
  ]);

  const audioMap = new Map((audioRes.data || []).map((r: any) => [r.id, r.name]));
  const lightsMap = new Map((lightsRes.data || []).map((r: any) => [r.id, r.name]));
  const croquisMap = new Map((croquisRes.data || []).map((r: any) => [r.id, { name: r.name, image_url: r.image_url }]));
  const presetsMap = new Map((presetsRes.data || []).map((r: any) => [r.id, r.name]));

  const data = (orgs || []).map((o: any) => ({
    ...o,
    scene_audio_name: o.scene_audio_id ? audioMap.get(o.scene_audio_id) : null,
    scene_lights_name: o.scene_lights_id ? lightsMap.get(o.scene_lights_id) : null,
    croquis_name: o.croquis_id ? croquisMap.get(o.croquis_id)?.name : null,
    croquis_image_url: o.croquis_id ? croquisMap.get(o.croquis_id)?.image_url : null,
    channel_preset_name: o.channel_preset_id ? presetsMap.get(o.channel_preset_id) : null,
  }));

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const s = createRoute();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => ({}));
  const parsed = OrganizationSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid payload";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const body = parsed.data;
  const insert = {
    user_id: user.id,
    name: body.name,
    pastor_name: body.pastor_name ?? null,
    default_arrival_time: body.default_arrival_time ?? null,
    default_start_time: body.default_start_time ?? null,
    default_end_time: body.default_end_time ?? null,
    scene_audio_id: body.scene_audio_id ?? null,
    scene_lights_id: body.scene_lights_id ?? null,
    croquis_id: body.croquis_id ?? null,
    channel_preset_id: body.channel_preset_id ?? null,
  };

  const { data, error } = await s
    .from("organizations")
    .insert(insert)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
