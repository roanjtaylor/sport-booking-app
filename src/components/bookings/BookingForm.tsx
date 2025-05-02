// src/components/bookings/BookingForm.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TimeSlotPicker } from "@/components/facilities/TimeSlotPicker";
import { useBookingForm } from "@/hooks/useBookingForm";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { NotesField } from "@/components/ui/NotesField";
import { BookingSummary } from "@/components/bookings/BookingSummary";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";

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
    setSelectedSlot,
    notes,
    setNotes,
    isLoading,
    error,
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
      <ErrorDisplay error={error} />

      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Make a Booking</h2>

        <DatePickerField
          label="Select Date"
          value={date}
          onChange={handleDateChange}
          minDate={today}
          maxDate={maxDateString}
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
          <>
            <NotesField
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-6"
            />

            <BookingSummary
              facilityName={facility.name}
              date={date}
              selectedSlot={selectedSlot}
              price={totalPrice}
              currency={facility?.currency || "USD"}
              className="mt-4"
            />
          </>
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
