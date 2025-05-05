// src/components/bookings/BookingFormWrapper.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { LobbyList } from "@/components/lobbies/LobbyList";
import { Lobby } from "@/types/lobby";
import { useBookingForm } from "@/hooks/useBookingForm";
import { BookingType } from "@/components/bookings/BookingTypeSelector";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";
import { TimeSlotPicker } from "@/components/facilities/TimeSlotPicker";
import { NotesField } from "@/components/ui/NotesField";
import { BookingSummary } from "@/components/bookings/BookingSummary";
import { LobbyCreationForm } from "@/components/lobbies/LobbyCreationForm";
import { authApi, lobbiesApi } from "@/lib/api";

// Props type for the BookingFormWrapper component
type BookingFormWrapperProps = {
  facility: any;
  existingBookings: {
    date: string;
    startTime: string;
    endTime: string;
  }[];
  preselectedDate?: string | null;
  preselectedTime?: string | null;
  mode?: string | null; // Mode prop
};

/**
 * Client component wrapper for booking form to handle client-side interactions
 * Now supports mode selection from URL and uses reusable UI components
 */
export default function BookingFormWrapper({
  facility,
  existingBookings,
  preselectedDate,
  preselectedTime,
  mode,
}: BookingFormWrapperProps) {
  const router = useRouter();

  // Determine the initial booking type based on mode
  const determineInitialBookingType = (): BookingType => {
    if (typeof mode === "string" && mode.toLowerCase() === "lobby")
      return "lobby";
    // Default to full booking for any other mode value
    return "full";
  };

  // Convert mode to BookingType
  const bookingMode =
    mode === "lobby" ? "lobby" : mode === "booking" ? "booking" : null;

  // Use our custom booking form hook
  const {
    date,
    selectedSlot,
    setSelectedSlot,
    notes,
    setNotes,
    isLoading,
    setIsLoading,
    error,
    setError,
    timeSlots,
    initialGroupSize,
    setInitialGroupSize,
    groupName,
    setGroupName,
    today,
    maxDateString,
    handleDateChange,
    totalPrice,
    minPlayers,
    checkAuthentication,
    createFullBooking,
    createLobby,
  } = useBookingForm({
    facility,
    existingBookings,
    preselectedDate,
    preselectedTime,
    mode: bookingMode,
  });

  // States specific to BookingFormWrapper
  const [bookingType, setBookingType] = useState<BookingType>(
    determineInitialBookingType()
  );
  const [showLobbyForm, setShowLobbyForm] = useState(false);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [isLoadingLobbies, setIsLoadingLobbies] = useState(false);
  const [isJoiningLobby, setIsJoiningLobby] = useState(false);

  // Fetch open lobbies for this facility
  useEffect(() => {
    if (bookingType === "lobby" && !showLobbyForm) {
      fetchOpenLobbies();
    }
  }, [bookingType, showLobbyForm, facility.id]);

  // Function to fetch open lobbies
  const fetchOpenLobbies = async () => {
    try {
      setIsLoadingLobbies(true);

      // Use the lobbies API service to fetch lobbies for this facility
      const { data, error } = await lobbiesApi.getFacilityLobbies(facility.id);

      if (error) throw error;
      setLobbies(data || []);
    } catch (err) {
      console.error("Error fetching lobbies:", err);
      setError("Failed to load lobbies");
    } finally {
      setIsLoadingLobbies(false);
    }
  };

  // Handle full booking form submission
  const handleFullBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check if user is authenticated
    const user = await checkAuthentication();

    if (!user) {
      router.push(
        `/auth/login?redirect=/facilities/${facility.id}${
          mode ? `?mode=${mode}` : ""
        }`
      );
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

  // Handle lobby creation
  const handleCreateLobby = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is authenticated
    const user = await checkAuthentication();

    if (!user) {
      router.push(
        `/auth/login?redirect=/facilities/${facility.id}${
          mode ? `?mode=${mode}` : ""
        }`
      );
      return;
    }

    // Create the lobby
    const success = await createLobby(user.id, user.email || "", router);

    if (success) {
      // Redirect to the lobby page
      router.push("/lobbies");
      router.refresh();
    }
  };

  // Handle joining a lobby
  const handleJoinLobby = async (lobbyId: string) => {
    try {
      setIsJoiningLobby(true);
      setError(null);

      // Get the current user
      const { data: user, error: userError } = await authApi.getCurrentUser();

      if (userError || !user) {
        router.push(
          `/auth/login?redirect=/facilities/${facility.id}${
            mode ? `?mode=${mode}` : ""
          }`
        );
        return;
      }

      // Use the lobbies API service to join a lobby
      const result = await lobbiesApi.joinLobby(
        lobbyId,
        user.id,
        user.email || ""
      );

      // Success - refresh or redirect
      if (result.isWaiting) {
        alert("You've been added to the waiting list!");
      } else if (result.isFull) {
        alert("You've joined the lobby! The lobby is now full.");
      } else {
        alert("You've joined the lobby successfully!");
      }

      // Redirect to the lobby detail page
      router.push(`/lobbies/${lobbyId}`);
      router.refresh();
    } catch (err: any) {
      console.error("Error joining lobby:", err);
      setError(err.message || "Failed to join lobby");
    } finally {
      setIsJoiningLobby(false);
    }
  };

  // Handle booking type change - only if not forced by mode
  const handleBookingTypeChange = (type: BookingType) => {
    // Only allow changing booking type if there's no mode restriction
    if (!mode) {
      setBookingType(type);
      setShowLobbyForm(false); // Reset lobby form visibility
      setError(null); // Clear any errors
    }
  };

  // If we're in "booking" mode, only show the full booking form
  if (!mode || String(mode).toLowerCase() === "booking") {
    return (
      <div>
        <ErrorDisplay error={error} compact={true} className="mb-4" />

        {/* Full Booking Form */}
        <form onSubmit={handleFullBookingSubmit} className="space-y-4">
          <DatePickerField
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
                placeholder="Any special requests"
              />

              <BookingSummary
                facilityName={facility.name}
                date={date}
                selectedSlot={selectedSlot}
                price={facility.price_per_hour}
                currency={facility.currency}
              />
            </>
          )}

          <Button type="submit" fullWidth disabled={isLoading || !selectedSlot}>
            {isLoading ? "Processing..." : "Proceed to Book"}
          </Button>
        </form>
      </div>
    );
  } else {
    // Only show lobby options
    return (
      <div>
        <ErrorDisplay error={error} compact={true} className="mb-4" />

        {/* Lobby Options */}
        {!showLobbyForm ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Open Lobbies</h3>
              <Button onClick={() => setShowLobbyForm(true)} size="sm">
                Create New Lobby
              </Button>
            </div>

            {isLoadingLobbies ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading lobbies...</p>
              </div>
            ) : (
              <LobbyList
                lobbies={lobbies}
                onJoinLobby={handleJoinLobby}
                isLoading={isJoiningLobby}
              />
            )}
          </div>
        ) : (
          // Use the extracted LobbyCreationForm component
          <LobbyCreationForm
            date={date}
            onDateChange={handleDateChange}
            timeSlots={timeSlots}
            selectedSlot={selectedSlot}
            onSelectSlot={(slot) => setSelectedSlot(slot)}
            initialGroupSize={initialGroupSize}
            onInitialGroupSizeChange={setInitialGroupSize}
            groupName={groupName}
            onGroupNameChange={setGroupName}
            notes={notes}
            onNotesChange={(e) => setNotes(e.target.value)}
            facility={facility}
            minPlayers={minPlayers}
            onSubmit={handleCreateLobby}
            onCancel={() => setShowLobbyForm(false)}
            isLoading={isLoading}
            minDate={today}
            maxDate={maxDateString}
          />
        )}
      </div>
    );
  }
}
