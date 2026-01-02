import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

// API pública para obtener la tarifa de nómina
// Los miembros necesitan ver la tarifa para calcular su pago estimado

export async function GET() {
  const cookieStore = await cookies();
  const s = createRouteHandlerClient({ cookies: () => cookieStore });

  // Obtener la tarifa del primer admin (asumiendo un solo admin por ahora)
  // En un sistema multi-tenant, esto debería basarse en la organización del miembro
  const { data } = await s
    .from("settings")
    .select("payroll_rate")
    .limit(1)
    .single();

  return NextResponse.json({
    data: {
      payroll_rate: data?.payroll_rate ?? 800,
    },
  });
}
