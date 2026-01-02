"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MemberProfileView } from "@/components/member/MemberProfileView";

type AvatarStyle = "dylan" | "micah";
type Profile = {
  id: string;
  name: string;
  sourceName?: string;
  role?: string;
  avatarSeed?: string;
  avatarStyle?: AvatarStyle;
};
type ProfilePrefs = {
  displayName?: string;
  avatarSeed?: string;
  avatarStyle?: AvatarStyle;
  code?: string;
};

export default function MemberPerfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prefs, setPrefs] = useState<Record<string, ProfilePrefs>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("isc-active-profile");
      if (!raw) {
        router.replace("/");
        return;
      }
      const parsed = JSON.parse(raw) as Profile;
      if (parsed.role !== "member") {
        router.replace("/");
        return;
      }
      setProfile(parsed);
      const prefRaw = localStorage.getItem("isc-profile-prefs");
      if (prefRaw) setPrefs(JSON.parse(prefRaw));
    } catch {
      router.replace("/");
    }
  }, [router]);

  const handlePrefsChange = (id: string, partial: Partial<ProfilePrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), ...partial } };
      try {
        localStorage.setItem("isc-profile-prefs", JSON.stringify(next));
        window.dispatchEvent(new Event("isc-profile-prefs-changed"));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  if (!profile) return null;

  return <MemberProfileView profile={profile as any} prefs={prefs} onPrefsChange={handlePrefsChange} />;
}
