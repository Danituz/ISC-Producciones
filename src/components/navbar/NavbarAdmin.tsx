"use client";

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu as MenuIcon } from "lucide-react";

export function NavbarAdmin() {
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/logo.png" alt="ISC Producciones" width={22} height={22} className="h-6 w-auto" />
          <span className="text-sm font-medium text-zinc-200">ISC Producciones</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="secondary" aria-label="Menú">
              <MenuIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild><Link href="/admin">Eventos</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/admin/organizations">Organizaciones</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/admin/resources">Recursos</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/admin/payroll">Nómina</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/admin/settings">Configuración</Link></DropdownMenuItem>
            <DropdownMenuItem className="text-red-500 focus:text-red-500 font-bold" onClick={handleLogout}>
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
