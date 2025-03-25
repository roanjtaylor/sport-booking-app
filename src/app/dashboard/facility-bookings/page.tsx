// src/app/dashboard/facility-bookings/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDate, formatTime } from '@/lib/utils';

interface Booking {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  date: string;
  start_time: string;
  end_time: string;
  notes?: string;
  facility: {
    id: string;
    name: string;
  };
  user: {
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
          .eq('owner_id', user.id); // Changed from ownerId to owner_id
    
        if (facilitiesError) throw facilitiesError;
        if (!facilities?.length) {
          setBookings([]);
          return;
        }
    
        const facilityIds = facilities.map(f => f.id);
    
        // Get bookings for these facilities
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            facility:facility_id (
              id,
              name,
              address
            ),
            user:user_id (
              id,
              email,
              name
            )
          `)
          .in('facility_id', facilityIds)
          .order('date', { ascending: true });
    
        if (bookingsError) throw bookingsError;
        setBookings(bookings || []);
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
    return <div>Loading facility bookings...</div>;
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
      <h1 className="text-2xl font-bold mb-6">Facility Booking Requests</h1>
      
      {bookings.length === 0 ? (
        <Card className="p-6 text-center">
          <p>No bookings found for your facilities.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <Card key={booking.id} className="p-4">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{booking.facility.name}</h3>
                  <p className="text-gray-600">{formatDate(booking.date)}</p>
                  <p className="text-gray-600">
                    {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                  </p>
                  <p className="text-gray-600">
                    Booked by: {booking.user.email}
                  </p>
                  {booking.notes && (
                    <p className="text-gray-600 mt-2">
                      <span className="font-medium">Notes:</span> {booking.notes}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                  
                  <div className="mt-3 space-y-2">
                    {booking.status === 'pending' && (
                      <>
                        <Button 
                          size="sm"
                          onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                        >
                          Reject
                        </Button>
                      </>
                    )}
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