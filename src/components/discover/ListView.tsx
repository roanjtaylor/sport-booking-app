"use client";

import { useState, useEffect } from "react";
import { ViewToggle } from "@/components/discover/ViewToggle";
import FacilitiesClient from "@/app/facilities/FacilitiesClient";
import { LobbyList } from "@/components/lobbies/LobbyList";
import { LobbyFilters } from "@/components/lobbies/LobbyFilters";
import { supabase } from "@/lib/supabase";
import { FacilityFilters } from "@/components/facilities/FacilityFilters";
import { Card } from "@/components/ui/Card";
import type { Facility } from "@/types/facility";
import type { Lobby } from "@/types/lobby";

export default function ListView() {
  const [viewMode, setViewMode] = useState<"facilities" | "lobbies">(
    "facilities"
  );
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([]);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [filteredLobbies, setFilteredLobbies] = useState<Lobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get unique sport types from facilities
  const sportTypes = Array.from(
    new Set(facilities.flatMap((f) => f.sportType || []))
  );

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
        setFilteredFacilities(formattedFacilities);

        // Fetch lobbies data
        const { data: lobbiesData, error: lobbiesError } = await supabase
          .from("lobbies")
          .select(`*, facility:facility_id(*)`)
          .eq("status", "open")
          .order("date", { ascending: true });

        if (lobbiesError) throw lobbiesError;

        setLobbies(lobbiesData || []);
        setFilteredLobbies(lobbiesData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleFacilityFilter = (filters: {
    search: string;
    sportType: string;
  }) => {
    let filtered = [...facilities];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (facility) =>
          facility.name.toLowerCase().includes(searchLower) ||
          facility.address.toLowerCase().includes(searchLower)
      );
    }

    if (filters.sportType) {
      filtered = filtered.filter((facility) =>
        facility.sportType.includes(filters.sportType)
      );
    }

    setFilteredFacilities(filtered);
  };

  const handleLobbyFilter = (filters: {
    search: string;
    sportType: string;
    dateRange: string;
  }) => {
    let filtered = [...lobbies];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (lobby) =>
          lobby.facility?.name?.toLowerCase().includes(searchLower) ||
          lobby.facility?.address?.toLowerCase().includes(searchLower) ||
          lobby.notes?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.sportType) {
      filtered = filtered.filter((lobby) =>
        lobby.facility?.sport_type?.includes(filters.sportType)
      );
    }

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
      {viewMode === "facilities" ? (
        <>
          <div className="mb-8">
            <FacilityFilters
              onFilter={handleFacilityFilter}
              sportTypes={sportTypes}
              rightContent={
                <ViewToggle currentView={viewMode} onToggle={setViewMode} />
              }
            />
          </div>
          <FacilitiesClient initialFacilities={filteredFacilities} />
        </>
      ) : (
        <>
          <div className="mb-8">
            <LobbyFilters
              onFilter={handleLobbyFilter}
              sportTypes={sportTypes}
              rightContent={
                <ViewToggle currentView={viewMode} onToggle={setViewMode} />
              }
            />
          </div>
          <LobbyList lobbies={filteredLobbies} />
        </>
      )}
    </div>
  );
}
