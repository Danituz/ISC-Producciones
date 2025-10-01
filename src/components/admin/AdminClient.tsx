"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Pencil, Trash2, Calendar, User, AudioLines, Sparkles, Plus } from "lucide-react";
import EventForm, { type EventFormValues } from "@/components/EventForm";
import type { EventItem } from "@/lib/types";

/* helpers 12h */
function to12h(hhmm24: string) {
  if (!hhmm24) return "";
  const [h, m] = hhmm24.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}
function timeRange(ev: any) { return `${to12h(ev.start_time)} – ${to12h(ev.end_time)}`; }
function arrival(ev: any) { return to12h(ev.arrival_time); }

/** Evita el “día anterior” al mostrar fechas tipo YYYY-MM-DD en husos < UTC. */
function formatLocalDateLabel(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`); // fija el mediodía local
  return d.toLocaleDateString("es-MX", { weekday: "short", day: "2-digit", month: "short" });
}

export default function AdminClient({ userEmail }: { userEmail: string }) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [openEdit, setOpenEdit] = useState<{ open: boolean; id?: string }>({ open: false });

  const currentEdit = useMemo(() => events.find(e => e.id === openEdit.id), [openEdit.id, events]);

  // Cargar eventos (Supabase via API)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/events", { cache: "no-store" });
        const json = await res.json();
        if (!active) return;
        if (res.ok) {
          const mapped: EventItem[] = (json.data || []).map((r: any) => ({
            id: r.id,
            dateLabel: `${formatLocalDateLabel(r.date)}, ${timeRange(r)}`,
            church_or_event: r.church_or_event,
            pastor_name: r.pastor_name || "",
            arrival: arrival(r),
            time: timeRange(r),
            // si el backend guarda ids, mapea a nombres si vienen resueltos; si no, muestra tal cual
            scene_audio: r.scene_audio_name ?? r.scene_audio ?? "",
            scene_lights: r.scene_lights_name ?? r.scene_lights ?? "",
            assignments: [
              ...(r.audio_members || []).map((n: string) => ({ name: n, role: "audio" as const })),
              ...(r.lights_members || []).map((n: string) => ({ name: n, role: "luces" as const })),
            ],
            channels: r.channels || [],
            croquis_image_url: r.croquis_image_url || undefined,
            notes: r.notes || undefined,
          }));
          setEvents(mapped);
        } else {
          toast.error(json.error || "No se pudo cargar");
        }
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function reload() {
    setLoading(true);
    const r = await fetch("/api/events", { cache: "no-store" });
    const j = await r.json();
    const mapped: EventItem[] = (j.data || []).map((x: any) => ({
      id: x.id,
      dateLabel: `${formatLocalDateLabel(x.date)}, ${timeRange(x)}`,
      church_or_event: x.church_or_event,
      pastor_name: x.pastor_name || "",
      arrival: arrival(x),
      time: timeRange(x),
      scene_audio: x.scene_audio_name ?? x.scene_audio ?? "",
      scene_lights: x.scene_lights_name ?? x.scene_lights ?? "",
      assignments: [
        ...(x.audio_members || []).map((n: string) => ({ name: n, role: "audio" as const })),
        ...(x.lights_members || []).map((n: string) => ({ name: n, role: "luces" as const })),
      ],
      channels: x.channels || [],
      croquis_image_url: x.croquis_image_url || undefined,
      notes: x.notes || undefined,
    }));
    setEvents(mapped);
    setLoading(false);
  }

  async function handleCreate(values: EventFormValues) {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al crear");
      setOpenNew(false);
      toast.success("Evento creado");
      await reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleUpdate(values: EventFormValues) {
    if (!openEdit.id) return;
    try {
      const res = await fetch(`/api/events/${openEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al actualizar");
      toast.success("Evento actualizado");
      setOpenEdit({ open: false });
      await reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al eliminar");
      setEvents(prev => prev.filter(e => e.id !== id));
      toast.success("Evento eliminado");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Eventos</h2>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">{userEmail}</span>
          <Button onClick={() => setOpenNew(true)} className="gap-2"><Plus className="size-4" /> Nuevo evento</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="space-y-2 pb-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[85%]" />
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-7 w-24" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <EventAdminCard
              key={ev.id}
              data={ev}
              onEdit={() => setOpenEdit({ open: true, id: ev.id })}
              onDelete={() => handleDelete(ev.id)}
            />
          ))}
        </div>
      )}

      {/* Crear */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Crear evento</DialogTitle></DialogHeader>
          <EventForm onSubmit={handleCreate} />
        </DialogContent>
      </Dialog>

      {/* Editar */}
      <Dialog open={openEdit.open} onOpenChange={(v) => setOpenEdit({ open: v, id: openEdit.id })}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Editar evento</DialogTitle></DialogHeader>
          <EventForm
            initial={{
              id: currentEdit?.id,
              church_or_event: currentEdit?.church_or_event,
              pastor_name: currentEdit?.pastor_name,
              // si quieres precargar fecha/horas, trae /api/events/:id y setéalo
              scene_audio: currentEdit?.scene_audio,
              scene_lights: currentEdit?.scene_lights,
              audio_members: currentEdit?.assignments?.filter(a=>a.role==="audio").map(a=>a.name) || [],
              lights_members: currentEdit?.assignments?.filter(a=>a.role==="luces").map(a=>a.name) || [],
              croquis_url: currentEdit?.croquis_image_url,
              notes: currentEdit?.notes,
              channels: currentEdit?.channels || [],
            }}
            onSubmit={handleUpdate}
            submitLabel="Actualizar"
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}

function EventAdminCard({
  data, onEdit, onDelete,
}: { data: EventItem; onEdit: () => void; onDelete: () => void }) {
  const topDate = (data.dateLabel?.includes(",") ? data.dateLabel.split(",")[0] : data.dateLabel) || "";
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="space-y-2 pb-2">
        <div className="text-xs text-muted-foreground">{topDate}</div>
        <div className="text-base font-semibold">{data.church_or_event}</div>
        {data.pastor_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="size-4" /><span>{data.pastor_name}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Llegada</div>
              <div className="font-medium">{data.arrival || "-"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Horario</div>
              <div className="font-medium">{data.time || "-"}</div>
            </div>
          </div>
        </div>

        {(data.scene_audio || data.scene_lights) && (
          <div className="flex flex-wrap gap-2">
            {data.scene_audio && <Badge variant="outline" className="gap-1"><AudioLines className="size-3" /> Audio: {data.scene_audio}</Badge>}
            {data.scene_lights && <Badge variant="outline" className="gap-1"><Sparkles className="size-3" /> Luces: {data.scene_lights}</Badge>}
          </div>
        )}

        {data.assignments?.length ? (
          <div className="flex flex-wrap gap-2">
            {data.assignments.map((a, i) => (
              <Badge key={i} variant="secondary" className="border-border/50">
                {a.role === "audio" ? "🎚️ Audio" : "✨ Luces"} — {a.name}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" className="gap-2" onClick={onEdit}>
            <Pencil className="size-4" /> Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="size-4" /> Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar evento</AlertDialogTitle>
                <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Sí, eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
