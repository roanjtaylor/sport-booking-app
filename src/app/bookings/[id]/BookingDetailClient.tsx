'use client';

// src/app/bookings/[id]/BookingDetailClient.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookingDetail } from '@/components/bookings/BookingDetail';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Booking } from '@/types/booking';
import { Facility } from '@/types/facility';
import { LobbyParticipants } from '@/components/bookings/LobbyParticipants';

interface BookingDetailClientProps {
  id: string;
}

/**
 * Client component for handling booking detail data fetching and interactivity
 */
export default function BookingDetailClient({ id }: BookingDetailClientProps) {
  const router = useRouter();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    // Fetch booking details
    async function fetchBookingDetails() {
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('You must be logged in to view booking details');
          setIsLoading(false);
          return;
        }
        
        // Fetch booking with related information
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            *,
            facility:facilities(*)
          `)
          .eq('id', id)
          .single();
          
        if (bookingError) throw bookingError;
        
        if (!bookingData) {
          setError('Booking not found');
          setIsLoading(false);
          return;
        }
        
        // Check if user owns the booking or facility
        const isBookingOwner = bookingData.user_id === user.id;
        const isFacilityOwner = bookingData.facility?.owner_id === user.id;
        
        setBooking(bookingData);
        setIsOwner(isBookingOwner || isFacilityOwner);
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError('Failed to load booking details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBookingDetails();
  }, [id]);

  // Handle booking cancellation
  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()  // Fix: changed from updatedAt to updated_at
        })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setBooking(prev => prev ? {
        ...prev,
        status: 'cancelled',
        updated_at: new Date().toISOString()
      } : null);
      
      // Show success message (could use a toast notification in a real app)
      alert('Booking cancelled successfully');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle booking confirmation (for facility owners)
  const handleConfirmBooking = async () => {
    if (!booking) return;
    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()  // Fix: changed from updatedAt to updated_at
        })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setBooking(prev => prev ? {
        ...prev,
        status: 'confirmed',
        updated_at: new Date().toISOString()
      } : null);
      
      // Show success message (could use a toast notification in a real app)
      alert('Booking confirmed successfully');
    } catch (err) {
      console.error('Error confirming booking:', err);
      alert('Failed to confirm booking');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
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
          <div className="flex justify-center space-x-4">
            <Link href="/bookings">
              <Button variant="secondary">My Bookings</Button>
            </Link>
            <Link href="/auth/login">
              <Button>Sign In</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return booking ? (
    <>
    <BookingDetail
      booking={booking}
      isOwner={isOwner}
      onCancelBooking={booking.status === 'pending' ? handleCancelBooking : undefined}
      onConfirmBooking={booking.status === 'pending' && isOwner ? handleConfirmBooking : undefined}
      isProcessing={isProcessing}
    />
    
    {/* Add lobby participants section if it's a lobby booking */}
    {booking.lobby_id && (
      <LobbyParticipants lobbyId={booking.lobby_id} />
    )}
  </>
  ) : null;
}