"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Clock4, User, Headphones, Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EventItem } from "@/lib/types";

const CroquisThumb = dynamic(() => import("@/components/CroquisThumb"), { ssr: false });

export default function EventCard({ data }: { data: EventItem }) {
  const topDate = (data.dateLabel?.includes(",") ? data.dateLabel.split(",")[0] : data.dateLabel) || "";

  const croquisData = (data as { croquis_data?: unknown }).croquis_data ?? null;

  return (
    <Card className="relative flex h-full flex-col overflow-hidden transition hover:shadow-md">
      <CardHeader className="space-y-2 pb-2">
        <div className="text-xs text-muted-foreground">{topDate}</div>
        <h3 className="text-lg font-semibold leading-tight">{data.church_or_event}</h3>
        {data.pastor_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{data.pastor_name}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock4 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Llegada</div>
                <div className="font-medium">{data.arrival}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Horario</div>
                <div className="font-medium">{data.time}</div>
              </div>
            </div>
          </div>

          {data.assignments?.length ? (
            <div className="flex flex-wrap gap-2">
              {data.assignments.map((a, i) => (
                <Badge key={i} variant="secondary" className="gap-1.5">
                  {a.role === "audio" ? <Headphones className="h-3 w-3" /> : <Lightbulb className="h-3 w-3" />}
                  {a.name}
                </Badge>
              ))}
            </div>
          ) : null}

          {(data.scene_audio || data.scene_lights) && (
            <div className="flex flex-wrap gap-2">
              {data.scene_audio && <Badge variant="outline">Escena Audio: {data.scene_audio}</Badge>}
              {data.scene_lights && <Badge variant="outline">Escena Luces: {data.scene_lights}</Badge>}
            </div>
          )}

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
                className="h-40 w-full object-cover sm:h-48"
                loading="lazy"
              />
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <Button className="h-10 w-full gap-2" variant="outline">
            Ver detalle
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
