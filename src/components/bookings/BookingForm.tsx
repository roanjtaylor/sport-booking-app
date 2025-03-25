// src/components/bookings/BookingForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { generateTimeSlots, formatTime, calculateTotalPrice } from '@/lib/utils';
import { Card } from '../ui/Card';

type BookingFormProps = {
  facility: any;
  existingBookings: any[];
}

export function BookingForm({ facility, existingBookings }: BookingFormProps) {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<null | { startTime: string; endTime: string }>(null);
  const [notes, setNotes] = useState('');
  const [timeSlots, setTimeSlots] = useState<Array<{ startTime: string; endTime: string; available: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle date change
  useEffect(() => {
    if (!date) {
      setTimeSlots([]);
      return;
    }

    // Get day of week from date
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const operatingHours = facility.operating_hours || {};
    
    // Check if facility is open on this day
    if (!operatingHours[dayOfWeek] || !operatingHours[dayOfWeek].open) {
      setTimeSlots([]);
      setError(`This facility is closed on ${dayOfWeek}`);
      return;
    }

    // Filter bookings for the selected date
    const bookingsForDate = existingBookings.filter(booking => booking.date === date);
    
    // Generate time slots based on operating hours
    const slots = [];
    const startTime = operatingHours[dayOfWeek].open;
    const endTime = operatingHours[dayOfWeek].close;
    
    // Parse times to hours and minutes
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    // Create a slot for each hour
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      // Format current time
      const slotStartTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Add an hour for slot end
      let nextHour = currentHour + 1;
      let nextMinute = currentMinute;
      
      // Check if this would go beyond closing
      if (nextHour > endHour || (nextHour === endHour && nextMinute > endMinute)) {
        nextHour = endHour;
        nextMinute = endMinute;
      }
      
      const slotEndTime = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
      
      // Check if this slot overlaps with any existing bookings
      const isAvailable = !bookingsForDate.some(booking => {
        const bookingStart = booking.start_time;
        const bookingEnd = booking.end_time;
        
        // Check for any overlap
        return (
          (slotStartTime >= bookingStart && slotStartTime < bookingEnd) ||
          (slotEndTime > bookingStart && slotEndTime <= bookingEnd) ||
          (slotStartTime <= bookingStart && slotEndTime >= bookingEnd)
        );
      });
      
      slots.push({
        startTime: slotStartTime,
        endTime: slotEndTime,
        available: isAvailable
      });
      
      // Move to next slot
      currentHour++;
    }
    
    setTimeSlots(slots);
    setError(null);
  }, [date, facility, existingBookings]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      setError('Please select a date');
      return;
    }
    
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to make a booking');
      }
      
      // Calculate total price
      const totalPrice = facility.price_per_hour;
      
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
          total_price: totalPrice,
          notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (bookingError) throw bookingError;
      
      // Redirect to bookings page
      router.push('/bookings');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="sticky top-24">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Book this facility</h2>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}
        
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
              onChange={(e) => {
                setDate(e.target.value);
                setSelectedSlot(null);
              }}
              className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              min={new Date().toISOString().split('T')[0]} // Today's date
              required
            />
          </div>
          
          {date && timeSlots.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Slot
              </label>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-2 border rounded text-center text-sm ${
                      !slot.available
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : selectedSlot?.startTime === slot.startTime
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'border-gray-300 hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500'
                    }`}
                  >
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {date && timeSlots.length === 0 && !error && (
            <div className="text-gray-500 text-center py-4">
              No available time slots for this date.
            </div>
          )}
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any special requests"
              className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
            ></textarea>
          </div>
          
          {selectedSlot && (
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
          )}
          
          <Button type="submit" fullWidth disabled={isLoading || !selectedSlot}>
            {isLoading ? 'Processing...' : 'Proceed to Book'}
          </Button>
        </form>
      </div>
    </Card>
  );
}