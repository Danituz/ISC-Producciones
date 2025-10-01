"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
// Si no tienes tipos generados, omite <Database>
export const createClient = () => createClientComponentClient();
