import { NextResponse } from "next/server";
import { z } from "zod";
import { createRoute } from "@/lib/supabase/server";

/** Payload del form */
const ChannelItem = z.object({
  number: z.number().int().positive(),
  label: z.string().min(1),
});

const BodySchema = z.object({
  church_or_event: z.string().min(1),
  pastor_name: z.string().optional().nullable(),

  date: z.string().min(1),        // YYYY-MM-DD
  start_time: z.string().min(1),  // HH:mm (24h)
  end_time: z.string().min(1),    // HH:mm (24h)
  arrival_time: z.string().min(1),// HH:mm (24h)

  audio_members: z.array(z.string()).optional().default([]),
  lights_members: z.array(z.string()).optional().default([]),

  scene_audio_id: z.string().uuid().optional().nullable(),
  scene_lights_id: z.string().uuid().optional().nullable(),

  croquis_id: z.string().uuid().optional().nullable(),

  channel_preset_id: z.string().uuid().optional().nullable(),

  channels: z.array(ChannelItem).optional().default([]),

  notes: z.string().optional().nullable(),
});

export async function GET() {
  const s = createRoute();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Trae SOLO los eventos del usuario (RLS también ayuda, pero es mejor explícito)
  const { data: events, error } = await s
    .from("events")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Catálogos para resolver nombres
  const [scenesRes, croquisRes, presetsRes] = await Promise.all([
    s.from("scenes").select("id,name,type").eq("user_id", user.id),
    s.from("croquis").select("id,name,image_url").eq("user_id", user.id),
    s.from("channel_presets").select("id,name").eq("user_id", user.id),
  ]);

  const scenes = (scenesRes.data || []).reduce<Record<string, { name: string; type: string }>>((acc, r) => {
    acc[r.id] = { name: r.name, type: r.type };
    return acc;
  }, {});
  const croquis = (croquisRes.data || []).reduce<Record<string, { name: string; image_url: string | null }>>((acc, r) => {
    acc[r.id] = { name: r.name, image_url: r.image_url ?? null };
    return acc;
  }, {});
  const presets = (presetsRes.data || []).reduce<Record<string, string>>((acc, r) => {
    acc[r.id] = r.name;
    return acc;
  }, {});

  const data = (events || []).map((ev: any) => ({
    ...ev,
    scene_audio_name: ev.scene_audio_id ? scenes[ev.scene_audio_id]?.name ?? null : null,
    scene_lights_name: ev.scene_lights_id ? scenes[ev.scene_lights_id]?.name ?? null : null,
    croquis_name: ev.croquis_id ? croquis[ev.croquis_id]?.name ?? null : null,
    croquis_image_url: ev.croquis_id ? (croquis[ev.croquis_id]?.image_url ?? ev.croquis_url ?? null) : (ev.croquis_url ?? null),
    channel_preset_name: ev.channel_preset_id ? presets[ev.channel_preset_id] ?? null : null,
  }));

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const s = createRoute();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid payload";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const body = parsed.data;

  // Normaliza nulls/arrays para jsonb
  const insert = {
    user_id: user.id,                                // <- IMPORTANTE para RLS
    church_or_event: body.church_or_event,
    pastor_name: body.pastor_name ?? null,

    date: body.date,
    start_time: body.start_time,
    end_time: body.end_time,
    arrival_time: body.arrival_time,

    audio_members: body.audio_members ?? [],
    lights_members: body.lights_members ?? [],

    scene_audio_id: body.scene_audio_id ?? null,
    scene_lights_id: body.scene_lights_id ?? null,

    croquis_id: body.croquis_id ?? null,

    channel_preset_id: body.channel_preset_id ?? null,

    channels: body.channels ?? [],
    notes: body.notes ?? null,
  };

  const { data, error } = await s
    .from("events")
    .insert(insert)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
