"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MemberNominaView } from "@/components/member/MemberNominaView";

export default function MemberNominaPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("isc-active-profile");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("isc-active-profile");
      if (!raw) {
        router.replace("/");
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed.role !== "member") {
        router.replace("/");
        return;
      }
      setProfile(parsed);
    } catch {
      router.replace("/");
    }
  }, [router]);

  if (!profile) return null;

  return <MemberNominaView profile={profile} />;
}
