"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import type { Organization } from "@/lib/types";

export default function OrganizationSelect({
  value,
  onChange,
  onOrganizationLoad,
  placeholder = "Seleccionar organización",
  className,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  onOrganizationLoad?: (org: Organization | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/organizations", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setOrgs(j.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleChange(id: string) {
    if (id === "__none__") {
      onChange(null);
      onOrganizationLoad?.(null);
      return;
    }
    onChange(id);
    const org = orgs.find((o) => o.id === id);
    onOrganizationLoad?.(org || null);
  }

  return (
    <Select value={value || "__none__"} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">
          <span className="text-muted-foreground">Sin organización (manual)</span>
        </SelectItem>
        {loading ? (
          <SelectItem value="__loading__" disabled>
            Cargando...
          </SelectItem>
        ) : (
          orgs.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              <div className="flex flex-col">
                <span>{org.name}</span>
                {org.pastor_name && (
                  <span className="text-xs text-muted-foreground">
                    {org.pastor_name}
                  </span>
                )}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
