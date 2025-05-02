// src/components/bookings/BookingSummary.tsx
import React from "react";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";
import { TimeSlot } from "@/types/booking";

interface BookingSummaryProps {
  facilityName: string;
  date: string;
  selectedSlot: TimeSlot | null;
  price: number;
  currency?: string;
  playersNeeded?: number;
  isLobby?: boolean;
  className?: string;
}

/**
 * Reusable booking summary component that displays booking details
 * Used in both regular bookings and lobby creation
 */
export function BookingSummary({
  facilityName,
  date,
  selectedSlot,
  price,
  currency = "USD",
  playersNeeded,
  isLobby = false,
  className = "",
}: BookingSummaryProps) {
  if (!selectedSlot) return null;

  return (
    <div className={`bg-gray-50 p-4 rounded ${className}`}>
      <h4 className="font-medium mb-2">
        {isLobby ? "Lobby Summary" : "Booking Summary"}
      </h4>
      <div className="text-sm space-y-1">
        <p>
          <span className="text-gray-600">Facility:</span> {facilityName}
        </p>
        <p>
          <span className="text-gray-600">Date:</span> {formatDate(date)}
        </p>
        <p>
          <span className="text-gray-600">Time:</span>{" "}
          {formatTime(selectedSlot.startTime)} -{" "}
          {formatTime(selectedSlot.endTime)}
        </p>

        {/* Show players needed for lobby bookings */}
        {isLobby && playersNeeded && (
          <p>
            <span className="text-gray-600">Players needed:</span>{" "}
            {playersNeeded}
          </p>
        )}

        {/* Show different price info based on booking type */}
        {isLobby && playersNeeded ? (
          <p>
            <span className="text-gray-600">Price per player:</span>{" "}
            Approximately {formatPrice(price / playersNeeded, currency)}
          </p>
        ) : (
          <p className="font-medium mt-2">
            <span className="text-gray-600">Total Price:</span>{" "}
            {formatPrice(price, currency)}
          </p>
        )}
      </div>
    </div>
  );
}
