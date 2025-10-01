"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

import SceneSelect from "@/components/pickers/SceneSelect";
import CroquisSelect from "@/components/pickers/CroquisSelect";
import ChannelPresetSelect from "@/components/pickers/ChannelPresetSelect";
import MemberMultiSelect from "@/components/MemberMultiSelect"; // 👈 IMPORTANTe

export type ChannelItem = { number: number; label: string };

export type EventFormValues = {
  id?: string;

  church_or_event: string;
  pastor_name: string;

  date: string;
  start_time: string;
  end_time: string;
  arrival_time: string;

  audio_members: string[];   // nombres (coinciden con /api/members)
  lights_members: string[];

  scene_audio_id?: string | null;
  scene_lights_id?: string | null;

  croquis_id?: string | null;
  channel_preset_id?: string | null;

  channels?: ChannelItem[];
  notes?: string;
};

export default function EventForm({
  initial,
  onSubmit,
  submitting,
  submitLabel = "Guardar",
}: {
  initial?: Partial<EventFormValues>;
  onSubmit: (values: EventFormValues) => Promise<void> | void;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<EventFormValues>({
    id: initial?.id,
    church_or_event: initial?.church_or_event ?? "",
    pastor_name: initial?.pastor_name ?? "",
    date: initial?.date ?? "",
    start_time: initial?.start_time ?? "",
    end_time: initial?.end_time ?? "",
    arrival_time: initial?.arrival_time ?? "",

    audio_members: initial?.audio_members ?? [],
    lights_members: initial?.lights_members ?? [],

    scene_audio_id: initial?.scene_audio_id ?? null,
    scene_lights_id: initial?.scene_lights_id ?? null,

    croquis_id: initial?.croquis_id ?? null,
    channel_preset_id: initial?.channel_preset_id ?? null,

    channels: initial?.channels ?? [],
    notes: initial?.notes ?? "",
  });

  const [step, setStep] = useState<"1" | "2" | "3">("1");

  function set<K extends keyof EventFormValues>(key: K, v: EventFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  // ====== AM/PM helpers visuales ======
  const hh = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const mm = ["00", "15", "30", "45"];
  const ap = ["AM", "PM"] as const;

  function to24h(h12: string, m: string, ampm: "AM" | "PM") {
    let h = parseInt(h12, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m}`;
  }
  function from24h(v?: string) {
    if (!v) return { h: "12", m: "00", ap: "AM" as const };
    const [H, m] = v.split(":");
    let h = parseInt(H, 10);
    const isPM = h >= 12;
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return { h: String(h).padStart(2, "0"), m, ap: (isPM ? "PM" : "AM") as const };
  }

  const [start12, setStart12] = useState(() => from24h(values.start_time));
  const [end12, setEnd12] = useState(() => from24h(values.end_time));
  const [arr12, setArr12] = useState(() => from24h(values.arrival_time));

  useEffect(() => set("start_time", to24h(start12.h, start12.m, start12.ap)), [start12]);
  useEffect(() => set("end_time", to24h(end12.h, end12.m, end12.ap)), [end12]);
  useEffect(() => set("arrival_time", to24h(arr12.h, arr12.m, arr12.ap)), [arr12]);

  const canSubmit = useMemo(() => {
    return (
      values.church_or_event.trim() &&
      values.date &&
      values.start_time &&
      values.end_time &&
      values.arrival_time
    );
  }, [values]);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        await onSubmit(values);
      }}
    >
      <Tabs value={step} onValueChange={(v) => setStep(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="1">Evento</TabsTrigger>
          <TabsTrigger value="2">Equipo</TabsTrigger>
          <TabsTrigger value="3">Croquis & Escenas</TabsTrigger>
        </TabsList>

        {/* PASO 1 */}
        <TabsContent value="1">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div>
                <Label>Evento / Iglesia</Label>
                <Input
                  className="h-11 text-base"
                  value={values.church_or_event}
                  onChange={(e) => set("church_or_event", e.target.value)}
                  placeholder="Servicio, Concierto, Iglesia…"
                  required
                />
              </div>

              <div>
                <Label>Pastor(a) / Organizador</Label>
                <Input
                  className="h-11 text-base"
                  value={values.pastor_name}
                  onChange={(e) => set("pastor_name", e.target.value)}
                  placeholder="Nombre"
                />
              </div>

              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  className="h-11 text-base"
                  value={values.date}
                  onChange={(e) => set("date", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Inicio */}
                <div className="space-y-1">
                  <Label>Inicio</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <SelectLike value={start12.h} options={hh} onChange={(v)=>setStart12(s=>({...s, h:v}))} />
                    <SelectLike value={start12.m} options={mm} onChange={(v)=>setStart12(s=>({...s, m:v}))} />
                    <SelectLike value={start12.ap} options={ap} onChange={(v)=>setStart12(s=>({...s, ap:v as "AM"|"PM"}))} />
                  </div>
                </div>

                {/* Fin */}
                <div className="space-y-1">
                  <Label>Fin</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <SelectLike value={end12.h} options={hh} onChange={(v)=>setEnd12(s=>({...s, h:v}))} />
                    <SelectLike value={end12.m} options={mm} onChange={(v)=>setEnd12(s=>({...s, m:v}))} />
                    <SelectLike value={end12.ap} options={ap} onChange={(v)=>setEnd12(s=>({...s, ap:v as "AM"|"PM"}))} />
                  </div>
                </div>

                {/* Llegada */}
                <div className="space-y-1">
                  <Label>Llegada</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <SelectLike value={arr12.h} options={hh} onChange={(v)=>setArr12(s=>({...s, h:v}))} />
                    <SelectLike value={arr12.m} options={mm} onChange={(v)=>setArr12(s=>({...s, m:v}))} />
                    <SelectLike value={arr12.ap} options={ap} onChange={(v)=>setArr12(s=>({...s, ap:v as "AM"|"PM"}))} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-3 flex justify-end">
            <Button type="button" onClick={() => setStep("2")}>
              Siguiente <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </TabsContent>

        {/* PASO 2 — Equipo (usa MemberMultiSelect) */}
        <TabsContent value="2">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div>
                <Label>Integrantes (Audio)</Label>
                <MemberMultiSelect
                  value={values.audio_members}
                  onChange={(v) => set("audio_members", v)}
                  placeholder="Seleccionar"
                />
              </div>

              <div>
                <Label>Integrantes (Luces)</Label>
                <MemberMultiSelect
                  value={values.lights_members}
                  onChange={(v) => set("lights_members", v)}
                  placeholder="Seleccionar"
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-3 flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep("1")}>
              <ChevronLeft className="mr-1 size-4" /> Atrás
            </Button>
            <Button type="button" onClick={() => setStep("3")}>
              Siguiente <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </TabsContent>

        {/* PASO 3 */}
        <TabsContent value="3">
          <Card>
            <CardContent className="space-y-5 pt-4">
              <div>
                <Label>Croquis</Label>
                <CroquisSelect
                  value={values.croquis_id ?? null}
                  onChange={(v) => set("croquis_id", v)}
                  placeholder="Selecciona croquis"
                />
              </div>

              <div>
                <Label>Escena Audio</Label>
                <SceneSelect
                  type="audio"
                  value={values.scene_audio_id ?? null}
                  onChange={(v) => set("scene_audio_id", v)}
                  placeholder="Selecciona escena de audio"
                />
              </div>

              <div>
                <Label>Escena Luces</Label>
                <SceneSelect
                  type="lights"
                  value={values.scene_lights_id ?? null}
                  onChange={(v) => set("scene_lights_id", v)}
                  placeholder="Selecciona escena de luces"
                />
              </div>

              <div>
                <Label>Preset de Canales</Label>
                <ChannelPresetSelect
                  value={values.channel_preset_id ?? null}
                  onChange={(v) => set("channel_preset_id", v)}
                  placeholder="Selecciona preset de canales"
                />
              </div>

              <div>
                <Label>Recordatorios</Label>
                <Textarea
                  className="min-h-24"
                  placeholder="Notas importantes del evento…"
                  value={values.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-3 flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep("2")}>
              <ChevronLeft className="mr-1 size-4" /> Atrás
            </Button>
            <Button type="submit" disabled={!canSubmit || submitting} className="gap-2">
              <Save className="size-4" />
              {submitting ? "Guardando..." : submitLabel}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}

/* ====== Select-like (ligero) ====== */
function SelectLike<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: readonly T[] | T[];
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      className="h-11 w-full rounded-md border bg-background px-3 text-base"
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
