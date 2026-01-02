"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle2, KeyRound, Palette, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

type AvatarStyle = "dylan" | "micah";

const avatarSeedsByStyle: Record<AvatarStyle, string[]> = {
  dylan: ["Felix", "Aneka", "Lumen", "Orbit", "Pixel", "Nova", "IndigoFox", "Echo"],
  micah: ["Lia", "Rafa", "Cami", "Max", "Sofi", "Nico", "Kai", "Val"],
};

const dicebearUrl = (seed: string, style: AvatarStyle = "dylan") => {
  const bg = "b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf";
  let params = `seed=${encodeURIComponent(seed)}&backgroundColor=${bg}&radius=0`;
  if (style === "micah") {
    params += "&baseColor=f9c9b6";
    params += "&earringsProbability=0&ears=attached";
    params += "&eyeShadowColor=ffffff&eyebrows=up";
    params += "&hairProbability=100&hair=fonze,dannyPhantom,turban";
    params += "&hairColor=000000,77311d,f4d150";
    params += "&glassesColor=000000";
    params += "&facialHairProbability=0";
  }
  return `https://api.dicebear.com/9.x/${style}/svg?${params}`;
};

type Profile = {
  id: string;
  name: string;
  sourceName?: string;
  avatarSeed?: string;
  avatarStyle?: AvatarStyle;
};

type ProfilePrefs = {
  displayName?: string;
  avatarSeed?: string;
  avatarStyle?: AvatarStyle;
  code?: string;
};

