// src/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { format } from 'date-fns';

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
  pendingRequests?: number;
}

interface Booking {
  id: string;
  facility_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  facility?: {
    name: string;
  };
}

interface Facility {
  id: string;
  name: string;
  address: string;
  city: string;
  sport_type: string[];
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
    pendingRequests: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [facilityList, setFacilityList] = useState<Facility[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Booking[]>([]);

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
        
        // Calculate statistics and fetch relevant data based on user role
        const today = new Date().toISOString().split('T')[0];
        
        if (profileData.role === 'facility_owner') {
          await fetchFacilityOwnerData(authUser.id, today);
        } else {
          await fetchRegularUserData(authUser.id, today);
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
   * Fetches all necessary data for facility owners
   */
  const fetchFacilityOwnerData = async (userId: string, today: string) => {
    try {
      // Get facilities owned by the user
      const { data: facilities, error: facilitiesError } = await supabase
        .from('facilities')
        .select('id, name, address, city, sport_type')
        .eq('owner_id', userId);
  
      if (facilitiesError) throw facilitiesError;
      
      setFacilityList(facilities || []);
      
      if (!facilities || facilities.length === 0) {
        setStats({ 
          facilities: 0, 
          totalBookings: 0, 
          upcomingBookings: 0,
          pendingRequests: 0 
        });
        return;
      }
  
      const facilityIds = facilities.map(f => f.id);
      
      // Fetch all statistics in parallel
      const [facilitiesCount, totalBookings, upcomingBookings, pendingRequestsCount] = await Promise.all([
        supabase.from('facilities').select('id', { count: 'exact' }).eq('owner_id', userId),
        supabase.from('bookings').select('id', { count: 'exact' }).in('facility_id', facilityIds),
        supabase.from('bookings')
          .select('id', { count: 'exact' })
          .in('facility_id', facilityIds)
          .gte('date', today)
          .eq('status', 'confirmed'),
        supabase.from('bookings')
          .select('id', { count: 'exact' })
          .in('facility_id', facilityIds)
          .eq('status', 'pending')
      ]);
  
      setStats({
        facilities: facilitiesCount.count ?? 0,
        totalBookings: totalBookings.count ?? 0,
        upcomingBookings: upcomingBookings.count ?? 0,
        pendingRequests: pendingRequestsCount.count ?? 0
      });
      
      // Fetch recent pending requests
      const { data: requests, error: requestsError } = await supabase
        .from('bookings')
        .select(`
          id, 
          facility_id, 
          date, 
          start_time, 
          end_time, 
          status,
          facility:facility_id (
            id,
            name
          )
        `)
        .in('facility_id', facilityIds)
        .eq('status', 'pending')
        .order('date', { ascending: true })
        .limit(5);
        
      if (requestsError) {
        console.error('Error fetching booking requests:', requestsError);
      }
      
      // Ensure facility property exists on each booking
      const safeRequests = (requests || []).map(booking => ({
        ...booking,
        facility: booking.facility || { name: 'Unknown' }
      }));
      
    } catch (error) {
      console.error('Error fetching facility owner data:', error);
      // Set default values in case of error
      setStats({ 
        facilities: 0, 
        totalBookings: 0, 
        upcomingBookings: 0,
        pendingRequests: 0 
      });
    }
  };

  /**
   * Fetches all necessary data for regular users
   */
  const fetchRegularUserData = async (userId: string, today: string) => {
    try {
      // Fetch booking statistics and recent bookings in parallel
      const [totalBookings, upcomingBookings, recentBookingsData] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('bookings')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .gte('date', today)
          .not('status', 'eq', 'cancelled'),
        supabase.from('bookings')
          .select(`
            id, 
            facility_id, 
            date, 
            start_time, 
            end_time, 
            status,
            facility:facility_id (
              id,
              name
            )
          `)
          .eq('user_id', userId)
          .gte('date', today)
          .not('status', 'eq', 'cancelled')
          .order('date', { ascending: true })
          .limit(5)
      ]);
  
      setStats({
        facilities: 0,
        totalBookings: totalBookings.count ?? 0,
        upcomingBookings: upcomingBookings.count ?? 0,
      });
      
      // Ensure facility property exists on each booking
      const safeBookings = (recentBookingsData.data || []).map(booking => ({
        ...booking,
        facility: booking.facility || { name: 'Unknown' }
      }));
      
      // Also fetch some recommended facilities
      const { data: facilities } = await supabase
        .from('facilities')
        .select('id, name, address, city, sport_type')
        .limit(3);
        
      setFacilityList(facilities || []);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Set default values in case of error
      setStats({ facilities: 0, totalBookings: 0, upcomingBookings: 0 });
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'EEE, MMM d, yyyy');
    } catch (e) {
      return dateStr;
    }
  };
  
  // Format time for display
  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, 'h:mm a');
    } catch (e) {
      return timeStr;
    }
  };

  // Loading state UI- animation
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

  // Determine whether to show facility owner or regular user dashboard
  const isFacilityOwner = profile?.role === 'facility_owner';

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {profile?.name || user?.email}
          </p>
        </div>
      </div>
      
      {/* Statistics cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Show different stats based on user role */}
        {isFacilityOwner ? (
          // Facility Owner Statistics
          <>
            <Card className="p-6 border-l-4 border-blue-500">
              <h3 className="text-lg font-medium mb-2">Pending Requests</h3>
              <p className="text-3xl font-bold text-primary-600">{stats.pendingRequests}</p>
              <div className="mt-4">
                <Link href="/dashboard/booking-requests">
                  <Button variant="outline" size="sm">View Requests</Button>
                </Link>
              </div>
            </Card>
            
            <Card className="p-6 border-l-4 border-green-500">
              <h3 className="text-lg font-medium mb-2">Upcoming Bookings</h3>
              <p className="text-3xl font-bold text-primary-600">{stats.upcomingBookings}</p>
              <div className="mt-4">
                <Link href="/dashboard/facility-bookings">
                  <Button variant="outline" size="sm">View Bookings</Button>
                </Link>
              </div>
            </Card>
            
            <Card className="p-6 border-l-4 border-purple-500">
              <h3 className="text-lg font-medium mb-2">Your Facilities</h3>
              <p className="text-3xl font-bold text-primary-600">{stats.facilities}</p>
              <div className="mt-4">
                <Link href="/facilities/add">
                  <Button variant="outline" size="sm">Add Facility</Button>
                </Link>
              </div>
            </Card>
          </>
        ) : (
          // Regular User Statistics
          <>
            <Card className="p-6 border-l-4 border-green-500">
              <h3 className="text-lg font-medium mb-2">Upcoming Bookings</h3>
              <p className="text-3xl font-bold text-primary-600">{stats.upcomingBookings}</p>
              <div className="mt-4">
                <Link href="/bookings?tab=upcoming">
                  <Button variant="outline" size="sm">View Bookings</Button>
                </Link>
              </div>
            </Card>
            
            <Card className="p-6 border-l-4 border-blue-500">
              <h3 className="text-lg font-medium mb-2">Total Bookings</h3>
              <p className="text-3xl font-bold text-primary-600">{stats.totalBookings}</p>
              <div className="mt-4">
                <Link href="/bookings?tab=all">
                  <Button variant="outline" size="sm">View History</Button>
                </Link>
              </div>
            </Card>
            
            <Card className="p-6 border-l-4 border-orange-500">
              <h3 className="text-lg font-medium mb-2">Find Facilities</h3>
              <p className="text-sm text-gray-600 mb-4">
                Book your next sports session now
              </p>
              <Link href="/facilities">
                <Button variant="primary" size="sm">Browse Facilities</Button>
              </Link>
            </Card>
          </>
        )}
      </div>
      
      {/* Quick actions grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isFacilityOwner ? (
            // Facility Owner Quick Actions
            <>
              <Link href="/dashboard/booking-requests" className="block">
                <Card className="p-6 h-full hover:shadow-md transition border-t-2 border-blue-400">
                  <h3 className="font-medium mb-2">Booking Requests</h3>
                  <p className="text-sm text-gray-600">
                    Approve or decline booking requests
                  </p>
                </Card>
              </Link>
              
              <Link href="/dashboard/facility-bookings" className="block">
                <Card className="p-6 h-full hover:shadow-md transition border-t-2 border-green-400">
                  <h3 className="font-medium mb-2">View Bookings</h3>
                  <p className="text-sm text-gray-600">
                    See all bookings for your facilities
                  </p>
                </Card>
              </Link>

              <Link href="/facilities" className="block">
                <Card className="p-6 h-full hover:shadow-md transition border-t-2 border-purple-400">
                  <h3 className="font-medium mb-2">Manage Facilities</h3>
                  <p className="text-sm text-gray-600">
                    Edit your facility information
                  </p>
                </Card>
              </Link>

              <Link href="/facilities/add" className="block">
                <Card className="p-6 h-full hover:shadow-md transition border-t-2 border-orange-400">
                  <h3 className="font-medium mb-2">Add Facility</h3>
                  <p className="text-sm text-gray-600">
                    List a new facility on the platform
                  </p>
                </Card>
              </Link>
            </>
          ) : (
            // Regular User Quick Actions
            <>
              <Link href="/bookings" className="block">
                <Card className="p-6 h-full hover:shadow-md transition border-t-2 border-green-400">
                  <h3 className="font-medium mb-2">Manage Bookings</h3>
                  <p className="text-sm text-gray-600">
                    View and manage your existing bookings
                  </p>
                </Card>
              </Link>
              
              <Link href="/bookings?tab=upcoming" className="block">
                <Card className="p-6 h-full hover:shadow-md transition border-t-2 border-blue-400">
                  <h3 className="font-medium mb-2">Upcoming Bookings</h3>
                  <p className="text-sm text-gray-600">
                    Check your schedule and bookings
                  </p>
                </Card>
              </Link>

              <Link href="/facilities" className="block">
                <Card className="p-6 h-full hover:shadow-md transition border-t-2 border-orange-400">
                  <h3 className="font-medium mb-2">Find a Facility</h3>
                  <p className="text-sm text-gray-600">
                    Browse and book available facilities
                  </p>
                </Card>
              </Link>
              
              <Link href="/profile" className="block">
                <Card className="p-6 h-full hover:shadow-md transition border-t-2 border-purple-400">
                  <h3 className="font-medium mb-2">Your Profile</h3>
                  <p className="text-sm text-gray-600">
                    Update your personal information
                  </p>
                </Card>
              </Link>
            </>
          )}
        </div>
      </div>
      
      {/* Recent activity section - different for each user type */}
      {isFacilityOwner ? (
        // Facility Owner - Recent Booking Requests
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Booking Requests</h2>
            <Link href="/dashboard/booking-requests">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          
          {pendingRequests.length > 0 ? (
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facility</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingRequests.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{booking.facility ? booking.facility.name : 'Unknown'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(booking.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Link href={`/dashboard/booking-requests#${booking.id}`}>
                            <Button variant="outline" size="sm">Review</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {pendingRequests.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-500">No pending booking requests</p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-gray-500">You don't have any pending booking requests</p>
              <div className="mt-4">
                <Link href="/facilities">
                  <Button variant="primary" size="sm">Manage Your Facilities</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      ) : (
        // Regular User - Upcoming Bookings
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Upcoming Bookings</h2>
            <Link href="/bookings">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          
          {recentBookings.length > 0 ? (
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facility</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{booking.facility ? booking.facility.name : 'Unknown'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(booking.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${booking.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : booking.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Link href={`/bookings/${booking.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {recentBookings.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-500">You don't have any upcoming bookings</p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-gray-500">You don't have any upcoming bookings</p>
              <div className="mt-4">
                <Link href="/facilities">
                  <Button variant="primary" size="sm">Browse Facilities</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}
      
      {/* Facility list for owner / Recommended facilities for user */}
      {isFacilityOwner && facilityList.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Facilities</h2>
            <Link href="/facilities/add">
              <Button variant="outline" size="sm">Add New</Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {facilityList.map(facility => (
              <Card key={facility.id} className="p-4 hover:shadow-md transition">
                <h3 className="font-medium mb-1">{facility.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{facility.address}, {facility.city}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {facility.sport_type.map(sport => (
                    <span key={sport} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                      {sport}
                    </span>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Link href={`/facilities/${facility.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {!isFacilityOwner && facilityList.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recommended Facilities</h2>
            <Link href="/facilities">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {facilityList.map(facility => (
              <Card key={facility.id} className="p-4 hover:shadow-md transition">
                <h3 className="font-medium mb-1">{facility.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{facility.address}, {facility.city}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {facility.sport_type.map(sport => (
                    <span key={sport} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                      {sport}
                    </span>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Link href={`/facilities/${facility.id}`}>
                    <Button variant="primary" size="sm">Book Now</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}