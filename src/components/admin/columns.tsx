"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { EventItem } from "@/lib/types";
import { Button } from "@/components/ui/button";

export const columns: ColumnDef<EventItem>[] = [
  {
    accessorKey: "church_or_event",
    header: "Evento / Iglesia",
    cell: ({ row }) => <span className="text-zinc-100">{row.original.church_or_event}</span>,
  },
  {
    accessorKey: "pastor_name",
    header: "Pastor(a)",
    cell: ({ row }) => <span className="text-zinc-300">{row.original.pastor_name}</span>,
  },
  {
    accessorKey: "dateLabel",
    header: "Fecha / Horario",
    cell: ({ row }) => <span className="text-zinc-400">{row.original.dateLabel}</span>,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => {
      const e = row.original;
      return (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/admin/croquis/${e.id}`}>Croquis</a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.dispatchEvent(new CustomEvent("admin:edit", { detail: e.id }))}
          >
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => document.dispatchEvent(new CustomEvent("admin:delete", { detail: e.id }))}
          >
            Eliminar
          </Button>
        </div>
      );
    },
    enableSorting: false,
  },
];
