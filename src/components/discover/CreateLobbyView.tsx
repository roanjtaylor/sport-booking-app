"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { Facility } from "@/types/facility";
import {
  formatDate,
  formatTime,
  formatPrice,
  getDayOfWeek,
  generateTimeSlots,
} from "@/lib/utils";
import { TimeSlot } from "@/types/booking";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";
import { facilitiesApi, lobbiesApi, bookingsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function CreateLobbyView() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for lobby creation
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [notes, setNotes] = useState("");
  const [initialGroupSize, setInitialGroupSize] = useState(1);
  const [groupName, setGroupName] = useState("");
  const [existingBookings, setExistingBookings] = useState<any[]>([]);

  useEffect(() => {
    async function fetchFacilities() {
      try {
        setIsLoading(true);

        // Use the API service to fetch facilities
        const { data, error } = await facilitiesApi.getAllFacilities();

        if (error) throw error;

        setFacilities(data || []);
        setFilteredFacilities(data || []);
      } catch (err) {
        console.error("Error fetching facilities:", err);
        setError("Failed to load facilities");
      } finally {
        setIsLoading(false);
      }
    }

    fetchFacilities();
  }, []);

  // Filter facilities based on search query
  useEffect(() => {
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = facilities.filter(
        (facility) =>
          facility.name.toLowerCase().includes(lowerQuery) ||
          facility.address.toLowerCase().includes(lowerQuery) ||
          facility.city.toLowerCase().includes(lowerQuery) ||
          facility.sportType.some((sport) =>
            sport.toLowerCase().includes(lowerQuery)
          )
      );
      setFilteredFacilities(filtered);
    } else {
      setFilteredFacilities(facilities);
    }
  }, [searchQuery, facilities]);

  // Handle facility selection
  const handleSelectFacility = async (facility: Facility) => {
    setSelectedFacility(facility);
    setDate("");
    setSelectedSlot(null);
    setTimeSlots([]);

    try {
      // Use the API service to get bookings for this facility
      const { data, error } = await bookingsApi.getFacilityBookings(
        facility.id
      );

      if (error) throw error;

      const formattedBookings = (data || []).map((booking) => ({
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
      }));

      setExistingBookings(formattedBookings);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load facility bookings");
    }
  };

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    setSelectedSlot(null);

    if (newDate && selectedFacility) {
      const dayOfWeek = getDayOfWeek(newDate);

      const dateBookings = existingBookings.filter(
        (booking) => booking.date === newDate
      );

      const slots = generateTimeSlots(
        selectedFacility.operatingHours,
        dayOfWeek,
        60, // 1-hour slots
        dateBookings
      );

      setTimeSlots(slots);
    } else {
      setTimeSlots([]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      if (!user) {
        router.push("/auth/login?redirect=/discover?mode=lobby");
        return;
      }

      if (!selectedFacility || !date || !selectedSlot) {
        setError("Please select a facility, date, and time slot");
        return;
      }

      // Use lobbies API to create the lobby
      const { data, error: lobbyError } = await lobbiesApi.createLobby({
        facility_id: selectedFacility.id,
        creator_id: user.id,
        creator_email: user.email || "",
        date,
        start_time: selectedSlot.startTime,
        end_time: selectedSlot.endTime,
        min_players: selectedFacility.min_players,
        initial_group_size: initialGroupSize,
        group_name: groupName || undefined,
        notes: notes || undefined,
      });

      if (lobbyError) throw lobbyError;

      router.push(`/lobbies/${data.id}`);
      router.refresh();
    } catch (err: any) {
      console.error("Error creating lobby:", err);
      setError(err.message || "Failed to create lobby");
    } finally {
      setIsCreating(false);
    }
  };

  // Calculate dates
  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateString = maxDate.toISOString().split("T")[0];

  // Combine loading states
  const combinedLoading = isLoading || authLoading;

  if (combinedLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Create a New Lobby</h2>

      <ErrorDisplay error={error} className="mb-6" />

      {!selectedFacility ? (
        // Facility selection step
        <Card className="p-6">
          <h3 className="font-medium mb-4">Select a Facility</h3>

          <div className="mb-4">
            <Input
              label="Search facilities"
              name="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, location, or sports type..."
            />
          </div>

          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading facilities...</p>
            </div>
          ) : filteredFacilities.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No facilities found
            </p>
          ) : (
            <div className="space-y-4">
              {filteredFacilities.map((facility) => (
                <Card
                  key={facility.id}
                  className="p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => handleSelectFacility(facility)}
                >
                  <div className="flex">
                    <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 mr-4">
                      {facility.imageUrl ? (
                        <img
                          src={facility.imageUrl}
                          alt={facility.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No image
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{facility.name}</h4>
                      <p className="text-sm text-gray-600">
                        {facility.address}, {facility.city}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {facility.sportType.slice(0, 3).map((sport) => (
                          <span
                            key={sport}
                            className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {sport}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="font-medium text-primary-600">
                        {formatPrice(
                          facility.price_per_hour,
                          facility.currency
                        )}
                        /hr
                      </p>
                      <p className="text-xs text-gray-500">
                        Min: {facility.min_players} players
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      ) : (
        // Lobby creation form
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium text-lg">{selectedFacility.name}</h3>
                <p className="text-sm text-gray-600">
                  {selectedFacility.address}, {selectedFacility.city}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedFacility(null)}
              >
                Change Facility
              </Button>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Time Slots
                </label>
                {timeSlots.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No available time slots for this day.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {timeSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => slot.available && setSelectedSlot(slot)}
                        className={`p-2 rounded text-sm text-center ${
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

            <div className="mt-6">
              <Input
                label="Group Name (optional)"
                name="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. 'Tuesday Regulars'"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How many players do you already have?
              </label>
              <input
                type="number"
                min="1"
                max={selectedFacility.min_players - 1}
                value={initialGroupSize}
                onChange={(e) => setInitialGroupSize(parseInt(e.target.value))}
                className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Include yourself and friends who are committed to playing
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes for other players (optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any details for others joining your lobby"
                className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Lobby summary */}
            {selectedSlot && (
              <div className="bg-gray-50 p-4 rounded mt-6">
                <h4 className="font-medium mb-2">Lobby Summary</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-gray-600">Facility:</span>{" "}
                    {selectedFacility.name}
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
                    {selectedFacility.min_players}
                  </p>
                  <p>
                    <span className="text-gray-600">Price per player:</span>{" "}
                    Approximately{" "}
                    {formatPrice(
                      selectedFacility.price_per_hour /
                        selectedFacility.min_players,
                      selectedFacility.currency
                    )}
                  </p>
                </div>
              </div>
            )}
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isCreating || !selectedSlot}>
              {isCreating ? "Creating..." : "Create Lobby"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
