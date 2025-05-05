"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function AuthStatus() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();

    // Force a complete page reload rather than client-side navigation
    window.location.href = "/";
  };

  if (isLoading) {
    // Show a minimal loading state to prevent UI flickering
    return (
      <div className="flex items-center">
        <div className="w-20 h-6 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
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
