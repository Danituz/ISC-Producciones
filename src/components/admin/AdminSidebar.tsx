"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Menu,
  Calendar,
  Building2,
  FolderOpen,
  Wallet,
  Settings,
  LogOut,
  X,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Eventos", icon: Calendar },
  { href: "/admin/organizations", label: "Organizaciones", icon: Building2 },
  { href: "/admin/resources", label: "Recursos", icon: FolderOpen },
  { href: "/admin/payroll", label: "Nómina", icon: Wallet },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
];

function NavLink({ href, label, icon: Icon, active, onClick }: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-foreground/10 text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border/40 px-4">
        <Image src="/logo.png" alt="ISC" width={28} height={28} className="h-7 w-auto" />
        <span className="font-semibold">ISC Producciones</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 my-12 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname === item.href}
            onClick={onNavigate}
          />
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-border/40 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-muted hover:text-destructive"
        >
          <LogOut className="size-5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile: Hamburger menu */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border/40 bg-background/95 px-4 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="ISC" width={24} height={24} className="h-6 w-auto" />
          <span className="font-semibold text-sm">ISC Producciones</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r border-border/40 bg-background md:block">
        <SidebarContent />
      </aside>
    </>
  );
}
