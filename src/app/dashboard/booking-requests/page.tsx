// src/app/dashboard/booking-requests/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { format } from 'date-fns';

interface Booking {
  id: string;
  facility_id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: number;
  notes?: string;
  created_at: string;
  facility: {
    id: string;
    name: string;
    address?: string;
  };
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

export default function BookingRequestsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchBookingRequests();
  }, []);

  async function fetchBookingRequests() {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) {
        setError('You must be logged in to view booking requests');
        return;
      }
      
      // Get facilities owned by the user
      const { data: facilities, error: facilitiesError } = await supabase
        .from('facilities')
        .select('id, name, address')
        .eq('owner_id', user.id);
        
      if (facilitiesError) throw facilitiesError;
      
      if (!facilities?.length) {
        setBookings([]);
        setIsLoading(false);
        return;
      }
      
      const facilityIds = facilities.map(f => f.id);
      
      // Get bookings for these facilities with pending status
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          facility:facilities(*)
        `)
        .in('facility_id', facilityIds)
        .eq('status', 'pending')
        .order('date', { ascending: true });

      if (bookingsError) throw bookingsError;

      // If we have bookings, fetch user data for each booking
    if (bookingsData && bookingsData.length > 0) {
      // Get all unique user IDs
      const userIds = [...new Set(bookingsData.map(booking => booking.user_id))];
      
      // Fetch user profiles in a single query
      const { data: userProfiles, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
        
      if (userError) throw userError;
      
      // Create a lookup map for quick access
      const userMap = (userProfiles || []).reduce((map, user) => {
        map[user.id] = user;
        return map;
      }, {});
      
      // Combine bookings with user data
      const processedBookings = bookingsData.map(booking => ({
        ...booking,
        facility: booking.facility || { id: booking.facility_id, name: 'Unknown Facility' },
        user: userMap[booking.user_id] || { id: booking.user_id }
      }));
      
      setBookings(processedBookings);
    } else {
      setBookings([]);
    }

    } catch (err) {
      console.error('Error fetching booking requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load booking requests');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApproveBooking(bookingId: string) {
    try {
      setIsProcessing(true);
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
        
      if (error) throw error;
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'confirmed' } 
          : booking
      ));
      
      // Show success message
      alert('Booking confirmed successfully');
    } catch (err) {
      console.error('Error approving booking:', err);
      alert('Failed to approve booking');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleRejectBooking(bookingId: string) {
    if (!window.confirm('Are you sure you want to reject this booking?')) {
      return;
    }
    
    try {
      setIsProcessing(true);
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
        
      if (error) throw error;
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' } 
          : booking
      ));
      
      // Show success message
      alert('Booking rejected successfully');
    } catch (err) {
      console.error('Error rejecting booking:', err);
      alert('Failed to reject booking');
    } finally {
      setIsProcessing(false);
    }
  }

  // Format date for display
  function formatDate(dateStr: string) {
    try {
      return format(new Date(dateStr), 'EEE, MMM d, yyyy');
    } catch (e) {
      return dateStr;
    }
  }

  // Format time for display
  function formatTime(timeStr: string) {
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      
      return format(date, 'h:mm a');
    } catch (e) {
      return timeStr;
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <Card className="p-6 max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Booking Requests</h1>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
        <p className="text-gray-600 mt-2">
          Manage booking requests for your facilities
        </p>
      </div>
      
      {bookings.length === 0 ? (
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">No booking requests</h2>
          <p className="text-gray-600 mb-6">You don't have any pending booking requests for your facilities.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <Card key={booking.id} id={booking.id} className="overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <div className="flex items-center mb-2">
                      <h2 className="text-xl font-bold mr-3">
                        {booking.facility?.name || 'Unknown Facility'}
                      </h2>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </div>
                    
                    <div className="text-gray-600 space-y-1">
                      <p><span className="font-medium">Date:</span> {formatDate(booking.date)}</p>
                      <p>
                        <span className="font-medium">Time:</span> {formatTime(booking.start_time)} to {formatTime(booking.end_time)}
                      </p>
                      <p>
                        <span className="font-medium">Booked by:</span> {booking.user?.name || booking.user?.email || 'Unknown User'}
                      </p>
                      <p><span className="font-medium">Price:</span> ${booking.total_price.toFixed(2)}</p>
                      {booking.notes && (
                        <p><span className="font-medium">Notes:</span> {booking.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex flex-col space-y-2">
                    <Button 
                      onClick={() => handleApproveBooking(booking.id)}
                      disabled={isProcessing}
                    >
                      Approve Booking
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleRejectBooking(booking.id)}
                      disabled={isProcessing}
                    >
                      Reject Booking
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}