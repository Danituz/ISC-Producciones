"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Group, Circle, Rect, Text } from "react-konva";

type MicNode = {
  id: string; kind: "mic"; x: number; y: number;
  color: "Azul" | "Rojo" | "Verde" | "Amarillo" | "Negro" | "Blanco";
  name: string; channel: string;
};
type InstrumentNode = {
  id: string; kind: "instrument"; x: number; y: number;
  instrument: string; channel: string; emoji: string; label: string;
};
type MonitorNode = {
  id: string; kind: "monitor"; x: number; y: number;
  number: number; group: "1-2" | "3-4" | "5-6" | "7-8"; channel: string;
};
type Node = MicNode | InstrumentNode | MonitorNode;

const COLORS = {
  Azul: "#2563eb",
  Rojo: "#ef4444",
  Verde: "#22c55e",
  Amarillo: "#eab308",
  Negro: "#111827",
  Blanco: "#f9fafb",
} as const;

const THEMES = {
  light: {
    canvas: "#f8fafc",
    box: "#ffffff",
    boxStroke: "#cbd5e1",
    text: "#111827",
    sub: "#6b7280",
    micStroke: "#0f172a",
  },
  dark: {
    canvas: "#0b0f1a",
    box: "rgba(255,255,255,.06)",
    boxStroke: "rgba(255,255,255,.2)",
    text: "#e5e7eb",
    sub: "#9ca3af",
    micStroke: "#e5e7eb",
  },
} as const;

export default function CroquisThumb({
  data,
  maxHeight = 420,
}: {
  data: { nodes: Node[]; theme?: "light" | "dark" } | null;
  maxHeight?: number;
}) {
  const [size, setSize] = useState({ w: 900, h: 520 });
  const outerRef = useRef<HTMLDivElement>(null);

  // Responsivo: ocupar ancho del container, limitar alto
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = Math.min(maxHeight, Math.round((w * 520) / 900));
      setSize({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxHeight]);

  const nodes = (data?.nodes ?? []) as Node[];
  const theme = data?.theme === "light" ? "light" : "dark";
  const T = THEMES[theme];

  // Auto-fit del contenido
  const { scale, offset } = useMemo(() => {
    if (!nodes.length) return { scale: 1, offset: { x: 0, y: 0 } };
    const pad = 40;
    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    const minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad;
    const maxX = Math.max(...xs) + pad, maxY = Math.max(...ys) + pad;
    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);
    const scale = Math.min(size.w / contentW, size.h / contentH);
    const offset = { x: -minX, y: -minY };
    return { scale, offset };
  }, [nodes, size]);

  return (
    <div ref={outerRef} className="w-full">
      <div className="rounded-xl border border-dashed border-border/40 overflow-hidden">
        <Stage
          width={size.w}
          height={size.h}
          scale={{ x: scale, y: scale }}
          style={{ background: T.canvas }}
        >
          <Layer x={offset.x} y={offset.y}>
            {nodes.map((n) => {
              if (n.kind === "mic") {
                const m = n as MicNode;
                return (
                  <Group key={m.id} x={m.x} y={m.y} listening={false}>
                    <Circle radius={16} fill={COLORS[m.color]} stroke={T.micStroke} strokeWidth={2} />
                    <Text x={-40} y={22} width={80} align="center" text={`mic ${m.name||""}`.trim()} fontSize={11} fill={T.text} />
                    <Text x={-22} y={36} width={44} align="center" text={m.channel||""} fontSize={9} fill={T.sub} />
                  </Group>
                );
              }
              if (n.kind === "instrument") {
                const it = n as InstrumentNode;
                return (
                  <Group key={it.id} x={it.x} y={it.y} listening={false}>
                    <Rect x={-24} y={-18} width={48} height={36} cornerRadius={7} fill={T.box} stroke={T.boxStroke} strokeWidth={2} />
                    <Text x={-8} y={-6} text={it.emoji} fontSize={16} width={16} align="center" fill={T.text} />
                    <Text x={-38} y={22} width={76} align="center" text={it.label} fontSize={10} fill={T.text} />
                    <Text x={-20} y={34} width={40} align="center" text={it.channel||""} fontSize={9} fill={T.sub} />
                  </Group>
                );
              }
              // monitor
              const mo = n as MonitorNode;
              return (
                <Group key={mo.id} x={mo.x} y={mo.y} listening={false}>
                  <Rect x={-28} y={-19} width={56} height={38} cornerRadius={8} fill={T.box} stroke={T.boxStroke} strokeWidth={2} />
                  <Text x={-38} y={23} width={76} align="center" text={`MON ${mo.number} · G${mo.group}`} fontSize={10} fill={T.text} />
                  <Text x={-20} y={35} width={40} align="center" text={mo.channel||""} fontSize={9} fill={T.sub} />
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
