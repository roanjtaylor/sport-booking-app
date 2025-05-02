// src/components/bookings/BookingForm.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TimeSlotPicker } from "@/components/facilities/TimeSlotPicker";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";
import { Card } from "../ui/Card";
import { useBookingForm } from "@/hooks/useBookingForm";

type BookingFormProps = {
  facility: any;
  existingBookings: any[];
};

export function BookingForm({ facility, existingBookings }: BookingFormProps) {
  const router = useRouter();

  // Use our custom hook for booking form logic
  const {
    date,
    selectedSlot,
    setSelectedSlot, // Make sure to use this properly
    notes,
    setNotes,
    isLoading,
    setIsLoading,
    error,
    setError,
    timeSlots,
    today,
    maxDateString,
    handleDateChange,
    totalPrice,
    checkAuthentication,
    createFullBooking,
  } = useBookingForm({
    facility,
    existingBookings: existingBookings.map((booking) => ({
      date: booking.date,
      startTime: booking.start_time,
      endTime: booking.end_time,
    })),
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is authenticated
    const user = await checkAuthentication();

    if (!user) {
      router.push("/auth/login?redirect=/bookings");
      return;
    }

    // Create the booking
    const success = await createFullBooking(user.id, router);

    if (success) {
      // Show success message and redirect
      alert(
        "Booking created successfully! The facility owner will review your request."
      );
      router.push("/bookings");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>
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
                <p>
                  <span className="text-gray-500">Facility:</span>{" "}
                  {facility.name}
                </p>
                <p>
                  <span className="text-gray-500">Date:</span>{" "}
                  {formatDate(date)}
                </p>
                <p>
                  <span className="text-gray-500">Time:</span>{" "}
                  {formatTime(selectedSlot.startTime)} -{" "}
                  {formatTime(selectedSlot.endTime)}
                </p>
                <p className="font-medium mt-2">
                  <span className="text-gray-500">Total Price:</span>{" "}
                  {formatPrice(totalPrice, facility?.currency || "USD")}
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
        <Button type="submit" disabled={isLoading || !selectedSlot}>
          {isLoading ? "Creating Booking..." : "Confirm Booking"}
        </Button>
      </div>
    </form>
  );
}
