"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu as MenuIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function NavbarMember() {
  const [profile, setProfile] = useState<{ name?: string; avatarSeed?: string; avatarStyle?: string; avatarUrl?: string } | null>(null);
  const [prefs, setPrefs] = useState<Record<string, { avatarSeed?: string; avatarStyle?: string; avatarUrl?: string }>>({});

  const syncProfile = (evt?: Event) => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("isc-active-profile");
      const prefRaw = localStorage.getItem("isc-profile-prefs");
      const parsedProfile = raw ? JSON.parse(raw) : null;
      const parsedPrefs = prefRaw ? JSON.parse(prefRaw) : {};

      // Si viene un CustomEvent con perfil actualizado, úsalo directamente
      const detailProfile = (evt as CustomEvent)?.detail?.profile;
      const nextProfile = detailProfile || parsedProfile;

      queueMicrotask(() => {
        setProfile(nextProfile);
        setPrefs(parsedPrefs);
      });
    } catch {
      queueMicrotask(() => {
        setProfile(null);
        setPrefs({});
      });
    }
  };

  useEffect(() => {
    syncProfile();
    window.addEventListener("storage", syncProfile);
    window.addEventListener("isc-profile-changed", syncProfile as EventListener);
    window.addEventListener("isc-profile-prefs-changed", syncProfile as EventListener);
    window.addEventListener("isc-profile-updated", syncProfile as EventListener);
    return () => {
      window.removeEventListener("storage", syncProfile);
      window.removeEventListener("isc-profile-changed", syncProfile as EventListener);
      window.removeEventListener("isc-profile-prefs-changed", syncProfile as EventListener);
      window.removeEventListener("isc-profile-updated", syncProfile as EventListener);
    };
  }, []);

  const logoutProfile = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("isc-active-profile");
      window.dispatchEvent(new Event("isc-profile-changed"));
      window.location.href = "/";
    }
  };

  const merged = useMemo(() => {
    if (!profile) return null;
    const pref = prefs[profile.id as string] || {};
    return {
      ...profile,
      avatarSeed: pref.avatarSeed || (profile as any).avatarSeed || (profile as any).avatar_seed,
      avatarStyle: pref.avatarStyle || (profile as any).avatarStyle || (profile as any).avatar_style,
      avatarUrl: pref.avatarUrl || (profile as any).avatarUrl,
    };
  }, [profile, prefs]);

  const avatarUrl = useMemo(() => {
    if (!merged) return "";
    if (merged.avatarUrl) return merged.avatarUrl;
    const seed = merged.avatarSeed || merged.name || "member";
    const style = merged.avatarStyle === "micah" ? "micah" : "dylan";
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
  }, [merged]);

  const initials = (merged?.name || "User").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/member/eventos" className="flex items-center gap-2">
          <Image src="/logo.png" alt="ISC Producciones" width={22} height={22} className="h-6 w-auto" />
          <span className="text-sm font-medium text-zinc-200">ISC Producciones</span>
        </Link>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-white/10 bg-muted/30">
            <AvatarImage src={avatarUrl} alt={profile?.name || "Perfil"} className="object-cover" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="secondary" aria-label="Menú">
                <MenuIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild><Link href="/member/eventos">Eventos</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/member/nomina">Nómina</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/member/perfil">Perfil</Link></DropdownMenuItem>
              <DropdownMenuItem className="text-red-500 focus:text-red-500 font-bold" onClick={logoutProfile}>
              Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
