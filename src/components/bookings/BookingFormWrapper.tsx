'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatTime, getDayOfWeek, generateTimeSlots } from '@/lib/utils';
import { TimeSlot } from '@/types/booking';
import { Facility } from '@/types/facility';
import { BookingTypeSelector, BookingType } from './BookingTypeSelector';

// Props type for the BookingFormWrapper component
type BookingFormWrapperProps = {
  facility: Facility;
  existingBookings: {
    date: string;
    startTime: string;
    endTime: string;
  }[];
}

/**
 * Client component wrapper for booking form to handle client-side interactions
 */
export default function BookingFormWrapper({ 
  facility, 
  existingBookings 
}: BookingFormWrapperProps) {
  const router = useRouter();

  // State for full booking form (existing state)
  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookingType, setBookingType] = useState<BookingType>('full');

  // Get min players from facility or default to 10
  const minPlayers = facility.min_players || 10;

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    setSelectedSlot(null);
    
    if (newDate) {
      // Get the day of the week from the selected date
      const dayOfWeek = getDayOfWeek(newDate);
      
      // Filter bookings for the selected date
      const bookingsForDate = existingBookings.filter(
        booking => booking.date === newDate
      );
      
      // Generate time slots based on operating hours and existing bookings
      const slots = generateTimeSlots(
        facility.operatingHours,
        dayOfWeek,
        60, // Default to 1-hour slots
        bookingsForDate
      );
      
      setTimeSlots(slots);
    } else {
      setTimeSlots([]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    if (!selectedSlot) {
      setError('Please select a time slot');
      setIsLoading(false);
      return;
    }
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // If no user is logged in, redirect to login page
        router.push(`/auth/login?redirect=/facilities/${facility.id}`);
        return;
      }
      
      // Calculate total price based on hourly rate
      const pricePerHour = facility.price_per_hour;
      
      // Create the booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          facility_id: facility.id,
          user_id: user.id,
          date,
          start_time: selectedSlot.startTime,
          end_time: selectedSlot.endTime,
          status: 'pending',
          total_price: pricePerHour,
          notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        
      if (bookingError) throw bookingError;
      
      // Redirect to bookings page on success
      router.push('/bookings');
      router.refresh();
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle booking type change
  const handleBookingTypeChange = (type: BookingType) => {
    setBookingType(type);
    setError(null); // Clear any errors
  };

  // Calculate minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate maximum date (30 days from now)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateString = maxDate.toISOString().split('T')[0];

  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}
      
      {/* Booking Type Selector - New component */}
      <BookingTypeSelector 
        selectedType={bookingType} 
        onChange={handleBookingTypeChange}
        minPlayers={minPlayers}
      />
      
      {/* Full Booking Form - Only show when 'full' type is selected */}
      {bookingType === 'full' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={date}
              onChange={handleDateChange}
              min={today}
              max={maxDateString}
              required
              className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          {date && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Time Slots
              </label>
              {timeSlots.length === 0 ? (
                <p className="text-sm text-gray-500">No available time slots for this day.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => slot.available && setSelectedSlot(slot)}
                      className={`p-2 text-sm rounded text-center ${
                        !slot.available
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : selectedSlot?.startTime === slot.startTime
                            ? 'bg-primary-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:border-primary-500'
                      }`}
                    >
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {selectedSlot && (
            <>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests"
                  className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                ></textarea>
              </div>
              
              <div className="bg-gray-50 p-4 rounded">
                <div className="flex justify-between text-sm mb-1">
                  <span>Price per hour</span>
                  <span>${facility.price_per_hour}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${facility.price_per_hour}</span>
                </div>
              </div>
            </>
          )}
          
          <Button 
            type="submit" 
            fullWidth
            disabled={isLoading || !selectedSlot}
          >
            {isLoading ? 'Processing...' : 'Proceed to Book'}
          </Button>
        </form>
      )}
      
      {/* Lobby Booking Section - Only show when 'lobby' type is selected */}
      {bookingType === 'lobby' && (
        <div className="p-6 bg-gray-50 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">Lobby Functionality Coming Soon</h3>
          <p className="text-gray-600 mb-4">
            We're currently implementing the lobby system that will allow you to join existing 
            games or create your own. Please check back soon!
          </p>
          <p className="text-sm text-gray-500">
            The minimum number of players required for this facility is: {minPlayers}
          </p>
        </div>
      )}
    </div>
  );
}