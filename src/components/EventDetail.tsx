"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarClock, Clock4, User, Download } from "lucide-react";
import { downloadNodeAsJpg } from "@/lib/exports";
import { ChannelList } from "./ChannelList";
import type { EventItem } from "@/lib/types";

// Render del croquis desde JSON (no SSR)
const CroquisThumb = dynamic(() => import("@/components/CroquisThumb"), { ssr: false });

export default function EventDetail({ data }: { data: EventItem }) {
  const ref = useRef<HTMLDivElement>(null);           // todo el detalle
  const channelsRef = useRef<HTMLDivElement>(null);   // solo la tabla de canales

  // Solo “día + fecha”
  const topDate =
    (data.dateLabel?.includes(",") ? data.dateLabel.split(",")[0] : data.dateLabel) || "";

  const onDownloadJpg = async () => {
    if (!ref.current) return;
    await downloadNodeAsJpg(ref.current, `evento_${data.id}.jpg`, {
      backgroundColor: "#0b0f1a",
      quality: 0.95,
    });
  };

  const onDownloadChannelsJpg = async () => {
    if (!channelsRef.current) return;
    await downloadNodeAsJpg(channelsRef.current, `evento_${data.id}_canales.jpg`, {
      backgroundColor: "#0b0f1a",
      quality: 0.95,
    });
  };

  // Soporte para croquis JSON (enviado por la API pública)
  const croquisData = (data as any).croquis_data ?? null;

  return (
    <div className="space-y-5">
      {/* Botón volver */}
      <div className="sticky top-0 z-30 -mx-3 -mt-2 mb-1 bg-background/80 px-3 py-2 backdrop-blur sm:static sm:-mx-0 sm:-mt-0 sm:bg-transparent sm:px-0 sm:py-0">
        <Link href="/" className="inline-flex">
          <Button variant="ghost" size="sm" className="h-9 gap-2">
            <ArrowLeft className="size-4" /> Volver
          </Button>
        </Link>
      </div>

      {/* Bloque exportable */}
      <div ref={ref} className="space-y-4 rounded-xl border bg-background p-4 sm:p-6">
        {/* Fecha */}
        <div className="text-xs text-muted-foreground">{topDate}</div>

        {/* Evento */}
        <h1 className="text-xl font-semibold sm:text-2xl">{data.church_or_event}</h1>

        {/* Pastor */}
        {data.pastor_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="size-4" />
            <span>{data.pastor_name}</span>
          </div>
        )}

        {/* Llegada y horario */}
        <div className="grid grid-cols-2 gap-3 text-sm sm:gap-4">
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

        {/* Personal */}
        {data.assignments?.length ? (
          <div className="flex flex-wrap gap-2">
            {data.assignments.map((a, i) => (
              <Badge key={i} variant="secondary" className="border-border/50">
                {a.role === "audio" ? "🎚️ Audio" : "✨ Luces"} — {a.name}
              </Badge>
            ))}
          </div>
        ) : null}

        {/* Escenas */}
        {(data.scene_audio || data.scene_lights) && (
          <div className="flex flex-wrap gap-2">
            {data.scene_audio && <Badge variant="outline">Escena Audio: {data.scene_audio}</Badge>}
            {data.scene_lights && (
              <Badge variant="outline">Escena Luces: {data.scene_lights}</Badge>
            )}
          </div>
        )}

        {/* Croquis */}
        {croquisData ? (
          <CroquisThumb data={croquisData} />
        ) : data.croquis_image_url ? (
          <div className="overflow-hidden rounded-xl border border-dashed border-border/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.croquis_image_url}
              alt="Croquis"
              className="max-h-[360px] w-full rounded-[0.75rem] object-cover sm:max-h-[420px]"
              loading="lazy"
            />
          </div>
        ) : null}

        {/* Canales */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium">Canales</div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDownloadChannelsJpg}
              className="h-8 w-8"
              title="Descargar solo canales"
            >
              <Download className="size-4" />
            </Button>
          </div>
          <div ref={channelsRef} className="rounded-xl border bg-background p-2 sm:p-3">
            <ChannelList channels={data.channels ?? []} />
          </div>
        </div>

        {/* Recordatorios */}
        {data.notes && (
          <div>
            <div className="mb-2 text-sm font-medium">Recordatorios</div>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{data.notes}</p>
          </div>
        )}
      </div>

      {/* Acción final: Descargar todo */}
      <div className="pt-1">
        <Button onClick={onDownloadJpg} className="h-10 w-full sm:w-auto">
          Descargar JPG (evento completo)
        </Button>
      </div>
    </div>
  );
}
