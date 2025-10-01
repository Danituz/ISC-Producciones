"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Group, Circle, Rect, Text } from "react-konva";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Download,
  Crosshair,
  Mic,
  Guitar,
  Palette,
  Headphones,
  PlusCircle,
  CheckCircle2,
  Trash2,
  Save,
} from "lucide-react";

/* ========= Tipos ========= */
type Kind = "mic" | "instrument" | "monitor";

type MicNode = {
  id: string;
  kind: "mic";
  x: number;
  y: number;
  color: "Azul" | "Rojo" | "Verde" | "Amarillo" | "Negro" | "Blanco";
  name: string;   // persona
  channel: string;
};

type InstrumentType =
  | "bateria"
  | "guitarra"
  | "guitarra_acustica"
  | "piano"
  | "bajo"
  | "cajon_peruano";

type InstrumentNode = {
  id: string;
  kind: "instrument";
  x: number;
  y: number;
  instrument: InstrumentType;
  channel: string;
  emoji: string;
  label: string;
};

type MonitorNode = {
  id: string;
  kind: "monitor";
  x: number;
  y: number;
  number: number;
  group: "1-2" | "3-4" | "5-6" | "7-8";
  channel: string;
};

type Node = MicNode | InstrumentNode | MonitorNode;

/* ========= Utils ========= */
const COLORS = {
  Azul: "#2563eb",
  Rojo: "#ef4444",
  Verde: "#22c55e",
  Amarillo: "#eab308",
  Negro: "#111827",
  Blanco: "#f9fafb",
} as const;

const rid = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

const INSTRUMENTS: Record<InstrumentType, { emoji: string; label: string }> = {
  bateria: { emoji: "🥁", label: "Batería" },
  guitarra: { emoji: "🎸", label: "Guitarra" },
  guitarra_acustica: { emoji: "🎻", label: "Guitarra acústica" },
  piano: { emoji: "🎹", label: "Piano" },
  bajo: { emoji: "🎵", label: "Bajo" },
  cajon_peruano: { emoji: "🪘", label: "Cajón peruano" },
};

/* ---------- Tema ---------- */
type Theme = "light" | "dark";
const THEMES: Record<
  Theme,
  {
    canvas: string;
    card: string;
    border: string;
    title: string;
    text: string;
    sub: string;
    box: string;
    boxStroke: string;
    micStroke: string;
  }
> = {
  light: {
    canvas: "#f8fafc",
    card: "#ffffff",
    border: "#d4d4d8",
    title: "#52525b",
    text: "#111827",
    sub: "#6b7280",
    box: "#ffffff",
    boxStroke: "#cbd5e1",
    micStroke: "#0f172a",
  },
  dark: {
    canvas: "#0b0f1a",
    card: "rgba(17,17,24,.9)",
    border: "rgba(255,255,255,.18)",
    title: "#cbd5e1",
    text: "#e5e7eb",
    sub: "#9ca3af",
    box: "rgba(255,255,255,.06)",
    boxStroke: "rgba(255,255,255,.2)",
    micStroke: "#e5e7eb",
  },
};

