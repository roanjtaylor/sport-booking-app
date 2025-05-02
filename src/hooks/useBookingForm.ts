// src/hooks/useBookingForm.ts
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Facility } from "@/types/facility";
import { TimeSlot } from "@/types/booking";
import {
  formatDate,
  formatTime,
  formatPrice,
  getDayOfWeek,
  generateTimeSlots,
} from "@/lib/utils";

type BookingMode = "booking" | "lobby" | null;

interface UseBookingFormProps {
  facility: Facility;
  existingBookings: {
    date: string;
    startTime: string;
    endTime: string;
  }[];
  preselectedDate?: string | null;
  preselectedTime?: string | null;
  mode?: BookingMode;
}

export function useBookingForm({
  facility,
  existingBookings,
  preselectedDate,
  preselectedTime,
  mode,
}: UseBookingFormProps) {
  // Form state
  const [date, setDate] = useState(preselectedDate || "");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Get min players from facility or default to 10
  const minPlayers = facility.min_players || 10;

  // State for lobby functionality
  const [initialGroupSize, setInitialGroupSize] = useState(1);
  const [groupName, setGroupName] = useState("");

  // Calculate total price
  const totalPrice = selectedSlot ? facility.price_per_hour : 0;

  // Calculate minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  // Calculate maximum date (30 days from now)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateString = maxDate.toISOString().split("T")[0];

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    setSelectedSlot(null); // Reset selected slot when date changes

    if (newDate) {
      // Get day of week from selected date
      const dayOfWeek = getDayOfWeek(newDate);

      // Make sure operating_hours is in the expected format
      const operatingHours = facility.operatingHours || {};

      // Filter existing bookings for selected date
      const dateBookings = existingBookings.filter(
        (booking) => booking.date === newDate
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

  // Effect to set preselected time slot if available
  useEffect(() => {
    if (preselectedDate && preselectedTime && timeSlots.length > 0) {
      const matchingSlot = timeSlots.find(
        (slot) => slot.startTime === preselectedTime && slot.available
      );

      if (matchingSlot) {
        setSelectedSlot(matchingSlot);
      }
    }
  }, [preselectedDate, preselectedTime, timeSlots]);

  // Create full booking submission handler
  const createFullBooking = async (userId: string, router: any) => {
    if (!selectedSlot) {
      setError("Please select a time slot");
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create the booking
      const { data, error: bookingError } = await supabase
        .from("bookings")
        .insert([
          {
            facility_id: facility.id,
            user_id: userId,
            date,
            start_time: selectedSlot.startTime,
            end_time: selectedSlot.endTime,
            status: "pending",
            total_price: totalPrice,
            notes,
          },
        ])
        .select();

      if (bookingError) {
        console.error("Supabase error:", bookingError);
        throw new Error("Failed to create booking. Please try again.");
      }

      // Success
      return true;
    } catch (err) {
      console.error("Error creating booking:", err);
      setError(err instanceof Error ? err.message : "Failed to create booking");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Create lobby submission handler
  const createLobby = async (
    userId: string,
    userEmail: string,
    router: any
  ) => {
    if (!selectedSlot) {
      setError("Please select a time slot");
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create the lobby
      const { data, error: lobbyError } = await supabase
        .from("lobbies")
        .insert({
          facility_id: facility.id,
          creator_id: userId,
          creator_email: userEmail,
          date,
          start_time: selectedSlot.startTime,
          end_time: selectedSlot.endTime,
          min_players: minPlayers,
          current_players: initialGroupSize,
          initial_group_size: initialGroupSize,
          group_name: groupName || null,
          status: initialGroupSize >= minPlayers ? "filled" : "open",
          notes: notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (lobbyError) throw lobbyError;

      // Add creator as participant
      const { error: participantError } = await supabase
        .from("lobby_participants")
        .insert({
          lobby_id: data.id,
          user_id: userId,
          participant_email: userEmail,
        });

      if (participantError) throw participantError;

      return true;
    } catch (err) {
      console.error("Error creating lobby:", err);
      setError(err instanceof Error ? err.message : "Failed to create lobby");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check if user is authenticated
  const checkAuthentication = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error("Authentication error:", error);
      return null;
    }
  };

  return {
    // Form state
    date,
    setDate,
    selectedSlot,
    setSelectedSlot,
    notes,
    setNotes,
    isLoading,
    setIsLoading,
    error,
    setError,
    timeSlots,

    // Lobby specific state
    initialGroupSize,
    setInitialGroupSize,
    groupName,
    setGroupName,

    // Date constraints
    today,
    maxDateString,

    // Core helpers
    handleDateChange,
    totalPrice,
    minPlayers,
    facility,

    // Authentication and submission handlers
    checkAuthentication,
    createFullBooking,
    createLobby,
  };
}
