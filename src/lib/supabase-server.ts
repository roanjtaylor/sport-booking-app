// src/lib/supabase-server.ts
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase"; // You can create this later

export async function createServerSupabaseClient() {
  return createServerComponentClient<Database>({ cookies });
}
