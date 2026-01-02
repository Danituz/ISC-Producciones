"use client";

import { useMemo } from "react";
import useSWR from "swr";
import type { EventItem } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function parseTimeToMinutes(timeStr: string | undefined): number {
  if (!timeStr) return 0;

  // Si es formato HH:mm (24h)
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  }

  // Si es formato "12:00 PM" o "12:00 PM – 2:00 PM"
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const period = match[3]?.toUpperCase();

    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;

    return h * 60 + m;
  }

  return 0;
}

function sortEventsByDateTime(events: EventItem[]): EventItem[] {
  return [...events].sort((a, b) => {
    // Ordenar por fecha primero
    const dateA = a.date || "";
    const dateB = b.date || "";
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    // Luego por hora de inicio
    const timeA = parseTimeToMinutes(a.start_time || a.time);
    const timeB = parseTimeToMinutes(b.start_time || b.time);
    return timeA - timeB;
  });
}

export function useEvents(period: string) {
  const { data, error, isLoading, mutate } = useSWR<{ data: EventItem[] }>(
    `/api/public-events?period=${period}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const sortedEvents = useMemo(() => {
    return sortEventsByDateTime(data?.data || []);
  }, [data?.data]);

  return {
    events: sortedEvents,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function prefetchAdjacentPeriods(currentPeriod: string) {
  const [year, month] = currentPeriod.split("-").map(Number);

  const prevMonth = new Date(year, month - 2, 1);
  const nextMonth = new Date(year, month, 1);

  const prev = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
  const next = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;

  fetch(`/api/public-events?period=${prev}`);
  fetch(`/api/public-events?period=${next}`);
}

export function getCurrentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
