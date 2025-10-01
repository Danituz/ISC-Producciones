import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import ResourcesClient from "@/components/admin/ResourcesClient";

export default async function ResourcesPage() {
  const s = createServer();
  const { data: { session } } = await s.auth.getSession();
  if (!session) redirect("/login");
  return <ResourcesClient />;
}
