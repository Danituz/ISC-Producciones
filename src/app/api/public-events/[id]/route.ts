import { NextResponse } from "next/server";
import { createRoute } from "@/lib/supabase/server";

function to12h(hhmm24?: string | null) {
  if (!hhmm24) return "";
  const [H, m] = hhmm24.split(":").map(Number);
  const ap = H >= 12 ? "PM" : "AM";
  const h12 = (H % 12) || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const s = createRoute();

  // 1) Evento
  const { data: ev, error } = await s
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 2) Escenas (dos tablas separadas)
  let sceneAudioName: string | null = null;
  let sceneLightsName: string | null = null;

  if (ev.scene_audio_id) {
    const { data } = await s
      .from("scenes_audio")
      .select("name")
      .eq("id", ev.scene_audio_id)
      .maybeSingle();
    sceneAudioName = data?.name ?? null;
  }
  if (ev.scene_lights_id) {
    const { data } = await s
      .from("scenes_lights")
      .select("name")
      .eq("id", ev.scene_lights_id)
      .maybeSingle();
    sceneLightsName = data?.name ?? null;
  }

  // 3) Croquis: devolvemos el JSON guardado (no imagen)
  //    Prioridad: croquis_id -> croquis.data; de lo contrario, events.croquis_json (si lo usas).
  let croquisData: any = ev.croquis_json ?? null;
  if (ev.croquis_id) {
    const { data } = await s
      .from("croquis")
      .select("data")
      .eq("id", ev.croquis_id)
      .maybeSingle();
    croquisData = data?.data ?? croquisData ?? null;
  }

  // 4) Canales: preset o ad-hoc
  let channels: any[] = Array.isArray(ev.channels) ? ev.channels : [];
  if (ev.channel_preset_id) {
    // Try canonical table first; if not found, fallback to common misspelling
    let data: any = null;
    let error: any = null;
    ({ data, error } = await s
      .from("channel_presets")
      .select("channels")
      .eq("id", ev.channel_preset_id)
      .maybeSingle());
    if (error || !Array.isArray(data?.channels)) {
      ({ data } = await s
        .from("chanel_preset")
        .select("channels")
        .eq("id", ev.channel_preset_id)
        .maybeSingle());
    }
    if (Array.isArray(data?.channels)) channels = data!.channels;
  }

  // 5) Mapeo a EventItem que espera el front
  const date = new Date(ev.date);
  const dateLabel = `${date.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  })}, ${to12h(ev.start_time)}–${to12h(ev.end_time)}`;

  const data = {
    id: ev.id as string,
    dateLabel,
    church_or_event: ev.church_or_event as string,
    pastor_name: ev.pastor_name ?? "",
    arrival: to12h(ev.arrival_time),
    time: `${to12h(ev.start_time)} – ${to12h(ev.end_time)}`,
    scene_audio: sceneAudioName ?? "",
    scene_lights: sceneLightsName ?? "",
    assignments: [
      ...(ev.audio_members ?? []).map((name: string) => ({ name, role: "audio" as const })),
      ...(ev.lights_members ?? []).map((name: string) => ({ name, role: "luces" as const })),
    ],
    channels,               // ← lista final de canales (preset o ad-hoc)
    croquis_data: croquisData ?? null, // ← JSON del editor
    // croquis_image_url: undefined // ya no usamos imagen directa
    notes: ev.notes ?? "",
  };

  return NextResponse.json({ data });
}
