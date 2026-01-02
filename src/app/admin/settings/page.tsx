import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import SettingsClient from "@/components/admin/SettingsClient";

export default async function SettingsPage() {
  const s = createServer();
  const { data: { session } } = await s.auth.getSession();
  if (!session) redirect("/login");

  return <SettingsClient />;
}
