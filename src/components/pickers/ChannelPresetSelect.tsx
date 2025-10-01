"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Preset = { id: string; name: string };

export default function ChannelPresetSelect({
  value,
  onChange,
  placeholder = "Selecciona preset de canales",
}: {
  value?: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
}) {
  const [list, setList] = useState<Preset[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/channel-presets", { cache: "no-store" });
        const j = await res.json();
        if (!active) return;
        setList(j.data || []);
      } catch (err) {
        console.error("Error cargando presets", err);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Select
      value={value ?? undefined}
      onValueChange={(v) => onChange(v === "none" ? null : v)}
    >
      <SelectTrigger className="h-11 text-base mt-2">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Ninguno</SelectItem>
        {list.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
