// src/app/dashboard/facility-bookings/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDate, formatTime } from '@/lib/utils';
import Link from 'next/link';

interface Booking {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  date: string;
  start_time: string;
  end_time: string;
  notes?: string;
  facility?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    email: string;
  };
}

export default function FacilityBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchBookingRequests() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('You must be logged in to view booking requests');
          return;
        }
    
        // Get facilities owned by the user
        const { data: facilities, error: facilitiesError } = await supabase
          .from('facilities')
          .select('id')
          .eq('owner_id', user.id);
    
        if (facilitiesError) throw facilitiesError;
        if (!facilities?.length) {
          setBookings([]);
          return;
        }
    
        const facilityIds = facilities.map(f => f.id);
    
        // Get bookings for these facilities
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .in('facility_id', facilityIds)
          .order('date', { ascending: true });
    
          if (bookingsError) throw bookingsError;
        
          console.log('Retrieved bookings data:', JSON.stringify(bookingsData, null, 2));
        
        // Check if we have the correct property names
        if (bookingsData && bookingsData.length > 0) {
          console.log('First booking object keys:', Object.keys(bookingsData[0]));
          console.log('Facilities object:', bookingsData[0].facilities);
          console.log('Profiles object:', bookingsData[0].profiles);
        }
        
        // Map the data to ensure we're handling the structure correctly
        const formattedBookings = (bookingsData || []).map(booking => {
          return {
            ...booking,
            // Map from facilities to facility for consistency
            facility: booking.facilities || {
              id: booking.facility_id,
              name: 'Unknown Facility'
            },
            // Map from profiles to user for consistency
            user: booking.profiles || {
              id: booking.user_id,
              email: 'Unknown User'
            }
          };
        });
          
          setBookings(formattedBookings);
      } catch (err) {
        console.error('Error fetching booking requests:', err);
        setError('Failed to load booking requests');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBookingRequests();
  }, []);
  
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
        
      if (error) throw error;
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus } 
          : booking
      ));
    } catch (err) {
      console.error(`Error updating booking status:`, err);
      alert('Failed to update booking status');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading facility bookings...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p className="text-red-500">{error}</p>
      </Card>
    );
  }
  
  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Facility Bookings</h1>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
      
      {bookings.length === 0 ? (
        <Card className="p-6 text-center">
          <p>No bookings found for your facilities.</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facility</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booked By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {booking.facility?.name || booking.facility?.name || 'Unknown Facility'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.user?.email || 'Unknown User'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(booking.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${booking.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : booking.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {booking.status === 'pending' && (
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {booking.status !== 'pending' && (
                        <Link href={`/bookings/${booking.id}`}>
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}