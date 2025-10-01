"use client";
import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import type { EventItem } from "@/lib/types";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);

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

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Eventos de la semana</h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <EventCardSkeleton key={i} />)
          : events.map((ev) => <EventCard key={ev.id} data={ev} />)}
      </div>
    </section>
  );
}
