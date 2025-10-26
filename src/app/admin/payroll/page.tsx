import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import PayrollClient from "@/components/admin/PayrollClient";

export default async function PayrollPage() {
  const s = createServer();
  const { data: { session } } = await s.auth.getSession();
  if (!session) redirect("/login");
  return <PayrollClient />;
}


