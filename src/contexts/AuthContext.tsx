// src/contexts/AuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { authApi, usersApi } from "@/lib/api";

// Define the context value type
interface AuthContextType {
  user: User | null;
  userRole: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  isLoading: true,
  signOut: async () => {},
  checkAuth: async () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps the app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState(0);

  // Check authentication status
  const checkAuth = async () => {
    // Don't check if we've checked in the last 2 seconds (debounce)
    const now = Date.now();
    if (now - lastCheck < 2000) {
      return;
    }

    setLastCheck(now);

    try {
      const { data: currentUser, error } = await authApi.getCurrentUser();

      // Only update user state if it has changed to prevent unnecessary re-renders
      if (
        (!currentUser && user) ||
        (currentUser && !user) ||
        (currentUser && user && currentUser.id !== user.id)
      ) {
        setUser(currentUser);

        // Get user role if logged in
        if (currentUser) {
          const { role } = await usersApi.getUserRole(currentUser.id);
          setUserRole(role);
        } else {
          setUserRole(null);
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out the user
  const signOut = async () => {
    try {
      setIsLoading(true);
      const { success, error } = await authApi.signOut();

      if (success) {
        // Clear cache and local storage
        localStorage.removeItem("supabase.auth.token");
        sessionStorage.clear();

        // Update state
        setUser(null);
        setUserRole(null);
      }

      if (error) {
        console.error("Sign out error:", error);
      }
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check auth on initial load
  useEffect(() => {
    checkAuth();

    // Set up an interval that's less frequent (every 10 seconds)
    const interval = setInterval(checkAuth, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({
      user,
      userRole,
      isLoading,
      signOut,
      checkAuth,
    }),
    [user, userRole, isLoading]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
