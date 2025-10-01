"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";

/* ---------- Reutilizable simple ---------- */
type Item = { id: string; name: string; image_url?: string | null };

function Catalog({
  title, fetchUrl, createBody, patchBody, deleteUrl,
}: {
  title: string;
  fetchUrl: string;
  createBody: (name: string) => any;
  patchBody?: (name: string) => any;
  deleteUrl: (id: string) => string;
}) {
  const [list, setList] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function load() {
    const r = await fetch(fetchUrl, { cache: "no-store" });
    const j = await r.json();
    setList(j.data || []);
  }
  useEffect(() => { load(); }, [fetchUrl]);

  async function add() {
    const n = name.trim(); if (!n) return;
    const r = await fetch(fetchUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(createBody(n)) });
    const j = await r.json();
    if (r.ok) { toast.success(`${title} creado`); setName(""); load(); } else toast.error(j.error || "Error");
  }
  async function save(id: string) {
    if (!patchBody) return;
    const r = await fetch(`${fetchUrl}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patchBody(editName.trim())) });
    const j = await r.json();
    if (r.ok) { toast.success("Actualizado"); setEditId(null); load(); } else toast.error(j.error || "Error");
  }
  async function del(id: string) {
    const r = await fetch(deleteUrl(id), { method: "DELETE" });
    const j = await r.json();
    if (r.ok) { toast.success("Eliminado"); load(); } else toast.error(j.error || "Error");
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="text-base font-semibold">{title}</div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder={`Nuevo ${title.toLowerCase()}`} />
          <Button onClick={add}>Agregar</Button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {list.map((it)=>(
            <div key={it.id} className="flex items-center gap-2 rounded-md border p-2">
              {editId === it.id ? (
                <>
                  <Input value={editName} onChange={(e)=>setEditName(e.target.value)} />
                  <Button size="sm" onClick={()=>save(it.id)}>Guardar</Button>
                  <Button size="sm" variant="ghost" onClick={()=>setEditId(null)}>Cancelar</Button>
                </>
              ) : (
                <>
                  <div className="flex-1 text-sm">{it.name}</div>
                  <Button size="sm" variant="secondary" onClick={()=>{ setEditId(it.id); setEditName(it.name); }}>Editar</Button>
                  <Button size="sm" variant="destructive" onClick={()=>del(it.id)}>Eliminar</Button>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Catálogo de Croquis con Editor ---------- */
function CroquisCatalog() {
  const [list, setList] = useState<Item[]>([]);
  const [name, setName] = useState("");

  async function load() {
    const r = await fetch("/api/croquis", { cache: "no-store" });
    const j = await r.json();
    setList(j.data || []);
  }
  useEffect(() => { load(); }, []);

  // crear registro vacío por nombre (opcional)
  async function addNameOnly() {
    const n = name.trim(); if (!n) return;
    const r = await fetch("/api/croquis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: n }),
    });
    const j = await r.json();
    if (r.ok) { toast.success("Croquis creado"); setName(""); load(); } else toast.error(j.error || "Error");
  }

  function newWithEditor() {
    const returnTo = encodeURIComponent("/admin/resources");
    window.open(`/croquis/editor?returnTo=${returnTo}`, "_blank");
  }

  async function del(id: string) {
    const r = await fetch(`/api/croquis/${id}`, { method: "DELETE" });
    const j = await r.json();
    if (r.ok) { toast.success("Eliminado"); load(); } else toast.error(j.error || "Error");
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="text-base font-semibold">Croquis</div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex w-full gap-2">
            <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Nuevo croquis" />
            <Button onClick={addNameOnly}>Agregar</Button>
          </div>
          <Button variant="secondary" onClick={newWithEditor}>Nuevo con editor</Button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {list.map((it)=>(
            <div key={it.id} className="flex items-center gap-3 rounded-md border p-2">
              {/* Miniatura */}
              {it.image_url ? (
                <img src={it.image_url} alt={it.name} className="h-10 w-16 rounded object-cover" />
              ) : (
                <div className="h-10 w-16 rounded bg-muted" />
              )}
              <div className="flex-1 text-sm">{it.name}</div>
              <Button
                size="sm"
                variant="secondary"
                onClick={()=>{
                  const rt = encodeURIComponent("/admin/resources");
                  window.open(`/croquis/editor?id=${it.id}&returnTo=${rt}`, "_blank");
                }}
              >
                Editar
              </Button>
              <Button size="sm" variant="destructive" onClick={()=>del(it.id)}>Eliminar</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Presets de Canales (con editor de channels) ---------- */
type ChannelItem = { number: number; label: string };
type ChannelPreset = { id: string; name: string; channels: ChannelItem[] };

function ChannelPresetsCatalog() {
  const [list, setList] = useState<ChannelPreset[]>([]);
  const [name, setName] = useState("");

  const [openEdit, setOpenEdit] = useState<{ open: boolean; preset?: ChannelPreset }>({ open: false });

  async function load() {
    const r = await fetch("/api/channel-presets", { cache: "no-store" });
    const j = await r.json();
    setList(j.data || []);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    const n = name.trim(); if (!n) return;
    const r = await fetch("/api/channel-presets", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: n, channels: [] }),
    });
    const j = await r.json();
    if (r.ok) { toast.success("Preset creado"); setName(""); load(); } else toast.error(j.error || "Error");
  }
  async function del(id: string) {
    const r = await fetch(`/api/channel-presets/${id}`, { method: "DELETE" });
    const j = await r.json();
    if (r.ok) { toast.success("Preset eliminado"); load(); } else toast.error(j.error || "Error");
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="text-base font-semibold">Presets de Canales</div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Nuevo preset" />
            <Button onClick={add}>Agregar</Button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {list.map((it)=>(
              <div key={it.id} className="flex items-center gap-2 rounded-md border p-2">
                <div className="flex-1 text-sm">{it.name}</div>
                <Button size="sm" variant="secondary" onClick={()=>setOpenEdit({ open: true, preset: it })}>Editar</Button>
                <Button size="sm" variant="destructive" onClick={()=>del(it.id)}>Eliminar</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <EditPresetDialog
        open={openEdit.open}
        preset={openEdit.preset}
        onClose={(changed) => { setOpenEdit({ open: false, preset: undefined }); if (changed) load(); }}
      />
    </>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

function EditPresetDialog({
  open, preset, onClose,
}: {
  open: boolean;
  preset?: ChannelPreset;
  onClose: (changed: boolean) => void;
}) {
  const [name, setName] = useState(preset?.name ?? "");
  const [channels, setChannels] = useState<ChannelItem[]>(preset?.channels ?? []);
  const [n, setN] = useState("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    setName(preset?.name ?? "");
    setChannels(preset?.channels ?? []);
  }, [preset]);

  function addChannel() {
    const num = parseInt(n, 10);
    if (!num || !label.trim()) return;
    setChannels((c) => [...c, { number: num, label: label.trim() }]);
    setN(""); setLabel("");
  }
  function removeChannel(i: number) {
    setChannels((c) => c.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (!preset) return;
    const r = await fetch(`/api/channel-presets/${preset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), channels }),
    });
    const j = await r.json();
    if (r.ok) { toast.success("Preset actualizado"); onClose(true); } else toast.error(j.error || "Error");
  }

  return (
    <Dialog open={open} onOpenChange={(v)=>!v && onClose(false)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Editar preset</DialogTitle></DialogHeader>

        <div className="space-y-4 pt-2">
          <div><Label>Nombre</Label><Input value={name} onChange={(e)=>setName(e.target.value)} /></div>

          <div className="space-y-2">
            <Label>Canales</Label>
            <div className="flex gap-2">
              <Input type="number" min={1} className="w-28" placeholder="N°" value={n} onChange={(e)=>setN(e.target.value)} />
              <Input placeholder="Nombre" value={label} onChange={(e)=>setLabel(e.target.value)} />
              <Button type="button" onClick={addChannel}>Agregar</Button>
            </div>

            {channels.length ? (
              <div className="divide-y rounded-md border">
                {channels.map((c, i) => (
                  <div key={`${c.number}-${i}`} className="flex items-center justify-between p-2 text-sm">
                    <div className="font-medium">Canal {c.number}</div>
                    <div className="flex-1 px-3 truncate">{c.label}</div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeChannel(i)}>Eliminar</Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Aún no hay canales en este preset.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={()=>onClose(false)}>Cancelar</Button>
          <Button onClick={save}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Página Recursos ---------- */
export default function ResourcesClient() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Recursos</h2>
      < defaultValue="members" className="w-full">
        {/* Scrollable en móvil, grid en desktop */}
        <TabsList
          aria-label="Secciones de recursos"
          className="
            flex gap-1 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden
            sm:grid sm:grid-cols-5 sm:overflow-visible
          "
        >
          <TabsTrigger
            value="members"
            className="shrink-0 px-3 py-2 text-sm sm:text-base"
            title="Integrantes"
          >
            <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="whitespace-nowrap">Integrantes</span>
          </TabsTrigger>

          <TabsTrigger
            value="sa"
            className="shrink-0 px-3 py-2 text-sm sm:text-base"
            title="Escenas de audio"
          >
            <Waves className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="whitespace-nowrap">Escenas Audio</span>
          </TabsTrigger>

          <TabsTrigger
            value="sl"
            className="shrink-0 px-3 py-2 text-sm sm:text-base"
            title="Escenas de luces"
          >
            <Lightbulb className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="whitespace-nowrap">Escenas Luces</span>
          </TabsTrigger>

          <TabsTrigger
            value="croquis"
            className="shrink-0 px-3 py-2 text-sm sm:text-base"
            title="Croquis"
          >
            <Map className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="whitespace-nowrap">Croquis</span>
          </TabsTrigger>

          <TabsTrigger
            value="channels"
            className="shrink-0 px-3 py-2 text-sm sm:text-base"
            title="Canales"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="whitespace-nowrap">Canales</span>
          </TabsTrigger>
        </TabsList>
      

        <TabsContent value="members">
          <Catalog
            title="Integrante"
            fetchUrl="/api/members"
            createBody={(name)=>({ name })}
            patchBody={(name)=>({ name })}
            deleteUrl={(id)=>`/api/members/${id}`}
          />
        </TabsContent>

        <TabsContent value="sa">
          <Catalog
            title="Escena Audio"
            fetchUrl="/api/scenes?type=audio"
            createBody={(name)=>({ type:"audio", name })}
            patchBody={(name)=>({ type:"audio", name })}
            deleteUrl={(id)=>`/api/scenes/${id}?type=audio`}
          />
        </TabsContent>

        <TabsContent value="sl">
          <Catalog
            title="Escena Luces"
            fetchUrl="/api/scenes?type=lights"
            createBody={(name)=>({ type:"lights", name })}
            patchBody={(name)=>({ type:"lights", name })}
            deleteUrl={(id)=>`/api/scenes/${id}?type=lights`}
          />
        </TabsContent>

        <TabsContent value="croquis">
          <CroquisCatalog />
        </TabsContent>

        <TabsContent value="channels">
          <ChannelPresetsCatalog />
        </TabsContent>
      </Tabs>
    </section>
  );
}
