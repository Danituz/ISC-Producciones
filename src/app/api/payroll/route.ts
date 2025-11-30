import { NextResponse } from "next/server";
import { createRoute } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const s = createRoute();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const start = url.searchParams.get("start"); // YYYY-MM-DD
  const end = url.searchParams.get("end");     // YYYY-MM-DD
  if (!start || !end) {
    return NextResponse.json({ error: "Missing start or end date" }, { status: 400 });
  }

  const { data: events, error } = await s
    .from("events")
    .select("id,date,church_or_event,audio_members,lights_members")
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Row = { id: string; date: string; church_or_event: string; audio_members: string[] | null; lights_members: string[] | null };
  const byMember = new Map<string, { events: { id: string; date: string; church_or_event: string; roles: ("audio"|"luces")[] }[] }>();

  for (const ev of (events || []) as Row[]) {
    const members = new Map<string, Set<"audio"|"luces">>();
    for (const n of ev.audio_members || []) {
      if (!members.has(n)) members.set(n, new Set());
      members.get(n)!.add("audio");
    }
    for (const n of ev.lights_members || []) {
      if (!members.has(n)) members.set(n, new Set());
      members.get(n)!.add("luces");
    }
    members.forEach((roles, name) => {
      if (!byMember.has(name)) byMember.set(name, { events: [] });
      byMember.get(name)!.events.push({ id: ev.id, date: ev.date, church_or_event: ev.church_or_event, roles: Array.from(roles) });
    });
  }

  const RATE = 800;
  const members = Array.from(byMember.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, val]) => ({
      name,
      count: val.events.length,           // por evento, no por rol
      total: val.events.length * RATE,
      events: val.events,
    }));

  const summary = {
    start,
    end,
    total_members: members.length,
    total_events: (events || []).length,
    total_payout: members.reduce((acc, m) => acc + m.total, 0),
    rate: RATE,
  };

  return NextResponse.json({ data: { members, summary } });
}
