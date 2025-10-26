import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

function to12(hhmm: string) {
  const [H, m] = hhmm.split(":").map(Number);
  const ap = H >= 12 ? "PM" : "AM";
  const h = H % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

export async function GET() {
  const cookieStore = await cookies();
  const s = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1) Eventos (lectura pública permitida por policy)
  const { data: evs, error } = await s
    .from("events")
    .select("*")
    .order("date", { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2) Recolecta ids para resolver nombres
  const audioIds = Array.from(
    new Set((evs || []).map((e: any) => e.scene_audio_id).filter(Boolean))
  );
  const lightsIds = Array.from(
    new Set((evs || []).map((e: any) => e.scene_lights_id).filter(Boolean))
  );
  const croquisIds = Array.from(
    new Set((evs || []).map((e: any) => e.croquis_id).filter(Boolean))
  );

  // 3) Trae catálogos desde tablas separadas
  const [audRes, ligRes, croRes] = await Promise.all([
    audioIds.length
      ? s.from("scenes_audio").select("id,name").in("id", audioIds)
      : Promise.resolve({ data: [] as any[], error: null }),
    lightsIds.length
      ? s.from("scenes_lights").select("id,name").in("id", lightsIds)
      : Promise.resolve({ data: [] as any[], error: null }),
    croquisIds.length
      ? s.from("croquis").select("id,image_url").in("id", croquisIds)
      : Promise.resolve({ data: [] as any[], error: null }),
  ]);

  const audioMap = new Map<string, string>();
  (audRes.data || []).forEach((r: any) => audioMap.set(r.id, r.name));

  const lightsMap = new Map<string, string>();
  (ligRes.data || []).forEach((r: any) => lightsMap.set(r.id, r.name));

  const croMap = new Map<string, string | null>();
  (croRes.data || []).forEach((r: any) => croMap.set(r.id, r.image_url ?? null));

  // 4) Mapea al shape del frontend
  const data = (evs || []).map((e: any) => {
    const day = new Date(e.date).toLocaleDateString("es-MX", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
    const timeRange = `${to12(e.start_time)} – ${to12(e.end_time)}`;
    return {
      id: e.id,
      dateLabel: `${day}, ${timeRange}`,
      church_or_event: e.church_or_event,
      pastor_name: e.pastor_name || "",
      arrival: to12(e.arrival_time),
      time: timeRange,
      scene_audio: e.scene_audio_id ? audioMap.get(e.scene_audio_id) ?? "" : "",
      scene_lights: e.scene_lights_id ? lightsMap.get(e.scene_lights_id) ?? "" : "",
      assignments: [
        ...(e.audio_members || []).map((n: string) => ({ name: n, role: "audio" as const })),
        ...(e.lights_members || []).map((n: string) => ({ name: n, role: "luces" as const })),
      ],
      channels: e.channels || [],
      croquis_image_url: e.croquis_id ? croMap.get(e.croquis_id) ?? null : e.croquis_url ?? null,
      notes: e.notes || undefined,
    };
  });

  return NextResponse.json({ data });
}
