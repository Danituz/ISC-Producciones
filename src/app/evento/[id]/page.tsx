import { notFound } from "next/navigation";
import { headers } from "next/headers"; // 👈 aquí está la corrección
import EventDetail from "@/components/EventDetail";
import type { EventItem } from "@/lib/types";

export const dynamic = "force-dynamic";

async function fetchEvent(id: string) {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) throw new Error("Host header missing");

  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/public-events/${id}`, { cache: "no-store" });
  if (!res.ok) return null;

  const json = (await res.json()) as { data?: EventItem };
  return json.data ?? null;
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const data = await fetchEvent(params.id);
  if (!data) notFound();
  return <EventDetail data={data} />;
}
