"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function NavbarActions() {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setEmail(session?.user?.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  if (email) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/admin" className="text-sm text-zinc-300 hover:underline">Admin</Link>
          <Link href="/admin/resources" className="text-sm text-zinc-300 hover:underline">Recursos</Link>
          <Link href="/admin/payroll" className="text-sm text-zinc-300 hover:underline">Nomina</Link>
        </div>
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary">Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild><Link href="/admin">Admin</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/admin/resources">Recursos</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/admin/payroll">Nomina</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <span className="hidden text-xs text-zinc-400 sm:inline">{email}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => { await supabase.auth.signOut(); location.href = "/login"; }}
        >
          Salir
        </Button>
      </div>
    );
  }

  return (
    <Button asChild size="sm">
      <Link href="/login">Iniciar sesion</Link>
    </Button>
  );
}

