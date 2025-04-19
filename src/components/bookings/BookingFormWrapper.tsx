// src/components/bookings/BookingFormWrapper.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  formatDate,
  formatTime,
  getDayOfWeek,
  generateTimeSlots,
  formatPrice,
} from "@/lib/utils";
import { TimeSlot } from "@/types/booking";
import { Facility } from "@/types/facility";
import {
  BookingTypeSelector,
  BookingType,
} from "@/components/bookings/BookingTypeSelector";
import { LobbyList } from "@/components/lobbies/LobbyList";
import { Lobby } from "@/types/lobby";
import { joinLobby } from "@/lib/lobbies";

// Props type for the BookingFormWrapper component
type BookingFormWrapperProps = {
  facility: Facility;
  existingBookings: {
    date: string;
    startTime: string;
    endTime: string;
  }[];
  preselectedDate?: string | null;
  preselectedTime?: string | null;
  mode?: string | null; // New mode prop
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
    if (mode === "booking") return "full";
    if (mode === "lobby") return "lobby";
    // Default to full booking if no mode specified
    return "full";
  };

  // State for form inputs
  const [date, setDate] = useState(preselectedDate || "");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // New state for lobby functionality - only initialize if needed
  const [bookingType, setBookingType] = useState<BookingType>(
    determineInitialBookingType()
  );
  const [showLobbyForm, setShowLobbyForm] = useState(false);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [isLoadingLobbies, setIsLoadingLobbies] = useState(false);
  const [isJoiningLobby, setIsJoiningLobby] = useState(false);

  const [initialGroupSize, setInitialGroupSize] = useState(1);
  const [groupName, setGroupName] = useState("");

  // Get min players from facility or default to 10
  const minPlayers = facility.min_players || 10;

  // If preselected time exists, find the matching time slot
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

  // Handle date change for form
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    setSelectedSlot(null); // Reset selected slot

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

  // Calculate total price
  const totalPrice = selectedSlot ? facility.price_per_hour : 0;

  // Handle full booking form submission
  const handleFullBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!selectedSlot) {
      setError("Please select a time slot");
      setIsLoading(false);
      return;
    }

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(
          `/auth/login?redirect=/facilities/${facility.id}${
            mode ? `?mode=${mode}` : ""
          }`
        );
        return;
      }

      // Create the booking
      const { data, error: bookingError } = await supabase
        .from("bookings")
        .insert([
          {
            facility_id: facility.id,
            user_id: user.id,
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

      // Success - redirect to bookings page
      alert(
        "Booking created successfully! The facility owner will review your request."
      );
      router.push("/bookings");
      router.refresh();
    } catch (err) {
      console.error("Error creating booking:", err);
      setError(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle joining a lobby
  const handleJoinLobby = async (lobbyId: string) => {
    try {
      setIsJoiningLobby(true);
      setError(null);

      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
      if (result.isFull) {
        alert(
          "Congratulations! The lobby is now full and a booking has been created."
        );
      } else {
        alert("You have successfully joined the lobby!");
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

  // Calculate minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  // Calculate maximum date (30 days from now)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateString = maxDate.toISOString().split("T")[0];

  // If we're in "booking" mode, only show the full booking form
  if (mode === "booking" || (!mode && bookingType === "full")) {
    return (
      <div>
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        {/* Only show booking type selector if no mode is forced */}
        {!mode && (
          <BookingTypeSelector
            selectedType={bookingType}
            onChange={handleBookingTypeChange}
            minPlayers={minPlayers}
          />
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
  }

  // If we're in "lobby" mode, only show the lobby options
  if (mode === "lobby" || (!mode && bookingType === "lobby")) {
    return (
      <div>
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        {/* Only show booking type selector if no mode is forced */}
        {!mode && (
          <BookingTypeSelector
            selectedType={bookingType}
            onChange={handleBookingTypeChange}
            minPlayers={minPlayers}
          />
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
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsLoading(true);
                setError(null);

                try {
                  // Check authentication
                  const {
                    data: { user },
                  } = await supabase.auth.getUser();
                  if (!user) {
                    router.push(
                      `/auth/login?redirect=/facilities/${facility.id}${
                        mode ? `?mode=${mode}` : ""
                      }`
                    );
                    return;
                  }

                  // Validate date and time slot
                  if (!date || !selectedSlot) {
                    setError("Please select a date and time slot");
                    return;
                  }

                  // Create the lobby
                  const { data, error: lobbyError } = await supabase
                    .from("lobbies")
                    .insert({
                      facility_id: facility.id,
                      creator_id: user.id,
                      creator_email: user.email,
                      date,
                      start_time: selectedSlot.startTime,
                      end_time: selectedSlot.endTime,
                      min_players: minPlayers,
                      current_players: initialGroupSize, // Use the initial group size
                      initial_group_size: initialGroupSize,
                      group_name: groupName || null,
                      status:
                        initialGroupSize >= minPlayers ? "filled" : "open",
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
                      user_id: user.id,
                    });

                  if (participantError) throw participantError;

                  // Redirect to the lobby page
                  router.push(`/lobbies/${data.id}`);
                  router.refresh();
                } catch (err: any) {
                  console.error("Error creating lobby:", err);
                  setError(err.message || "Failed to create lobby");
                } finally {
                  setIsLoading(false);
                }
              }}
              className="space-y-4"
            >
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

  // Fallback - should never reach here due to the mode checking above
  return null;
}
