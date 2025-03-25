// src/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  name: string | null;
  role: 'user' | 'facility_owner';
  email: string;
}

interface DashboardStats {
  upcomingBookings: number;
  totalBookings: number;
  facilities: number;
}

/**
 * Dashboard page for users to see an overview of their account
 * Displays different views based on user role (regular user or facility owner)
 */
export default function DashboardPage() {
  // State management for user data, loading states, and statistics
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    upcomingBookings: 0,
    totalBookings: 0,
    facilities: 0,
  });

  useEffect(() => {
    // Fetch user data and statistics on component mount
    async function fetchUserData() {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;
        if (!authUser) {
          setError('You must be logged in to view your dashboard');
          return;
        }
        
        setUser(authUser);

        // Fetch user profile with role information
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (profileError) throw profileError;
        if (!profileData) throw new Error('Profile not found');
        
        setProfile(profileData);
        
        // Calculate statistics based on user role
        const today = new Date().toISOString().split('T')[0];
        
        if (profileData.role === 'facility_owner') {
          await fetchFacilityOwnerStats(authUser.id, today);
        } else {
          await fetchUserStats(authUser.id, today);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, []);

  /**
   * Fetches statistics for facility owners
   * Includes: total facilities, total bookings, and upcoming bookings
   */
  const fetchFacilityOwnerStats = async (userId: string, today: string) => {
    try {
      // Get facilities owned by the user
      const { data: facilities, error: facilitiesError } = await supabase
        .from('facilities')
        .select('id')
        .eq('owner_id', userId); // Changed from ownerId to owner_id
  
      if (facilitiesError) throw facilitiesError;
      
      if (!facilities || facilities.length === 0) {
        setStats({ facilities: 0, totalBookings: 0, upcomingBookings: 0 });
        return;
      }
  
      const facilityIds = facilities.map(f => f.id);
      
      // Fetch all statistics in parallel
      const [facilitiesCount, totalBookings, upcomingBookings] = await Promise.all([
        supabase.from('facilities').select('id', { count: 'exact' }).eq('owner_id', userId), // Changed from ownerId to owner_id
        supabase.from('bookings').select('id', { count: 'exact' }).in('facility_id', facilityIds), // Changed from facilityId to facility_id
        supabase.from('bookings')
          .select('id', { count: 'exact' })
          .in('facility_id', facilityIds) // Changed from facilityId to facility_id
          .gte('date', today)
          .eq('status', 'confirmed')
      ]);
  
      setStats({
        facilities: facilitiesCount.count ?? 0,
        totalBookings: totalBookings.count ?? 0,
        upcomingBookings: upcomingBookings.count ?? 0,
      });
    } catch (error) {
      console.error('Error fetching facility owner stats:', error);
      // Set default values in case of error
      setStats({ facilities: 0, totalBookings: 0, upcomingBookings: 0 });
    }
  };

  /**
   * Fetches statistics for regular users
   * Includes: total bookings and upcoming bookings
   */
  const fetchUserStats = async (userId: string, today: string) => {
    try {
      const [totalBookings, upcomingBookings] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact' }).eq('user_id', userId), // Changed from userId to user_id
        supabase.from('bookings')
          .select('id', { count: 'exact' })
          .eq('user_id', userId) // Changed from userId to user_id
          .gte('date', today)
          .not('status', 'eq', 'cancelled')
      ]);
  
      setStats({
        facilities: 0,
        totalBookings: totalBookings.count ?? 0,
        upcomingBookings: upcomingBookings.count ?? 0,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Set default values in case of error
      setStats({ facilities: 0, totalBookings: 0, upcomingBookings: 0 });
    }
  };

  // Handle user sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // Loading state UI
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="py-12">
        <Card className="p-6 max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Main dashboard UI
  return (
    <div>
      {/* Header section */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {profile?.name || user?.email}
          </p>
        </div>
      </div>
      
      {/* Statistics cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Upcoming Bookings Card */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-2">Upcoming Bookings</h3>
          <p className="text-3xl font-bold text-primary-600">{stats.upcomingBookings}</p>
          <div className="mt-4">
            <Link href="/bookings">
              <Button variant="outline" size="sm">View Bookings</Button>
            </Link>
          </div>
        </Card>
        
        {/* Total Bookings Card */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-2">Total Bookings</h3>
          <p className="text-3xl font-bold text-primary-600">{stats.totalBookings}</p>
          <div className="mt-4">
            <Link href="/bookings?tab=all">
              <Button variant="outline" size="sm">View History</Button>
            </Link>
          </div>
        </Card>
        
        {/* Conditional card based on user role */}
        {profile?.role === 'facility_owner' ? (
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-2">Your Facilities</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.facilities}</p>
            <div className="mt-4">
              <Link href="/facilities/add">
                <Button variant="outline" size="sm">Add Facility</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-2">Find Facilities</h3>
            <p className="text-sm text-gray-600 mb-4">
              Discover sports facilities in your area
            </p>
            <Link href="/facilities">
              <Button variant="outline" size="sm">Browse Facilities</Button>
            </Link>
          </Card>
        )}
      </div>
      
      {/* Quick actions grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/facilities" className="block">
            <Card className="p-6 h-full hover:shadow-md transition">
              <h3 className="font-medium mb-2">Find a Facility</h3>
              <p className="text-sm text-gray-600">
                Browse and book available facilities
              </p>
            </Card>
          </Link>
          
          <Link href="/bookings" className="block">
            <Card className="p-6 h-full hover:shadow-md transition">
              <h3 className="font-medium mb-2">Manage Bookings</h3>
              <p className="text-sm text-gray-600">
                View and manage your existing bookings
              </p>
            </Card>
          </Link>
          
          {profile?.role === 'facility_owner' ? (
            <>
              <Link href="/facilities/add" className="block">
                <Card className="p-6 h-full hover:shadow-md transition">
                  <h3 className="font-medium mb-2">Add a Facility</h3>
                  <p className="text-sm text-gray-600">
                    List a new facility on the platform
                  </p>
                </Card>
              </Link>
              
              <Link href="/dashboard/booking-requests" className="block">
                <Card className="p-6 h-full hover:shadow-md transition">
                  <h3 className="font-medium mb-2">Booking Requests</h3>
                  <p className="text-sm text-gray-600">
                    View and manage booking requests for your facilities
                  </p>
                </Card>
              </Link>
            </>
          ) : (
            <>
              <Link href="#" className="block">
                <Card className="p-6 h-full hover:shadow-md transition">
                  <h3 className="font-medium mb-2">Profile Settings</h3>
                  <p className="text-sm text-gray-600">
                    Update your personal information
                  </p>
                </Card>
              </Link>
              
              <Link href="#" className="block">
                <Card className="p-6 h-full hover:shadow-md transition">
                  <h3 className="font-medium mb-2">Help Center</h3>
                  <p className="text-sm text-gray-600">
                    Find answers to common questions
                  </p>
                </Card>
              </Link>
            </>
          )}
        </div>
      </div>
      
      {/* Recent activity will be added in future iterations */}
    </div>
  );
}
