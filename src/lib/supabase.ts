import { createClient } from "@supabase/supabase-js";

// Retrieve environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create a single supabase client for browser-side usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
