"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoginForm } from "@/components/login-form";
import { cn } from "@/lib/utils";

type AvatarStyle = "dylan" | "micah";

type Profile = {
  id: string;
  name: string;
  role: "admin" | "member";
  gradient: string;
  avatarSeed?: string;
  avatarStyle?: AvatarStyle;
  avatarUrl?: string;
};

type Member = {
  id: string;
  name: string;
  avatar_seed?: string;
  avatar_style?: AvatarStyle;
};

const MEMBER_CACHE_KEY = "isc-member-cache";

const palette = [
  "from-zinc-700/70 to-zinc-800/60",
  "from-zinc-600/70 to-zinc-700/60",
  "from-zinc-800/70 to-zinc-900/60",
  "from-zinc-700/60 to-zinc-900/60",
  "from-zinc-600/60 to-zinc-800/60",
];

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

export default function AccesoPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [pendingProfile, setPendingProfile] = useState<Profile | null>(null);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const codeRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const [digits, setDigits] = useState(["", "", "", ""]);

  const broadcastProfileChange = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("isc-profile-changed"));
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("isc-active-profile");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Profile;
      if (parsed.role === "member") {
        router.replace("/member/eventos");
      } else if (parsed.role === "admin") {
        router.replace("/admin");
      }
    } catch {
      /* ignore */
    }
  }, [router]);

  useEffect(() => {
    let alive = true;
    try {
      const cached = localStorage.getItem(MEMBER_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { ts: number; data: Member[] };
        if (parsed?.data) {
          setMembers(parsed.data);
          setMembersLoading(false);
        }
      }
    } catch {
      /* ignore cache */
    }

    fetch("/api/public-members")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (Array.isArray(j.data)) {
          setMembers(j.data);
          try {
            localStorage.setItem(MEMBER_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: j.data }));
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setMembersLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const profiles = useMemo<Profile[]>(() => {
    const adminProfile: Profile = {
      id: "admin",
      name: "Administrador",
      role: "admin",
      gradient: "from-zinc-600/75 to-zinc-800/70",
      avatarSeed: "Admin",
      avatarStyle: "dylan",
      avatarUrl: dicebearUrl("Admin", "dylan"),
    };

    const memberProfiles = members.map((m, idx) => {
      const seed = m.avatar_seed || m.name || `member-${idx}`;
      const style: AvatarStyle = m.avatar_style || "dylan";
      return {
        id: m.id,
        name: m.name,
        role: "member" as const,
        gradient: palette[idx % palette.length],
        avatarSeed: seed,
        avatarStyle: style,
        avatarUrl: dicebearUrl(seed, style),
      };
    });

    return [adminProfile, ...memberProfiles];
  }, [members]);

  function openVerification(profile: Profile) {
    if (profile.role === "admin") {
      setAdminLoginOpen(true);
      return;
    }
    setPendingProfile(profile);
    setDigits(["", "", "", ""]);
    setTimeout(() => codeRefs[0].current?.focus(), 50);
  }

  function updateDigit(idx: number, value: string) {
    const clean = value.replace(/[^0-9]/g, "").slice(0, 1);
    const next = [...digits];
    next[idx] = clean;
    setDigits(next);
    if (clean && idx < codeRefs.length - 1) {
      codeRefs[idx + 1].current?.focus();
    }
  }

  async function handleVerify(e?: React.FormEvent) {
    e?.preventDefault();
    if (!pendingProfile) return;
    const code = digits.join("");
    if (code.length !== 4) {
      toast.error("Ingresa los 4 digitos");
      return;
    }

    try {
      setVerifying(true);
      const res = await fetch("/api/profile-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: pendingProfile.id, code }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Codigo invalido");

      if (j.member?.id && j.member?.name) {
        setMembers((prev) => {
          const exists = prev.some((m) => m.id === j.member.id);
          if (exists) {
            return prev.map((m) =>
              m.id === j.member.id
                ? {
                    id: j.member.id,
                    name: j.member.name,
                    avatar_seed: j.member.avatar_seed,
                    avatar_style: j.member.avatar_style,
                  }
                : m,
            );
          }
          return [
            ...prev,
            {
              id: j.member.id,
              name: j.member.name,
              avatar_seed: j.member.avatar_seed,
              avatar_style: j.member.avatar_style,
            },
          ];
        });
      }

      const nextProfile: Profile = {
        ...pendingProfile,
        id: j.member?.id || pendingProfile.id,
        name: j.member?.name || pendingProfile.name,
        avatarSeed: j.member?.avatar_seed || pendingProfile.avatarSeed,
        avatarStyle: j.member?.avatar_style || pendingProfile.avatarStyle,
      };

      localStorage.setItem("isc-active-profile", JSON.stringify(nextProfile));
      broadcastProfileChange();
      toast.success("Acceso concedido");
      setPendingProfile(null);
      setDigits(["", "", "", ""]);

      if (nextProfile.role === "member") {
        router.replace("/member/eventos");
        return;
      }
      if (nextProfile.role === "admin") {
        router.replace("/admin");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo verificar";
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <section className="space-y-8">
      <Card className="border border-border/70 bg-card/80 shadow-sm">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold sm:text-3xl">Selecciona tu perfil</h1>
            <p className="text-sm text-muted-foreground">Toca tu tarjeta e ingresa tu codigo.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {membersLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[5/6] animate-pulse rounded-2xl bg-muted/30" />
                ))
              : profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => openVerification(profile)}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border border-border/60",
                      "aspect-[5/6] text-left shadow-sm transition",
                      "hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    )}
                    aria-label={`Entrar como ${profile.name}`}
                  >
                    <div className="absolute inset-0">
                      {profile.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatarUrl}
                          alt={profile.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className={cn("h-full w-full bg-gradient-to-br", profile.gradient)} />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent group-hover:from-black/65" />

                    <div className="relative flex h-full items-end justify-center">
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-slate-900 shadow-md shadow-black/20">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="truncate">{profile.name}</span>
                      </div>
                    </div>
                  </button>
                ))}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!pendingProfile}
        onOpenChange={(open) => {
          if (!open) setPendingProfile(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verificar {pendingProfile?.name}</DialogTitle>
            <DialogDescription>Ingresa el codigo para entrar.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="grid grid-cols-4 gap-3">
              {codeRefs.map((ref, idx) => (
                <input
                  key={idx}
                  ref={ref}
                  inputMode="numeric"
                  maxLength={1}
                  value={digits[idx]}
                  onChange={(e) => updateDigit(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !digits[idx] && idx > 0) codeRefs[idx - 1].current?.focus();
                  }}
                  className="h-12 rounded-xl border border-input bg-background text-center text-2xl font-semibold text-foreground shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              ))}
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setPendingProfile(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={verifying}>
                {verifying ? "Verificando..." : "Entrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={adminLoginOpen} onOpenChange={setAdminLoginOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[360px] sm:max-w-[480px]">
          <DialogHeader className="sr-only">
            <DialogTitle>Acceso administrador</DialogTitle>
            <DialogDescription>Inicia sesion para ir al panel de administracion.</DialogDescription>
          </DialogHeader>
          <Suspense fallback={<div className="h-48" />}>
            <LoginForm bare />
          </Suspense>
        </DialogContent>
      </Dialog>
    </section>
  );
}
