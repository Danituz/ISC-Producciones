"use client";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const supabase = createClient();
  return (
    <Button
      variant="outline"
      className="h-9 gap-2"
      onClick={async () => {
        await supabase.auth.signOut();
        location.href = "/login";
      }}
    >
      <LogOut className="size-4" /> Salir
    </Button>
  );
}
