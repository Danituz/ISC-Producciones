"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Building2, Clock, Pencil, Plus, Trash2, User } from "lucide-react";
import type { Organization } from "@/lib/types";
import SceneSelect from "@/components/pickers/SceneSelect";
import CroquisSelect from "@/components/pickers/CroquisSelect";
import ChannelPresetSelect from "@/components/pickers/ChannelPresetSelect";

export default function OrganizationsClient() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [editOrg, setEditOrg] = useState<Organization | null>(null);

  useEffect(() => {
    loadOrgs();
  }, []);

  async function loadOrgs() {
    setLoading(true);
    try {
      const res = await fetch("/api/organizations", { cache: "no-store" });
      const json = await res.json();
      setOrgs(json.data || []);
    } catch {
      toast.error("Error al cargar organizaciones");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(values: Partial<Organization>) {
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al crear");
      toast.success("Organización creada");
      setOpenNew(false);
      await loadOrgs();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleUpdate(id: string, values: Partial<Organization>) {
    try {
      const res = await fetch(`/api/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al actualizar");
      toast.success("Organización actualizada");
      setEditOrg(null);
      await loadOrgs();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/organizations/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al eliminar");
      toast.success("Organización eliminada");
      setOrgs((prev) => prev.filter((o) => o.id !== id));
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Organizaciones</h2>
        <Button onClick={() => setOpenNew(true)} className="gap-2">
          <Plus className="size-4" /> Agregar
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border border-border/60">
              <CardHeader className="space-y-2 pb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <Building2 className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">No hay organizaciones</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea una organización para agrupar eventos y recursos
          </p>
          <Button variant="outline" onClick={() => setOpenNew(true)} className="mt-4 gap-2">
            <Plus className="size-4" /> Crear organización
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <OrgCard
              key={org.id}
              org={org}
              onEdit={() => setEditOrg(org)}
              onDelete={() => handleDelete(org.id)}
            />
          ))}
        </div>
      )}

      {/* Crear */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Nueva organización</DialogTitle></DialogHeader>
          <OrgForm onSubmit={handleCreate} />
        </DialogContent>
      </Dialog>

      {/* Editar */}
      <Dialog open={!!editOrg} onOpenChange={(v) => !v && setEditOrg(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Editar organización</DialogTitle></DialogHeader>
          {editOrg && (
            <OrgForm
              initial={editOrg}
              onSubmit={(values) => handleUpdate(editOrg.id, values)}
              submitLabel="Actualizar"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function OrgCard({ org, onEdit, onDelete }: { org: Organization; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className="relative overflow-hidden border border-border/60 bg-card text-sm">
      <CardHeader className="border-b border-border/40 pb-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-muted p-2 text-muted-foreground">
            <Building2 className="size-5" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold">{org.name}</div>
            {org.pastor_name && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="size-3" />
                <span>{org.pastor_name}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {(org.default_arrival_time || org.default_start_time || org.default_end_time) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            <span>
              {org.default_start_time?.substring(0, 5) || "--:--"} - {org.default_end_time?.substring(0, 5) || "--:--"}
            </span>
          </div>
        )}

        {(org.scene_audio_name || org.scene_lights_name) && (
          <div className="text-xs text-muted-foreground">
            {org.scene_audio_name && <div>Audio: {org.scene_audio_name}</div>}
            {org.scene_lights_name && <div>Luces: {org.scene_lights_name}</div>}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-3">
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
                <AlertDialogTitle>Eliminar organización</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará la organización y todos sus eventos asociados. No se puede deshacer.
                </AlertDialogDescription>
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

function OrgForm({
  initial,
  onSubmit,
  submitLabel = "Guardar",
}: {
  initial?: Partial<Organization>;
  onSubmit: (values: Partial<Organization>) => Promise<void> | void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Partial<Organization>>({
    name: initial?.name ?? "",
    pastor_name: initial?.pastor_name ?? "",
    default_arrival_time: initial?.default_arrival_time ?? "",
    default_start_time: initial?.default_start_time ?? "",
    default_end_time: initial?.default_end_time ?? "",
    scene_audio_id: initial?.scene_audio_id ?? null,
    scene_lights_id: initial?.scene_lights_id ?? null,
    croquis_id: initial?.croquis_id ?? null,
    channel_preset_id: initial?.channel_preset_id ?? null,
  });
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof Organization>(key: K, v: Organization[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name?.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nombre de la organización *</Label>
        <Input
          className="mt-2 h-11"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Iglesia, evento recurrente..."
          required
        />
      </div>

      <div>
        <Label>Pastor / Organizador</Label>
        <Input
          className="mt-2 h-11"
          value={values.pastor_name || ""}
          onChange={(e) => set("pastor_name", e.target.value)}
          placeholder="Nombre del pastor o encargado"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Llegada</Label>
          <Input
            type="time"
            className="mt-2"
            value={values.default_arrival_time?.substring(0, 5) || ""}
            onChange={(e) => set("default_arrival_time", e.target.value)}
          />
        </div>
        <div>
          <Label>Inicio</Label>
          <Input
            type="time"
            className="mt-2"
            value={values.default_start_time?.substring(0, 5) || ""}
            onChange={(e) => set("default_start_time", e.target.value)}
          />
        </div>
        <div>
          <Label>Fin</Label>
          <Input
            type="time"
            className="mt-2"
            value={values.default_end_time?.substring(0, 5) || ""}
            onChange={(e) => set("default_end_time", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>Escena Audio predeterminada</Label>
        <SceneSelect
          type="audio"
          value={values.scene_audio_id ?? null}
          onChange={(v) => set("scene_audio_id", v ?? undefined)}
          placeholder="Seleccionar escena"
        />
      </div>

      <div>
        <Label>Escena Luces predeterminada</Label>
        <SceneSelect
          type="lights"
          value={values.scene_lights_id ?? null}
          onChange={(v) => set("scene_lights_id", v ?? undefined)}
          placeholder="Seleccionar escena"
        />
      </div>

      <div>
        <Label>Croquis predeterminado</Label>
        <CroquisSelect
          value={values.croquis_id ?? null}
          onChange={(v) => set("croquis_id", v ?? undefined)}
          placeholder="Seleccionar croquis"
        />
      </div>

      <div>
        <Label>Preset de Canales predeterminado</Label>
        <ChannelPresetSelect
          value={values.channel_preset_id ?? null}
          onChange={(v) => set("channel_preset_id", v ?? undefined)}
          placeholder="Seleccionar preset"
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={!values.name?.trim() || submitting}>
          {submitting ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
