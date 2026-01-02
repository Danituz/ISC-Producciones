import { NextResponse } from "next/server";
import { z } from "zod";
import { createRoute } from "@/lib/supabase/server";

const UpdateSchema = z.object({
  payroll_rate: z.number().int().min(0).optional(),
});

export async function GET() {
  const s = createRoute();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Buscar settings del usuario
  let { data, error } = await s
    .from("settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Si no existe, crear con valores por defecto
  if (!data && !error?.message?.includes("multiple")) {
    const { data: created, error: createError } = await s
      .from("settings")
      .insert({ user_id: user.id, payroll_rate: 800 })
      .select("*")
      .single();

    if (createError) {
      // Puede fallar si ya existe (race condition), intentar leer de nuevo
      const retry = await s.from("settings").select("*").eq("user_id", user.id).single();
      data = retry.data;
      error = retry.error;
    } else {
      data = created;
      error = null;
    }
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data: {
      payroll_rate: data?.payroll_rate ?? 800,
    },
  });
}

export async function PATCH(req: Request) {
  const s = createRoute();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => ({}));
  const parsed = UpdateSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid payload";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const body = parsed.data;
  const updates: Record<string, any> = {};

  if (body.payroll_rate !== undefined) updates.payroll_rate = body.payroll_rate;

  // Upsert: crear si no existe, actualizar si existe
  const { data, error } = await s
    .from("settings")
    .upsert(
      { user_id: user.id, ...updates },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data: {
      payroll_rate: data?.payroll_rate ?? 800,
    },
  });
}
