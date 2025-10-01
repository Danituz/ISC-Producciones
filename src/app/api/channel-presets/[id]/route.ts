import { NextResponse } from "next/server";
import { z } from "zod";
import { createRoute } from "@/lib/supabase/server";

const ChannelItem = z.object({
  number: z.number().int().positive(),
  label: z.string().min(1),
});
const PatchSchema = z.object({
  name: z.string().min(1).optional(),
  channels: z.array(ChannelItem).optional(),
});

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createRoute();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  const body = await _req.json().catch(() => ({}));
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const patch: Record<string, any> = {};
  if (typeof parsed.data.name !== "undefined") patch.name = parsed.data.name;
  if (typeof parsed.data.channels !== "undefined") patch.channels = parsed.data.channels;

  const { data, error } = await supabase
    .from("channel_presets")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id,name,channels,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createRoute();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  const { error } = await supabase
    .from("channel_presets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
