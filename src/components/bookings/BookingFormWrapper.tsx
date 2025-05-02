// src/components/bookings/BookingFormWrapper.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";
import { LobbyList } from "@/components/lobbies/LobbyList";
import { Lobby } from "@/types/lobby";
import { joinLobby } from "@/lib/lobbies";
import { useBookingForm } from "@/hooks/useBookingForm";
import {
  BookingTypeSelector,
  BookingType,
} from "@/components/bookings/BookingTypeSelector";

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
 * Now supports mode selection from URL
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
    setSelectedSlot, // Important! This needs to be used properly
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

      // Fetch lobbies with facility information
      const { data: lobbiesData, error } = await supabase
        .from("lobbies")
        .select(
          `
          *,
          facility:facility_id(*)
        `
        )
        .eq("facility_id", facility.id)
        .eq("status", "open")
        .order("date", { ascending: true });

      if (error) throw error;

      // For each lobby, fetch the creator info
      const lobbiesWithCreators = await Promise.all(
        (lobbiesData || []).map(async (lobby) => {
          // Get creator info
          const { data: creator } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", lobby.creator_id)
            .single();

          return {
            ...lobby,
            creator,
          };
        })
      );

      setLobbies(lobbiesWithCreators || []);
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
      // Redirect to the lobby page (actual redirect is handled in the hook)
      router.push(`/lobbies`);
      router.refresh();
    }
  };

  // Handle joining a lobby
  const handleJoinLobby = async (lobbyId: string) => {
    try {
      setIsJoiningLobby(true);
      setError(null);

      // Get the current user
      const user = await checkAuthentication();

      if (!user) {
        router.push(
          `/auth/login?redirect=/facilities/${facility.id}${
            mode ? `?mode=${mode}` : ""
          }`
        );
        return;
      }

      const result = await joinLobby(lobbyId, user.id, user.email || "");

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
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        {/* Full Booking Form */}
        <form onSubmit={handleFullBookingSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={date}
              onChange={handleDateChange}
              min={today}
              max={maxDateString}
              required
              className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {date && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Time Slots
              </label>
              {timeSlots.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No available time slots for this day.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => slot.available && setSelectedSlot(slot)}
                      className={`p-2 text-sm rounded text-center ${
                        !slot.available
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : selectedSlot?.startTime === slot.startTime
                          ? "bg-primary-600 text-white"
                          : "bg-white border border-gray-300 text-gray-700 hover:border-primary-500"
                      }`}
                    >
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedSlot && (
            <>
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests"
                  className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                ></textarea>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <div className="flex justify-between text-sm mb-1">
                  <span>Price per hour</span>
                  <span>
                    {formatPrice(facility.price_per_hour, facility.currency)}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>
                    {formatPrice(facility.price_per_hour, facility.currency)}
                  </span>
                </div>
              </div>
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
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

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
          // Create Lobby Form
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-4">Create New Lobby</h3>
            <form onSubmit={handleCreateLobby} className="space-y-4">
              {/* Date selection */}
              <div>
                <label
                  htmlFor="lobby-date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date
                </label>
                <input
                  type="date"
                  id="lobby-date"
                  value={date}
                  onChange={handleDateChange}
                  min={today}
                  max={maxDateString}
                  required
                  className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Time slot selection */}
              {date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Time Slots
                  </label>
                  {timeSlots.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No available time slots for this day.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map((slot, index) => (
                        <button
                          key={index}
                          type="button"
                          disabled={!slot.available}
                          onClick={() =>
                            slot.available && setSelectedSlot(slot)
                          }
                          className={`p-2 text-sm rounded text-center ${
                            !slot.available
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : selectedSlot?.startTime === slot.startTime
                              ? "bg-primary-600 text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:border-primary-500"
                          }`}
                        >
                          {formatTime(slot.startTime)} -{" "}
                          {formatTime(slot.endTime)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  How many players do you already have?
                </label>
                <input
                  type="number"
                  min="1"
                  max={minPlayers - 1}
                  value={initialGroupSize}
                  onChange={(e) =>
                    setInitialGroupSize(parseInt(e.target.value))
                  }
                  className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include yourself and friends who are committed to playing
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name (optional)
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. 'Tuesday Regulars'"
                  className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Notes field */}
              {selectedSlot && (
                <div>
                  <label
                    htmlFor="lobby-notes"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Notes for other players (optional)
                  </label>
                  <textarea
                    id="lobby-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any details for others joining your lobby"
                    className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}

              {/* Lobby summary */}
              {selectedSlot && (
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">Lobby Summary</h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-gray-600">Facility:</span>{" "}
                      {facility.name}
                    </p>
                    <p>
                      <span className="text-gray-600">Date:</span>{" "}
                      {formatDate(date)}
                    </p>
                    <p>
                      <span className="text-gray-600">Time:</span>{" "}
                      {formatTime(selectedSlot.startTime)} -{" "}
                      {formatTime(selectedSlot.endTime)}
                    </p>
                    <p>
                      <span className="text-gray-600">Players needed:</span>{" "}
                      {minPlayers}
                    </p>
                    <p>
                      <span className="text-gray-600">Price per player:</span>{" "}
                      Approximately{" "}
                      {formatPrice(
                        facility.price_per_hour / minPlayers,
                        facility.currency
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowLobbyForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !selectedSlot}>
                  {isLoading ? "Creating..." : "Create Lobby"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }
}
