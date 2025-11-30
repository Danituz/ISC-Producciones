"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type MemberRow = {
  name: string;
  count: number;
  total: number;
  events: { id: string; date: string; church_or_event: string; roles: ("audio" | "luces")[] }[];
};

export default function PayrollClient() {
  const today = new Date();
  const [month, setMonth] = useState(() => `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);
  const [half, setHalf] = useState<"1" | "2">(() => (today.getDate() <= 15 ? "1" : "2"));
  const [data, setData] = useState<{ members: MemberRow[]; summary: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [openMember, setOpenMember] = useState<string | null>(null);

  const range = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const endOfMonth = new Date(y, m, 0).getDate();
    const start = `${month}-${half === "1" ? "01" : "16"}`;
    const end = `${month}-${half === "1" ? "15" : String(endOfMonth).padStart(2, "0")}`;
    return { start, end };
  }, [month, half]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const r = await fetch(`/api/payroll?start=${range.start}&end=${range.end}`, { cache: "no-store" });
        const j = await r.json();
        if (!active) return;
        setData(j.data || null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [range.start, range.end]);

  const monthsOptions = useMemo(() => {
    const out: { value: string; label: string }[] = [];
    const base = new Date();
    base.setDate(1);
    for (let i = -11; i <= 0; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("es-MX", { month: "long" });
      out.push({ value, label });
    }
    return out;
  }, []);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl font-semibold">Nómina</h2>
        <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:grid-cols-3">
          <div>
            <Label>Mes</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="mt-2 h-9 min-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthsOptions.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label.charAt(0).toUpperCase() + op.label.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quincena</Label>
            <Select value={half} onValueChange={(v) => setHalf(v as "1" | "2")}>
              <SelectTrigger className="mt-2 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">01–15</SelectItem>
                <SelectItem value="2">16–Fin de mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="self-end text-sm text-muted-foreground">
            {range.start} → {range.end}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Integrante</TableHead>
                <TableHead className="w-24 text-right">Eventos</TableHead>
                <TableHead className="w-28 text-right">Total</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4}>Cargando…</TableCell>
                </TableRow>
              ) : !data?.members?.length ? (
                <TableRow>
                  <TableCell colSpan={4}>Sin resultados</TableCell>
                </TableRow>
              ) : (
                data.members.map((m) => (
                  <Fragment key={m.name}>
                    <TableRow>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-right">{m.count}</TableCell>
                      <TableCell className="text-right">${m.total.toLocaleString("es-MX")}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setOpenMember(openMember === m.name ? null : m.name)}
                        >
                          {openMember === m.name ? "Ocultar" : "Ver eventos"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {openMember === m.name && (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <div className="rounded-md border bg-background p-3 text-sm">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {m.events.map((e) => (
                                <div key={e.id} className="flex items-center justify-between gap-2">
                                  <div className="truncate">
                                    <div className="font-medium">{e.church_or_event}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {e.date} • {e.roles.join(", ")}
                                    </div>
                                  </div>
                                  <div className="text-right">$800</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
