import { NextResponse } from "next/server";
import { createRoute } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { slugifyId } from "@/lib/utils";

export async function GET() {
  // Prefer service role para evitar políticas RLS y mostrar todos
  if (adminSupabase) {
    const { data, error } = await adminSupabase
      .from("members")
      .select("id,name,avatar_seed,avatar_style")
      .order("created_at", { ascending: false });
    // Si la tabla no tiene columnas de avatar, reintenta sin ellas
    if (error && error.code === "42703") {
      const retry = await adminSupabase.from("members").select("id,name").order("created_at", { ascending: false });
      if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 500 });
      const mappedRetry = (retry.data || []).map((m: any) => ({ id: m.id, name: m.name, slug: slugifyId(m.name || "") }));
      return NextResponse.json({ data: mappedRetry });
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const mapped = (data || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      avatar_seed: m.avatar_seed,
      avatar_style: m.avatar_style,
      slug: slugifyId(m.name || ""),
    }));
    return NextResponse.json({ data: mapped });
  }

  // Fallback al cliente normal (requiere políticas que permitan lectura)
  const s = createRoute();
  const { data, error } = await s.from("members").select("id,name,avatar_seed,avatar_style").order("created_at", { ascending: false });
  if (error && error.code === "42703") {
    const retry = await s.from("members").select("id,name").order("created_at", { ascending: false });
    if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 500 });
    const mappedRetry = (retry.data || []).map((m: any) => ({ id: m.id, name: m.name, slug: slugifyId(m.name || "") }));
    return NextResponse.json({ data: mappedRetry });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const mapped = (data || []).map((m: any) => ({
    id: m.id,
    name: m.name,
    avatar_seed: (m as any).avatar_seed,
    avatar_style: (m as any).avatar_style,
    slug: slugifyId(m.name || ""),
  }));
  return NextResponse.json({ data: mapped });
}
