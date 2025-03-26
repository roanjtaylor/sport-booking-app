// src/components/auth/LoginForm.tsx
"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';

/**
 * Login form component for user authentication
 */
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Attempt to sign in with provided credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data || !data.user) {
        throw new Error('Failed to sign in');
      }
      
      // Redirect to dashboard or the redirect URL on successful login
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">Log In</h1>
      
      {/* Display error message if there is one */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <Input
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link href="/auth/reset-password" className="text-primary-600 hover:text-primary-500">
              Forgot your password?
            </Link>
          </div>
        </div>
        
        <Button type="submit" fullWidth disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
        
        <div className="text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-primary-600 hover:text-primary-500">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}