export function MemberProfileView({
  profile,
  prefs,
  onPrefsChange,
}: {
  profile: Profile;
  prefs: Record<string, ProfilePrefs>;
  onPrefsChange: (id: string, partial: Partial<ProfilePrefs>) => void;
}) {
  const [nameForm, setNameForm] = useState({ name: profile.name });
  const [codeForm, setCodeForm] = useState({ currentCode: "", newCode: "" });
  const [savingSection, setSavingSection] = useState<"name" | "code" | "avatar" | null>(null);

  const currentPref = prefs[profile.id];
  const currentStyle: AvatarStyle = currentPref?.avatarStyle || profile.avatarStyle || "dylan";
  const seedsForStyle = avatarSeedsByStyle[currentStyle];
  const currentSeed = currentPref?.avatarSeed || profile.avatarSeed || profile.name || seedsForStyle[0];

  useEffect(() => {
    setNameForm({ name: profile.name });
    setCodeForm({ currentCode: "", newCode: "" });
  }, [profile.id, profile.name]);

  async function saveName() {
    if (!nameForm.name.trim()) {
      toast.error("El nombre no puede estar vacio");
      return;
    }
    try {
      setSavingSection("name");
      const r = await fetch("/api/profile/update-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile.id,
          newName: nameForm.name.trim(),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo actualizar");

      const updatedProfile = {
        ...profile,
        name: j.member?.name ?? nameForm.name,
        sourceName: j.member?.name ?? nameForm.name,
      };
      localStorage.setItem("isc-active-profile", JSON.stringify(updatedProfile));
      onPrefsChange(profile.id, { displayName: j.member?.name });
      window.dispatchEvent(new Event("isc-profile-changed"));
      window.dispatchEvent(new CustomEvent("isc-profile-updated", { detail: { profile: updatedProfile } }));
      toast.success("Nombre actualizado");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar";
      toast.error(message);
    } finally {
      setSavingSection(null);
    }
  }

  async function saveCode() {
    if (!codeForm.currentCode || codeForm.currentCode.length !== 4) {
      toast.error("Ingresa tu codigo actual de 4 digitos");
      return;
    }
    if (!codeForm.newCode || codeForm.newCode.length !== 4) {
      toast.error("El nuevo codigo debe tener 4 digitos");
      return;
    }
    try {
      setSavingSection("code");
      const r = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile.id,
          currentCode: codeForm.currentCode,
          newName: profile.name,
          newCode: codeForm.newCode,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo actualizar");

      onPrefsChange(profile.id, { code: codeForm.newCode });
      setCodeForm({ currentCode: "", newCode: "" });
      toast.success("Codigo actualizado");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar";
      toast.error(message);
    } finally {
      setSavingSection(null);
    }
  }

  async function saveAvatar() {
    try {
      setSavingSection("avatar");
      const r = await fetch("/api/profile/update-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile.id,
          avatarSeed: currentSeed,
          avatarStyle: currentStyle,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo actualizar");

      const updatedProfile = {
        ...profile,
        avatarSeed: j.member?.avatar_seed || currentSeed,
        avatarStyle: j.member?.avatar_style || currentStyle,
      };
      localStorage.setItem("isc-active-profile", JSON.stringify(updatedProfile));
      onPrefsChange(profile.id, {
        avatarSeed: j.member?.avatar_seed || currentSeed,
        avatarStyle: j.member?.avatar_style || currentStyle,
      });
      window.dispatchEvent(new Event("isc-profile-changed"));
      window.dispatchEvent(new CustomEvent("isc-profile-updated", { detail: { profile: updatedProfile } }));
      toast.success(j.member?.avatar_saved === false ? "Avatar guardado localmente" : "Avatar actualizado");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar";
      toast.error(message);
    } finally {
      setSavingSection(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Seccion: Nombre */}
      <Card className="border border-border/70 bg-background/70">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center gap-3">
            <UserCircle2 className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Nombre</h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Tu nombre</Label>
            <Input
              id="displayName"
              value={nameForm.name}
              onChange={(e) => setNameForm({ name: e.target.value })}
              placeholder="Tu nombre"
              className="h-10"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={saveName} disabled={savingSection === "name"} className="h-10 gap-2">
              {savingSection === "name" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar nombre
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seccion: Codigo */}
      <Card className="border border-border/70 bg-background/70">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Codigo de acceso</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currentCode">Codigo actual</Label>
              <Input
                id="currentCode"
                value={codeForm.currentCode}
                maxLength={4}
                onChange={(e) =>
                  setCodeForm((f) => ({
                    ...f,
                    currentCode: e.target.value.replace(/\D/g, "").slice(0, 4),
                  }))
                }
                placeholder="****"
                className="h-10 font-mono tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newCode">Nuevo codigo</Label>
              <Input
                id="newCode"
                value={codeForm.newCode}
                maxLength={4}
                onChange={(e) =>
                  setCodeForm((f) => ({
                    ...f,
                    newCode: e.target.value.replace(/\D/g, "").slice(0, 4),
                  }))
                }
                placeholder="****"
                className="h-10 font-mono tracking-widest"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveCode} disabled={savingSection === "code"} className="h-10 gap-2">
              {savingSection === "code" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Cambiar codigo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seccion: Avatar */}
      <Card className="border border-border/70 bg-background/70">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Avatar</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["dylan", "micah"] as AvatarStyle[]).map((style) => (
              <Button
                key={style}
                variant={currentStyle === style ? "secondary" : "outline"}
                size="sm"
                onClick={() => onPrefsChange(profile.id, { avatarStyle: style })}
                className="h-9"
              >
                {style === "dylan" ? "Estilo 1" : "Estilo 2"}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {seedsForStyle.map((seed) => {
              const url = dicebearUrl(seed, currentStyle);
              const selected = currentSeed === seed;
              return (
                <button
                  key={seed}
                  onClick={() => onPrefsChange(profile.id, { avatarSeed: seed })}
                  className={cn(
                    "relative overflow-hidden rounded-xl border p-2 transition",
                    selected ? "border-foreground/50 ring-2 ring-foreground/30" : "border-border/60 hover:border-border"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={seed} className="h-20 w-full rounded-lg object-contain sm:h-24" loading="lazy" decoding="async" />
                </button>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button onClick={saveAvatar} disabled={savingSection === "avatar"} className="h-10 gap-2">
              {savingSection === "avatar" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar avatar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
