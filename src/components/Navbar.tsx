"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu as MenuIcon, LogOut } from "lucide-react";

export function NavbarActions() {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const [profileMode, setProfileMode] = useState<boolean>(false);
  const [localProfileActive, setLocalProfileActive] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setEmail(session?.user?.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const sync = () => {
      if (typeof window === "undefined") return;
      setLocalProfileActive(!!localStorage.getItem("isc-active-profile"));
    };
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    // Si no hay sesión Supabase, usamos modo perfiles solo si hay un perfil activo guardado
    setProfileMode(!email && localProfileActive);
  }, [email, localProfileActive]);

  // En la pantalla de inicio, si no hay perfil activo ni sesión, no mostrar menú (solo logo)
  if (pathname === "/" && !email && !localProfileActive) {
    return null;
  }

  if (profileMode) {
    return (
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="secondary" aria-label="Menú">
              <MenuIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild><a href="#eventos">Eventos</a></DropdownMenuItem>
            <DropdownMenuItem asChild><a href="#nomina">Nómina</a></DropdownMenuItem>
            <DropdownMenuItem asChild><a href="#perfil">Perfil</a></DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500"
              onClick={() => { localStorage.removeItem("isc-active-profile"); location.href = "/"; }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="secondary" aria-label="Menú">
            <MenuIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild><Link href="/admin">Admin</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link href="/admin/resources">Recursos</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link href="/admin/payroll">Nomina</Link></DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-500 focus:text-red-500 font-semibold"
            onClick={async () => { await supabase.auth.signOut(); location.href = "/"; }}
          >
             Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="hidden text-xs text-zinc-400 sm:inline">{email}</span>
    </div>
  );
}
