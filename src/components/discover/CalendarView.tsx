// src/components/discover/CalendarView.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate, formatTime, formatPrice, getDayOfWeek } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LobbyList } from "@/components/lobbies/LobbyList";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";
import { bookingsApi, facilitiesApi, lobbiesApi } from "@/lib/api";
import { Facility } from "@/types/facility";
import { Lobby } from "@/types/lobby";
import { useAuth } from "@/contexts/AuthContext";

type BookingMode = "booking" | "lobby" | null;

interface CalendarViewProps {
  mode: BookingMode;
  onCreateLobby?: () => void;
}

// Simple Calendar Component (unchanged)
function SimpleCalendar({ value, onChange, minDate = new Date(), maxDate }) {
  // Get current month and year
  const [currentMonth, setCurrentMonth] = useState(value.getMonth());
  const [currentYear, setCurrentYear] = useState(value.getFullYear());

  // Navigate to previous month
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Navigate to next month
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Monday, 6 = Sunday)
  const getFirstDayOfMonth = (month, year) => {
    let day = new Date(year, month, 1).getDay();
    // Convert Sunday (0) to 6, and shift others back by 1
    return day === 0 ? 6 : day - 1;
  };

  // Generate calendar cells
  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
    }

    // Add actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isSelected = date.toDateString() === value.toDateString();
      const isToday = date.toDateString() === new Date().toDateString();
      const isDisabled = date < minDate || date > maxDate;

      days.push(
        <button
          key={day}
          onClick={() => !isDisabled && onChange(date)}
          disabled={isDisabled}
          className={`h-10 w-10 rounded-full flex items-center justify-center text-sm 
            ${isSelected ? "bg-primary-600 text-white" : ""} 
            ${isToday && !isSelected ? "border border-primary-600" : ""}
            ${
              isDisabled
                ? "text-gray-300 cursor-not-allowed"
                : "hover:bg-gray-100"
            }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  // Month names for header
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="border border-gray-200 rounded-md p-4">
      {/* Calendar header with month/year and navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Previous month"
        >
          &larr;
        </button>
        <span className="font-medium">
          {monthNames[currentMonth]} {currentYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Next month"
        >
          &rarr;
        </button>
      </div>

      {/* Day labels (M T W T F S S) */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
          <div
            key={index}
            className="h-10 w-10 flex items-center justify-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">{generateCalendar()}</div>
    </div>
  );
}

export default function CalendarView({
  mode,
  onCreateLobby,
}: CalendarViewProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // State for calendar and results
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [isLoading, setIsLoading] = useState(false);
  const [isJoiningLobby, setIsJoiningLobby] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [sportTypeFilter, setSportTypeFilter] = useState<string>("");
  const [availableSportTypes, setAvailableSportTypes] = useState<string[]>([]);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);

  // Calculate date range based on view mode
  const getDateRange = (): { startDate: string; endDate: string } => {
    // Create new Date objects to avoid mutating the original selectedDate
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    // Reset time to midnight local time to avoid timezone issues
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (viewMode === "week") {
      const day = start.getDay();
      const adjustedDay = day === 0 ? 7 : day;
      start.setDate(start.getDate() - (adjustedDay - 1));
      end.setDate(end.getDate() + (7 - adjustedDay));
    }

    // Format dates to YYYY-MM-DD using local timezone
    const formatToYYYYMMDD = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatToYYYYMMDD(start),
      endDate: formatToYYYYMMDD(end),
    };
  };

  // Fetch data when date, view mode, or filter changes
  useEffect(() => {
    fetchAvailability();
  }, [selectedDate, viewMode, sportTypeFilter, mode]);

  // Check if a facility is available on a given date
  const isFacilityAvailable = (
    facility: Facility,
    date: string,
    bookings: any[]
  ) => {
    // Get the day of week
    const dayOfWeek = getDayOfWeek(date);

    // Check if facility is open this day
    if (!facility.operatingHours[dayOfWeek]) {
      return false;
    }

    // Get facility bookings for this date
    const facilityBookings = bookings.filter(
      (booking) => booking.facility_id === facility.id && booking.date === date
    );

    // For simplicity, we'll consider a facility available if it has operating hours for the day
    // You could enhance this to check for specific time slot availability if needed
    return true;
  };

  // Fetch available facilities and lobbies
  const fetchAvailability = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const dateRange = getDateRange();
      console.log("Fetching for date range:", dateRange);

      // Fetch bookings to check availability
      const { data: bookings, error: bookingsError } =
        await bookingsApi.getCurrentDateRangeBookings(
          dateRange.startDate,
          dateRange.endDate
        );

      if (bookingsError) throw bookingsError;
      setExistingBookings(bookings || []);

      // Only fetch data needed based on mode
      if (mode === "booking" || !mode) {
        // Fetch all facilities
        const { data: facilitiesData, error: facilitiesError } =
          await facilitiesApi.getAllFacilities();

        if (facilitiesError) throw facilitiesError;

        // Extract sport types for filter
        const { data: sportTypes, error: sportTypesError } =
          await facilitiesApi.getAllSportTypes();

        if (sportTypesError) throw sportTypesError;
        setAvailableSportTypes(sportTypes);

        // Filter facilities based on availability and sports type
        let filteredFacilities: Facility[] = [];

        if (viewMode === "day") {
          // For day view, check just the selected date
          filteredFacilities = (facilitiesData || []).filter((facility) => {
            // Apply sport type filter
            if (
              sportTypeFilter &&
              !facility.sportType.includes(sportTypeFilter)
            ) {
              return false;
            }

            // Check availability
            return isFacilityAvailable(
              facility,
              dateRange.startDate,
              bookings || []
            );
          });
        } else {
          // For week view, include facilities available on any day in the range
          const weekFacilities = new Map<string, Facility>();

          // Check each day in the date range
          let currentDate = new Date(dateRange.startDate);
          const endDateObj = new Date(dateRange.endDate);

          while (currentDate <= endDateObj) {
            const dateString = currentDate.toISOString().split("T")[0];

            (facilitiesData || []).forEach((facility) => {
              // Apply sport type filter
              if (
                sportTypeFilter &&
                !facility.sportType.includes(sportTypeFilter)
              ) {
                return;
              }

              // Check availability for this date
              if (isFacilityAvailable(facility, dateString, bookings || [])) {
                weekFacilities.set(facility.id, facility);
              }
            });

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
          }

          filteredFacilities = Array.from(weekFacilities.values());
        }

        setFacilities(filteredFacilities);
      } else {
        // Reset facilities if not in booking mode
        setFacilities([]);
      }

      // Only fetch lobbies in lobby mode
      if (mode === "lobby" || !mode) {
        // Fetch lobbies for the date range
        const { data: lobbiesData, error: lobbiesError } =
          await lobbiesApi.getLobbiesForDateRange(
            dateRange.startDate,
            dateRange.endDate
          );

        if (lobbiesError) throw lobbiesError;

        // Filter lobbies by sport type if needed
        const filteredLobbies =
          lobbiesData && sportTypeFilter
            ? lobbiesData.filter((lobby) =>
                lobby.facility?.sport_type?.includes(sportTypeFilter)
              )
            : lobbiesData || [];

        setLobbies(filteredLobbies);
      } else {
        // Reset lobbies if not in lobby mode
        setLobbies([]);
      }
    } catch (err) {
      console.error("Error fetching availability:", err);
      setError("Failed to load availability data");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle date selection from calendar
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Navigate to previous day/week
  const handlePrevious = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setSelectedDate(newDate);
  };

  // Navigate to next day/week
  const handleNext = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setSelectedDate(newDate);
  };

  // Join a lobby using the existing function
  const handleJoinLobby = async (lobbyId: string) => {
    try {
      setIsJoiningLobby(true);
      setError(null);

      if (!user) {
        router.push(`/auth/login?redirect=/discover?mode=lobby`);
        return;
      }

      // Use lobbiesApi to join the lobby
      const result = await lobbiesApi.joinLobby(
        lobbyId,
        user.id,
        user.email || ""
      );

      // Show success message and redirect to lobby
      if (result.isWaiting) {
        alert("You've been added to the waiting list!");
      } else if (result.isFull) {
        alert("You've joined the lobby! The lobby is now full.");
      } else {
        alert("You've joined the lobby successfully!");
      }

      // Redirect to the lobby detail page
      router.push(`/lobbies/${lobbyId}`);
    } catch (err: any) {
      console.error("Error joining lobby:", err);
      setError(err.message || "Failed to join lobby");
    } finally {
      setIsJoiningLobby(false);
    }
  };

  // Format date range for display
  const formatDateRange = () => {
    const { startDate, endDate } = getDateRange();
    if (viewMode === "day") {
      return formatDate(startDate);
    } else {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
  };

  // Get today's date
  const today = new Date();

  // Calculate max date (30 days from now)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  // Combine loading states to prevent UI flickering
  const combinedLoading = isLoading || authLoading;

  return (
    <div>
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h2 className="text-xl font-semibold mb-4 md:mb-0">Calendar View</h2>

          {/* Day/Week Toggle */}
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setViewMode("day")}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                viewMode === "day"
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                viewMode === "week"
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              Week
            </button>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" onClick={handlePrevious}>
            &larr; Previous {viewMode === "day" ? "Day" : "Week"}
          </Button>
          <h3 className="text-lg font-medium">{formatDateRange()}</h3>
          <Button variant="outline" onClick={handleNext}>
            Next {viewMode === "day" ? "Day" : "Week"} &rarr;
          </Button>
        </div>

        {/* Calendar Component */}
        <div className="mb-6">
          <SimpleCalendar
            value={selectedDate}
            onChange={handleDateChange}
            minDate={today}
            maxDate={maxDate}
          />
        </div>

        {/* Sport Type Filter */}
        <div className="mb-4">
          <select
            className="p-2 border border-gray-300 rounded-md bg-white w-full sm:w-48"
            value={sportTypeFilter}
            onChange={(e) => setSportTypeFilter(e.target.value)}
          >
            <option value="">All types</option>
            {availableSportTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Loading State */}
      {combinedLoading ? (
        <LoadingIndicator message="Loading availability..." />
      ) : error ? (
        <ErrorDisplay error={error} className="mb-6" />
      ) : (
        <div className="space-y-8">
          {/* Available Facilities Section - only shown in "booking" mode */}
          {mode === "booking" && facilities.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Available Facilities
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {facilities.map((facility) => (
                  <Card
                    key={facility.id}
                    className="h-full flex flex-col transition-shadow hover:shadow-lg"
                  >
                    {/* Facility image */}
                    <div className="bg-gray-200 h-48 relative">
                      {facility.imageUrl ? (
                        <img
                          src={facility.imageUrl}
                          alt={facility.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No image available
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-grow flex flex-col">
                      <h3 className="text-lg font-semibold mb-1">
                        {facility.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {facility.address}
                      </p>

                      {/* Sport types */}
                      <div className="mb-3 flex flex-wrap gap-1">
                        {facility.sportType.map((sport) => (
                          <span
                            key={sport}
                            className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded"
                          >
                            {sport.charAt(0).toUpperCase() + sport.slice(1)}
                          </span>
                        ))}
                      </div>

                      {/* Description */}
                      <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                        {facility.description}
                      </p>

                      {/* Price and booking button */}
                      <div className="mt-auto flex justify-between items-center">
                        <span className="font-medium text-primary-600">
                          {formatPrice(
                            facility.price_per_hour,
                            facility.currency
                          )}
                          /hour
                        </span>
                        <Link
                          href={`/facilities/${facility.id}?date=${
                            getDateRange().startDate
                          }&time=${
                            facility.operatingHours[
                              getDayOfWeek(getDateRange().startDate)
                            ]?.open || "09:00"
                          }&mode=${mode}`}
                        >
                          <Button variant="primary" size="sm">
                            Book Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Available Lobbies Section - only shown in "lobby" mode */}
          {mode === "lobby" && lobbies.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Active Lobbies</h2>
              <LobbyList
                lobbies={lobbies}
                onJoinLobby={handleJoinLobby}
                isLoading={isJoiningLobby}
                gridLayout={true}
              />
            </div>
          )}

          {/* Empty state - specific to each mode */}
          {((mode === "booking" && facilities.length === 0) ||
            (mode === "lobby" && lobbies.length === 0)) && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No {mode === "booking" ? "facilities" : "lobbies"} available for
                the selected {viewMode === "day" ? "day" : "week"}.
              </p>
              <p className="text-gray-500 mt-2">
                Try selecting a different date or view mode.
              </p>
            </div>
          )}

          {/* If no mode selected, show combined empty state */}
          {!mode && facilities.length === 0 && lobbies.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No facilities or lobbies available for the selected{" "}
                {viewMode === "day" ? "day" : "week"}.
              </p>
              <p className="text-gray-500 mt-2">
                Try selecting a different date or view mode.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
