"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Scene = { id: string; name: string; type: "audio" | "lights" };

export default function SceneSelect({
  type,
  value,
  onChange,
  placeholder = "Selecciona escena",
}: {
  type: "audio" | "lights";
  value?: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
}) {
  const [list, setList] = useState<Scene[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/scenes?type=${type}`, {
          cache: "no-store",
        });
        const j = await res.json();
        if (!active) return;
        setList(j.data || []);
      } catch (err) {
        console.error("Error cargando escenas", err);
      }
    })();
    return () => {
      active = false;
    };
  }, [type]);

  return (
    <Select
      value={value ?? undefined}
      onValueChange={(v) => onChange(v === "none" ? null : v)}
    >
      <SelectTrigger className="mt-2 h-11 text-base">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Ninguna</SelectItem>
        {list.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
