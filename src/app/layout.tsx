import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { NavbarActions } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "ISC Productions",
  description: "Agenda de eventos de Audio y Luces",
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
          <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
              <a className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">ISC Productions</span>
              </a>
              <NavbarActions />
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
        </div>

        <Toaster richColors theme="dark" />
      </body>
    </html>
  );
}
