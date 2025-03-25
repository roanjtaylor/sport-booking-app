'use client';

// src/app/bookings/BookingsClient.tsx
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookingsList } from '@/components/bookings/BookingsList';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

/**
 * Client component for handling booking data fetching and interactivity
 */
export default function BookingsClient() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    // Fetch bookings for the current user
    async function fetchBookings() {
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('You must be logged in to view your bookings');
          setIsLoading(false);
          return;
        }
        
        // Fetch bookings with facility information
        const { data, error } = await supabase
          .from('bookings').select(`*,facility:facility_id (
          id,
          name,
          address,
          sport_type,
          price_per_hour,
          currency
        )
      `)
      .eq('user_id', user.id) // Changed from userId to user_id
      .order('date', { ascending: true });
          
        if (error) throw error;
        
        setBookings(data || []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBookings();
  }, []);

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter(booking => {
    const today = new Date().toISOString().split('T')[0];
    
    if (activeTab === 'upcoming') {
      return booking.date >= today && booking.status !== 'cancelled';
    } else if (activeTab === 'past') {
      return booking.date < today || booking.status === 'completed';
    } else if (activeTab === 'cancelled') {
      return booking.status === 'cancelled';
    }
    
    return true; // All bookings
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your bookings...</p>
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
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs for filtering bookings */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'past'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Past
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cancelled'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cancelled
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Bookings
          </button>
        </nav>
      </div>
      
      {/* Display bookings or empty state */}
      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-500 mb-6">You haven't made any bookings yet.</p>
          <Link href="/facilities">
            <Button>Find a Facility</Button>
          </Link>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} bookings</h3>
          <p className="text-gray-500 mb-6">
            {activeTab === 'upcoming' && "You don't have any upcoming bookings."}
            {activeTab === 'past' && "You don't have any past bookings."}
            {activeTab === 'cancelled' && "You don't have any cancelled bookings."}
          </p>
          <Link href="/facilities">
            <Button>Find a Facility</Button>
          </Link>
        </div>
      ) : (
        <BookingsList bookings={filteredBookings} />
      )}
    </div>
  );
}