// src/components/bookings/BookingForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TimeSlotPicker } from '@/components/facilities/TimeSlotPicker';
import { Facility } from '@/types/facility';
import { TimeSlot } from '@/types/booking';
import { supabase } from '@/lib/supabase';
import { Card } from '../ui/Card';
import { 
  formatDate, 
  formatTime, 
  formatPrice, 
  calculateTotalPrice,
  getDayOfWeek,
  generateTimeSlots
} from '@/lib/utils';

type BookingFormProps = {
  facility: any;
  existingBookings: any[];
}

export function BookingForm({ facility, existingBookings }: BookingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');
  
  // Time slots based on selected date
  const [timeSlots, setTimeSlots] = useState<Array<{ startTime: string; endTime: string; available: boolean }>>([]);

// Handle date change
const handleDateChange = (e: { target: { value: any; }; }) => {
  const newDate = e.target.value;
  setDate(newDate);
  setSelectedSlot(null); // Reset selected slot
  
  if (newDate) {
    // Get day of week from selected date
    const dayOfWeek = getDayOfWeek(newDate);
    
    // Make sure operating_hours is in the expected format
    const operatingHours = facility.operating_hours || {};
    
    // Filter existing bookings for selected date
    const dateBookings = existingBookings.filter(booking => 
      booking.date === newDate
    );
    
    // Generate time slots
    const slots = generateTimeSlots(
      operatingHours,
      dayOfWeek,
      60, // 1-hour slots
      dateBookings
    );
    
    setTimeSlots(slots);
  } else {
    setTimeSlots([]);
  }
};

// Calculate total price
const totalPrice = selectedSlot
  ? calculateTotalPrice(
      selectedSlot.startTime,
      selectedSlot.endTime,
      facility.price_per_hour || 0
    )
  : 0;

// Handle form submission
const handleSubmit = async (e: { preventDefault: () => void; }) => {
  e.preventDefault();
  setError(null);
  setIsLoading(true);
  
  if (!selectedSlot) {
    setError('Please select a time slot');
    setIsLoading(false);
    return;
  }
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    console.log('Creating booking with data:', {
      facility_id: facility.id,
      user_id: user.id,
      date,
      start_time: selectedSlot.startTime,
      end_time: selectedSlot.endTime,
      status: 'pending',
      total_price: totalPrice,
      notes,
    });
    
    // Create the booking
    const { data, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        facility_id: facility.id,
        user_id: user.id,
        date,
        start_time: selectedSlot.startTime,
        end_time: selectedSlot.endTime,
        status: 'pending',
        total_price: totalPrice,
        notes,
      }])
      .select();
      
    if (bookingError) {
      console.error('Supabase error:', bookingError);
      throw new Error('Failed to create booking. Please try again.');
    }
    
    // Success - redirect to bookings page
    alert('Booking created successfully! The facility owner will review your request.');
    router.push('/bookings');
    router.refresh();
  } catch (err) {
    console.error('Error creating booking:', err);
    setError(err instanceof Error ? err.message : 'Failed to create booking');
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
            onSelectSlot={(slot) => setSelectedSlot(slot)}
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
                  // Continuing src/components/bookings/BookingForm.tsx
                  {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                </p>
                <p className="font-medium mt-2">
                  <span className="text-gray-500">Total Price:</span> {' '}
                  {formatPrice(totalPrice, facility.currency || 'USD')}
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