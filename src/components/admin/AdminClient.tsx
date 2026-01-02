"use client";

import { useEffect, useState } from "react";
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
import {
  Pencil,
  Trash2,
  Calendar,
  Clock4,
  User,
  AudioLines,
  Sparkles,
  Plus,
  Headphones,
  Lightbulb,
  Building2,
} from "lucide-react";
import EventForm, { type EventFormValues } from "@/components/EventForm";
import { MonthSelector, getCurrentPeriod } from "@/components/admin/MonthSelector";
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

function parseTimeToMinutes(timeStr: string | undefined): number {
  if (!timeStr) return 0;
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  }
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const period = match[3]?.toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h * 60 + m;
  }
  return 0;
}

function sortEventsByDateTime(events: EventItem[]): EventItem[] {
  return [...events].sort((a, b) => {
    const dateA = a.date || "";
    const dateB = b.date || "";
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    const timeA = parseTimeToMinutes(a.start_time || a.time);
    const timeB = parseTimeToMinutes(b.start_time || b.time);
    return timeA - timeB;
  });
}

/** Evita el “día anterior” al mostrar fechas tipo YYYY-MM-DD en husos < UTC. */
function formatLocalDateLabel(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`); // fija el mediodía local
  return d.toLocaleDateString("es-MX", { weekday: "short", day: "2-digit", month: "short" });
}

function mapEvent(row: any): EventItem {
  return {
    id: row.id,
    date: row.date,
    start_time: row.start_time,
    end_time: row.end_time,
    dateLabel: `${formatLocalDateLabel(row.date)}, ${timeRange(row)}`,
    church_or_event: row.church_or_event,
    pastor_name: row.pastor_name || "",
    arrival: arrival(row),
    time: timeRange(row),
    scene_audio: row.scene_audio_name ?? row.scene_audio ?? "",
    scene_lights: row.scene_lights_name ?? row.scene_lights ?? "",
    channel_preset_name: row.channel_preset_name || undefined,
    assignments: [
      ...(row.audio_members || []).map((n: string) => ({ name: n, role: "audio" as const })),
      ...(row.lights_members || []).map((n: string) => ({ name: n, role: "luces" as const })),
    ],
    channels: row.channels || [],
    croquis_image_url: row.croquis_image_url || undefined,
    notes: row.notes || undefined,
  };
}

export default function AdminClient({ userEmail }: { userEmail: string }) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [period, setPeriod] = useState(getCurrentPeriod());
  const [openNew, setOpenNew] = useState(false);
  const [openEdit, setOpenEdit] = useState<{ open: boolean; id?: string }>({ open: false });
  const [editInitial, setEditInitial] = useState<Partial<EventFormValues> | null>(null);

  // Cargar eventos (Supabase via API) - filtrado por período
  useEffect(() => {
    let active = true;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/events?period=${period}`, { cache: "no-store" });
        const json = await res.json();
        if (!active) return;
        if (res.ok) {
          const mapped: EventItem[] = (json.data || []).map(mapEvent);
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
  }, [period]);

  // Cargar datos completos del evento al abrir edición
  useEffect(() => {
    let active = true;
    (async () => {
      if (!openEdit.open || !openEdit.id) { setEditInitial(null); return; }
      try {
        const res = await fetch(`/api/events/${openEdit.id}`);
        const j = await res.json();
        if (!active) return;
        if (res.ok) {
          const e = j.data;
          setEditInitial({
            id: e.id,
            church_or_event: e.church_or_event ?? "",
            pastor_name: e.pastor_name ?? "",
            date: e.date ?? "",
            start_time: e.start_time ?? "",
            end_time: e.end_time ?? "",
            arrival_time: e.arrival_time ?? "",
            audio_members: e.audio_members ?? [],
            lights_members: e.lights_members ?? [],
            scene_audio_id: e.scene_audio_id ?? null,
            scene_lights_id: e.scene_lights_id ?? null,
            croquis_id: e.croquis_id ?? null,
            channel_preset_id: e.channel_preset_id ?? null,
            channels: e.channels ?? [],
            notes: e.notes ?? "",
          });
        }
      } catch {}
    })();
    return () => { active = false; };
  }, [openEdit.open, openEdit.id]);

  async function reload() {
    if (!events.length) setLoading(true);
    const r = await fetch(`/api/events?period=${period}`, { cache: "no-store" });
    const j = await r.json();
    const mapped: EventItem[] = (j.data || []).map(mapEvent);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-xl font-semibold">Eventos</h2>
          <MonthSelector value={period} onChange={setPeriod} />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setOpenNew(true)} className="gap-2"><Plus className="size-4" /> Nuevo evento</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <AdminCardSkeleton key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <Calendar className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">No hay eventos</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No se encontraron eventos para este período
          </p>
          <Button variant="outline" onClick={() => setOpenNew(true)} className="mt-4 gap-2">
            <Plus className="size-4" /> Crear evento
          </Button>
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
            initial={editInitial ?? undefined}
            onSubmit={handleUpdate}
            submitLabel="Actualizar"
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}

function AdminCardSkeleton() {
  return (
    <Card className="relative overflow-hidden border border-border/60">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/10 px-4 py-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <CardContent className="space-y-3 p-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

function EventAdminCard({
  data, onEdit, onDelete,
}: { data: EventItem; onEdit: () => void; onDelete: () => void }) {
  const topDate = (data.dateLabel?.includes(",") ? data.dateLabel.split(",")[0] : data.dateLabel) || "";
  return (
    <Card className="relative overflow-hidden border border-border/60 bg-card text-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/40 pb-3">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">{topDate}</div>
          <div className="text-lg font-semibold">{data.church_or_event}</div>
          {data.pastor_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="size-4" />
              <span>{data.pastor_name}</span>
            </div>
          )}
        </div>
        {data.channel_preset_name ? (
          <Badge variant="secondary" className="gap-1">
            <AudioLines className="size-3" />
            {data.channel_preset_name}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Clock4 className="size-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Llegada</div>
              <div className="font-medium">{data.arrival || "-"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Horario</div>
              <div className="font-medium">{data.time || "-"}</div>
            </div>
          </div>
        </div>

        {(data.scene_audio || data.scene_lights) && (
          <div className="flex flex-wrap gap-2">
            {data.scene_audio && (
              <Badge variant="outline" className="gap-1">
                <AudioLines className="size-3" /> {data.scene_audio}
              </Badge>
            )}
            {data.scene_lights && (
              <Badge variant="outline" className="gap-1">
                <Sparkles className="size-3" /> {data.scene_lights}
              </Badge>
            )}
          </div>
        )}

        {data.assignments?.length ? (
          <div className="flex flex-wrap gap-2">
            {data.assignments.map((a, i) => (
              <Badge key={i} variant="secondary" className="gap-1.5">
                {a.role === "audio" ? <Headphones className="size-3" /> : <Lightbulb className="size-3" />}
                {a.name}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-4">
          <Button variant="outline" size="sm" className="gap-2" onClick={onEdit}>
            <Pencil className="size-4" /> Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive">
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


