// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase"; // Import this once you generate it

// Retrieve environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Validate that environment variables are properly set
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase URL or anonymous key is missing. Make sure to set the NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
  );
}

// Create a Supabase client for server components
export const createServerSupabaseClient = async () => {
  // Dynamic import to avoid issues during build time
  const { cookies } = await import("next/headers");
  const { createServerComponentClient } = await import(
    "@supabase/auth-helpers-nextjs"
  );

  return createServerComponentClient<Database>({
    cookies,
  });
};

// Create a single supabase client for the entire application (client components)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to wait for a specified time
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Functions for authentication with rate limit handling
 */
export const auth = {
  // Sign up a new user with retry logic
  async signUp(
    email: string,
    password: string,
    retryCount = 0
  ): Promise<ReturnType<typeof supabase.auth.signUp>> {
    try {
      const response = await supabase.auth.signUp({ email, password });
      return response;
    } catch (error: any) {
      console.error("Sign up error:", error.message);

      // If rate limited and we haven't retried too many times
      if (error.message?.includes("rate limit") && retryCount < 3) {
        console.log(`Rate limited, retrying in ${2 ** retryCount} seconds...`);
        await delay(2 ** retryCount * 1000); // Exponential backoff
        return this.signUp(email, password, retryCount + 1);
      }

      throw error;
    }
  },

  // Sign in an existing user with retry logic
  async signIn(
    email: string,
    password: string,
    retryCount = 0
  ): Promise<ReturnType<typeof supabase.auth.signInWithPassword>> {
    try {
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return response;
    } catch (error: any) {
      console.error("Sign in error:", error.message);

      // If rate limited and we haven't retried too many times
      if (error.message?.includes("rate limit") && retryCount < 3) {
        console.log(`Rate limited, retrying in ${2 ** retryCount} seconds...`);
        await delay(2 ** retryCount * 1000); // Exponential backoff
        return this.signIn(email, password, retryCount + 1);
      }

      throw error;
    }
  },

  // Sign out the current user
  async signOut() {
    try {
      return await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  },

  // Get the current session with retry for rate limiting
  async getSession(
    retryCount = 0
  ): Promise<ReturnType<typeof supabase.auth.getSession>> {
    try {
      return await supabase.auth.getSession();
    } catch (error: any) {
      console.error("Get session error:", error.message);

      // If rate limited and we haven't retried too many times
      if (error.message?.includes("rate limit") && retryCount < 3) {
        console.log(`Rate limited, retrying in ${2 ** retryCount} seconds...`);
        await delay(2 ** retryCount * 1000); // Exponential backoff
        return this.getSession(retryCount + 1);
      }

      throw error;
    }
  },

  // Get the current user with retry for rate limiting
  async getUser(
    retryCount = 0
  ): Promise<ReturnType<typeof supabase.auth.getUser>> {
    try {
      // Return the entire response object to maintain correct typing
      return await supabase.auth.getUser();
    } catch (error: any) {
      console.error("Get user error:", error.message);

      // If rate limited and we haven't retried too many times
      if (error.message?.includes("rate limit") && retryCount < 3) {
        console.log(`Rate limited, retrying in ${2 ** retryCount} seconds...`);
        await delay(2 ** retryCount * 1000); // Exponential backoff
        return this.getUser(retryCount + 1);
      }

      throw error;
    }
  },
};
