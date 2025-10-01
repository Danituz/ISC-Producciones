import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import EditorClient from "./EditorClient";

export default async function CroquisEditorPage() {
  const s = createServer();
  const { data: { session } } = await s.auth.getSession();
  if (!session) redirect("/login");

  return (
    <div className="p-3">
      <EditorClient />
    </div>
  );
}
