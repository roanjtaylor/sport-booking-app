"use client";

// src/app/bookings/[id]/BookingDetailClient.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookingDetail } from "@/components/bookings/BookingDetail";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Booking } from "@/types/booking";
import { LobbyParticipants } from "@/components/bookings/LobbyParticipants";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { EmptyState } from "@/components/ui/EmptyState";
import { authApi, bookingsApi } from "@/lib/api"; // Import from the API layer

interface BookingDetailClientProps {
  id: string;
}

/**
 * Client component for handling booking detail data fetching and interactivity
 */
export default function BookingDetailClient({ id }: BookingDetailClientProps) {
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    // Fetch booking details
    async function fetchBookingDetails() {
      try {
        // Check if user is authenticated
        const { data: user, error: userError } = await authApi.getCurrentUser();

        if (userError || !user) {
          setError("You must be logged in to view booking details");
          setIsLoading(false);
          return;
        }

        // Fetch booking with related information
        const { data: bookingData, error: bookingError } =
          await bookingsApi.getBookingById(id);

        if (bookingError || !bookingData) {
          throw bookingError || new Error("Booking not found");
        }

        // Check if user owns the booking or facility
        const isBookingOwner = bookingData.user_id === user.id;
        const isFacilityOwner = bookingData.facility?.owner_id === user.id;

        setBooking(bookingData);
        setIsOwner(isBookingOwner || isFacilityOwner);
      } catch (err) {
        console.error("Error fetching booking details:", err);
        setError("Failed to load booking details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBookingDetails();
  }, [id]);

  // Handle booking cancellation
  const handleCancelBooking = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await bookingsApi.updateBookingStatus(
        id,
        "cancelled"
      );

      if (error) throw error;

      // Update local state
      setBooking((prev) =>
        prev
          ? {
              ...prev,
              status: "cancelled",
              updated_at: new Date().toISOString(),
            }
          : null
      );

      // Show success message
      alert("Booking cancelled successfully");
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert("Failed to cancel booking");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle booking confirmation (for facility owners)
  const handleConfirmBooking = async () => {
    if (!booking) return;
    setIsProcessing(true);

    try {
      const { data, error } = await bookingsApi.updateBookingStatus(
        id,
        "confirmed"
      );

      if (error) throw error;

      // Update local state
      setBooking((prev) =>
        prev
          ? {
              ...prev,
              status: "confirmed",
              updated_at: new Date().toISOString(),
            }
          : null
      );

      // Show success message
      alert("Booking confirmed successfully");
    } catch (err) {
      console.error("Error confirming booking:", err);
      alert("Failed to confirm booking");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading booking details..." />;
  }

  if (error) {
    return (
      <div className="py-12">
        <Card className="p-6 max-w-md mx-auto">
          <EmptyState
            title="Error"
            message={error}
            variant="compact"
            children={
              <div className="flex justify-center space-x-4 mt-4">
                <Link href="/bookings">
                  <Button variant="secondary">My Bookings</Button>
                </Link>
                <Link href="/auth/login">
                  <Button>Sign In</Button>
                </Link>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  return booking ? (
    <>
      <BookingDetail
        booking={booking}
        isOwner={isOwner}
        onCancelBooking={
          booking.status === "pending" ? handleCancelBooking : undefined
        }
        onConfirmBooking={
          booking.status === "pending" && isOwner
            ? handleConfirmBooking
            : undefined
        }
        isProcessing={isProcessing}
      />

      {/* Add lobby participants section if it's a lobby booking */}
      {booking.lobby_id && <LobbyParticipants lobbyId={booking.lobby_id} />}
    </>
  ) : null;
}
