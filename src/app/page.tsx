"use client";
import { useEffect, useMemo, useState } from "react";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import type { EventItem } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [member, setMember] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await fetch("/api/public-events", { cache: "no-store" });
        const j = await r.json();
        if (!active) return;
        setEvents(j.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const members = useMemo(() => {
    const set = new Set<string>();
    for (const ev of events) {
      for (const a of ev.assignments || []) {
        if (a?.name) set.add(a.name);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const filtered = useMemo(() => {
    if (!member) return events;
    return events.filter(ev => (ev.assignments || []).some(a => a.name === member));
  }, [events, member]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl font-semibold">Eventos de la semana</h2>
        <div className="w-full sm:w-72">
          <Label>Filtrar por integrante</Label>
          <Select value={member ?? undefined} onValueChange={(v) => setMember(v === "all" ? null : v)}>
            <SelectTrigger className="mt-2 h-10">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {members.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <EventCardSkeleton key={i} />)
          : filtered.map((ev) => <EventCard key={ev.id} data={ev} />)}
      </div>
    </section>
  );
}
