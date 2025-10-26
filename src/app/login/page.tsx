"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  ArrowLeft,
  Chrome,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Apple,
  Twitter,
} from "lucide-react";

type Mode = "password" | "verify";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const next = useMemo(
    () => params.get("redirectedFrom") || "/admin",
    [params]
  );

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState<string>(
    process.env.NEXT_PUBLIC_LOGIN_EMAIL || ""
  );
  const [password, setPassword] = useState<string>(
    process.env.NEXT_PUBLIC_LOGIN_PASSWORD || ""
  );
  const [showPass, setShowPass] = useState<boolean>(false);
  const [loading, setLoading] = useState<string | null>(null);

  // OTP 4-digit inputs
  const r1 = useRef<HTMLInputElement>(null);
  const r2 = useRef<HTMLInputElement>(null);
  const r3 = useRef<HTMLInputElement>(null);
  const r4 = useRef<HTMLInputElement>(null);

  function codeValue() {
    const refs = [r1.current, r2.current, r3.current, r4.current];
    return refs.map((x) => x?.value || "").join("");
  }

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading("password");
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (process.env.NEXT_PUBLIC_REQUIRE_ADMIN_CODE === "1") {
        setMode("verify");
        setTimeout(() => r1.current?.focus(), 50);
      } else {
        router.replace(next);
      }
    } catch (err: any) {
      alert(err.message || "Credenciales inválidas");
    } finally {
      setLoading(null);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    try {
      const code = codeValue();
      if (code.length !== 4) {
        alert("Ingresa los 4 dígitos");
        return;
      }
      setLoading("verify");
      const r = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Código inválido");
      router.replace(next);
    } catch (err: any) {
      alert(err.message || "No se pudo verificar");
    } finally {
      setLoading(null);
    }
  }

  async function signInWithGoogle() {
    try {
      setLoading("google");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(
            next
          )}`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      alert(err.message || "Error al iniciar sesión con Google");
      setLoading(null);
    }
  }

  function onOtpChange(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 1);
    e.target.value = v;
    const refs = [r1.current, r2.current, r3.current, r4.current];
    if (v && refs[idx + 1]) refs[idx + 1]!.focus();
  }
  function onOtpKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (
      e.key === "Backspace" &&
      !(e.currentTarget as HTMLInputElement).value
    ) {
      const refs = [r1.current, r2.current, r3.current, r4.current];
      if (refs[idx - 1]) refs[idx - 1]!.focus();
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1000px_600px_at_50%_-10%,#0b0b0b,transparent)]">
      {/* Fondo con grid sutil y brillos */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(16,16,16,.9), rgba(0,0,0,.95)), radial-gradient(600px 300px at 50% -10%, rgba(80,80,80,.15), transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(#ffffff0f_1px,transparent_1px),linear-gradient(90deg,#ffffff0f_1px,transparent_1px)] bg-[size:48px_48px]"
      />

      {/* Contenido */}
      <div className="relative z-10 mx-auto w-full max-w-md px-4 py-10">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
          >
            <ArrowLeft className="size-5" /> Volver
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset,0_30px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="ISC Producciones"
              width={40}
              height={40}
              className="rounded"
            />
            <div>
              <div className="text-xl font-semibold tracking-tight">
                Bienvenido de nuevo
              </div>
              <div className="text-sm text-zinc-400">
                Ingresa tus credenciales para continuar
              </div>
            </div>
          </div>

          {params.get("unauthorized") === "1" ? (
            <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              No autorizado para acceder a esta sección.
            </div>
          ) : null}

          {/* ---------- PASSWORD MODE ---------- */}
          {mode === "password" && (
            <form onSubmit={signInWithPassword} className="space-y-6">
              {/* Social row como en el mock (Apple/Twitter solo visuales) */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 py-2.5 text-sm text-zinc-300 opacity-60"
                  title="Próximamente"
                >
                  <Apple className="size-5" />
                </button>

                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={!!loading}
                  className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 py-2.5 text-sm text-zinc-200 transition hover:bg-white/10"
                >
                  {loading === "google" ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Chrome className="size-5" />
                  )}
                </button>

                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 py-2.5 text-sm text-zinc-300 opacity-60"
                  title="Próximamente"
                >
                  <Twitter className="size-5" />
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-transparent px-2 text-xs uppercase tracking-widest text-zinc-400">
                    o
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-400">Email Address</label>
                  <input
                    type="email"
                    className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@isc.com"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400">Password</label>
                  <div className="relative mt-1">
                    <input
                      type={showPass ? "text" : "password"}
                      className="h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 pr-10 text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute inset-y-0 right-2 inline-flex items-center text-zinc-400 transition hover:text-zinc-200"
                      aria-label={showPass ? "Ocultar" : "Mostrar"}
                    >
                      {showPass ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>

                  <div className="mt-2 text-right">
                    <span className="cursor-default text-xs text-zinc-500 underline-offset-4 hover:underline">
                      Forgot Password?
                    </span>
                  </div>
                </div>
              </div>

              <button
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-white text-black transition hover:bg-zinc-100 disabled:opacity-70"
                disabled={!!loading}
              >
                {loading === "password" ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 size-4" />
                )}
                Sign in
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ---------- VERIFY MODE (MODAL LOOK) ---------- */}
      {mode === "verify" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold tracking-tight">
                Enter Verification Code
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Te enviamos un código a tu correo. Ingresa los 4 dígitos para
                continuar.
              </p>
            </div>

            <form onSubmit={verifyCode} className="space-y-6">
              <div className="grid grid-cols-4 gap-3">
                {[r1, r2, r3, r4].map((ref, i) => (
                  <input
                    key={i}
                    ref={ref}
                    inputMode="numeric"
                    maxLength={1}
                    onChange={(e) => onOtpChange(i, e)}
                    onKeyDown={(e) => onOtpKeyDown(i, e)}
                    className="h-16 rounded-xl border border-white/10 bg-black/40 text-center text-3xl text-zinc-100 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  />
                ))}
              </div>

              <button
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-500 disabled:opacity-70"
                disabled={!!loading}
              >
                {loading === "verify" ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 size-4" />
                )}
                Verify your account
              </button>

              <div className="text-center text-xs text-zinc-400">
                ¿No recibiste el código?{" "}
                <span className="cursor-default underline underline-offset-4">
                  Click to resend
                </span>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
