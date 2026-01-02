"use client";

import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NavbarHome() {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="ISC Producciones" width={24} height={24} className="h-6 w-auto" priority />
          <span className="text-sm font-medium text-foreground">ISC Producciones</span>
        </Link>
        <Button asChild variant="outline" size="sm" className="h-9">
          <Link href="/acceso">
            <LogIn className="mr-2 h-4 w-4" />
            Entrar
          </Link>
        </Button>
      </div>
    </header>
  );
}
