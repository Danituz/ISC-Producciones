"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/** Selecciona por NOMBRE (string[]) */
export default function MemberMultiSelect({
  value,
  onChange,
  placeholder = "Seleccionar",
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [options, setOptions] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/members")
      .then((r) => r.json())
      .then((j) => { if (alive) setOptions(j.data || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const toggle = (name: string) => {
    if (value.includes(name)) {
      onChange(value.filter((n) => n !== name));
    } else {
      onChange([...value, name]);
    }
  };

  return (
    <div className="space-y-2">
      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {value.map((v) => (
          <Badge
            key={v}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => toggle(v)}
            title="Quitar"
          >
            {v} ✕
          </Badge>
        ))}
        <Button size="sm" variant="outline" type="button" onClick={() => setOpen((o) => !o)}>
          {placeholder}
        </Button>
      </div>

      {/* Panel de selección */}
      {open && (
        <div className="rounded-md border p-2">
          <div className="max-h-48 overflow-auto">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {options.map((op) => {
                const selected = value.includes(op.name);
                return (
                  <Button
                    key={op.id}
                    type="button"
                    size="sm"
                    variant={selected ? "default" : "secondary"}
                    onClick={() => toggle(op.name)}
                    className="justify-start"
                  >
                    {selected ? "✓ " : ""}{op.name}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            Pulsa para (des)seleccionar. Cierra el panel con el botón de arriba.
          </div>
        </div>
      )}
    </div>
  );
}
