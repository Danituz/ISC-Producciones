import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import OrganizationsClient from "@/components/admin/OrganizationsClient";

export default async function OrganizationsPage() {
  const s = createServer();
  const { data: { session } } = await s.auth.getSession();
  if (!session) redirect("/login");

  return <OrganizationsClient />;
}
