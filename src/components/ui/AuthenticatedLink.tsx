// src/components/ui/AuthenticatedLink.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// Component that only renders when user is authenticated
export function AuthenticatedLink({ 
  href, 
  children, 
  className 
}: { 
  href: string; 
  children: React.ReactNode; 
  className?: string;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Don't render anything while checking authentication
  if (isLoading) {
    return null;
  }
  
  if (!isAuthenticated) {
    return null; // Return nothing if not authenticated
  }
  
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}