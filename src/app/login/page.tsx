"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {Mail, Loader2, LogIn, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"email" | "github" | "google" | null>(null);

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading("email");
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) throw error;
      toast.success("Te enviamos un enlace a tu correo ✉️");
    } catch (err: any) {
      toast.error(err.message || "No se pudo enviar el enlace");
    } finally {
      setLoading(null);
    }
  }

  async function signInWith(provider: "github" | "google") {
    try {
      setLoading(provider);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Error al iniciar sesión");
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-2 text-lg text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-6" /> Volver
        </Link>
      </div>

      <div className="card-like p-5 space-y-5">
        <div>
          <h1 className="text-4xl font-semibold flex items-center gap-2">
            <LogIn className="size-8" /> Iniciar sesión
          </h1>
          <p className="text-md text-muted-foreground">
            Usa enlace por correo
          </p>
        </div>

        <form className="space-y-3" onSubmit={signInWithEmail}>
          <div>
            <Label className="text-lg">Correo electrónico</Label>
            <Input
              type="email"
              className="h-11 text-lg mt-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tucorreo@ejemplo.com"
            />
          </div>
          <Button className="w-full h-11 text-base" disabled={loading !== null}>
            {loading === "email" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Mail className="mr-2 size-6" />}
            Enviar enlace mágico
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
         
        </div>

        
      </div>
    </div>
  );
}
