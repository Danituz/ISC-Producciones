import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="fixed inset-0 grid place-items-center px-4">
      {/* Fondo sutil “vercel-ish” */}
      <div className="pointer-events-none fixed inset-0 -z-10 [background:
        radial-gradient(80%_60%_at_50%_-10%,hsl(var(--primary)/0.10),transparent),
        radial-gradient(60%_40%_at_80%_10%,white/3%,transparent)
      ]" />
        <LoginForm />
      </main>
  );
}
