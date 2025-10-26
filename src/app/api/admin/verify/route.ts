import { NextResponse } from "next/server";
import { createRoute } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const s = createRoute();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code = String(body?.code ?? '');
  const expected = process.env.ADMIN_VERIFICATION_CODE || '';
  if (!expected) return NextResponse.json({ error: 'Not configured' }, { status: 400 });
  if (code !== expected) return NextResponse.json({ error: 'Invalid code' }, { status: 400 });

  const { error } = await s.auth.updateUser({ data: { admin_verified: true, admin_verified_at: new Date().toISOString() } });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

