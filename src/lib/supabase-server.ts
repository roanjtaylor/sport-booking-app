// src/lib/supabase-server.ts
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { cache } from "react";

export const createServerSupabaseClient = cache(async () => {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
});
