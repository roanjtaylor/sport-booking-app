"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { User, AuthChangeEvent } from '@supabase/supabase-js';

export function AuthStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Check authentication state when component mounts
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(session?.user || null);
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
      
      // Set up listener for auth state changes
      const {
        data: { subscription: authListener },
      } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session) => {
        setUser(session?.user || null);
      });
      
      // Clean up the listener when component unmounts
      return () => {
        authListener.unsubscribe();
      };
    };
    
    checkAuth();
  }, [supabase.auth, router]);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      
      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear any persistent storage
      localStorage.removeItem('supabase.auth.token');
      
      // Force a hard refresh to clear any stale state
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
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
        <Button 
          variant="secondary"
          onClick={handleSignOut}
          size="sm"
        >
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
        <Button size="sm">
          Sign up
        </Button>
      </Link>
    </div>
  );
}