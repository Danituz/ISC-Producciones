import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import AdminClient from "@/components/admin/AdminClient";

export default async function AdminPage() {
  const s = createServer();
  const { data: { session } } = await s.auth.getSession();
  if (!session) redirect("/login");

  const email = session.user.email ?? "";
  return <AdminClient userEmail={email} />;
}