/* ========= Shapes ========= */
function MicShape(props: {
  theme: Theme; node: MicNode; isSelected: boolean;
  onDragEnd: (pos: { x: number; y: number }) => void; onClick: () => void;
}) {
  const { theme, node, isSelected, onDragEnd, onClick } = props;
  const T = THEMES[theme];
  return (
    <Group
      x={node.x}
      y={node.y}
      draggable
      onDragEnd={(e) => onDragEnd({ x: e.target.x(), y: e.target.y() })}
      onClick={onClick}
      onTap={onClick}
    >
      {isSelected && (
        <Rect x={-44} y={-44} width={88} height={108} cornerRadius={12} stroke="#6366f1" dash={[4, 4]} opacity={0.6} />
      )}
      <Circle radius={17} fill={COLORS[node.color]} stroke={T.micStroke} strokeWidth={2} />
      <Text x={-45} y={22} width={90} align="center" text={`mic ${node.name || ""}`.trim()} fontSize={11} fill={T.text} />
      <Text x={-26} y={36} width={52} align="center" text={node.channel || ""} fontSize={9} fill={T.sub} />
    </Group>
  );
}
function InstrumentShape(props: {
  theme: Theme; node: InstrumentNode; isSelected: boolean;
  onDragEnd: (pos: { x: number; y: number }) => void; onClick: () => void;
}) {
  const { theme, node, isSelected, onDragEnd, onClick } = props;
  const T = THEMES[theme];
  return (
    <Group
      x={node.x}
      y={node.y}
      draggable
      onDragEnd={(e) => onDragEnd({ x: e.target.x(), y: e.target.y() })}
      onClick={onClick}
      onTap={onClick}
    >
      {isSelected && (
        <Rect x={-46} y={-38} width={92} height={104} cornerRadius={12} stroke="#6366f1" dash={[4, 4]} opacity={0.6} />
      )}
      <Rect x={-25} y={-20} width={49} height={39} cornerRadius={7} fill={T.box} stroke={T.boxStroke} strokeWidth={2} />
      <Text x={-8} y={-5} text={node.emoji} fontSize={16} width={16} align="center" fill={T.text} />
      <Text x={-39} y={23} width={78} align="center" text={node.label} fontSize={10} fill={T.text} />
      <Text x={-21} y={35} width={42} align="center" text={node.channel || ""} fontSize={9} fill={T.sub} />
    </Group>
  );
}
function MonitorShape(props: {
  theme: Theme; node: MonitorNode; isSelected: boolean;
  onDragEnd: (pos: { x: number; y: number }) => void; onClick: () => void;
}) {
  const { theme, node, isSelected, onDragEnd, onClick } = props;
  const T = THEMES[theme];
  return (
    <Group
      x={node.x}
      y={node.y}
      draggable
      onDragEnd={(e) => onDragEnd({ x: e.target.x(), y: e.target.y() })}
      onClick={onClick}
      onTap={onClick}
    >
      {isSelected && (
        <Rect x={-32} y={-24} width={64} height={80} cornerRadius={10} stroke="#6366f1" dash={[4, 4]} opacity={0.6} />
      )}
      <Rect
        x={-28}
        y={-19}
        width={57}
        height={39}
        cornerRadius={8}
        fill={T.box}
        stroke={T.boxStroke}
        strokeWidth={2}
      />
      <Text x={-39} y={24} width={78} align="center" text={`MON ${node.number} · G${node.group}`} fontSize={10} fill={T.text} />
      <Text x={-21} y={35} width={42} align="center" text={node.channel || ""} fontSize={9} fill={T.sub} />
    </Group>
  );
}

