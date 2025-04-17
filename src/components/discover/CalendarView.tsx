// src/components/discover/CalendarView.tsx
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDate, formatTime, getDayOfWeek } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Facility } from "@/types/facility";
import { Lobby } from "@/types/lobby";
import SearchResultsList from "./SearchResultsList";

export default function CalendarView() {
  // State for search parameters and results
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);

  // Format today's date for min date attribute
  const today = new Date().toISOString().split("T")[0];

  // Calculate max date (30 days from now) for date picker
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateString = maxDate.toISOString().split("T")[0];

  // Handle search button click
  const handleSearch = async () => {
    if (!selectedDate || !selectedTime) {
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // 1. Search for available facilities at the selected date/time
      const { data: facilitiesData, error: facilitiesError } = await supabase
        .from("facilities")
        .select("*");

      if (facilitiesError) throw facilitiesError;

      // 2. Format facility data
      const formattedFacilities = (facilitiesData || []).map((facility) => ({
        id: facility.id,
        name: facility.name,
        description: facility.description,
        address: facility.address,
        city: facility.city,
        postal_code: facility.postal_code,
        country: facility.country,
        imageUrl: facility.image_url,
        owner_id: facility.owner_id,
        owner_email: facility.owner_email,
        operatingHours: facility.operating_hours,
        price_per_hour: facility.price_per_hour,
        currency: facility.currency,
        sportType: facility.sport_type,
        amenities: facility.amenities || [],
        min_players: facility.min_players,
      }));

      // 3. Filter facilities based on operating hours and existing bookings
      const filteredFacilities = await filterAvailableFacilities(
        formattedFacilities,
        selectedDate,
        selectedTime
      );
      setFacilities(filteredFacilities);

      // 4. Search for available lobbies
      const { data: lobbiesData, error: lobbiesError } = await supabase
        .from("lobbies")
        .select(
          `
          *,
          facility:facility_id(*)
        `
        )
        .eq("date", selectedDate)
        .gte("start_time", selectedTime)
        .order("start_time", { ascending: true });

      if (lobbiesError) throw lobbiesError;

      setLobbies(lobbiesData || []);
      setHasSearched(true);
    } catch (err) {
      console.error("Error searching for availability:", err);
      setError("Failed to load availability data. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Helper function to filter facilities based on availability
  const filterAvailableFacilities = async (
    facilities: Facility[],
    date: string,
    time: string
  ) => {
    // Get day of week from selected date using the utility function
    const dayOfWeek = getDayOfWeek(date);

    // Filter facilities that are open on the selected day and time
    const availableFacilities = facilities.filter((facility) => {
      const dayHours = facility.operatingHours[dayOfWeek];
      if (!dayHours) return false; // Facility is closed on this day

      // Check if selected time is within operating hours
      return time >= dayHours.open && time < dayHours.close;
    });

    // For each available facility, check existing bookings
    const result = await Promise.all(
      availableFacilities.map(async (facility) => {
        const { data: bookings } = await supabase
          .from("bookings")
          .select("*")
          .eq("facility_id", facility.id)
          .eq("date", date)
          .in("status", ["confirmed", "pending"])
          .returns();

        // Check if facility is already booked at the selected time
        const isBooked = (bookings || []).some((booking) => {
          return time >= booking.start_time && time < booking.end_time;
        });

        return isBooked ? null : facility;
      })
    );

    // Filter out null values (booked facilities)
    return result.filter(Boolean) as Facility[];
  };

  return (
    <div>
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Find Available Options</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date
            </label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              max={maxDateString}
            />
          </div>

          <div className="md:col-span-1">
            <label
              htmlFor="time"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Preferred Time
            </label>
            <Input
              id="time"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            />
          </div>

          <div className="md:col-span-1 flex items-end">
            <Button
              onClick={handleSearch}
              disabled={!selectedDate || !selectedTime || isSearching}
              fullWidth
            >
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        {selectedDate && selectedTime && (
          <div className="mt-4 bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-700">
              Searching for available bookings on{" "}
              <span className="font-medium">{formatDate(selectedDate)}</span> at{" "}
              <span className="font-medium">{formatTime(selectedTime)}</span>
            </p>
          </div>
        )}
      </Card>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {hasSearched && (
        <SearchResultsList
          facilities={facilities}
          lobbies={lobbies}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
        />
      )}
    </div>
  );
}
