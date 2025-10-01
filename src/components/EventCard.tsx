"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Clock4, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EventItem } from "@/lib/types";

const CroquisThumb = dynamic(() => import("@/components/CroquisThumb"), { ssr: false });

export default function EventCard({ data }: { data: EventItem }) {
  // Mostrar solo "día + fecha"
  const topDate =
    (data.dateLabel?.includes(",") ? data.dateLabel.split(",")[0] : data.dateLabel) || "";

  const croquisData = (data as any).croquis_data ?? null;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="space-y-2 pb-2">
        {/* 1) Día + fecha */}
        <div className="text-xs text-muted-foreground">{topDate}</div>

        {/* 2) Nombre del evento */}
        <h3 className="text-lg font-semibold leading-tight">{data.church_or_event}</h3>

        {/* 3) Pastor / Organizador */}
        {data.pastor_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="size-4" />
            <span>{data.pastor_name}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 4) Llegada y Horario */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Clock4 className="size-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Llegada</div>
              <div className="font-medium">{data.arrival}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Horario</div>
              <div className="font-medium">{data.time}</div>
            </div>
          </div>
        </div>

        {/* 5) Personal (Audio/Luces) */}
        {data.assignments?.length ? (
          <div className="flex flex-wrap gap-2">
            {data.assignments.map((a, i) => (
              <Badge key={i} variant="secondary" className="border-border/50">
                {a.role === "audio" ? "🎚️ Audio" : "✨ Luces"} — {a.name}
              </Badge>
            ))}
          </div>
        ) : null}

        {/* 6) Escenas (Audio/Luces) */}
        {(data.scene_audio || data.scene_lights) && (
          <div className="flex flex-wrap gap-2">
            {data.scene_audio && (
              <Badge variant="outline">Escena Audio: {data.scene_audio}</Badge>
            )}
            {data.scene_lights && (
              <Badge variant="outline">Escena Luces: {data.scene_lights}</Badge>
            )}
          </div>
        )}

        {/* 7) Croquis (mini) */}
        {croquisData ? (
          <div className="overflow-hidden rounded-xl border border-dashed border-border/40">
            <CroquisThumb data={croquisData} maxHeight={190} />
          </div>
        ) : data.croquis_image_url ? (
          <div className="overflow-hidden rounded-xl border border-dashed border-border/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.croquis_image_url}
              alt="Croquis"
              className="h-40 w-full rounded-[0.75rem] object-cover sm:h-48"
              loading="lazy"
            />
          </div>
        ) : null}

        {/* 8) Acción (solo Ver detalle) */}
        <div className="pt-2">
          <a href={`/evento/${data.id}`} className="block w-full">
            <Button className="h-10 w-full">Ver detalle</Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
