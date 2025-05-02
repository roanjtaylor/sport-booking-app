"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { authApi } from "@/lib/api";

export function AuthStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication state when component mounts
    const checkAuth = async () => {
      try {
        // Use the authApi instead of direct Supabase calls
        const { data: currentUser, error } = await authApi.getCurrentUser();
        if (error) throw error;
        setUser(currentUser);
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Set up an interval to periodically check for auth changes
    const authCheckInterval = setInterval(checkAuth, 5000);

    // Clean up the interval when component unmounts
    return () => {
      clearInterval(authCheckInterval);
    };
  }, [router]);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);

      // Use the authApi.signOut method instead of direct Supabase call
      const { success, error } = await authApi.signOut();

      if (error) throw error;
      if (success) {
        // Clear all storage, not just the token
        localStorage.clear();
        sessionStorage.clear();

        // Clear cookies by setting past expiration date
        document.cookie.split(";").forEach((cookie) => {
          const name = cookie.split("=")[0].trim();
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });

        // Force a complete page reload rather than client-side navigation
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    // Show nothing while loading to prevent UI flickering
    return null;
  }

  if (user) {
    // User is logged in - show user info and sign out button
    return (
      <div className="flex items-center">
        <div className="mr-4 hidden md:block">
          <p className="text-sm text-gray-700">
            <span className="font-medium">{user.email}</span>
          </p>
        </div>
        <div className="h-8 w-0.5 bg-gray-200 mx-3 hidden md:block"></div>
        <Button variant="secondary" onClick={handleSignOut} size="sm">
          Sign Out
        </Button>
      </div>
    );
  }

  // User is not logged in - show login/signup buttons
  return (
    <div className="flex items-center space-x-4">
      <Link
        href="/auth/login"
        className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
      >
        Log in
      </Link>
      <Link href="/auth/register">
        <Button size="sm">Sign up</Button>
      </Link>
    </div>
  );
}
