// src/app/layout.tsx
"use client";
import "./globals.css";
import { Inter } from "next/font/google";
import Link from "next/link";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { AuthenticatedLink } from "@/components/ui/AuthenticatedLink";
import { usePathname } from "next/navigation";

// Load the Inter font with Latin subset for optimal performance
const inter = Inter({ subsets: ["latin"] });

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
  // Add state for mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Add state for scroll position
  const [scrollPosition, setScrollPosition] = useState(0);
  // Get current pathname
  const pathname = usePathname();

  // Check if we're on the homepage
  const isHomePage = pathname === "/";

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Set up auth listener on component mount
  useEffect(() => {
    // Initial auth check
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    checkAuth();

    // Subscribe to auth changes with proper cleanup
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);

      // If session is null and we're not on an auth page, redirect to home
      if (
        !session &&
        !window.location.pathname.startsWith("/auth/") &&
        window.location.pathname !== "/"
      ) {
        window.location.href = "/";
      }
    });

    // Clean up subscription on unmount
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Track scroll position for revealing the navbar on homepage
  useEffect(() => {
    if (!isHomePage) return;

    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  // Determine navbar visibility based on scroll position and current page
  const shouldShowNavbar = !isHomePage || scrollPosition > 300;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        {/* Header with navigation - hidden initially on homepage */}
        <header
          className={`bg-white shadow-sm sticky top-0 z-10 transition-all duration-300 ${
            shouldShowNavbar
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-full pointer-events-none"
          }`}
        >
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
                    href="/bookings"
                    className="text-gray-900 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                  >
                    My Bookings
                  </AuthenticatedLink>
                  <AuthenticatedLink
                    href="/lobbies"
                    className="text-gray-900 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                  >
                    Open Lobbies
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
                  onClick={toggleMobileMenu}
                >
                  <span className="sr-only">Open main menu</span>
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile menu, show/hide based on menu state */}
            {isMobileMenuOpen && (
              <div className="md:hidden">
                <div className="pt-2 pb-3 space-y-1">
                  <Link
                    href="/facilities"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Browse Facilities
                  </Link>
                  {user && (
                    <>
                      <Link
                        href="/bookings"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        My Bookings
                      </Link>
                      <Link
                        href="/lobbies"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Open Lobbies
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
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
                  &copy; {new Date().getFullYear()} SportBooking. Ain't got no
                  rights right now, but maybe soon...
                </p>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
