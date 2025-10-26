import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="fixed inset-0 grid place-items-center px-4">
      <div className="pointer-events-none fixed inset-0 -z-10 [background:
        radial-gradient(80%_60%_at_50%_-10%,hsl(var(--primary)/0.10),transparent),
        radial-gradient(60%_40%_at_80%_10%,white/3%,transparent)
      ]" />
      <Suspense fallback={<div className="w-full max-w-sm h-48" />}> 
        <LoginForm />
      </Suspense>
    </main>
  );
}

