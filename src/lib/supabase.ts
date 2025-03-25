// src/lib/supabase.ts
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase"; // You can create this later

// Create a client for use in client components
export const supabase = createClientComponentClient<Database>();

// Functions for authentication
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
