"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function LoginForm({ bare = false }: { bare?: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const next = useMemo(() => params.get("redirectedFrom") || "/admin", [params]);

  const [mode, setMode] = useState<"password" | "verify">("password");
  const [email, setEmail] = useState<string>(process.env.NEXT_PUBLIC_LOGIN_EMAIL || "");
  const [password, setPassword] = useState<string>(process.env.NEXT_PUBLIC_LOGIN_PASSWORD || "");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // OTP 4 digitos
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Credenciales invalidas";
      alert(message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo verificar";
      alert(message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesion con Google";
      alert(message);
      setLoading(null);
    }
  }

  const content = (
    <div className="space-y-6 pt-2">
      {mode === "password" && (
        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <div className="text-2xl font-semibold tracking-tight">Hola Primo!</div>
            <div className="text-sm text-muted-foreground">Accede al panel de administracion</div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">
              Correo electronico
            </Label>
            <Input
              id="email"
              type="email"
              className="h-10 rounded-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@isc.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm">
              Contrasena
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPass ? "text" : "password"}
                className="h-10 rounded-xl pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="******"
                autoComplete="current-password"
              />
              <button
                type="button"
                aria-label={showPass ? "Ocultar contrasena" : "Mostrar contrasena"}
                className="absolute inset-y-0 right-2 inline-flex items-center rounded-md px-2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPass((v) => !v)}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button className="h-10 w-full rounded-xl" disabled={!!loading}>
            {loading === "password" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="mr-2 h-4 w-4" />
            )}
            Acceder
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">o</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-10 w-full gap-2 rounded-xl"
            onClick={onGoogle}
            disabled={!!loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.72 1.22 9.22 3.6l6.85-6.85C35.86 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.96 6.18C12.43 13.05 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.5 24.5c0-1.55-.14-3.05-.41-4.5H24v9h12.7c-.55 2.95-2.21 5.45-4.71 7.13l7.14 5.54C43.8 37.14 46.5 31.26 46.5 24.5z"
              />
              <path
                fill="#FBBC05"
                d="M10.52 28.39c-.48-1.44-.75-2.98-.75-4.64 0-1.66.27-3.2.75-4.64l-7.96-6.18C.92 15.57 0 19.16 0 23c0 3.84.92 7.43 2.56 10.07l7.96-6.18z"
              />
              <path
                fill="#34A853"
                d="M24 47.5c6.47 0 11.86-2.13 15.82-5.79l-7.14-5.54c-2.01 1.35-4.59 2.13-8.68 2.13-6.26 0-11.57-3.55-13.48-8.5l-7.96 6.18C6.51 42.62 14.62 47.5 24 47.5z"
              />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            Continuar con Google
          </Button>
        </form>
      )}

      {mode === "verify" && (
        <form className="space-y-6" onSubmit={onVerify}>
          <div className="space-y-1">
            <div className="text-lg font-semibold tracking-tight">Ingresa el codigo de verificacion</div>
            <div className="text-sm text-muted-foreground">Este codigo es unico para tu acceso.</div>
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
                className="h-12 rounded-xl border border-input bg-background text-center font-mono text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            ))}
          </div>

          <div className="grid gap-2">
            <Button className="h-10 w-full rounded-xl" disabled={!!loading}>
              {loading === "verify" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Verificar cuenta
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10 justify-center text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMode("password")}
            >
              Regresar
            </Button>
          </div>
        </form>
      )}
    </div>
  );

  if (bare) return content;

  return (
    <Card className="relative w-full max-w-md rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
      <CardContent className="pt-2">{content}</CardContent>
    </Card>
  );
}
