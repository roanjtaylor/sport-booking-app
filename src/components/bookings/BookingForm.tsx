// src/components/bookings/BookingForm.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TimeSlotPicker } from '@/components/facilities/TimeSlotPicker';
import { Facility } from '@/types/facility';
import { TimeSlot } from '@/types/booking';
import { 
  formatDate, 
  formatTime, 
  formatPrice, 
  calculateTotalPrice,
  getDayOfWeek,
  generateTimeSlots
} from '@/lib/utils';
import { supabase } from '@/lib/supabase';

type BookingFormProps = {
  facility: Facility;
  existingBookings: { startTime: string; endTime: string }[];
};

/**
 * Form for creating a new booking for a facility
 */
export function BookingForm({ facility, existingBookings }: BookingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');
  
  // Calculated time slots based on selected date and facility operating hours
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  
  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    setSelectedSlot(null);
    
    if (newDate) {
      // Get the day of the week from the selected date
      const dayOfWeek = getDayOfWeek(newDate);
      
      // Generate time slots based on operating hours and existing bookings
      const slots = generateTimeSlots(
        facility.operatingHours,
        dayOfWeek,
        60, // Default to 1-hour slots
        existingBookings.filter(booking => {
          // Only consider bookings for the selected date
          // In a real app, bookings would have date information 
          return true;
        })
      );
      
      setTimeSlots(slots);
    } else {
      setTimeSlots([]);
    }
  };
  
  // Calculate total price based on selected time slot and facility price
  const totalPrice = selectedSlot
    ? calculateTotalPrice(
        selectedSlot.startTime,
        selectedSlot.endTime,
        facility.pricePerHour
      )
    : 0;
  
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
        throw new Error('You must be logged in to make a booking');
      }
      
      // Create the booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          facilityId: facility.id,
          userId: user.id,
          date,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          status: 'pending',
          totalPrice,
          notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        
      if (bookingError) throw new Error(bookingError.message);
      
      // Redirect to bookings page on success
      router.push('/bookings');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate maximum date (30 days from now)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateString = maxDate.toISOString().split('T')[0];
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}
      
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Make a Booking</h2>
        
        <Input
          label="Select Date"
          name="date"
          type="date"
          value={date}
          onChange={handleDateChange}
          min={today}
          max={maxDateString}
          required
        />
        
        {date && (
          <TimeSlotPicker
            timeSlots={timeSlots}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
          />
        )}
        
        {selectedSlot && (
          <div className="mt-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any special requests or information for the facility owner"
                className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Booking Summary</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Facility:</span> {facility.name}</p>
                <p><span className="text-gray-500">Date:</span> {formatDate(date)}</p>
                <p>
                  <span className="text-gray-500">Time:</span> {' '}
                  {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                </p>
                <p className="font-medium mt-2">
                  <span className="text-gray-500">Total Price:</span> {' '}
                  {formatPrice(totalPrice, facility.currency)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !selectedSlot}
        >
          {isLoading ? 'Creating Booking...' : 'Confirm Booking'}
        </Button>
      </div>
    </form>
  );
}
