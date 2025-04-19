// src/components/discover/ListView.tsx
"use client";

import { useState, useEffect } from "react";
import FacilitiesClient from "@/app/facilities/FacilitiesClient";
import { LobbyList } from "@/components/lobbies/LobbyList";
import { LobbyFilters } from "@/components/lobbies/LobbyFilters";
import { supabase } from "@/lib/supabase";
import { FacilityFilters } from "@/components/facilities/FacilityFilters";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import CreateLobbyView from "@/components/discover/CreateLobbyView";
import type { Facility } from "@/types/facility";
import type { Lobby } from "@/types/lobby";
import { useRouter } from "next/navigation";
import { joinLobby } from "@/lib/lobbies";

type BookingMode = "booking" | "lobby" | null;

interface ListViewProps {
  mode: BookingMode;
  onCreateLobby?: () => void;
}

export default function ListView({ mode, onCreateLobby }: ListViewProps) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([]);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [filteredLobbies, setFilteredLobbies] = useState<Lobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoiningLobby, setIsJoiningLobby] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Only fetch what we need based on mode
        if (mode === "booking" || !mode) {
          // Fetch facilities data
          const { data: facilitiesData, error: facilitiesError } =
            await supabase
              .from("facilities")
              .select("*")
              .order("created_at", { ascending: false });

          if (facilitiesError) throw facilitiesError;

          // Format facilities data
          const formattedFacilities = (facilitiesData || []).map(
            (facility) => ({
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
            })
          );

          setFacilities(formattedFacilities);
          setFilteredFacilities(formattedFacilities);
        }

        if (mode === "lobby" || !mode) {
          // Fetch lobbies data
          const { data: lobbiesData, error: lobbiesError } = await supabase
            .from("lobbies")
            .select(`*, facility:facility_id(*)`)
            .order("date", { ascending: true });

          if (lobbiesError) throw lobbiesError;

          setLobbies(lobbiesData || []);
          setFilteredLobbies(lobbiesData || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [mode]);

  // Get unique sport types from facilities
  const sportTypes = Array.from(
    new Set(facilities.flatMap((f) => f.sportType || []))
  );

  const handleFacilityFilter = (filters: {
    search: string;
    sportType: string;
    priceSort: string;
  }) => {
    let filtered = [...facilities];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (facility) =>
          facility.name.toLowerCase().includes(searchLower) ||
          facility.description.toLowerCase().includes(searchLower) ||
          facility.address.toLowerCase().includes(searchLower) ||
          facility.city.toLowerCase().includes(searchLower)
      );
    }

    // Apply sport type filter
    if (filters.sportType) {
      filtered = filtered.filter((facility) =>
        facility.sportType.includes(filters.sportType)
      );
    }

    // Apply price sorting
    if (filters.priceSort === "low") {
      filtered.sort((a, b) => a.price_per_hour - b.price_per_hour);
    } else if (filters.priceSort === "high") {
      filtered.sort((a, b) => b.price_per_hour - a.price_per_hour);
    }

    setFilteredFacilities(filtered);
  };

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
        lobby.facility?.sportType?.includes(filters.sportType)
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

  const handleJoinLobby = async (lobbyId: string) => {
    try {
      setIsJoiningLobby(true);
      setJoinError(null);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/auth/login?redirect=/discover?mode=lobby`);
        return;
      }

      // Use the centralised joinLobby function
      const result = await joinLobby(lobbyId, user.id, user.email || "");

      // Show success message
      if (result.isWaiting) {
        alert("You've been added to the waiting list!");
      } else if (result.isFull) {
        alert("You've joined the lobby! The lobby is now full.");
      } else {
        alert("You've joined the lobby successfully!");
      }

      // Refresh the lobbies data to show updated status
      const { data: updatedLobbies } = await supabase
        .from("lobbies")
        .select(`*, facility:facility_id(*)`)
        .order("date", { ascending: true });

      if (updatedLobbies) {
        setLobbies(updatedLobbies);
        setFilteredLobbies(updatedLobbies);
      }

      // Redirect to the lobby detail page
      router.push(`/lobbies/${lobbyId}`);
    } catch (err: any) {
      console.error("Error joining lobby:", err);
      setJoinError(err.message || "Failed to join lobby");
      alert(err.message || "Failed to join lobby");
    } finally {
      setIsJoiningLobby(false);
    }
  };

  // Render content based on mode
  if (mode === "booking") {
    return (
      <>
        <div className="mb-8">
          <FacilityFilters
            onFilter={handleFacilityFilter}
            sportTypes={sportTypes}
          />
        </div>
        <FacilitiesClient
          initialFacilities={filteredFacilities}
          isFiltered={true}
        />
      </>
    );
  } else if (mode === "lobby") {
    return (
      <>
        <div className="mb-8">
          <LobbyFilters onFilter={handleLobbyFilter} sportTypes={sportTypes} />
        </div>

        {/* Only add this button if onCreateLobby exists */}
        {onCreateLobby && (
          <div className="flex justify-end mb-4">
            <Button onClick={onCreateLobby} variant="primary">
              Don't see a lobby that suits you? Make one!
            </Button>
          </div>
        )}

        <LobbyList
          lobbies={filteredLobbies}
          onJoinLobby={handleJoinLobby}
          isLoading={isJoiningLobby}
          gridLayout={true}
        />
      </>
    );
  }

  // Fallback (should never reach here with proper mode)
  return null;
}
