"use client";

import dynamic from "next/dynamic";

// Hacemos el import dinámico aquí (permitido en Client Components)
const CroquisEditor = dynamic(() => import("@/components/CroquisEditor"), {
  ssr: false,
});

export default function EditorClient() {
  return <CroquisEditor />;
}
