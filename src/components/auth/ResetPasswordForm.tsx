// src/components/auth/ResetPasswordForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

/**
 * Form component for handling password reset
 * Supports two modes:
 * 1. Request a password reset link (default)
 * 2. Set a new password (when token and type parameters are present in URL)
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get auth parameters from URL
  // Supabase sends the following parameters in the reset link:
  // - type: 'recovery' for password reset
  // - token: the authentication token
  const type = searchParams?.get('type');
  const token = searchParams?.get('access_token') || searchParams?.get('token');
  const email = searchParams?.get('email');
  
  // State to track if we're in recovery mode (setting new password)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  
  // State for form inputs and UI states
  const [userEmail, setUserEmail] = useState(email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Check for recovery mode on component mount and when URL params change
  useEffect(() => {
    // If there's a token and type=recovery, we're in recovery mode
    if ((type === 'recovery' || type === 'password_reset') && token) {
      // Set session with the token
      (async () => {
        try {
          // Set the Supabase session with the recovery token
          const { error } = await supabase.auth.setSession({
            access_token: token as string,
            refresh_token: '', // We don't have a refresh token in this flow
          });
          
          if (error) {
            console.error('Error setting session:', error);
            setError('Invalid or expired reset link. Please request a new one.');
            setIsRecoveryMode(false);
          } else {
            // If session is set successfully, we can show the password reset form
            setIsRecoveryMode(true);
          }
        } catch (err) {
          console.error('Error in recovery mode setup:', err);
          setError('Something went wrong. Please try again.');
          setIsRecoveryMode(false);
        }
      })();
    } else {
      setIsRecoveryMode(false);
    }
  }, [type, token, supabase.auth]);
  
  // Handle requesting a password reset
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    if (!userEmail) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }
    
    try {
      // Use Supabase's password reset functionality
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      
      // Show success message
      setSuccess('Password reset link has been sent to your email');
    } catch (err: any) {
      console.error('Error requesting password reset:', err);
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle setting a new password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }
    
    try {
      // Update the user's password - we've already set the session with the token above
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      // Show success message
      setSuccess('Your password has been updated successfully');
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render the appropriate form based on whether we're in recovery mode
  return (
    <Card className="p-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
          {success}
        </div>
      )}
      
      {isRecoveryMode ? (
        // Reset password form (when in recovery mode)
        <form onSubmit={handleSetNewPassword} className="space-y-4">
          <p className="text-gray-700 mb-4">
            Enter your new password below:
          </p>
          
          <Input
            label="New Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          
          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Update Password'}
          </Button>
        </form>
      ) : (
        // Request reset link form (default)
        <form onSubmit={handleRequestReset} className="space-y-4">
          <p className="text-gray-700 mb-4">
            Enter your email address below, and we'll send you a link to reset your password.
          </p>
          
          <Input
            label="Email address"
            name="email"
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            required
          />
          
          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
          
          <div className="text-center text-sm text-gray-500">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </div>
        </form>
      )}
    </Card>
  );
}