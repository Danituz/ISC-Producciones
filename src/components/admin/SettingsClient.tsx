"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save, Settings } from "lucide-react";

export default function SettingsClient() {
  const [payrollRate, setPayrollRate] = useState(800);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      const json = await res.json();
      if (json.data?.payroll_rate) {
        setPayrollRate(json.data.payroll_rate);
      }
    } catch {
      // Usar valor por defecto
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payroll_rate: payrollRate }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al guardar");
      toast.success("Configuración guardada");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <Settings className="size-6 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Configuración</h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="border border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Tarifa de Nómina
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="h-11 animate-pulse rounded-md bg-muted/30" />
            ) : (
              <>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-muted-foreground">$</span>
                    <Input
                      id="payroll-rate"
                      type="number"
                      min={0}
                      step={50}
                      className="h-11 text-lg"
                      value={payrollRate}
                      onChange={(e) => setPayrollRate(Number(e.target.value) || 0)}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Esta tarifa se aplicará a todos los eventos para calcular la nómina
                  </p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  <Save className="size-4" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
