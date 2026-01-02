"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet2, DollarSign } from "lucide-react";
import { MonthSelector } from "@/components/admin/MonthSelector";
import type { EventItem } from "@/lib/types";
import { useEvents, getCurrentPeriod, prefetchAdjacentPeriods } from "@/lib/hooks/useEvents";
import { usePayrollRate } from "@/lib/hooks/useSettings";

type Profile = {
  id: string;
  name: string;
  sourceName?: string;
  role: "member";
};

export function MemberNominaView({ profile }: { profile: Profile }) {
  const [period, setPeriod] = useState(getCurrentPeriod());
  const { events, isLoading } = useEvents(period);
  const payrollRate = usePayrollRate();

  useEffect(() => {
    prefetchAdjacentPeriods(period);
  }, [period]);

  const uniqueEvents = useMemo(() => {
    const map = new Map<string, EventItem>();
    for (const ev of events) {
      const key =
        ev.id || `${ev.date || ""}-${ev.church_or_event || ""}-${ev.start_time || ""}-${ev.end_time || ""}`.toLowerCase();
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
    const match = (profile.sourceName || profile.name).toLowerCase();
    const filtered = uniqueEvents.filter((ev) => (ev.assignments || []).some((a) => a.name.toLowerCase() === match));
    return filtered;
  }, [uniqueEvents, profile]);

  const totalPayout = filteredEvents.length * payrollRate;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Wallet2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Mi Nomina</h2>
        </div>
        <MonthSelector value={period} onChange={setPeriod} />
      </div>

      <Card className="border border-border/70 bg-background/70">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="text-xs uppercase text-muted-foreground">Resumen del periodo</div>
            <div className="flex items-baseline gap-1">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-semibold">{Number(totalPayout || 0).toLocaleString("es-MX")}</span>
            </div>
            <div className="text-sm text-muted-foreground">{filteredEvents.length} evento(s) asignado(s)</div>
          </div>
          <Badge variant="secondary" className="h-8 self-start px-3">
            Tarifa: ${payrollRate}
          </Badge>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card className="border border-border/70 bg-background/70">
          <CardContent className="p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-32 rounded bg-muted/50" />
              <div className="h-16 rounded bg-muted/30" />
              <div className="h-16 rounded bg-muted/30" />
            </div>
          </CardContent>
        </Card>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-12 text-center">
          <Wallet2 className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="font-medium">Sin eventos</h3>
          <p className="mt-1 text-sm text-muted-foreground">No tienes eventos asignados en este periodo</p>
        </div>
      ) : (
        <Card className="border border-border/70 bg-background/70">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Eventos con pago estimado</h3>
            </div>
            <div className="grid gap-3">
              {filteredEvents.map((ev) => (
                <div key={ev.id} className="rounded-lg border border-border/60 bg-card/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{ev.church_or_event}</div>
                      <div className="text-xs text-muted-foreground">{ev.dateLabel}</div>
                      <div className="text-xs text-muted-foreground">
                        Roles:{" "}
                        {(ev.assignments || [])
                          .filter((a) => a.name.toLowerCase() === (profile.sourceName || profile.name).toLowerCase())
                          .map((a) => a.role)
                          .join(", ") || "N/D"}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">${payrollRate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
