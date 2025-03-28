// src/app/layout.tsx
"use client";
import './globals.css';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { AuthStatus } from '@/components/auth/AuthStatus';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AuthenticatedLink } from '@/components/ui/AuthenticatedLink';
import router from 'next/router';

// Load the Inter font with Latin subset for optimal performance
const inter = Inter({ subsets: ['latin'] });

/**
 * Root layout component that wraps all pages in the application
 * Provides consistent header and footer across the site
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Track authentication state
  const [user, setUser] = useState<User | null>(null);
  // Create the Supabase client specifically for client components
  const supabase = createClientComponentClient();

  // Set up auth listener on component mount
  useEffect(() => {
    // Initial auth check
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    checkAuth();

    // Subscribe to auth changes with proper cleanup
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user || null);
    
    // If session is null and we're not on an auth page, redirect to home
    if (!session && 
        !window.location.pathname.startsWith('/auth/') && 
        window.location.pathname !== '/') {
      window.location.href = '/';
    }
  });

    // Clean up subscription on unmount
    return () => subscription.unsubscribe();
  }, [supabase.auth, router]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col`} suppressHydrationWarning>
        {/* Header with navigation */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              {/* Logo and main navigation */}
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link 
                    href={user ? "/dashboard" : "/"} 
                    className="text-primary-600 font-bold text-xl"
                  >
                    SportBooking
                  </Link>
                </div>
                <nav className="hidden md:ml-6 md:flex md:space-x-8 items-center">
                  <Link 
                    href="/facilities" 
                    className="text-gray-900 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                  >
                    Browse Facilities
                  </Link>
                  <AuthenticatedLink 
  href="/lobbies" 
  className="text-gray-900 hover:text-primary-600 px-3 py-2 text-sm font-medium"
>
  Game Lobbies
</AuthenticatedLink>
                  <AuthenticatedLink
                    href="/bookings"
                    className="text-gray-900 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                  >
                    Bookings
                  </AuthenticatedLink>
                </nav>
              </div>
              
              {/* Authentication status */}
              <div className="flex items-center">
                <AuthStatus />
              </div>
              
              {/* Mobile menu button */}
              <div className="flex items-center md:hidden">
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open main menu</span>
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-grow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="mt-8 md:mt-0 md:order-1">
                <p className="text-center text-sm text-gray-500">
                  &copy; {new Date().getFullYear()} SportBooking. Ain't got no rights right now, but maybe soon...
                </p>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}