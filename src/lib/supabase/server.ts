import { cookies } from "next/headers";
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from "@supabase/auth-helpers-nextjs";

// Para Server Components / Pages / Layouts
export const createServer = () =>
  createServerComponentClient({ cookies });

// Para Route Handlers (app router)
// IMPORTANTE: pasar la función `cookies`, no el resultado
export const createRoute = () =>
  createRouteHandlerClient({ cookies });
