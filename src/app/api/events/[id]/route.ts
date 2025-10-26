import { NextResponse } from "next/server";
import { z } from "zod";
import { createRoute } from "@/lib/supabase/server";

const ChannelItem = z.object({
  number: z.number().int().positive(),
  label: z.string().min(1),
});

const PatchSchema = z.object({
  church_or_event: z.string().min(1).optional(),
  pastor_name: z.string().optional().nullable(),

  date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  arrival_time: z.string().optional(),

  audio_members: z.array(z.string()).optional(),
  lights_members: z.array(z.string()).optional(),

  scene_audio_id: z.string().uuid().optional().nullable(),
  scene_lights_id: z.string().uuid().optional().nullable(),

  croquis_id: z.string().uuid().optional().nullable(),
  channel_preset_id: z.string().uuid().optional().nullable(),

  channels: z.array(ChannelItem).optional(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = createRoute();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => ({}));
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid payload";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const patch = parsed.data;

  // Si cambian el preset y no mandan canales, denormaliza canales del preset
  if (typeof patch.channel_preset_id !== "undefined" && typeof patch.channels === "undefined") {
    const presetId = patch.channel_preset_id;
    if (presetId) {
      let ch: any[] | null = null;
      let err: any = null;
      ({ data: ch, error: err } = await s
        .from("channel_presets")
        .select("channels")
        .eq("id", presetId)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(r => ({ data: (r.data as any)?.channels ?? null, error: r.error })));
      if (err || !Array.isArray(ch)) {
        ({ data: ch } = await s
          .from("chanel_preset")
          .select("channels")
          .eq("id", presetId)
          .eq("user_id", user.id)
          .maybeSingle()
          .then(r => ({ data: (r.data as any)?.channels ?? null })));
      }
      if (Array.isArray(ch)) (patch as any).channels = ch;
    } else {
      // Si quitan el preset explícitamente, no forzamos canales; el cliente puede mandar channels aparte
    }
  }

  // Solo actualiza eventos del usuario (RLS de todas formas protege)
  const { data, error } = await s
    .from("events")
    .update(patch)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const s = createRoute();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await s
    .from("events")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = createRoute();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await s
    .from("events")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
