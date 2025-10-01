"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Croquis = { id: string; name: string };

export default function CroquisSelect({
  value,
  onChange,
  placeholder = "Selecciona croquis",
}: {
  value?: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
}) {
  const [list, setList] = useState<Croquis[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/croquis", { cache: "no-store" });
        const j = await res.json();
        if (!active) return;
        setList((j.data || []).map((c: any) => ({ id: c.id, name: c.name })));
      } catch (err) {
        console.error("Error cargando croquis", err);
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
        {list.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
