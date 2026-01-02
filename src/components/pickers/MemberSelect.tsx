"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MemberSelect({
  value,
  onChange,
  placeholder = "Seleccionar integrante",
  className,
}: {
  value: string | null;
  onChange: (name: string | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/members", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setMembers(j.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleChange(name: string) {
    if (name === "__none__") {
      onChange(null);
      return;
    }
    onChange(name);
  }

  return (
    <Select value={value || "__none__"} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">
          <span className="text-muted-foreground">Sin asignar</span>
        </SelectItem>
        {loading ? (
          <SelectItem value="__loading__" disabled>
            Cargando...
          </SelectItem>
        ) : (
          members.map((m) => (
            <SelectItem key={m.id} value={m.name}>
              {m.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
