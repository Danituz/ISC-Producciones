"use client";

import useSWR from "swr";

const CACHE_KEY = "isc-payroll-rate";
const CACHE_TTL = 3600000; // 1 hora

function getLocalCache(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, rate } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL) return rate;
  } catch {
    // ignore
  }
  return null;
}

function setLocalCache(rate: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), rate }));
  } catch {
    // ignore
  }
}

export function usePayrollRate() {
  const { data } = useSWR(
    "/api/public-settings",
    async (url) => {
      const cached = getLocalCache();
      if (cached !== null) return { payroll_rate: cached };

      const res = await fetch(url);
      const j = await res.json();
      const rate = j.data?.payroll_rate || 800;

      setLocalCache(rate);
      return { payroll_rate: rate };
    },
    { revalidateOnFocus: false }
  );

  return data?.payroll_rate || 800;
}
