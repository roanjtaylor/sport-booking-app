"use client";

// src/components/discover/CalendarView.tsx
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDate, formatTime } from "@/lib/utils";

/**
 * Calendar View component for the Discover page
 * Allows users to find available bookings and lobbies by date/time
 * Note: This is a placeholder that will be expanded with actual calendar functionality
 */
export default function CalendarView() {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isSearched, setIsSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Format today's date and calculate max date (30 days from now)
  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateString = maxDate.toISOString().split("T")[0];

  // Handle search button click
  const handleSearch = () => {
    if (!selectedDate || !selectedTime) {
      return;
    }

    setIsLoading(true);

    // Simulate loading delay for the placeholder
    setTimeout(() => {
      setIsLoading(false);
      setIsSearched(true);
    }, 1000);

    // In the real implementation, this would fetch available facilities and lobbies
    // based on the selected date and time
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
              disabled={!selectedDate || !selectedTime || isLoading}
              fullWidth
            >
              {isLoading ? "Searching..." : "Search"}
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

      {isSearched && (
        <div className="space-y-6">
          {/* Placeholder for search results */}
          <div>
            <h3 className="text-lg font-medium mb-3">Available Facilities</h3>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-center text-gray-600 py-4">
                This section will display facilities available at the selected
                date and time.
              </p>
              <div className="bg-white p-4 rounded shadow-sm mb-4 max-w-lg mx-auto">
                <p className="font-medium mb-2">Implementation Plan:</p>
                <ul className="text-left text-sm list-disc pl-5 space-y-1">
                  <li>
                    Query facilities with available slots for the selected
                    date/time
                  </li>
                  <li>Show available time slots around the selected time</li>
                  <li>Display facility details with booking options</li>
                  <li>Allow direct booking from calendar view</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Open Lobbies</h3>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-center text-gray-600 py-4">
                This section will display open lobbies for the selected date and
                time.
              </p>
              <div className="bg-white p-4 rounded shadow-sm mb-4 max-w-lg mx-auto">
                <p className="font-medium mb-2">Implementation Plan:</p>
                <ul className="text-left text-sm list-disc pl-5 space-y-1">
                  <li>Query lobbies scheduled for the selected date/time</li>
                  <li>
                    Display lobby details including current/minimum players
                  </li>
                  <li>Provide options to join existing lobbies</li>
                  <li>Allow creation of new lobbies if none available</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
