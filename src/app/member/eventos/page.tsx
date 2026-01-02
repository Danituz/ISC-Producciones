"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MemberEventsView } from "@/components/member/MemberEventsView";

export default function MemberEventosPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

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

  return <MemberEventsView profile={profile} />;
}
