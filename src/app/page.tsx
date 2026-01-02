"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";

import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import { MonthSelector } from "@/components/admin/MonthSelector";
import { useEvents, getCurrentPeriod, prefetchAdjacentPeriods } from "@/lib/hooks/useEvents";

export default function HomePage() {
  const [period, setPeriod] = useState(getCurrentPeriod());
  const { events, isLoading } = useEvents(period);

  useEffect(() => {
    prefetchAdjacentPeriods(period);
  }, [period]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Eventos</h1>
        </div>
        <MonthSelector value={period} onChange={setPeriod} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/50" />
          <div className="space-y-1">
            <p className="text-lg font-medium text-muted-foreground">No hay eventos este mes</p>
            <p className="text-sm text-muted-foreground/70">Prueba seleccionando otro periodo</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <Link key={ev.id} href={`/evento/${ev.id}`} className="block">
              <EventCard data={ev} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
