// src/app/bookings/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { BookingDetail } from '@/components/bookings/BookingDetail';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ExtendedBooking } from '@/types/booking';

/**
 * Page component for displaying details of a single booking
 */
export default function BookingDetailPage() {
  // Use useParams hook instead of getting params as a prop
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [booking, setBooking] = useState<ExtendedBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
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
            facility:facilityId (*),
            user:userId (*)
          `)
          .eq('id', id)
          .single();
          
        if (bookingError) throw bookingError;
        
        if (!bookingData) {
          setError('Booking not found');
          setIsLoading(false);
          return;
        }
        
        // Check if current user owns this booking
        setIsOwner(bookingData.userId === user.id);
        
        // Check if current user is the facility owner
        const { data: facilityData } = await supabase
          .from('facilities')
          .select('ownerId')
          .eq('id', bookingData.facilityId)
          .single();
          
        const isFacilityOwner = facilityData?.ownerId === user.id;
        
        setBooking(bookingData);
        setIsOwner(bookingData.userId === user.id || isFacilityOwner);
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
          updatedAt: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state with type safety
      setBooking(prev => prev ? {
        ...prev,
        status: 'confirmed'
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
    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          updatedAt: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state with type safety
      setBooking(prev => prev ? {
        ...prev,
        status: 'confirmed'
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

  return (
    <div>
      <div className="mb-8">
        <Link href="/bookings" className="text-primary-600 hover:underline inline-flex items-center">
          ← Back to Bookings
        </Link>
        <h1 className="text-3xl font-bold mt-2">Booking Details</h1>
      </div>
      
      {/* Render the booking details component */}
      {booking && (
        <BookingDetail
          booking={booking}
          isOwner={isOwner}
          onCancelBooking={booking?.status === 'pending' ? handleCancelBooking : undefined}
          onConfirmBooking={booking?.status === 'pending' && isOwner ? handleConfirmBooking : undefined}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}
