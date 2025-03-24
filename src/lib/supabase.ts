// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Retrieve environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Validate that environment variables are properly set
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase URL or anonymous key is missing. Make sure to set the NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
  );
}

// Create a single supabase client for the entire application
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper function to create a server-side Supabase client
 * This is needed for server components in Next.js App Router
 */
export async function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storage: {
        getItem: (key) => {
          const value = cookieStore.get(key)?.value;
          return value ?? null;
        },
        setItem: () => {},
        removeItem: () => {},
      },
    },
  });
}

/**
 * Functions for authentication
 */
export const auth = {
  // Sign up a new user
  async signUp(email: string, password: string) {
    return await supabase.auth.signUp({ email, password });
  },

  // Sign in an existing user
  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  // Sign out the current user
  async signOut() {
    return await supabase.auth.signOut();
  },

  // Get the current session
  async getSession() {
    return await supabase.auth.getSession();
  },

  // Get the current user
  async getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },
};
