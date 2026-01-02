"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Menu as MenuIcon } from "lucide-react";

export function NavbarGuest() {
  const logoutProfile = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("isc-active-profile");
      window.location.href = "/";
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="secondary" aria-label="Menú">
              <MenuIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild><a href="#eventos">Eventos</a></DropdownMenuItem>
            <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={logoutProfile}>
              <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
