"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users,
  AudioLines,
  Lightbulb,
  Layout,
  ListMusic,
  Plus,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================
type Item = { id: string; name: string; image_url?: string | null };
type ChannelItem = { number: number; label: string };
type ChannelPreset = { id: string; name: string; channels: ChannelItem[] };
type Member = { id: string; name: string; verification_code?: string | null };

// ============================================================================
// Reusable Empty State
// ============================================================================
function EmptyState({ icon: Icon, title, description }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 py-12 text-center">
      <Icon className="mb-3 size-10 text-muted-foreground/50" />
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================
function ItemSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
      <Skeleton className="h-5 w-32" />
      <div className="flex-1" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

// ============================================================================
// Generic Catalog (Escenas Audio/Luces)
// ============================================================================
function ScenesCatalog({ type, icon: Icon }: {
  type: "audio" | "lights";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const title = type === "audio" ? "Escena de Audio" : "Escena de Luces";

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/scenes?type=${type}`, { cache: "no-store" });
      const j = await r.json();
      setItems(j.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [type]);

  function openCreate() {
    setEditItem(null);
    setName("");
    setDialogOpen(true);
  }

  function openEdit(item: Item) {
    setEditItem(item);
    setName(item.name);
    setDialogOpen(true);
  }

  async function handleSave() {
    const n = name.trim();
    if (!n) return;
    setSaving(true);
    try {
      if (editItem) {
        const r = await fetch(`/api/scenes/${editItem.id}?type=${type}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, name: n }),
        });
        if (r.ok) {
          toast.success("Escena actualizada");
          setDialogOpen(false);
          load();
        } else {
          const j = await r.json();
          toast.error(j.error || "Error al actualizar");
        }
      } else {
        const r = await fetch(`/api/scenes?type=${type}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, name: n }),
        });
        if (r.ok) {
          toast.success("Escena creada");
          setDialogOpen(false);
          load();
        } else {
          const j = await r.json();
          toast.error(j.error || "Error al crear");
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    const r = await fetch(`/api/scenes/${deleteItem.id}?type=${type}`, { method: "DELETE" });
    if (r.ok) {
      toast.success("Escena eliminada");
      setDeleteItem(null);
      load();
    } else {
      const j = await r.json();
      toast.error(j.error || "Error al eliminar");
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="size-5 text-muted-foreground" />
            <h3 className="font-medium">{type === "audio" ? "Escenas de Audio" : "Escenas de Luces"}</h3>
          </div>
          <Button onClick={openCreate} size="sm" className="gap-2">
            <Plus className="size-4" /> Agregar
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            <ItemSkeleton />
            <ItemSkeleton />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Icon}
            title={`Sin ${type === "audio" ? "escenas de audio" : "escenas de luces"}`}
            description="Crea una escena para usarla en tus eventos"
          />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3"
              >
                <Icon className="size-4 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">{item.name}</span>
                <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteItem(item)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Editar" : "Nueva"} {title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Nombre de la escena`}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!name.trim() || saving} className="gap-2">
              <Save className="size-4" />
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(v) => !v && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar {title}</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar "{deleteItem?.name}"? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================================
// Members Catalog
// ============================================================================
function MembersCatalog() {
  const [items, setItems] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Member | null>(null);
  const [deleteItem, setDeleteItem] = useState<Member | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/members", { cache: "no-store" });
      const j = await r.json();
      setItems(j.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditItem(null);
    setName("");
    setCode("");
    setDialogOpen(true);
  }

  function openEdit(item: Member) {
    setEditItem(item);
    setName(item.name);
    setCode(item.verification_code || "");
    setDialogOpen(true);
  }

  async function handleSave() {
    const n = name.trim();
    if (!n) return;
    const c = code.replace(/\D/g, "").slice(0, 4);
    if (code && c.length !== 4) {
      toast.error("El código debe tener 4 dígitos");
      return;
    }
    setSaving(true);
    try {
      const payload: any = { name: n };
      if (c) payload.verification_code = c;

      if (editItem) {
        const r = await fetch(`/api/members/${editItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (r.ok) {
          toast.success("Integrante actualizado");
          setDialogOpen(false);
          load();
        } else {
          const j = await r.json();
          toast.error(j.error || "Error al actualizar");
        }
      } else {
        const r = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (r.ok) {
          toast.success("Integrante creado");
          setDialogOpen(false);
          load();
        } else {
          const j = await r.json();
          toast.error(j.error || "Error al crear");
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    const r = await fetch(`/api/members/${deleteItem.id}`, { method: "DELETE" });
    if (r.ok) {
      toast.success("Integrante eliminado");
      setDeleteItem(null);
      load();
    } else {
      const j = await r.json();
      toast.error(j.error || "Error al eliminar");
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-muted-foreground" />
            <h3 className="font-medium">Integrantes</h3>
          </div>
          <Button onClick={openCreate} size="sm" className="gap-2">
            <Plus className="size-4" /> Agregar
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            <ItemSkeleton />
            <ItemSkeleton />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin integrantes"
            description="Agrega integrantes para asignarlos a eventos"
          />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Código: {item.verification_code || "Sin código"}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteItem(item)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Editar" : "Nuevo"} Integrante</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del integrante"
              />
            </div>
            <div className="space-y-2">
              <Label>Código de acceso (4 dígitos)</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="1234"
                maxLength={4}
              />
              <p className="text-xs text-muted-foreground">
                El integrante usará este código para acceder a su perfil
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!name.trim() || saving} className="gap-2">
              <Save className="size-4" />
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(v) => !v && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Integrante</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar a "{deleteItem?.name}"? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================================
// Croquis Catalog
// ============================================================================
function CroquisCatalog() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/croquis", { cache: "no-store" });
      const j = await r.json();
      setItems(j.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    const n = name.trim();
    if (!n) return;
    setSaving(true);
    try {
      const r = await fetch("/api/croquis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n }),
      });
      if (r.ok) {
        toast.success("Croquis creado");
        setDialogOpen(false);
        setName("");
        load();
      } else {
        const j = await r.json();
        toast.error(j.error || "Error al crear");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    const r = await fetch(`/api/croquis/${deleteItem.id}`, { method: "DELETE" });
    if (r.ok) {
      toast.success("Croquis eliminado");
      setDeleteItem(null);
      load();
    } else {
      const j = await r.json();
      toast.error(j.error || "Error al eliminar");
    }
  }

  function openEditor(id?: string) {
    const rt = encodeURIComponent("/admin/resources");
    const url = id ? `/croquis/editor?id=${id}&returnTo=${rt}` : `/croquis/editor?returnTo=${rt}`;
    window.open(url, "_blank");
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout className="size-5 text-muted-foreground" />
            <h3 className="font-medium">Croquis</h3>
          </div>
          <Button onClick={() => { setName(""); setDialogOpen(true); }} size="sm" className="gap-2">
            <Plus className="size-4" /> Agregar
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border/60">
                <CardContent className="p-3">
                  <Skeleton className="h-24 w-full rounded" />
                  <Skeleton className="mt-2 h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Layout}
            title="Sin croquis"
            description="Crea un croquis para visualizar la distribución del equipo"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id} className="border-border/60 overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-muted">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Layout className="size-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <span className="text-sm font-medium">{item.name}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditor(item.id)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteItem(item)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Croquis</DialogTitle>
            <DialogDescription>
              Crea un croquis y luego usa el editor para diseñarlo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del croquis"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!name.trim() || saving} className="gap-2">
              <Save className="size-4" />
              {saving ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(v) => !v && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Croquis</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar "{deleteItem?.name}"? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================================
// Channel Presets Catalog
// ============================================================================
function ChannelPresetsCatalog() {
  const [items, setItems] = useState<ChannelPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ChannelPreset | null>(null);
  const [deleteItem, setDeleteItem] = useState<ChannelPreset | null>(null);
  const [name, setName] = useState("");
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [newNumber, setNewNumber] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/channel-presets", { cache: "no-store" });
      const j = await r.json();
      setItems(j.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditItem(null);
    setName("");
    setChannels([]);
    setDialogOpen(true);
  }

  function openEdit(item: ChannelPreset) {
    setEditItem(item);
    setName(item.name);
    setChannels(item.channels || []);
    setDialogOpen(true);
  }

  function addChannel() {
    const num = parseInt(newNumber, 10);
    if (!num || !newLabel.trim()) return;
    setChannels((c) => [...c, { number: num, label: newLabel.trim() }]);
    setNewNumber("");
    setNewLabel("");
  }

  function removeChannel(index: number) {
    setChannels((c) => c.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const n = name.trim();
    if (!n) return;
    setSaving(true);
    try {
      if (editItem) {
        const r = await fetch(`/api/channel-presets/${editItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: n, channels }),
        });
        if (r.ok) {
          toast.success("Preset actualizado");
          setDialogOpen(false);
          load();
        } else {
          const j = await r.json();
          toast.error(j.error || "Error al actualizar");
        }
      } else {
        const r = await fetch("/api/channel-presets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: n, channels }),
        });
        if (r.ok) {
          toast.success("Preset creado");
          setDialogOpen(false);
          load();
        } else {
          const j = await r.json();
          toast.error(j.error || "Error al crear");
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    const r = await fetch(`/api/channel-presets/${deleteItem.id}`, { method: "DELETE" });
    if (r.ok) {
      toast.success("Preset eliminado");
      setDeleteItem(null);
      load();
    } else {
      const j = await r.json();
      toast.error(j.error || "Error al eliminar");
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListMusic className="size-5 text-muted-foreground" />
            <h3 className="font-medium">Presets de Canales</h3>
          </div>
          <Button onClick={openCreate} size="sm" className="gap-2">
            <Plus className="size-4" /> Agregar
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            <ItemSkeleton />
            <ItemSkeleton />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ListMusic}
            title="Sin presets"
            description="Crea un preset para guardar configuraciones de canales"
          />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3"
              >
                <ListMusic className="size-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.channels?.length || 0} canales
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteItem(item)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? "Editar" : "Nuevo"} Preset de Canales</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del preset</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Configuración domingo"
              />
            </div>

            <div className="space-y-2">
              <Label>Canales</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  className="w-20"
                  placeholder="N°"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                />
                <Input
                  className="flex-1"
                  placeholder="Nombre del canal"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addChannel()}
                />
                <Button type="button" variant="outline" onClick={addChannel}>
                  <Plus className="size-4" />
                </Button>
              </div>

              {channels.length > 0 ? (
                <div className="mt-3 max-h-48 space-y-1 overflow-auto rounded-lg border border-border/60 p-2">
                  {channels.map((ch, i) => (
                    <div
                      key={`${ch.number}-${i}`}
                      className="flex items-center gap-2 rounded bg-muted/50 px-2 py-1.5 text-sm"
                    >
                      <Badge variant="secondary" className="font-mono">
                        {ch.number}
                      </Badge>
                      <span className="flex-1 truncate">{ch.label}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeChannel(i)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Agrega canales al preset usando los campos de arriba
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!name.trim() || saving} className="gap-2">
              <Save className="size-4" />
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(v) => !v && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Preset</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar "{deleteItem?.name}"? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================================
// Main Resources Page
// ============================================================================
export default function ResourcesClient() {
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">Recursos</h2>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="mb-4 flex h-auto flex-wrap gap-1 bg-transparent p-0">
          <TabsTrigger value="members" className="gap-2 rounded-lg border border-transparent data-[state=active]:border-border data-[state=active]:bg-muted">
            <Users className="size-4" />
            <span className="hidden sm:inline">Integrantes</span>
          </TabsTrigger>
          <TabsTrigger value="audio" className="gap-2 rounded-lg border border-transparent data-[state=active]:border-border data-[state=active]:bg-muted">
            <AudioLines className="size-4" />
            <span className="hidden sm:inline">Audio</span>
          </TabsTrigger>
          <TabsTrigger value="lights" className="gap-2 rounded-lg border border-transparent data-[state=active]:border-border data-[state=active]:bg-muted">
            <Lightbulb className="size-4" />
            <span className="hidden sm:inline">Luces</span>
          </TabsTrigger>
          <TabsTrigger value="croquis" className="gap-2 rounded-lg border border-transparent data-[state=active]:border-border data-[state=active]:bg-muted">
            <Layout className="size-4" />
            <span className="hidden sm:inline">Croquis</span>
          </TabsTrigger>
          <TabsTrigger value="channels" className="gap-2 rounded-lg border border-transparent data-[state=active]:border-border data-[state=active]:bg-muted">
            <ListMusic className="size-4" />
            <span className="hidden sm:inline">Canales</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-0">
          <MembersCatalog />
        </TabsContent>

        <TabsContent value="audio" className="mt-0">
          <ScenesCatalog type="audio" icon={AudioLines} />
        </TabsContent>

        <TabsContent value="lights" className="mt-0">
          <ScenesCatalog type="lights" icon={Lightbulb} />
        </TabsContent>

        <TabsContent value="croquis" className="mt-0">
          <CroquisCatalog />
        </TabsContent>

        <TabsContent value="channels" className="mt-0">
          <ChannelPresetsCatalog />
        </TabsContent>
      </Tabs>
    </section>
  );
}
