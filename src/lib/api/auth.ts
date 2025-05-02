// src/lib/api/auth.ts
import { supabase } from "@/lib/supabase";
import { UserRole } from "@/types/user";

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Sign in error:", error);
    return { data: null, error };
  }
}

/**
 * Sign up a new user
 */
export async function signUp(
  email: string,
  password: string,
  name: string,
  role: UserRole
) {
  try {
    // Step 1: Register the user with Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });

    if (signUpError) throw signUpError;
    if (!data?.user) throw new Error("Registration failed");

    // Step 2: Create profile record
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      email,
      name,
      role,
    });

    if (profileError)
      throw new Error(`Failed to create profile: ${profileError.message}`);

    return { data, error: null };
  } catch (error) {
    console.error("Sign up error:", error);
    return { data: null, error };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("Sign out error:", error);
    return { success: false, error };
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { data: data.user, error: null };
  } catch (error) {
    console.error("Get current user error:", error);
    return { data: null, error };
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { data: data.session, error: null };
  } catch (error) {
    console.error("Get session error:", error);
    return { data: null, error };
  }
}

/**
 * Request password reset
 */
export async function resetPasswordRequest(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("Password reset request error:", error);
    return { success: false, error };
  }
}

/**
 * Update user password
 */
export async function updatePassword(password: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Update password error:", error);
    return { data: null, error };
  }
}

/**
 * Update user email
 */
export async function updateEmail(email: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({ email });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Update email error:", error);
    return { data: null, error };
  }
}
