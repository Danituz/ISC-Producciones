import { NextResponse } from "next/server";
import { z } from "zod";
import { createRoute } from "@/lib/supabase/server";

const BodySchema = z.object({
  name: z.string().min(1),
  image_data_url: z.string().optional(), // dataURL del PNG
  data: z.any().optional(), // JSON opcional (estado del editor)
});

function dataUrlToBuffer(dataUrl: string) {
  const [, , b64] = dataUrl.match(/^data:(.+);base64,(.*)$/) || [];
  if (!b64) throw new Error("Invalid data URL");
  return Buffer.from(b64, "base64");
}

export async function GET() {
  const s = createRoute();
  const { data: { session } } = await s.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await s
    .from("croquis")
    .select("id,name,image_url")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const s = createRoute();
  const { data: { session } } = await s.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. Inserta fila vacía con nombre
  const { data: row, error: insErr } = await s
    .from("croquis")
    .insert({ user_id: session.user.id, name: parsed.data.name })
    .select("id")
    .single();

  if (insErr || !row) {
    return NextResponse.json({ error: insErr?.message || "Insert error" }, { status: 500 });
  }

  let image_url: string | null = null;

  try {
    // 2. Si viene dataURL → subir al bucket
    if (parsed.data.image_data_url) {
      const buf = dataUrlToBuffer(parsed.data.image_data_url);
      const path = `${session.user.id}/${row.id}.png`;

      const up = await s.storage.from("croquis").upload(path, buf, {
        contentType: "image/png",
        upsert: true,
      });
      if (up.error) throw up.error;

      const pub = s.storage.from("croquis").getPublicUrl(path);
      image_url = pub.data.publicUrl;
    }

    // 3. Actualiza fila con image_url y data
    const { data: updated, error: updErr } = await s
      .from("croquis")
      .update({
        image_url,
        data: parsed.data.data ?? null,
      })
      .eq("id", row.id)
      .select("id,name,image_url")
      .single();

    if (updErr) throw updErr;

    return NextResponse.json({ data: updated }, { status: 201 });
  } catch (e: any) {
    // Limpieza si falló el upload
    await s.from("croquis").delete().eq("id", row.id);
    return NextResponse.json({ error: e.message || "Upload error" }, { status: 500 });
  }
}