/* ========= Componente principal ========= */
export default function CroquisEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Modales de creación
  const [openMic, setOpenMic] = useState(false);
  const [openIns, setOpenIns] = useState(false);
  const [openMon, setOpenMon] = useState(false);

  // Modal de edición
  const [openEdit, setOpenEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<Node | null>(null);

  // Forms creación
  const [micColor, setMicColor] = useState<MicNode["color"]>("Negro");
  const [micName, setMicName] = useState("");
  const [micChannel, setMicChannel] = useState("");

  const [insType, setInsType] = useState<InstrumentType>("bateria");
  const [insChannel, setInsChannel] = useState("");

  const [monNumber, setMonNumber] = useState<number>(1);
  const [monGroup, setMonGroup] = useState<MonitorNode["group"]>("1-2");
  const [monChannel, setMonChannel] = useState("");

  // Forms edición
  const [editMic, setEditMic] = useState<{ color: MicNode["color"]; name: string; channel: string; }>({ color: "Negro", name: "", channel: "" });
  const [editIns, setEditIns] = useState<{ instrument: InstrumentType; channel: string; }>({ instrument: "bateria", channel: "" });
  const [editMon, setEditMon] = useState<{ number: number; group: MonitorNode["group"]; channel: string; }>({ number: 1, group: "1-2", channel: "" });

  // Query params
  const search = useSearchParams();
  const router = useRouter();
  const eventId = search.get("eventId") || "";
  const returnTo = search.get("returnTo") || "";
  const croquisId = search.get("id") || ""; // <-- si existe, estamos editando

  // Resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Cargar croquis existente si hay ?id=...
  useEffect(() => {
    let active = true;
    (async () => {
      if (!croquisId) return;
      try {
        const r = await fetch(`/api/croquis/${croquisId}`);
        const j = await r.json();
        if (!active) return;
        if (r.ok && j.data) {
          const d = j.data.data as any;
          if (d?.nodes?.length) setNodes(d.nodes);
          if (d?.theme === "light" || d?.theme === "dark") setTheme(d.theme);
          toast.message(`Editando croquis: ${j.data.name}`);
        } else {
          toast.error(j.error || "No se pudo cargar el croquis");
        }
      } catch (e: any) {
        toast.error(e.message);
      }
    })();
    return () => { active = false; };
  }, [croquisId]);

  /* Helpers edición */
  const updateNode = (id: string, patch: Partial<Node>) =>
    setNodes((arr) => arr.map((n) => (n.id === id ? ({ ...n, ...patch } as Node) : n)));
  const removeNode = (id: string) => setNodes((arr) => arr.filter((n) => n.id !== id));

  const getViewportCenter = () => {
    const stage = stageRef.current as any;
    if (!stage) return { x: size.w / 2, y: size.h / 2 };
    const abs = stage.getAbsoluteTransform().copy();
    const inv = abs.invert();
    const point = inv.point({ x: size.w / 2, y: size.h / 2 });
    return { x: point.x, y: point.y };
  };

  const addMic = (color: MicNode["color"], name: string, channel: string) => {
    const id = rid();
    const { x, y } = getViewportCenter();
    setNodes((arr) => [...arr, { id, kind: "mic", x, y, color, name, channel }]);
    setSelectedId(id);
  };
  const addInstrument = (instrument: InstrumentType, channel: string) => {
    const id = rid();
    const { x, y } = getViewportCenter();
    const info = INSTRUMENTS[instrument];
    setNodes((arr) => [...arr, { id, kind: "instrument", x, y, instrument, channel, emoji: info.emoji, label: info.label }]);
    setSelectedId(id);
  };
  const addMonitor = (number: number, group: MonitorNode["group"], channel: string) => {
    const id = rid();
    const { x, y } = getViewportCenter();
    setNodes((arr) => [...arr, { id, kind: "monitor", x, y, number, group, channel }]);
    setSelectedId(id);
  };

  const openEditFor = (n: Node) => {
    setEditTarget(n);
    if (n.kind === "mic") setEditMic({ color: n.color, name: n.name, channel: n.channel });
    else if (n.kind === "instrument") setEditIns({ instrument: n.instrument, channel: n.channel });
    else setEditMon({ number: n.number, group: n.group, channel: n.channel });
    setOpenEdit(true);
  };
  const saveEdit = () => {
    if (!editTarget) return;
    if (editTarget.kind === "mic") updateNode(editTarget.id, { ...editTarget, ...editMic });
    else if (editTarget.kind === "instrument") {
      const info = INSTRUMENTS[editIns.instrument];
      updateNode(editTarget.id, { ...editTarget, instrument: editIns.instrument, channel: editIns.channel, emoji: info.emoji, label: info.label } as Partial<InstrumentNode>);
    } else updateNode(editTarget.id, { ...editTarget, ...editMon });
    setOpenEdit(false);
    setEditTarget(null);
  };
  const deleteEdit = () => {
    if (!editTarget) return;
    removeNode(editTarget.id);
    setOpenEdit(false);
    setEditTarget(null);
  };

  const centerView = () => {
    const stage = stageRef.current as any;
    if (!stage || nodes.length === 0) return;
    const padding = 60;
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs) - padding;
    const minY = Math.min(...ys) - padding;
    const maxX = Math.max(...xs) + padding;
    const maxY = Math.max(...ys) + padding;
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const scale = Math.min(size.w / contentW, size.h / contentH, 1);
    stage.scale({ x: scale, y: scale });
    const newX = (size.w - contentW * scale) / 2 - minX * scale;
    const newY = (size.h - contentH * scale) / 2 - minY * scale;
    stage.position({ x: newX, y: newY });
    stage.batchDraw();
  };

  const exportPNG = () => {
    const stage = stageRef.current as any;
    if (!stage) return;
    const uri = stage.toDataURL({ pixelRatio: 2, mimeType: "image/png" });
    const a = document.createElement("a");
    a.href = uri;
    a.download = "croquis.png";
    a.click();
  };

  // Guardar a Recursos: POST si NO hay id; PATCH si hay id
  const saveToResources = async () => {
    const stage = stageRef.current as any;
    if (!stage) return;

    const image_data_url = stage.toDataURL({ pixelRatio: 2, mimeType: "image/png" });
    const payload = { image_data_url, data: { nodes, theme } };

    try {
      if (croquisId) {
        const r = await fetch(`/api/croquis/${croquisId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "No se pudo actualizar");
        toast.success("Croquis actualizado");
      } else {
        let name = prompt("Nombre del croquis:");
        if (!name) return;
        const r = await fetch("/api/croquis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, ...payload }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "No se pudo guardar");
        toast.success("Croquis guardado");
      }
    } catch (e: any) {
      toast.error(e.message);
      return;
    }

    if (returnTo) router.push(returnTo);
  };

  // Guardar para usar en formulario (sin tocar recursos)
  const saveAndReturn = async () => {
    const stage = stageRef.current as any;
    if (!stage) return;
    const imageUrl = stage.toDataURL({ pixelRatio: 2, mimeType: "image/png" });
    const dataJson = JSON.stringify(nodes);

    try {
      if (window.opener) {
        window.opener.postMessage(
          { type: "croquis:saved", payload: { eventId, imageUrl, dataJson, ts: Date.now() } },
          window.origin
        );
      } else {
        if (eventId) {
          localStorage.setItem(`croquis_image_url:${eventId}`, imageUrl);
          localStorage.setItem(`croquis_json:${eventId}`, dataJson);
        } else {
          localStorage.setItem("croquis_last_image_url", imageUrl);
          localStorage.setItem("croquis_last_json", dataJson);
        }
      }
    } catch {}
    if (returnTo) router.push(returnTo);
    else if (window.opener) window.close();
    else router.back();
  };

  // Zoom / paneo
  const onWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current as any;
    if (!stage) return;
    const oldScale = stage.scaleX() || 1;
    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? 1 : -1;
    const newScale = direction > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    stage.scale({ x: newScale, y: newScale });
    const newPos = { x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale };
    stage.position(newPos);
    stage.batchDraw();
  };
  const onMouseDown = (e: any) => {
    const stage = stageRef.current as any;
    if (!stage) return;
    const empty = e.target === stage;
    if (empty) {
      setIsPanning(true);
      stage.draggable(true);
      stage.startDrag();
      stage.container().style.cursor = "grabbing";
    } else {
      setIsPanning(false);
      stage.draggable(false);
      stage.container().style.cursor = "default";
    }
  };
  const onMouseUp = () => {
    const stage = stageRef.current as any;
    if (!stage) return;
    setIsPanning(false);
    stage.draggable(false);
    stage.container().style.cursor = "default";
  };

  const selected = useMemo(() => nodes.find((n) => n.id === selectedId) ?? null, [nodes, selectedId]);
  const T = THEMES[theme];

  return (
    <div
      ref={containerRef}
      className="relative h-[calc(100dvh-56px)] w-full overflow-hidden rounded-xl border"
      style={{ background: T.canvas }}
    >
      {/* Canvas */}
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        style={{ background: T.canvas, cursor: isPanning ? "grabbing" : "default", touchAction: "none" }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onTouchStart={onMouseDown}
        onTouchEnd={onMouseUp}
        onClick={() => setSelectedId(null)}
        onTap={() => setSelectedId(null)}
      >
        <Layer>
          {nodes.map((n) =>
            n.kind === "mic" ? (
              <MicShape key={n.id} theme={theme} node={n} isSelected={selectedId === n.id}
                onDragEnd={(pos) => updateNode(n.id, pos)} onClick={() => { setSelectedId(n.id); openEditFor(n); }} />
            ) : n.kind === "instrument" ? (
              <InstrumentShape key={n.id} theme={theme} node={n} isSelected={selectedId === n.id}
                onDragEnd={(pos) => updateNode(n.id, pos)} onClick={() => { setSelectedId(n.id); openEditFor(n); }} />
            ) : (
              <MonitorShape key={n.id} theme={theme} node={n} isSelected={selectedId === n.id}
                onDragEnd={(pos) => updateNode(n.id, pos)} onClick={() => { setSelectedId(n.id); openEditFor(n); }} />
            )
          )}
        </Layer>
      </Stage>

      {/* Toolbar / panel */}
      <div
        className="
          fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-background/90 backdrop-blur
          md:absolute md:left-3 md:top-3 md:inset-x-auto md:bottom-auto md:w-[360px] md:space-y-2 md:rounded-xl md:border md:bg-background/90
          pb-[env(safe-area-inset-bottom)]"
      >
        {/* Mobile */}
        <div className="md:hidden px-3 py-2">
          <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Herramientas</span>
            <Button size="sm" variant="secondary" className="h-8 gap-2" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
              <Palette className="size-4" /> {theme === "dark" ? "Claro" : "Oscuro"}
            </Button>
          </div>
          <div className="grid grid-cols-6 gap-2">
            <Button size="sm" variant="secondary" className="h-10 flex-col gap-1" onClick={() => setOpenMic(true)}>
              <Mic className="size-4" /><span className="text-[10px]">Mic</span>
            </Button>
            <Button size="sm" variant="secondary" className="h-10 flex-col gap-1" onClick={() => setOpenIns(true)}>
              <Guitar className="size-4" /><span className="text-[10px]">Instr</span>
            </Button>
            <Button size="sm" variant="secondary" className="h-10 flex-col gap-1" onClick={() => setOpenMon(true)}>
              <Headphones className="size-4" /><span className="text-[10px]">Monitor</span>
            </Button>
            <Button size="sm" className="h-10 flex-col gap-1" onClick={centerView}>
              <Crosshair className="size-4" /><span className="text-[10px]">Centrar</span>
            </Button>
            <Button size="sm" variant="secondary" className="h-10 flex-col gap-1" onClick={exportPNG}>
              <Download className="size-4" /><span className="text-[10px]">Export</span>
            </Button>
            
          </div>
          <div className="mt-2 grid grid-cols-1">
            <Button size="sm" variant="secondary" className="h-10 gap-2" onClick={saveToResources}>
              <Save className="size-4" /> {croquisId ? "Actualizar en Recursos" : "Guardar en Recursos"}
            </Button>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:block p-2">
          <div className="rounded-xl p-2 shadow-sm" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.title }}>Herramientas</div>
              <Button size="sm" variant="secondary" className="h-8 gap-2" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
                <Palette className="size-4" /> {theme === "dark" ? "Claro" : "Oscuro"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" className="h-9 gap-2" onClick={() => setOpenMic(true)}><Mic className="size-4" /> Micrófono</Button>
              <Button size="sm" variant="secondary" className="h-9 gap-2" onClick={() => setOpenIns(true)}><Guitar className="size-4" /> Instrumento</Button>
              <Button size="sm" variant="secondary" className="h-9 gap-2" onClick={() => setOpenMon(true)}><Headphones className="size-4" /> Monitor</Button>
              <Button size="sm" className="h-9 gap-2" onClick={centerView}><Crosshair className="size-4" /> Centrar</Button>
              <Button size="sm" variant="secondary" className="h-9 gap-2" onClick={exportPNG}><Download className="size-4" /> Exportar PNG</Button>
              <Button size="sm" variant="secondary" className="h-9 gap-2" onClick={saveToResources}><Save className="size-4" /> {croquisId ? "Actualizar en Recursos" : "Guardar en Recursos"}</Button>
              <Button size="sm" className="h-9 gap-2" onClick={saveAndReturn}><CheckCircle2 className="size-4" /> Usar en formulario</Button>
            </div>
          </div>
        </div>
      </div>

      {/* ======== Modales ======== */}
      <Dialog open={openMic} onOpenChange={setOpenMic}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo micrófono</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Color</Label>
              <div className="mt-2 grid grid-cols-6 gap-2">
                {(["Negro","Verde","Rojo","Blanco","Azul","Amarillo"] as MicNode["color"][]).map((c) => (
                  <button key={c} type="button"
                    onClick={() => setMicColor(c)}
                    className={`h-9 rounded-full border text-xs capitalize ${micColor === c ? "ring-2 ring-indigo-500" : ""}`}
                    style={{ background: COLORS[c], color: c === "Negro" ? "#fff" : "#111", borderColor: "rgba(0,0,0,.15)" }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div><Label className="text-xs">Nombre (persona)</Label><Input value={micName} onChange={(e) => setMicName(e.target.value)} className="h-11 text-base" /></div>
            <div><Label className="text-xs">Canal</Label><Input value={micChannel} onChange={(e) => setMicChannel(e.target.value)} className="h-11 text-base" /></div>
          </div>
          <DialogFooter>
            <Button className="gap-2" disabled={!micChannel.trim()}
              onClick={() => { addMic(micColor, micName.trim(), micChannel.trim()); setMicName(""); setMicChannel(""); setMicColor("Negro"); setOpenMic(false); }}>
              <PlusCircle className="size-4" /> Agregar mic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openIns} onOpenChange={setOpenIns}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo instrumento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Instrumento</Label>
              <Select value={insType} onValueChange={(v: InstrumentType) => setInsType(v)}>
                <SelectTrigger className="h-11 text-base mt-2"><SelectValue placeholder="Selecciona instrumento" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bateria">Batería</SelectItem>
                  <SelectItem value="guitarra">Guitarra</SelectItem>
                  <SelectItem value="guitarra_acustica">Guitarra acústica</SelectItem>
                  <SelectItem value="piano">Piano</SelectItem>
                  <SelectItem value="bajo">Bajo</SelectItem>
                  <SelectItem value="cajon_peruano">Cajón peruano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Canal</Label><Input value={insChannel} onChange={(e) => setInsChannel(e.target.value)} className="h-11 text-base" /></div>
          </div>
          <DialogFooter>
            <Button className="gap-2" disabled={!insChannel.trim()}
              onClick={() => { addInstrument(insType, insChannel.trim()); setInsChannel(""); setInsType("bateria"); setOpenIns(false); }}>
              <PlusCircle className="size-4" /> Agregar instrumento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openMon} onOpenChange={setOpenMon}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo monitor</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Número de monitor</Label><Input type="number" min={1} value={monNumber} onChange={(e) => setMonNumber(Number(e.target.value || 1))} className="h-11 text-base" /></div>
            <div>
              <Label className="text-xs">Grupo</Label>
              <Select value={monGroup} onValueChange={(v: MonitorNode["group"]) => setMonGroup(v)}>
                <SelectTrigger className="h-11 text-base mt-2"><SelectValue placeholder="Selecciona grupo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2">1-2</SelectItem>
                  <SelectItem value="3-4">3-4</SelectItem>
                  <SelectItem value="5-6">5-6</SelectItem>
                  <SelectItem value="7-8">7-8</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Nombre del canal</Label><Input value={monChannel} onChange={(e) => setMonChannel(e.target.value)} className="h-11 text-base" /></div>
          </div>
          <DialogFooter>
            <Button className="gap-2" disabled={!monChannel.trim()}
              onClick={() => { addMonitor(monNumber || 1, monGroup, monChannel.trim()); setMonNumber(1); setMonGroup("1-2"); setMonChannel(""); setOpenMon(false); }}>
              <PlusCircle className="size-4" /> Agregar monitor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar elemento */}
      <Dialog open={openEdit} onOpenChange={(o) => { if (!o) { setOpenEdit(false); setEditTarget(null); }}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar elemento</DialogTitle></DialogHeader>

          {editTarget?.kind === "mic" && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Color</Label>
                <div className="mt-2 grid grid-cols-6 gap-2">
                  {(["Negro","Verde","Rojo","Blanco","Azul","Amarillo"] as MicNode["color"][]).map((c) => (
                    <button key={c} type="button"
                      onClick={() => setEditMic({ ...editMic, color: c })}
                      className={`h-9 rounded-full border text-xs capitalize ${editMic.color === c ? "ring-2 ring-indigo-500" : ""}`}
                      style={{ background: COLORS[c], color: c === "Negro" ? "#fff" : "#111", borderColor: "rgba(0,0,0,.15)" }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div><Label className="text-xs">Nombre</Label><Input value={editMic.name} onChange={(e) => setEditMic({ ...editMic, name: e.target.value })} className="h-11 text-base" /></div>
              <div><Label className="text-xs">Canal</Label><Input value={editMic.channel} onChange={(e) => setEditMic({ ...editMic, channel: e.target.value })} className="h-11 text-base" /></div>
            </div>
          )}

          {editTarget?.kind === "instrument" && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Instrumento</Label>
                <Select value={editIns.instrument} onValueChange={(v: InstrumentType) => setEditIns({ ...editIns, instrument: v })}>
                  <SelectTrigger className="h-11 text-base" mt-2><SelectValue placeholder="Selecciona instrumento" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bateria">Batería</SelectItem>
                    <SelectItem value="guitarra">Guitarra</SelectItem>
                    <SelectItem value="guitarra_acustica">Guitarra acústica</SelectItem>
                    <SelectItem value="piano">Piano</SelectItem>
                    <SelectItem value="bajo">Bajo</SelectItem>
                    <SelectItem value="cajon_peruano">Cajón peruano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Canal</Label><Input value={editIns.channel} onChange={(e) => setEditIns({ ...editIns, channel: e.target.value })} className="h-11 text-base" /></div>
            </div>
          )}

          {editTarget?.kind === "monitor" && (
            <div className="space-y-3">
              <div><Label className="text-xs">Número</Label><Input type="number" min={1} value={String(editMon.number)} onChange={(e) => setEditMon({ ...editMon, number: Number(e.target.value || 1) })} className="h-11 text-base" /></div>
              <div>
                <Label className="text-xs">Grupo</Label>
                <Select value={editMon.group} onValueChange={(v: MonitorNode["group"]) => setEditMon({ ...editMon, group: v })}>
                  <SelectTrigger className="h-11 text-base mt-2"><SelectValue placeholder="Selecciona grupo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2">1-2</SelectItem>
                    <SelectItem value="3-4">3-4</SelectItem>
                    <SelectItem value="5-6">5-6</SelectItem>
                    <SelectItem value="7-8">7-8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Canal</Label><Input value={editMon.channel} onChange={(e) => setEditMon({ ...editMon, channel: e.target.value })} className="h-11 text-base" /></div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between gap-2">
            <Button variant="destructive" className="gap-2" onClick={deleteEdit}><Trash2 className="size-4" /> Eliminar</Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { setOpenEdit(false); setEditTarget(null); }}>Cancelar</Button>
              <Button onClick={saveEdit}>Guardar</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
