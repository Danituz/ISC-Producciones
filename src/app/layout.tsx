import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { NavSwitcher } from "@/components/NavSwitcher";

export const metadata: Metadata = {
  title: "ISC Producciones",
  description: "Plataforma para Gestionar Eventos de Audio y Luces",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body
        className={cn(
          "min-h-dvh bg-background text-foreground antialiased",
          "selection:bg-zinc-800 selection:text-zinc-100"
        )}
      >
        {/* Glow sutil tipo Vercel */}
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,hsl(240_10%_20%/.35)_0%,transparent_60%)]" />
        <div className="relative min-h-dvh">
          <NavSwitcher />

          <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
        </div>

        <Toaster richColors theme="dark" />
      </body>
    </html>
  );
}
