"use client";
import { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ExternalLink, UploadCloud } from "lucide-react";

type Mode = "none" | "upload" | "select" | "builder";

export default function CroquisPicker({
  eventId,
  valueUrl,
  valueId,
  onChange,
  returnTo = "/admin",
}: {
  eventId: string;
  valueUrl?: string | null;
  valueId?: string | null; // id de croquis seleccionado
  onChange: (v: { mode: Mode; image_url?: string | null; croquis_id?: string | null }) => void;
  returnTo?: string;
}) {
  const [mode, setMode] = useState<Mode>(valueId ? "select" : valueUrl ? "upload" : "none");
  const [options, setOptions] = useState<{ id: string; name: string; image_url: string | null }[]>([]);
  const [preview, setPreview] = useState<string | null>(valueUrl || null);

  useEffect(() => {
    if (mode === "select") {
      fetch("/api/croquis").then(r=>r.json()).then(j=>setOptions(j.data || []));
    }
  }, [mode]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPreview(url);
    onChange({ mode: "upload", image_url: url, croquis_id: null });
  }

  return (
    <div className="space-y-3">
      <RadioGroup value={mode} onValueChange={(v: Mode) => { setMode(v); onChange({ mode: v }); }}>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 rounded-md border p-3">
            <RadioGroupItem value="none" id="m1" />
            <span>Ninguno</span>
          </label>
          <label className="flex items-center gap-2 rounded-md border p-3">
            <RadioGroupItem value="upload" id="m2" />
            <span>Subir imagen</span>
          </label>
          <label className="flex items-center gap-2 rounded-md border p-3">
            <RadioGroupItem value="select" id="m3" />
            <span>Escoger croquis</span>
          </label>
          <label className="flex items-center gap-2 rounded-md border p-3">
            <RadioGroupItem value="builder" id="m4" />
            <span>Hacer croquis</span>
          </label>
        </div>
      </RadioGroup>

      {mode === "upload" && (
        <div className="rounded-md border p-3 space-y-2">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <UploadCloud className="size-4" />
            <Input type="file" accept="image/*" className="hidden" onChange={onFile} />
            <span className="underline">Elegir imagen</span>
          </label>
          {preview && (
            <div className="overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Croquis" className="max-h-48 w-full object-cover" />
            </div>
          )}
        </div>
      )}

      {mode === "select" && (
        <div className="grid grid-cols-2 gap-2">
          {options.map(op => (
            <button
              key={op.id}
              className="rounded-md border p-2 text-left hover:bg-muted"
              onClick={()=>onChange({ mode: "select", croquis_id: op.id, image_url: op.image_url })}
            >
              <div className="text-sm font-medium">{op.name}</div>
              {op.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={op.image_url} alt="" className="mt-2 h-20 w-full object-cover rounded" />
              )}
            </button>
          ))}
        </div>
      )}

      {mode === "builder" && (
        <div className="rounded-md border p-3">
          <p className="text-sm text-muted-foreground mb-2">
            Abre el editor, exporta y usa “Usar en formulario”.
          </p>
          <Link
            href={`/admin/croquis/new?eventId=${encodeURIComponent(eventId)}&returnTo=${encodeURIComponent(returnTo)}`}
            target="_blank"
            className="inline-flex items-center gap-2 underline"
          >
            Ir al editor <ExternalLink className="size-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
