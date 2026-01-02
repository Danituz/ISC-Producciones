import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = createServer();
  const { data: { session } } = await s.auth.getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-dvh">
      <AdminSidebar />
      {/* Main content - offset for sidebar on desktop, offset for header on mobile */}
      <main className="pt-14 md:pl-56 md:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
