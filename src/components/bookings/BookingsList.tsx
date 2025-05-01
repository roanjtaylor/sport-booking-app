// src/components/bookings/BookingsList.tsx
import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";
import { Booking } from "@/types/booking";

type BookingsListProps = {
  bookings: Booking[];
  showFacilityInfo?: boolean;
};

/**
 * Component for displaying a list of bookings
 */
export function BookingsList({
  bookings,
  showFacilityInfo = true,
}: BookingsListProps) {
  // Handle case when bookings is undefined or null
  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No bookings found
        </h3>
        <p className="text-gray-500 mb-6">You haven't made any bookings yet.</p>
        <Link href="/facilities">
          <Button>Find a Facility</Button>
        </Link>
      </div>
    );
  }

  const isLobbyBooking = (booking: Booking) => {
    return (
      !!booking.lobby_id || (booking.notes && booking.notes.includes("lobby"))
    );
  };

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between">
              {/* Booking details */}
              <div className="mb-4 sm:mb-0">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900 mr-3">
                    {showFacilityInfo
                      ? booking.facility?.name
                      : formatDate(booking.date)}
                  </h3>
                  <StatusBadge
                    status={
                      booking.status.charAt(0).toUpperCase() +
                      booking.status.slice(1)
                    }
                  />

                  {/* Add lobby badge */}
                  {isLobbyBooking(booking) && (
                    <StatusBadge
                      status="Group Booking"
                      variant="group"
                      className="ml-2"
                    />
                  )}
                </div>

                <div className="text-sm text-gray-500 space-y-1">
                  {showFacilityInfo && booking.facility && (
                    <p>{booking.facility.address}</p>
                  )}
                  <p>
                    <span className="font-medium">Date:</span>{" "}
                    {formatDate(booking.date)}
                  </p>
                  <p>
                    <span className="font-medium">Time:</span>{" "}
                    {formatTime(booking.start_time)} -{" "}
                    {formatTime(booking.end_time)}
                  </p>
                  <p>
                    <span className="font-medium">Total:</span>{" "}
                    {formatPrice(
                      booking.total_price,
                      booking.facility?.currency || "USD"
                    )}
                  </p>
                </div>
              </div>

              {/* Booking actions */}
              <div className="flex flex-col space-y-2">
                <Link href={`/bookings/${booking.id}`}>
                  <Button variant="outline" fullWidth size="sm">
                    View Details
                  </Button>
                </Link>

                {booking.status === "pending" && (
                  <Button variant="danger" size="sm" fullWidth>
                    Cancel
                  </Button>
                )}

                {booking.status === "confirmed" && (
                  <Link href={`/facilities/${booking.facility_id}`}>
                    <Button variant="secondary" size="sm" fullWidth>
                      Book Again
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
