import { NextResponse } from "next/server";
import { z } from "zod";
import { createRoute } from "@/lib/supabase/server";

const ChannelItem = z.object({
  number: z.number().int().positive(),
  label: z.string().min(1),
});

const BodySchema = z.object({
  organization_id: z.string().uuid().optional().nullable(),

  church_or_event: z.string().min(1).optional(),
  pastor_name: z.string().optional().nullable(),

  date: z.string().min(1),
  start_time: z.string().min(1).optional(),
  end_time: z.string().min(1).optional(),
  arrival_time: z.string().min(1).optional(),

  audio_members: z.array(z.string()).optional().default([]),
  lights_members: z.array(z.string()).optional().default([]),

  scene_audio_id: z.string().uuid().optional().nullable(),
  scene_lights_id: z.string().uuid().optional().nullable(),

  croquis_id: z.string().uuid().optional().nullable(),
  channel_preset_id: z.string().uuid().optional().nullable(),

  channels: z.array(ChannelItem).optional().default([]),
  notes: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const s = createRoute();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Query params para filtrar
  const url = new URL(req.url);
  const period = url.searchParams.get("period"); // YYYY-MM
  const organizationId = url.searchParams.get("organization_id");

  // Construir query
  let query = s.from("events").select("*").eq("user_id", user.id);

  // Filtrar por período (YYYY-MM)
  if (period && /^\d{4}-\d{2}$/.test(period)) {
    const startDate = `${period}-01`;
    const [year, month] = period.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${period}-${String(lastDay).padStart(2, "0")}`;
    query = query.gte("date", startDate).lte("date", endDate);
  }

  // Filtrar por organización
  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data: events, error } = await query.order("date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Catálogos para resolver nombres
  const [audioRes, lightsRes, croquisRes, presetsRes, orgsRes] = await Promise.all([
    s.from("scenes_audio").select("id,name").eq("user_id", user.id),
    s.from("scenes_lights").select("id,name").eq("user_id", user.id),
    s.from("croquis").select("id,name,image_url").eq("user_id", user.id),
    s.from("channel_presets").select("id,name").eq("user_id", user.id),
    s.from("organizations").select("id,name").eq("user_id", user.id),
  ]);

  const audioMap = new Map((audioRes.data || []).map((r: any) => [r.id, r.name]));
  const lightsMap = new Map((lightsRes.data || []).map((r: any) => [r.id, r.name]));
  const croquisMap = new Map((croquisRes.data || []).map((r: any) => [r.id, { name: r.name, image_url: r.image_url }]));
  const presetsMap = new Map((presetsRes.data || []).map((r: any) => [r.id, r.name]));
  const orgsMap = new Map((orgsRes.data || []).map((r: any) => [r.id, r.name]));

  const data = (events || []).map((ev: any) => ({
    ...ev,
    scene_audio_name: ev.scene_audio_id ? audioMap.get(ev.scene_audio_id) ?? null : null,
    scene_lights_name: ev.scene_lights_id ? lightsMap.get(ev.scene_lights_id) ?? null : null,
    croquis_name: ev.croquis_id ? croquisMap.get(ev.croquis_id)?.name ?? null : null,
    croquis_image_url: ev.croquis_id ? croquisMap.get(ev.croquis_id)?.image_url ?? ev.croquis_url ?? null : ev.croquis_url ?? null,
    channel_preset_name: ev.channel_preset_id ? presetsMap.get(ev.channel_preset_id) ?? null : null,
    organization_name: ev.organization_id ? orgsMap.get(ev.organization_id) ?? null : null,
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

  // Si viene organization_id, auto-llenar datos desde la organización
  let orgDefaults: any = {};
  if (body.organization_id) {
    const { data: org } = await s
      .from("organizations")
      .select("*")
      .eq("id", body.organization_id)
      .eq("user_id", user.id)
      .single();

    if (org) {
      orgDefaults = {
        church_or_event: org.name,
        pastor_name: org.pastor_name,
        arrival_time: org.default_arrival_time?.substring(0, 5),
        start_time: org.default_start_time?.substring(0, 5),
        end_time: org.default_end_time?.substring(0, 5),
        scene_audio_id: org.scene_audio_id,
        scene_lights_id: org.scene_lights_id,
        croquis_id: org.croquis_id,
        channel_preset_id: org.channel_preset_id,
      };
    }
  }

  // Validar que tengamos church_or_event (de body o de org)
  const churchOrEvent = body.church_or_event || orgDefaults.church_or_event;
  if (!churchOrEvent) {
    return NextResponse.json({ error: "church_or_event es requerido" }, { status: 400 });
  }

  // Validar horarios
  const startTime = body.start_time || orgDefaults.start_time;
  const endTime = body.end_time || orgDefaults.end_time;
  const arrivalTime = body.arrival_time || orgDefaults.arrival_time;

  if (!startTime || !endTime || !arrivalTime) {
    return NextResponse.json({ error: "Horarios son requeridos" }, { status: 400 });
  }

  const insert: Record<string, any> = {
    user_id: user.id,
    organization_id: body.organization_id ?? null,
    church_or_event: churchOrEvent,
    pastor_name: body.pastor_name ?? orgDefaults.pastor_name ?? null,
    date: body.date,
    start_time: startTime,
    end_time: endTime,
    arrival_time: arrivalTime,
    audio_members: body.audio_members ?? [],
    lights_members: body.lights_members ?? [],
    scene_audio_id: body.scene_audio_id ?? orgDefaults.scene_audio_id ?? null,
    scene_lights_id: body.scene_lights_id ?? orgDefaults.scene_lights_id ?? null,
    croquis_id: body.croquis_id ?? orgDefaults.croquis_id ?? null,
    channel_preset_id: body.channel_preset_id ?? orgDefaults.channel_preset_id ?? null,
    channels: body.channels ?? [],
    notes: body.notes ?? null,
  };

  // Si viene un preset y no se enviaron canales ad-hoc, denormaliza los canales del preset
  if (insert.channel_preset_id && (!Array.isArray(insert.channels) || insert.channels.length === 0)) {
    const { data: presetData } = await s
      .from("channel_presets")
      .select("channels")
      .eq("id", insert.channel_preset_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (presetData?.channels && Array.isArray(presetData.channels)) {
      insert.channels = presetData.channels;
    }
  }

  const { data, error } = await s
    .from("events")
    .insert(insert)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
