"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, KeyRound, Eye, EyeOff, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const next = useMemo(() => params.get("redirectedFrom") || "/admin", [params]);

  const [mode, setMode] = useState<"password" | "verify">("password");
  const [email, setEmail] = useState<string>(process.env.NEXT_PUBLIC_LOGIN_EMAIL || "");
  const [password, setPassword] = useState<string>(process.env.NEXT_PUBLIC_LOGIN_PASSWORD || "");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // OTP 4 dígitos
  const r1 = useRef<HTMLInputElement>(null);
  const r2 = useRef<HTMLInputElement>(null);
  const r3 = useRef<HTMLInputElement>(null);
  const r4 = useRef<HTMLInputElement>(null);
  const refs = [r1, r2, r3, r4];

  function readCode() {
    return refs.map((r) => r.current?.value || "").join("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading("password");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (process.env.NEXT_PUBLIC_REQUIRE_ADMIN_CODE === "1") {
        setMode("verify");
        setTimeout(() => r1.current?.focus(), 50);
      } else {
        router.replace(next);
      }
    } catch (err: any) {
      alert(err.message || "Credenciales invalidas");
    } finally {
      setLoading(null);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = readCode();
    if (code.length !== 4) return alert("Ingresa los 4 digitos");
    try {
      setLoading("verify");
      const r = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Codigo invalido");
      router.replace(next);
    } catch (err: any) {
      alert(err.message || "No se pudo verificar");
    } finally {
      setLoading(null);
    }
  }

  async function onGoogle() {
    try {
      setLoading("google");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) throw error;
    } catch (err: any) {
      alert(err.message || "Error al iniciar sesion con Google");
      setLoading(null);
    }
  }

  return (
    <Card
      className={[
        "relative w-full max-w-md",
        "rounded-2xl border border-white/10 bg-background/60 backdrop-blur",
        "shadow-[0_0_0_1px_hsl(var(--border))] shadow-black/0",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />


      <CardContent className="space-y-6 pt-2">
        
        {mode === "password" && (
          <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <div className="text-2xl font-semibold tracking-tight">Bienvenido</div>
            <div className="text-sm text-muted-foreground">Accede al panel de administracion</div>
          </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Correo</Label>
              <Input
                id="email"
                type="email"
                className="h-11 rounded-xl border-white/15 bg-transparent placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@isc.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Contrasena</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  className="h-11 rounded-xl border-white/15 bg-transparent pr-10 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  aria-label={showPass ? "Ocultar contrasena" : "Mostrar contrasena"}
                  className="absolute inset-y-0 right-2 inline-flex items-center rounded-md px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPass((v) => !v)}
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button className="h-11 w-full rounded-xl text-[0.95rem]" disabled={!!loading}>
              {loading === "password" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <KeyRound className="mr-2 size-4" />}
              Acceder
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background/80 px-2 text-muted-foreground">o</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full gap-2 rounded-xl border-white/15 bg-transparent hover:bg-white/5"
              onClick={onGoogle}
              disabled={!!loading}
            >
              {/* Google icon (inline) */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="size-5"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 31.9 29.2 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 12.3 3 3 12.3 3 24s9.3 21 21 21 21-9.3 21-21c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 16.2 3 9.5 7.4 6.3 14.7z"/><path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.4l-6.3-5.2C29.1 35.5 26.7 36 24 36c-5.1 0-9.4-3.1-11.3-7.5l-6.5 5C9.5 42.6 16.2 45 24 45z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.3-3.5 5.2-6.3 6.5l6.3 5.2C37.6 41 42 34.8 42 27c0-2.2-.2-4.4-.4-6.5z"/></svg>
              Continuar con Google
            </Button>
          </form>
        )}

        {mode === "verify" && (
          <form className="space-y-6" onSubmit={onVerify}>
            <div className="space-y-1">
              <div className="text-lg font-semibold tracking-tight">Ingresa el codigo de verificacion</div>
              <div className="text-sm text-muted-foreground">Enviamos un codigo a tu correo.</div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[r1, r2, r3, r4].map((ref, i) => (
                <input
                  key={i}
                  ref={ref}
                  inputMode="numeric"
                  maxLength={1}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 1);
                    e.target.value = v;
                    if (v && i < 3) (refs[i + 1].current as HTMLInputElement)?.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !(e.currentTarget as HTMLInputElement).value && i > 0)
                      (refs[i - 1].current as HTMLInputElement)?.focus();
                  }}
                  className="h-14 rounded-xl border border-white/15 bg-transparent text-center font-mono text-2xl tracking-widest focus-visible:ring-2 focus-visible:ring-primary/40"
                />
              ))}
            </div>

            <div className="grid gap-2">
              <Button className="h-11 w-full rounded-xl text-[0.95rem]" disabled={!!loading}>
                {loading === "verify" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ShieldCheck className="mr-2 size-4" />}
                Verificar cuenta
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-10 justify-center text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMode("password")}
              >
                <ArrowLeft className="mr-1.5 size-4" />
                Volver
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
