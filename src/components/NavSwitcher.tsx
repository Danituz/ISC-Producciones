"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NavbarHome } from "@/components/navbar/NavbarHome";
import { NavbarMember } from "@/components/navbar/NavbarMember";
import { NavbarGuest } from "@/components/navbar/NavbarGuest";
import { createClient } from "@/lib/supabase/client";

export function NavSwitcher() {
  const pathname = usePathname();
  const supabase = createClient();
  const [hasSession, setHasSession] = useState(false);
  const [profile, setProfile] = useState<{ role?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const unsub = supabase.auth.onAuthStateChange((_e, session) => setHasSession(!!session));
    return () => unsub.data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      const raw = localStorage.getItem("isc-active-profile");
      if (!raw) {
        setProfile(null);
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        setProfile(parsed);
      } catch {
        setProfile(null);
      }
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("isc-profile-changed", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("isc-profile-changed", sync as EventListener);
    };
  }, []);

  // Admin routes use their own layout with sidebar - no navbar needed
  if (pathname.startsWith("/admin")) {
    return null;
  }

  // Home page - always show NavbarHome (landing de eventos)
  if (pathname === "/") {
    return <NavbarHome />;
  }

  // Acceso page - always show NavbarHome
  if (pathname === "/acceso") {
    return <NavbarHome />;
  }

  // Member routes
  if (pathname.startsWith("/member")) {
    return <NavbarMember />;
  }

  // Event detail page - show based on profile
  if (pathname.startsWith("/evento")) {
    if (profile?.role === "member") return <NavbarMember />;
    return <NavbarHome />;
  }

  // Default fallback
  if (profile?.role === "guest") return <NavbarGuest />;
  if (profile?.role === "member" || profile?.role === "admin") return <NavbarMember />;
  return <NavbarHome />;
}
