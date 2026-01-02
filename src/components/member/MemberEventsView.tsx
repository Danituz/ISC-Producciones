"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import { MonthSelector } from "@/components/admin/MonthSelector";
import { Calendar } from "lucide-react";
import type { EventItem } from "@/lib/types";
import { slugifyId } from "@/lib/utils";
import { useEvents, getCurrentPeriod, prefetchAdjacentPeriods } from "@/lib/hooks/useEvents";

type Profile = {
  id: string;
  name: string;
  sourceName?: string;
  role: "member" | "guest" | "admin";
};

export function MemberEventsView({ profile }: { profile: Profile }) {
  const [period, setPeriod] = useState(getCurrentPeriod());
  const { events, isLoading } = useEvents(period);

  useEffect(() => {
    prefetchAdjacentPeriods(period);
  }, [period]);

  const uniqueEvents = useMemo(() => {
    const map = new Map<string, EventItem>();
    for (const ev of events) {
      const key =
        ev.id || slugifyId(`${ev.date || ""}-${ev.church_or_event || ""}-${ev.start_time || ""}-${ev.end_time || ""}`);

      if (!map.has(key)) {
        map.set(key, { ...ev, assignments: [...(ev.assignments || [])] });
      } else {
        const existing = map.get(key)!;
        const mergedAssignments = [...(existing.assignments || []), ...(ev.assignments || [])];
        const assignMap = new Map<string, { name: string; role: string }>();
        for (const a of mergedAssignments) {
          const aKey = `${a?.name || ""}-${a?.role || ""}`.toLowerCase();
          if (!assignMap.has(aKey)) assignMap.set(aKey, a);
        }
        map.set(key, { ...existing, assignments: Array.from(assignMap.values()) });
      }
    }
    return Array.from(map.values());
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!profile) return [];
    if (profile.role === "guest" || profile.role === "admin") return uniqueEvents;
    const matchName = (profile.sourceName || profile.name).toLowerCase();
    const filtered = uniqueEvents.filter((ev) =>
      (ev.assignments || []).some((a) => a.name.toLowerCase() === matchName)
    );
    return filtered;
  }, [uniqueEvents, profile]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Mis Eventos</h2>
        </div>
        <MonthSelector value={period} onChange={setPeriod} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-12 text-center">
          <Calendar className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="font-medium">No hay eventos</h3>
          <p className="mt-1 text-sm text-muted-foreground">No tienes eventos asignados en este periodo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((ev) => (
            <Link key={ev.id} href={`/evento/${ev.id}`} className="block">
              <EventCard data={ev} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
