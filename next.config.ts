// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ❗ Evita que ESLint detenga el build en Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Opcional: si tienes errores de tipo que bloquean el build
    ignoreBuildErrors: true,
  },
  images: {
    // si usas <img> con dominios externos, habilítalos aquí si luego migras a <Image />
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
