"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Save, Building2, Calendar, Headphones, Lightbulb } from "lucide-react";

import OrganizationSelect from "@/components/pickers/OrganizationSelect";
import MemberSelect from "@/components/pickers/MemberSelect";
import type { Organization } from "@/lib/types";

export type ChannelItem = { number: number; label: string };

export type EventFormValues = {
  id?: string;
  organization_id?: string | null;

  church_or_event: string;
  pastor_name: string;

  date: string;
  start_time: string;
  end_time: string;
  arrival_time: string;

  audio_members: string[];
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
    organization_id: initial?.organization_id ?? null,
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

  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  function set<K extends keyof EventFormValues>(key: K, v: EventFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  // Auto-fill from organization
  function handleOrganizationLoad(org: Organization | null) {
    setSelectedOrg(org);
    if (!org) {
      // Clear org-related fields
      setValues((prev) => ({
        ...prev,
        organization_id: null,
        church_or_event: "",
        pastor_name: "",
        start_time: "",
        end_time: "",
        arrival_time: "",
        scene_audio_id: null,
        scene_lights_id: null,
        croquis_id: null,
        channel_preset_id: null,
      }));
      return;
    }

    // Auto-fill all fields from organization
    setValues((prev) => ({
      ...prev,
      church_or_event: org.name || "",
      pastor_name: org.pastor_name || "",
      start_time: org.default_start_time?.substring(0, 5) || "",
      end_time: org.default_end_time?.substring(0, 5) || "",
      arrival_time: org.default_arrival_time?.substring(0, 5) || "",
      scene_audio_id: org.scene_audio_id ?? null,
      scene_lights_id: org.scene_lights_id ?? null,
      croquis_id: org.croquis_id ?? null,
      channel_preset_id: org.channel_preset_id ?? null,
    }));
  }

  const canSubmit = useMemo(() => {
    return values.organization_id && values.date;
  }, [values.organization_id, values.date]);

  // Get current audio/lights member from arrays
  const audioMember = values.audio_members[0] || null;
  const lightsMember = values.lights_members[0] || null;

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        await onSubmit(values);
      }}
    >
      <Card className="border-border/60">
        <CardContent className="space-y-5 pt-5">
          {/* Organization */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              Organización
            </Label>
            <OrganizationSelect
              value={values.organization_id ?? null}
              onChange={(id) => set("organization_id", id)}
              onOrganizationLoad={handleOrganizationLoad}
              placeholder="Seleccionar organización"
              className="h-11"
            />
            {selectedOrg && (
              <p className="text-xs text-muted-foreground">
                {selectedOrg.pastor_name && `${selectedOrg.pastor_name} · `}
                {selectedOrg.default_start_time?.substring(0, 5) || "--:--"} - {selectedOrg.default_end_time?.substring(0, 5) || "--:--"}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              Fecha del evento
            </Label>
            <Input
              type="date"
              className="h-11"
              value={values.date}
              onChange={(e) => set("date", e.target.value)}
              required
            />
          </div>

          {/* Audio Member */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Headphones className="size-4 text-muted-foreground" />
              Integrante de Audio
            </Label>
            <MemberSelect
              value={audioMember}
              onChange={(name) => set("audio_members", name ? [name] : [])}
              placeholder="Seleccionar integrante"
              className="h-11"
            />
          </div>

          {/* Lights Member */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Lightbulb className="size-4 text-muted-foreground" />
              Integrante de Luces
            </Label>
            <MemberSelect
              value={lightsMember}
              onChange={(name) => set("lights_members", name ? [name] : [])}
              placeholder="Seleccionar integrante"
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={!canSubmit || submitting} className="gap-2">
          <Save className="size-4" />
          {submitting ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
