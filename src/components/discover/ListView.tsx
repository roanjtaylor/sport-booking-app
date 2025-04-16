"use client";

// src/components/discover/ListView.tsx
import { useState, useEffect } from "react";
import FacilitiesClient from "@/app/facilities/FacilitiesClient";
import { Facility } from "@/types/facility";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { LobbyList } from "@/components/lobbies/LobbyList";
import { LobbyFilters } from "@/components/lobbies/LobbyFilters";
import { Lobby } from "@/types/lobby";

/**
 * List View component for the Discover page
 * Provides a toggle between facilities and lobbies
 */
export default function ListView() {
  // State for toggle between facilities and lobbies
  const [viewMode, setViewMode] = useState("facilities");

  // State for facility and lobby data
  const [facilities, setFacilities] = useState([]);
  const [lobbies, setLobbies] = useState([]);
  const [filteredLobbies, setFilteredLobbies] = useState<Lobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial data when component mounts
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch facilities data
        const { data: facilitiesData, error: facilitiesError } = await supabase
          .from("facilities")
          .select("*")
          .order("created_at", { ascending: false });

        if (facilitiesError) throw facilitiesError;

        // Format facilities data
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
        }));

        setFacilities(formattedFacilities);

        // Fetch lobbies data
        const { data: lobbiesData, error: lobbiesError } = await supabase
          .from("lobbies")
          .select(
            `
            *,
            facility:facility_id(*)
          `
          )
          .eq("status", "open")
          .order("date", { ascending: true });

        if (lobbiesError) throw lobbiesError;

        setLobbies(lobbiesData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    setFilteredLobbies(lobbies);
  }, [lobbies]);

  // Toggle handler for switching between facilities and lobbies
  const handleToggleView = (mode) => {
    setViewMode(mode);
  };

  // Filter lobbies based on selected filters
  const handleLobbyFilter = (filters: {
    search: string;
    sportType: string;
    dateRange: string;
  }) => {
    let filtered = [...lobbies];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (lobby) =>
          lobby.facility?.name?.toLowerCase().includes(searchLower) ||
          lobby.facility?.address?.toLowerCase().includes(searchLower) ||
          lobby.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sport type filter
    if (filters.sportType) {
      filtered = filtered.filter((lobby) =>
        lobby.facility?.sport_type?.includes(filters.sportType)
      );
    }

    // Apply date range filter
    if (filters.dateRange) {
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      filtered = filtered.filter((lobby) => {
        if (filters.dateRange === "today") {
          return lobby.date === today;
        } else if (filters.dateRange === "tomorrow") {
          return lobby.date === tomorrowStr;
        } else if (filters.dateRange === "week") {
          // Check if within next 7 days
          const lobbyDate = new Date(lobby.date);
          const weekFromNow = new Date();
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          return lobbyDate <= weekFromNow;
        }
        return true;
      });
    }

    setFilteredLobbies(filtered);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-primary-600 hover:underline"
        >
          Try again
        </button>
      </Card>
    );
  }

  return (
    <div>
      {/* Toggle control */}
      <div className="flex justify-end mb-6">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => handleToggleView("facilities")}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              viewMode === "facilities"
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            Full Bookings
          </button>
          <button
            type="button"
            onClick={() => handleToggleView("lobbies")}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              viewMode === "lobbies"
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            Lobbies
          </button>
        </div>
      </div>

      {/* Content based on selected view mode */}
      {viewMode === "facilities" ? (
        <FacilitiesClient initialFacilities={facilities} />
      ) : (
        <div>
          {/* Add the LobbyFilters component with the handler */}
          <LobbyFilters
            onFilter={handleLobbyFilter}
            sportTypes={Array.from(
              new Set(facilities.flatMap((f) => f.sportType))
            )}
          />

          {filteredLobbies.length > 0 ? (
            <LobbyList lobbies={filteredLobbies} gridLayout={true} />
          ) : (
            <Card className="p-6 text-center">
              <p className="text-gray-500 mb-4">No matching lobbies found.</p>
              <p>Try adjusting your filters or create a new lobby.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
